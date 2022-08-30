import { Forager } from 'forager'

const binaries: {
  [key: string]: {
    path: string,
    data: Buffer,
  }
} = {}

export async function getBinary(path: string, optionalCacheKey?: string) {
  if (optionalCacheKey) {
    const cached = binaries[optionalCacheKey]
    if (cached && cached.path === path) {
      return cached.data
    } else {
      const data = await Forager.read(path)
      binaries[optionalCacheKey] = { path, data }
      return data
    }
  } else {
    return Forager.read(path)
  }
}

export async function getJson(path: string): Promise<unknown> {
  return Forager.readJson(path)
}

export async function isReadable(path: string) {
  try {
    await Forager.read(path)
    return true
  } catch (e) {
    return false
  }
}
