const tabtab = require('tabtab');

module.exports = {
  install() {
    return tabtab
      .install({
        name: 'sider',
        completer: 'sider'
      })
      .then(() => console.log('Completion installed'))
      .catch(err => console.error('Error installing completion', err));
  },

  uninstall() {
    return tabtab
      .uninstall({
        name: 'sider'
      })
      .then(() => console.log('Completion uninstalled'))
      .catch(err => console.error('Error uninstalling completion', err));
  }
};
