# Client Apps Acceptance & Regression Tests

So far only iOS testing.

## iOS tests

iOS tests are written with XCTest. Testing of these apps is currently automated:
* Helloworld - Objective-C
* Helloworld - Swift
* Welcome app - Objective-C
* Welcome app - Swift
* PushStarter - Swift

## Prerequisites

For iOS:
* Mac
* Xcode
* Apple Developer Program account

For iOS push testing:
* physical device connect to your Mac
* [fastlane tools](https://github.com/fastlane/fastlane)
* credentials added to [fastlane CredentialsManager](https://github.com/fastlane/fastlane/tree/master/credentials_manager)

## Running the tests

* `npm install`
* add correct values to config.js
* `npm start`

## Troubleshooting

### iOS push

If there is an error during "before" phase of push template testing, probably there is an issue with fastlane pem. Go to [provisioning portal](https://developer.apple.com/account/overview.action) and revoke Push certificates for AppID you specified in config.json.

If there is an issue during actual testing, reconnect your device.
