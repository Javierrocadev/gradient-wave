import { expect, type Download, type Locator, type Page } from "@playwright/test";

import { getToolcraftFiniteArtboardRect } from "@/toolcraft/runtime";

import {
  DEFAULT_WAVE_SETTINGS,
  evaluateWaveScene,
} from "../src/app/wave-model";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import type {
  ToolcraftBackgroundImageInspection,
  ToolcraftBackgroundPreviewObservation,
  ToolcraftBackgroundVideoInspection,
} from "./browser-background-output-evidence";
import {
  getToolcraftRgbaDistance,
  observeToolcraftDecodedPixels,
  TOOLCRAFT_BACKGROUND_PIXEL_DISTANCE_THRESHOLD,
  type ToolcraftExpectedDecodedPixel,
  type ToolcraftExpectedDecodedVideoSample,
} from "./decoded-pixel-observation";
import type { ToolcraftNormalizedPixelBounds } from "./export-artifact-helpers";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import {
  inspectToolcraftVideoDownload,
  type ToolcraftScheduledVideoFrame,
} from "./video-artifact-inspection";

const VIDEO_EXPORT_FPS = 30;

export function createWaveVideoFrameSchedule(
  durationSeconds: number,
): readonly ToolcraftScheduledVideoFrame[] {
  const rawFrameCount = durationSeconds * VIDEO_EXPORT_FPS;
  const nearestFrameCount = Math.round(rawFrameCount);
  const frameCount =
    Math.abs(rawFrameCount - nearestFrameCount) <= 1e-9
      ? nearestFrameCount
      : Math.ceil(rawFrameCount);

  return Object.freeze(
    Array.from({ length: frameCount }, (_, index) => {
      const timeSeconds = index / VIDEO_EXPORT_FPS;
      const endSeconds = Math.min(
        durationSeconds,
        (index + 1) / VIDEO_EXPORT_FPS,
      );
      return Object.freeze({
        durationSeconds: endSeconds - timeSeconds,
        index,
        timeSeconds,
      });
    }),
  );
}

export const DEFAULT_BACKGROUND_RGBA: readonly [number, number, number, number] =
  [7, 134, 255, 255];
export const TRANSPARENT_BACKGROUND_RGBA: readonly [
  number,
  number,
  number,
  number,
] = [0, 0, 0, 0];

export const FINITE_ARTBOARD_SIZE = Object.freeze({
  height: appSchema.canvas.size.height,
  width: appSchema.canvas.size.width,
});

export const FINITE_SCENE_RECT = Object.freeze(
  getToolcraftFiniteArtboardRect(FINITE_ARTBOARD_SIZE),
);

export async function pauseTimelineAndSetDuration(
  page: Page,
  durationText: string,
): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  if (!(await scrubber.isVisible())) {
    await page
      .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
      .getByRole("switch")
      .click();
    await expect(scrubber).toBeVisible();
  }
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
  }
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const durationEditor = page.getByRole("textbox", {
    name: "timeline duration",
  });
  await durationEditor.fill(durationText);
  await durationEditor.press("Enter");
  await scrubber.press("Home");
  await page.mouse.move(1, 1);
  if (await pause.isVisible()) {
    await pause.click();
  }
  await expect(page.getByRole("button", { name: "Play playback" })).toBeVisible();
  await scrubber.press("Home");
  await expect(scrubber).toHaveAttribute("aria-valuenow", "0");
}

export async function commitSliderControlValue(
  control: Locator,
  page: Page,
  nextValueText: string,
): Promise<void> {
  await control.getByRole("button", { name: /^Edit .* value$/u }).click();
  const input = control.locator("input");
  await expect(input).toBeVisible();
  await input.fill(nextValueText);
  await input.press("Enter");
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
}

export async function commitColorControlHex(
  control: Locator,
  nextHexWithoutHash: string,
): Promise<void> {
  const input = control.locator("input");
  await expect(input).toBeVisible();
  await input.fill(nextHexWithoutHash);
  await input.press("Enter");
}

export async function selectControlOptionByTarget(
  page: Page,
  target: string,
  optionLabel: string,
): Promise<void> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  await field.getByRole("combobox").click();
  await page.getByRole("option", { exact: true, name: optionLabel }).click();
}

export async function triggerFooterExportDownload(
  page: Page,
  buttonLabel: string,
): Promise<Download> {
  const downloadPromise = page.waitForEvent("download");
  await page
    .locator('[data-toolcraft-control-target="actions.output"]')
    .getByRole("button", { exact: true, name: buttonLabel })
    .click();
  return downloadPromise;
}

