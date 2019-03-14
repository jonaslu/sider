module.exports = {
  // !! TODO !! Make this return a promise (or have a done callback)
  // for things that are async
  load(...args) {
    console.log(args);
  },
  getConfig(...args) {
    console.log(args);
  },
  start(...args) {
    console.log(args);
  }
};
