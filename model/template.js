"use strict";

const git = require('../utils/git');
const fhc = require('../utils/fhc');
const exec = require('../utils/exec');
const rimraf = require('../utils/rimraf');
const config = require('../config/config');
const path = require('path');
const plist = require('plist');
const promisify = require('promisify-node');
const fs = promisify('fs');
const fsSync = require('fs');

class Template {

  constructor(name, repoUrl, repoBranch, projectTemplateId, scheme) {
    this.name = name;
    this.repoUrl = repoUrl;
    this.repoBranch = repoBranch;
    this.projectTemplateId = projectTemplateId;
    this.fhconfigPath = scheme + '/fhconfig.plist';
    this.xcworkspace = scheme + '.xcworkspace';
    this.xcodeproj = scheme + '.xcodeproj';
    this.scheme = scheme;
    this.tempFolder = path.resolve(__dirname, '../temp');
    this.projCreateTries = 0;
    this.cloudDeployTries = 0;

    this.prepare = this.prepare.bind(this);
    this.importTest = this.importTest.bind(this);
    this.prepareProject = this.prepareProject.bind(this);
    this.createProject = this.createProject.bind(this);
    this.deployCloudApp = this.deployCloudApp.bind(this);
    this.test = this.test.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  prepare() {
    return rimraf(this.tempFolder)
      .then(() => (git.clone(this.repoUrl, this.tempFolder, this.repoBranch)))
      .then(this.importTest)
      .then(fhc.projectsListNoApps)
      .then(this.prepareProject)
      .then(() => (fhc.connectionsList(this.project.guid)))
      .then(connections => (
        fhc.connectionUpdate(
          this.project.guid,
          this.push ? connections.find(conn => (conn.destination === 'ios')).guid : connections[0].guid,
          this.cloudApp.guid,
          this.environment
        )
      ))
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
      .then(() => (exec('pod install', this.tempFolder)));
  }

  importTest() {
    const testFolder = path.resolve(__dirname, `../temp/${this.scheme}UITests`);
    const files = fsSync.readdirSync(testFolder);
    const testFile = files.find(file => (file.endsWith('.swift')));
    const testFilePath = path.resolve(testFolder, testFile);
    fsSync.unlinkSync(testFilePath);
    return fs.readFile(path.resolve(__dirname, `../fixtures/ios-tests/${this.scheme}.swift`), 'utf8')
      .then(test => (fs.writeFile(testFilePath, test)));
  }

  prepareProject(projects) {
    const matchingProjects = projects.filter(project => {
      const templateMatch = project.jsonTemplateId === this.projectTemplateId;
      const prefixMatch = project.title.startsWith(config.prefix);
      return templateMatch && prefixMatch;
    });
    if (matchingProjects.length === 0) {
      this.environment = config.environment;
      return this.createProject()
        .then(this.deployCloudApp);
    }
    return matchingProjects.reduce((p, proj) => (
      p.then(() => (fhc.projectRead(proj.guid).then(full => {
        proj.apps = full.apps;
      })))
    ), Promise.resolve())
      .then(() => {
        const runningProj = matchingProjects.find(project => {
          const cloudApp = project.apps.find(app => (app.type === 'cloud_nodejs'));
          for (const env in cloudApp.runtime) {
            if (cloudApp.runtime.hasOwnProperty(env) && cloudApp.runtime[env]) {
              this.environment = env;
            }
          }
          return this.environment;
        });
        if (!runningProj) {
          this.environment = config.environment;
          this.project = matchingProjects[0];
          this.projectName = this.project.title;
          return this.deployCloudApp();
        }
        this.cloudApp = runningProj.apps.find(app => (app.type === 'cloud_nodejs'));
        this.project = runningProj;
        this.projectName = this.project.title;
      });
  }

  createProject() {
    if (this.projCreateTries >= config.retries) {
      throw new Error('Can not create project');
    }
    this.projCreateTries += 1;
    this.projectName = config.prefix + new Date().getTime();
    return fhc.projectCreate(this.projectName, this.projectTemplateId)
      .then(project => {
        this.project = project;
      })
      .catch(console.error)
      .then(() => {
        if (!this.project) {
          return this.createProject();
        }
      });
  }

  deployCloudApp() {
    if (this.cloudDeployTries >= config.retries) {
      throw new Error('Can not deploy cloud app');
    }
    this.cloudDeployTries += 1;
    this.cloudApp = this.project.apps.find(app => (app.type === 'cloud_nodejs'));
    return fhc.appDeploy(this.cloudApp.guid, this.environment)
      .then(() => {
        this.cloudDeployed = true;
      })
      .catch(console.error)
      .then(() => {
        if (!this.cloudDeployed) {
          return this.deployCloudApp();
        }
      });
  }

  test() {
    return exec(`xcodebuild clean test -workspace ${this.xcworkspace} -scheme ${this.scheme} -destination 'platform=${config.iosPlatform}'`,
      this.tempFolder);
  }

  cleanup() {
    return Promise.resolve();
  }

}

module.exports = Template;