export function observeWaveBackgroundPreview(
  root: HTMLElement,
): ToolcraftBackgroundPreviewObservation {
  const backgroundLayer = root.querySelector<HTMLElement>(
    "[data-toolcraft-finite-background-layer]",
  );
  const svg = root.querySelector<SVGSVGElement>(
    '[data-testid="gradient-wave-svg"]',
  );
  const backgroundVisible = Boolean(backgroundLayer);
  const includeAttr = svg?.getAttribute("data-wave-include-background") ?? "";
  const backgroundColor =
    backgroundLayer?.style.backgroundColor ?? "transparent";
  return {
    backgroundVisible,
    outputSignature: `bg:${backgroundVisible}:${includeAttr}:${backgroundColor}`,
  };
}

export async function inspectBackgroundExcludedImage(
  page: Page,
  download: Download,
): Promise<ToolcraftBackgroundImageInspection> {
  const inspected = await inspectToolcraftImageDownload({
    backgroundRgba: TRANSPARENT_BACKGROUND_RGBA,
    download,
    page,
  });
  return {
    backgroundAlpha: inspected.observation.normalizedPixels[3] ?? 255,
    byteLength: inspected.inspection.byteLength,
    height: inspected.inspection.height,
    mediaType: inspected.inspection.mediaType,
    width: inspected.inspection.width,
  };
}

export async function inspectBackgroundPreservedVideo(
  page: Page,
  download: Download,
  durationSeconds: number,
): Promise<ToolcraftBackgroundVideoInspection> {
  const schedule = createWaveVideoFrameSchedule(durationSeconds);
  const inspected = await inspectToolcraftVideoDownload({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    download,
    page,
    schedule,
  });
  const firstFramePixels = inspected.observations[0]?.normalizedPixels;
  const cornerPixel = firstFramePixels
    ? [
        firstFramePixels[0] ?? 0,
        firstFramePixels[1] ?? 0,
        firstFramePixels[2] ?? 0,
        firstFramePixels[3] ?? 0,
      ]
    : [0, 0, 0, 0];
  const cornerMatchesBackground =
    getToolcraftRgbaDistance(cornerPixel, DEFAULT_BACKGROUND_RGBA) <= 48;

  return {
    backgroundIncluded: cornerMatchesBackground,
    byteLength: inspected.inspection.byteLength,
    durationMs: inspected.inspection.durationMs,
    mediaType: inspected.inspection.mediaType,
  };
}

export async function computeExpectedWaveFrameExpectations(
  page: Page,
  options: Readonly<{
    height: number;
    phase: number;
    smoothing?: boolean;
    width: number;
  }>,
): Promise<
  Readonly<{
    bounds: ToolcraftNormalizedPixelBounds;
    pixels: readonly ToolcraftExpectedDecodedPixel[];
  }>
