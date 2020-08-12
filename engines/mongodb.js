const fs = require('fs-extra');
const { runDb } = require('../utils/docker-utils');
const { getUserError } = require('../utils');

module.exports = {
  async load(dumpBasePath, snapshotStoreFolder) {
    const dumpBasePathStats = await fs.stat(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      throw getUserError(`Mongodb only loads entire data-dirs, cannot find a directory at ${dumpBasePath}`);
    }

    await fs.copy(dumpBasePath, snapshotStoreFolder);
  },
  getConfig() {
    return {
      port: 27017,
    };
  },
  start(dbPath, dbName, runtimeConfig) {
    const { port } = runtimeConfig;
    let { version } = runtimeConfig;

    if (!version) {
      version = 'latest';
    }

    const dockerArgs = ['-v', `${dbPath}:/data/db`, '-p', `${port}:27017`];
    const dockerImageAndCommand = [`mongo:${version}`];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  },
};
