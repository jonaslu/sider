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
    
    if (process.platform === "win32") {
      const readline = require("readline");
      
      readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    
      readline.on("SIGINT", () => {
        process.emit("SIGINT");
      });
    }

    process.on('SIGINT', () => {
      if (engine.stop) {
        engine.stop(dbName, runtimeConfig);
      }
    });

    return engine.start(dbFileFolder, dbName, runtimeConfig);
  }
};
