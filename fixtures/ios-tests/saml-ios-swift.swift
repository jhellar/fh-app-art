//
//  saml_ios_swiftUITests.swift
//  saml-ios-swiftUITests
//
//  Created by Jan Hellar on 13/03/2017.
//  Copyright © 2017 Red Hat. All rights reserved.
//

import XCTest

class saml_ios_swiftUITests: XCTestCase {

    override func setUp() {
        super.setUp()

        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        // UI tests must launch the application that they test. Doing this in setup will make sure it happens for each test method.
        XCUIApplication().launch()

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }

    func testExample() {
        // Use recording to get started writing UI tests.
        // Use XCTAssert and related functions to verify your tests produce the correct results.

        sleep(5)

        let app = XCUIApplication()
        app.buttons["Sign In"].tap()

        let element = app.children(matching: .window).element(boundBy: 0).children(matching: .other).element.children(matching: .other).element
        let enterYourUsernameAndPasswordElement = element.children(matching: .other).element.children(matching: .other).element.children(matching: .other).element.children(matching: .other)["Enter your username and password"]
        let textField = enterYourUsernameAndPasswordElement.children(matching: .other).element(boundBy: 2).children(matching: .textField).element
        textField.tap()
        textField.typeText("student")
        let passField = enterYourUsernameAndPasswordElement.children(matching: .other).element(boundBy: 4).children(matching: .secureTextField).element
        passField.tap()
        passField.typeText("studentpass")
        app.buttons["Login"].tap()

        sleep(3)

        XCTAssert(app.staticTexts["Great! You're signed in."].isHittable)

    }

}
