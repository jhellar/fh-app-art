"use strict";

const exec = require('child_process').exec;

module.exports = function(command, cwd) {
  return new Promise((resolve, reject) => (
    exec(command, { cwd: cwd, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }

      resolve({
        stdout: stdout,
        stderr: stderr
      });
    })
  ));
};
