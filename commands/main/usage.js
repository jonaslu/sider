const { didYouMean, printUsageAndExit } =  require('../../utils');

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

const knownCommands = ['db'];

function getCommandFile(subcommand) {
  const commandFound = knownCommands.find(command => command === subcommand);

  if (commandFound) {
    return require(`../${subcommand}/usage`);
  }

  didYouMean(subcommand, knownCommands, 'Command');
}

async function processArgv(argv) {
  const [subcommand, ...rest] = argv;

  switch (subcommand) {
    case '-V':
    case 'version':
      console.log(version);
      process.exit(0);

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
