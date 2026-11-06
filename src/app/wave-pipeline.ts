import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { WaveSceneGeometry } from "./wave-model";

export type WavePipelinePassContracts = {
  "wave-geometry": ToolcraftRendererPipelinePassContract<WaveSceneGeometry>;
};

export const waveControlTargets = [
  "appearance.apexRounding",
  "appearance.background",
  "appearance.lineColor",
  "appearance.lineWidth",
  "appearance.reliefStrength",
  "canvas.aspectRatio",
  "canvas.size.height",
  "canvas.size.width",
  "export.includeBackground",
  "motion.amplitude",
  "shape.arcBreadth",
  "shape.arcHeight",
  "shape.irregularity",
  "shape.lineCount",
  "shape.spacing",
  "shape.spacingMode",
] as const;

export const waveSliderDragTargets = [
  "appearance.apexRounding",
  "appearance.lineWidth",
  "appearance.reliefStrength",
  "motion.amplitude",
  "shape.arcBreadth",
  "shape.arcHeight",
  "shape.irregularity",
  "shape.lineCount",
  "shape.spacing",
] as const;

export const waveRendererPipeline =
  registerToolcraftRendererPipeline<WavePipelinePassContracts>()({
    interactionInvalidation: [
      {
        interaction: "control-change",
        invalidates: ["wave-geometry"],
        mustNotInvalidate: [],
        targets: [...waveControlTargets],
      },
      {
        interaction: "control-drag",
        invalidates: ["wave-geometry"],
        mustNotInvalidate: [],
        targets: [...waveSliderDragTargets],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: ["wave-geometry"],
        targets: ["canvas.viewport.x", "canvas.viewport.y"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: ["wave-geometry"],
        targets: ["canvas.viewport.zoom"],
      },
      {
        interaction: "timeline-playback",
        invalidates: ["wave-geometry"],
        mustNotInvalidate: [],
        targets: ["timeline.currentTimeSeconds", "timeline.playing"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: ["wave-geometry"],
        mustNotInvalidate: [],
        targets: ["timeline.currentTimeSeconds"],
      },
      {
        interaction: "export",
        invalidates: ["wave-geometry"],
        mustNotInvalidate: [],
        targets: ["actions.output"],
      },
    ],
    passes: [
      {
        cost: {
          dimensions: ["lineCount"],
          frequency: "frame",
          relationship: "linear",
        },
        id: "wave-geometry",
        inputs: [...waveControlTargets, "timeline.currentTimeSeconds"],
        invalidatedBy: [...waveControlTargets, "timeline.currentTimeSeconds"],
        kind: "vector-build",
        lifecycle: {
          cache: "none",
          resourceScope: "call",
        },
        output: "preview",
        quality: "full",
        runsOn: "main",
        sceneBounds: {
          kind: "intrinsic",
          reason:
            "Procedural relief wave lines are synthesized directly across the active artboard frame.",
        },
      },
    ],
    runtimeId: "gradient-wave.svg-pipeline",
  });

export const waveGeometryPass = waveRendererPipeline.getPass("wave-geometry");
