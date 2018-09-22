const CliTable = require('cli-table');
const commander = require('commander');
const moment = require('moment');

require('./global-error-handler');
const fileDb = require('./storage/file-db');
const snapshots = require('./snapshots');
const notFoundCommand = require('./not-found-command');

let commandFound = false;

function addSnapshot(engineName, snapshotName, importSnapshotDiskPath, _) {
  commandFound = true;
  snapshots.addSnapshot(snapshotName, engineName, importSnapshotDiskPath);
}

function removeSnapshot(snapshotName) {
  commandFound = true;

  const snapshot = fileDb.getSnapshot(snapshotName);

  if (!snapshot) {
    console.error(`Cannot find snapshot ${snapshot}`);
    process.exit(1);
  }

  // TODO Return the dbs removed
  fileDb.removeSnapshot(snapshotName);
}

function listSnapshots() {
  commandFound = true;

  const table = new CliTable({
    head: ['name', 'engine', 'created', 'last used', 'dbs']
  });

  const dbs = fileDb.getDbsAsArray();

  const tableData = fileDb.getSnapshotsAsArray().map(snapshot => {
    const { snapshotName, engineName,  stats: { birthtime, mtime } } = snapshot;

    const dbsClonedFromSnapshot = dbs
      .filter(db => db.snapshotName === snapshotName)
      .map(db => db.dbName);

    return [
      snapshotName,
      engineName,
      moment(birthtime).fromNow(),
      moment(mtime).fromNow(),
      dbsClonedFromSnapshot.join(',')
    ];
  });

  tableData.forEach(tableRow => table.push(tableRow));
  console.log(table.toString());
}

function setupCommanderArguments() {
  commander
    .command('add <engineName> <snapshotName> <path> [engineParameters]')
    .description('adds the named snapshot')
    .action(addSnapshot);

  commander
    .command('remove <snapshotName>')
    .description('removes the snapshot and associated dbs')
    .action(removeSnapshot);

  commander
    .command('list')
    .description('lists all snapshots')
    .action(listSnapshots);

  commander
    .name('sider snapshot')
    .description('controls snapshots')
    .usage('<command> [arguments]');
}

setupCommanderArguments();
commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
  process.exit(1);
}

const knownSubCommands = ['add', 'remove', 'list'];

if (!commandFound) {
  notFoundCommand.printCommandHelp(knownSubCommands, commander);
}
