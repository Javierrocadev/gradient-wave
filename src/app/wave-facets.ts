import type { WaveLineGeometry, WaveMeshLight } from "./wave-model";

export type WaveFacetGeometry = Readonly<{
  d: string;
  displacementY: number;
  fill: string;
  index: number;
  isRefractive: boolean;
  opacity: number;
}>;

function formatCoord(value: number): string {
  return value.toFixed(2);
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

export function deriveAmbientBaseColor(
  background: string,
  ambientIntensityNormalized: number,
  tone: "dark" | "light" = "dark",
): string {
  const [bgR, bgG, bgB] = parseHexRgb(background);
  if (tone === "light") {
    const blend = 0.68 * ambientIntensityNormalized;
    const r = bgR + (255 - bgR) * blend;
    const g = bgG + (255 - bgG) * blend;
    const b = bgB + (255 - bgB) * blend;
    return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
  }
  const factorR = 1 - (1 - 0.12) * ambientIntensityNormalized;
  const factorG = 1 - (1 - 0.14) * ambientIntensityNormalized;
  const factorB = 1 - (1 - 0.18) * ambientIntensityNormalized;
  return `#${toHexChannel(bgR * factorR)}${toHexChannel(bgG * factorG)}${toHexChannel(bgB * factorB)}`;
}

export function deriveAmbientHarmonicColor(
  background: string,
  lineColor: string,
): string {
  const [bgR, bgG, bgB] = parseHexRgb(background);
  const [fgR, fgG, fgB] = parseHexRgb(lineColor);
  const hR = Math.min(255, Math.round(bgR * 0.5 + fgR * 0.5));
  const hG = Math.min(255, Math.round(bgG * 0.5 + fgG * 0.5));
  const hB = Math.min(255, Math.round(bgB * 0.5 + fgB * 0.5));
  return `#${toHexChannel(hR)}${toHexChannel(hG)}${toHexChannel(hB)}`;
}

export function buildMeshLights(params: {
  ambientIntensityNormalized: number;
  ambientTone?: "dark" | "light";
  amplitudeNormalized: number;
  arcBreadthNormalized: number;
  arcHeightNormalized: number;
  backgroundColor: string;
  crestX: number;
  crestY: number;
  glassBlurNormalized: number;
  glassColor: string;
  harmonicColor: string;
  height: number;
  isAtmospheric: boolean;
  lineColor: string;
  spacing: number;
  style: string;
  tauPhase: number;
  width: number;
}): WaveMeshLight[] {
  if (!params.isAtmospheric || params.ambientIntensityNormalized <= 0.005) return [];
  const intensity = params.ambientIntensityNormalized;
  if (params.style === "glass") {
    const orbRadius =
      Math.min(params.width, params.height) *
      (0.16 + params.glassBlurNormalized * 0.32);
    return [
      {
        color: params.harmonicColor,
        cx: params.width * 0.5,
        cy: params.height * 0.5,
        opacity: 0.35 * intensity,
        r: Math.max(params.width, params.height) * 0.75,
      },
      {
        color: params.glassColor,
        coreColor: params.glassColor,
        cx: params.crestX,
        cy: params.height * 0.54 + Math.sin(params.tauPhase) * params.height * 0.08,
        opacity: 0.92 * intensity,
        r: orbRadius,
      },
      {
        color: params.backgroundColor,
        cx: params.width * 0.2,
        cy: params.height * 0.8,
        opacity: 0.5 * intensity,
        r: Math.max(params.width, params.height) * 0.45,
      },
    ];
  }
  return [
    {
      color: params.lineColor,
      cx: params.crestX,
      cy: params.crestY,
      opacity: 0.45 * intensity,
      r: Math.max(params.width, params.height) * (0.5 + params.arcBreadthNormalized * 0.25),
    },
    {
      color: params.backgroundColor,
      cx: params.width * (0.15 + 0.1 * params.arcBreadthNormalized),
      cy: params.height * (0.75 - 0.1 * params.arcHeightNormalized),
      opacity: 0.55 * intensity,
      r: Math.max(params.width, params.height) * (0.5 + 0.2 * (params.spacing / 100)),
    },
    {
      color: params.harmonicColor,
      cx: params.width * 0.82,
      cy: params.height * (0.65 - 0.15 * params.amplitudeNormalized),
      opacity: 0.38 * intensity,
      r: Math.max(params.width, params.height) * 0.6,
    },
  ];
}

export function buildWaveFacets(
  lines: readonly WaveLineGeometry[],
  hasFacets: boolean,
  isRefractive: boolean,
  reliefNormalized: number,
  highlightColor: string,
  shadowColor: string,
  tauPhase = 0,
  amplitudeNormalized = 0.5,
  crestX = 600,
  artboardWidth = 1200,
): readonly WaveFacetGeometry[] {
  if (!hasFacets || reliefNormalized <= 0 || lines.length < 2) {
    return [];
  }
  const facets: WaveFacetGeometry[] = [];
  const baseLightOpacity = isRefractive
    ? 0.04 + 0.12 * reliefNormalized
    : 0.02 + 0.1 * reliefNormalized;
  const baseDarkOpacity = isRefractive
    ? 0.06 + 0.18 * reliefNormalized
    : 0.04 + 0.16 * reliefNormalized;

  for (let i = 0; i < lines.length - 1; i += 1) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (!l1 || !l2) {
      continue;
    }
    const isEven = i % 2 === 0;
    const fill = isEven ? highlightColor : shadowColor;
    const opacity = isEven ? baseLightOpacity : baseDarkOpacity;

    let displacementY = 0;
    if (isRefractive) {
      const facetCenterX = (l1.apex.x + l2.apex.x) * 0.5;
      const distFromCrest = (facetCenterX - crestX) / (artboardWidth * 0.35);
      // Secondary expansion ripple: like concentric ripples expanding outward from a water droplet
      const ripplePhase = tauPhase * 2 - Math.abs(distFromCrest) * 4.2;
      const rippleExpansion =
        Math.sin(ripplePhase) * (14 + amplitudeNormalized * 18);
      // Prismatic fluted step with smooth, balanced vertical displacement
      const prismaticStep = (isEven ? 1 : -1) * (16 + reliefNormalized * 22);
      displacementY = prismaticStep + rippleExpansion;
    }

    const d = [
      `M ${formatCoord(l1.top.x)} ${formatCoord(l1.top.y)}`,
      `L ${formatCoord(l1.entry.x)} ${formatCoord(l1.entry.y)}`,
      `Q ${formatCoord(l1.apex.x)} ${formatCoord(l1.apex.y)} ${formatCoord(l1.exit.x)} ${formatCoord(l1.exit.y)}`,
      `L ${formatCoord(l1.bottom.x)} ${formatCoord(l1.bottom.y)}`,
      `L ${formatCoord(l2.bottom.x)} ${formatCoord(l2.bottom.y)}`,
      `L ${formatCoord(l2.exit.x)} ${formatCoord(l2.exit.y)}`,
      `Q ${formatCoord(l2.apex.x)} ${formatCoord(l2.apex.y)} ${formatCoord(l2.entry.x)} ${formatCoord(l2.entry.y)}`,
      `L ${formatCoord(l2.top.x)} ${formatCoord(l2.top.y)}`,
      "Z",
    ].join(" ");

    facets.push({
      d,
      displacementY,
      fill,
      index: i,
      isRefractive,
      opacity,
    });
  }

  return facets;
}

