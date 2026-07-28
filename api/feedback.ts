type FeedbackPayload = {
  id: string;
  wallet: string;
  score: number;
  role: "buyer" | "agent" | "explorer";
  message: string;
  createdAt: string;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const body = (await request.json()) as Partial<FeedbackPayload>;
    const validRole = ["buyer", "agent", "explorer"].includes(body.role ?? "");
    if (
      typeof body.id !== "string" ||
      typeof body.wallet !== "string" ||
      typeof body.score !== "number" ||
      body.score < 1 ||
      body.score > 5 ||
      !validRole ||
      typeof body.message !== "string" ||
      body.message.trim().length < 5 ||
      body.message.length > 600 ||
      typeof body.createdAt !== "string"
    ) {
      return Response.json({ error: "Invalid feedback payload." }, { status: 400 });
    }

    if (!process.env.FEEDBACK_WEBHOOK_URL) {
      return Response.json(
        { accepted: true, forwarded: false },
        { status: 202, headers: { "Cache-Control": "no-store" } },
      );
    }

    const forwarded = await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: "AgentRail",
        network: "stellar:testnet",
        ...body,
      }),
    });
    if (!forwarded.ok) {
      throw new Error(`Feedback destination returned ${forwarded.status}.`);
    }

    return Response.json(
      { accepted: true, forwarded: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Feedback forwarding failed", error);
    return Response.json(
      { error: "Feedback could not be forwarded." },
      { status: 502 },
    );
  }
}
