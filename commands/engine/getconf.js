const engines = require('../../engines');
const storageEngine = require('../../storage/engine');
const utils = require('../../utils');
const config = require('../../runtime/config')

async function getConf(engineName) {
  const engineNames = await engines.getAllEngineNames();
  if (!engineNames.some(name => name === engineName)) {
    utils.didYouMean(engineName, engineNames, `Engine`);
  }

  // !! TODO !! Print out what's default and what's not default
  const { runtimeConfigSpec } = await storageEngine.getEngineRuntimeConfig(engineName);
  config.printRuntimeConfigValues(runtimeConfigSpec);
}

const usage = `
Usage: sider engine getconf [options] <name>

Displays runtime config for an engine

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
