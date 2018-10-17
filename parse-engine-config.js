module.exports = {
  parseConfigKeyValues(config) {
    return config.reduce((acc, keyValue) => {
      const [key, value] = keyValue.split('=');
      acc[key] = value;

      return acc;
    }, {});
  },
  formatConfigKeyValuesForConsole(config) {
    return Object.keys(config)
      .map(key => `${key}=${config[key]}`)
      .join('\n');
  }
};
