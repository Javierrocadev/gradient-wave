# Toolcraft App Agent Worklog

## Status

Mode: product
Active change: supplied-flute-defaults

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

### Delivery 2 - Atmospheric Style Mode and Film Grain Overlay

- Change ID: delivery-2-atmospheric-style
- Request: Add Option 1 as approved by user: a Style Mode selector (`appearance.style`, "Classic" vs "Atmospheric") and Grain Intensity slider (`appearance.grain`), activating dynamic multi-point mesh gradient lighting, luminous screen blending, depth transparency gradient, and deterministic film grain micro-noise overlay.
- Task type: Schema controls, procedural shader/pattern model, SVG and Canvas 2D renderer enhancements, acceptance matrix, and browser test coverage.
- User-visible result: In Line Relief, users can switch between Classic mode (uniform relief lines) and Atmospheric mode (rich radial mesh background glow, luminous screen-blended highlight lines with depth opacity ramp, and fine film grain overlay).
- Source/reference checked: User feedback and approved HTML prototype comparison preview.
- Reference inputs: None.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `docs/toolcraft/decision-contract.md`, and `docs/toolcraft/acceptance-testing.md`.
- Contract rules applied: `controls-section-inventory-required`, `runtime-shell-required`, and `output-export-required`.
- View interaction intent: `non-spatial`.
- Interaction ownership: Panel controls for `appearance.style` and `appearance.grain` under the `relief` section with `global` scope.
- Decision: Keep `classic` as the default style mode for backward compatibility with baseline pixel expectations, while `ambient` engages radial mesh lighting pools (`#00E5FF`, `#0055FF`, `#6A00FF`), progressive line opacity (`0.32 -> 0.90`), screen blend illumination, and deterministic SVG `<feTurbulence>` / `<feColorMatrix>` white-noise micro-grain calibrated up to 32% opacity with organic frequency (0.55).
- Alternatives rejected: Always forcing atmospheric style was rejected to protect existing classic baseline test contracts. CSS `mix-blend-mode: overlay` was rejected because multiplicative dark-background blending crushed grain contrast into zero over dark navy.
- State/output mapping: `appearance.style` and `appearance.grain` map to `WaveSceneGeometry` properties `style`, `grain`, `grainOpacity`, `hasGrain`, `hasMeshBackground`, `meshLights`, and `lineBlendMode`.
- Performance intent: ordinary-product-work
- Verification: `npm run typecheck`, `npm run build`, `npm run docs:check`, Vitest unit and acceptance suites, and Playwright browser specs.
- Risks: None; Classic mode remains default and identical in output, while Ambient mode is fully deterministic.

### Delivery 3 - Fluted Ribbon Facets and Dynamic Relief Modulation

- Change ID: delivery-3-fluted-facets
- Request: Add vertical fluted cuts across the wave ribbons in Ambient mode (inspired by the reference of blurred light pools with fluted vertical incisions), integrated smoothly with the background and modulated by the Relief Depth control.
- Task type: Procedural geometric facet builder (`src/app/wave-facets.ts`), Canvas 2D and SVG facet rendering (`WaveFacetsGroup`), acceptance matrix, and browser tests.
- User-visible result: In Ambient mode, the spaces between wave lines form alternating light-cyan and shadow-navy facet ribbons. When `appearance.reliefStrength` is adjusted, low-to-medium values produce a subtle fluted glass look, while high values produce deep, marked architectural cuts.
- Source/reference checked: User-provided reference image showing fluted glass vertical incisions over blurred cyan-blue gradient pools.
- Reference inputs: `image.png` attachment.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, and `docs/toolcraft/acceptance-testing.md`.
- Contract rules applied: `controls-section-inventory-required`, `runtime-shell-required`, and `output-export-required`.
- View interaction intent: `non-spatial`.
- Interaction ownership: Panel controls for `appearance.reliefStrength` under the `relief` section.
- Decision: Create `src/app/wave-facets.ts` with `buildWaveFacets` and `drawWaveFacetsOnCanvas` to maintain strict <700 line budget in `wave-model.ts`. Render facets in SVG using `<WaveFacetsGroup>` between the mesh background and wave shadows. Modulate facet opacity dynamically from `0.04` (at 20% relief) up to `0.48` (at 100% relief). Keep facets disabled in Classic mode (`facets: []`) to ensure 100% backward compatibility.
- Alternatives rejected: Hardcoding fixed facet opacity was rejected because it prevented user control over cut sharpness and subtlety. Adding an entirely new schema slider was rejected to avoid control clutter when `appearance.reliefStrength` already semantically governs depth and contrast.
- State/output mapping: `scene.facets` populated when `isAtmospheric && settings.includeBackground`.
- Performance intent: ordinary-product-work
- Verification: `npm run typecheck`, `npm run docs:check`, `node scripts/check-toolcraft-integrity.mjs`, and full Playwright test suite `e2e/app-controls.spec.ts` (9 passed).
- Risks: None; isolated cleanly between `src/app/wave-facets.ts` and `src/app/wave-model.ts`.

