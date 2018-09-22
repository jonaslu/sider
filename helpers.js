const path = require('path');

module.exports = {
  ensureFolder(folder) {
    return folder.endsWith(path.sep) ? folder : path.join(folder, path.sep);
  }
};
