const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const dbs = require('../../storage/db');

const { table } = require('../../list/table');

async function list() {
  const allSnapshots = await snapshots.getAllSnapshots();
  const snapshotListingsTable = table();

  const headings = ['name', 'engine', 'created', 'cloned by'].map(heading => chalk.cyanBright(heading));
  snapshotListingsTable.addData(...headings);

  const allSnapshotsSorted = allSnapshots.sort((a,b) => a.snapshotName.localeCompare(b.snapshotName));

  for (let i = 0; i<allSnapshotsSorted.length; i++) {
    const { snapshotName, engineName, fstats: { created }} = allSnapshots[i];
    const timeSinceCreated = moment(created).from(moment());

    // eslint-disable-next-line no-await-in-loop
    const clonedDbs = await dbs.getAllDbNamesForSnapshotName(snapshotName);
    const clonedDbsStr = clonedDbs.join(", ");

    snapshotListingsTable.addData(snapshotName, engineName, timeSinceCreated, clonedDbsStr);
  };

  snapshotListingsTable.display();
}

const usage = `
Usage: sider snapshot list [options]

Lists all existing snapshots

Options:
  -h, --help     output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage, false);

  return list();
}

module.exports = {
  processArgv
};
