import { readFile } from "fs/promises"
import { join } from "path"

import { NextResponse } from "next/server"

export async function GET() {
  try {
    const raw = await readFile(join(process.cwd(), "src", "data", "voice-segment-frames.json"), "utf8")
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: "voice-segment-frames.json no generado aún" }, { status: 404 })
  }
}
