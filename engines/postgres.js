const fs = require('fs-extra');
const { runDb } = require('./docker-utils');

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, _config) {
    const dumpBasePathStats = fs.statSync(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      console.error(
        `Postgres currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`
      );
      process.exit(1);
    }

    fs.copySync(dumpBasePath, snapshotStoreFolder);
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
