Reinhardt - Django templates for RingoJs
=============================================

This is a JavaScript implementation of the Django Template System as described in <http://www.djangoproject.com/documentation/templates/> for RingoJs.

Reinhard already implements the larger part of the Django system including all logic (if/else, loops), lots of filters and tags as well as autoescaping.

 * aims to be functionally equivalent to the current django master
 * not intended to work in a browser environment
 * beta software

Quickstart Guide
===================

Install reinhardt with Ringo's admin command:

     $ ringo-admin install oberhamsi/reinhardt

The most basic way to render a template is to instantiate it from a string:

    >> var {Template} = require('reinhardt/template');
    >> var template = new Template('Hello {{ username}}');
    >> template.render({username: 'Reinhardt'});
    'Hello Reinhardt'

In a bigger application you will use the higher-level Environment API to render templates. This works by creating an `Environment` to hold your shared configuration. You can then either use the environment's higher-level functions like `renderResponse()` or the `getTemplate()` function:

    >> var {Environment} = require('reinhardt');
    >> var renv = new Environment({
         loader: module.resolve('./templates/')
      });
    >> renv.renderResponse("index.html")
    {"status": 200, headers: "...", body: [...]}
    >> renv.getTemplate()
    [reinhardt Template]

In any case, you will almost exclusively interact with those two classes: Environment and Template.

More about the Environment
----------------------------

The configuration object for the Environment must have a `loader` property, as we have seen in the last example.

The default loader is the filesystem loader which is implictely instantiated when the `loader` property is a string holding the path to the template directory or an Array of such strings.

The configuration object can optionally have `filters` and `tags` properties pointing to an object with filters and tags. For example:

    var env = new Environment({
         loader: "./templates",
         filters: [require('./mycustomfilters'), require('./foofilters')],
         tags: require('./mytags')
    });


Speed
======

There is a `examples/speed.js` which is farily easy to read. On my machine with the use-cases I have, reinhardt is roughly the same speed as the original Django template language.

Custom Filters and Tags
=========================

For now, reading the django documentation and looking at existing Reinhard filters/tags in the `lib` directory should get you started fast.

Implemented filters and tags
=================================


    | Implemented |     Tag     |
    |      X      | autoescape  |
    |      X      | block       |
    |      X      | comment     |
    |             | csrf_token  |
    |      X      | cycle       |
    |             | debug       |
    |      X      | extends     |
    |      X      | filter      |
    |      X      | firstof     |
    |      X      | for         |
    |      X      | for...empty |
    |      X      | if          |
    |      X      | ifchanged   |
    |      X      | ifequal     |
    |      X      | ifnotequal  |
    |      X      | include     |
    |     NEW     | loadfilter  |
    |     NEW     | loadtag     |
    |     N/A     | load        |
    |             | now         |
    |             | regroup     |
    |      X      | spaceless   |
    |             | ssi         |
    |             | templatetag |
    |     N/A     | url         |
    |      X      | verbatim    |
    |      X      | widthratio  |
    |      X      | with        |

    | Implemented | Filter             |
    |             | add                |
    |      X      | addslashes         |
    |     NEW     | byKey              |
    |      X      | capfirst           |
    |      X      | center             |
    |      X      | cut                |
    |      X      | date               |
    |      X      | default            |
    |     N/A     | default_if_none    |
    |     NEW     | defaultifnull
    |     N/A     | dictsort           |
    |     N/A     | dictsort_reversed  |
    |             | divisibleby        |
    |      X      | escape             |
    |             | filesizeformat     |
    |             | first              |
    |      X      | fix_ampersands     |
    |      X      | floatformat        |
    |             | get_digit          |
    |             | iriencode          |
    |      X      | join               |
    |     NEW     | key                |
    |      X      | length             |
    |      X      | length_is          |
    |      X      | linebreaks         |
    |      X      | linebreaksbr       |
    |      X      | linenumbers        |
    |      X      | ljust              |
    |      X      | lower              |
    |      X      | make_list          |
    |             | phone2numeric      |
    |             | pluralize          |
    |             | pprint             |
    |             | random             |
    |      X      | removetags         |
    |      X      | rjust              |
    |      X      | safe               |
    |             | safeseq            |
    |      X      | slice              |
    |      X      | slugify            |
    |     NEW     | sortByKey          |
    |      X      | stringformat       |
    |      X      | striptags          |
    |             | time               |
    |             | timesince          |
    |             | timeuntil          |
    |      X      | title              |
    |      X      | truncatechars      |
    |      X      | truncatewords      |
    |      X      | truncatewords_html |
    |             | unordered_list     |
    |      X      | upper              |
    |             | urlencode          |
    |             | urlize             |
    |             | urlizetrunc        |
    |      X      | wordcount          |
    |      X      | wordwrap           |
    |      X      | yesno              |


About the code
===============

Most of this code is a literal translation of Django's code; some regular expressions and the basis for a lot of filters was taken from Dojox' dtl package <https://github.com/dojo/dojox/tree/master/dtl>.
