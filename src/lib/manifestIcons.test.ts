import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

// Valida que public/manifest.json só referencia ícones que de fato existem em
// public/assets/ com as dimensões declaradas — evita regressão como a
// original (nome dizia "512" mas o arquivo era 1024x1024, e faltavam
// variantes 192x192/maskable).
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const PUBLIC_DIR = path.join(REPO_ROOT, 'public')

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

interface Manifest {
  icons: ManifestIcon[]
  shortcuts?: Array<{ icons?: ManifestIcon[] }>
}

function loadManifest(): Manifest {
  const raw = readFileSync(path.join(PUBLIC_DIR, 'manifest.json'), 'utf-8')
  return JSON.parse(raw) as Manifest
}

function resolvePublicAsset(src: string): string {
  // src no manifest é sempre um caminho absoluto de site (ex. "/assets/foo.png")
  expect(src.startsWith('/')).toBe(true)
  return path.join(PUBLIC_DIR, src)
}

describe('public/manifest.json icons', () => {
  const manifest = loadManifest()
  const allIconEntries: ManifestIcon[] = [
    ...manifest.icons,
    ...(manifest.shortcuts?.flatMap((shortcut) => shortcut.icons ?? []) ?? []),
  ]

  it('declares at least one icon', () => {
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  it('has an "any" purpose icon at 192x192 and at 512x512', () => {
    const anyIcons = manifest.icons.filter((icon) => icon.purpose === 'any')
    expect(anyIcons.some((icon) => icon.sizes === '192x192')).toBe(true)
    expect(anyIcons.some((icon) => icon.sizes === '512x512')).toBe(true)
  })

  it('has a "maskable" purpose icon at 192x192 and at 512x512', () => {
    const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable')
    expect(maskableIcons.some((icon) => icon.sizes === '192x192')).toBe(true)
    expect(maskableIcons.some((icon) => icon.sizes === '512x512')).toBe(true)
  })

  it.each(allIconEntries.map((icon) => [icon.src, icon] as const))(
    'file referenced by %s exists on disk',
    (_src, icon) => {
      const filePath = resolvePublicAsset(icon.src)
      expect(existsSync(filePath)).toBe(true)
    },
  )

  it.each(allIconEntries.map((icon) => [icon.src, icon] as const))(
    'file referenced by %s matches its declared "sizes" dimensions',
    async (_src, icon) => {
      const filePath = resolvePublicAsset(icon.src)
      const [declaredWidth, declaredHeight] = icon.sizes.split('x').map(Number)
      const metadata = await sharp(filePath).metadata()
      expect(metadata.width).toBe(declaredWidth)
      expect(metadata.height).toBe(declaredHeight)
    },
  )

  it('maskable icons are fully opaque (no transparency) as required by the spec', async () => {
    const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable')
    expect(maskableIcons.length).toBeGreaterThan(0)

    for (const icon of maskableIcons) {
      const filePath = resolvePublicAsset(icon.src)
      const { data, info } = await sharp(filePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
      let minAlpha = 255
      for (let i = 3; i < data.length; i += info.channels) {
        if (data[i] < minAlpha) minAlpha = data[i]
      }
      expect(minAlpha).toBe(255)
    }
  })
})
