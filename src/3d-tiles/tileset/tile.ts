import { BoundingVolume } from '3d-tiles/bounding-volume'
import { Hierarchy, Key, Step } from 'ept'
import { CartesianBounds } from 'ept/cartesianBounds'


const steps: Step[] = [
  [0, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [0, 1, 1],
  [1, 0, 0],
  [1, 0, 1],
  [1, 1, 0],
  [1, 1, 1],
]

export declare namespace Tile {
  export type TranslateOptions = {
    bounds: CartesianBounds,
    code: string
    hierarchy: Hierarchy
    key: Key
    geometricError: number
    refine: 'ADD' | 'REPLACE'
  }
  export type Content = { uri: string }
}

export type Tile = {
  content: Tile.Content
  children?: Tile[]
  boundingVolume: BoundingVolume
  geometricError: number
  refine?: 'ADD' | 'REPLACE'
}

export const Tile = { translate }

function translate({
  bounds,
  code,
  hierarchy,
  key,
  geometricError,
  refine,
}: Tile.TranslateOptions): Tile {
  const box = BoundingVolume.Box.create(bounds.center, [bounds.length[0], 0, 0], [0, bounds.length[1], 0], [0, 0, bounds.length[2]])

  const points = hierarchy[Key.stringify(key)]
  let children: Tile[];
  // Don't recurse into empty tiles
  if (points) {
    children = steps.reduce<Tile[]>((children, step) => {
      const nextKey = Key.step(key, step)
      const points = hierarchy[Key.stringify(nextKey)]
      // If ADD refinement, don't even add empty tiles to the hierarchy
      if (!points && refine === 'ADD') return children
      const nextBounds = CartesianBounds.step(bounds, step)
  
      children.push(
        translate({
          code,
          hierarchy,
          bounds: nextBounds,
          key: nextKey,
          geometricError: geometricError / 2,
          refine,
        })
      )
      return children
    }, [])
  } else {
    children = []
  }

  const extension = points === -1 ? 'json' : 'pnts'

  const tile: Tile = {
    content: { uri: `${Key.stringify(key)}.${extension}` },
    boundingVolume: { box },
    geometricError,
    children,
  }
  if (Key.depth(key) === 0) tile.refine = refine
  return tile
}
