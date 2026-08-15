const requestWindow = new Map<string, { count: number; resetAt: number }>();

const missionSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "A concise mission title." },
    summary: { type: "string", description: "A precise summary of the requested work." },
    deliverables: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    acceptanceCriteria: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: { type: "string" },
    },
    risks: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" },
    },
    recommendedBudgetXlm: { type: "number", minimum: 0.01, maximum: 1000 },
    deadlineLedgers: { type: "integer", minimum: 100, maximum: 120960 },
  },
  required: [
    "title",
    "summary",
    "deliverables",
    "acceptanceCriteria",
    "risks",
    "recommendedBudgetXlm",
    "deadlineLedgers",
  ],
} as const;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

type MissionPlan = {
  title: string;
  summary: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  risks: string[];
  recommendedBudgetXlm: number;
  deadlineLedgers: number;
};

function isStringArray(value: unknown, minimum: number, maximum: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= minimum &&
    value.length <= maximum &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateMissionPlan(value: unknown): MissionPlan {
  if (!value || typeof value !== "object") throw new Error("Gemini returned an invalid mission.");
  const plan = value as Record<string, unknown>;
  if (
    typeof plan.title !== "string" ||
    typeof plan.summary !== "string" ||
    !isStringArray(plan.deliverables, 2, 5) ||
    !isStringArray(plan.acceptanceCriteria, 2, 5) ||
    !isStringArray(plan.risks, 1, 4) ||
    typeof plan.recommendedBudgetXlm !== "number" ||
    plan.recommendedBudgetXlm < 0.01 ||
    plan.recommendedBudgetXlm > 1000 ||
    !Number.isInteger(plan.deadlineLedgers) ||
    (plan.deadlineLedgers as number) < 100 ||
    (plan.deadlineLedgers as number) > 120960
  ) {
    throw new Error("Gemini returned a mission outside the accepted schema.");
  }
  return plan as MissionPlan;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Mission Copilot is not configured on this deployment." },
      { status: 503 },
    );
  }

  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const current = requestWindow.get(client);
    if (current && current.resetAt > now && current.count >= 8) {
      return Response.json(
        { error: "Too many Copilot requests. Try again in a few minutes." },
        { status: 429 },
      );
    }
    requestWindow.set(client, {
      count: current && current.resetAt > now ? current.count + 1 : 1,
      resetAt: current && current.resetAt > now ? current.resetAt : now + 10 * 60_000,
    });

    const body = (await request.json()) as { goal?: unknown };
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    if (goal.length < 20 || goal.length > 2000) {
      return Response.json(
        { error: "Describe the mission in 20–2,000 characters." },
        { status: 400 },
      );
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are AgentRail Mission Copilot. Convert an AI-agent work request into a precise, escrow-ready scope. Be concrete, measurable, and conservative about budget. Never claim work has already happened. Deadline is measured in Stellar ledgers at roughly five seconds each.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: goal }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
            responseSchema: missionSchema,
          },
        }),
        signal: AbortSignal.timeout(25_000),
      },
    );

    const payload = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      console.error("Gemini API error", response.status, payload.error?.message);
      const status = response.status === 429 ? 429 : 502;
      return Response.json(
        {
          error:
            status === 429
              ? "Gemini free-tier limit reached. Try again shortly."
              : "Gemini could not generate a mission right now.",
        },
        { status },
      );
    }

    const outputText = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("");
    if (!outputText) throw new Error("Gemini returned an empty response.");

    return Response.json(validateMissionPlan(JSON.parse(outputText)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Mission Copilot failed", error);
    return Response.json(
      { error: "Mission Copilot could not generate a brief. Try again." },
      { status: 500 },
    );
  }
}
