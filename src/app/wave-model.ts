import {
  buildMeshLights,
  buildWaveFacets,
  deriveAmbientBaseColor,
  deriveAmbientHarmonicColor,
  drawWaveFacetsOnCanvas,
  type WaveFacetGeometry,
} from "./wave-facets";

export type { WaveFacetGeometry };
export type WaveAmbientTone = "dark" | "light";
export type WaveSpacingMode = "regular" | "irregular";
export type WaveStyle = "classic" | "ambient" | "flute" | "glass";

export type WaveSettings = Readonly<{
  ambientIntensity: number;
  ambientTone: WaveAmbientTone;
  amplitude: number;
  apexRounding: number;
  arcBreadth: number;
  arcHeight: number;
  background: string;
  glassBlur: number;
  glassColor: string;
  grain: number;
  includeBackground: boolean;
  irregularity: number;
  lineColor: string;
  lineCount: number;
  lineWidth: number;
  reliefStrength: number;
  spacing: number;
  spacingMode: WaveSpacingMode;
  style: WaveStyle;
}>;

export type WavePoint = Readonly<{
  x: number;
  y: number;
}>;

export type WaveLineGeometry = Readonly<{
  apex: WavePoint;
  bottom: WavePoint;
  d: string;
  entry: WavePoint;
  exit: WavePoint;
  foregroundOpacity: number;
  foregroundStrokeWidth: number;
  index: number;
  shadowOpacity: number;
  shadowStrokeWidth: number;
  top: WavePoint;
}>;

export type WaveMeshLight = Readonly<{
  color: string;
  coreColor?: string;
  cx: number;
  cy: number;
  opacity: number;
  r: number;
}>;

export type WaveSceneGeometry = Readonly<{
  ambientIntensity: number;
  ambientTone: WaveAmbientTone;
  background: string;
  crestPoint: WavePoint;
  facets: readonly WaveFacetGeometry[];
  foregroundOpacity: number;
  foregroundStrokeWidth: number;
  glassBlur: number;
  glassColor: string;
  grain: number;
  grainOpacity: number;
  hasGrain: boolean;
  hasMeshBackground: boolean;
  height: number;
  includeBackground: boolean;
  lineBlendMode: "normal" | "screen";
  lineColor: string;
  lines: readonly WaveLineGeometry[];
  meshBaseColor: string;
  meshLights: readonly WaveMeshLight[];
  phase: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  shadowStrokeWidth: number;
  style: WaveStyle;
  width: number;
}>;

export const DEFAULT_WAVE_SETTINGS: WaveSettings = Object.freeze({
  ambientIntensity: 65,
  ambientTone: "dark",
  amplitude: 55,
  apexRounding: 48,
  arcBreadth: 65,
  arcHeight: 62,
  background: "#0786FF",
  glassBlur: 48,
  glassColor: "#FFFFFF",
  grain: 24,
  includeBackground: true,
  irregularity: 52,
  lineColor: "#C6EDFF",
  lineCount: 16,
  lineWidth: 9,
  reliefStrength: 68,
  spacing: 100,
  spacingMode: "irregular",
  style: "classic",
});

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function readHexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    return value.trim().toLowerCase();
  }
  return fallback;
}

function parseHexRgb(hex: string): readonly [number, number, number] {
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return [
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 75,
    Number.isFinite(b) ? b : 159,
  ];
}

function toHexChannel(channel: number): string {
  return Math.round(Math.min(255, Math.max(0, channel)))
    .toString(16)
    .padStart(2, "0");
}

function deriveReliefShadowColor(background: string, lineColor: string): string {
  const [bgR, bgG, bgB] = parseHexRgb(background);
  const [fgR, fgG, fgB] = parseHexRgb(lineColor);
  const shadowR = bgR * 0.36 + fgR * 0.08;
  const shadowG = bgG * 0.42 + fgG * 0.1;
  const shadowB = Math.max(48, bgB * 0.56 + fgB * 0.14);
  return `#${toHexChannel(shadowR)}${toHexChannel(shadowG)}${toHexChannel(shadowB)}`;
}

