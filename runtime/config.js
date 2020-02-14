const fsExtra = require('fs-extra');

const { printUserErrorAndDie, internalErrorAndDie } = require('../utils');

module.exports = {
  // Later in list = higher prio
  mergeRuntimeConfig(...config) {
    const result = {};
    config.forEach(config => {
      Object.keys(config).forEach(configKey => {
        result[configKey] = config[configKey];
      });
    });

    return result;
  },

  parseRuntimeConfigKeyValues(config) {
    return config.reduce((acc, keyValue) => {
      if (!keyValue.includes('=')) {
        printUserErrorAndDie(`Malformed config value: ${keyValue} no "=" found`);
      }

      const [key, value] = keyValue.split('=');
      if (!value) {
        printUserErrorAndDie(`Malformed config value: ${keyValue}, no value given for key ${key}`);
      }

      if (!key) {
        printUserErrorAndDie(`Malformed config value: ${keyValue}, no key given for value ${value}`);
      }

      acc[key] = value;

      return acc;
    }, {});
  },

  async appendRuntimeConfig(specsFile, newRuntimeConfig) {
    try {
      const specsFileContents = await fsExtra.readJSON(specsFile);
      const mergedRuntimeConfig = this.mergeRuntimeConfig(specsFileContents.runtimeConfigSpec, newRuntimeConfig);

      specsFileContents.runtimeConfigSpec = mergedRuntimeConfig;

      return await fsExtra.writeJSON(specsFile, specsFileContents, {
        spaces: 2
      });
    } catch (e) {
      internalErrorAndDie(`Error persisting new runtime config to file ${specsFile}`, e);
    }
  }
};
