import { describe, expect, it } from "vitest";

import { validateToolcraftPerformanceCoverage } from "@/toolcraft/runtime";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";

describe("appSchema", () => {
  it("publishes the Gradient Wave Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({
      defaultMode: "finite",
      mode: "editable-output",
    });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toEqual({
      height: 700,
      unit: "px",
      width: 1200,
    });
    expect(appSchema.panels.controls?.sections[1]?.title).toBe("Settings");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline?.enabled).toBe(true);
    expect(appSchema.panels.timeline?.mode).toBe("playback");
    expect(appSchema.panels.timeline?.defaultDurationSeconds).toBe(6);
    expect(
      appSchema.modulePlan.capabilities.map(
        ({ capabilityId }) => capabilityId,
      ),
    ).toEqual(
      expect.arrayContaining([
        "timeline.playback",
        "artifact.image-export",
        "artifact.video-export",
      ]),
    );
  });

  it("validates product acceptance and performance coverage for Gradient Wave", () => {
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });

  it("validates performance coverage and path scenarios for Gradient Wave", () => {
    expect(
      validateToolcraftPerformanceCoverage(appSchema, appPerformance),
    ).toEqual([]);
  });

  it("declares production reload coverage for the starter schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error(
        "The product must persist user settings in localStorage.",
      );
    }
    expect(appSchema.persistence.include).toContain("canvas");
    expect(
      appAcceptance.find((entry) => entry.id === "persistence.reload"),
    ).toMatchObject({
      automated: true,
      browser: {
        budget: "extended-io",
        file: "e2e/app-persistence.spec.ts",
      },
      evidence: "persistence-state",
      kind: "runtime",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
      target: "canvas.size.width",
    });
  });
});
