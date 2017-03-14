"use strict";

const fhc = require('../utils/fhc');
const templates = require('../templates/ios');
const config = require('../config/config');

describe('Tests for iOS client apps', function() {

  this.timeout(5 * 60 * 1000);

  before(function() {
    return fhc.init(config.host, config.username, config.password);
  });

  for (const template of templates) {
    describe(`Test for ${template.name}`, function() {

      before(function() {
        return template.prepare();
      });

      after(function() {
        return template.cleanup();
      });

      it('should pass UI tests', function() {
        return template.test();
      });

    });
  }

});
