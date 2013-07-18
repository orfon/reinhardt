Quickstart Guide
===================

Install reinhardt with Ringo's admin command:

     $ ringo-admin install oberhamsi/reinhardt

The most basic way to render a template is to instantiate it from a string:

    >> var template = new Template('Hello {{ username}}');
    >> template.render({username: 'Reinhardt'});
    'Hello Reinhardt'

A templating `Environment` allows you to configure additional tags and filters,
which will be available in all templates loaded through the environment. You will
typically use an Environment for anything but very simple applications:

    >> var env = new Environment({
         loader: module.resolve('./templates/'),
         filters: require('./mycustomfilters')

      });
    >> env.renderResponse("index.html", context)
    {"status": 200, body: ["<html>..."]}

Debugging templates
---------------------

Enable debugging in the environment and put the reinhardt middleware into your application:

    >> app.configure(require('reinhardt/middleware'));
    >> var env = new Environment({
         debug: true
       });

Debugging is disabled by default and you should not enable it in production since it displays
the source and location of your templates.