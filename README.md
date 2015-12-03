# watchmen-plugin-nodemailer

A plugin for [watchmen](https://github.com/iloire/watchmen) to send email
notifications on service events via
[nodemailer](https://github.com/andris9/Nodemailer).

## Templates

This plugin comes with default templates written in
[Handlebars](http://handlebarsjs.com/)
for new outages and service back events. Each event has a body and subject
template.

You can override templates by copying the included template folder into a new
location and specifying this in your environment variables (see below).

Body templates must go in `templates/body` and subject templates in
`templates/subject`

Their filenames should correspond to the watchmen event they're for. For
example, `templates/body/new-outage.hbs`. The plugin will compile all templates
when loaded and send email for any body template it loads. This means if you
want to send an email for the `latency-warning` event, simply create a template
at `templates/body/latency-warning.hbs` and restart watchmen.

```
{{service.name}} ({{service.url}}) is back online after the outage on {{date data.timestamp}}

Cheers,

Wise Owl
```

Templates are passed a `service` object and a `data` object. The `data` object
contains the second argument of the event, usually data on the current or last
outage. See what the events get passed
[here: https://github.com/iloire/watchmen/blob/master/README.md#creating-your-own-plugin](https://github.com/iloire/watchmen/blob/master/README.md#creating-your-own-plugin)

## Environment variables

The following sample configures SMTP credentials and specifies a custom template
directory—overriding the default included templates as explained above.

```
WATCHMEN_AUTH_NODEMAILER_USER=alerts@watchmen.bar
WATCHMEN_AUTH_NODEMAILER_PASS=password
WATCHMEN_AUTH_NODEMAILER_PORT=587
WATCHMEN_AUTH_NODEMAILER_HOST=smtp.mailhost.bar

WATCHMEN_MAILER_TEMPLATE_DIRECTORY=/home/watchmen/watchmen/templates
```
