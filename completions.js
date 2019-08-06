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

function getSnapshots() {
  return fileDb.getSnapshotsAsArray().map(value => value.snapshotName);
}

function getDbNameWithSnapshotAndParameters(words) {
  switch (words.length) {
    case 0: {
      let returnValue = module.exports.db.start.options;
      returnValue = returnValue.concat(getDbName());
      return returnValue;
    }
    case 1: // if -p, --persist
      if (
        module.exports.db.start.options.find(
          value => value === words[words.length - 1]
        )
      ) {
        return getDbName();
      }
      return getSnapshots();
    case 2:
      if (
        module.exports.db.start.options.find(
          value => value === words[words.length - 2]
        )
      ) {
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
  }
};
