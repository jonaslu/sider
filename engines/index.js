const fsExtra = require('fs-extra');
const path = require('path');

const { internalErrorAndDie, printInternalAndDie } = require('../utils');

function getEngineFile(engineName) {
  return path.join(__dirname, `${engineName}.js`);
}

async function getEngine(engineName) {
  const enginePath = getEngineFile(engineName);
  const engineExists = await fsExtra.pathExists(enginePath);

  if (engineExists) {
    try {
      // eslint-disable-next-line
      return require(enginePath);
    } catch (e) {
      internalErrorAndDie(
        `Could not require file ${enginePath}
It's probably a compile error in the file`,
        e
      );
    }
  }

  return undefined;
}

async function getEngineOrDie(engineName) {
  const engine = await getEngine(engineName);
  if (!engine) {
    printInternalAndDie(`Could not find engine ${engineName}`);
  }
  return engine;
}

module.exports = {
  getEngine,
  getEngineOrDie,
  async getAllEngineNames() {
    const allFiles = await fsExtra.readdir(__dirname);

    return allFiles.filter(file => file !== 'index.js').map(file => path.parse(file).name);
  },
  async start(engineName, dbName, dbFileFolder, runtimeConfig) {
    const engine = await getEngineOrDie(engineName);

    // !! TODO !! Let engines validate the sent config

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
        engine.stop(dbName, runtimeConfig);
        stopCalled = true;
      }
    });

    return engine.start(dbFileFolder, dbName, runtimeConfig);
  }
};
