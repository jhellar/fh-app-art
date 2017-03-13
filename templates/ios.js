"use strict";

const IOSTemplate = require('../model/template');
const PushTemplate = require('../model/template-push');
const SAMLTemplate = require('../model/template-saml');

const templates = [
  new SAMLTemplate(
    'SAML iOS Swift',
    'git@github.com:jhellar/saml-ios-swift.git',
    'FH-3251',
    'saml_project',
    'saml-ios-swift'
  ),
  new PushTemplate(
    'Push Starter iOS Swift',
    'git@github.com:jhellar/pushstarter-ios-swift.git',
    'FH-3233',
    'pushstarter_project',
    'PushStarter',
    'org.aerogear.helloworldpush',
    'org.aerogear.PushStarterUITests'
  ),
  new IOSTemplate(
    'Helloworld iOS Objective-C',
    'git@github.com:jhellar/helloworld-ios.git',
    'FH-3223',
    'hello_world_project',
    'helloworld-ios-app'
  ),
  new IOSTemplate(
    'Helloworld iOS Swift',
    'git@github.com:jhellar/helloworld-ios-swift.git',
    'FH-3223',
    'hello_world_project',
    'helloworld-ios-app'
  ),
  new IOSTemplate(
    'Welcome iOS Objective-C',
    'git@github.com:jhellar/welcome-ios.git',
    'FH-3223',
    'welcome_project',
    'welcome-ios'
  ),
  new IOSTemplate(
    'Welcome iOS Swift',
    'git@github.com:jhellar/welcome-ios-swift.git',
    'FH-3223',
    'welcome_project',
    'welcome-ios-swift'
  )
];

module.exports = templates;
