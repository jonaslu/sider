const commander = require('commander');
const CliTable = require('cli-table');
const moment = require('moment');

require('./global-error-handler');
const engines = require('./engines');
const fileDb = require('./storage/file-db');
const notFoundCommand = require('./not-found-command');
const parseEngineConfig = require('./config-db');
const snapshots = require('./snapshots');

let commandFound = false;

function cloneSnapshotToDb(dbName, snapshotName) {
  const snapshot = fileDb.getSnapshot(snapshotName);

  if (!snapshot) {
    // !! TODO !! Did you mean?
    console.error('Snapshot does not exist');
    process.exit(1);
  }

  const db = fileDb.getDb(dbName);

  if (db) {
    console.error('Error: db already exists');
    process.exit(1);
  }

  fileDb.cloneSnapshotToDb(dbName, snapshotName);

  return true;
}

function startDb(dbName, snapshotName, configKeyValues, cmd) {
  commandFound = true;

  const { persist } = cmd;

  let isClone = !!snapshotName;

  if (snapshotName && snapshotName.includes('=')) {
    configKeyValues.push(snapshotName);
    isClone = false;
  }

  if (isClone) {
    cloneSnapshotToDb(dbName, snapshotName);
  }

  const db = fileDb.getDb(dbName);

  if (!db) {
    // !! TODO !! Did you mean?
    console.error(`Error: db ${dbName} not found`);
    process.exit(1);
  }

  const { dbPath, engineName } = db;
  let cliConfig = {};

  if (persist) {
    const storedConfig = fileDb.getDbConfig(dbName);
    const newSettings = parseEngineConfig.mergeConfig(
      configKeyValues,
      storedConfig
    );

    fileDb.setDbConfig(dbName, newSettings);
  } else {
    cliConfig = parseEngineConfig.mergeConfig(configKeyValues, {});
  }

  engines.start(engineName, dbPath, dbName, cliConfig);
}

function removeDb(dbName) {
  commandFound = true;

  const db = fileDb.getDb(dbName);

  if (!db) {
    // !! TODO !! Did you mean?
    console.error(`Error: cannot remove db ${dbName} - not found`);
    process.exit(1);
  }

  fileDb.removeDb(dbName);
}

function listDbs() {
  commandFound = true;

  const table = new CliTable({
    head: ['name', 'snapshot', 'engine', 'settings', 'created', 'last used']
  });

  const tableData = fileDb.getDbsAsArray().map(db => {
    const {
      dbName,
      snapshotName,
      engineName,
      stats: { birthtime, mtime }
    } = db;

    // Get engine settings and any possible settings on the db and join them

    // TODO Factor out birthtime and mtime to common formatting util. Methinks the folder is a better option
    // when it comes to creation time
    return [
      dbName,
      snapshotName,
      engineName,
      moment(birthtime).fromNow(),
      moment(mtime).fromNow()
    ];
  });

  // TODO Take command-line parameters for sorting
  tableData.sort((a, b) => (a.dbName < b.dbName ? 1 : -1));

  tableData.forEach(tableRow => table.push(tableRow));

  console.log(table.toString());
}

function promoteToSnapshot(dbName, snapshotName) {
  commandFound = true;

  const db = fileDb.getDb(dbName);

  if (!db) {
    // !! TODO !! Did you mean?
    console.error(`Error: cannot promote db ${dbName} - not found`);
    process.exit(1);
  }

  const { dbPath, engineName } = db;
  snapshots.addSnapshot(snapshotName, engineName, dbPath);
}

function resetDb(dbName) {
  commandFound = true;

  const db = fileDb.getDb(dbName);

  if (!db) {
    // !! TODO !! Did you mean?
    console.error(`Error: cannot reset db ${dbName} - not found`);

    process.exit(1);
  }

  fileDb.removeDb(dbName);

  const { snapshotName, dbPort } = db;

  fileDb.cloneSnapshotToDb(dbName, snapshotName, dbPort);
}

function getConfig(dbName) {
  commandFound = true;

  const storedConfig = fileDb.getDbConfig(dbName);
  parseEngineConfig.printConfig(storedConfig);
}

function setConfig(dbName, configKeyValues) {
  commandFound = true;

  const storedConfig = fileDb.getDbConfig(dbName);
  const newSettings = parseEngineConfig.mergeConfig(
    configKeyValues,
    storedConfig
  );

  fileDb.setDbConfig(dbName, newSettings);
}

function removeConfig(dbName, keys) {
  commandFound = true;
  const storedConfig = fileDb.getDbConfig(dbName);

  const newSettings = parseEngineConfig.removeConfig(keys, storedConfig);

  fileDb.setDbConfig(dbName, newSettings);
}

function setupCommanderArguments() {
  commander
    .command('start <name> [snapshot] [parameters...]')
    .option('-p, --persist', 'Persist the parameters')
    .description('starts the named db')
    .action(startDb);

  commander
    .command('remove <name>')
    .description('removes the named db')
    .action(removeDb);

  commander
    .command('list')
    .description('lists all dbs')
    .action(listDbs);

  commander
    .command('promote <name> <newSnapshotName>')
    .description('promotes a db to a snapshot')
    .action(promoteToSnapshot);

  commander
    .command('reset <name>')
    .description("resets a db to it's cloned snapshot state")
    .action(resetDb);

  commander
    .command('setconf <name> [keyvalues...]')
    .description('sets config(s) on a db')
    .action(setConfig);

  commander
    .command('getconf <name>')
    .description('gets config on a db')
    .action(getConfig);

  commander
    .command('remconf <name> [keys...]')
    .description('removes config(s) on a db')
    .action(removeConfig);

  commander
    .name('sider db')
    .description('controls dbs')
    .usage('<command> [arguments]');
}

setupCommanderArguments();
commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
  process.exit(1);
}

const knownSubCommands = [
  'start',
  'remove',
  'list',
  'promote',
  'reset',
  'setconf',
  'getconf',
  'remconf'
];

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
