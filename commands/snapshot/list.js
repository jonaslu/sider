const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const snapshots = require('../../storage/snapshots');
const dbs = require('../../storage/db');

const { table } = require('../../list/table');

async function list() {
  const allSnapshots = await snapshots.getAllSnapshots();
  const snapshotListingsTable = table();

  const headings = ['name', 'engine', 'created', 'cloned by'];
  snapshotListingsTable.addData(...headings);

  for (let i = 0; i<allSnapshots.length; i++) {
    const { snapshotName, engineName, fstats: { created }} = allSnapshots[i];
    const timeSinceCreated = moment(created).from(moment());

    const clonedDbs = await dbs.getAllDbNamesForSnapshotName(snapshotName);
    const clonedDbsStr = clonedDbs.join(", ");

    snapshotListingsTable.addData(snapshotName, engineName, timeSinceCreated, clonedDbsStr);
  };

  snapshotListingsTable.display(data => {
    data[0] = data[0].map(heading => chalk.red(heading));
  });
}

const usage = `
Usage: sider snapshot list [options]

lists all existing snapshots

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
