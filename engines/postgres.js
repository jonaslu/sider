const fs = require('fs-extra');
const { runDb } = require('../utils/docker-utils');
const { getUserError } = require('../utils');

module.exports = {
  async load(dumpBasePath, snapshotStoreFolder) {
    const dumpBasePathStats = await fs.stat(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      throw getUserError(
        `Postgres currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`
      );
    }

    await fs.copy(dumpBasePath, snapshotStoreFolder);
  },
  getConfig() {
    return {
      port: 5432
    };
  },
  start(dbPath, dbName, runtimeConfig) {
    const { port } = runtimeConfig;

    const dockerArgs = [
      '-v',
      `${dbPath}:/var/lib/postgresql/data`,
      '-p',
      `${port}:5432`
    ];
    const dockerImageAndCommand = ['postgres'];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  }
};
