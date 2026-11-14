import { describe, expect, it } from "vitest";

import { createToolcraftState, toolcraftReducer } from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";

const expectedValues = {
  "export.includeBackground": true,
  "appearance.background": "#980B0B",
  "canvas.workspaceBackground": "dots",
  "shape.lineCount": 16,
  "shape.spacing": 100,
  "shape.spacingMode": "irregular",
  "shape.irregularity": 76,
  "shape.arcHeight": 100,
  "shape.arcBreadth": 20,
  "motion.amplitude": 88,
  "appearance.style": "flute",
  "appearance.ambientIntensity": 65,
  "appearance.ambientTone": "dark",
  "appearance.grain": 24,
  "appearance.lineWidth": 17,
  "appearance.apexRounding": 41,
  "appearance.lineColor": "#FFFFFF",
  "appearance.reliefStrength": 68,
  "appearance.glassColor": "#FFFFFF",
  "appearance.glassBlur": 48,
  "export.image.format": "png",
  "export.image.resolution": "4k",
  "export.video.format": "mp4",
  "export.video.resolution": "current",
};

describe("saved Gradient Wave defaults", () => {
  it("starts with every supplied setting, canvas size, and paused timeline", () => {
    const state = createToolcraftState(appSchema);

    expect(state.values).toMatchObject(expectedValues);
    expect(state.values["canvas.aspectRatio"]).toEqual({
      height: 7, mode: "custom", value: "12:7", width: 12,
    });
    expect(state.canvas).toMatchObject({
      mode: "finite",
      size: { height: 700, unit: "px", width: 1200 },
    });
    expect(state.timeline).toMatchObject({
      currentTimeSeconds: 1.5784000000058303,
      durationSeconds: 6,
      expanded: false,
      isLooping: true,
      isPlaying: false,
    });
    expect(state.mediaAssets).toEqual([]);
  });

  it("restores the complete saved workspace on Reset", () => {
    const initial = createToolcraftState(appSchema);
    const changed = toolcraftReducer(initial, {
      type: "settings.apply",
      settings: {
        assets: [],
        canvas: {
          aspectRatio: { height: 1, mode: "preset", value: "1:1", width: 1 },
          mode: "infinite",
          size: { height: 800, unit: "px", width: 800 },
        },
        timeline: {
          currentTimeSeconds: 2,
          durationSeconds: 8,
          expanded: true,
          isLooping: false,
          isPlaying: true,
        },
        values: { "appearance.style": "classic", "appearance.background": "#000000" },
      },
    });

    expect(changed.values["appearance.style"]).toBe("classic");
    expect(changed.canvas.mode).toBe("infinite");
    expect(changed.timeline.durationSeconds).toBe(8);
    const reset = toolcraftReducer(changed, { type: "controls.reset" });
    expect(reset.values).toEqual(initial.values);
    expect(reset.canvas).toEqual(initial.canvas);
    expect(reset.timeline).toEqual(initial.timeline);
    expect(reset.mediaAssets).toEqual(initial.mediaAssets);
  });

  it("keeps explicit workspace values ahead of source defaults", () => {
    const state = createToolcraftState(appSchema, {
      values: { "appearance.style": "glass", "appearance.background": "#123456" },
      timeline: { currentTimeSeconds: 2 },
    });

    expect(state.values["appearance.style"]).toBe("glass");
    expect(state.values["appearance.background"]).toBe("#123456");
    expect(state.timeline.currentTimeSeconds).toBe(2);
  });
});
