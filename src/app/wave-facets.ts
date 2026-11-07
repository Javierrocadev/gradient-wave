import type { WaveLineGeometry } from "./wave-model";

export type WaveFacetGeometry = Readonly<{
  d: string;
  fill: string;
  index: number;
  opacity: number;
}>;

function formatCoord(value: number): string {
  return value.toFixed(2);
}

export function buildWaveFacets(
  lines: readonly WaveLineGeometry[],
  isAtmospheric: boolean,
  reliefNormalized: number,
  highlightColor: string,
  shadowColor: string,
): readonly WaveFacetGeometry[] {
  if (!isAtmospheric || reliefNormalized <= 0 || lines.length < 2) {
    return [];
  }
  const facets: WaveFacetGeometry[] = [];
  const baseLightOpacity = 0.02 + 0.1 * reliefNormalized;
  const baseDarkOpacity = 0.04 + 0.16 * reliefNormalized;

  for (let i = 0; i < lines.length - 1; i += 1) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (!l1 || !l2) {
      continue;
    }
    const isEven = i % 2 === 0;
    const fill = isEven ? highlightColor : shadowColor;
    const opacity = isEven ? baseLightOpacity : baseDarkOpacity;

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
      fill,
      index: i,
      opacity,
    });
  }

  return facets;
}

export function drawWaveFacetsOnCanvas(
  ctx: CanvasRenderingContext2D,
  facets: readonly WaveFacetGeometry[],
  lines: readonly WaveLineGeometry[],
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
    ctx.globalAlpha = facet.opacity;
    ctx.fillStyle = facet.fill;
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
    ctx.fill();
    ctx.restore();
  }
}
