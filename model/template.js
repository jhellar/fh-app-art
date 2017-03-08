"use strict";

const git = require('../utils/git');
const fhc = require('../utils/fhc');
const exec = require('../utils/exec');
const rimraf = require('../utils/rimraf');
const config = require('../config');
const path = require('path');
const plist = require('plist');
const promisify = require('promisify-node');
const fs = promisify('fs');

class Template {

  constructor(name, repoUrl, repoBranch, projectTemplateId, fhconfigPath, xcworkspace, scheme) {
    this.name = name;
    this.repoUrl = repoUrl;
    this.repoBranch = repoBranch;
    this.projectTemplateId = projectTemplateId;
    this.fhconfigPath = fhconfigPath;
    this.xcworkspace = xcworkspace;
    this.scheme = scheme;
    this.tempFolder = path.resolve(__dirname, '../temp');

    this.prepare = this.prepare.bind(this);
    this.test = this.test.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  prepare() {
    return git.clone(this.repoUrl, this.tempFolder, this.repoBranch)
      .then(() => {
        this.projectName = 'app-art-' + new Date().getTime();
        return fhc.projectCreate(this.projectName, this.projectTemplateId);
      })
      .then(project => {
        this.project = project;
        this.cloudApp = project.apps.find(app => (app.type === 'cloud_nodejs'));
        return fhc.appDeploy(this.cloudApp.guid, config.environment);
      })
      .then(() => (fhc.connectionsList(this.project.guid)))
      .then(connections => (fhc.connectionUpdate(this.project.guid, connections.find(conn => (conn.destination === 'ios')).guid, this.cloudApp.guid, config.environment)))
      .then(connection => {
        this.connection = connection;
        this.clientApp = this.project.apps.find(app => (app.guid === connection.clientApp));
        const fhconfig = {
          'host': config.host,
          'appid': this.connection.clientApp,
          'projectid': this.project.guid,
          'appkey': this.clientApp.apiKey,
          'connectiontag': connection.tag
        };
        const fhconfigPath = path.resolve(this.tempFolder, this.fhconfigPath);
        return fs.writeFile(fhconfigPath, plist.build(fhconfig));
      })
      .then(() => (exec('pod install', this.tempFolder )));
  }

  test() {
    return exec(`xcodebuild clean test -workspace ${this.xcworkspace} -scheme ${this.scheme} -destination 'platform=${config.iosPlatform}'`,
      this.tempFolder);
  }

  cleanup() {
    return fhc.projectDelete(this.project.guid)
      .catch(console.error)
      .then(() => (rimraf(this.tempFolder)));
  }

}

module.exports = Template;