> {
  const scene = evaluateWaveScene(
    DEFAULT_WAVE_SETTINGS,
    FINITE_ARTBOARD_SIZE.width,
    FINITE_ARTBOARD_SIZE.height,
    options.phase,
  );
  const rawPixels = await page.evaluate(
    ({ outputHeight, outputWidth, serializedScene, smoothing }) => {
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        throw new Error("Could not create 2D context for expected wave frame.");
      }
      ctx.fillStyle = serializedScene.background;
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const scaleX = outputWidth / serializedScene.width;
      const scaleY = outputHeight / serializedScene.height;
      ctx.save();
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      ctx.beginPath();
      ctx.rect(0, 0, serializedScene.width, serializedScene.height);
      ctx.clip();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const strokeLines = (offsetX: number, offsetY: number) => {
        for (const line of serializedScene.lines) {
          ctx.beginPath();
          ctx.moveTo(line.top.x + offsetX, line.top.y + offsetY);
          ctx.lineTo(line.entry.x + offsetX, line.entry.y + offsetY);
          ctx.quadraticCurveTo(
            line.apex.x + offsetX,
            line.apex.y + offsetY,
            line.exit.x + offsetX,
            line.exit.y + offsetY,
          );
          ctx.lineTo(line.bottom.x + offsetX, line.bottom.y + offsetY);
          ctx.stroke();
        }
      };

      if (serializedScene.shadowOpacity > 0.005) {
        ctx.save();
        ctx.globalAlpha = serializedScene.shadowOpacity;
        ctx.strokeStyle = serializedScene.shadowColor;
        ctx.lineWidth = serializedScene.shadowStrokeWidth;
        strokeLines(serializedScene.shadowOffsetX, serializedScene.shadowOffsetY);
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = serializedScene.foregroundOpacity;
      ctx.strokeStyle = serializedScene.lineColor;
      ctx.lineWidth = serializedScene.foregroundStrokeWidth;
      strokeLines(0, 0);
      ctx.restore();
      ctx.restore();

      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = 64;
      sampleCanvas.height = 64;
      const sampleCtx = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sampleCtx) {
        throw new Error("Could not create 64x64 sample context.");
      }
      sampleCtx.imageSmoothingEnabled = smoothing;
      sampleCtx.drawImage(canvas, 0, 0, 64, 64);
      return Array.from(sampleCtx.getImageData(0, 0, 64, 64).data);
    },
    {
      outputHeight: options.height,
      outputWidth: options.width,
      serializedScene: scene,
      smoothing: options.smoothing ?? false,
    },
  );

  const observation = await observeToolcraftDecodedPixels({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    pixels: Uint8ClampedArray.from(rawPixels),
    sourceHeight: 64,
    sourceWidth: 64,
  });
  if (!observation.nonBackgroundBounds) {
    throw new Error("Expected wave frame must contain non-background pixels.");
  }

  let bestScore = -Infinity;
  let productPixel: ToolcraftExpectedDecodedPixel | null = null;
  for (let y = 8; y < 56; y += 1) {
    for (let x = 8; x < 56; x += 1) {
      const offset = (y * 64 + x) * 4;
      const rgba: readonly [number, number, number, number] = [
        observation.normalizedPixels[offset]!,
        observation.normalizedPixels[offset + 1]!,
        observation.normalizedPixels[offset + 2]!,
        observation.normalizedPixels[offset + 3]!,
      ];
      const distance = getToolcraftRgbaDistance(rgba, DEFAULT_BACKGROUND_RGBA);
      if (distance <= TOOLCRAFT_BACKGROUND_PIXEL_DISTANCE_THRESHOLD + 24) {
        continue;
      }
      let maxNeighborDelta = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nOffset = ((y + dy) * 64 + (x + dx)) * 4;
          const nRgba = observation.normalizedPixels.subarray(
            nOffset,
            nOffset + 4,
          );
          maxNeighborDelta = Math.max(
            maxNeighborDelta,
            getToolcraftRgbaDistance(rgba, nRgba),
          );
        }
      }
      const score = distance - maxNeighborDelta * 1.5;
      if (score > bestScore) {
        bestScore = score;
        productPixel = {
          rgba,
          xRatio: (x + 0.5) / 64,
          yRatio: (y + 0.5) / 64,
        };
      }
    }
  }
  if (!productPixel) {
    throw new Error("Could not locate a foreground wave pixel in sample grid.");
  }

  const cornerRgba: readonly [number, number, number, number] = [
    observation.normalizedPixels[0]!,
    observation.normalizedPixels[1]!,
    observation.normalizedPixels[2]!,
    observation.normalizedPixels[3]!,
  ];

  return {
    bounds: observation.nonBackgroundBounds,
    pixels: [
      { rgba: cornerRgba, xRatio: 0.5 / 64, yRatio: 0.5 / 64 },
      productPixel,
    ],
  };
}

export async function computeExpectedWaveVideoSamples(
  page: Page,
  options: Readonly<{
    durationSeconds: number;
    height: number;
    width: number;
  }>,
): Promise<readonly ToolcraftExpectedDecodedVideoSample[]> {
  const schedule = createWaveVideoFrameSchedule(options.durationSeconds);
  const sampleIndices = [
    ...new Set([0, Math.floor(schedule.length / 2), schedule.length - 1]),
  ];
  const samples: ToolcraftExpectedDecodedVideoSample[] = [];
  for (const index of sampleIndices) {
    const entry = schedule[index]!;
    const phase =
      options.durationSeconds > 0
        ? (entry.timeSeconds / options.durationSeconds) % 1
        : 0;
    const expectedFrame = await computeExpectedWaveFrameExpectations(page, {
      height: options.height,
      phase,
      smoothing: true,
      width: options.width,
    });
    samples.push({
      pixels: expectedFrame.pixels,
      timeSeconds: entry.timeSeconds,
    });
  }
  return samples;
}