export function drawWaveFacetsOnCanvas(
  ctx: CanvasRenderingContext2D,
  facets: readonly WaveFacetGeometry[],
  lines: readonly WaveLineGeometry[],
  drawMeshBackground?: (offsetY: number) => void,
): void {
  if (facets.length === 0 || lines.length < 2) {
    return;
  }
  for (let i = 0; i < facets.length; i += 1) {
    const facet = facets[i];
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (!facet || !l1 || !l2) {
      continue;
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(l1.top.x, l1.top.y);
    ctx.lineTo(l1.entry.x, l1.entry.y);
    ctx.quadraticCurveTo(l1.apex.x, l1.apex.y, l1.exit.x, l1.exit.y);
    ctx.lineTo(l1.bottom.x, l1.bottom.y);
    ctx.lineTo(l2.bottom.x, l2.bottom.y);
    ctx.lineTo(l2.exit.x, l2.exit.y);
    ctx.quadraticCurveTo(l2.apex.x, l2.apex.y, l2.entry.x, l2.entry.y);
    ctx.lineTo(l2.top.x, l2.top.y);
    ctx.closePath();
    ctx.clip();

    if (facet.isRefractive && drawMeshBackground && facet.displacementY !== 0) {
      ctx.save();
      if ("filter" in ctx) {
        ctx.filter = "blur(16px)";
      }
      drawMeshBackground(facet.displacementY);
      ctx.restore();
    }

    ctx.globalAlpha = facet.opacity;
    ctx.fillStyle = facet.fill;
    ctx.fill();
    ctx.restore();
  }
}
