import type { Page } from "@playwright/test";

import {
  getToolcraftImageExportSize,
  getToolcraftVideoExportSize,
} from "@/toolcraft/runtime";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasImageExportEvidence,
  expectToolcraftInfinityCanvasModeEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
  type InfinityCanvasObservation,
  type InfinityCanvasTransitionContinuity,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftStandardTimelinePlayback } from "./browser-standard-timeline-evidence";
import { inspectToolcraftImageDownload } from "./image-artifact-inspection";
import { dragToolcraftCanvasViewport } from "./performance-canvas-helpers";
import { expect, test } from "./toolcraft-product-test";
import { inspectToolcraftVideoDownload } from "./video-artifact-inspection";
import {
  createWaveVideoFrameSchedule,
  DEFAULT_BACKGROUND_RGBA,
  FINITE_ARTBOARD_SIZE,
  FINITE_SCENE_RECT,
  pauseTimelineAndSetDuration,
  selectControlOptionByTarget,
  triggerFooterExportDownload,
} from "./wave-browser-test-helpers";

async function captureProductDomIdentity(page: Page) {
  return page.evaluateHandle(() => ({
    host: document.querySelector("[data-toolcraft-product-scene]"),
    output: document.querySelector(
      "[data-toolcraft-product-output], [data-toolcraft-product-scene] svg",
    ),
  }));
}

async function compareProductDomIdentity(
  page: Page,
  identity: Awaited<ReturnType<typeof captureProductDomIdentity>>,
): Promise<InfinityCanvasTransitionContinuity> {
  return page.evaluate(
    (baseline) => ({
      productHostPreserved:
        baseline.host !== null &&
        baseline.host ===
          document.querySelector("[data-toolcraft-product-scene]"),
      productOutputPreserved:
        baseline.output !== null &&
        baseline.output ===
          document.querySelector(
            "[data-toolcraft-product-output], [data-toolcraft-product-scene] svg",
          ),
    }),
    identity,
  );
}

async function collectInfinityCanvasContinuitySequence(page: Page): Promise<{
  observations: {
    afterPan: InfinityCanvasObservation;
    afterReload: InfinityCanvasObservation;
    before: InfinityCanvasObservation;
    enabled: InfinityCanvasObservation;
    redone: InfinityCanvasObservation;
    restored: InfinityCanvasObservation;
    undone: InfinityCanvasObservation;
  };
  transitions: {
    afterReloadToRestored: InfinityCanvasTransitionContinuity;
    beforeToEnabled: InfinityCanvasTransitionContinuity;
    restoredToUndone: InfinityCanvasTransitionContinuity;
    undoneToRedone: InfinityCanvasTransitionContinuity;
  };
}> {
  await pauseTimelineAndSetDuration(page, "1s");
  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success");
  const before = await observeInfinityCanvas(page);
  const initialIdentity = await captureProductDomIdentity(page);

  const infinityField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await infinityField.getByRole("switch").click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  const enabled = await observeInfinityCanvas(page);
  const beforeToEnabled = await compareProductDomIdentity(
    page,
    initialIdentity,
  );

  await dragToolcraftCanvasViewport(page, { x: 72, y: -48 });
  await expect(
    page.locator('[data-slot="toolcraft-runtime-app"]'),
  ).toHaveAttribute("data-toolcraft-persistence-status", "success");
  const afterPan = await observeInfinityCanvas(page);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  const pauseAfterReload = page.getByRole("button", { name: "Pause playback" });
  if (await pauseAfterReload.isVisible()) {
    await pauseAfterReload.click();
  }
  const scrubberAfterReload = page.getByRole("slider", {
    name: "Playback position",
  });
  await scrubberAfterReload.press("Home");
  await page.mouse.move(1, 1);
  if (await pauseAfterReload.isVisible()) {
    await pauseAfterReload.click();
  }
  await scrubberAfterReload.press("Home");
  await expect(scrubberAfterReload).toHaveAttribute("aria-valuenow", "0");
  const afterReload = await observeInfinityCanvas(page);
  const restoredIdentity = await captureProductDomIdentity(page);

  const restoredInfinityField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await restoredInfinityField.getByRole("switch").click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "finite",
  );
  const restored = await observeInfinityCanvas(page);
  const afterReloadToRestored = await compareProductDomIdentity(
    page,
    restoredIdentity,
  );

  await page.getByRole("button", { exact: true, name: "Undo" }).click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  const undone = await observeInfinityCanvas(page);
  const restoredToUndone = await compareProductDomIdentity(
    page,
    restoredIdentity,
  );

  await page.getByRole("button", { exact: true, name: "Redo" }).click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "finite",
  );
  const redone = await observeInfinityCanvas(page);
  const undoneToRedone = await compareProductDomIdentity(
    page,
    restoredIdentity,
  );

  await initialIdentity.dispose();
  await restoredIdentity.dispose();

  return {
    observations: {
      afterPan,
      afterReload,
      before,
      enabled,
      redone,
      restored,
      undone,
    },
    transitions: {
      afterReloadToRestored,
      beforeToEnabled,
      restoredToUndone,
      undoneToRedone,
    },
  };
}

