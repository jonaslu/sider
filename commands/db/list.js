const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const dbs = require('../../storage/db');

const { table } = require('../../list/table');

async function list() {
  const allDbs = await dbs.getAllDbs();
  const dbListingTable = table();

  const headings = ['name', 'snapshot', 'engine', 'created', 'last used'];
  dbListingTable.addData(...headings);

  allDbs.forEach(db => {
    const { dbName, snapshotName, engineName, fstats: { created, lastUsed }} = db;
    // !! TODO !! These should use utc, and the created
    // should use moment().format() <- will return local time on the machine.

    // In full format this will be printed again in local time
    // moment().format("YY-MM-DD HH:mm:ss")

    // So when changing timezone dates will show in that timezone
    const timeSinceCreated = moment(created).from(moment());

    let timeSinceLastUsed = 'never';
    if (lastUsed){
      timeSinceLastUsed = moment(lastUsed).from(moment());
    }

    dbListingTable.addData(dbName, snapshotName, engineName, timeSinceCreated, timeSinceLastUsed);
  });

  dbListingTable.display(data => {
    data[0] = data[0].map(heading => chalk.red(heading));
  });
}

const usage = `
Usage: sider db list [options]

lists all existing databases

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
