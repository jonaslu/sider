const fs = require('fs-extra');
const path = require('path');
const { runDb } = require('./docker-utils');

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, _config) {
    let copyFilePath;

    const dumpBasePathStats = fs.statSync(dumpBasePath);

    if (dumpBasePathStats.isFile()) {
      copyFilePath = dumpBasePath;
    } else {
      copyFilePath = path.join(dumpBasePath, 'dump.rdb');
      const dumpFileExists = fs.pathExistsSync(copyFilePath);

      if (!dumpFileExists) {
        console.error(`Cannot find a dump.rdb file in path ${dumpBasePath}`);
        process.exit(1);
      }
    }

    const dumpCopyFile = path.join(snapshotStoreFolder, 'dump.rdb');

    // !! TODO !! Making this async would probably speed things up
    // considerably
    fs.copySync(copyFilePath, dumpCopyFile);
  },
  getConfig() {
    return {
      port: 6379
    };
  },
  start(dbPath, dbName, runtimeConfig) {
    const { port } = runtimeConfig;
    let { version } = runtimeConfig;

    if (!version) {
      version = 'latest';
    }

    const dockerArgs = ['-v', `${dbPath}:/data`, '-p', `${port}:6379`];
    const dockerImageAndCommand = [`redis:${version}`, 'redis-server'];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  }
};
