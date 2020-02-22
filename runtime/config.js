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
};
