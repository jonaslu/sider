const fileDb = require('./storage/file-db');
const engines = require('./engines');

const emptyReturnValue = [];

function getEngines(words) {
  // If first word is set we're at the end...
  if (words.length > 0) {
    return emptyReturnValue;
  }

  return engines.listEngines();
}

function getDbName(words) {
  if (words && words.length > 0) {
    return emptyReturnValue;
  }

  return fileDb.getDbsAsArray().map(value => value.dbName);
}

function getSnapshots(words) {
  if (words && words.length > 0) {
    return emptyReturnValue;
  }

  return fileDb.getSnapshotsAsArray().map(value => value.snapshotName);
}

function getDbNameWithSnapshotAndParameters(words) {
  let validParameter = false;
  if (words && words.length > 0) {
    validParameter = module.exports.db.start.options.find(
      value => value === words[0]
    );
  }

  switch (words.length) {
    case 0: {
      const returnValue = module.exports.db.start.options;
      return returnValue.concat(getDbName());
    }
    case 1: // if -p, --persist
      if (validParameter) {
        return getDbName();
      }
      return getSnapshots();
    case 2:
      if (validParameter) {
        return getSnapshots();
      }

      return emptyReturnValue;
    default:
      return emptyReturnValue;
  }
}

function getDbNameAndSnapshot(words) {
  switch (words.length) {
    case 0: {
      return getDbName();
    }
    case 1:
      return getSnapshots();
    default:
      return emptyReturnValue;
  }
}

function getSnapshotWithParameters(words) {
  let validParameter = false;
  if (words && words.length > 0) {
    validParameter = module.exports.snapshot.add.options.find(
      value => value === words[0]
    );
  }

  switch (words.length) {
    case 0: {
      const returnValue = module.exports.snapshot.add.options;
      return returnValue.concat(engines.listEngines());
    }
    case 1: {
      if (validParameter) {
        return engines.listEngines();
      }
      return getSnapshots();
    }
    case 2: {
      if (validParameter) {
        return getSnapshots();
      }

      return emptyReturnValue;
    }
    default:
      return emptyReturnValue;
  }
}

module.exports = {
  engine: {
    setconf: {
      commanderLine: 'setconf <engineName> [keyvalues...]',
      complete: getEngines
    },
    getconf: {
      commanderLine: 'getconf <engineName>',
      complete: getEngines
    },
    remconf: {
      commanderLine: 'remconf <engineName> [keys...]',
      complete: getEngines
    }
  },
  db: {
    start: {
      commanderLine: 'start <name> [snapshot] [parameters...]',
      options: ['-p', '--persist'],
      complete: getDbNameWithSnapshotAndParameters
    },
    remove: {
      commanderLine: 'remove <name>',
      complete: getDbName
    },
    list: {
      commanderLine: 'list',
      options: ['-s', '--settings'],
      complete: words => {
        if (words.length > 0) {
          return emptyReturnValue;
        }
        return module.exports.db.list.options;
      }
    },
    promote: {
      commanderLine: 'promote <name> <snapshotName>',
      complete: getDbNameAndSnapshot
    },
    reset: {
      commanderLine: 'reset <name>',
      complete: getDbName
    },
    setconf: {
      commanderLine: 'setconf <name> [keyvalues...]',
      complete: getDbName
    },
    getconf: {
      commanderLine: 'getconf <name>',
      complete: getDbName
    },
    remconf: {
      commanderLine: 'remconf <name> [keys...]',
      complete: getDbName
    },
    eject: {
      commanderLine: 'eject <name> <ejectPath>',
      complete: getDbName
    }
  },
  snapshot: {
    add: {
      commanderLine: 'add <engineName> <snapshotName> [path]',
      options: ['-e', '--empty'],
      complete: getSnapshotWithParameters
    },
    remove: {
      commanderLine: 'remove <snapshotName>',
      complete: getSnapshots
    },
    list: {
      commanderLine: 'list',
      complete: () => emptyReturnValue
    }
  }
};
