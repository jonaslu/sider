const chalk = require('chalk');
const { printUserErrorAndDie } = require('../utils');

function formatRuntimeConfigValues(runtimeConfig) {
  const sortedConfigKeys = Object.keys(runtimeConfig).sort((a, b) => (a > b ? 1 : a === b ? 0 : -1));
  return sortedConfigKeys.map(key => `${chalk.cyanBright(key)}=${runtimeConfig[key]}`);
};


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

  formatRuntimeConfigValues,
  printRuntimeConfigValues(runtimeConfig) {
    formatRuntimeConfigValues(runtimeConfig).forEach(value => console.log(value));
  },
};
