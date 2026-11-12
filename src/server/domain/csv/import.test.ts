import { describe, expect, it } from "vitest";
import { escapeCsvCell, parseCsv } from "./import";

describe("parseCsv", () => {
  it("requires headers", () => {
    const { errors } = parseCsv("name,amount\nfoo,1");
    expect(errors.some((e) => e.field === "header")).toBe(true);
  });

  it("parses valid rows", () => {
    const { rows, errors } = parseCsv("phone,cod_amount\n03001234567,1500");
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].cod_amount).toBe(1500);
  });
});

describe("escapeCsvCell", () => {
  it("prefixes formula injection", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
  });
});
