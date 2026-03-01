// src/__tests__/cities.test.ts
// Smoke test — Scenario 5 (city disclaimer for non-Philadelphia cities)

import { describe, it, expect } from "vitest";
import { isPhiladelphia } from "../config/cities";

describe("isPhiladelphia", () => {
  // Canonical name and aliases must all be accepted
  it("returns true for 'Philadelphia' (exact name)", () => {
    expect(isPhiladelphia("Philadelphia")).toBe(true);
  });

  it("returns true for 'philadelphia' (lowercase)", () => {
    expect(isPhiladelphia("philadelphia")).toBe(true);
  });

  it("returns true for 'PHILADELPHIA' (uppercase)", () => {
    expect(isPhiladelphia("PHILADELPHIA")).toBe(true);
  });

  it("returns true for all known aliases: philly, phila, phl", () => {
    expect(isPhiladelphia("philly")).toBe(true);
    expect(isPhiladelphia("phila")).toBe(true);
    expect(isPhiladelphia("phl")).toBe(true);
  });

  it("returns true for aliases with surrounding whitespace", () => {
    expect(isPhiladelphia("  philly  ")).toBe(true);
  });

  // Scenario 5: non-Philadelphia cities must NOT match — this drives the disclaimer
  it("returns false for 'Chicago'", () => {
    expect(isPhiladelphia("Chicago")).toBe(false);
  });

  it("returns false for 'New York City'", () => {
    expect(isPhiladelphia("New York City")).toBe(false);
  });

  it("returns false for 'Cincinnati'", () => {
    expect(isPhiladelphia("Cincinnati")).toBe(false);
  });

  it("returns false for 'nyc'", () => {
    expect(isPhiladelphia("nyc")).toBe(false);
  });

  it("returns false for 'cincy'", () => {
    expect(isPhiladelphia("cincy")).toBe(false);
  });

  // Undefined / empty → treated as Philadelphia (the default, no disclaimer needed)
  it("returns true for undefined", () => {
    expect(isPhiladelphia(undefined)).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isPhiladelphia("")).toBe(true);
  });
});
