import {
  getToolcraftImageExportSize,
  getToolcraftVideoExportSize,
} from "@/toolcraft/runtime";

import {
  appControlSectionInventory,
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { DEFAULT_WAVE_SETTINGS } from "../src/app/wave-model";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-background-output-evidence";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import {
  expectToolcraftImageExportArtifact,
  expectToolcraftVideoExportArtifact,
} from "./browser-media-export-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import {
  expectToolcraftProductObservableToChange,
  getToolcraftProductObservableSnapshot,
} from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";
import {
  commitColorControlHex,
  commitSliderControlValue,
  computeExpectedWaveFrameExpectations,
  computeExpectedWaveVideoSamples,
  createWaveVideoFrameSchedule,
  DEFAULT_BACKGROUND_RGBA,
  FINITE_ARTBOARD_SIZE,
  FINITE_SCENE_RECT,
  inspectBackgroundExcludedImage,
  inspectBackgroundPreservedVideo,
  observeWaveBackgroundPreview,
  pauseTimelineAndSetDuration,
  selectControlOptionByTarget,
  triggerFooterExportDownload,
} from "./wave-browser-test-helpers";

test("browser: background inclusion switch updates preview, infinity viewport, PNG alpha, and video background", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await pauseTimelineAndSetDuration(page, "1s");

  const infinityField = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  const backgroundField = await getToolcraftControlFieldByTarget(
    page,
    "export.includeBackground",
  );

  await infinityField.getByRole("switch").click();
  const infinite = await observeInfinityCanvasBackground(page);
  await backgroundField.getByRole("switch").click();
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await backgroundField.getByRole("switch").click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await infinityField.getByRole("switch").click();

  await expectToolcraftInfinityCanvasBackgroundEvidence(
    {
      backgroundExcluded,
      backgroundRestored,
      infinite,
    },
    {
      expectedBackgroundColor: DEFAULT_WAVE_SETTINGS.background,
      requirementId: "control.export.includeBackground",
      target: "export.includeBackground",
    },
  );

  const previewObservation = session.observe(observeWaveBackgroundPreview);
  await expectToolcraftBackgroundOutputSemantics(
    previewObservation,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
    {
      backgroundVisible: false,
      outputSignature: "bg:false:false:transparent",
    },
    session.targetAction("actions.output", (currentPage) =>
      triggerFooterExportDownload(currentPage, "Export PNG"),
    ),
    (download) => inspectBackgroundExcludedImage(page, download),
    {
      requirementId: "control.export.includeBackground",
      video: {
        exportArtifact: session.targetAction("actions.output", (currentPage) =>
          triggerFooterExportDownload(currentPage, "Export MP4"),
        ),
        inspectArtifact: (download) =>
          inspectBackgroundPreservedVideo(page, download, 1),
      },
    },
  );
});

test("browser: wave shape controls update rendered SVG line count, spacing rhythm, and apex arc geometry", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await pauseTimelineAndSetDuration(page, "1s");

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("shape.lineCount", async (control, currentPage) => {
      await commitSliderControlValue(control, currentPage, "16");
      await expect(
        currentPage.locator('[data-testid="gradient-wave-foreground-path"]'),
      ).toHaveCount(16);
    }),
    { requirementId: "control.shape.lineCount" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("shape.spacing", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "125%"),
    ),
    { requirementId: "control.shape.spacing" },
  );

  await expectToolcraftSegmentedControlCellsPreservePadding(
    page,
    "Spacing Rhythm",
    {
      requirementId: "control.shape.spacingMode",
      target: "shape.spacingMode",
    },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("shape.spacingMode", async (control) => {
      await control.getByRole("button", { exact: true, name: "Regular" }).click();
    }),
    { requirementId: "control.shape.spacingMode" },
  );

  const irregularityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: "shape.irregularity",
  });
  for (const applicabilityCase of irregularityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("shape.spacingMode", async (control) => {
        await control
          .getByRole("button", {
            exact: true,
            name: applicabilityCase.selectorOptionLabel!,
          })
          .click();
      }),
      applicabilityCase,
      { baseRequirementId: "control.shape.irregularity" },
    );
    if (applicabilityCase.expectation === "visible") {
      await page.mouse.move(1, 1);
      let prevSnapshot = await getToolcraftProductObservableSnapshot(page);
      await expect
        .poll(async () => {
          const nextSnapshot = await getToolcraftProductObservableSnapshot(page);
          const settled = nextSnapshot === prevSnapshot;
          prevSnapshot = nextSnapshot;
          return settled;
        })
        .toBe(true);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction("shape.irregularity", (control, currentPage) =>
          commitSliderControlValue(control, currentPage, "84%"),
        ),
        {
          requirementId: getToolcraftApplicabilityRequirementId(
            "control.shape.irregularity",
            applicabilityCase,
          ),
        },
      );
    }
  }

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("shape.arcHeight", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "88%"),
    ),
    { requirementId: "control.shape.arcHeight" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("shape.arcBreadth", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "35%"),
    ),
    { requirementId: "control.shape.arcBreadth" },
  );
});

