"use strict";

function login(client, username, password) {
  return client
    .waitForVisible('#username')
    .setValue('#username', username)
    .waitForVisible('#password')
    .setValue('#password', password)
    .waitForVisible('#login_button')
    .click('#login_button');
}

function selectEnvironment(client, env) {
  return client
    .waitForVisible('.environment-selector .caret')
    .pause(2000)
    .click('.environment-selector .caret')
    .pause(2000)
    .element('.environment_selector_container ul.dropdown-menu').waitForVisible(`.text=${env}`)
    .element('.environment_selector_container ul.dropdown-menu').click(`.text=${env}`)
    .waitForVisible('.environment_selector_container .btn-success');
}

function addVariable(client, varName, varValue) {
  return client
    .waitForVisible('.add_env_var_btn')
    .click('.add_env_var_btn')
    .pause(2000)
    .waitForVisible('#app-env-variables div:last-of-type .modal #name')
    .setValue('#app-env-variables div:last-of-type .modal #name', varName)
    .waitForVisible('#app-env-variables div:last-of-type .modal #env_var_value')
    .setValue('#app-env-variables div:last-of-type .modal #env_var_value', varValue)
    .waitForVisible('#app-env-variables div:last-of-type .modal .save_env_var_btn')
    .click('#app-env-variables div:last-of-type .modal .save_env_var_btn')
    .pause(2000);
}

function pushVariables(client) {
  return client
    .waitForVisible('.push_env_var_btn')
    .click('.push_env_var_btn')
    .pause(2000)
    .waitForVisible('.confirm')
    .click('.confirm');
}

function init(client) {
  return client
    .init()
    .setViewportSize({ width: 1024, height: 768 })
    .timeouts('implicit', 20000);
}

module.exports = {
  login: login,
  selectEnvironment: selectEnvironment,
  addVariable: addVariable,
  pushVariables: pushVariables,
  init: init
};
