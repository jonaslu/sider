module.exports = {
  parseConfigKeyValues(config) {
    return config.reduce((acc, keyValue) => {
      const [key, value] = keyValue.split('=');
      acc[key] = value;

      return acc;
    }, {});
  }
};
