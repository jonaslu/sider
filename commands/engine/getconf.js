const chalk = require('chalk');

const engines = require('../../engines');
const { getEngineRuntimeConfig } = require('../../storage/engine');
const utils = require('../../utils');

async function getConf(engineName) {
  const engine = await engines.getEngine(engineName);
  if (!engine) {
    utils.didYouMean(engineName, await engines.getAllEngineNames(), `Engine`);
  }

  const { runtimeConfig } = await getEngineRuntimeConfig(engineName);
  const sortedConfigKeys = Object.keys(runtimeConfig).sort((a, b) => (a > b ? 1 : a === b ? 0 : -1));

  sortedConfigKeys.forEach(key => {
    console.log(`${chalk.yellow(key)}=${runtimeConfig[key]}`);
  })
}

const usage = `
Usage: sider engine getconf [options] <name>

Clones a database from a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [engineName] = argv;
  return getConf(engineName);
}

module.exports = {
  processArgv
};
