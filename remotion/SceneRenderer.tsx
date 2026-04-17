import type { StudioScene, VideoRuntime } from "@/types/studio"
import { CtaScene } from "@/remotion/scenes/CtaScene"
import { ExplanationScene } from "@/remotion/scenes/ExplanationScene"
import { FinalCardScene } from "@/remotion/scenes/FinalCardScene"
import { HookScene } from "@/remotion/scenes/HookScene"
import { OptionsScene } from "@/remotion/scenes/OptionsScene"
import { PauseScene } from "@/remotion/scenes/PauseScene"
import { QuestionScene } from "@/remotion/scenes/QuestionScene"
import { RevealScene } from "@/remotion/scenes/RevealScene"
import { ScreenshotFocusScene } from "@/remotion/scenes/ScreenshotFocusScene"

interface SceneRendererProps {
  scene: StudioScene
  runtime: VideoRuntime
}

export const SceneRenderer = ({ scene, runtime }: SceneRendererProps) => {
  const { branding, cta, finalCard } = runtime
  const appQuizUi = runtime.videoType === "quiz"
  /** HTML+Tailwind “app chrome” para todos los tipos salvo quiz */
  const appSimulatedUi = runtime.videoType !== "quiz"

  switch (scene.type) {
    case "hook":
      return <HookScene scene={scene} branding={branding} appSimulatedUi={appSimulatedUi} />
    case "question":
      return (
        <QuestionScene
          scene={scene}
          branding={branding}
          appQuizUi={appQuizUi}
          appSimulatedUi={appSimulatedUi}
        />
      )
    case "options":
      return (
        <OptionsScene
          scene={scene}
          branding={branding}
          appQuizUi={appQuizUi}
          appSimulatedUi={appSimulatedUi}
        />
      )
    case "pause":
      return (
        <PauseScene scene={scene} branding={branding} appQuizUi={appQuizUi} appSimulatedUi={appSimulatedUi} />
      )
    case "reveal":
      return (
        <RevealScene scene={scene} branding={branding} appQuizUi={appQuizUi} appSimulatedUi={appSimulatedUi} />
      )
    case "explanation":
      return (
        <ExplanationScene
          scene={scene}
          branding={branding}
          appQuizUi={appQuizUi}
          appSimulatedUi={appSimulatedUi}
        />
      )
    case "cta":
      return <CtaScene scene={scene} branding={branding} cta={cta} appSimulatedUi={appSimulatedUi} />
    case "final_card":
      return <FinalCardScene scene={scene} branding={branding} finalCard={finalCard} appSimulatedUi={appSimulatedUi} />
    case "screenshot_focus":
      return <ScreenshotFocusScene scene={scene} branding={branding} appSimulatedUi={appSimulatedUi} />
    default:
      return <HookScene scene={scene} branding={branding} />
  }
}
