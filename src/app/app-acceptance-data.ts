import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftExportRequestEvidence,
  ToolcraftInteractionOwnershipEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

const primaryExportRequestEvidence: ToolcraftExportRequestEvidence = {
  messageRef:
    "8f17656a-1df5-48a4-8d3b-64939fdc1718/cd1df60d-c58e-4dae-b553-34acbff9240e",
  messageText:
    "vale, pues mira vamos a hacer una cosa crack, quiero hacer una herramienta para crear un gradiente fluido y constante, es decir, que sea un loop o algo asi, que no se note el corte al descargarlo me refiero. sería en formato video e imagen. entonces primero antes de nada te voy a pasar una idea de como tendríamos que construir este prompt",
  quote: "sería en formato video e imagen.",
  source: "user-message",
};

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    loopDuration: {
      evidence:
        "A 6-second seamless loop gives the forward-traveling crest a calm, unhurried cadence across the 16-line relief sequence while keeping video export fast and cyclic.",
      seconds: 6,
      source: "product-derived",
    },
    mode: "timeline-playback",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

const panelPropertyTargets = [
  "export.includeBackground",
  "appearance.background",
  "shape.lineCount",
  "shape.spacing",
  "shape.spacingMode",
  "shape.irregularity",
  "shape.arcHeight",
  "shape.arcBreadth",
  "motion.amplitude",
  "appearance.lineWidth",
  "appearance.apexRounding",
  "appearance.lineColor",
  "appearance.reliefStrength",
  "export.image.format",
  "export.image.resolution",
  "export.video.format",
  "export.video.resolution",
] as const;

