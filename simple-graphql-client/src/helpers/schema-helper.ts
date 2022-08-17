import fs from 'node:fs'
import path from 'node:path'
import fetch, { Response } from 'node-fetch'
import { buildClientSchema, printSchema, getIntrospectionQuery } from 'graphql'
import { logger, write_format_file_regular } from '../utils/index.js'
import { GeneratorConfig } from '../types.js'

export const query_schema = async (config: GeneratorConfig): Promise<string | null> => {
  try {
    const response: Response = await fetch(config.global.endpoint!, {
      method: "POST",
      headers: config.schema.authorization ? { "Content-Type": "application/json", "Authorization": config.schema.authorization } : { "Content-Type": "application/json"},
      body: JSON.stringify({ query: getIntrospectionQuery() }),
    })


    const res: any = await response.json()

    if (!res) {
      logger.error(`Error querying schema from endpoint`)
      return null
    }

    if (!res.data) {
      logger.error(`Schema query didn't respond with data`)
      return null
    }

    const graphql_schema_obj = buildClientSchema(res.data)

    return printSchema(graphql_schema_obj)
  }
  catch (e) {
    logger.error(e)
  }

  return null
}

export const read_schema = async (config: GeneratorConfig): Promise<string | null> => {
  try {
    const schema_data: Buffer = fs.readFileSync(config.global.schema_path!)
    const raw_sdl = schema_data.toString()
    return raw_sdl
  }
  catch(e) {
    logger.error(e)
  }
  return null
}

export const create_schema_file = async (sdl: string, config: GeneratorConfig) => {
  await write_format_file_regular(config.schema.output_dir!, 'schema.graphql', sdl!, config, "graphql")
  config.global.schema_path = path.join(config.schema.output_dir!, 'schema.graphql')
}