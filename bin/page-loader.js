#!/usr/bin/env node

import { Command } from 'commander';
import main from '../index.js';

const program = new Command();

program
  .version('0.0.1')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', `${process.cwd()}`)
  .arguments('<url>')
  .action((url, options) => {
    main(url.toString(), options.output)
  })
  .parse(process.argv);
