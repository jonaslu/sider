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
  listEngines() {
    return fs
      .readdirSync(__dirname)
      .filter(file => file !== 'index.js')
      .map(file => path.parse(file).name);
  },
  loadFiles(engineName, importSnapshotDiskPath, engineSnapshotFolder) {
    const engine = getEngine(engineName);
    // !! TODO !! Make a bit more chatty
    engine.load(importSnapshotDiskPath, engineSnapshotFolder);
  },
  start(engineName, dbPath, dbName, cliConfig) {
    const engine = getEngine(engineName);

    const storedEngineConfig = fileDb.getEngineConfig(engineName);
    const engineConfig = engine.getConfig(storedEngineConfig);
    const dbConfig = fileDb.getDbConfig(dbName);

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

    // commanderjs forwards any signals caught to the
    // it's spawned child process - but the child
    // process also get's the signal so we're
    // called twice in the handler. Use this
    // lo-fi flag to signal we've called stop
    // already. .once() doesn't work.
    let stopCalled = false;

    // That ctrl+c magic
    process.on('SIGINT', () => {
      if (!stopCalled && engine.stop) {
        engine.stop(dbName, config);
        stopCalled = true;
      }
    });

    // !! TODO !! Check exit-value
    engine.start(dbPath, dbName, config).then(() => {
      console.log(chalk.green(`Sucessfully shut down db ${dbNameInBlue}`));
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
