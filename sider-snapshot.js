const CliTable = require('cli-table');
const commander = require('commander');
const moment = require('moment');

const fileDb = require('./file-db');
const snapshots = require('./snapshots');
const notFoundCommand = require('./not-found-command');

let commandFound = false;

function addSnapshot(snapshotName, importSnapshotDiskPath) {
  commandFound = true;
  snapshots.addSnapshot(snapshotName, importSnapshotDiskPath);
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
    head: ['name', 'created', 'last used', 'dbs']
  });

  const dbs = fileDb.getDbsAsArray();

  const tableData = fileDb.getSnapshotsAsArray().map(snapshot => {
    const { snapshotName, stats: { birthtime, mtime } } = snapshot;

    const dbsClonedFromSnapshot = dbs
      .filter(db => db.snapshotName === snapshotName)
      .map(db => db.dbName);

    return [
      snapshotName,
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
    .command('add <snapshotName> <path>')
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

function printErrorAndExit(error) {
  console.error(error);
  process.exit(1);
}

process.on('unhandledRejection', printErrorAndExit);
process.on('uncaughtException', printErrorAndExit);

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
