const chalk = require('chalk');

const engines = require('../../engines');
const storageEngine = require('../../storage/engine');
const utils = require('../../utils');

async function remConf(engineName, runtimeConfigKeys) {
  const engineNames = await engines.getAllEngineNames();
  if (!engineNames.some(name => name === engineName)) {
    utils.didYouMean(engineName, engineNames, `Engine`);
  }

  const runtimeConfigSpec = await storageEngine.getEngineRuntimeConfigSpec(engineName);
  const engineRuntimeConfigSpecKeys = Object.keys(runtimeConfigSpec || {});

  let someRemoved = false;

  runtimeConfigKeys.forEach(runtimeConfigKey => {
    const keyExists = engineRuntimeConfigSpecKeys.indexOf(runtimeConfigKey) > -1;
    if (!keyExists) {
      utils.printWarning(`Cannot remove parameter ${runtimeConfigKey} - not found in settings`);
    } else {
      delete runtimeConfigSpec[runtimeConfigKey];
      someRemoved = true;
    }
  });


  if (someRemoved) {
    await storageEngine.overwriteRuntimeConfigSpec(engineName, runtimeConfigSpec);
    console.log(`${chalk.green(`Successfully`)} removed settings on engine ${chalk.cyanBright(engineName)}`);
  }
}

const usage = `
Usage: sider engine remconf [options] <name> <parameters...>

Removes runtime for an engine

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [engineName, ...runtimeConfigKeys] = argv;

  if (!runtimeConfigKeys.length) {
    utils.printUserErrorAndDie('Need at least config to remove');
  }

  return remConf(engineName, runtimeConfigKeys);
}

module.exports = {
  processArgv
};
