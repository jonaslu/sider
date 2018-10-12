// Now what?

// I want to:
// Be able to set settings on an engine

const commander = require('commander');

const engines = require('./engines');
const notFoundCommand = require('./not-found-command');
const parseEngineConfig = require('./parse-engine-config.js');
const fileDb = require('./storage/file-db');

require('./global-error-handler');

let commandFound = false;

function getConfig(engineName) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);

  const configMessage = Object.keys(storedConfig)
    .map(key => `${key}=${storedConfig[key]}`)
    .join('\n');

  console.log(configMessage);
}

function setConfig(engineName, config) {
  commandFound = true;

  const newSettings = parseEngineConfig.parseConfigKeyValues(config)
  const storedConfig = engines.loadConfigJson(engineName);

  fileDb.setEngineConfig(engineName, { ...storedConfig, ...newSettings });
}

function removeOneConfigKey(storedConfig, key, engineName) {
  const keyExists = Object.keys(storedConfig).find(storedKey => storedKey === key);

  if (!keyExists) {
    console.error(`Could not find key ${key} on engine ${engineName}`);
    process.exit(1);
  }

  // eslint-disable-next-line no-param-reassign
  return delete storedConfig[key];
}

function removeConfig(engineName, keys) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);

  keys.forEach(key => removeOneConfigKey(storedConfig, key, engineName));

  fileDb.setEngineConfig(engineName, storedConfig);
}

function setupCommanderArguments() {
  commander
    .command('get <engineName>')
    .description('lists stored and default config on an engine')
    .action(getConfig);

  commander
    .command('set <engineName> [values...]')
    .description('sets config on an engine')
    .action(setConfig);

  commander
    .command('remove <engineName> [keys...]')
    .description('removes config on an engine')
    .action(removeConfig);

  commander
    .name('sider engine')
    .description('controls dbs')
    .usage('<command> [arguments]');
}

setupCommanderArguments();
commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
  process.exit(1);
}

const knownSubCommands = ['config', 'set'];

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
