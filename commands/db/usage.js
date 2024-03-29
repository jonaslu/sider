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
  mv          renames (moves) a database
  promote     promotes a database to a new snapshot
  remove      removes a database
  reset       resets a database (clones the snapshot files anew)
  start       starts a previously cloned database

  getconf     displays runtime config for a database
  setconf     sets runtime config for a database
  remconf     Removes runtime config for a database

  help [cmd]  display help for [cmd]
`;

const knownCommands = [
  'start',
  'clone',
  'promote',
  'reset',
  'remove',
  'list',
  'eject',
  'getconf',
  'setconf',
  'remconf',
  'mv'
];

function getCommandFile(subcommand) {
  const commandFound = knownCommands.find(command => command === subcommand);

  if (commandFound) {
    // eslint-disable-next-line import/no-dynamic-require
    return require(`./${subcommand}`);
  }

  return didYouMean(subcommand, knownCommands, 'Command');
}

async function processArgv(argv = []) {
  const [subcommand, ...rest] = argv;

  switch (subcommand) {
    case 'help': {
      const [helpCommand] = rest;

      if (!helpCommand) {
        printUsageAndExit(usage);
      }

      getCommandFile(helpCommand).processArgv(['-h']);
      break;
    }

    case '-h':
    case '--help':
    case undefined:
      printUsageAndExit(usage);
      break;

    default:
      await getCommandFile(subcommand).processArgv(rest);
  }
}

module.exports = {
  processArgv
};
