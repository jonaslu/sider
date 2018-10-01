// Now what?

// I want to:
// Be able to set settings on an engine

const commander = require('commander');

const engines = require('./engines/');
const fileDb = require('./storage/file-db');
const notFoundCommand = require('./not-found-command');

require('./global-error-handler');

let commandFound = false;

function loadConfigJson(engineName) {
  // !! TODO !! Make engineExists with error logging
  const engine = engines.getEngine(engineName);

  const storedEngineConfig = fileDb.getEngineConfig(engineName);
  const engineConfig = engine.getConfig(storedEngineConfig);

  return engineConfig;
}

function getConfig(engineName) {
  commandFound = true;

  const engineConfig = loadConfigJson(engineName);

  const configMessage = Object.keys(engineConfig)
    .map(key => `${key}=${engineConfig[key]}`)
    .join('\n');

  console.log(configMessage);
}

function setConfig(engineName, values) {
  commandFound = true;

  // !! TODO !! Engine name exists with did you mean
  engines.getEngine(engineName);

  const storedConfig = loadConfigJson(engineName);

  const newSettings = values.reduce((acc, keyValue) => {
    const [key, value] = keyValue.split('=');
    acc[key] = value;

    return acc;
  }, {});

  fileDb.setEngineConfig(engineName, { ...storedConfig, ...newSettings });
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
