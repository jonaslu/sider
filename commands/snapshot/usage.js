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
  start       starts an empty snapshot

  help [cmd]  display help for [cmd]
`;

const knownCommands = ['add', 'empty', 'list', 'remove', 'start'];

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
