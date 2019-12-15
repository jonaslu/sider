const fs = require('fs-extra');
const os = require('os');
const { spawn } = require('child_process');
const { runDb } = require('./docker-utils');

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, _config) {
    const dumpBasePathStats = fs.statSync(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      console.error(
        `Mariadb currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`
      );
      process.exit(1);
    }

    fs.copySync(dumpBasePath, snapshotStoreFolder);
  },
  getConfig() {
    return {
      port: 3306
    };
  },
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

module.exports.start(
  '/home/jonasl/code/sider2/testnew/dbs/goat/files',
  'goat',
  { port: 666 }
);
