#!/usr/bin/env node

import pkg from 'commander';
import main from '../index.js';

const { program } = pkg;

program
  .version('0.0.1')
  .description('Loads a page')
  .option('-o, --output [path]', 'path to save page', process.cwd())
  .arguments('<url>')
  .action((url) => {
    main(url, program.output);
  })
  .parse(process.argv);
