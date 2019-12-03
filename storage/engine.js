const fsExtra = require('fs-extra');
const path = require('path');

const engines = require('../engines');
const settings = require('../settings');

const { internalErrorAndDie } = require('../utils');
const { engineStoragePath } = require('../siderrc');

/**
 * {
 * // For the config file2
 *  config: {
 *  }
 * }
 */

const settingsFileName = 'settings.json';

module.exports = {
  async getEngineConfig(engineName) {
    const engine = await engines.getEngineOrDie(engineName);
    const defaultSettings = engine.getConfig();

    const engineConfigFile = path.join(
      engineStoragePath,
      engineName,
      settingsFileName
    );

    let diskConfig = {};
    const configExists = await fsExtra.exists(engineConfigFile);
    if (configExists) {
      try {
        diskConfig = await fsExtra.readJSON(engineConfigFile, 'utf-8');
      } catch (e) {
        internalErrorAndDie(
          `Could not read engine ${engineName} setings.json ${engineConfigFile}`,
          e
        );
      }
    }

    return {
      config: settings.mergeSettings(defaultSettings, diskConfig.config)
    };
  }
};
