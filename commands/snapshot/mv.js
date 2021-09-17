const chalk = require('chalk');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const dbs = require('../../storage/db');

async function move(snapshotName, newName) {
  if (snapshotName === newName) {
    utils.printUserErrorAndDie(`${chalk.yellow(snapshotName)} source and destination names are the same`);
  }

  const allSnapshots = await snapshots.getAllSnapshotNames();
  const snapshotExists = allSnapshots.some(name => name === snapshotName);
  if (!snapshotExists) {
    utils.didYouMean(snapshotName, allSnapshots, 'Snapshot');
  }

  const newSnapshotAlreadyExists = allSnapshots.some(name => name === newName);
  if (newSnapshotAlreadyExists) {
    utils.printUserErrorAndDie(`${chalk.yellow(newName)} already exists`);
  }

  await dbs.renameSnapshotOnDbs(snapshotName, newName);
  await snapshots.moveSnapshot(snapshotName, newName);

  console.log(`${chalk.green(`Successfully`)} renamed snapshot ${chalk.cyanBright(snapshotName)} to ${chalk.cyanBright(newName)}`);
}

const usage = `
Usage: sider snapshot mv <name> <new-name>

Renames a snapshot

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage);

  const [snapshotName, newName] = argv;

  if (!newName) {
    utils.printUserErrorAndDie(`Missing the new name of the snapshot (parameter <new-name>)`);
  }

  return move(snapshotName, newName);
}

module.exports = {
  processArgv
};
