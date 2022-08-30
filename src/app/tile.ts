import * as Cesium from '3d-tiles'
import { Key } from 'ept/key'
import { Forager } from 'forager'
import { mkdirp } from 'fs-extra'
import { dirname, extname, getProtocol, getStem, join } from 'protopath'
import { EptToolsError } from 'types'
import { isReadable, Pool } from 'utils'
import workerpool from 'workerpool'

type Tile = {
  input: string
  output: string
  threads: number
  force: boolean
  verbose: boolean
  options?: Partial<Cesium.Options>
}
export async function tile(args: Tile) {
  const { force, verbose, output } = args
  if (!force && (await isReadable(join(output, 'tileset.json')))) {
    throw new EptToolsError('Output already exists - use --force to overwrite')
  }

  const protocol = getProtocol(output) || 'file'
  if (protocol === 'file') await mkdirp(output)

  // Metadata.
  if (verbose) {
    console.log('Translating metadata...')
    console.time('Metadata')
  }

  const cache = Cesium.Cache.create(0)
  await translateMetadata({ ...args, cache })

  if (verbose) console.timeEnd('Metadata')

  // Points.
  if (verbose) {
    console.log('Translating points...')
    console.time('Points')
  }

  await translatePoints({ ...args, cache })

  if (verbose) console.timeEnd('Points')
}

type Args = Tile & { cache: Cesium.Cache }
async function translateMetadata({
  input,
  output,
  threads,
  options,
  verbose,
  cache,
}: Args) {
  const root = join(input, 'ept-hierarchy')
  const list = (await Forager.list(root)).map(({ path }) =>
    path === '0-0-0-0.json' ? 'tileset.json' : path
  )

  return Pool.all(
    list.map((filename, i) => async () => {
      if (verbose) console.log(`${i}/${list.length}:`, filename)

      const data = await Cesium.translate({
        filename: join(input, 'ept-tileset', filename),
        options,
      })

      if (data instanceof Buffer) {
        throw new EptToolsError(`Unexpected response type during ${filename}`)
      }

      return Forager.write(join(output, filename), JSON.stringify(data))
    }),
    threads
  )
}

type TileFilename = {
  directory: string,
  key: Key,
  extension: string
}

// In order to take the maximum advantage of caching, we'd like to iterate over points files in depth-first order.
function traverseSortTiles(tiles: TileFilename[]) {
  const keyToTile = new Map<string, TileFilename>()
  for (const tile of tiles) {
    keyToTile.set(Key.stringify(tile.key), tile)
  }

  let result: TileFilename[] = []
  const traverse = (k: Key) => {
    const tile = keyToTile.get(Key.stringify(k))
    if (tile) {
      result.push(tile)
      for (const child of Key.children(k)) {
        traverse(child)
      }
    }
  }
  traverse(Key.create())
  return result
}

async function translatePoints({
  input,
  output,
  threads,
  options,
  verbose,
}: Args) {
  const root = join(input, 'ept-data')

  // Get the list of all points files.
  const tileFilenames = (await Forager.list(root)).map(({ path }) => {
    try {
      const directory = dirname(path)
      const stem = getStem(path)
      const extension = extname(path)
      return { directory, key: Key.parse(stem), extension }
    } catch (e) {
      return null
    }
  }).filter(Boolean) as TileFilename[]

  const presentKeysSet = new Set(tileFilenames.map(tileFilename => Key.stringify(tileFilename.key)))

  // If using REPLACE refinement, we need to make sure points files with any children have all children present.
  let extraTiles: TileFilename[] = []
  if (options?.replace) {
    for (const filename of tileFilenames) {
      const children = Key.children(filename.key)
      const missing = children.filter(child => !presentKeysSet.has(Key.stringify(child)))
      if (0 < missing.length && missing.length < children.length) {
        extraTiles.push(...missing.map(k => ({ ...filename, key: k })))
      }
    }
  }

  const allTiles = traverseSortTiles([...tileFilenames, ...extraTiles])
  const poolArguments= allTiles.map((tile, i) => ({
    filename: join(tile.directory, `${Key.stringify(tile.key)}.pnts`),
    i,
    options,
    input,
    output,
    verbose,
    totalFiles: allTiles.length
  }))

  const pool = workerpool.pool(__dirname + '/handle-file.js', {
    maxWorkers: threads,

  })
  await Promise.all(poolArguments.map(args => pool.exec('handleFile', [args])));
  pool.terminate();
}
