const fsExtra = require('fs-extra');
const path = require('path');

const engines = require('../engines');

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

async function writeRuntimeConfigSpecToFile(engineName, modifyRuntimeConfigSpecCb) {
  const engineSpecsFile = path.join(engineStoragePath, engineName, specsFileName);
  const specsExists = await fsExtra.exists(engineSpecsFile);

  let specsFileContents = { runtimeConfigSpec: {} };

  if (specsExists) {
    try {
      specsFileContents = await fsExtra.readJSON(engineSpecsFile);
    } catch (e) {
      internalErrorAndDie(`Error reading file ${engineSpecsFile}`, e);
    }
  }

  modifyRuntimeConfigSpecCb(specsFileContents);

  try {
    await fsExtra.outputJSON(engineSpecsFile, specsFileContents, { spaces: 2 });
  } catch (e) {
    internalErrorAndDie(`Error persisting settings to file ${engineSpecsFile}`);
  }
}

module.exports = {
  async getEngineRuntimeConfigSpec(engineName) {
    const engineSpecsFile = path.join(engineStoragePath, engineName, specsFileName);

    const specsExists = await fsExtra.exists(engineSpecsFile);
    if (specsExists) {
      try {
        const diskSpecs = await fsExtra.readJSON(engineSpecsFile, 'utf-8');
        return diskSpecs.runtimeConfigSpec;
      } catch (e) {
        internalErrorAndDie(
          `Could not read file ${engineSpecsFile}.
Has the contents been tampered with?`,
          e
        );
      }
    }
  },

  // !! TODO !! Maybe this should not load the defaults from the engine
  // but let the caller handle that - so this knows nothing but
  // the internal structure
  async getEngineRuntimeConfig(engineName) {
    const engine = await engines.getEngineOrDie(engineName);
    const defaultRuntimeConfig = engine.getConfig();

    const runtimeConfigSpec = await this.getEngineRuntimeConfigSpec(engineName);

    return {
      runtimeConfigSpec: { ...defaultRuntimeConfig, ...runtimeConfigSpec }
    };
  },

  // It's expected to been verified that the engineName exist
  async appendRuntimeConfig(engineName, newCliRuntimeConfig) {
    writeRuntimeConfigSpecToFile(engineName, specsFileContents => {
      specsFileContents.runtimeConfigSpec = {
        ...specsFileContents.runtimeConfigSpec,
        ...newCliRuntimeConfig
      };
    });
  },

  // It's expected to been verified that the engineName exist
  async overwriteRuntimeConfigSpec(engineName, newRutimeConfigSpec) {
    writeRuntimeConfigSpecToFile(engineName, specsFileContents => {
      specsFileContents.runtimeConfigSpec = newRutimeConfigSpec;
    });
  }
};
