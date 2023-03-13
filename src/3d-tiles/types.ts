import { View } from 'ept'
import { CartesianBounds } from 'ept/cartesianBounds'

export type Addon = [string, string]
export type Addons = Addon[]
export type Options = {
  ept?: string
  zOffset: number
  dimensions: string[]
  addons: Addons
  truncate: boolean
  replace: boolean
  verbose: boolean
}

export type Params = {
  view: View.Readable
  tileBounds: CartesianBounds
  options: Partial<Options>
}
