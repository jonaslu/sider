// Now what?

// I want to:
// Be able to set settings on an engine

const commander = require('commander');

const engines = require('./engines');
const notFoundCommand = require('./not-found-command');
const configDb = require('./config-db');
const fileDb = require('./storage/file-db');

require('./global-error-handler');

let commandFound = false;

function getConfig(engineName) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  configDb.printConfig(storedConfig);
}

function setConfig(engineName, configKeyValues) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  const newSettings = configDb.mergeConfig(configKeyValues, storedConfig);

  fileDb.setEngineConfig(engineName, newSettings);
}

function removeConfig(engineName, keys) {
  commandFound = true;

  const storedConfig = engines.loadConfigJson(engineName);
  configDb.removeConfig(keys, storedConfig);

  fileDb.setEngineConfig(engineName, storedConfig);
}

const { engine } = require('./completions.js');

function setupCommanderArguments() {
  commander
    .command(engine.getconf.commanderLine)
    .description('lists stored and default config on an engine')
    .action(getConfig);

  commander
    .command(engine.setconf.commanderLine)
    .description('sets config(s) on an engine')
    .action(setConfig);

  commander
    .command(engine.remconf.commanderLine)
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

const knownSubCommands = Object.keys(engine);

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
