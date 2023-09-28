
const express = require('express');
const bodyParser = require('body-parser');

const { set_router_subdomain } = require('../../tools.js');

const public_path = 'F:\\node_js_stuff\\node_projects\\a_discord_bot\\data\\mailer_react_build';

const init = (app) => {
    const mail = set_router_subdomain(app, 'mail');

    mail.use(express.static(public_path));
    mail.use(bodyParser.json());
    mail.use(bodyParser.urlencoded({ extended: false }));

}

module.exports = init;