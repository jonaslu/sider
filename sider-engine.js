// Now what?

// I want to:
// Be able to set settings on an engine

const commander = require('commander');

const engines = require('./engines');
const notFoundCommand = require('./not-found-command');
const parseEngineConfig = require('./config-db');
const fileDb = require('./storage/file-db');

require('./global-error-handler');

let commandFound = false;

function getConfig(engineName) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  parseEngineConfig.printConfig(storedConfig);
}

function setConfig(engineName, configKeyValues) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  const newSettings = parseEngineConfig.mergeConfig(configKeyValues, storedConfig);

  fileDb.setEngineConfig(engineName, newSettings);
}

function removeConfig(engineName, keys) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  const newSettings = parseEngineConfig.removeConfig(keys, storedConfig);

  fileDb.setEngineConfig(engineName, storedConfig);
}

function setupCommanderArguments() {
  commander
    .command('getconf <engineName>')
    .description('lists stored and default config on an engine')
    .action(getConfig);

  commander
    .command('setconf <engineName> [keyvalues...]')
    .description('sets config(s) on an engine')
    .action(setConfig);

  commander
    .command('remconf <engineName> [keys...]')
    .description('removes config(s) on an engine')
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

const knownSubCommands = ['config', 'setconf', 'getconf', 'remconf'];

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
