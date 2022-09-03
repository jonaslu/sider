const fs = require('fs-extra');
const path = require('path');
const { runDb } = require('../utils/docker-utils');
const { getUserError } = require('../utils');

module.exports = {
  async load(dumpBasePath, snapshotStoreFolder) {
    let copyFilePath;

    const dumpBasePathStats = await fs.stat(dumpBasePath);

    if (dumpBasePathStats.isFile()) {
      copyFilePath = dumpBasePath;
    } else {
      copyFilePath = path.join(dumpBasePath, 'dump.rdb');
    }

    const dumpFileExists = await fs.pathExists(copyFilePath);
    if (!dumpFileExists) {
      throw getUserError(`Cannot find a dump.rdb file in path ${dumpBasePath}`);
    }

    // Docker engine expects it to be called dump.rdb
    const dumpCopyFile = path.join(snapshotStoreFolder, 'dump.rdb');

    await fs.copy(copyFilePath, dumpCopyFile);
  },
  getConfig() {
    return {
      port: 6379,
      version: 'latest'
    };
  },
  start(dbPath, dbName, runtimeConfig) {
    const { port, version } = runtimeConfig;

    const dockerArgs = ['-v', `${dbPath}:/data`, '-p', `${port}:6379`];
    const dockerImageAndCommand = [`redis:${version}`, 'redis-server'];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  }
};
