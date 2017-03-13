"use strict";

const Template = require('./template.js');
const webdriverio = require('webdriverio');
const options = { desiredCapabilities: { browserName: 'chrome' } };
const client = webdriverio.remote(options);
const config = require('../config');
const fhc = require('../utils/fhc');
const exec = require('../utils/exec');
const path = require('path');
const rimraf = require('../utils/rimraf');
const promisify = require('promisify-node');
const fs = promisify('fs');
const studio = require('../utils/studio');

class SAMLTemplate extends Template {

  constructor(name, repoUrl, repoBranch, projectTemplateId, scheme) {
    super(name, repoUrl, repoBranch, projectTemplateId, scheme);

    this.SAMLTempFolder = path.resolve(__dirname, '../tempSAML');

    this.prepare = this.prepare.bind(this);
    this.prepareService = this.prepareService.bind(this);
    this.createService = this.createService.bind(this);
    this.deployService = this.deployService.bind(this);
    this.setSAMLVariables = this.setSAMLVariables.bind(this);
    this.getSAMLExampleUrl = this.getSAMLExampleUrl.bind(this);
    this.getSAMLIssuer = this.getSAMLIssuer.bind(this);
    this.addSP = this.addSP.bind(this);
    this.associateService = this.associateService.bind(this);
    this.associateSAML = this.associateSAML.bind(this);
  }

  prepare() {
    return super.prepare()
      .then(() => (rimraf(this.SAMLTempFolder)))
      .then(() => (fhc.environmentRead(this.environment)))
      .then(env => {
        this.environmentName = env.label;
      })
      .then(fhc.servicesList)
      .then(this.prepareService)
      .then(this.associateService)
      .then(this.associateSAML);
  }

  prepareService(services) {
    const matchingServices = services.filter(service => {
      const templateMatch = service.jsonTemplateId === 'saml-service';
      const prefixMatch = service.title.startsWith(config.prefix);
      return templateMatch && prefixMatch;
    });
    if (matchingServices.length === 0) {
      return this.createService()
        .then(this.deployService);
    }
    const runningServ = matchingServices.find(service => {
      const cloudApp = service.apps.find(app => (app.type === 'cloud_nodejs'));
      return cloudApp.runtime[this.environment];
    });
    if (!runningServ) {
      this.service = matchingServices[0];
      this.serviceId = this.service.apps.find(app => (app.type === 'cloud_nodejs')).guid;
      return this.deployService();
    }
    this.serviceId = runningServ.apps.find(app => (app.type === 'cloud_nodejs')).guid;
    this.service = runningServ;
  }

  createService() {
    return fhc.serviceCreate(this.projectName, 'saml-service')
      .then(service => {
        this.service = service;
        this.serviceId = service.apps[0].guid;
      });
  }

  deployService() {
    return fhc.appDeploy(this.serviceId, this.environment)
      .then(this.setSAMLVariables)
      .then(this.getSAMLExampleUrl)
      .then(this.getSAMLIssuer)
      .then(this.addSP);
  }

  setSAMLVariables() {
    return studio.init(client)
      .url(`${config.host}/#/services/${this.service.guid}/apps/${this.serviceId}/environment_variables`)
      .then(() => (studio.login(client, config.username, config.password)))
      .pause(10000)
      .then(() => (studio.selectEnvironment(client, this.environmentName)))
      .then(() => (studio.addVariable(client, 'SAML_ENTRY_POINT', config.samlEntryPoint)))
      .then(() => (studio.addVariable(client, 'SAML_AUTH_CONTEXT', config.samlAuthContext)))
      .then(() => (studio.addVariable(client, 'SAML_CERT', config.samlCert)))
      .then(() => (studio.pushVariables(client)))
      .end();
  }

  getSAMLExampleUrl() {
    return studio.init(client)
      .url(`${config.host}/#/services/${this.service.guid}/apps/${this.serviceId}/preview`)
      .then(() => (studio.login(client, config.username, config.password)))
      .pause(10000)
      .then(() => (studio.selectEnvironment(client, this.environmentName)))
      .waitForVisible('.cloud-url')
      .getText('.cloud-url')
      .then(samlExampleUrl => {
        this.samlExampleUrl = samlExampleUrl;
      })
      .end();
  }

  getSAMLIssuer() {
    return studio.init(client)
      .url(this.samlExampleUrl)
      .waitForVisible('tbody tr:first-child td:nth-child(2)')
      .getText('tbody tr:first-child td:nth-child(2)')
      .then(issuer => {
        this.samlIssuer = issuer;
      })
      .end();
  }

  addSP() {
    return fs.mkdir(this.SAMLTempFolder)
      .then(() => (exec('oc project saml', this.SAMLTempFolder)))
      .then(() => (exec('oc get pods -o json', this.SAMLTempFolder)))
      .then(pods => {
        this.samlPod = JSON.parse(pods.stdout).items[0].metadata.name;
      })
      .then(() => (exec(`oc rsync ${this.samlPod}:/var/simplesamlphp/metadata/ .`, this.SAMLTempFolder)))
      .then(() => (
        fs.appendFile(
          path.resolve(this.SAMLTempFolder, 'saml20-sp-remote.php'),
          `
          $metadata['${this.samlIssuer}'] = array(
            'AssertionConsumerService' => '${this.samlIssuer}',
          );`
        )
      ))
      .then(() => (exec(`oc rsync ./ ${this.samlPod}:/var/simplesamlphp/metadata`, this.SAMLTempFolder)));
  }

  associateService() {
    return studio.init(client)
      .url(`${config.host}/#/projects/${this.project.guid}/apps`)
      .then(() => (studio.login(client, config.username, config.password)))
      .waitForVisible('.associate_services')
      .pause(5000)
      .element('#connectors_list').isVisible(`.item_title*=${this.service.title}`)
      .then(associated => {
        if (!associated) {
          return client
            .click('.associate_services')
            .waitForVisible(`div.title=${this.projectName}`)
            .click(`div.title=${this.projectName}`)
            .waitForVisible('.save_btn')
            .click('.save_btn');
        }
      })
      .end();
  }

  associateSAML() {
    return studio.init(client)
      .url(`${config.host}/#/projects/${this.project.guid}/apps/${this.cloudApp.guid}/environment_variables`)
      .then(() => (studio.login(client, config.username, config.password)))
      .then(() => (studio.selectEnvironment(client, this.environmentName)))
      .pause(2000)
      .element('#app-env-vars-list').isVisible('td=SAML_SERVICE')
      .then(visible => {
        if (visible) {
          return client
            .element('#app-env-vars-list').click('td=SAML_SERVICE')
            .pause(2000);
        } else {
          return client
            .waitForVisible('.add_env_var_btn')
            .click('.add_env_var_btn')
            .pause(2000)
            .waitForVisible('#name')
            .setValue('#name', 'SAML_SERVICE');
        }
      })
      .waitForVisible('#env_var_value')
      .clearElement('#env_var_value')
      .setValue('#env_var_value', this.serviceId)
      .waitForVisible('.save_env_var_btn')
      .click('.save_env_var_btn')
      .pause(2000)
      .then(() => (studio.pushVariables(client)))
      .end();
  }

}

module.exports = SAMLTemplate;
