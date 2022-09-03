const fs = require('fs-extra');
const { runDb } = require('../utils/docker-utils');
const { getUserError } = require('../utils');

module.exports = {
  async load(dumpBasePath, snapshotStoreFolder) {
    const dumpBasePathStats = await fs.stat(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      throw getUserError(`Postgres currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`);
    }

    await fs.copy(dumpBasePath, snapshotStoreFolder);
  },
  getConfig() {
    return {
      port: 5432,
      version: 'latest'
    };
  },
  start(dbPath, dbName, runtimeConfig) {
    const { port, password, version } = runtimeConfig;

    let passOrTrustSettings = ['-e', 'POSTGRES_HOST_AUTH_METHOD=trust'];
    if (password) {
      passOrTrustSettings = ['-e', `POSTGRES_PASSWORD=${password}`];
    }

    // prettier-ignore
    const dockerArgs = [
      ...passOrTrustSettings,
      '-v',
      `${dbPath}:/var/lib/postgresql/data`,
      '-p',
      `${port}:5432`
    ];

    const dockerImageAndCommand = [`postgres:${version}`,'postgres'];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  }
};