test("browser: timeline playback, scrub, duration, and forward loop drive the traveling wave seamlessly", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  const session = await createToolcraftBrowserProofSession(page);

  await expectToolcraftStandardTimelinePlayback(session, {
    markerSelector: '[data-testid="gradient-wave-marker"]',
    requirementId: "runtime.timeline.playback",
  });
});

test("browser: infinity canvas preserves world continuity and restores finite dimensions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await createToolcraftBrowserProofSession(page);

  const sequence = await collectInfinityCanvasContinuitySequence(page);
  await expectToolcraftInfinityCanvasModeEvidence(
    sequence.observations,
    sequence.transitions,
    {
      expectedFiniteSize: FINITE_ARTBOARD_SIZE,
      expectedSceneRect: FINITE_SCENE_RECT,
      requirementId: "runtime.infinity.continuity",
      target: "canvas.infinity",
    },
  );
});

test("browser: infinity canvas exports scene-bounds PNG and video", async ({
  page,
}) => {
  await page.goto("/");
  await createToolcraftBrowserProofSession(page);
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await pauseTimelineAndSetDuration(page, "1s");
  await selectControlOptionByTarget(page, "export.image.resolution", "2K");
  await selectControlOptionByTarget(page, "export.video.format", "WebM");

  const expectedImageSize = getToolcraftImageExportSize({
    frame: FINITE_SCENE_RECT,
    resolution: "2k",
    state: { canvas: { size: FINITE_ARTBOARD_SIZE } } as never,
  });
  const expectedVideoSize = getToolcraftVideoExportSize({
    frame: FINITE_SCENE_RECT,
    resolution: "current",
    state: { canvas: { size: FINITE_ARTBOARD_SIZE } } as never,
  });
  const videoSchedule = createWaveVideoFrameSchedule(1);

  const finiteImage = await inspectToolcraftImageDownload({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    download: await triggerFooterExportDownload(page, "Export PNG"),
    page,
  });
  const finiteVideo = await inspectToolcraftVideoDownload({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    download: await triggerFooterExportDownload(page, "Export WebM"),
    page,
    schedule: videoSchedule,
  });

  const infinityField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await infinityField.getByRole("switch").click();

  const infiniteImage = await inspectToolcraftImageDownload({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    download: await triggerFooterExportDownload(page, "Export PNG"),
    page,
  });
  const infiniteVideo = await inspectToolcraftVideoDownload({
    backgroundRgba: DEFAULT_BACKGROUND_RGBA,
    download: await triggerFooterExportDownload(page, "Export WebM"),
    page,
    schedule: videoSchedule,
  });

  await expectToolcraftInfinityCanvasImageExportEvidence(
    {
      finite: finiteImage.inspection,
      infinite: infiniteImage.inspection,
    },
    {
      expectedSize: {
        height: expectedImageSize.height,
        width: expectedImageSize.width,
      },
      requirementId: "runtime.infinity.image-export",
      target: "canvas.infinity",
    },
  );

  await expectToolcraftInfinityCanvasVideoExportEvidence(
    {
      finite: finiteVideo.inspection,
      infinite: infiniteVideo.inspection,
    },
    {
      expectedSize: {
        height: expectedVideoSize.height,
        width: expectedVideoSize.width,
      },
      requirementId: "runtime.infinity.video-export",
      target: "canvas.infinity",
    },
  );
});
