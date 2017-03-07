"use strict";

const simpleGit = require('simple-git')(__dirname);

function clone(gitUrl, folder, branch) {
  return new Promise((resolve, reject) => {
    simpleGit.clone(gitUrl, folder, null, error => {
      if (error) {
        return reject(error);
      }
    })
      .cwd(folder)
      .checkout(branch)
      .cwd(__dirname)
      .then(resolve);
  });
}

function addRemote(name, repo, folder) {
  return new Promise((resolve, reject) => {
    simpleGit
      .cwd(folder)
      .addRemote(name, folder, error => {
        if (error) {
          return reject(error);
        }
      })
      .cwd(__dirname)
      .then(resolve);
  });
}

function add(file, folder) {
  return new Promise((resolve, reject) => {
    simpleGit
      .cwd(folder)
      .add(file, error => {
        if (error) {
          return reject(error);
        }
      })
      .cwd(__dirname)
      .then(resolve);
  });
}

function commit(message, folder) {
  return new Promise((resolve, reject) => {
    simpleGit
      .cwd(folder)
      .commit(message, error => {
        if (error) {
          return reject(error);
        }
      })
      .cwd(__dirname)
      .then(resolve);
  });
}

function push(remote, branch, folder) {
  return new Promise((resolve, reject) => {
    simpleGit
      .cwd(folder)
      .push(remote, branch, error => {
        if (error) {
          return reject(error);
        }
      })
      .cwd(__dirname)
      .then(resolve);
  });
}

module.exports = {
  clone: clone,
  addRemote: addRemote,
  add: add,
  commit: commit,
  push: push
};
