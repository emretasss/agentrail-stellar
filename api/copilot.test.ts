import { createHash } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { containsCredential, verifyAuthorization } from "./copilot";

const prefix = "Stellar Signed Message:\n";

describe("Mission Copilot security", () => {
  it("detects private Stellar seeds and common API credentials", () => {
    expect(containsCredential(`seed S${"A".repeat(55)}`)).toBe(true);
    expect(containsCredential(`token ghp_${"a".repeat(30)}`)).toBe(true);
    expect(containsCredential("Audit the API without including credentials.")).toBe(false);
  });

  it("accepts a fresh wallet proof once and rejects replay", () => {
    const keypair = Keypair.random();
    const goal = "Verify an API and return reproducible evidence.";
    const issuedAt = Date.now();
    const goalHash = createHash("sha256").update(goal).digest("hex");
    const authorization = [
      "AgentRail Mission Copilot",
      `Wallet: ${keypair.publicKey()}`,
      `Goal SHA-256: ${goalHash}`,
      `Issued at: ${issuedAt}`,
    ].join("\n");
    const messageHash = createHash("sha256").update(prefix + authorization).digest();
    const signature = keypair.sign(messageHash).toString("base64");
    const proof = {
      walletAddress: keypair.publicKey(),
      authorization,
      signature,
      issuedAt,
      goal,
    };

    expect(verifyAuthorization(proof)).toBe(true);
    expect(verifyAuthorization(proof)).toBe(false);
  });

  it("rejects stale wallet proofs", () => {
    const keypair = Keypair.random();
    const goal = "Produce a safe and measurable mission scope.";
    const issuedAt = Date.now() - 5 * 60_000;
    const authorization = "stale";
    const signature = keypair.sign(Buffer.from("stale")).toString("base64");

    expect(
      verifyAuthorization({
        walletAddress: keypair.publicKey(),
        authorization,
        signature,
        issuedAt,
        goal,
      }),
    ).toBe(false);
  });
});
