const { printUserErrorAndDie } = require('../utils');

module.exports = {
  // Later in list = higher prio
  mergeSettings(...settings) {
    const result = {};
    settings.forEach(setting => {
      Object.keys(setting).forEach(settingKey => {
        result[settingKey] = setting[settingKey];
      });
    })

    return result;
  },

  parseSettingsKeyValues(settings) {
    return settings.reduce((acc, keyValue) => {

      if (!keyValue.includes("=")) {
        printUserErrorAndDie(`Malformed settings value: ${keyValue} no "=" found`);
      }

      const [key, value] = keyValue.split('=');
      if (!value) {
        printUserErrorAndDie(`Malformed settings value: ${keyValue}, no value given for key ${key}`);
      }

      if (!key) {
        printUserErrorAndDie(`Malformed settings value: ${keyValue}, no key given for value ${value}`);
      }

      acc[key] = value;

      return acc;
    }, {});
  }
}
