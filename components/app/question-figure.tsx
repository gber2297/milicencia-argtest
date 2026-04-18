"use client"

import Image from "next/image"

interface QuestionFigureProps {
  src: string
  /** Por defecto: texto de la pregunta como descripción breve para lectores de pantalla */
  alt: string
}

/** Imagen de enunciado (señal, cartel, croquis). Rutas `/...` o URLs absolutas. */
export function QuestionFigure({ src, alt }: QuestionFigureProps) {
  const caption = alt.length > 120 ? `${alt.slice(0, 117)}…` : alt

  return (
    <figure className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-b from-zinc-50/90 to-white shadow-inner shadow-zinc-900/5">
      <div className="relative aspect-[16/10] w-full max-h-72 min-h-[140px] sm:max-h-80">
        <Image
          src={src}
          alt={caption}
          fill
          className="object-contain p-3 sm:p-4"
          sizes="(max-width: 768px) 100vw, 42rem"
        />
      </div>
    </figure>
  )
}
