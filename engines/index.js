const fsExtra = require('fs-extra');
const path = require('path');

const { errorAndDie } = require('../utils');

function getEngineFile(engineName) {
  return path.join(__dirname, `${engineName}.js`);
}

// eslint-disable-next-line consistent-return
async function getEngine(engineName) {
  const enginePath = getEngineFile(engineName);
  const engineExists = await fsExtra.pathExists(enginePath);

  if (engineExists) {
    try {
      // eslint-disable-next-line
      return require(enginePath);
    } catch (e) {
      errorAndDie(`Could not require file ${enginePath}
It's probably a compile error in the file`, e);
    }
  }

  return undefined;
}

module.exports = {
  getEngine
};
