"use strict";

// const IOSTemplate = require('../model/template');
const PushTemplate = require('../model/template-push');

const templates = [
  new PushTemplate(
    'Push Starter iOS Swift',
    'git@github.com:jhellar/pushstarter-ios-swift.git',
    'FH-3233',
    'pushstarter_project',
    'PushStarter/fhconfig.plist',
    'PushStarter.xcworkspace',
    'PushStarter',
    'org.aerogear.helloworldpush'
  ),
  // new IOSTemplate(
  //   'Helloworld iOS Objective-C',
  //   'git@github.com:jhellar/helloworld-ios.git',
  //   'FH-3223',
  //   'hello_world_project',
  //   'helloworld-ios-app/fhconfig.plist',
  //   'helloworld-ios-app.xcworkspace',
  //   'helloworld-ios-app'
  // ),
  // new IOSTemplate(
  //   'Helloworld iOS Swift',
  //   'git@github.com:jhellar/helloworld-ios-swift.git',
  //   'FH-3223',
  //   'hello_world_project',
  //   'helloworld-ios-app/fhconfig.plist',
  //   'helloworld-ios-app.xcworkspace',
  //   'helloworld-ios-app'
  // ),
  // new IOSTemplate(
  //   'Welcome iOS Objective-C',
  //   'git@github.com:jhellar/welcome-ios.git',
  //   'FH-3223',
  //   'welcome_project',
  //   'welcome-ios/fhconfig.plist',
  //   'welcome-ios.xcworkspace',
  //   'welcome-ios'
  // ),
  // new IOSTemplate(
  //   'Welcome iOS Swift',
  //   'git@github.com:jhellar/welcome-ios-swift.git',
  //   'FH-3223',
  //   'welcome_project',
  //   'welcome-ios-swift/fhconfig.plist',
  //   'welcome-ios-swift.xcworkspace',
  //   'welcome-ios-swift'
  // )
];

module.exports = templates;
