"use client";

import * as React from "react";

import {
  evaluateToolcraftTimelineValues,
  getToolcraftFiniteArtboardRect,
  getToolcraftTimelineLoopProgress,
  type ToolcraftProductExportRenderer,
  type ToolcraftProductSceneBoundsProvider,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import {
  useToolcraftEvaluatedValues,
  useToolcraftPipeline,
  useToolcraftProductSceneFrame,
  useToolcraftSelector,
} from "@/toolcraft/runtime/react";

import {
  evaluateWaveScene,
  readWaveSettingsFromValues,
  renderWaveSceneToCanvas2D,
} from "./wave-model";
import { waveGeometryPass } from "./wave-pipeline";

const selectTimelineLoopProgress = (state: ToolcraftState): number =>
  getToolcraftTimelineLoopProgress(state.timeline);

export const waveSceneBoundsProvider: ToolcraftProductSceneBoundsProvider = ({
  state,
}) => [getToolcraftFiniteArtboardRect(state.canvas.size)];

export const waveRasterFrameRenderer: ToolcraftProductExportRenderer =
  Object.freeze({
    baseFileName: "gradient-wave",
    async renderFrame(exportContext) {
      const evaluatedValues = evaluateToolcraftTimelineValues(
        exportContext.state,
        exportContext.timeSeconds,
      );
      const settings = readWaveSettingsFromValues(evaluatedValues);
      const computeScene = () =>
        evaluateWaveScene(
          settings,
          exportContext.frame.width,
          exportContext.frame.height,
          exportContext.timelineProgress,
        );
      const scene = exportContext.rendererPipeline
        ? await exportContext.rendererPipeline.runPass(
            waveGeometryPass,
            undefined,
            computeScene,
          )
        : computeScene();

      renderWaveSceneToCanvas2D(exportContext.context, scene, {
        x: exportContext.frame.x,
        y: exportContext.frame.y,
      });
    },
  });

export function GradientWaveScene(): React.JSX.Element | null {
  const productFrame = useToolcraftProductSceneFrame();
  const values = useToolcraftEvaluatedValues();
  const phase = useToolcraftSelector(selectTimelineLoopProgress, Object.is);
  const pipeline = useToolcraftPipeline();

  const readyRect = productFrame.kind === "ready" ? productFrame.rect : null;
  const frameWidth = readyRect?.width ?? 1200;
  const frameHeight = readyRect?.height ?? 700;
  const settings = readWaveSettingsFromValues(values);
  const {
    amplitude,
    apexRounding,
    arcBreadth,
    arcHeight,
    background,
    includeBackground,
    irregularity,
    lineColor,
    lineCount,
    lineWidth,
    reliefStrength,
    spacing,
    spacingMode,
  } = settings;

  const scene = React.useMemo(
    () =>
      evaluateWaveScene(
        {
          amplitude,
          apexRounding,
          arcBreadth,
          arcHeight,
          background,
          includeBackground,
          irregularity,
          lineColor,
          lineCount,
          lineWidth,
          reliefStrength,
          spacing,
          spacingMode,
        },
        frameWidth,
        frameHeight,
        phase,
      ),
    [
      amplitude,
      apexRounding,
      arcBreadth,
      arcHeight,
      background,
      frameHeight,
      frameWidth,
      includeBackground,
      irregularity,
      lineColor,
      lineCount,
      lineWidth,
      phase,
      reliefStrength,
      spacing,
      spacingMode,
    ],
  );

  React.useLayoutEffect(() => {
    if (!pipeline) {
      return;
    }
    void pipeline.runPass(waveGeometryPass, undefined, () => scene);
  }, [pipeline, scene]);

  if (!readyRect) {
    return null;
  }

  const firstApex = scene.lines[0]?.apex;
  const peakApex = scene.lines[Math.min(3, scene.lines.length - 1)]?.apex;

  return (
    <div className="relative h-full w-full select-none">
      <svg
        aria-label="Gradient Wave composition"
        className="block h-full w-full"
        data-testid="gradient-wave-svg"
        data-toolcraft-product-output=""
        data-wave-apex-rounding={String(settings.apexRounding)}
        data-wave-background={scene.background}
        data-wave-first-apex={
          firstApex
            ? `${firstApex.x.toFixed(1)},${firstApex.y.toFixed(1)}`
            : ""
        }
        data-wave-include-background={String(scene.includeBackground)}
        data-wave-line-color={scene.lineColor}
        data-wave-line-count={String(scene.lines.length)}
        data-wave-line-width={scene.foregroundStrokeWidth.toFixed(2)}
        data-wave-peak-apex={
          peakApex ? `${peakApex.x.toFixed(1)},${peakApex.y.toFixed(1)}` : ""
        }
        data-wave-phase={scene.phase.toFixed(4)}
        data-wave-relief-opacity={scene.shadowOpacity.toFixed(3)}
        data-wave-spacing-mode={settings.spacingMode}
        height="100%"
        style={{ overflow: "visible" }}
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        width="100%"
      >
        <defs>
          <clipPath id="gradient-wave-artboard-clip">
            <rect height={scene.height} width={scene.width} x={0} y={0} />
          </clipPath>
        </defs>
        <g clipPath="url(#gradient-wave-artboard-clip)">
          <g
            data-testid="gradient-wave-shadow-group"
            fill="none"
            opacity={scene.shadowOpacity.toFixed(3)}
            stroke={scene.shadowColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={scene.shadowStrokeWidth.toFixed(2)}
            transform={`translate(${scene.shadowOffsetX.toFixed(2)} ${scene.shadowOffsetY.toFixed(2)})`}
          >
            {scene.lines.map((line) => (
              <path
                d={line.d}
                data-line-index={line.index}
                data-testid="gradient-wave-shadow-path"
                key={`shadow-${line.index}`}
              />
            ))}
          </g>
          <g
            data-testid="gradient-wave-foreground-group"
            fill="none"
            opacity={scene.foregroundOpacity.toFixed(3)}
            stroke={scene.lineColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={scene.foregroundStrokeWidth.toFixed(2)}
          >
            {scene.lines.map((line) => (
              <path
                d={line.d}
                data-line-index={line.index}
                data-testid="gradient-wave-foreground-path"
                key={`fg-${line.index}`}
              />
            ))}
          </g>
        </g>
      </svg>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-2 w-2 opacity-0"
        data-testid="gradient-wave-marker"
        data-timeline-progress={scene.phase.toFixed(4)}
        style={{
          transform: `translate3d(${scene.crestPoint.x.toFixed(2)}px, ${scene.crestPoint.y.toFixed(2)}px, 0px)`,
        }}
      />
    </div>
  );
}
