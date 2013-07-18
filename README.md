Reinhardt - Django templates for RingoJs
=============================================

This is a JavaScript implementation of the Django Template System as described in <http://www.djangoproject.com/documentation/templates/> for RingoJs.

Reinhard already implements the larger part of the Django templating system:

  * all iteration and conditional tags (if/else, loops, etc)
  * most other filters and tags (see table below)
  * autoescaping
  * customize and extend - writing tags and filters
  * tons of unit tests - our unit tests are copied straight from django

Goals
============
 * aims to be functionally equivalent to the current django master
 * not intended to work in a browser environment
 * beta software

Small example
===============
    {% extends 'base.html' %}
    {% block title %}Reinhardt's Site{% endblock %}
    {% block content %}
      <ul>
      {% for user in users %}
        <li><a href="{{ user.url }}">{{ user.username }}</a></li>
      {% endfor %}
      </ul>
    {% endblock %}

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

Speed
======

There is a `examples/speed.js` which is farily easy to read. On my machine with the use-cases I have, reinhardt is roughly the same speed as the original Django template language.

Documentation
=========================

  * [Reinhardt template language overview](docs/templates.md)
  * References:
    * [Tags](docs/tags.md)
    * [Filters](docs/filters.md)