test("browser: wave motion and line relief controls update rendered SVG strokes and apex displacement", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await pauseTimelineAndSetDuration(page, "1s");

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", (control) =>
      commitColorControlHex(control, "0454B8"),
    ),
    { requirementId: "control.appearance.background" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("motion.amplitude", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "85%"),
    ),
    { requirementId: "control.motion.amplitude" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.lineWidth", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "16px"),
    ),
    { requirementId: "control.appearance.lineWidth" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.apexRounding", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "88px"),
    ),
    { requirementId: "control.appearance.apexRounding" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.lineColor", (control) =>
      commitColorControlHex(control, "FFF2B2"),
    ),
    { requirementId: "control.appearance.lineColor" },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.reliefStrength", (control, currentPage) =>
      commitSliderControlValue(control, currentPage, "92%"),
    ),
    { requirementId: "control.appearance.reliefStrength" },
  );
});

test("browser: image and video export controls and footer actions produce valid PNG, JPG, MP4, and WebM artifacts", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.getByTestId("gradient-wave-svg")).toBeVisible();
  await pauseTimelineAndSetDuration(page, "1s");

  await selectControlOptionByTarget(page, "export.image.format", "JPG");
  await selectControlOptionByTarget(page, "export.image.resolution", "2K");
  const image2kSize = getToolcraftImageExportSize({
    frame: FINITE_SCENE_RECT,
    resolution: "2k",
    state: { canvas: { size: FINITE_ARTBOARD_SIZE } } as never,
  });
  const expectedImage = await computeExpectedWaveFrameExpectations(page, {
    height: image2kSize.height,
    phase: 0,
    width: image2kSize.width,
  });

  await expectToolcraftImageExportArtifact(
    session.targetAction("actions.output", (currentPage) =>
      triggerFooterExportDownload(currentPage, "Export JPG"),
    ),
    {
      additionalArtifactRequirements: [
        {
          requirementId: "control.export.image.format",
          target: "export.image.format",
        },
        {
          requirementId: "control.export.image.resolution",
          target: "export.image.resolution",
        },
      ],
      backgroundRgba: DEFAULT_BACKGROUND_RGBA,
      expectedBounds: expectedImage.bounds,
      expectedHeight: image2kSize.height,
      expectedMediaType: "image/jpeg",
      expectedPixels: expectedImage.pixels,
      expectedWidth: image2kSize.width,
      page,
      requirementId: "control.actions.output",
    },
  );

  await selectControlOptionByTarget(page, "export.video.format", "WebM");
  await selectControlOptionByTarget(page, "export.video.resolution", "Current");
  const videoCurrentSize = getToolcraftVideoExportSize({
    frame: FINITE_SCENE_RECT,
    resolution: "current",
    state: { canvas: { size: FINITE_ARTBOARD_SIZE } } as never,
  });
  const videoSchedule = createWaveVideoFrameSchedule(1);
  const expectedVideoSamples = await computeExpectedWaveVideoSamples(page, {
    durationSeconds: 1,
    height: videoCurrentSize.height,
    width: videoCurrentSize.width,
  });

  await expectToolcraftVideoExportArtifact(
    session.targetAction("actions.output", (currentPage) =>
      triggerFooterExportDownload(currentPage, "Export WebM"),
    ),
    {
      additionalArtifactRequirements: [
        {
          requirementId: "control.export.video.format",
          target: "export.video.format",
        },
        {
          requirementId: "control.export.video.resolution",
          target: "export.video.resolution",
        },
      ],
      animated: true,
      backgroundRgba: DEFAULT_BACKGROUND_RGBA,
      expectedDurationSeconds: 1,
      expectedHeight: videoCurrentSize.height,
      expectedMediaType: "video/webm",
      expectedSamples: expectedVideoSamples,
      expectedWidth: videoCurrentSize.width,
      page,
      requirementId: "control.actions.output",
      schedule: videoSchedule,
    },
  );
});
