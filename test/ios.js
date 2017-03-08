"use strict";

const fhc = require('../utils/fhc');
const rimraf = require('../utils/rimraf');
const templates = require('../templates/ios');
const path = require('path');
const config = require('../config');

describe('UI tests for iOS client apps', function() {

  this.timeout(5 * 60 * 1000);
  // this.retries(2);

  before(function() {
    const tempFolder = path.resolve(__dirname, '../temp');
    return rimraf(tempFolder)
      .then(() => (fhc.init(config.host, config.username, config.password)));
  });

  for (const template of templates) {
    describe(`UI test for ${template.name}`, function() {

      before(function() {
        return template.prepare();
      });

      // after(function() {
      //   return template.cleanup();
      // });

      it('should pass UI tests', function() {
        return template.test();
      });

    });
  }

});
