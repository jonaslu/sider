const chalk = require('chalk');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const config = require('../config');

function runDb(dbPath, dbName, port, printStdout = true) {
  let osSpecificArgs = [];

  const platform = os.platform();
  if (platform === 'linux') {
    const { uid, gid } = os.userInfo();
    osSpecificArgs = [
      '-v',
      '/etc/group:/etc/group:ro',
      '-v',
      '/etc/passwd:/etc/passwd:ro',
      '-u',
      `${uid}:${gid}`
    ];
  }

  const args = [
    'run',
    '--rm',
    ...osSpecificArgs,
    '-v',
    `${dbPath}:/data`,
    '-p',
    `${port}:6379`,
    '--name',
    dbName,
    `redis:${config.redisVersion}`,
    'redis-server'
  ];

  const dbNameInBlue = chalk.blue(dbName);

  console.log(chalk.green(`✨ Starting db ${dbNameInBlue} on port ${port} 🚀`));

  const childProcess = spawn('docker', args);

  if (printStdout) {
    childProcess.stdout.on('data', data =>
      process.stdout.write(`${data.toString('utf-8')}`)
    );
  }

  childProcess.on('close', () => {
    console.log(chalk.green(`Successfully shut down db ${dbNameInBlue}`));
  });
}

// Start batch calls the above with printStdout = false

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, params) {
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
    fs.copySync(copyFilePath, dumpCopyFile);
  },
  start(dbPath, dbName, dbPort, params) {
    // !! TODO !! Make this into a promise so
    // the outside can print starting and stopping messages
    return runDb(dbPath, dbName, dbPort);
  }
};
