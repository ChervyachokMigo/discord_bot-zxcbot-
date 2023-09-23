
const express = require('express');
const bodyParser = require('body-parser');

const { set_router_subdomain } = require('../tools.js');

const public_path = 'F:\\node_js_stuff\\node_projects\\a_discord_bot\\data\\mailer_react_public';

const init = (app) => {
    test = set_router_subdomain(app, 'test');

    test.use(express.static(public_path));
    test.use(bodyParser.json());
    test.use(bodyParser.urlencoded({ extended: false }));

}

module.exports = init;