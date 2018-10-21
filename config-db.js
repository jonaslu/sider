function formatConfigKeyValuesForConsole(config) {
  return Object.keys(config)
    .map(key => `${key}=${config[key]}`)
    .join('\n');
}

function parseConfigKeyValues(config) {
  return config.reduce((acc, keyValue) => {
    const [key, value] = keyValue.split('=');
    acc[key] = value;

    return acc;
  }, {});
}

function removeOneConfigKey(storedConfig, key) {
  const keyExists = Object.keys(storedConfig).find(
    storedKey => storedKey === key
  );

  if (!keyExists) {
    console.error(`Cannot remove key ${key}, not found`);
    process.exit(1);
  }

  // eslint-disable-next-line no-param-reassign
  return delete storedConfig[key];
}

module.exports = {
  printConfig(config) {
    const configMessage = formatConfigKeyValuesForConsole(config);
    console.log(configMessage);
  },

  formatConfig(config) {
    return formatConfigKeyValuesForConsole(config);
  },

  mergeConfig(configKeyValues, storedConfig) {
    const newSettings = parseConfigKeyValues(configKeyValues);
    return { ...storedConfig, ...newSettings };
  },

  removeConfig(keys, storedConfig) {
    keys.forEach(key => removeOneConfigKey(storedConfig, key));
    return storedConfig;
  }
};
