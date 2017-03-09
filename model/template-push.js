"use strict";

const Template = require('./template.js');
const config = require('../config');
const promisify = require('promisify-node');
const fs = promisify('fs');
const webdriverio = require('webdriverio');
const options = { desiredCapabilities: { browserName: 'chrome' } };
const client = webdriverio.remote(options);
const path = require('path');
const plist = require('plist');
const exec = require('../utils/exec');
const Fastlane = require('../utils/fastlane');
// const fhc = require('../utils/fhc');

class PushTemplate extends Template {

  constructor(name, repoUrl, repoBranch, projectTemplateId, scheme, bundleId, testBundleId) {
    super(name, repoUrl, repoBranch, projectTemplateId, scheme);

    this.bundleId = bundleId;
    this.testBundleId = testBundleId;
    this.pbxproj = this.xcodeproj + '/project.pbxproj';
    this.fastlane = new Fastlane(config.iosUsername, config.iosPushBundleId, config.iosPushDevelopment, this.tempFolder);
    this.push = true;
    this.pushRegDevices = 0;

    this.prepare = this.prepare.bind(this);
    this.test = this.test.bind(this);
    this.changeBundleId = this.changeBundleId.bind(this);
    this.storeP12 = this.storeP12.bind(this);
    this.enablePush = this.enablePush.bind(this);
    this.setupPush = this.setupPush.bind(this);
    this.updateFhconfig = this.updateFhconfig.bind(this);
    this.testOnRealDevice = this.testOnRealDevice.bind(this);
    this.sendPushNotification = this.sendPushNotification.bind(this);
    this.waitForDeviceRegistered = this.waitForDeviceRegistered.bind(this);
  }

  prepare() {
    return super.prepare()
      .then(this.changeBundleId)
      .then(() => (this.fastlane.produce(config.iosPushAppIDName)))
      .then(() => (this.fastlane.pem(config.iosPushP12Password, 'fastlane')))
      .then(this.storeP12)
      .then(() => (this.fastlane.sigh('fastlane.mobileprovision')))
      .then(() => (this.fastlane.updateProvisioning(this.xcodeproj, 'fastlane.mobileprovision')))
      .then(() => (exec(`sed -i '' 's/ProvisioningStyle = Automatic;/ProvisioningStyle = Manual;/' ${this.pbxproj}`, this.tempFolder)))
      .then(this.enablePush)
      .then(this.updateFhconfig);
  }

  changeBundleId() {
    return fs.readFile(path.resolve(this.tempFolder, this.pbxproj), 'utf8')
      .then(pbxproj => {
        const replaced = pbxproj.split(this.bundleId).join(config.iosPushBundleId).split(this.testBundleId).join(config.iosPushBundleId);
        return fs.writeFile(path.resolve(this.tempFolder, this.pbxproj), replaced);
      });
  }

  storeP12() {
    const p12new = path.resolve(this.tempFolder, 'fastlane.p12');
    const p12fixtures = path.resolve(__dirname, '../fixtures/fastlane.p12');
    const fsCb = require('fs');
    if (fsCb.existsSync(p12new)) {
      if (fsCb.existsSync(p12fixtures)) {
        fsCb.unlinkSync(p12fixtures);
      }
      return fs.rename(p12new, p12fixtures);
    }
  }

  enablePush() {
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
      .waitForVisible('#ups-app-detail-root button')
      .isVisible('#add-variant-btn')
      .then(visible => {
        if (visible) {
          return client
            .waitForVisible('.ups-variant-header')
            .moveToObject('.ups-variant-header')
            .waitForVisible('.ups-variant-header .actions .danger a')
            .click('.ups-variant-header .actions .danger a')
            .pause(3000)
            .waitForVisible('input[ng-model="confirmVariantName"]')
            .setValue('input[ng-model="confirmVariantName"]', 'ios')
            .waitForVisible('.modal-dialog button[type="submit"]')
            .click('.modal-dialog button[type="submit"]')
            .pause(3000)
            .waitForVisible('#add-variant-btn')
            .click('#add-variant-btn')
            .pause(3000)
            .waitForVisible('#textInput-modal-markup')
            .setValue('#textInput-modal-markup', 'ios')
            .then(this.setupPush)
            .waitForVisible('.modal-footer button.btn-primary')
            .click('.modal-footer button.btn-primary')
            .pause(3000);
        } else {
          return client
            .click('#ups-app-detail-root button')
            .then(this.setupPush)
            .waitForVisible('#enablePush')
            .click('#enablePush');
        }
      })
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
      .end();
  }

  setupPush() {
    return client
      .waitForVisible('.ups-variant-ios')
      .click('.ups-variant-ios')
      .waitForVisible('.ups-add-variable input[type="file"]')
      .chooseFile('.ups-add-variable input[type="file"]', path.resolve(__dirname, '../fixtures/fastlane.p12'))
      .waitForVisible('#iosType2')
      .click('#iosType2')
      .waitForVisible('#iosPassphrase')
      .setValue('#iosPassphrase', config.iosPushP12Password);
  }

  updateFhconfig() {
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
        if (Number(numReg) <= this.pushRegDevices) {
          return this.waitForDeviceRegistered();
        }
      });
  }

}

module.exports = PushTemplate;
