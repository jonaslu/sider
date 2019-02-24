#! /usr/bin/env node

const commander = require('commander');

require('./global-error-handler');
const notFoundCommand = require('./not-found-command');

commander
  .version('0.0.4')
  .description('Database dump manager')
  .command('snapshot', 'manages snapshots')
  .command('db', 'controls the installed dbs')
  .command('engine', 'manage settings on engines')
  .usage('<command> [arguments]');

commander.parse(process.argv);
const knownSubCommands = ['snapshot', 'db', 'engine'];

if (commander.args.length) {
  const [ enteredCommand ] = commander.args;

  if (knownSubCommands.indexOf(enteredCommand) === -1) {
    notFoundCommand.printCommandHelp(knownSubCommands, commander);
  }
}
