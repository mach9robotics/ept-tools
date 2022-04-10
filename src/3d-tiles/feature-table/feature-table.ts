import { Params } from '3d-tiles/types'
import { padEnd, sumLengths } from '3d-tiles/utils'
import Draco3d from 'draco3d'
import { Bounds, Schema } from 'ept'
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

async function create({ view, tileBounds, toEcef, options }: Params): Promise<FeatureTable> {
  const bounds = Bounds.reproject(
    Bounds.offsetHeight(tileBounds, options.zOffset || 0),
    toEcef
  )

  const header: Header = {
    POINTS_LENGTH: view.length,
    RTC_CENTER: Bounds.mid(bounds),
    POSITION: { byteOffset: 0 },
  }

  if (options.compress) {
    // Sadly, Draco3d's DefinitelyTyped specifications don't include the PointCloudBuilder
    const encoderModule = await Draco3d.createEncoderModule();
    const encoder = new encoderModule.Encoder();
    // const pcBuilder = new encoderModule.PointCloudBuilder();

    header.extensions = {
      "3DTILES_draco_point_compression": {
        byteOffset: 0,
        byteLength: 0, // TODO
        properties: {},
      }
    }
  }

  const buffers = [Xyz.create({ view, tileBounds, toEcef, options })]

  const has = (name: string) => Schema.has(view.schema, name)

  if (has('Red') && has('Green') && has('Blue')) {
    header.RGB = { byteOffset: sumLengths(buffers) }
    buffers.push(Rgb.create({ view, options }))
  }

  const binary = padEnd(Buffer.concat(buffers))
  return { header, binary }
}
