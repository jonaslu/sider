const fsExtra = require('fs-extra');
const path = require('path');

const engines = require('../engines');
const runtimeConfig = require('../runtime/config');

const { internalErrorAndDie } = require('../utils');
const { engineStoragePath } = require('../siderrc');

/**
 * {
 * // For the config file2
 *  runtimeConfigSpec: {
 *  }
 * }
 */

const specsFileName = 'specs.json';

module.exports = {
  async getEngineRuntimeConfig(engineName) {
    const engine = await engines.getEngineOrDie(engineName);
    const defaultRuntimeConfig = engine.getConfig();

    const engineSpecsFile = path.join(engineStoragePath, engineName, specsFileName);

    let runtimeConfigSpec = {};
    const specsExists = await fsExtra.exists(engineSpecsFile);
    if (specsExists) {
      try {
        const diskSpecs = await fsExtra.readJSON(engineSpecsFile, 'utf-8');
        runtimeConfigSpec = diskSpecs.runtimeConfigSpec;
      } catch (e) {
        internalErrorAndDie(
          `Could not read file ${engineSpecsFile}.
Has the contents been tampered with?`,
          e
        );
      }
    }

    return {
      runtimeConfigSpec: runtimeConfig.mergeRuntimeConfig(defaultRuntimeConfig, runtimeConfigSpec)
    };
  },

  // It's expected to been verified that the engineName exist
  async appendRuntimeConfig(engineName, newCliRuntimeConfig) {
    const engineSpecsFile = path.join(engineStoragePath, engineName, specsFileName);
    const specsExists = await fsExtra.exists(engineSpecsFile);
    if (!specsExists) {
      await fsExtra.createFile(engineSpecsFile);
      await fsExtra.writeJSON(engineSpecsFile, { runtimeConfigSpec: {} });
    }

    await runtimeConfig.appendRuntimeConfig(engineSpecsFile, newCliRuntimeConfig);
  }
};
