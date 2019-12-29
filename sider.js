#! /usr/bin/env node
const { processArgv } = require('./commands/main/usage');

const [, , ...rest] = process.argv;
const [subcommand] = rest;

switch (subcommand) {
  case 'install-completion':
    break;

  case 'uninstall-completion':
    break;

  default:
    processArgv(rest);
}
