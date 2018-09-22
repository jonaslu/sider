#! /usr/bin/env node

const commander = require('commander');

require('./global-error-handler');
const notFoundCommand = require('./not-found-command');

commander
  .description('redis dump manager')
  .command('snapshot', 'manages snapshots')
  .command('db', 'controls the installed dbs')
  .usage('<command> [arguments]');

commander.parse(process.argv);
const knownSubCommands = ['snapshot', 'db'];

if (commander.args.length) {
  const [ enteredCommand ] = commander.args;

  if (knownSubCommands.indexOf(enteredCommand) === -1) {
    notFoundCommand.printCommandHelp(knownSubCommands, commander);
  }
}
