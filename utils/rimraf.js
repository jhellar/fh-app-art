"use strict";

const rimraf = require('rimraf');

module.exports = function(path) {
  return new Promise(resolve => {
    rimraf(path, resolve);
  });
};
