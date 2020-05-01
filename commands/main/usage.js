const { didYouMean, printUsageAndExit } = require('../../utils');

// !! Get this from package.json instead
const version = '0.0.8';

const usage = `
Usage: sider <command> [arguments]

Database dump manager

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  db          manages databases
  engine      manages engines
  snapshot    manages snapshots

  help [cmd]  display help for [cmd]
  version     display version
`;

const knownCommands = ['db', 'engine', 'snapshot'];

function getCommandFile(subcommand) {
  const commandFound = knownCommands.find(command => command === subcommand);

  if (commandFound) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(`../${subcommand}/usage`);
  }

  return didYouMean(subcommand, knownCommands, 'Command');
}

async function processArgv(argv) {
  const [subcommand, ...rest] = argv;

  switch (subcommand) {
    case '-V':
    case 'version':
    case '--version':
      console.log(version);
      process.exit(0);

    // eslint-disable-next-line no-fallthrough
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
