const chalk = require('chalk');
const { printUserErrorAndDie } = require('../utils');

module.exports = {
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

  printRuntimeConfigValues(runtimeConfig) {
    const sortedConfigKeys = Object.keys(runtimeConfig).sort((a, b) => (a > b ? 1 : a === b ? 0 : -1));

    sortedConfigKeys.forEach(key => {
      console.log(`${chalk.yellow(key)}=${runtimeConfig[key]}`);
    });
  }
};
