Writing custom template filters
=================================

Custom filters are just functions that take one or two arguments:

* The value of the variable (input) -- not necessarily a string.
* The value of the argument -- this can have a default value, or be left
  out altogether.

For example, in the filter ``{{ var|foo:"bar" }}``, the filter ``foo`` would be
passed the variable ``var`` and the argument ``"bar"``.

Filter functions should always return something. They shouldn't raise
exceptions. They should fail silently. In case of error, they should return
either the original input or an empty string -- whichever makes more sense.

Here's an example filter definition:

    // Removes all values of arg from the given string
    exports.cut = function(value, arg) {
        return value.replace(arg, '');
    }

And here's an example of how that filter would be used:

    {{ somevariable|cut:"0" }}

Most filters don't take arguments. In this case, just leave the argument out of
your function. Example:


    // Only one argument.
    // Converts a string into all lowercase
    exports.lower = function(value) {
        return value.lower()
    };

Filters and auto-escaping
---------------------------

When writing a custom filter, give some thought to how the filter will interact
with Reinhardt's auto-escaping behavior. Note that three types of strings can be
passed around inside the template code:

* **Raw strings** are the native String types. On output, they're escaped if
auto-escaping is in effect and presented unchanged, otherwise.

* **Safe strings** are strings that have been marked safe from further
escaping at output time. Any necessary escaping has already been done. They're
commonly used for output that contains raw HTML that is intended   to be
interpreted as-is on the client side. Internally, these strings are instances
of `String` with the property `isSafe=true` attached. You can test for them
using code like:

    var {isSafe} = require('reinhardt/utils');
    isSafe(fooString)


* **Strings marked as "needing escaping"** are *always* escaped on output,
regardless of whether they are in an `autoescape` block or   not. These
strings are only escaped once, however, even if auto-escaping applies.
Internally, these strings are also instances of `String` with the property
`doEscape=true` attached. Generally you don't have to worry about these; they
exist for the implementation of the `escape` filter.

Template filter code falls into one of two situations:

1. Introduces no HTML-unsafe characters
-----------------------------------------

Your filter does not introduce any HTML-unsafe characters (``<``, ``>``,
``'``, ``"`` or ``&``) into the result that were not already present. In
this case, you can let Reinhardt take care of all the auto-escaping
handling for you. All you need to do is set the ``isSafe`` flag to ``True``
at your filter function, like so:


       exports.myFilter = function() {...}
       exports.myFilter.isSafe = true;

The `isSafe` flag tells Reinhardt that if a "safe" string is passed into your
filter, the result will still be "safe" and if a non-safe string is    passed
in, Reinhardt will automatically escape it, if necessary.

You can think of this as meaning "this filter is safe -- it doesn't
introduce any possibility of unsafe HTML."

The reason ``isSafe`` is necessary is because there are plenty of    normal
string operations that will turn a safe String object back into    a normal
String object and, rather than try to catch    them all, which would be very
difficult, Reinhardt repairs the damage after    the filter has completed.

For example, suppose you have a filter that adds the string ``xx`` to    the
end of any input. Since this introduces no dangerous HTML characters    to the
result (aside from any that were already present), you should    mark your
filter with ``isSafe``:


       exports.add_xx = function(value) {
           return value + 'xx';
       };
       exports.add_xx.isSafe = true;

When this filter is used in a template where auto-escaping is enabled,
Reinhardt will escape the output whenever the input is not already marked
as "safe".

By default, ``isSafe`` is ``false``, and you can omit it from any filters
where it isn't required.

Be careful when deciding if your filter really does leave safe strings    as
safe. If you're *removing* characters, you might inadvertently leave
unbalanced HTML tags or entities in the result. For example, removing a
``>`` from the input might turn ``<a>`` into ``<a``, which would need to    be
escaped on output to avoid causing problems. Similarly, removing a
semicolon (``;``) can turn ``&amp;`` into ``&amp``, which is no longer a
valid entity and thus needs further escaping. Most cases won't be nearly
this tricky, but keep an eye out for any problems like that when    reviewing
your code.

Marking a filter ``isSafe`` will coerce the filter's return value to    a
string.  If your filter should return a boolean or other non-string    value,
marking it ``isSafe`` will probably have unintended    consequences (such as
converting a boolean false to the string    'false').

2. Introduces new HTML markup
-----------------------------------

Alternatively, your filter code can manually take care of any necessary
escaping. This is necessary when you're introducing new HTML markup into
the result. You want to mark the output as safe from further    escaping so
that your HTML markup isn't escaped further, so you'll need    to handle the
input yourself.

To mark the output as a safe string, use `reinhardt.utils.markSafe()`.

Be careful, though. You need to do more than just mark the output as    safe.
You need to ensure it really *is* safe, and what you do depends on    whether
auto-escaping is in effect. The idea is to write filters than    can operate
in templates where auto-escaping is either on or off in    order to make
things easier for your template authors.

In order for your filter to know the current auto-escaping state, set the
``needsAutoescape`` flag to ``true`` when you write your filter function.
(If you don't specify this flag, it defaults to ``false``). This flag tells
Reinhardt that your filter function wants to be passed an extra    argument,
called ``autoescape``, that is ``true`` if auto-escaping is in    effect and
``false`` otherwise.

For example, let's write a filter that emphasizes the first character of    a
string:


      var {markSafe} = require('reinhardt/utils');
      var {escape, conditionalEscape} = require('reinhardt/utils/html');
      exports.initialLetter = function(text, autoescape) {
        var first = text.substring(0,1);
        var other = test.substring(1);
        var escFn;
        if (autoescape === true) {
          escFn = conditionalEscape;
        } else {
          escFn = function(x) { return x};
        }
        var result = "<strong>" + escFn(first) + "</strong>";
        return markSafe(result);
      }
      exports.initialLetter.needsAutoescape = true;

The ``needsAutoescape`` flag and the ``autoescape`` argument mean that our
function will know whether automatic escaping is in effect when the filter
is called. We use ``autoescape`` to decide whether the input data needs to
be passed through ``reinhardt.utils.html.conditionalEscape`` or not. (In
the latter case, we just use the identity function as the "escape"
function.) The ``conditionalEscape()`` function is like ``escape()`` except
it only escapes input that is **not** a safe String instance. If a safe
String is passed to ``conditional_escape()``, the data is returned
unchanged.

Finally, in the above example, we remember to mark the result as safe    so
that our HTML is inserted directly into the template without further
escaping.

There's no need to worry about the ``isSafe`` flag in this case    (although
including it wouldn't hurt anything). Whenever you manually    handle the
auto-escaping issues and return a safe string, the    ``isSafe`` flag won't
change anything either way.