export function readWaveSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
): WaveSettings {
  const spacingMode: WaveSpacingMode =
    values["shape.spacingMode"] === "regular"
      ? "regular"
      : values["shape.spacingMode"] === "irregular"
        ? "irregular"
        : DEFAULT_WAVE_SETTINGS.spacingMode;

  return {
    ambientIntensity: clampNumber(
      values["appearance.ambientIntensity"],
      0,
      100,
      DEFAULT_WAVE_SETTINGS.ambientIntensity,
    ),
    ambientTone:
      values["appearance.ambientTone"] === "light"
        ? "light"
        : DEFAULT_WAVE_SETTINGS.ambientTone,
    amplitude: clampNumber(values["motion.amplitude"], 0, 100, DEFAULT_WAVE_SETTINGS.amplitude),
    apexRounding: clampNumber(values["appearance.apexRounding"], 8, 120, DEFAULT_WAVE_SETTINGS.apexRounding),
    arcBreadth: clampNumber(values["shape.arcBreadth"], 20, 100, DEFAULT_WAVE_SETTINGS.arcBreadth),
    arcHeight: clampNumber(values["shape.arcHeight"], 0, 100, DEFAULT_WAVE_SETTINGS.arcHeight),
    background: readHexColor(values["appearance.background"], DEFAULT_WAVE_SETTINGS.background),
    glassBlur: clampNumber(values["appearance.glassBlur"], 10, 100, DEFAULT_WAVE_SETTINGS.glassBlur),
    glassColor: readHexColor(values["appearance.glassColor"], DEFAULT_WAVE_SETTINGS.glassColor),
    grain: clampNumber(values["appearance.grain"], 0, 100, DEFAULT_WAVE_SETTINGS.grain),
    includeBackground: typeof values["export.includeBackground"] === "boolean"
      ? values["export.includeBackground"]
      : DEFAULT_WAVE_SETTINGS.includeBackground,
    irregularity: clampNumber(values["shape.irregularity"], 0, 100, DEFAULT_WAVE_SETTINGS.irregularity),
    lineColor: readHexColor(values["appearance.lineColor"], DEFAULT_WAVE_SETTINGS.lineColor),
    lineCount: Math.round(clampNumber(values["shape.lineCount"], 5, 26, DEFAULT_WAVE_SETTINGS.lineCount)),
    lineWidth: clampNumber(values["appearance.lineWidth"], 2, 24, DEFAULT_WAVE_SETTINGS.lineWidth),
    reliefStrength: clampNumber(values["appearance.reliefStrength"], 0, 100, DEFAULT_WAVE_SETTINGS.reliefStrength),
    spacing: clampNumber(values["shape.spacing"], 45, 145, DEFAULT_WAVE_SETTINGS.spacing),
    spacingMode,
    style:
      values["appearance.style"] === "ambient"
        ? "ambient"
        : values["appearance.style"] === "flute"
          ? "flute"
          : values["appearance.style"] === "glass"
            ? "glass"
            : "classic",
  };
}

function getDeterministicIrregularWeight(index: number, count: number): number {
  const normalized = count > 1 ? index / (count - 1) : 0.5;
  const primary = Math.sin((index + 1) * 1.93 + normalized * Math.PI * 1.7);
  const secondary = Math.cos((index + 1) * 3.17 - normalized * Math.PI * 0.85);
  return primary * 0.65 + secondary * 0.35;
}

function formatCoord(value: number): string {
  return value.toFixed(2);
}