### Delivery 4 - Dynamic Ambient Palette and Geometry Tracking

- Change ID: delivery-4-dynamic-ambient-palette
- Request: User requested that Ambient mode no longer have hardcoded preconfigured colors and static shapes, allowing full customization of both color and shape elements via the existing controls.
- Task type: Procedural mesh light and facet shader model enhancements, reactive palette derivation, and wave geometry binding.
- User-visible result: In Ambient mode, the background base color, atmospheric radial lights, and vertical facet cuts now dynamically derive from the user's selected Background Color (`appearance.background`) and Line Color (`appearance.lineColor`). Furthermore, the primary ambient light spot now tracks the wave crest and animates with wave motion, and light radii respond to arc breadth and spacing.
- Source/reference checked: User feedback and clarification decision.
- Reference inputs: None.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, and `docs/toolcraft/acceptance-testing.md`.
- Contract rules applied: `controls-section-inventory-required`, `runtime-shell-required`, and `output-export-required`.
- View interaction intent: `non-spatial`.
- Interaction ownership: Panel controls for `appearance.background` and `appearance.lineColor` under `background` and `relief` sections.
- Decision: Derive `meshBaseColor` via `deriveAmbientBaseColor(background)` and harmonic light via `deriveAmbientHarmonicColor(background, lineColor)`. Bind Light 1 to `crestX` and `crestY` so it dynamically shifts and animates with wave amplitude and timeline loop progress. Pass `lineColor` and `shadowColor` into `buildWaveFacets` so facet cuts adopt the user's custom palette.
- Alternatives rejected: Adding new dedicated color pickers for mesh spots was rejected to avoid control clutter and keep the interface clean and cohesive, as requested by the user.
- State/output mapping: `scene.meshBaseColor`, `scene.meshLights`, and `scene.facets` derive dynamically from `settings.background`, `settings.lineColor`, and wave geometry.
- Performance intent: ordinary-product-work
- Verification: `npm run typecheck`, `npm run docs:check`, `node scripts/check-toolcraft-integrity.mjs`, Vitest worklog test, and Playwright e2e test suite (9 passed).
- Risks: None; Classic mode remains unchanged and fully backwards compatible.

### Supplied Flute Workspace Defaults

- Change ID: supplied-flute-defaults
- Request: "haz este el predeterminado crea el commit y subelo directamente" with `gradient-wave-settings (1).json`.
- Task type: Later focused defaults update; no renderer, runtime, persistence format, or export capability changes.
- Decision: Convert the supplied settings v3 through the public runtime settings codec into a validated complete v2 source snapshot in `src/app/app-defaults.json`. Preserve every supplied value, hidden Glass settings, custom 12:7 finite 1200x700 canvas, six-second loop, and paused playhead at 1.5784000000058303 seconds. Keep existing schema assembly and local persistence precedence.
- Changed owners: `src/app/app-defaults.json`, product defaults regression tests, and the schema sizing assertion.
- User-visible result: New workspaces and global Reset use the supplied red Flute composition; existing saved workspaces retain their settings until Reset.
- Verification plan: Focused defaults RED/GREEN unit tests, existing schema tests, fresh-browser startup/reset pixel comparison, and `test:feature -- persistence.reload`. No aggregate delivery, build, export matrix, or measured performance run.
- Verification: Defaults regression test observed RED before the snapshot, then all three defaults tests passed. Exact comparison with the attachment passed for all 24 values, canvas size/mode/aspect ratio, and five timeline fields. Fresh-browser startup/reset passed (9.4s) with restored decoded product pixels; the existing persistence/reload browser test passed (10.1s). `git diff --check` passed. No build, aggregate delivery, export matrix, or measured performance was run.
- Existing check limitations: The existing schema suite passed three of four tests; its acceptance test reports missing inventory/finite-selector/acceptance coverage for `appearance.ambientTone`, already absent in HEAD. The canonical `test:feature -- persistence.reload` launcher failed twice before browser execution with Windows `EPERM` while renaming a journal directory with an open events file; the exact persistence browser test was run directly instead. No copied framework code was changed. Initial smoke attempts needed the existing 15-second cold-start allowance and an unobstructed pixel region; an additional attempt encountered a transient dynamic-module fetch failure before the final passing run.
- Native assessment: medium, `review_due: false`, reason `under_budget`; no candidate review was started.
- Risk: none; this adds source defaults using existing codecs and does not change shared runtime logic or stored user data.
- Rollback boundary: Remove this source snapshot and its focused regression expectations; no other behavior or resource is changed.

## Evidence

- Source reviewed: `src/app/app-schema.ts`, `src/app/wave-model.ts`, `src/app/wave-renderer.tsx`, and `src/app/app-acceptance-data.ts`.
- Contract applied: `runtime-shell-required`, `output-export-required`, and `controls-section-inventory-required`.

## Verification

Protected receipts own initial/performance proof. Later edits record focused checks and text journal run IDs.

## Risks

- None: procedural SVG preview and Canvas 2D raster export share `evaluateWaveScene` so preview and exported image/video frames remain geometrically identical.
