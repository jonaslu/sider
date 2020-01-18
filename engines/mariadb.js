const fs = require('fs-extra');
const os = require('os');
const { spawn } = require('child_process');
const { runDb } = require('../utils/docker-utils');
const { getUserError } = require('../utils');

module.exports = {
  async load(dumpBasePath, snapshotStoreFolder) {
    const dumpBasePathStats = await fs.stat(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      throw getUserError(`Mariadb currently only loads entire data-dirs, cannot find a directory at ${dumpBasePath}`);
    }

    await fs.copy(dumpBasePath, snapshotStoreFolder);
  },
  getConfig() {
    return {
      port: 3306
    };
  },
  // !! TODO !!
  /*
  Add a validation method that is run when config is set
  on a snapshot or engine (stuff that doesn't immediately use
  the parameters).
  */
  start(dbPath, dbName, runtimeConfig) {
    const { port, password } = runtimeConfig;

    const dockerArgs = ['-v', `${dbPath}:/var/lib/mysql`, '-p', `${port}:3306`];

    const platform = os.platform();
    if (platform === 'linux') {
      const { uid } = os.userInfo();
      dockerArgs.push('-e', `MYSQL_USER=${uid}`);
    }

    if (password) {
      dockerArgs.push('-e', `MYSQL_ROOT_PASSWORD=${password}`);
    } else {
      dockerArgs.push('-e', 'MYSQL_ALLOW_EMPTY_PASSWORD=yes');
    }

    const dockerImageAndCommand = ['mariadb'];

    return runDb(dbName, dockerArgs, dockerImageAndCommand);
  },
  stop(dbName, runtimeConfig) {
    const { password } = runtimeConfig;

    const dockerArgs = ['exec', dbName, '/usr/bin/mysqladmin', '-uroot'];

    if (password) {
      dockerArgs.push(`-p${password}`);
    }

    dockerArgs.push('shutdown');

    spawn('docker', dockerArgs);
  }
};