export function evaluateWaveScene(
  settings: WaveSettings,
  rawWidth: number,
  rawHeight: number,
  rawPhase: number,
): WaveSceneGeometry {
  const width = Math.max(64, Number.isFinite(rawWidth) ? rawWidth : 1200);
  const height = Math.max(64, Number.isFinite(rawHeight) ? rawHeight : 700);
  const scaleX = width / 1200;
  const scaleY = height / 700;
  const scaleMean = (scaleX + scaleY) * 0.5;
  const phase =
    ((Number.isFinite(rawPhase) ? rawPhase : 0) % 1 + 1) % 1;
  const tauPhase = phase * Math.PI * 2;

  const count = Math.max(5, Math.min(26, Math.round(settings.lineCount)));
  const irregularMix =
    settings.spacingMode === "irregular" ? settings.irregularity / 100 : 0;

  // Compute cumulative spacing positions in [0, 1] so spacing stays strictly monotonic.
  const intervals: number[] = [];
  let intervalSum = 0;
  for (let index = 0; index < count - 1; index += 1) {
    const variation = getDeterministicIrregularWeight(index, count - 1);
    const weight = Math.max(0.28, 1 + irregularMix * 0.68 * variation);
    intervals.push(weight);
    intervalSum += weight;
  }

  const normalizedPositions: number[] = [0];
  let running = 0;
  for (const interval of intervals) {
    running += interval / (intervalSum || 1);
    normalizedPositions.push(running);
  }

  const baseSpanX = width * 1.4 * (settings.spacing / 100);
  const centerX = width * 0.61;
  const startX = centerX - baseSpanX * 0.5;

  const arcHeightNormalized = settings.arcHeight / 100;
  const arcBreadthNormalized = settings.arcBreadth / 100;
  const amplitudeNormalized = settings.amplitude / 100;
  const roundingDistance = settings.apexRounding * 1.15 * scaleMean;

  // Ray slopes matching the reference SVG's rightward-pointing angular bend.
  const topSlopeDxDy = 0.56;
  const bottomSlopeDxDy = 0.62;
  const topRayLen = Math.hypot(topSlopeDxDy, 1);
  const bottomRayLen = Math.hypot(bottomSlopeDxDy, 1);
  const uTopX = -topSlopeDxDy / topRayLen;
  const uTopY = -1 / topRayLen;
  const uBottomX = -bottomSlopeDxDy / bottomRayLen;
  const uBottomY = 1 / bottomRayLen;

  const bleedY = Math.max(24, height * 0.04);
  const topY = -bleedY;
  const bottomY = height + bleedY;

  const reliefNormalized = settings.reliefStrength / 100;
  const foregroundStrokeWidth = Math.max(1.5, settings.lineWidth * scaleMean);
  const shadowStrokeWidth =
    foregroundStrokeWidth * (1.15 + reliefNormalized * 1.25);
  const shadowOffsetX = (3 + reliefNormalized * 13) * scaleX;
  const shadowOffsetY = (3.5 + reliefNormalized * 14) * scaleY;
  const shadowOpacity = Math.min(0.72, reliefNormalized * 0.58);
  const foregroundOpacity = 0.56 + (1 - reliefNormalized * 0.3) * 0.22;

  const isAtmospheric = settings.style !== "classic";

  const lines: WaveLineGeometry[] = [];

  for (let index = 0; index < count; index += 1) {
    const u = normalizedPositions[index] ?? (count > 1 ? index / (count - 1) : 0.5);
    const linearU = count > 1 ? index / (count - 1) : 0.5;

    // Asymmetric arc envelope extended across the entire viewport:
    // rises from far-left, peaks around u = 0.32, and sweeps down toward bottom-right.
    const crestCenter = 0.32;
    const sigma = 0.18 + arcBreadthNormalized * 0.34;
    const delta = (u - crestCenter) / sigma;
    const asymmetricBell = Math.exp(-delta * delta * (u < crestCenter ? 1.15 : 0.78));
    const downwardRamp = Math.pow(u, 1.25) * (0.48 - 0.12 * arcBreadthNormalized);

    const staticArcY =
      height *
      (0.5 +
        downwardRamp -
        arcHeightNormalized * 0.34 * (asymmetricBell - 0.25));

    // Coherent forward-traveling wave across the line sequence (0 -> 1 seamless loop).
    const waveAngle = u * Math.PI * 2 * (1.15 - 0.35 * arcBreadthNormalized) - tauPhase;
    const harmonicAngle = waveAngle * 2 + 0.55;
    const travelingWaveY =
      (Math.sin(waveAngle) * 0.82 + Math.cos(harmonicAngle) * 0.18) *
      amplitudeNormalized *
      height *
      0.16;
    const travelingWaveX =
      Math.cos(waveAngle - 0.35) *
      amplitudeNormalized *
      width *
      0.032;

    // Subtle per-line angular tilt modulation from the traveling wave.
    const localWaveSlope =
      Math.cos(waveAngle) * amplitudeNormalized * 0.08 +
      (linearU - 0.5) * 0.04;

    const apexX = startX + u * baseSpanX + travelingWaveX;
    const apexY = Math.min(
      height * 0.94,
      Math.max(height * 0.08, staticArcY + travelingWaveY),
    );

    const lineUTopX = uTopX - localWaveSlope * 0.25;
    const lineUTopY = uTopY;
    const lineUBottomX = uBottomX + localWaveSlope * 0.25;
    const lineUBottomY = uBottomY;

    const entryX = apexX + roundingDistance * lineUTopX;
    const entryY = apexY + roundingDistance * lineUTopY;
    const exitX = apexX + roundingDistance * lineUBottomX;
    const exitY = apexY + roundingDistance * lineUBottomY;

    // Extend straight rays from entry to topY and from exit to bottomY along exact tangent directions.
    const topT = (topY - entryY) / lineUTopY;
    const topX = entryX + topT * lineUTopX;

    const bottomT = (bottomY - exitY) / lineUBottomY;
    const bottomX = exitX + bottomT * lineUBottomX;

    const d = [
      `M ${formatCoord(topX)} ${formatCoord(topY)}`,
      `L ${formatCoord(entryX)} ${formatCoord(entryY)}`,
      `Q ${formatCoord(apexX)} ${formatCoord(apexY)} ${formatCoord(exitX)} ${formatCoord(exitY)}`,
      `L ${formatCoord(bottomX)} ${formatCoord(bottomY)}`,
    ].join(" ");

    const ambientIntensityNormalized = isAtmospheric
      ? settings.ambientIntensity / 100
      : 0;
    const minAlpha =
      0.32 + (foregroundOpacity - 0.32) * (1 - ambientIntensityNormalized);
    const maxAlpha =
      0.9 + (foregroundOpacity - 0.9) * (1 - ambientIntensityNormalized);
    const lineForegroundOpacity = isAtmospheric
      ? minAlpha + (maxAlpha - minAlpha) * linearU
      : foregroundOpacity;
    const lineForegroundStrokeWidth = isAtmospheric
      ? foregroundStrokeWidth * (0.85 + 0.35 * linearU)
      : foregroundStrokeWidth;
    const lineShadowOpacity = isAtmospheric
      ? shadowOpacity * (0.4 + 0.6 * linearU)
      : shadowOpacity;
    const lineShadowStrokeWidth = isAtmospheric
      ? shadowStrokeWidth * (0.9 + 0.2 * linearU)
      : shadowStrokeWidth;

    lines.push({
      apex: { x: apexX, y: apexY },
      bottom: { x: bottomX, y: bottomY },
      d,
      entry: { x: entryX, y: entryY },
      exit: { x: exitX, y: exitY },
      foregroundOpacity: lineForegroundOpacity,
      foregroundStrokeWidth: lineForegroundStrokeWidth,
      index,
      shadowOpacity: lineShadowOpacity,
      shadowStrokeWidth: lineShadowStrokeWidth,
      top: { x: topX, y: topY },
    });
  }
  const shadowColor = deriveReliefShadowColor(
    settings.background,
    settings.lineColor,
  );

  // Representative crest point for timeline/motion inspection.
  const crestX =
    centerX + Math.cos(tauPhase) * width * (0.04 + amplitudeNormalized * 0.14);
  const crestY =
    height * 0.36 +
    Math.sin(tauPhase) * height * (0.04 + amplitudeNormalized * 0.14);

  const ambientIntensityNormalized = isAtmospheric
    ? settings.ambientIntensity / 100
    : 0;
  const isLightTone = settings.ambientTone === "light";
  const lineBlendMode =
    isAtmospheric && ambientIntensityNormalized > 0.25 && !isLightTone
      ? "screen"
      : "normal";
  const hasMeshBackground = isAtmospheric && settings.includeBackground;
  const meshBaseColor = deriveAmbientBaseColor(
    settings.background,
    ambientIntensityNormalized,
    settings.ambientTone,
  );
  const meshLights = buildMeshLights({
    ambientIntensityNormalized,
    ambientTone: settings.ambientTone,
    amplitudeNormalized,
    arcBreadthNormalized,
    arcHeightNormalized,
    backgroundColor: settings.background,
    crestX,
    crestY,
    glassBlurNormalized: settings.glassBlur / 100,
    glassColor: settings.glassColor,
    harmonicColor: deriveAmbientHarmonicColor(
      settings.background,
      settings.lineColor,
    ),
    height,
    isAtmospheric,
    lineColor: settings.lineColor,
    spacing: settings.spacing,
    style: settings.style,
    tauPhase,
    width,
  });

  const hasGrain =
    isAtmospheric && settings.includeBackground && settings.grain > 0;
  const grainOpacity = hasGrain ? (settings.grain / 100) * 0.4 : 0;

  const hasFacets =
    (settings.style === "flute" || settings.style === "glass") &&
    settings.includeBackground;
  const isRefractive = settings.style === "glass";
  const facets = buildWaveFacets(
    lines,
    hasFacets,
    isRefractive,
    reliefNormalized,
    settings.lineColor,
    shadowColor,
    tauPhase,
    amplitudeNormalized,
    crestX,
    width,
  );

  return {
    ambientIntensity: settings.ambientIntensity,
    ambientTone: settings.ambientTone,
    background: settings.background,
    crestPoint: { x: crestX, y: crestY },
    facets,
    foregroundOpacity,
    foregroundStrokeWidth,
    glassBlur: settings.glassBlur,
    glassColor: settings.glassColor,
    grain: settings.grain,
    grainOpacity,
    hasGrain,
    hasMeshBackground,
    height,
    includeBackground: settings.includeBackground,
    lineBlendMode,
    lineColor: settings.lineColor,
    lines,
    meshBaseColor,
    meshLights,
    phase,
    shadowColor,
    shadowOffsetX,
    shadowOffsetY,
    shadowOpacity,
    shadowStrokeWidth,
    style: settings.style,
    width,
  };
}


