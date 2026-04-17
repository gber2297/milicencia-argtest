import { useLayoutEffect } from "react"
import { continueRender, delayRender } from "remotion"

/**
 * Evita capturar frames antes de que las fuentes web (p. ej. Inter) estén listas en Chromium headless.
 */
export const WaitForFonts = () => {
  useLayoutEffect(() => {
    const handle = delayRender("fonts")
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      continueRender(handle)
    }
    const timeout = setTimeout(done, 10_000)
    void document.fonts.ready.then(() => {
      clearTimeout(timeout)
      done()
    })
  }, [])
  return null
}