const interactionOwnership: readonly ToolcraftInteractionOwnershipEntry[] = [
  ...panelPropertyTargets.map(
    (target): ToolcraftInteractionOwnershipEntry => ({
      alternative: {
        reason:
          "Direct canvas handles would clutter the minimal blue relief composition and make exact parametric repeatability harder.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "User-approved MVP prompt specifies right-panel parameter controls for Wave Shape, Wave Motion, Line Relief, Background, and Export settings.",
        source: "user-request",
      },
      id: `ownership.${target}`,
      reason:
        "Right-panel sliders, switches, color pickers, and selects provide exact, repeatable parametric control over the procedural relief wave.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target,
    }),
  ),
  {
    alternative: {
      reason:
        "Canvas overlays should remain clean for visual inspection of the wave composition rather than hosting export buttons.",
      surface: "canvas",
    },
    capability: "command",
    evidence: {
      detail:
        "User requested downloading seamless loop video and still image outputs from the tool.",
      source: "user-request",
    },
    id: "ownership.actions.output",
    reason:
      "Sticky footer panelActions keep Export PNG and Export Video immediately accessible below the export format and resolution selectors.",
    surface: "panel",
    target: "actions.output",
  },
];

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence: primaryExportRequestEvidence,
      mode: "user-requested",
    },
    svg: { mode: "not-requested" },
    video: {
      evidence: primaryExportRequestEvidence,
      mode: "user-requested",
    },
  },
  interactionOwnership,
  mode: "product",
  productName: "Gradient Wave",
  productSummary:
    "Procedural relief-line wave generator with an asymmetric flowing apex arc, seamless looping playback timeline, and image/video export.",
  requestedBehavior:
    "Generate a sequence of raised angular lines with rounded quadratic Bezier apexes over a Cobalt blue background that animate in a seamless forward-traveling loop and export to video (MP4/WebM) and image (PNG/JPG).",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "Gradient Wave is a 2D vector and raster artboard composition of raised-looking lines with no 3D camera or spatial scene.",
  },
};

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Gradient Wave",
      entityId: "gradient-wave",
      finiteSelectors: [
        {
          reason:
            "Toggles whether the artboard backdrop fill is rendered in the preview and included in transparent-capable PNG exports.",
          role: "parameter",
          target: "export.includeBackground",
        },
      ],
      groupingReason:
        "Groups canvas setup and artboard background inclusion and color controls in the top Settings section.",
      id: "runtime.setup",
      splitReason:
        "Separates artboard setup and background visibility from wave geometry, motion, relief styling, and output encoding.",
      targets: ["export.includeBackground", "appearance.background"],
      title: "Settings",
      workflowStage: "setup",
    },
    {
      entity: "Gradient Wave",
      entityId: "gradient-wave",
      finiteSelectors: [
        {
          affectedTargets: [],
          reason:
            "Spacing Rhythm switches between uniform line intervals and deterministic irregular offsets gated by shape.irregularity.",
          role: "branch",
          target: "shape.spacingMode",
        },
      ],
      groupingReason:
        "Groups the structural geometry parameters that define how many lines exist, their horizontal spacing rhythm, and the collective asymmetric apex arc.",
      id: "shape",
      splitReason:
        "Separates static wave geometry and spacing structure from temporal wave motion, line surface relief styling, and output encoding.",
      targets: [
        "shape.lineCount",
        "shape.spacing",
        "shape.spacingMode",
        "shape.irregularity",
        "shape.arcHeight",
        "shape.arcBreadth",
      ],
      title: "Wave Shape",
      workflowStage: "geometry",
    },
    {
      entity: "Gradient Wave",
      entityId: "gradient-wave",
      finiteSelectors: [],
      groupingReason:
        "Isolates the traveling wave displacement intensity that animates across the line sequence over the playback loop.",
      id: "motion",
      splitReason:
        "Separates temporal wave displacement intensity from static line geometry, surface relief styling, and output encoding.",
      targets: ["motion.amplitude"],
      title: "Wave Motion",
      workflowStage: "motion",
    },
    {
      entity: "Gradient Wave",
      entityId: "gradient-wave",
      finiteSelectors: [],
      groupingReason:
        "Groups stroke width, apex corner rounding, highlight color, and directional shadow depth that define the tactile relief appearance.",
      id: "relief",
      splitReason:
        "Separates tactile stroke and shadow relief styling from wave geometry, temporal motion, and output encoding.",
      targets: [
        "appearance.lineWidth",
        "appearance.apexRounding",
        "appearance.lineColor",
        "appearance.reliefStrength",
      ],
      title: "Line Relief",
      workflowStage: "surface",
    },
    {
      entity: "Image Export",
      entityId: "image-export",
      finiteSelectors: [
        {
          reason:
            "Selects whether still image export encodes lossless PNG or compressed JPG bytes.",
          role: "parameter",
          target: "export.image.format",
        },
        {
          reason:
            "Selects the 2K, 4K, or 8K output raster multiplier for exported still images.",
          role: "parameter",
          target: "export.image.resolution",
        },
      ],
      groupingReason:
        "Groups still image format and raster resolution selectors for static frame downloads.",
      id: "runtime.image-export",
      splitReason:
        "Separates still image encoding parameters from looping video encoding and creative wave parameters.",
      targets: ["export.image.format", "export.image.resolution"],
      title: "Image Export",
      workflowStage: "export-image",
    },
    {
      entity: "Video Export",
      entityId: "video-export",
      finiteSelectors: [
        {
          reason:
            "Selects whether looping video export encodes an MP4 or WebM container.",
          role: "parameter",
          target: "export.video.format",
        },
        {
          reason:
            "Selects whether video export renders at Current artboard dimensions or 4K.",
          role: "parameter",
          target: "export.video.resolution",
        },
      ],
      groupingReason:
        "Groups video container format and output frame resolution selectors for seamless loop downloads.",
      id: "runtime.video-export",
      splitReason:
        "Separates looping video encoding parameters from still image encoding and creative wave parameters.",
      targets: ["export.video.format", "export.video.resolution"],
      title: "Video Export",
      workflowStage: "export-video",
    },
  ];

const automatedAcceptanceTestName =
  "validates product acceptance and performance coverage for Gradient Wave";
const defaultFixture = "default 16-line Gradient Wave composition";
const controlsSpecFile = "e2e/app-controls.spec.ts";
const runtimeSpecFile = "e2e/app-runtime.spec.ts";

const shapeTest =
  "browser: wave shape controls update rendered SVG line count, spacing rhythm, and apex arc geometry";
const motionReliefTest =
  "browser: wave motion and line relief controls update rendered SVG strokes and apex displacement";
const exportTest =
  "browser: image and video export controls and footer actions produce valid PNG, JPG, MP4, and WebM artifacts";

