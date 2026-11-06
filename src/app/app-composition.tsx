import { composeToolcraftApp } from "@/toolcraft/runtime/react";

import { appSchema } from "./app-schema";
import { waveRendererPipeline } from "./wave-pipeline";
import {
  GradientWaveScene,
  waveRasterFrameRenderer,
  waveSceneBoundsProvider,
} from "./wave-renderer";

export const appComposition = composeToolcraftApp(appSchema, {
  renderer: {
    pipelineRegistration: waveRendererPipeline,
  },
  scene: {
    canvasContent: <GradientWaveScene />,
    rasterFrameRenderer: waveRasterFrameRenderer,
    renderDefaultCanvasMedia: false,
    sceneBoundsProvider: waveSceneBoundsProvider,
  },
});
