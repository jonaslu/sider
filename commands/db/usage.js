const { didYouMean, printUsageAndExit } = require('../../utils');

const usage = `
Usage: sider db <command> [arguments]

Manages databases

Options:
  -h, --help    Displays this help message

Commands:
  clone       clones a db from a snapshot
  start       starts a previously cloned db

  help [cmd]  display help for [cmd]
`;

const knownCommands = ['start', 'clone'];

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
