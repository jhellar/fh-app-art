"use strict";

const exec = require('./exec');
const promisify = require('promisify-node');
const fs = promisify('fs');
const path = require('path');

class Fastlane {

  constructor(username, bundleId, development, folder) {
    this.username = username;
    this.bundleId = bundleId;
    this.development = development ? '--development' : '';
    this.folder = folder;

    this.produce = this.produce.bind(this);
    this.pem = this.pem.bind(this);
    this.sigh = this.sigh.bind(this);
  }

  produce(name) {
    return exec(`fastlane produce -i -u ${this.username} -a ${this.bundleId} -q "${name}"`, this.folder);
  }

  pem(p12Password, output) {
    return exec(`fastlane pem ${this.development} -u ${this.username} -a ${this.bundleId} -p "${p12Password}" -o ${output}`, this.folder);
  }

  sigh(output) {
    return exec(`fastlane sigh ${this.development} --force -u ${this.username} -a ${this.bundleId} -q "${output}"`, this.folder);
  }

  updateProvisioning(xcodeproj, profile) {
    const fastfile = `
      platform :ios do
        lane :prov do
          update_project_provisioning(
              xcodeproj: '${xcodeproj}',
              profile: '${profile}',
              target_filter: '.*',
              build_configuration: '.*'
          )
        end
      end
    `;
    fs.mkdir(path.resolve(this.folder, 'fastlane'))
      .then(() => (fs.writeFile(path.resolve(this.folder, 'fastlane/Fastfile'), fastfile)))
      .then(() => (exec('fastlane ios prov', this.folder)));
  }

}

module.exports = Fastlane;
