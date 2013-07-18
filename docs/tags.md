Built-in template tags
==================================

This document describes Reinhardt's built-in template tags.

**List of built in tags**

- [autoescape](#autoescape)
- [block](#block)
- [comment](#comment)
- [cycle](#cycle)
- [extends](#extends)
- [filter](#filter)
- [firstof](#firstof)
- [for](#for)
- [for ... empty](#for--empty)
- [if](#if)
- [ifchanged](#ifchanged)
- [ifequal](#ifequal)
- [ifnotequal](#ifnotequal)
- [include](#include)
- [loadtag / loadfilter](#loadtag--loadfilter)
- [spaceless](#spaceless)
- [verbatim](#verbatim)
- [widthratio](#widthratio)
- [with](#with)

autoescape
-----------

Controls the current auto-escaping behavior. This tag takes either ``on`` or
``off`` as an argument and that determines whether auto-escaping is in effect
inside the block. The block is closed with an ``endautoescape`` ending tag.

When auto-escaping is in effect, all variable content has HTML escaping applied
to it before placing the result into the output (but after any filters have
been applied). This is equivalent to manually applying the `escape`
filter to each variable.

The only exceptions are variables that are already marked as "safe" from
escaping, either by the code that populated the variable, or because it has had
the `safe` or `escape` filters applied.

Sample usage:

    {% autoescape on %}
        {{ body }}
    {% endautoescape %}

block
-----------

Defines a block that can be overridden by child templates. See
the section "Template inheritance" in the [general template help](templates.md) for more information.

comment
------

Ignores everything between ``{% comment %}`` and ``{% endcomment %}``.

Sample usage:

    <p>Rendered text with {{ pub_date|date:"c" }}</p>
    {% comment %}
        <p>Commented out text with {{ create_date|date:"c" }}</p>
    {% endcomment %}


cycle
------

Cycles among the given strings or variables each time this tag is encountered.

Within a loop, cycles among the given strings each time through the
loop:

    {% for o in some_list %}
        <tr class="{% cycle 'row1' 'row2' %}">
            ...
        </tr>
    {% endfor %}

You can use variables, too. For example, if you have two template variables,
``rowvalue1`` and ``rowvalue2``, you can cycle between their values like this:

    {% for o in some_list %}
        <tr class="{% cycle rowvalue1 rowvalue2 %}">
            ...
        </tr>
    {% endfor %}

Note that variable arguments (``rowvalue1`` and ``rowvalue2`` above) are
auto-escaped!

You can mix variables and strings:

    {% for o in some_list %}
        <tr class="{% cycle 'row1' rowvalue2 'row3' %}">
            ...
        </tr>
    {% endfor %}

In some cases you might want to refer to the next value of a cycle from
outside of a loop. To do this, just give the ``{% cycle %}`` tag a name, using
"as", like this:

    {% cycle 'row1' 'row2' as rowcolors %}

From then on, you can insert the current value of the cycle wherever
you'd like in your template by referencing the cycle name as a context
variable. If you want to move the cycle onto the next value, you use
the cycle tag again, using the name of the variable. So, the following
template:

    <tr>
        <td class="{% cycle 'row1' 'row2' as rowcolors %}">...</td>
        <td class="{{ rowcolors }}">...</td>
    </tr>
    <tr>
        <td class="{% cycle rowcolors %}">...</td>
        <td class="{{ rowcolors }}">...</td>
    </tr>

would output:

    <tr>
        <td class="row1">...</td>
        <td class="row1">...</td>
    </tr>
    <tr>
        <td class="row2">...</td>
        <td class="row2">...</td>
    </tr>

You can use any number of values in a ``{% cycle %}`` tag, separated by spaces.
Values enclosed in single (``'``) or double quotes (``"``) are treated as
string literals, while values without quotes are treated as template variables.

Note that currently the variables included in the cycle will not be escaped.
Any HTML or Javascript code contained in the printed variable will be rendered
as-is, which could potentially lead to security issues.

By default, when you use the ``as`` keyword with the cycle tag, the
usage of ``{% cycle %}`` that declares the cycle will itself output
the first value in the cycle. This could be a problem if you want to
use the value in a nested loop or an included template. If you want to
just declare the cycle, but not output the first value, you can add a
``silent`` keyword as the last keyword in the tag. For example:

    {% for obj in some_list %}
        {% cycle 'row1' 'row2' as rowcolors silent %}
        <tr class="{{ rowcolors }}">{% include "subtemplate.html" %}</tr>
    {% endfor %}

This will output a list of ``<tr>`` elements with ``class``
alternating between ``row1`` and ``row2``; the subtemplate will have
access to ``rowcolors`` in its context that matches the class of the
``<tr>`` that encloses it. If the ``silent`` keyword were to be
omitted, ``row1`` would be emitted as normal text, outside the
``<tr>`` element.

When the silent keyword is used on a cycle definition, the silence
automatically applies to all subsequent uses of the cycle tag. In,
the following template would output *nothing*, even though the second
call to ``{% cycle %}`` doesn't specify silent:

    {% cycle 'row1' 'row2' as rowcolors silent %}
    {% cycle rowcolors %}


extends
------

Signals that this template extends a parent template.

This tag can be used in two ways:

* ``{% extends "base.html" %}`` (with quotes) uses the literal value
  ``"base.html"`` as the name of the parent template to extend.

* ``{% extends variable %}`` uses the value of ``variable``. If the variable
  evaluates to a string, Django will use that string as the name of the
  parent template. If the variable evaluates to a ``Template`` object,
  Django will use that object as the parent template.

See [template-inheritance] for more information.



filter
------

Filters the contents of the variable through variable filters.

Filters can also be piped through each other, and they can have arguments --
just like in variable syntax.

Sample usage:

    {% filter force_escape|lower %}
        This text will be HTML-escaped, and will appear in all lowercase.
    {% endfilter %}

.. note:

    The `escape` and `safe` filters are not acceptable
    arguments. Instead, use the `autoescape` tag to manage autoescaping
    for blocks of template code.



firstof
------

Outputs the first variable passed that is not False. Does NOT auto-escape
variable values.

Outputs nothing if all the passed variables are False.

Sample usage:

    {% firstof var1 var2 var3 %}

This is equivalent to:

    {% if var1 %}
        {{ var1|safe }}
    {% elif var2 %}
        {{ var2|safe }}
    {% elif var3 %}
        {{ var3|safe }}
    {% endif %}

You can also use a literal string as a fallback value in case all
passed variables are False:

    {% firstof var1 var2 var3 "fallback value" %}

for
------

Loop over each item in an array.  For example, to display a list of athletes
provided in ``athlete_list``:

    <ul>
    {% for athlete in athlete_list %}
        <li>{{ athlete.name }}</li>
    {% endfor %}
    </ul>

You can loop over a list in reverse by using
``{% for obj in list reversed %}``.

If you need to loop over a list of lists, you can unpack the values
in each sub-list into individual variables. For example, if your context
contains a list of (x,y) coordinates called ``points``, you could use the
following to output the list of points:

    {% for x, y in points %}
        There is a point at {{ x }},{{ y }}
    {% endfor %}

The for loop sets a number of variables available within the loop:

    ==========================  ===============================================
    Variable                    Description
    ==========================  ===============================================
    ``forloop.counter``         The current iteration of the loop (1-indexed)
    ``forloop.counter0``        The current iteration of the loop (0-indexed)
    ``forloop.revcounter``      The number of iterations from the end of the
                                loop (1-indexed)
    ``forloop.revcounter0``     The number of iterations from the end of the
                                loop (0-indexed)
    ``forloop.first``           True if this is the first time through the loop
    ``forloop.last``            True if this is the last time through the loop
    ``forloop.parentloop``      For nested loops, this is the loop "above" the
                                current one
    ==========================  ===============================================

for ... empty
------

The ``for`` tag can take an optional ``{% empty %}`` clause that will be
displayed if the given array is empty or could not be found:

    <ul>
    {% for athlete in athlete_list %}
        <li>{{ athlete.name }}</li>
    {% empty %}
        <li>Sorry, no athletes in this list.</li>
    {% endfor %}
    <ul>

The above is equivalent to -- but shorter, cleaner, and possibly faster
than -- the following:

    <ul>
      {% if athlete_list %}
        {% for athlete in athlete_list %}
          <li>{{ athlete.name }}</li>
        {% endfor %}
      {% else %}
        <li>Sorry, no athletes in this list.</li>
      {% endif %}
    </ul>


if
------

The ``{% if %}`` tag evaluates a variable, and if that variable is "true" (i.e.
exists, is not empty, and is not a false boolean value) the contents of the
block are output:

    {% if athlete_list %}
        Number of athletes: {{ athlete_list|length }}
    {% elif athlete_in_locker_room_list %}
        Athletes should be out of the locker room soon!
    {% else %}
        No athletes.
    {% endif %}

In the above, if ``athlete_list`` is not empty, the number of athletes will be
displayed by the ``{{ athlete_list|length }}`` variable.

As you can see, the ``if`` tag may take one or several ``{% elif %}``
clauses, as well as an ``{% else %}`` clause that will be displayed if all
previous conditions fail. These clauses are optional.

The ``if`` tag is very expressive, see [if-details] for details.


ifchanged
------

Check if a value has changed from the last iteration of a loop.

The ``{% ifchanged %}`` block tag is used within a loop. It has two possible
uses.

1. Checks its own rendered contents against its previous state and only
   displays the content if it has changed. For example, this displays a list of
   days, only displaying the month if it changes:

        <h1>Archive for {{ year }}</h1>

        {% for date in days %}
            {% ifchanged %}<h3>{{ date|date:"F" }}</h3>{% endifchanged %}
            <a href="{{ date|date:"M/d"|lower }}/">{{ date|date:"j" }}</a>
        {% endfor %}

2. If given one or more variables, check whether any variable has changed.
   For example, the following shows the date every time it changes, while
   showing the hour if either the hour or the date has changed:

        {% for date in days %}
            {% ifchanged date.date %} {{ date.date }} {% endifchanged %}
            {% ifchanged date.hour date.date %}
                {{ date.hour }}
            {% endifchanged %}
        {% endfor %}

The ``ifchanged`` tag can also take an optional ``{% else %}`` clause that
will be displayed if the value has not changed:

        {% for match in matches %}
            <div style="background-color:
                {% ifchanged match.ballot_id %}
                    {% cycle "red" "blue" %}
                {% else %}
                    grey
                {% endifchanged %}
            ">{{ match }}</div>
        {% endfor %}



ifequal
------

Output the contents of the block if the two arguments equal each other.

Example:

    {% ifequal user.pk comment.user_id %}
        ...
    {% endifequal %}

As in the `if` tag, an ``{% else %}`` clause is optional.

The arguments can be hard-coded strings, so the following is valid:

    {% ifequal user.username "adrian" %}
        ...
    {% endifequal %}

An alternative to the ``ifequal`` tag is to use the `if` tag and the
``==`` operator.



ifnotequal
------

Just like `ifequal`, except it tests that the two arguments are not
equal.

An alternative to the ``ifnotequal`` tag is to use the `if` tag and
the ``!=`` operator.



include
------

Loads a template and renders it with the current context. This is a way of
"including" other templates within a template.

The template name can either be a variable or a hard-coded (quoted) string,
in either single or double quotes.

This example includes the contents of the template ``"foo/bar.html"``:

    {% include "foo/bar.html" %}

This example includes the contents of the template whose name is contained in
the variable ``template_name``:

    {% include template_name %}

An included template is rendered with the context of the template that's
including it. This example produces the output ``"Hello, John"``:

* Context: variable ``person`` is set to ``"john"``.
* Template:

    {% include "name_snippet.html" %}

* The ``name_snippet.html`` template:

    {{ greeting }}, {{ person|default:"friend" }}!

You can pass additional context to the template using keyword arguments:

    {% include "name_snippet.html" with person="Jane" greeting="Hello" %}

If you want to only render the context with the variables provided (or even
no variables at all), use the ``only`` option:

    {% include "name_snippet.html" with greeting="Hi" only %}

.. note:
    The `include` tag should be considered as an implementation of
    "render this subtemplate and include the HTML", not as "parse this
    subtemplate and include its contents as if it were part of the parent".
    This means that there is no shared state between included templates --
    each include is a completely independent rendering process.


loadtag / loadfilter
------

Loads a custom template tag- or filter- set.

For example, the following template would load all filters
registered in ``somelibrary`` and ``otherlibrary`` located in package
``package``:

    {% loadfilter somelibrary package.otherlibrary %}

You can also selectively load individual filters or tags from a library, using
the ``from`` argument. In this example, the template tags named ``foo``
and ``bar`` will be loaded from ``somelibrary``:

    {% loadtag foo bar from somelibrary %}

See [Custom tag and filter libraries](custom-template-tags.md) for
more information.


spaceless
------

Removes whitespace between HTML tags. This includes tab
characters and newlines.

Example usage:

    {% spaceless %}
        <p>
            <a href="foo/">Foo</a>
        </p>
    {% endspaceless %}

This example would return this HTML:

    <p><a href="foo/">Foo</a></p>

Only space between *tags* is removed -- not space between tags and text. In
this example, the space around ``Hello`` won't be stripped:

    {% spaceless %}
        <strong>
            Hello
        </strong>
    {% endspaceless %}


verbatim
------
Stops the template engine from rendering the contents of this block tag.

A common use is to allow a Javascript template layer that collides with
Reinhardt's syntax. For example:

    {% verbatim %}
        {{if dying}}Still alive.{{/if}}
    {% endverbatim %}

You can also designate a specific closing tag, allowing the use of
``{% endverbatim %}`` as part of the unrendered contents:

    {% verbatim myblock %}
        Avoid template rendering via the {% verbatim %}{% endverbatim %} block.
    {% endverbatim myblock %}



widthratio
------

For creating bar charts and such, this tag calculates the ratio of a given
value to a maximum value, and then applies that ratio to a constant.

For example:

    <img src="bar.png" alt="Bar"
         height="10" width="{% widthratio this_value max_value max_width %}" />

If ``this_value`` is 175, ``max_value`` is 200, and ``max_width`` is 100, the
image in the above example will be 88 pixels wide
(because 175/200 = .875; .875 * 100 = 87.5 which is rounded up to 88).



with
------

Caches a complex variable under a simpler name. This is useful when accessing
an "expensive" method (e.g., one that hits the database) multiple times.

For example:

    {% with total=business.employees.count %}
        {{ total }} employee{{ total|pluralize }}
    {% endwith %}

The populated variable (in the example above, ``total``) is only available
between the ``{% with %}`` and ``{% endwith %}`` tags.

You can assign more than one context variable:

    {% with alpha=1 beta=2 %}
        ...
    {% endwith %}

