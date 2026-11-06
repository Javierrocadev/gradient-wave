import {
  defineToolcraftFixtureAdapter,
  defineToolcraftPerformance,
  defineToolcraftSchemaDiscreteFixtureAdapter,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
  type ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { waveRendererPipeline } from "./wave-pipeline";

const baseConfig = {
  fixtureAdapters: {
    dimensions: {
      imageResolution: defineToolcraftSchemaDiscreteFixtureAdapter(appSchema, {
        dimensionId: "imageResolution",
        entries: [
          { appliedValue: "2k", value: 2 },
          { appliedValue: "4k", value: 4 },
          { appliedValue: "8k", value: 8 },
        ],
        target: "export.image.resolution",
      }),
      lineCount: defineToolcraftFixtureAdapter<number>({
        apply(value) {
          return Math.round(value);
        },
        dimensionId: "lineCount",
        observe(value) {
          return value;
        },
      }),
    },
  },
  rendererPipeline: waveRendererPipeline,
  rendererStrategy: "svg",
  rendererTechnique: {
    exportRenderer: "canvas-2d",
    fidelityRisks: [
      "Canvas 2D raster export must reproduce the exact quadratic Bezier apex rounding, shadow offset, and stroke opacity rendered by the SVG preview.",
    ],
    layers: [
      {
        content: ["geometry"],
        exportMode: "included",
        id: "wave-svg-layer",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "svg",
        uiSelector: '[data-testid="gradient-wave-svg"]',
      },
    ],
    performanceRisks: [
      "Rebuilding SVG path strings on every timeline frame scales linearly with lineCount up to 26 paths per foreground and shadow group.",
    ],
    previewExportDifferenceReason:
      "Interactive preview renders crisp resolution-independent SVG paths while PNG, JPG, MP4, and WebM exports rasterize identical procedural wave geometry onto a 2D canvas.",
    previewRenderer: "svg",
    productRepresentation: "vector",
    rendererStrategy: "svg",
    sourceRepresentation: "procedural-data",
    whyNotAlternativeStrategies: [
      "DOM divs cannot express quadratic Bezier apex joins and dual relief strokes cleanly, while WebGL or WebGPU add unnecessary shader pipeline overhead for 5 to 26 vector paths.",
    ],
  },
  usesCustomRenderer: true,
  workloadEnvelope: {
    dimensions: [
      {
        batchMax: 26,
        defaultValue: 16,
        id: "lineCount",
        interactiveMax: 26,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "shape.lineCount",
          workloadBoundary: "maximum",
        },
        unit: "lines",
      },
      {
        batchMax: 8,
        defaultValue: 4,
        id: "imageResolution",
        interactiveMax: 8,
        mapping: "direct",
        source: {
          kind: "schema-target",
          target: "export.image.resolution",
        },
        unit: "k",
      },
    ],
  },
} as const satisfies Omit<ToolcraftEnvelopePerformanceConfig, "scenarios">;

const derivedPaths = deriveToolcraftPerformancePaths(appSchema, {
  ...baseConfig,
  scenarios: [],
});

const scenarios: readonly ToolcraftPerformanceScenario[] = derivedPaths.map(
  (path): ToolcraftPerformanceScenario => {
    const automatedTestName =
      "validates performance coverage and path scenarios for Gradient Wave";
    const browserTestName = `browser perf: toolcraft path ${path.id}`;

    switch (path.interaction) {
      case "control-change":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          controlLabel: "Spacing Rhythm",
          coversTargets: path.targets,
          expectedObservable:
            "Changing wave shape, relief, or background controls updates the SVG wave geometry within the interactive frame budget.",
          fixture: "23-line procedural relief wave at development pressure",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "shape.spacingMode",
          uiSelector: '[data-testid="gradient-wave-svg"]',
        };
      case "control-drag":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          controlLabel: "Wave Amplitude",
          coversTargets: path.targets,
          expectedObservable:
            "Dragging continuous wave sliders recomputes SVG path geometry smoothly at interactive frame rates.",
          fixture: "23-line procedural relief wave at development pressure",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "motion.amplitude",
          uiSelector: '[data-testid="gradient-wave-svg"]',
        };
      case "viewport-drag":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          coversTargets: path.targets,
          expectedObservable:
            "Panning the canvas viewport translates the artboard without recomputing wave geometry.",
          fixture: "16-line default procedural relief wave",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "canvas.viewport.x",
          uiSelector: '[data-slot="toolcraft-canvas-viewport"]',
        };
      case "viewport-zoom":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          coversTargets: path.targets,
          expectedObservable:
            "Zooming the canvas viewport scales the artboard without recomputing wave geometry.",
          fixture: "16-line default procedural relief wave",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "canvas.viewport.zoom",
          uiSelector: '[data-slot="toolcraft-canvas-viewport"]',
        };
      case "timeline-playback":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          coversTargets: path.targets,
          expectedObservable:
            "Playing the timeline advances the traveling wave phase smoothly across the line sequence.",
          fixture: "23-line procedural relief wave at development pressure",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "timeline.playing",
          uiSelector: '[aria-label="Play playback"], [aria-label="Pause playback"]',
        };
      case "timeline-scrub":
        return {
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          coversTargets: path.targets,
          expectedObservable:
            "Scrubbing the timeline playhead updates the traveling wave phase and apex positions immediately.",
          fixture: "23-line procedural relief wave at development pressure",
          id: `perf.${path.interaction}`,
          interaction: path.interaction,
          pathId: path.id,
          target: "timeline.currentTimeSeconds",
          uiSelector: '[data-testid="toolcraft-timeline-track"]',
        };
      case "export":
        return {
          actionValue: "export.png",
          automated: true,
          automatedTestName,
          browser: true,
          browserTestName,
          completionEvidence: "download",
          controlLabel: "Export PNG",
          coversTargets: path.targets,
          expectedObservable:
            "Exporting an image rasterizes the procedural relief wave composition within the batch deadline.",
          fixture: "23-line procedural relief wave at development pressure",
          id: `perf.${path.interaction}`,
          interaction: "export",
          pathId: path.id,
          target: "actions.output",
        };
      default:
        throw new Error(`Unsupported performance path interaction: ${path.interaction}`);
    }
  },
);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...baseConfig,
    scenarios,
  });
