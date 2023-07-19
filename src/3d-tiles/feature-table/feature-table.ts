import { Params } from '3d-tiles/types'
import { padEnd, sumLengths } from '3d-tiles/utils'
import { Schema } from 'ept'
import { CartesianBounds } from 'ept/cartesianBounds'

import { Header } from './header'
import { Rgb } from './rgb'
import { Xyz } from './xyz'

// Work around TS namespaced re-export deficiency.
type _Header = Header
export declare namespace FeatureTable {
  export type Header = _Header
}

export type FeatureTable = { header: Header; binary: Buffer }
export const FeatureTable = { create }

function create({ view, tileBounds, options }: Params): FeatureTable {
  const bounds = CartesianBounds.offsetHeight(tileBounds, options.zOffset || 0);
  const header: Header = {
    POINTS_LENGTH: view.length,
    RTC_CENTER: CartesianBounds.mid(bounds),
    POSITION: { byteOffset: 0 },
  }

  const buffers = [Xyz.create({ view, tileBounds, options })]

  const has = (name: string) => Schema.has(view.schema, name)

  if (has('Red') && has('Green') && has('Blue')) {
    header.RGB = { byteOffset: sumLengths(buffers) }
    buffers.push(Rgb.create({ view, options }))
  }

  const binary = padEnd(Buffer.concat(buffers))
  return { header, binary }
}
