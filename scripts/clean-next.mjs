import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { setTimeout } from "node:timers/promises"

const root = process.cwd()
const target = path.join(root, ".next")

function exists() {
  try {
    fs.accessSync(target)
    return true
  } catch {
    return false
  }
}

function removeWithCmd() {
  execFileSync("cmd.exe", ["/d", "/c", `rmdir /s /q "${target}"`], {
    stdio: "inherit",
    windowsHide: true,
  })
}

async function removeWithFsRetries(maxAttempts) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true })
      return true
    } catch (error) {
      const code = /** @type {NodeJS.ErrnoException} */ (error).code
      if ((code === "EPERM" || code === "EBUSY") && attempt < maxAttempts) {
        await setTimeout(800 * attempt)
        continue
      }
      throw error
    }
  }
  return false
}

async function run() {
  if (!exists()) {
    console.log("No hay carpeta .next (nada que borrar).")
    return
  }

  if (process.platform === "win32") {
    try {
      removeWithCmd()
      if (!exists()) {
        console.log(`Eliminado: ${target}`)
        return
      }
    } catch {
      console.log("rmdir de Windows no pudo borrar todo; probando con Node…")
    }
  }

  try {
    await removeWithFsRetries(5)
    if (!exists()) {
      console.log(`Eliminado: ${target}`)
      return
    }
  } catch (error) {
    const code = /** @type {NodeJS.ErrnoException} */ (error).code
    console.error("No se pudo borrar .next:", error)
    if (code === "EPERM" || code === "EBUSY") {
      console.error(
        [
          "Algún proceso sigue usando archivos dentro de .next (casi siempre es Node / next dev).",
          "1) Cerrá la terminal donde corre npm run dev.",
          "2) En el Administrador de tareas, finalizá procesos 'Node.js JavaScript Runtime' que correspondan al proyecto.",
          "3) Si sigue igual: reiniciá el PC o pausá el antivirus un momento en esa carpeta.",
          "4) Volvé a ejecutar: npm run clean:next",
        ].join("\n"),
      )
    }
    process.exitCode = 1
  }
}

await run()
