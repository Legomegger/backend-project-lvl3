#!/usr/bin/env node
import { program } from 'commander';
import loader from '../index.js';

program
  .version('0.0.1')
  .description('Page loader utility')
  .argument('<url>')
  .option('-o, --output <dir>', 'output dir', '/home/user/current-dir')
  .parse(process.argv)

const { args } = program;
const options = program.opts();
const { output } = options;
loader(args[0], output)
