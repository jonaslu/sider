const { didYouMean, printUsageAndExit } = require('../../utils');

const usage = `
Usage: sider db <command> [arguments]

Manages databases

Options:
  -h, --help    Displays this help message

Commands:
  clone       clones a database from a snapshot
  eject       ejects the files stored in the database
  list        lists all existing databases
  promote     promotes a database to a new snapshot
  remove      removes a database
  reset       resets a database (clones the snapshot files anew)
  start       starts a previously cloned database

  help [cmd]  display help for [cmd]
`;

const knownCommands = ['start', 'clone', 'promote', 'reset', 'remove', 'list', 'eject'];

function getCommandFile(subcommand) {
  const commandFound = knownCommands.find(command => command === subcommand);

  if (commandFound) {
    return require(`./${subcommand}`);
  }

  didYouMean(subcommand, knownCommands, 'Command');
}

async function processArgv(argv = []) {
  const [subcommand, ...rest] = argv;

  switch (subcommand) {
    case 'help':
      const [helpCommand] = rest;

      if (!helpCommand) {
        printUsageAndExit(usage);
      }

      getCommandFile(helpCommand).processArgv();

    case '-h':
    case '--help':
    case undefined:
      printUsageAndExit(usage);

    default:
      await getCommandFile(subcommand).processArgv(rest);
  }
}

module.exports = {
  processArgv
};
