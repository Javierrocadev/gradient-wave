# Toolcraft App Agent Worklog

## Status

Mode: product
Active change: delivery-1-gradient-wave

## Decisions

### Renderer

- Decision: Use an SVG preview renderer paired with a Canvas 2D export frame renderer backed by the executable `waveRendererPipeline`.
- Reason: The relief-line wave composition consists of 5 to 26 quadratic Bezier paths in foreground highlight and directional shadow groups, which SVG renders crisply at any zoom while Canvas 2D rasterizes identical geometry for PNG, JPG, MP4, and WebM output.
- Evidence: `src/app/wave-renderer.tsx`, `src/app/wave-model.ts`, `src/app/wave-pipeline.ts`, and `src/app/app-performance.ts`.

### View Interaction

- Decision: Use `non-spatial` view interaction intent.
- Reason: Gradient Wave is a 2D vector and raster artboard composition of raised angular lines with no three-dimensional scene, model, or camera.
- Evidence: `appProductReadiness.viewInteraction` in `src/app/app-acceptance-data.ts`.

### Interaction Ownership

- Decision: Assign all parameter edits and export actions to the right-side controls panel (`surface: "panel"`, `selectionScope: { mode: "global" }`).
- Reason: Right-panel sliders, switches, segmented controls, color pickers, and selects provide exact, repeatable parametric control over the procedural relief wave without cluttering the blue canvas composition with overlay handles.
- Evidence: `appProductReadiness.interactionOwnership` in `src/app/app-acceptance-data.ts`.

### Timeline

- Decision: Enable `timelineModule({ mode: "playback", defaultDurationSeconds: 6 })` with `timeline-playback` animation intent and a 6-second product-derived loop duration.
- Reason: The wave crest travels coherently across the raised line sequence over normalized loop progress `0 -> 1` and exports as a seamless looping video.
- Evidence: `src/app/app-schema.ts`, `src/app/wave-renderer.tsx`, and `appTransferMode.animationIntent` in `src/app/app-acceptance-data.ts`.

### Layers

- Decision: Do not enable `panels.layers`.
- Reason: Gradient Wave synthesizes one cohesive procedural multi-line relief surface rather than user-managed independent layer stacks.
- Evidence: `appSchema.panels.layers` is omitted in `src/app/app-schema.ts`.

### Controls

- Decision: Organize product controls into `Wave Shape` (`shape`), `Wave Motion` (`motion`), and `Line Relief` (`relief`) under the single `Gradient Wave` entity (`gradient-wave`), alongside runtime `Settings`, `Image Export`, and `Video Export`.
- Reason: Separating structural wave geometry (`geometry`), temporal wave amplitude (`motion`), and tactile stroke/shadow styling (`surface`) gives a clear workflow progression while keeping `shape.irregularity` colocated with its `shape.spacingMode` branch selector.
- Evidence: `src/app/app-schema.ts` and `appControlSectionInventory` in `src/app/app-acceptance-data.ts`.

### Export

- Decision: Enable both `imageExportModule()` (PNG/JPG at 2K/4K/8K) and `videoExportModule()` (MP4/WebM at Current/4K) with `user-requested` export intent backed by verbatim user request evidence.
- Reason: The user explicitly requested exporting the seamless loop wave in both video and still image formats.
- Evidence: `appProductReadiness.exportIntent` in `src/app/app-acceptance-data.ts` and `waveRasterFrameRenderer` in `src/app/wave-renderer.tsx`.

### Performance

- Decision: Declare a linear `lineCount` workload dimension (`16..26` lines) on `shape.lineCount` and register the single-pass `wave-geometry` vector-build pipeline across all 7 canonical interaction paths.
- Reason: Rebuilding SVG path strings scales linearly with `lineCount` on control changes, slider drags, timeline playback/scrub, and export, while viewport pan and zoom must never invalidate wave geometry.
- Evidence: `src/app/wave-pipeline.ts`, `src/app/app-performance.ts`, and `e2e/app-performance-path-adapters.ts`.

## Decision Trail

### Delivery 1 - Initial Gradient Wave MVP

- Change ID: delivery-1-gradient-wave
- Request: Build the Gradient Wave Toolcraft application from the user-approved phased MVP prompt and static SVG visual reference, supporting relief-line wave geometry, irregular spacing rhythm, seamless looping playback motion, and image/video export.
- Task type: Schema, procedural SVG/Canvas renderer, playback timeline, image/video export, acceptance matrix, and performance envelope.
- User-visible result: The canvas renders the animated Cobalt-blue relief-line wave composition with editable Wave Shape, Wave Motion, Line Relief, Settings, top playback timeline, and PNG/JPG/MP4/WebM export.
- Source/reference checked: User-provided static SVG reference (`1200x700` viewBox, 11 lines, `#0786ff` background, `#c6edff` highlight strokes, darker offset shadow group) and approved MVP build prompt.
- Reference inputs: None.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `docs/toolcraft/assembly-workflow.md`, `docs/toolcraft/decision-contract.md`, `docs/toolcraft/acceptance-testing.md`, and `docs/toolcraft/performance.md`.
- Contract rules applied: `runtime-shell-required`, `output-export-required`, `timeline-mode-choice`, `timeline-enabled-behavior`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `renderer-view-interaction`, `controls-section-inventory-required`, and `performance-coverage-levels`.
- View interaction intent: `non-spatial`; Gradient Wave is a 2D vector and raster composition with no 3D scene or camera.
- Interaction ownership: All parameter edits (`export.includeBackground`, `appearance.background`, `shape.*`, `motion.amplitude`, `appearance.*`, `export.image.*`, `export.video.*`) and `export.actions` are owned by the right-side controls panel with global selection scope.
- Decision: Implement deterministic procedural wave geometry in `src/app/wave-model.ts`, render interactive SVG preview and Canvas 2D export frames in `src/app/wave-renderer.tsx`, and wire the full schema, acceptance matrix, and performance envelope.
- Alternatives rejected: Static keyframe-only animation was rejected because the traveling wave is a continuous trigonometric phase loop driven by `timeline. playback`; WebGL/WebGPU were rejected as unnecessary overhead for 5 to 26 vector paths.
- State/output mapping: Runtime evaluated control values and normalized timeline loop progress feed `evaluateWaveScene`, which drives both the `<svg data-testid="gradient-wave-svg">` preview and `waveRasterFrameRenderer` for image and video export.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery` protected receipt validates unit, acceptance, browser feature, and performance gates.
- Risks: None; all schema, acceptance, and browser/export contracts are covered by automated tests.

## Evidence

- Source reviewed: `src/app/app-schema.ts`, `src/app/wave-model.ts`, `src/app/wave-renderer.tsx`, `src/app/wave-pipeline.ts`, `src/app/app-performance.ts`, and `src/app/app-acceptance-data.ts`.
- Contract applied: `runtime-shell-required`, `output-export-required`, `timeline-enabled-behavior`, `infinity-canvas-scene-bounds`, and `performance-coverage-levels`.

## Verification

Protected receipts own initial/performance proof. Later edits record focused checks and text journal run IDs.

## Risks

- None: procedural SVG preview and Canvas 2D raster export share `evaluateWaveScene` so preview and exported image/video frames remain geometrically identical.
