import Forager from "forager"
import { Cesium, EptToolsError } from "index"
import { join } from "protopath"
import workerpool from "workerpool"

type HandleFileConfig = {
  filename: string
  i: number
  input: string
  output: string
  options?: Partial<Cesium.Options>
  verbose: boolean
  totalFiles: number
}

async function handleFile(config: HandleFileConfig) {
  if (config.verbose) console.log(`${config.i}/${config.totalFiles}:`, config.filename)

  const data = await Cesium.translate({
    filename: join(config.input, 'ept-tileset', config.filename),
    options: config.options,
  })

  if (!(data instanceof Buffer)) {
    throw new EptToolsError(`Unexpected response type during ${config.filename}`)
  }

  return Forager.write(join(config.output, config.filename), data)
}

workerpool.worker({ handleFile })