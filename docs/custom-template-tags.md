Writing custom template tags
===============================

Tags are more complex than filters, because tags can do anything.

**Table of Contents**

- [A quick overview](#a-quick-overview)
- [Writing the compilation function](#writing-the-compilation-function)
- [Writing the renderer](#writing-the-renderer)
- [Auto-escaping considerations](#auto-escaping-considerations)
- [Thread-safety considerations](#thread-safety-considerations)
- [Passing template variables to the tag](#passing-template-variables-to-the-tag)
- [Setting a variable in the context](#setting-a-variable-in-the-context)
- [Parsing until another block tag](#parsing-until-another-block-tag)
- [Parsing until another block tag, and saving contents](#parsing-until-another-block-tag-and-saving-contents)

A quick overview
--------------------

The template system works in a two-step process: compiling and rendering. To
define a custom template tag, you specify how the compilation works and how
the rendering works.

When Reinhardt compiles a template, it splits the raw template text into
''nodes''. Each node is an instance of ``reinhardt.nodes.Node`` and has
a ``render()`` method. A compiled template is, simply, a list of ``Node``
objects. When you call ``render()`` on a compiled template object, the template
calls ``render()`` on each ``Node`` in its node list, with the given context.
The results are all concatenated together to form the output of the template.

Thus, to define a custom template tag, you specify how the raw template tag is
converted into a ``Node`` (the compilation function), and what the node's
``render()`` method does.

Writing the compilation function
---------------------------------

For each template tag the template parser encounters, it calls a function with
the tag contents and the parser object itself. This function is responsible
for returning a ``Node`` instance based on the contents of the tag.

For example, let's write a template tag, ``{% current_time %}``, that displays
the current date/time, formatted according to a parameter given in the tag, in
Java's SimpleDate syntax. It's a good idea to decide the tag syntax before
anything else. In our case, let's say the tag should be used like this:


    <p>The time is {% current_time "HH:mm:ss" %}.</p>

The parser for this function should grab the parameter and create a ``Node``
object:


    var {TemplateSyntaxError} = require('reinhardt/errors');
    exports.current_time = function(parser, token) {
        # split_contents() knows not to split quoted strings.
        var bits = token.splitContents();
        var tagName = bits[0];
        if (bits.length != 2) {
          throw new TemplateSyntaxError(tagName + " tag requires a single argument");
        }
        var formatString = bits[1];
        if (formatString[0] !== formatString.slice(-1) || ['"', "'"].indexOf(formatString) < 0) {
          throw new TemplateSyntaxError(tagName + " tag argument should be in quotes");
        }
        return CurrentTimeNode(formatString.slice(1, -1));
    }

Notes:

* ``parser`` is the template parser object. We don't need it in this
  example.

* ``token.contents`` is a string of the raw contents of the tag. In our
  example, it's `current_time "HH:mm:ss"`.

* The ``token.splitContents()`` method separates the arguments on spaces
  while keeping quoted strings together. The more straightforward
  ``token.contents.split()`` wouldn't be as robust, as it would naively
  split on *all* spaces, including those within quoted strings. It's a good
  idea to always use ``token.splitContents()``.

* This function is responsible for raising ``TemplateSyntaxError``, with
helpful messages, for any syntax error.

* The ``TemplateSyntaxError`` exceptions use the ``tagName`` variable.
  Don't hard-code the tag's name in your error messages, because that
  couples the tag's name to your function. ``token.splitContents()[0]``
  will ''always'' be the name of your tag -- even when the tag has no
  arguments.

* The function returns a ``CurrentTimeNode`` with everything the node needs
  to know about this tag. In this case, it just passes the argument --
  ``"HH:mm:ss"``. The leading and trailing quotes from the
  template tag are removed in ``formatString.slice(1, -1)``.

* The parsing is very low-level. The Django developers have experimented
  with writing small frameworks on top of this parsing system, using
  techniques such as EBNF grammars, but those experiments made the template
  engine too slow. It's low-level because that's fastest.

Writing the renderer
-----------------------

The second step in writing custom tags is to define a ``Node`` subclass that
has a ``render()`` method.

Continuing the above example, we need to define ``CurrentTimeNode``:

    var dates = require('ringo/utils/dates');
    var {Node} = require('reinhardt/nodes');

    var CurrentTimeNode = function(formatString) {
      this.formatString = formatString;
      return this;
    }
    // use the getByType from superlcass `Node`.
    CurrentTimeNode.prototype.getByType = Node.prototype.getByType;
    CurrentTimeNode.prototype.render = function(context) {
       return dates.format(new Date(), this.formatString);
    }

Notes:

* the constructor gets the ``formatString`` from ``current_time()``.
  Always pass any options/parameters/arguments to a ``Node`` via its
  constructor.

* The ``render()`` method is where the work actually happens.

* ``render()`` should never raise ``TemplateSyntaxError`` or any other
  exception. It should fail silently, just as template filters should.

Ultimately, this decoupling of compilation and rendering results in an
efficient template system, because a template can render multiple contexts
without having to be parsed multiple times.

Auto-escaping considerations
----------------------------------

The output from template tags is **not** automatically run through the
auto-escaping filters. However, there are still a couple of things you should
keep in mind when writing a template tag.

If the ``render()`` function of your template stores the result in a context
variable (rather than returning the result in a string), it should take care
to call ``markSafe()`` if appropriate. When the variable is ultimately
rendered, it will be affected by the auto-escape setting in effect at the
time, so content that should be safe from further escaping needs to be marked
as such.

Also, if your template tag creates a new context for performing some sub-
rendering, set the auto-escape attribute to the current context's value. The
constructor for the ``Context`` class takes a second parameter ``autoescape``
that you can use for this purpose. For example:


    var {Context} = require("reinhardt/context");
    CurrentTimeNode.prototype.render = function(context) {
      // ...
      var newContext = new Context({'var': obj}, false);
      // ...
    }

This is not a very common situation, but it's useful if you're rendering a
template yourself. For example:


    ...render = function(context) {
        // ...
        var t = template.loader.loadTemplateSource('small_fragment.html')
        return t.render(Context({'var': obj}, context.autoescape))
      }

If we had neglected to pass in the current ``context.autoescape`` value to our
new ``Context`` in this example, the results would have *always* been
automatically escaped, which may not be the desired behavior if the template
tag is used inside a `{% autoescape off %}` block.

Thread-safety considerations
-----------------------------

Once a node is parsed, its ``render`` method may be called any number of
times. Since Reinhardt is run in multi-threaded environments, a single node
may be simultaneously rendering with different contexts in response to two
separate requests. Therefore, it's important to make sure your template tags
are thread safe.

To make sure your template tags are thread safe, you should never store state
information on the node itself. For example, Reinhardt provides a builtin
`cycle` template tag that cycles among a list of given strings each time
it's rendered:


    {% for o in some_list %}
        <tr class="{% cycle 'row1' 'row2' %}>
            ...
        </tr>
    {% endfor %}

A naive implementation of ``CycleNode`` might look something like this:

    var {cycle} = require('reinhardt/utils/iter');

    var CycleNode = function(cyclevars) {
      this.cycleIter = cycle(cyclevars);
      return this;
    }

    CycleNode.prototype.render = function(context) {
       return this.cycleIter.next();
    }


But, suppose we have two templates rendering the template snippet from above at
the same time:

1. Thread 1 performs its first loop iteration, ``CycleNode.render()``
   returns 'row1'
2. Thread 2 performs its first loop iteration, ``CycleNode.render()``
   returns 'row2'
3. Thread 1 performs its second loop iteration, ``CycleNode.render()``
   returns 'row1'
4. Thread 2 performs its second loop iteration, ``CycleNode.render()``
   returns 'row2'

The CycleNode is iterating, but it's iterating globally. As far as Thread 1
and Thread 2 are concerned, it's always returning the same value. This is
obviously not what we want!

To address this problem, Reinhardt provides a ``renderContext`` that's
associated with the ``context`` of the template that is currently being
rendered. The ``renderContext`` object should be used to store ``Node`` state
between invocations of the ``render`` method.

Let's refactor our ``CycleNode`` implementation to use the ``renderContext``:


    var {cycle} = require('reinhardt/utils/iter');

    var CycleNode = function(cyclevars) {
      this.cyclevars = cyclevars;
      // each CycleNode needs a unique id
      // which we use to put our state into `renderContext`
      this.uuid = java.util.UUID.randomUUID().toString();
      return this;
    }

    CycleNode.prototype.render = function(context) {
       if (! context.renderContext.has(this.uuid)) {
          context.renderContext.set(this.uuid, cycle(this.cyclevars));
       }
       cycleIter = context.renderContext.get(this.uuid);
       return cycleIter.next();
    }

Note that it's perfectly safe to store global information that will not change
throughout the life of the ``Node`` as an instance property. In the case of
``CycleNode``, the ``cyclevars`` argument doesn't change after the ``Node`` is
instantiated, so we don't need to put it in the ``renderContext``. But state
information that is specific to the template that is currently being rendered,
like the current iteration of the ``CycleNode``, should be stored in the
``renderContext``.

Passing template variables to the tag
-------------------------------------------

Although you can pass any number of arguments to a template tag using
``token.splitContents()``, the arguments are all unpacked as string literals.
A little more work is required in order to pass dynamic content (a template
variable) to a template tag as an argument.

While the previous examples have formatted the current time into a string and
returned the string, suppose you wanted to pass in a Date object and have the
template tag format that date-time:


    <p>This post was last updated at {% format_time blogEntry.modified "MM/dd/yyyy" %}.</p>

Initially, ``token.splitContents()`` will return three values:

1. The tag name ``format_time``.
2. The string ``"blogEntry.modified"`` (without the surrounding
   quotes).
3. The formatting string ``"MM/dd/yyyy"``. The return value from
   ``splitContents()`` will include the leading and trailing quotes for
   string literals like this.

Now your tag should begin to look like this:

    exports.format_time = function(parser, token) {
        var bits = token.splitContents();
        var tagName = bits[0];
        if (bits.length != 3) {
          throw TemplateSyntaxError(tagName + 'requires exactly two arguments');
        }
        var dateToBeFormatted = bits[1];
        var formatString = bits[2];
        if (formatString[0] !== formatString.slice(-1) || ['"', "'"].indexOf(formatString[0]) < 0) {
          throw TemplateSyntaxError(tagName + " tag's argument should be in quotes")
        }
        return FormatTimeNode(dateToBeFormatted, formatString.slice(1, -1));
    }


You also have to change the renderer to retrieve the actual contents of the
``modified`` property of the ``blogEntry`` object.  This can be
accomplished by using the ``Variable()`` class.

To use the ``Variable`` class, simply instantiate it with the name of the
variable to be resolved, and then call ``variable.resolve(context)``. So,
for example:


    var {Variable} = require("reinhardt/variable");
    var FormatTimeNode = function(dateToBeFormatted, formatString) {
      this.dateToBeFormatted = new Variable(dateToBeFormatted, formatString)
      return this;
    }
    FormatTimeNode.prototype.render = function(context) {
        try {
          var actualDate = this.dateToBeFormatted.resolve(context);
          return dates.format(actualDate, this.formatString);
        } catch (e) {
          return '';
        }
    }

Variable resolution will throw an  exception if it cannot resolve the string
passed to it in the current context of the page.

     // @@ explain parser.compileFilter() which deals with variables optionally
     // having filters; and explain `tokenKwargs()` which is helps with
     // turning keywoard arguments into FilterExpressions


Setting a variable in the context
--------------------------------------

The above examples simply output a value. Generally, it's more flexible if your
template tags set template variables instead of outputting values. That way,
template authors can reuse the values that your template tags create.

To set a variable in the context, just use dictionary assignment on the context
object in the ``render()`` method. Here's an updated version of
``CurrentTimeNode`` that sets a template variable ``current_time`` instead of
outputting it:


    var CurrentTimeNode2 = function(formatString) {
      this.formatString = formatString;
      return this;
    }
    CurrentTimeNode2.prototype.render = function(context) {
      context['current_time'] = dates.format(new Date(), this.formatString);
      return;
    }

Note that ``render()`` returns the empty string. ``render()`` should always
return string output. If all the template tag does is set a variable,
``render()`` should return the empty string.

Here's how you'd use this new version of the tag:

    {% current_time "MM/dd/YYYY" %}<p>The time is {{ current_time }}.</p>

**Variable scope in context**

Any variable set in the context will only be available in the same ``block``
of the template in which it was assigned. This behavior is intentional; it
provides a scope for variables so that they don't conflict with context in
other blocks.

But, there's a problem with ``CurrentTimeNode2``: The variable name
``current_time`` is hard-coded. This means you'll need to make sure your
template doesn't use ``{{ current_time }}`` anywhere else, because the
``{% current_time %}`` will blindly overwrite that variable's value. A cleaner
solution is to make the template tag specify the name of the output variable,
like so:


    {% current_time "MM/dd/YYYY" as my_current_time %}
    <p>The current time is {{ my_current_time }}.</p>

To do that, you'll need to refactor both the compilation function and ``Node``
class, like so:


    var CurrentTimeNode3 = function(formatString, varName) {
      this.formatString = formatString;
      this.varName = varName;
      return this;
    }
    CurrentTimeNode3.prototype.render = function(context) {
      context[this.varName] = dates.format(new Date(), this.formatString);
      return;
    }

    exports.current_time = function(parser, token) {
      var bits = token.splitContents();
      var tagName = bits[0];
      if (bits.length !== 4) {
        throw TemplateSyntaxError(tagName + ' requires arguments');
      }
      var formatString = bits[1];
      // bits[2] == 'as'
      var varName = bits[3];
      if (formatString[0] !== formatString.slice(-1) || ['"', "'"].indexOf(formatString) < 0) {
        throw TemplateSyntaxError(tagName + ' tag's argument should be in quotes)
      }
      return CurrentTimeNode3(formatString.slice(1, -1), varName);
    }

The difference here is that ``current_time()`` grabs the format string and
the variable name, passing both to ``CurrentTimeNode3``.

Parsing until another block tag
----------------------------------

Template tags can work in tandem. For instance, the standard `{% comment %}`
tag hides everything until ``{% endcomment %}``. To create a template tag such
as this, use ``parser.parse()`` in your compilation function.

Here's how a simplified ``{% comment %}`` tag might be implemented:

    var CommentNode = function() {};
    CommentNode.prototype.getByType = Node.prototype.getByType;
    CommentNode.prototype.render = function() {
      return '';
    }


Note: The actual implementation of `{% comment %}` is slightly different in
that it allows broken template tags to appear between ``{% comment %}`` and
``{% endcomment %}``. It does so by calling ``parser.skipPast('endcomment')``
instead of ``parser.parse(('endcomment',))`` followed by
``parser.deleteFirstToken()``, thus avoiding the generation of a node list.

``parser.parse()`` takes a tuple of names of block tags ''to parse until''. It
returns an instance of ``reinhardt.nodelist.NodeList``, which is a list of
all ``Node`` objects that the parser encountered ''before'' it encountered
any of the tags named in the tuple.

In ``nodelist = parser.parse(('endcomment',))`` in the above example,
``nodelist`` is a list of all nodes between the ``{% comment %}`` and ``{%
endcomment %}``, not counting ``{% comment %}`` and ``{% endcomment %}``
themselves.

After ``parser.parse()`` is called, the parser hasn't yet "consumed" the
``{% endcomment %}`` tag, so the code needs to explicitly call
``parser.deleteFirstToken()``.

``CommentNode.render()`` simply returns an empty string. Anything between
``{% comment %}`` and ``{% endcomment %}`` is ignored.

Parsing until another block tag, and saving contents
---------------------------------------------------------

In the previous example, ``comment()`` discarded everything between
``{% comment %}`` and ``{% endcomment %}``. Instead of doing that, it's
possible to do something with the code between block tags.

For example, here's a custom template tag, ``{% upper %}``, that capitalizes
everything between itself and ``{% endupper %}``.

Usage:

    {% upper %}This will appear in uppercase, {{ your_name }}.{% endupper %}

As in the previous example, we'll use ``parser.parse()``. But this time, we
pass the resulting ``nodelist`` to the ``Node``:

    var UpperNode = function(nodelist) {
      this.nodelist = nodelist;
      return this;
    }
    UpperNode.prototype.getByType = Node.prototype.getByType;
    UpperNode.prototype.render = function(context) {
        var output = this.nodelist.render(context);
        return output.toUpperCase();
    }

    exports.upper = function(parser, token) {
        var nodelist = parser.parse(['endupper']);
        parser.deleteFirstToken();
        return UpperNode(nodelist);
    }


The only new concept here is the ``self.nodelist.render(context)`` in
``UpperNode.render()``.

For more examples of complex rendering, see the source code for `{% if %}`,
`{% for %}`, `{% ifequal %}` or `{% ifchanged %}`. They live in
``reinhardt.tag.logic``.
