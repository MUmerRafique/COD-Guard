import { describe, expect, it } from "vitest";
import { isValidPakistanPhone, normalizePakistanPhone } from "./phone";

describe("normalizePakistanPhone", () => {
  it("normalizes 03xx format", () => {
    expect(normalizePakistanPhone("03001234567")).toBe("923001234567");
  });

  it("accepts 92 format", () => {
    expect(normalizePakistanPhone("923001234567")).toBe("923001234567");
  });

  it("rejects invalid", () => {
    expect(normalizePakistanPhone("123")).toBeNull();
    expect(isValidPakistanPhone("123")).toBe(false);
  });
});
