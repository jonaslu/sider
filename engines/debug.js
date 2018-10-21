module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(dumpBasePath, snapshotStoreFolder, config) {
    console.log(arguments);
  },
  getConfig(storedSettings) {
    console.log(arguments);
  },
  start(dbPath, dbName, config) {
    console.log(arguments);
  }
};
