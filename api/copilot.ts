import OpenAI from "openai";

const requestWindow = new Map<string, { count: number; resetAt: number }>();

const missionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
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

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "Mission Copilot is not configured on this deployment." },
      { status: 503 },
    );
  }

  try {
    const client =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      instructions:
        "You are AgentRail Mission Copilot. Convert an AI-agent work request into a precise, escrow-ready scope. Be concrete, measurable, and conservative about budget. Never claim work has already happened. Deadline is measured in Stellar ledgers at roughly five seconds each.",
      input: goal,
      reasoning: { effort: "low" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "agentrail_mission",
          strict: true,
          schema: missionSchema,
        },
      },
      max_output_tokens: 1200,
    });

    return Response.json(JSON.parse(response.output_text), {
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
