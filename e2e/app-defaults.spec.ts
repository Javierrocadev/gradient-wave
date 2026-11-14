import { expect, test } from "@playwright/test";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { getToolcraftProductObservableSnapshot } from "./product-observable-helpers";

test("browser: supplied defaults start paused and Reset restores their rendered composition", async ({ page }) => {
  await page.goto("/");
  const output = page.getByTestId("gradient-wave-svg");
  await expect(output).toBeVisible({ timeout: 15_000 });
  await expect(output).toHaveAttribute("data-wave-style", "flute");
  await expect(output).toHaveAttribute("data-wave-background", "#980b0b");
  await expect(output).toHaveAttribute("data-wave-line-color", "#ffffff");
  await expect(page.getByTestId("gradient-wave-foreground-path")).toHaveCount(16);
  await expect(page.getByRole("button", { name: "Play playback", exact: true })).toBeVisible();

  const width = (await getToolcraftControlFieldByTarget(page, "canvas.size.width")).locator("input");
  const height = (await getToolcraftControlFieldByTarget(page, "canvas.size.height")).locator("input");
  await expect(width).toHaveValue("1200");
  await expect(height).toHaveValue("700");
  // Sample an unobstructed product region, excluding the floating controls panel.
  const pixelSnapshot = () => getToolcraftProductObservableSnapshot(page, {
    region: { x: 200, y: 150, width: 300, height: 300 },
    selector: '[data-testid="gradient-wave-svg"]',
  });
  const baseline = await pixelSnapshot();
  const phase = await output.getAttribute("data-wave-phase");
  expect(phase).toBe((1.5784000000058303 / 6).toFixed(4));

  const style = await getToolcraftControlFieldByTarget(page, "appearance.style");
  await style.getByRole("button", { name: "Classic", exact: true }).click();
  await expect(output).toHaveAttribute("data-wave-style", "classic");
  expect(await pixelSnapshot()).not.toBe(baseline);
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  await expect(output).toHaveAttribute("data-wave-style", "flute");
  await expect(output).toHaveAttribute("data-wave-phase", phase!);
  await expect(page.getByRole("button", { name: "Play playback", exact: true })).toBeVisible();
  await expect.poll(pixelSnapshot).toBe(baseline);
});
