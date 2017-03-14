//
//  welcome_ios_swiftUITests.swift
//  welcome-ios-swiftUITests
//
//  Created by Jan Hellar on 03/03/2017.
//  Copyright © 2017 corinnekrych. All rights reserved.
//

import XCTest

class welcome_ios_swiftUITests: XCTestCase {

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
        app.navigationBars["welcome_ios_swift.HomeView"].buttons["menu"].tap()

        let tablesQuery = app.tables
        tablesQuery.staticTexts["Call Cloud"].tap()
        app.buttons["Call Cloud"].tap()

        sleep(2);

        let element = app.children(matching: .window).element(boundBy: 0).children(matching: .other).element.children(matching: .other).element(boundBy: 1).children(matching: .other).element.children(matching: .other).element.children(matching: .other).element.children(matching: .other).element
        let cloudResponse = element.children(matching: .textView).element(boundBy: 1)

        XCTAssertEqual(cloudResponse.value as! String, "Hello from FeedHenry")

        app.navigationBars["Call Cloud"].buttons["menu"].tap()
        tablesQuery.staticTexts["Push Notification"].tap()
        app.navigationBars["Push Notification"].buttons["menu"].tap()
        tablesQuery.staticTexts["Location Example"].tap()
        app.buttons["Get Weather"].tap()
        app.navigationBars["Location Example"].buttons["menu"].tap()
        tablesQuery.staticTexts["Data Browser"].tap()

        let textField = element.children(matching: .textField).element
        textField.tap()
        textField.typeText("test")
        app.buttons["Save"].tap()

        let successAlert = app.alerts["Success"]

        XCTAssert(successAlert.isHittable)
        XCTAssert(successAlert.staticTexts["Success"].isHittable)

        successAlert.buttons["Ok, cool!"].tap()
        app.navigationBars["Data Browser"].buttons["menu"].tap()
        tablesQuery.staticTexts["Native App Info"].tap()
        app.navigationBars["welcome_ios_swift.NativeAppInfoView"].buttons["menu"].tap()
        tablesQuery.staticTexts["Cloud Integration"].tap()
        app.navigationBars["Cloud Integration"].buttons["menu"].tap()
        tablesQuery.staticTexts["Statistics"].tap()

    }

}
