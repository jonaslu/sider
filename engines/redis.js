const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

// !! TODO !! Create a docker-runner helper - unify this and postgres
function runDb(dbPath, dbName, config, echoOutput = true) {
  let osSpecificArgs = [];

  const { port } = config;
  let { version } = config;

  if (!version) {
    version = 'latest';
  }

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
    `redis:${version}`,
    'redis-server'
  ];

  const childProcess = spawn('docker', args);

  if (echoOutput) {
    // !! TODO !! Maybe always print errors? Or have a debug flag?
    childProcess.stderr.on('data', data =>
      process.stderr.write(`${data.toString('utf-8')}`)
    );

    childProcess.stdout.on('data', data =>
      process.stdout.write(`${data.toString('utf-8')}`)
    );
  }

  return new Promise(resolve => {
    childProcess.on('close', resolve);
  });
}

// Start batch calls the above with printStdout = false

module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, config) {
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
  getConfig(storedSettings) {
    return {
      port: 6379,
      ...storedSettings
    };
  },
  start(dbPath, dbName, config) {
    // !! TODO !! Make this into a promise so
    // the outside can print starting and stopping messages
    return runDb(dbPath, dbName, config);
  }
};
