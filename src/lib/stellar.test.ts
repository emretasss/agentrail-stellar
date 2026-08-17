import { describe, expect, it } from "vitest";
import { resolvePublicEnvValue, stellarConfig } from "./stellar";

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
});
