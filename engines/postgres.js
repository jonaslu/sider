const fs = require('fs-extra');
const os = require('os');
const { spawn } = require('child_process');

// !! TODO !! Create a docker-runner helper - unify this and redis
// !! TODO !! Make ports and other stuff configurable
function runDb(dbPath, dbName, port, echoOutput = true) {
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
    `${dbPath}:/var/lib/postgresql/data`,
    '-p',
    `${port}:5432`,
    '--name',
    dbName,
    'postgres'
  ];

  const childProcess = spawn('docker', args);

  if (echoOutput) {
    childProcess.stdout.on('data', data =>
      process.stdout.write(`${data.toString('utf-8')}`)
    );

    childProcess.stderr.on('data', data => {
      process.stdout.write(`${data.toString('utf-8')}`);
    });
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
    const dumpBasePathStats = fs.statSync(dumpBasePath);

    if (!dumpBasePathStats.isDirectory()) {
      console.error(
        `Postgres currently only loads entire data-dirs, cannot find directory at ${dumpBasePath}`
      );
      process.exit(1);
    }

    fs.copySync(dumpBasePath, snapshotStoreFolder);
  },
  getConfig(storedSettings) {
    return {
      defaultPort: 5432,
      ...storedSettings
    }
  },
  start(dbPath, dbName, dbPort, config) {
    return runDb(dbPath, dbName, dbPort);
  }
};
