const { didYouMean, printUsageAndExit } = require('../../utils');

const usage = `
Usage: sider snapshot <command> [arguments]

Manages snapshots

Options:
  -h, --help    Displays this help message

Commands:
  add         adds a snapshot from disk
  empty       starts and then saves an empty snapshot
  list        lists all existing snapshots
  remove      removes a snapshot and it's cloned databases

  getconf     displays runtime config for an engine
  remconf     removes runtime config for a snapshot
  setconf     sets runtime config for a snapshot

  help [cmd]  display help for [cmd]
`;

const knownCommands = ['add', 'empty', 'getconf', 'list', 'remconf', 'remove', 'setconf'];

function getCommandFile(subcommand) {
  const commandFound = knownCommands.find(command => command === subcommand);

  if (commandFound) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
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

      getCommandFile(helpCommand).processArgv();
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
