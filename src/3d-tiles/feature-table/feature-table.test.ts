import { DataType, Schema } from 'ept'
import { Point } from 'types'
import { Reproject } from 'utils'

import { Pnts } from '3d-tiles'

import { CartesianBounds } from 'ept/cartesianBounds'
import { FeatureTable } from './feature-table'

const schema: Schema = [
  { name: 'X', type: 'float', size: 8 },
  { name: 'Y', type: 'float', size: 8 },
  { name: 'Z', type: 'float', size: 8 },
  { name: 'Red', type: 'unsigned', size: 2 },
  { name: 'Green', type: 'unsigned', size: 2 },
  { name: 'Blue', type: 'unsigned', size: 2 },
]

const numPoints = 2
const bounds: CartesianBounds = {
  center: [4, 4, 4], 
  length: [8, 8, 8]
};

const toEcef: Reproject = <P>(p: P) => p

test('create: with rgb', async () => {
  const buffer = Buffer.alloc(Schema.pointSize(schema) * numPoints)
  const view = await DataType.view('binary', buffer, schema)
  const { header } = FeatureTable.create({
    view,
    tileBounds: bounds,
    toEcef,
    options: {},
  })

  expect(header).toEqual<FeatureTable.Header>({
    POINTS_LENGTH: numPoints,
    RTC_CENTER: CartesianBounds.mid(bounds),
    POSITION: { byteOffset: 0 },
    RGB: { byteOffset: Pnts.Constants.xyzSize * numPoints },
  })
})

test('create: no rgb', async () => {
  const xyzonly = schema.slice(0, 3)
  const buffer = Buffer.alloc(Schema.pointSize(xyzonly) * numPoints)
  const view = await DataType.view('binary', buffer, xyzonly)
  const { header } = FeatureTable.create({
    view,
    tileBounds: bounds,
    toEcef,
    options: {},
  })

  expect(header).toEqual<FeatureTable.Header>({
    POINTS_LENGTH: numPoints,
    RTC_CENTER: CartesianBounds.mid(bounds),
    POSITION: { byteOffset: 0 },
  })
})

test('create: with z offset', async () => {
  const zOffset = 10
  const buffer = Buffer.alloc(Schema.pointSize(schema) * numPoints)
  const view = await DataType.view('binary', buffer, schema)
  const { header } = FeatureTable.create({
    view,
    tileBounds: bounds,
    toEcef,
    options: { zOffset },
  })

  const mid = CartesianBounds.mid(bounds)
  const raised: Point = [mid[0], mid[1], mid[2] + zOffset]

  expect(header).toEqual<FeatureTable.Header>({
    POINTS_LENGTH: numPoints,
    RTC_CENTER: raised,
    POSITION: { byteOffset: 0 },
    RGB: { byteOffset: Pnts.Constants.xyzSize * numPoints },
  })
})
