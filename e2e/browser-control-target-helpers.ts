import { expect, type Locator, type Page } from "@playwright/test";

const TOOLCRAFT_APP_ROOT_SELECTOR = '[data-slot="toolcraft-runtime-app"]';
const TOOLCRAFT_CONTROL_TARGET_BOUNDARY_SELECTOR = [
  "[data-toolcraft-control-target]",
  "[data-toolcraft-control-targets]",
].join(", ");

function parseTargetList(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

type ToolcraftControlOwnerMatch = {
  boundaryIndex: number;
  fieldIndex?: number;
};

async function findToolcraftControlOwnerMatches(
  page: Page,
  normalizedTarget: string,
): Promise<{
  boundaries: Locator;
  matches: ToolcraftControlOwnerMatch[];
}> {
  const boundaries = page
    .locator(TOOLCRAFT_APP_ROOT_SELECTOR)
    .locator(TOOLCRAFT_CONTROL_TARGET_BOUNDARY_SELECTOR);
  const matches = await page.evaluate(
    ({ rootSelector, boundarySelector, target }) => {
      const root = document.querySelector(rootSelector);
      if (!root) return [];
      const allBoundaries = root.querySelectorAll(boundarySelector);
      const results: Array<{ boundaryIndex: number; fieldIndex?: number }> = [];
      for (let i = 0; i < allBoundaries.length; i++) {
        const b = allBoundaries[i];
        const single = b.getAttribute("data-toolcraft-control-target");
        if (single === target) {
          results.push({ boundaryIndex: i });
          continue;
        }
        const grouped = b.getAttribute("data-toolcraft-control-targets");
        if (grouped) {
          try {
            const list = JSON.parse(grouped);
            if (Array.isArray(list)) {
              const idx = list.indexOf(target);
              if (idx >= 0) results.push({ boundaryIndex: i, fieldIndex: idx });
            }
          } catch {}
        }
      }
      return results;
    },
    {
      rootSelector: TOOLCRAFT_APP_ROOT_SELECTOR,
      boundarySelector: TOOLCRAFT_CONTROL_TARGET_BOUNDARY_SELECTOR,
      target: normalizedTarget,
    },
  );

  return { boundaries, matches };
}

function normalizeTarget(target: string): string {
  const normalizedTarget = target.trim();
  if (!normalizedTarget) {
    throw new Error("A target-scoped browser action requires a non-empty schema target.");
  }
  return normalizedTarget;
}

export async function countToolcraftControlOwnersByTarget(
  page: Page,
  target: string,
): Promise<number> {
  const { matches } = await findToolcraftControlOwnerMatches(
    page,
    normalizeTarget(target),
  );
  return matches.length;
}

export async function getToolcraftControlFieldByTarget(
  page: Page,
  target: string,
): Promise<Locator> {
  const normalizedTarget = normalizeTarget(target);
  const { boundaries, matches } = await findToolcraftControlOwnerMatches(
    page,
    normalizedTarget,
  );

  if (matches.length !== 1) {
    throw new Error(
      `A target-scoped browser action requires exactly one rendered control owner for schema target "${normalizedTarget}"; found ${matches.length}.`,
    );
  }

  const [match] = matches;
  const boundary = boundaries.nth(match.boundaryIndex);
  const fields = boundary.locator('[data-slot="field"]');
  const control =
    match.fieldIndex === undefined
      ? (await fields.count()) > 0
        ? fields.first()
        : boundary
      : fields.nth(match.fieldIndex);
  await expect(
    control,
    `The rendered control for schema target "${normalizedTarget}" must be visible.`,
  ).toBeVisible();
  return control;
}

/** Includes every item field of a compound/collection control, not only the first Field. */
export async function getToolcraftControlOwnerByTarget(
  page: Page,
  target: string,
): Promise<Locator> {
  const normalizedTarget = normalizeTarget(target);
  const { boundaries, matches } = await findToolcraftControlOwnerMatches(page, normalizedTarget);
  if (matches.length !== 1) {
    throw new Error(`Vector proof requires exactly one rendered control owner for schema target "${normalizedTarget}"; found ${matches.length}.`);
  }
  const [match] = matches;
  const owner = match.fieldIndex === undefined
    ? boundaries.nth(match.boundaryIndex)
    : boundaries.nth(match.boundaryIndex).locator('[data-slot="field"]').nth(match.fieldIndex);
  await expect(owner).toBeVisible();
  return owner;
}
