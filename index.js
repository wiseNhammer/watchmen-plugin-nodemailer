/*jslint node: true */
'use strict';

var glob       = require('glob');
var handlebars = require('handlebars');
var nodemailer = require('nodemailer');
var path       = require('path');
var fs         = require('fs');
require('dotenv').load({ silent: true });

handlebars.registerHelper('date', function(timestamp) {
  return new Date(timestamp).toString();
});


/*
 * Load all templates into a nice object like…
 *
 * {
 *   body: {
 *     outage: $template
 *   },
 *   subject {
 *     outage: $template
 *   }
 * }
 */
function get_templates(base_directory) {
  var files     = glob.sync(path.join(base_directory, '**/*.hbs'));
  var templates = {};
  files.forEach(function(template_path) {
    var parts      = path.parse(template_path);
    var contents   = fs.readFileSync(template_path);
    var parent_dir = parts.dir.split(path.sep).pop();

    if (!(parent_dir in templates)) {
      templates[parent_dir] = {};
    }
    templates[parent_dir][parts.name] = handlebars.compile(contents.toString());
    console.log('Found ' + parent_dir + ' template for ' + parts.name);
  });

  return templates;
}

var lang = process.env.WATCHMEN_AUTH_NODEMAILER_LANG || 'en';
/*
 * Check if using default template location or one defined in environment
 */
var p = path.join(__dirname, 'templates/' + lang);
if ('WATCHMEN_MAILER_TEMPLATE_DIRECTORY' in process.env) {
  p = process.env.WATCHMEN_MAILER_TEMPLATE_DIRECTORY;
  console.log('Loading templates from ' + p + ' instead of default templates.');
}
var templates = get_templates(p);

/*
 * Get us a mail transporter!
 */
var mailCredentials = {
  port: process.env.WATCHMEN_AUTH_NODEMAILER_PORT,
  host: process.env.WATCHMEN_AUTH_NODEMAILER_HOST
};

if (process.env.WATCHMENT_AUTH_NODEMAILER_NO_AUTH != 'true') {
    mailCredentials.auth =  {
        user: process.env.WATCHMEN_AUTH_NODEMAILER_USER,
        pass: process.env.WATCHMEN_AUTH_NODEMAILER_PASS
    };
}

var mailDefaults = {
  from: process.env.WATCHMEN_AUTH_NODEMAILER_USER
};

var transporter = nodemailer.createTransport(mailCredentials, mailDefaults);

/*
 * Handle errors during email transport
 */
function emailError(err, info) {
  if (err) {
    return console.log(err);
  }

  console.log(info);
}

/*
 * Handle events from watchmen! The fun stuff!
 */
function handleEvent(eventName) {
  return function(service, data) {
    // Don't bother if there's no template
    if (!(eventName in templates.body)) {
      return;
    }

    // Pass this stuff into the templates
    var context = { service: service, data: data };

    // Give us a template subject or default
    var subject = '[' + eventName + ']' + ' on ' + service.name;
    if (eventName in templates.subject) {
      subject = templates.subject[eventName](context);
    }

    var body = templates.body[eventName](context);

    transporter.sendMail({
      to: service.alertTo,
      subject: subject,
      html: body
    }, emailError);
  };
}

/*
 * Any event from watchmen can have a template associated with it. If there's
 * one in templates/body/, an email will be sent to notify support teams!
 */
function NodemailerPlugin(watchmen) {
  watchmen.on('latency-warning', handleEvent('latency-warning'));
  watchmen.on('new-outage',      handleEvent('new-outage'));
  watchmen.on('current-outage',  handleEvent('current-outage'));
  watchmen.on('service-back',    handleEvent('service-back'));
  watchmen.on('service-error',   handleEvent('service-error'));
  watchmen.on('service-ok',      handleEvent('service-ok'));
}

exports = module.exports = NodemailerPlugin;
