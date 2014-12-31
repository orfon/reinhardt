Quickstart Guide
===================

Install reinhardt with [rp](https://github.com/grob/rp/wiki):

     $ rp install --global reinhardt

Create a template from a String and render it:

    >> var template = new Template('Hello {{ username}}');
    >> template.render({username: 'Reinhardt'});
    'Hello Reinhardt'

A Reinhardt environment
---------------

A Reinhardt environment makes it easy to load templates from the filesystem.
You can also define additional tags and filters per Reinhardt,
which will be available in all templates.

The following code creates an Environment which
loads files from the "./templates" directory and has additional filters as defined 
in the module "./mycustomfilters":

    >> var {Reinhardt} = require('reinhardt');
    >> var templates = new Reinhardt({
         loader: module.resolve('./templates/'),
         filters: require('./mycustomfilters')
      });
    >> templates.renderResponse("index.html", context)
    {"status": 200, body: ["<html>..."]}

Also see the help page on [Reinhardt environments](./environment.md) for more information.

Debugging templates
---------------------

During development reinhardt can display detailed template error pages with the relevant template source,
the line number and additional information such as the origin from which the template
was loaded.

For the detailed error pages, you need to add the reinhardt middleware to your [Stick application](http://github.com/ringo/stick):

    >> app.configure(require('reinhardt'));

and add the debugging flag to your Reinhardt environment:

    >> var templates = new Reinhardt({
         debug: true
       });