function strokeWaveLinesOnCanvas(
  ctx: CanvasRenderingContext2D,
  lines: readonly WaveLineGeometry[],
  offsetX: number,
  offsetY: number,
): void {
  for (const line of lines) {
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
}

function strokeAmbientLinesOnCanvas(
  ctx: CanvasRenderingContext2D,
  lines: readonly WaveLineGeometry[],
  offsetX: number,
  offsetY: number,
  isShadow: boolean,
): void {
  for (const line of lines) {
    ctx.save();
    ctx.globalAlpha = isShadow ? line.shadowOpacity : line.foregroundOpacity;
    ctx.lineWidth = isShadow
      ? line.shadowStrokeWidth
      : line.foregroundStrokeWidth;
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
    ctx.restore();
  }
}

function drawMeshLightsOnCanvas(
  ctx: CanvasRenderingContext2D,
  scene: WaveSceneGeometry,
  offsetY = 0,
): void {
  if (!scene.hasMeshBackground || scene.meshLights.length === 0) {
    return;
  }
  const bleedX = scene.width * 0.5;
  const bleedY = scene.height * 0.5;
  ctx.save();
  ctx.fillStyle = scene.meshBaseColor;
  ctx.fillRect(-bleedX, -bleedY, scene.width * 2, scene.height * 2);
  for (const light of scene.meshLights) {
    const grad = ctx.createRadialGradient(
      light.cx,
      light.cy + offsetY,
      0,
      light.cx,
      light.cy + offsetY,
      light.r,
    );
    grad.addColorStop(0, light.coreColor ?? light.color);
    grad.addColorStop(0.25, light.color);
    grad.addColorStop(0.55, light.color);
    grad.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalAlpha = light.opacity;
    ctx.fillStyle = grad;
    ctx.fillRect(-bleedX, -bleedY, scene.width * 2, scene.height * 2);
    ctx.restore();
  }
  ctx.restore();
}

function drawWaveShadowOnCanvas(
  ctx: CanvasRenderingContext2D,
  scene: WaveSceneGeometry,
): void {
  if (scene.shadowOpacity <= 0.005) {
    return;
  }
  if (scene.style !== "classic") {
    ctx.save();
    ctx.strokeStyle = scene.shadowColor;
    strokeAmbientLinesOnCanvas(
      ctx,
      scene.lines,
      scene.shadowOffsetX,
      scene.shadowOffsetY,
      true,
    );
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = scene.shadowOpacity;
  ctx.strokeStyle = scene.shadowColor;
  ctx.lineWidth = scene.shadowStrokeWidth;
  strokeWaveLinesOnCanvas(
    ctx,
    scene.lines,
    scene.shadowOffsetX,
    scene.shadowOffsetY,
  );
  ctx.restore();
}

function drawWaveForegroundOnCanvas(
  ctx: CanvasRenderingContext2D,
  scene: WaveSceneGeometry,
): void {
  if (scene.style !== "classic") {
    ctx.save();
    if (scene.lineBlendMode === "screen") {
      ctx.globalCompositeOperation = "screen";
    }
    ctx.strokeStyle = scene.lineColor;
    strokeAmbientLinesOnCanvas(ctx, scene.lines, 0, 0, false);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.globalAlpha = scene.foregroundOpacity;
  ctx.strokeStyle = scene.lineColor;
  ctx.lineWidth = scene.foregroundStrokeWidth;
  strokeWaveLinesOnCanvas(ctx, scene.lines, 0, 0);
  ctx.restore();
}

export function renderWaveSceneToCanvas2D(
  ctx: CanvasRenderingContext2D,
  scene: WaveSceneGeometry,
  frameOrigin: Readonly<{ x: number; y: number }> = { x: 0, y: 0 },
): void {
  ctx.save();
  ctx.translate(frameOrigin.x, frameOrigin.y);
  ctx.beginPath();
  ctx.rect(0, 0, scene.width, scene.height);
  ctx.clip();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (scene.includeBackground && !scene.hasMeshBackground) {
    ctx.fillStyle = scene.background;
    ctx.fillRect(0, 0, scene.width, scene.height);
  }

  drawMeshLightsOnCanvas(ctx, scene);
  drawWaveFacetsOnCanvas(
    ctx,
    scene.facets,
    scene.lines,
    (offsetY) => drawMeshLightsOnCanvas(ctx, scene, offsetY),
  );
  drawWaveShadowOnCanvas(ctx, scene);
  drawWaveForegroundOnCanvas(ctx, scene);

  ctx.restore();
}
