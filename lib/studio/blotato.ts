/**
 * Cliente mínimo para Blotato (subida de MP4 + post).
 * Requiere BLOTATO_API_KEY. BLOTATO_ACCOUNT_ID opcional.
 */

import path from "path"

const BLOTATO_BASE = "https://backend.blotato.com/v2"

export interface BlotatoUploadResult {
  publicUrl: string
  postId?: string
}

/** POST /v2/media/uploads exige `filename` en el body (p. ej. `video.mp4`). */
export async function requestPresignedUpload(filename: string): Promise<{ presignedUrl: string; publicUrl: string }> {
  const key = process.env.BLOTATO_API_KEY
  if (!key) throw new Error("BLOTATO_API_KEY no configurada")

  const safeName = path.basename(filename || "video.mp4").trim() || "video.mp4"

  const res = await fetch(`${BLOTATO_BASE}/media/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "blotato-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: safeName }),
  })
  if (!res.ok) throw new Error(`Blotato uploads: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { presignedUrl: string; publicUrl: string }
  if (!data.presignedUrl || !data.publicUrl) throw new Error("Respuesta Blotato inválida")
  return data
}

export async function putFileToPresignedUrl(
  presignedUrl: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    body: new Uint8Array(fileBuffer),
    headers: { "Content-Type": contentType },
  })
  if (!res.ok) throw new Error(`PUT presigned: ${res.status}`)
}

export async function resolveAccountId(platform: string): Promise<string | undefined> {
  const explicit = process.env.BLOTATO_ACCOUNT_ID?.trim()
  if (explicit) return explicit

  const key = process.env.BLOTATO_API_KEY
  if (!key) return undefined

  const res = await fetch(`${BLOTATO_BASE}/users/me/accounts`, {
    headers: { Authorization: `Bearer ${key}`, "blotato-api-key": key },
  })
  if (!res.ok) return undefined
  const data = (await res.json()) as { accounts?: { id: string; platform?: string; name?: string }[] }
  const accounts = data.accounts ?? []
  const p = platform.toLowerCase()
  const hit =
    accounts.find((a) => a.platform?.toLowerCase().includes(p)) ??
    accounts.find((a) => a.name?.toLowerCase().includes(p))
  return hit?.id
}

export interface CreatePostInput {
  accountId: string
  caption: string
  mediaUrls: string[]
  platform: string
  /** TikTok, YouTube Shorts, etc. */
  target?: Record<string, unknown>
}

function blotatoBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

/**
 * Blotato exige estos campos en `post.target` para TikTok (v2).
 * Opcional: BLOTATO_TIKTOK_PRIVACY_LEVEL. `isAiGenerated` por defecto false (solo true si lo pasás en `target`).
 */
function buildBlotatoTarget(platform: string, extra: Record<string, unknown>): Record<string, unknown> {
  const p = platform.toLowerCase()

  if (p !== "tiktok") {
    const targetType =
      typeof extra.targetType === "string" && extra.targetType ? extra.targetType : platform
    return { ...extra, targetType }
  }

  const privacyDefault =
    process.env.BLOTATO_TIKTOK_PRIVACY_LEVEL?.trim() || "PUBLIC_TO_EVERYONE"
  const privacy =
    typeof extra.privacyLevel === "string" && extra.privacyLevel.trim()
      ? extra.privacyLevel.trim()
      : privacyDefault

  return {
    targetType: "tiktok",
    privacyLevel: privacy,
    disabledComments: blotatoBool(extra.disabledComments, false),
    disabledDuet: blotatoBool(extra.disabledDuet, false),
    disabledStitch: blotatoBool(extra.disabledStitch, false),
    isBrandedContent: blotatoBool(extra.isBrandedContent, false),
    isYourBrand: blotatoBool(extra.isYourBrand, false),
    isAiGenerated: blotatoBool(extra.isAiGenerated, false),
  }
}

/**
 * Formato v2: https://help.blotato.com/api/start — body debe incluir `post` con
 * `content` (text, mediaUrls, platform) y `target` (p. ej. TikTok con campos obligatorios).
 */
export async function createBlotatoPost(input: CreatePostInput): Promise<{ id?: string }> {
  const key = process.env.BLOTATO_API_KEY
  if (!key) throw new Error("BLOTATO_API_KEY no configurada")

  const target = buildBlotatoTarget(input.platform, input.target ?? {})

  const res = await fetch(`${BLOTATO_BASE}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "blotato-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post: {
        accountId: input.accountId,
        content: {
          text: input.caption,
          mediaUrls: input.mediaUrls,
          platform: input.platform,
        },
        target,
      },
    }),
  })
  if (!res.ok) throw new Error(`Blotato posts: ${res.status} ${await res.text()}`)
  const raw = (await res.json()) as { id?: string; post?: { id?: string } }
  return { id: raw.id ?? raw.post?.id }
}

export async function uploadLocalMp4ToBlotato(opts: {
  filePath: string
  caption: string
  /** tiktok | instagram | youtube | … */
  platform: string
  readFile: (path: string) => Promise<Buffer>
}): Promise<BlotatoUploadResult> {
  const buf = await opts.readFile(opts.filePath)
  const { presignedUrl, publicUrl } = await requestPresignedUpload(path.basename(opts.filePath))
  await putFileToPresignedUrl(presignedUrl, buf, "video/mp4")

  const accountId = await resolveAccountId(opts.platform)
  if (!accountId) {
    return { publicUrl }
  }

  const post = await createBlotatoPost({
    accountId,
    caption: opts.caption,
    mediaUrls: [publicUrl],
    platform: opts.platform,
  })

  return { publicUrl, postId: post.id }
}
