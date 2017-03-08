"use strict";

const Template = require('./template.js');
const config = require('../config');
// const git = require('../utils/git');
const promisify = require('promisify-node');
const fs = promisify('fs');
const webdriverio = require('webdriverio');
const options = { desiredCapabilities: { browserName: 'chrome' } };
const client = webdriverio.remote(options);
const path = require('path');
const plist = require('plist');
const exec = require('../utils/exec');
const Fastlane = require('../utils/fastlane');

class PushTemplate extends Template {

  constructor(name, repoUrl, repoBranch, projectTemplateId, fhconfigPath, xcworkspace, scheme, bundleId) {
    super(name, repoUrl, repoBranch, projectTemplateId, fhconfigPath, xcworkspace, scheme);

    this.bundleId = bundleId;
    console.log(this.tempFolder);
    this.fastlane = new Fastlane(config.iosUsername, config.iosPushBundleId, config.iosPushDevelopment, this.tempFolder);

    this.prepare = this.prepare.bind(this);
    this.test = this.test.bind(this);
    this.testOnRealDevice = this.testOnRealDevice.bind(this);
    this.sendPushNotification = this.sendPushNotification.bind(this);
    this.waitForDeviceRegistered = this.waitForDeviceRegistered.bind(this);
  }

  prepare() {
    return super.prepare()
      .then(() => (fs.readFile(`${this.tempFolder}/${this.scheme}.xcodeproj/project.pbxproj`, 'utf8')))
      .then(pbxproj => {
        const replaced = pbxproj.split(this.bundleId).join(config.iosPushBundleId).split('org.aerogear.PushStarterUITests').join(config.iosPushBundleId);
        return fs.writeFile(`${this.tempFolder}/${this.scheme}.xcodeproj/project.pbxproj`, replaced);
      })
      .then(() => (this.fastlane.produce(config.iosPushAppIDName)))
      .then(() => (this.fastlane.pem(config.iosPushP12Password, 'fastlane')))
      .then(() => (this.fastlane.sigh('fastlane.mobileprovision')))
      .then(() => (this.fastlane.updateProvisioning(`${this.scheme}.xcodeproj`, 'fastlane.mobileprovision')))
      .then(() => (exec(`sed -i '' 's/ProvisioningStyle = Automatic;/ProvisioningStyle = Manual;/' ${this.scheme}.xcodeproj/project.pbxproj`, this.tempFolder)))
      // .then(() => (git.add(`${this.scheme}.xcodeproj/project.pbxproj`, this.tempFolder)))
      // .then(() => (git.commit('Updated bundleId', this.tempFolder)))
      // .then(() => (git.addRemote('studio', this.clientApp.internallyHostedRepoUrl, this.tempFolder)))
      // .then(() => (git.push('studio', 'master', this.tempFolder)))
      .then(() => (
        client
          .init()
          .setViewportSize({ width: 1024, height: 768 })
          .timeouts('implicit', 10000)
          .url(`${config.host}/#projects/${this.project.guid}/apps/${this.clientApp.guid}/push`)
          .waitForVisible('#username')
          .setValue('#username', config.username)
          .waitForVisible('#password')
          .setValue('#password', config.password)
          .waitForVisible('#login_button')
          .click('#login_button')
          .waitForVisible('#ups-app-detail-root button')
          .click('#ups-app-detail-root button')
          .waitForVisible('.ups-variant-ios')
          .click('.ups-variant-ios')
          .waitForVisible('.ups-add-variable input[type="file"]')
          .chooseFile('.ups-add-variable input[type="file"]', path.resolve(this.tempFolder, 'fastlane.p12'))
          .waitForVisible('#iosType2')
          .click('#iosType2')
          .waitForVisible('#iosPassphrase')
          .setValue('#iosPassphrase', config.iosPushP12Password)
          .waitForVisible('#enablePush')
          .click('#enablePush')
          .waitForVisible('.variant-id')
          .getText('.variant-id')
          .then(variantId => {
            this.pushVariantId = variantId;
          })
          .waitForVisible('.variant-secret')
          .getText('.variant-secret')
          .then(variantSecret => {
            this.pushVariantSecret = variantSecret.split('\n')[0];
          })
          .end()
      ))
      .then(() => {
        const fhconfig = {
          'host': config.host,
          'appid': this.connection.clientApp,
          'projectid': this.project.guid,
          'appkey': this.clientApp.apiKey,
          'connectiontag': this.connection.tag,
          'variantID': this.pushVariantId,
          'variantSecret': this.pushVariantSecret
        };
        const fhconfigPath = path.resolve(this.tempFolder, this.fhconfigPath);
        return fs.writeFile(fhconfigPath, plist.build(fhconfig));
      });
  }

  test() {
    return exec('system_profiler SPUSBDataType')
      .then(output => {
        const deviceId = output.stdout.match(/Serial Number: ([\w\d]{40})/);
        if (!deviceId) {
          throw new Error('No connected iOS device found');
        }
        this.deviceId = deviceId[1];
      })
      .then(() => (Promise.all([this.testOnRealDevice(), this.sendPushNotification()])));
  }

  testOnRealDevice() {
    return exec(`xcodebuild clean test -workspace ${this.xcworkspace} -scheme ${this.scheme} -destination 'id=${this.deviceId}' DEVELOPMENT_TEAM=${config.iosPushTeam}`,
      this.tempFolder);
  }

  sendPushNotification() {
    return client
      .init()
      .setViewportSize({ width: 1024, height: 768 })
      .timeouts('implicit', 10000)
      .url(`${config.host}/#projects/${this.project.guid}/apps/${this.clientApp.guid}/push`)
      .waitForVisible('#username')
      .setValue('#username', config.username)
      .waitForVisible('#password')
      .setValue('#password', config.password)
      .waitForVisible('#login_button')
      .click('#login_button')
      .then(this.waitForDeviceRegistered)
      .waitForVisible('#send-notification-btn')
      .click('#send-notification-btn')
      .pause(3000)
      .waitForVisible('#pushAlert')
      .setValue('#pushAlert', 'test')
      .waitForVisible('#sendPush')
      .click('#sendPush')
      .end();
  }

  waitForDeviceRegistered() {
    return client
      .pause(4000)
      .refresh()
      .waitForVisible('#stat-device-count span.count')
      .getText('#stat-device-count span.count')
      .then(numReg => {
        if (numReg === '0') {
          return this.waitForDeviceRegistered();
        }
      });
  }

}

module.exports = PushTemplate;
