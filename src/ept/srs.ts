import { Schema } from 'ajv'
import wktParser from 'wkt-parser'

export type Srs = {
  wkt?: string
  authority?: string
  horizontal?: string
  vertical?: string
}

const schema: Schema = {
  title: 'Spatial reference',
  description: 'Spatial reference codes and WKT',
  type: 'object',
  properties: {
    authority: { type: 'string' },
    horizontal: { type: 'string' },
    vertical: { type: 'string' },
    wkt: { type: 'string' },
  },
  dependencies: {
    authority: ['horizontal'],
    horizontal: ['authority'],
    vertical: ['horizontal'],
  },
}

export const Srs = { schema, codeString, horizontalCodeString }

function horizontalCodeString(srs: Srs = {}): string | undefined {
  const { authority, horizontal, wkt } = srs
  if (authority && horizontal) return `${authority}:${horizontal}`
  if (wkt) {
    const parsed = wktParser(wkt)
    if ('AUTHORITY' in parsed) {
      if ('EPSG' in parsed.AUTHORITY) {
        return `EPSG:${parsed.AUTHORITY.EPSG}`
      }
    }
  }
}

function codeString(srs: Srs = {}): string | undefined {
  const { authority, horizontal, vertical } = srs
  if (authority && horizontal) {
    if (vertical) return `${authority}:${horizontal}+${vertical}`
    return `${authority}:${horizontal}`
  }
}
