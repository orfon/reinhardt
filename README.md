# Reinhardt - Django templates for RingoJs

This is a JavaScript implementation of the Django Template System as described in <http://www.djangoproject.com/documentation/templates/> for RingoJs.

Reinhard already implements the larger part of the Django templating system:

  * all iteration and conditional tags (if/else, loops, etc)
  * most other filters and tags (see table below)
  * autoescaping
  * customize and extend - writing tags and filters
  * tons of unit tests - our unit tests are copied straight from django

## Small example

Demonstration of a small Reinhardt template:

    {% extends 'base.html' %}
    {% block title %}Reinhardt's Site{% endblock %}
    {% block content %}
      <ul>
      {% for user in users %}
        <li><a href="{{ user.url }}">{{ user.username }}</a></li>
      {% endfor %}
      </ul>
    {% endblock %}

# Quickstart

Create a templates environment and render a template:

    var {Environment} = require('reinhardt');
    var templates = new Environment({
      loader: '/path/to/templates/',
      debug: true
    });

    var template = templates.getTemplate('index.html');
    var html = template.render({"hello": "world"});

For easier template debugging, add the reinhardt middleware
to your application:

    app.configure(require('reinhardt/middleware'), 'route')

# Documentation

  * [Quickstart guide](./docs/quickstart.md)
  * [Reinhardt template language overview](./docs/templates.md)
  * References for the built in
    * [Tags](./docs/tags.md)
    * [Filters](./docs/filters.md)
  * Extending Reinhardt
    * [Custom template filters](./docs/custom-template-filters.md)
    * [Custom template tags](./docs/custom-template-tags.md)

# Speed

There is a `examples/speed.js` which is farily easy to read. On my machine with the use-cases I have, reinhardt is roughly the same speed as the original Django template language.
