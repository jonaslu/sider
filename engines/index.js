const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

const fileDb = require('../storage/file-db');

function getEngineFile(engineName) {
  return path.join(__dirname, `${engineName}.js`);
}

function engineExists(engineName) {
  return fs.pathExistsSync(getEngineFile(engineName));
}

// eslint-disable-next-line consistent-return
function getEngine(engineName) {
  if (engineExists(engineName)) {
    try {
      // eslint-disable-next-line
      return require(getEngineFile(engineName));
    } catch (e) {
      // Abort when there is a compile error
      console.error(`There is an error in the script: ${engineName}, `);
      process.exit(1);
    }
  }

  // !! TODO !! Did you mean
  console.error(`Cannot find engine ${engineName}`);
  process.exit(1);
}

module.exports = {
  getEngine,
  loadFiles(engineName, importSnapshotDiskPath, engineSnapshotFolder) {
    const engine = getEngine(engineName);
    // !! TODO !! Make a bit more chatty
    engine.load(importSnapshotDiskPath, engineSnapshotFolder);
  },
  start(engineName, dbPath, dbName, cliConfig) {
    // I need this but it can be empty.
    // This causes any child-processes to receive SIGINT on ctrl+c and shut down before we do
    // Without this redis is killed hard without a chance to save background data
    process.on('SIGINT', () => {});

    const engine = getEngine(engineName);

    const storedEngineConfig = fileDb.getEngineConfig(engineName);
    const engineConfig = engine.getConfig(storedEngineConfig);

    const dbConfig = fileDb.getDbConfig(engineName);

    const config = {
      ...engineConfig,
      ...dbConfig,
      ...cliConfig
    };

    const { port } = config;

    const dbNameInBlue = chalk.blue(dbName);
    console.log(
      chalk.green(`✨ Starting db ${dbNameInBlue} on port ${port} 🚀`)
    );

    engine.start(dbPath, dbName, config).then(() => {
      console.log(chalk.green(`Successfully shut down db ${dbNameInBlue}`));
    });
  },
  loadConfigJson(engineName) {
    // !! TODO !! Make engineExists with error logging
    const engine = getEngine(engineName);

    const storedEngineConfig = fileDb.getEngineConfig(engineName);
    const engineConfig = engine.getConfig(storedEngineConfig);

    return engineConfig;
  }
};
