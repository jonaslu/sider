const { didYouMean, printUsageAndExit } = require('../../utils');

const usage = `
Usage: sider engine <command> [arguments]

Manages engine settings

Options:
  -h, --help    Displays this help message

Commands:
  getconf      displays runtime config for an engine
  remconf      removes runtime config for an engine
  setconfg     sets runtime config for an engine

  help [cmd]  display help for [cmd]
`;

const knownCommands = ['getconf', 'remconf', 'setconf'];

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
