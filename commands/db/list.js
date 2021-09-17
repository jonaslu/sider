const chalk = require('chalk');
const moment = require('moment');

const utils = require('../../utils');
const dbs = require('../../storage/db');
const snapshots = require('../../storage/snapshots');
const storageEngine = require('../../storage/engine');
const runtime = require('../../runtime/config');

const { table } = require('../../list/table');

async function getSettings(db) {
  const { snapshotName, engineName } = db;

  const snapshot = await snapshots.getSnapshot(snapshotName);
  if (!snapshot) {
    utils.printInternalAndDie(`Cannot find specs file for for snapshot: ${snapshotName}`);
  }

  const engineRuntimeConfig = await storageEngine.getEngineRuntimeConfig(engineName);

  const dbRuntimeConfig = {
    ...engineRuntimeConfig.runtimeConfigSpec,
    ...snapshot.runtimeConfigSpec,
    ...db.runtimeConfigSpec,
  };

  return dbRuntimeConfig;
}

async function list(displaySettings) {
  const allDbs = await dbs.getAllDbs();

  const dbListingTable = table();

  let settings;
  const headings = ['name', 'snapshot', 'engine', 'created', 'last used'].map(heading => chalk.cyanBright(heading));

  if (displaySettings) {
    settings = await Promise.all(allDbs.map(db => getSettings(db)));
    headings.push(chalk.cyanBright('settings'));
  }

  dbListingTable.addData(...headings);

  allDbs.forEach((db, index) => {
    const {
      dbName,
      snapshotName,
      engineName,
      fstats: { created, lastUsed },
    } = db;

    const timeSinceCreated = moment(created).from(moment());

    let timeSinceLastUsed = 'never';
    if (lastUsed) {
      timeSinceLastUsed = moment(lastUsed).from(moment());
    }

    if (settings) {
      const formattedSettings = runtime.formatRuntimeConfigValues(settings[index]);
      dbListingTable.addData(dbName, snapshotName, engineName, timeSinceCreated, timeSinceLastUsed, formattedSettings.join('\n'));
    } else {
      dbListingTable.addData(dbName, snapshotName, engineName, timeSinceCreated, timeSinceLastUsed);
    }
  });

  dbListingTable.display();
}

const usage = `
Usage: sider db list [options]

Lists all existing databases

Options:
  -s, --settings  include db settings in listing
  -h, --help      output usage information
`;

async function processArgv(argv = []) {
  utils.printUsageIfHelp(argv, usage, false);

  const { hasArgument: displaySettings } = utils.containsArguments(argv, '-s', '--settings');

  return list(displaySettings);
}

module.exports = {
  processArgv,
};
