const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

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
  loadFiles(engineName, importSnapshotDiskPath, engineSnapshotFolder) {
    const engine = getEngine(engineName);
    // !! TODO !! Make a bit more chatty
    engine.load(importSnapshotDiskPath, engineSnapshotFolder);
  },
  start(engineName, dbPort, dbPath, dbName) {
    // I need this but it can be empty.
    // This causes any child-processes to receive SIGINT on ctrl+c and shut down before we do
    // Without this redis is killed hard without a chance to save background data
    process.on('SIGINT', () => {});

    const engine = getEngine(engineName);

    const dbNameInBlue = chalk.blue(dbName);
    console.log(
      chalk.green(`✨ Starting db ${dbNameInBlue} on port ${dbPort} 🚀`)
    );

    engine.start(dbPath, dbName, dbPort).then(() => {
      console.log(chalk.green(`Successfully shut down db ${dbNameInBlue}`));
    });
  }
};
