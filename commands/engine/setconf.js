const chalk = require('chalk');

const engines = require('../../engines');
const { saveRuntimeConfig } = require('../../storage/engine');
const utils = require('../../utils');
const runtimeConfig = require('../../runtime/config');

async function setConf(engineName, cliRuntimeConfig) {
  const engineNames = await engines.getAllEngineNames();
  if (!engineNames.some(name => name === engineName)) {
    utils.didYouMean(engineName, engineNames, `Engine`);
  }

  await saveRuntimeConfig(engineName, cliRuntimeConfig);
  console.log(chalk.green(`Successfully stored settings on engine ${chalk.blue(engineName)}`));
}

const usage = `
Usage: sider engine setconf [options] <name> <parameters...>

Sets config for an engine

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [engineName, ...runtimeConfigKeyValues] = argv;

  if (!runtimeConfigKeyValues.length) {
    utils.printUserErrorAndDie('Need at least one setting');
  }

  const cliRuntimeConfig = runtimeConfig.parseRuntimeConfigKeyValues(runtimeConfigKeyValues);

  return setConf(engineName, cliRuntimeConfig);
}

module.exports = {
  processArgv
};
