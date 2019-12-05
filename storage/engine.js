const fsExtra = require('fs-extra');
const path = require('path');

const engines = require('../engines');
const { mergeRuntimeConfig } = require('../runtime/config');

const { internalErrorAndDie } = require('../utils');
const { engineStoragePath } = require('../siderrc');

/**
 * {
 * // For the config file2
 *  runtimeConfig: {
 *  }
 * }
 */

const specsFileName = 'specs.json';

module.exports = {
  async getEngineRuntimeConfig(engineName) {
    const engine = await engines.getEngineOrDie(engineName);
    const defaultRuntimeConfig = engine.getConfig();

    const engineSpecsFile = path.join(
      engineStoragePath,
      engineName,
      specsFileName
    );

    let diskSpecs = {};
    const specsExists = await fsExtra.exists(engineSpecsFile);
    if (specsExists) {
      try {
        diskSpecs = await fsExtra.readJSON(engineSpecsFile, 'utf-8');
      } catch (e) {
        internalErrorAndDie(
          `Could not read file ${engineSpecsFile}.
Has the contents been tampered with?`,
          e
        );
      }
    }

    return {
      runtimeConfig: mergeRuntimeConfig(defaultRuntimeConfig, diskSpecs.runtimeConfig)
    };
  }
};
