#!/usr/bin/env node
import { program } from 'commander'
import loader from '../src/index.js'

program
  .version('0.0.1')
  .description('Page loader utility')
  .argument('<url>')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .parse(process.argv)

const { args } = program
const options = program.opts()
const { output } = options
loader(args[0], output).then(() => {
  console.log('Success! Program exit')
  process.exit(0)
}).catch((err) => {
  console.error('Something gone wrong:', err)
  process.exit(1)
})