function controlEntry(
  target: string,
  componentType: ToolcraftComponentAcceptance["componentType"],
  testName: string,
  budget: "standard" | "extended-io",
  evidence: ToolcraftComponentAcceptance["evidence"],
  userAction: string,
  expectedObservable: string,
  extra: Partial<ToolcraftComponentAcceptance> = {},
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: automatedAcceptanceTestName,
    browser: { budget, file: controlsSpecFile, testName },
    componentType,
    evidence,
    expectedObservable,
    fixture: defaultFixture,
    id: `control.${target}`,
    interactionId: `ownership.${target}`,
    kind: "control",
    target,
    userAction,
    ...extra,
  };
}

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  controlEntry(
    "export.includeBackground",
    "switch",
    "browser: background inclusion switch updates preview, infinity viewport, PNG alpha, and video background",
    "extended-io",
    "exported-bytes",
    "Toggle Background in Settings and inspect preview, Infinity viewport, PNG alpha, and video background.",
    "Toggling Background off hides the artboard background in preview, exports transparent PNG pixels, and preserves the background in JPG and video exports.",
    { backgroundOutputCoverage: "all-required-background-output" },
  ),
  controlEntry(
    "appearance.background",
    "color",
    motionReliefTest,
    "standard",
    "product-output",
    "Pick a new Background color in Settings.",
    "Changing Background color updates the artboard backdrop and derived darker relief shadow color in the SVG composition.",
  ),
  controlEntry(
    "shape.lineCount",
    "slider",
    shapeTest,
    "standard",
    "product-output",
    "Adjust Line Count in Wave Shape.",
    "Changing Line Count updates the number of rendered foreground and shadow relief wave paths.",
  ),
  controlEntry(
    "shape.spacing",
    "slider",
    shapeTest,
    "standard",
    "product-output",
    "Adjust Line Spacing in Wave Shape.",
    "Changing Line Spacing expands or compresses the horizontal intervals between consecutive relief lines.",
  ),
  controlEntry(
    "shape.spacingMode",
    "segmented",
    shapeTest,
    "standard",
    "product-output",
    "Switch Spacing Rhythm between Regular and Irregular.",
    "Switching Spacing Rhythm between Regular and Irregular toggles the Irregularity slider and redistributes line spacing intervals.",
    { optionCoverage: ["regular", "irregular"] },
  ),
  controlEntry(
    "shape.irregularity",
    "slider",
    shapeTest,
    "standard",
    "product-output",
    "Adjust Irregularity in Wave Shape.",
    "Changing Irregularity while Spacing Rhythm is Irregular shifts the non-uniform horizontal spacing and apex offsets across the line sequence.",
    { fixture: "default 16-line Gradient Wave composition in Irregular mode" },
  ),
  controlEntry(
    "shape.arcHeight",
    "slider",
    shapeTest,
    "standard",
    "product-output",
    "Adjust Arc Height in Wave Shape.",
    "Changing Arc Height scales the rightward protrusion of the collective apex envelope.",
  ),
  controlEntry(
    "shape.arcBreadth",
    "slider",
    shapeTest,
    "standard",
    "product-output",
    "Adjust Arc Breadth in Wave Shape.",
    "Changing Arc Breadth widens or narrows the bell envelope across neighboring lines.",
  ),
  controlEntry(
    "motion.amplitude",
    "slider",
    motionReliefTest,
    "standard",
    "product-output",
    "Adjust Wave Amplitude in Wave Motion.",
    "Changing Wave Amplitude scales the traveling wave displacement of the apex positions.",
  ),
  controlEntry(
    "appearance.lineWidth",
    "slider",
    motionReliefTest,
    "standard",
    "product-output",
    "Adjust Line Width in Line Relief.",
    "Changing Line Width updates the rendered SVG stroke width of the foreground and shadow relief paths.",
  ),
  controlEntry(
    "appearance.apexRounding",
    "slider",
    motionReliefTest,
    "standard",
    "product-output",
    "Adjust Apex Rounding in Line Relief.",
    "Changing Apex Rounding updates the quadratic Bezier bend span around each line apex.",
  ),
  controlEntry(
    "appearance.lineColor",
    "color",
    motionReliefTest,
    "standard",
    "product-output",
    "Pick a new Line Color in Line Relief.",
    "Changing Line Color updates the foreground highlight stroke color across all wave lines.",
  ),
  controlEntry(
    "appearance.reliefStrength",
    "slider",
    motionReliefTest,
    "standard",
    "product-output",
    "Adjust Relief Depth in Line Relief.",
    "Changing Relief Depth updates the shadow group opacity and directional offset behind the highlight lines.",
  ),
  controlEntry(
    "export.image.format",
    "select",
    exportTest,
    "extended-io",
    "exported-bytes",
    "Select PNG and JPG in Image Export.",
    "Selecting PNG or JPG in Image Export changes the sticky footer action label and exported image format.",
    { optionCoverage: ["png", "jpg"] },
  ),
  controlEntry(
    "export.image.resolution",
    "select",
    exportTest,
    "extended-io",
    "exported-bytes",
    "Select 2k, 4k, and 8k in Image Export.",
    "Selecting 2k, 4k, or 8k in Image Export scales the exported raster image dimensions while preserving the artboard aspect ratio.",
    { optionCoverage: ["2k", "4k", "8k"] },
  ),
  controlEntry(
    "export.video.format",
    "select",
    exportTest,
    "extended-io",
    "exported-bytes",
    "Select MP4 and WebM in Video Export.",
    "Selecting MP4 or WebM in Video Export changes the exported video container and codec.",
    { optionCoverage: ["mp4", "webm"] },
  ),
  controlEntry(
    "export.video.resolution",
    "select",
    exportTest,
    "extended-io",
    "exported-bytes",
    "Select Current and 4K in Video Export.",
    "Selecting Current or 4K in Video Export changes the exported video frame dimensions.",
    { optionCoverage: ["current", "4k"] },
  ),
  controlEntry(
    "actions.output",
    "panelActions",
    exportTest,
    "extended-io",
    "exported-bytes",
    "Click Export PNG/JPG and Export Video in the sticky footer.",
    "Clicking Export PNG/JPG and Export Video downloads non-empty, valid raster image and video files matching the active wave composition.",
    {
      actionCoverage: ["export.png", "export.video"],
      exportArtifactCoverage: [
        "all-required-image-export-behavior",
        "all-required-video-export-behavior",
      ],
    },
  ),
  {
    automated: true,
    automatedTestName: automatedAcceptanceTestName,
    browser: {
      budget: "standard",
      file: runtimeSpecFile,
      testName:
        "browser: timeline playback, scrub, duration, and forward loop drive the traveling wave seamlessly",
    },
    componentType: "timeline",
    evidence: "timeline-output",
    expectedObservable:
      "Playing, pausing, scrubbing, and changing duration on the top timeline advances the traveling wave forward and wraps seamlessly from loop end back to start.",
    fixture: "default 16-line Gradient Wave composition with 6s playback loop",
    id: "runtime.timeline.playback",
    kind: "runtime",
    timelineCoverage: "playback",
    timelineLoopProof: {
      direction: "forward-only",
      durationChange: "reproved-after-edit",
      reversePlayback: "forbidden",
      seam: "first-last-match",
    },
    timelinePlaybackCoverage: "all-playback-behavior",
    userAction:
      "Play, pause, scrub, and edit loop duration on the top timeline while observing the wave phase and crest marker.",
  },
  {
    automated: true,
    automatedTestName: automatedAcceptanceTestName,
    browser: {
      budget: "standard",
      file: runtimeSpecFile,
      testName:
        "browser: infinity canvas preserves world continuity and restores finite dimensions",
    },
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Toggling Infinity canvas removes only the finite artboard boundary and size inputs while preserving the world frame, viewport transform, SVG renderer identity, and saved finite dimensions upon restoration.",
    fixture: defaultFixture,
    id: "runtime.infinity.continuity",
    infinityCanvasCoverage: "mode-continuity-and-restoration",
    kind: "runtime",
    userAction: "Toggle Infinity canvas on and off in Settings.",
  },
  {
    automated: true,
    automatedTestName: automatedAcceptanceTestName,
    browser: {
      budget: "extended-io",
      file: runtimeSpecFile,
      testName: "browser: infinity canvas exports scene-bounds PNG and video",
    },
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Exporting PNG while Infinity canvas is active captures the full intrinsic wave scene bounds with matching dimensions and rendered wave strokes.",
    fixture: "default 16-line Gradient Wave composition in Infinity mode",
    id: "runtime.infinity.image-export",
    infinityCanvasCoverage: "scene-bounds-image-export",
    kind: "runtime",
    userAction: "Enable Infinity canvas and click Export PNG.",
  },
  {
    automated: true,
    automatedTestName: automatedAcceptanceTestName,
    browser: {
      budget: "extended-io",
      file: runtimeSpecFile,
      testName: "browser: infinity canvas exports scene-bounds PNG and video",
    },
    componentType: "canvas",
    evidence: "exported-bytes",
    expectedObservable:
      "Exporting Video while Infinity canvas is active preserves the saved artboard dimensions, loop duration, and decoded wave frames.",
    fixture: "default 16-line Gradient Wave composition in Infinity mode",
    id: "runtime.infinity.video-export",
    infinityCanvasCoverage: "scene-bounds-video-export",
    kind: "runtime",
    userAction: "Enable Infinity canvas and click Export Video.",
  },
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the starter schema",
    browser: {
      budget: "extended-io",
      file: "e2e/app-persistence.spec.ts",
      testName:
        "browser: app restores exact canvas, values, and panel workspace slices after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size and zoom, their runtime values, and the moved and collapsed Controls workspace remain visibly restored after a real browser reload.",
    fixture: "starter runtime persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit Canvas width and zoom, move and collapse Controls, wait for persistence, and reload the page.",
  },
];
