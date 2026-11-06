import { expect, type Page } from "@playwright/test";

import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  dragToolcraftCanvasViewport,
  zoomToolcraftCanvasViewport,
} from "./performance-canvas-helpers";
import type {
  ToolcraftPerformanceCanvasBacking,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";
import { waitForToolcraftAnimationFrames } from "./performance-probe-helpers";
import {
  dragToolcraftSliderByLabel,
  dragToolcraftSliderToValue,
} from "./performance-slider-helpers";

export const appPerformanceCanvasBacking:
  | ToolcraftPerformanceCanvasBacking
  | undefined = undefined;

async function ensureWaveSceneReady(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
}

async function observeWaveSvgSignature(page: Page): Promise<string> {
  return page
    .getByTestId("gradient-wave-svg")
    .evaluate((element) => element.innerHTML);
}

async function setLineCountFixture(page: Page, value: unknown): Promise<void> {
  const targetCount = Number(value);
  const field = await getToolcraftControlFieldByTarget(page, "shape.lineCount");
  const numberInput = field.locator('input[type="number"]');
  if ((await numberInput.count()) > 0) {
    await numberInput.first().fill(String(targetCount));
    await numberInput.first().press("Enter");
  } else {
    await dragToolcraftSliderToValue(page, "Line Count", targetCount);
  }
  await expect(
    page.locator('[data-testid="gradient-wave-foreground-path"]'),
  ).toHaveCount(targetCount);
}

async function observeLineCountFixture(page: Page): Promise<number> {
  return page.locator('[data-testid="gradient-wave-foreground-path"]').count();
}

async function ensureTimelineScrubberVisible(page: Page): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" });
  if (!(await scrubber.isVisible())) {
    await page
      .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
      .getByRole("switch")
      .click();
    await expect(scrubber).toBeVisible();
  }
}

const canonicalPaths = deriveToolcraftPerformancePaths(
  appSchema,
  appPerformance,
);

export const appPerformancePathAdapters: readonly ToolcraftPerformancePathAdapter[] =
  canonicalPaths.map((path): ToolcraftPerformancePathAdapter => {
    const fixtureApplications = path.workloadDimensions.includes("lineCount")
      ? (page: Page) => ({
          lineCount: {
            applyValue: (value: unknown) => setLineCountFixture(page, value),
            observeValue: () => observeLineCountFixture(page),
          },
        })
      : undefined;

    switch (path.interaction) {
      case "control-change":
        return {
          action: async ({ page, phase }) => {
            const field = await getToolcraftControlFieldByTarget(
              page,
              "shape.spacingMode",
            );
            const optionName = phase === "first" ? "Regular" : "Irregular";
            await field
              .getByRole("button", { exact: true, name: optionName })
              .click();
          },
          ...(fixtureApplications ? { fixtureApplications } : {}),
          observeOutcome: ({ page }) => observeWaveSvgSignature(page),
          pathId: path.id,
          prepare: ensureWaveSceneReady,
        };
      case "control-drag":
        return {
          action: async ({ page, phase }) => {
            await dragToolcraftSliderByLabel(
              page,
              "Wave Amplitude",
              phase === "first" ? 0.82 : 0.28,
            );
          },
          ...(fixtureApplications ? { fixtureApplications } : {}),
          observeOutcome: ({ page }) => observeWaveSvgSignature(page),
          pathId: path.id,
          prepare: ensureWaveSceneReady,
        };
      case "viewport-drag":
        return {
          action: async ({ page, phase }) => {
            await dragToolcraftCanvasViewport(
              page,
              phase === "first" ? { x: 96, y: -64 } : { x: -72, y: 48 },
            );
          },
          pathId: path.id,
          prepare: ensureWaveSceneReady,
        };
      case "viewport-zoom":
        return {
          action: async ({ page, phase }) => {
            await zoomToolcraftCanvasViewport(page, {
              direction: phase === "first" ? "in" : "out",
            });
          },
          pathId: path.id,
          prepare: ensureWaveSceneReady,
        };
      case "timeline-playback":
        return {
          action: async ({ page }) => {
            await page.getByRole("button", { name: "Play playback" }).click();
            await waitForToolcraftAnimationFrames(page, 6);
            const pauseButton = page.getByRole("button", {
              name: "Pause playback",
            });
            if (await pauseButton.isVisible()) {
              await pauseButton.click();
            }
          },
          ...(fixtureApplications ? { fixtureApplications } : {}),
          observeOutcome: ({ page }) => observeWaveSvgSignature(page),
          pathId: path.id,
          prepare: async (page) => {
            await ensureWaveSceneReady(page);
            const pauseButton = page.getByRole("button", {
              name: "Pause playback",
            });
            if (await pauseButton.isVisible()) {
              await pauseButton.click();
            }
          },
        };
      case "timeline-scrub":
        return {
          action: async ({ page, phase }) => {
            const scrubber = page.getByRole("slider", {
              name: "Playback position",
            });
            await scrubber.focus();
            await scrubber.press(phase === "first" ? "ArrowRight" : "ArrowLeft");
          },
          ...(fixtureApplications ? { fixtureApplications } : {}),
          observeOutcome: ({ page }) => observeWaveSvgSignature(page),
          pathId: path.id,
          prepare: async (page) => {
            await ensureWaveSceneReady(page);
            await ensureTimelineScrubberVisible(page);
          },
        };
      case "export":
        return {
          ...(fixtureApplications ? { fixtureApplications } : {}),
          output: {
            kind: "download",
            label: "Export PNG",
            verify: async (download) => {
              expect(await download.path()).toBeTruthy();
            },
          },
          pathId: path.id,
          prepare: ensureWaveSceneReady,
        };
      default:
        throw new Error(
          `Unsupported performance path interaction: ${path.interaction}`,
        );
    }
  });
