import { describe, expect, it } from "vitest";
import { resolvePublicEnvValue, scVal, stellarConfig } from "./stellar";
import * as StellarSdk from "@stellar/stellar-sdk";

describe("Stellar public configuration", () => {
  it("rejects Vercel placeholder values", () => {
    expect(resolvePublicEnvValue("[SENSITIVE]", "fallback")).toBe("fallback");
    expect(resolvePublicEnvValue(" sensitive ", "fallback")).toBe("fallback");
  });

  it("rejects invalid configured values", () => {
    expect(
      resolvePublicEnvValue(
        "not-a-url",
        "fallback",
        (value) => value.startsWith("https://"),
      ),
    ).toBe("fallback");
  });

  it("trims and keeps valid configured values", () => {
    expect(
      resolvePublicEnvValue(
        "  https://rpc.example  ",
        "fallback",
        (value) => value.startsWith("https://"),
      ),
    ).toBe("https://rpc.example");
  });

  it("always exposes valid Testnet runtime defaults", () => {
    expect(stellarConfig.rpcUrl).toBe("https://soroban-testnet.stellar.org");
    expect(stellarConfig.networkPassphrase).toBe(
      "Test SDF Network ; September 2015",
    );
    expect(stellarConfig.contractId).toMatch(/^C[A-Z2-7]{55}$/);
    expect(stellarConfig.readSource).toMatch(/^G[A-Z2-7]{55}$/);
  });

  it("encodes milestone inputs as contract-compatible structs", () => {
    const encoded = scVal.milestoneInputs([
      {
        title: "Research evidence map",
        amount: "0.025",
        ledgerOffset: "1200",
        briefHash: "ab".repeat(32),
        deadlineLedger: 5_001_200,
      },
    ]);

    expect(StellarSdk.scValToNative(encoded)).toEqual([
      {
        amount: 250000n,
        brief_hash: new Uint8Array(32).fill(0xab),
        deadline_ledger: 5_001_200,
      },
    ]);
  });
});
