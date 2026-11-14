import type { Page } from "@playwright/test";

import {
  appControlSectionInventory,
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import type { ToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  commitColorControlHex,
  commitSliderControlValue,
} from "./wave-browser-test-helpers";

export async function verifyStyleConditionalSlider(
  session: ToolcraftBrowserProofSession,
  page: Page,
  target: string,
  sliderValues: readonly string[] | string,
): Promise<void> {
  const values = Array.isArray(sliderValues)
    ? sliderValues
    : [sliderValues, "82%"];
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  let visibleIndex = 0;
  await page.mouse.move(1, 1);
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("appearance.style", async (control) => {
        await control
          .getByRole("button", {
            exact: true,
            name: applicabilityCase.selectorOptionLabel!,
          })
          .click();
      }),
      applicabilityCase,
      { baseRequirementId: `control.${target}` },
    );
    if (applicabilityCase.expectation === "visible") {
      const val = values[visibleIndex % values.length]!;
      visibleIndex += 1;
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, (control, currentPage) =>
          commitSliderControlValue(control, currentPage, val),
        ),
        {
          baselineStabilityIntervalMs: 0,
          baselineStabilitySamples: 2,
          pollIntervalMs: 10,
          region: { height: 300, width: 400, x: 450, y: 200 },
          requirementId: getToolcraftApplicabilityRequirementId(
            `control.${target}`,
            applicabilityCase,
          ),
          selector: "[data-toolcraft-product-output]",
          stabilityIntervalMs: 0,
          stabilitySamples: 2,
        },
      );
    }
  }
}

export async function verifyStyleConditionalColor(
  session: ToolcraftBrowserProofSession,
  page: Page,
  target: string,
  colorHex: string,
): Promise<void> {
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("appearance.style", async (control) => {
        await control
          .getByRole("button", {
            exact: true,
            name: applicabilityCase.selectorOptionLabel!,
          })
          .click();
      }),
      applicabilityCase,
      { baseRequirementId: `control.${target}` },
    );
    if (applicabilityCase.expectation === "visible") {
      await page.mouse.move(1, 1);
      await expectToolcraftProductObservableToChange(
        session,
        session.controlAction(target, (control) =>
          commitColorControlHex(control, colorHex),
        ),
        {
          baselineStabilityIntervalMs: 10,
          baselineStabilitySamples: 2,
          requirementId: getToolcraftApplicabilityRequirementId(
            `control.${target}`,
            applicabilityCase,
          ),
          stabilityIntervalMs: 10,
          stabilitySamples: 2,
        },
      );
    }
  }
}
