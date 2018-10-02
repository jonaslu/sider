const commander = require('commander');
const CliTable = require('cli-table');
const moment = require('moment');

require('./global-error-handler');
const engines = require('./engines');
const fileDb = require('./storage/file-db');
const notFoundCommand = require('./not-found-command');
const snapshots = require('./snapshots');

let commandFound = false;

function cloneSnapshotToDb(dbName, snapshotName, dbPort) {
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

  fileDb.cloneSnapshotToDb(dbName, snapshotName, dbPort);

  return true;
}

function startDb(dbName, snapshotName, options) {
  commandFound = true;
  const { port } = options;

  if (snapshotName) {
    let clonePort = port;

    if (!clonePort) {
      const snapshot = fileDb.getSnapshot(snapshotName);

      const { engineName } = snapshot;
      const { defaultPort } = engines.loadConfigJson(engineName);

      clonePort = defaultPort.toString();
    }

    if (!cloneSnapshotToDb(dbName, snapshotName, clonePort)) {
      return;
    }
  }

  const db = fileDb.getDb(dbName);
  const { dbPort, dbPath, engineName } = db;

  if (!db) {
    // !! TODO !! Did you mean?
    console.error(`Error: db ${dbName} not found`);
    process.exit(1);
  }

  const enginePort = port || dbPort;

  engines.start(engineName, enginePort, dbPath, dbName);
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
    head: ['name', 'snapshot', 'engine', 'port', 'created', 'last used']
  });

  const tableData = fileDb.getDbsAsArray().map(db => {
    const {
      dbName,
      snapshotName,
      engineName,
      dbPort,
      stats: { birthtime, mtime }
    } = db;

    // TODO Factor out birthtime and mtime to common formatting util. Methinks the folder is a better option
    // when it comes to creation time
    return [
      dbName,
      snapshotName,
      engineName,
      dbPort,
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

function setupCommanderArguments() {
  commander
    .command('start <name> [snapshot]')
    .option('-p, --port <port>', 'Start on other than default port')
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

const knownSubCommands = ['start', 'remove', 'list', 'promote', 'reset'];

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
