const path = require('path');
const fs = require('fs-extra');

function getEngineFile(engineName) {
  return path.join(__dirname, `${engineName}.js`);
}

function engineExists(engineName) {
  return fs.pathExistsSync(getEngineFile(engineName));
}

module.exports = {
  // eslint-disable-next-line consistent-return
  getEngine(engineName) {
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
};
