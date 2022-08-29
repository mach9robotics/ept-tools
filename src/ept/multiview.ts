/**
 * Present a view of an EPT tile.
 */

import { basename, dirname } from "protopath"
import { getBinary } from "utils"
import { Bounds } from "./bounds"
import { DataType } from "./data-type"
import { Key } from "./key"
import { Schema } from "./schema"
import { View } from "./view"

/**
 * Represent a collection of view-with-bounds as a View.Readable.
 */
export class MultiView implements View.Readable {
  // Public properties
  schema: Schema
  length: number

  // Private properties
  views: View.Readable[] = []
  bounds: Bounds
  // Return (index of view, index in view) for all in-bound points.  
  // The nth point in this view is accessible via views[inBounds[n][0]].getter('Field')(inBounds[n][1])
  inBounds: [number, number][] = []
  constructor(views: View.Readable[], bounds: Bounds, schema: Schema) {
    this.schema = schema

    this.bounds = bounds
    this.views = views
    this.inBounds = []

    for (let viewIdx = 0; viewIdx < views.length; viewIdx++) {
      const view = views[viewIdx]
      for (let pointIdx = 0; pointIdx < view.length; pointIdx++) {
        // Maybe we have to use scale here?
        const x = view.getter('X')(pointIdx)
        const y = view.getter('Y')(pointIdx)
        const z = view.getter('Z')(pointIdx)
        if (Bounds.contains(bounds, [x, y, z])) {
          this.inBounds.push([viewIdx, pointIdx])
        } else {
          if (viewIdx === 0) {
            throw new Error(`Point ${pointIdx} is out of bounds: ${[x, y, z]}, bounds are: ${bounds}`)
          }
        }
      }
    }
    this.length = this.inBounds.length
  }

  getter = (name: string): (index: number) => number => {
    return (i: number) => {
      const [viewIdx, pointIdx] = this.inBounds[i]
      return this.views[viewIdx].getter(name)(pointIdx)
    }
  }
}

/**
 * Build a MultiView from an EPT tile.
 */
export async function buildMultiView(rootFilename: string, ept: {
  dataType: DataType,
  schema: Schema,
  bounds: Bounds,
}, addParents: boolean) {
  const dirName = dirname(rootFilename)
  const baseFilename = basename(rootFilename)
  const [keyString, extension] = baseFilename.split('.')

  const rootKey = Key.parse(keyString)

  const keys = [rootKey]
  if (addParents) {
    while (keys[keys.length - 1][0] !== 0) {
      keys.push(Key.parent(keys[keys.length - 1]))
    }
  }

  const viewsOrNull: (View.Readable | null)[] = await Promise.all(keys.map(async (key) => {
    const filename = `${dirName}/${Key.stringify(key)}.${extension}`;
    try {
      const buffer = await getBinary(filename)
      const view = await DataType.view(ept.dataType, buffer, ept.schema)
      return view
    }
    catch (err) {
      return null
    }
  }));

  const views = viewsOrNull.filter(view => view !== null) as View.Readable[]

  return new MultiView(views, Bounds.stepTo(ept.bounds, rootKey), ept.schema)
}