Built-in template filters
==================================

This document describes Reinhardt's built-in template filters.

**List of built in filters**

- [add](#add)
- [addslashes](#addslashes)
- [byKey](#bykey)
- [capfirst](#capfirst)
- [center](#center)
- [cut](#cut)
- [date](#date)
- [default](#default)
- [defaultifnull](#defaultifnull)
- [escape](#escape)
- [first](#first)
- [fix_ampersands](#fix_ampersands)
- [floatformat](#floatformat)
- [force_escape](#force_escape)
- [join](#join)
- [last](#last)
- [length](#length)
- [length_is](#length_is)
- [linebreaks](#linebreaks)
- [linebreaksbr](#linebreaksbr)
- [linenumbers](#linenumbers)
- [ljust](#ljust)
- [lower](#lower)
- [make_list](#make_list)
- [removetags](#removetags)
- [rjust](#rjust)
- [safe](#safe)
- [slice](#slice)
- [slugify](#slugify)
- [sortByKey](#sortbykey)
- [striptags](#striptags)
- [title](#title)
- [truncatechars](#truncatechars)
- [truncatewords](#truncatewords)
- [truncatewords_html](#truncatewords_html)
- [upper](#upper)
- [wordcount](#wordcount)
- [wordwrap](#wordwrap)
- [yesno](#yesno)

add
------

Adds the argument to the value.

For example:

    {{ value|add:"2" }}

If ``value`` is ``4``, then the output will be ``6``.

This filter will first try to coerce both values to integers. If this fails,
it'll attempt to add the values together anyway. This will work on some data
types (strings, list, etc.) and fail on others. If it fails, the result will
be an empty string.

For example, if we have:

    {{ first|add:second }}

and ``first`` is ``[1, 2, 3]`` and ``second`` is ``[4, 5, 6]``, then the
output will be ``[1, 2, 3, 4, 5, 6]``.

Strings that can be coerced to integers will be **summed**, not
concatenated, as in the first example above.


addslashes
------

Adds slashes before quotes. Useful for escaping strings in CSV, for example.

For example:

    {{ value|addslashes }}

If ``value`` is ``"I'm using Django"``, the output will be
``"I\'m using Django"``.

byKey
------

Access an object's property. This is useful if you have the key
as a variable and need to output the value:

For example:

    {{myObject|key:myKey}}

capfirst
------

Capitalizes the first character of the value.

For example:

    {{ value|capfirst }}

If ``value`` is ``"django"``, the output will be ``"Django"``.



center
------

Centers the value in a field of a given width.

For example:

    "{{ value|center:"15" }}"

If ``value`` is ``"Django"``, the output will be ``"     Django    "``.



cut
------

Removes all values of arg from the given string.

For example:

    {{ value|cut:" " }}

If ``value`` is ``"String with spaces"``, the output will be
``"Stringwithspaces"``.



date
------

Formats a date according to the given format.

Uses the same format as Java's [SimpleDate](http://java.sun.com/j2se/1.4.2/docs/api/java/text/SimpleDateFormat.html) function.

For example:

    {{ value|date:"D d M Y" }}

If ``value`` is a ``Date`` object (e.g., the result of
``new Date()``), the output will be the string
``'Wed 09 Jan 2008'``.


default
------

If value evaluates to ``false``, uses the given default. Otherwise, uses the
value.

For example:

    {{ value|default:"nothing" }}

If ``value`` is ``""`` (the empty string), the output will be ``nothing``.



defaultifnull
------

If (and only if) value is ``null``, uses the given default. Otherwise, uses the
value.

For example:

    {{ value|defaultifnull:"nothing" }}

If ``value`` is ``null``, the output will be the string ``"nothing"``.


escape
------

Escapes a string's HTML. Specifically, it makes these replacements:

* ``<`` is converted to ``&lt;``
* ``>`` is converted to ``&gt;``
* ``'`` (single quote) is converted to ``&#39;``
* ``"`` (double quote) is converted to ``&quot;``
* ``&`` is converted to ``&amp;``

The escaping is only applied when the string is output, so it does not matter
where in a chained sequence of filters you put ``escape``: it will always be
applied as though it were the last filter. If you want escaping to be applied
immediately, use the `force_escape` filter.

Applying ``escape`` to a variable that would normally have auto-escaping
applied to the result will only result in one round of escaping being done. So
it is safe to use this function even in auto-escaping environments. If you want
multiple escaping passes to be applied, use the `force_escape` filter.

For example, you can apply ``escape`` to fields when `autoescape` is off:

    {% autoescape off %}
        {{ title|escape }}
    {% endautoescape %}


first
------

Returns the first item in an array.

For example:

    {{ value|first }}

If ``value`` is the array ``['a', 'b', 'c']``, the output will be ``'a'``.


fix_ampersands
------

.. note:

    This is rarely useful as ampersands are automatically escaped. See
    `escape` for more information.

Replaces ampersands with ``&amp;`` entities.

For example:

    {{ value|fix_ampersands }}

If ``value`` is ``Tom & Jerry``, the output will be ``Tom &amp; Jerry``.

However, ampersands used in named entities and numeric character references
will not be replaced. For example, if ``value`` is ``Caf&eacute;``, the output
will *not* be ``Caf&amp;eacute;`` but remain ``Caf&eacute;``. This means that
in some edge cases, such as acronyms followed by semicolons, this filter will
not replace ampersands that need replacing. For example, if ``value`` is
``Contact the R&D;``, the output will remain unchanged because ``&D;``
resembles a named entity.


floatformat
------

When used without an argument, rounds a floating-point number to one decimal
place -- but only if there's a decimal part to be displayed. For example:

    ============  ===========================  ========
    ``value``     Template                     Output
    ============  ===========================  ========
    ``34.23234``  ``{{ value|floatformat }}``  ``34.2``
    ``34.00000``  ``{{ value|floatformat }}``  ``34``
    ``34.26000``  ``{{ value|floatformat }}``  ``34.3``
    ============  ===========================  ========

    If used with a numeric integer argument, ``floatformat`` rounds a number to
    that many decimal places. For example:

    ============  =============================  ==========
    ``value``     Template                       Output
    ============  =============================  ==========
    ``34.23234``  ``{{ value|floatformat:3 }}``  ``34.232``
    ``34.00000``  ``{{ value|floatformat:3 }}``  ``34.000``
    ``34.26000``  ``{{ value|floatformat:3 }}``  ``34.260``
    ============  =============================  ==========

    Particularly useful is passing 0 (zero) as the argument which will round the
    float to the nearest integer.

    ============  ================================  ==========
    ``value``     Template                          Output
    ============  ================================  ==========
    ``34.23234``  ``{{ value|floatformat:"0" }}``   ``34``
    ``34.00000``  ``{{ value|floatformat:"0" }}``   ``34``
    ``39.56000``  ``{{ value|floatformat:"0" }}``   ``40``
    ============  ================================  ==========

    If the argument passed to ``floatformat`` is negative, it will round a number
    to that many decimal places -- but only if there's a decimal part to be
    displayed. For example:

    ============  ================================  ==========
    ``value``     Template                          Output
    ============  ================================  ==========
    ``34.23234``  ``{{ value|floatformat:"-3" }}``  ``34.232``
    ``34.00000``  ``{{ value|floatformat:"-3" }}``  ``34``
    ``34.26000``  ``{{ value|floatformat:"-3" }}``  ``34.260``
    ============  ================================  ==========

Using ``floatformat`` with no argument is equivalent to using ``floatformat``
with an argument of ``-1``.



force_escape
------

Applies HTML escaping to a string (see the `escape` filter for
details). This filter is applied *immediately* and returns a new, escaped
string. This is useful in the rare cases where you need multiple escaping or
want to apply other filters to the escaped results. Normally, you want to use
the `escape` filter.

For example, if you want to catch the ``<p>`` HTML elements created by
the `linebreaks` filter:

    {% autoescape off %}
        {{ body|linebreaks|force_escape }}
    {% endautoescape %}

join
------

Joins a list with a string, like Python's ``str.join(list)``

For example:

    {{ value|join:" // " }}

If ``value`` is the list ``['a', 'b', 'c']``, the output will be the string
``"a // b // c"``.



last
------

Returns the last item in a list.

For example:

    {{ value|last }}

If ``value`` is the list ``['a', 'b', 'c', 'd']``, the output will be the
string ``"d"``.


length
------

Returns the length of the value. This works for both strings and arrays.

For example:

    {{ value|length }}

If ``value`` is ``['a', 'b', 'c', 'd']``, the output will be ``4``.



length_is
------

Returns ``true`` if the value's length is the argument, or ``False`` otherwise.

For example:

    {{ value|length_is:"4" }}

If ``value`` is ``['a', 'b', 'c', 'd']``, the output will be ``true``.



linebreaks
------

Replaces line breaks in plain text with appropriate HTML; a single
newline becomes an HTML line break (``<br />``) and a new line
followed by a blank line becomes a paragraph break (``</p>``).

For example:

    {{ value|linebreaks }}

If ``value`` is ``Joel\nis a slug``, the output will be ``<p>Joel<br />is a
slug</p>``.



linebreaksbr
------

Converts all newlines in a piece of plain text to HTML line breaks
(``<br />``).

For example:

    {{ value|linebreaksbr }}

If ``value`` is ``Joel\nis a slug``, the output will be ``Joel<br />is a
slug``.



linenumbers
------

Displays text with line numbers.

For example:

    {{ value|linenumbers }}

If ``value`` is:

    one
    two
    three

the output will be:

    1. one
    2. two
    3. three



ljust
------

Left-aligns the value in a field of a given width.

**Argument:** field size

For example:

    "{{ value|ljust:"10" }}"

If ``value`` is ``Django``, the output will be ``"Django    "``.



lower
------

Converts a string into all lowercase.

For example:

    {{ value|lower }}

If ``value`` is ``Still MAD At Yoko``, the output will be
``still mad at yoko``.



make_list
------

Returns the value turned into a list. For a string, it's a list of characters.
For an integer, the argument is cast into an unicode string before creating a
list.

For example:

    {{ value|make_list }}

If ``value`` is the string ``"Joel"``, the output would be the list
``[u'J', u'o', u'e', u'l']``. If ``value`` is ``123``, the output will be the
list ``[u'1', u'2', u'3']``.



removetags
------

Removes a space-separated list of [X]HTML tags from the output.

For example:

    {{ value|removetags:"b span"|safe }}

If ``value`` is ``"<b>Joel</b> <button>is</button> a <span>slug</span>"`` the
output will be ``"Joel <button>is</button> a slug"``.

Note that this filter is case-sensitive.

If ``value`` is ``"<B>Joel</B> <button>is</button> a <span>slug</span>"`` the
output will be ``"<B>Joel</B> <button>is</button> a slug"``.


rjust
------

Right-aligns the value in a field of a given width.

**Argument:** field size

For example:

    "{{ value|rjust:"10" }}"

If ``value`` is ``Django``, the output will be ``"    Django"``.



safe
------

Marks a string as not requiring further HTML escaping prior to output. When
autoescaping is off, this filter has no effect.


If you are chaining filters, a filter applied after ``safe`` can
make the contents unsafe again. For example, the following code
prints the variable as is, unescaped:

    {{ var|safe|escape }}


slice
------

Returns a slice of the array.

Uses the same syntax as JavaScript's array slicing. See
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
for an introduction.

Example:

    {{ some_list|slice:":2" }}

If ``some_list`` is ``['a', 'b', 'c']``, the output will be ``['a', 'b']``.



slugify
------

Converts to lowercase, removes non-word characters (alphanumerics and
underscores) and converts spaces to hyphens. Also strips leading and trailing
whitespace.

For example:

    {{ value|slugify }}

If ``value`` is ``"Joel is a slug"``, the output will be ``"joel-is-a-slug"``.

sortByKey
--------

Sort an array of objects by a common key.

For example:

    {{ fooArray|sortByKey:modifydate}}

Would return the array `fooArray` but sorted by the property `modifydate`.


striptags
------

Strips all [X]HTML tags.

For example:

    {{ value|striptags }}

If ``value`` is ``"<b>Joel</b> <button>is</button> a <span>slug</span>"``, the
output will be ``"Joel is a slug"``.


title
------

Converts a string into titlecase.

For example:

    {{ value|title }}

If ``value`` is ``"my first post"``, the output will be ``"My First Post"``.



truncatechars
------

Truncates a string if it is longer than the specified number of characters.
Truncated strings will end with a translatable ellipsis sequence ("...").

**Argument:** Number of characters to truncate to

For example:

    {{ value|truncatechars:9 }}

If ``value`` is ``"Joel is a slug"``, the output will be ``"Joel i..."``.



truncatewords
------

Truncates a string after a certain number of words.

**Argument:** Number of words to truncate after

For example:

    {{ value|truncatewords:2 }}

If ``value`` is ``"Joel is a slug"``, the output will be ``"Joel is ..."``.

Newlines within the string will be removed.



truncatewords_html
------

Similar to `truncatewords`, except that it is aware of HTML tags. Any
tags that are opened in the string and not closed before the truncation point,
are closed immediately after the truncation.

This is less efficient than `truncatewords`, so should only be used
when it is being passed HTML text.

For example:

    {{ value|truncatewords_html:2 }}

If ``value`` is ``"<p>Joel is a slug</p>"``, the output will be
``"<p>Joel is ...</p>"``.

Newlines in the HTML content will be preserved.



upper
------

Converts a string into all uppercase.

For example:

    {{ value|upper }}

If ``value`` is ``"Joel is a slug"``, the output will be ``"JOEL IS A SLUG"``.


wordcount
------

Returns the number of words.

For example:

    {{ value|wordcount }}

If ``value`` is ``"Joel is a slug"``, the output will be ``4``.



wordwrap
------

Wraps words at specified line length.

**Argument:** number of characters at which to wrap the text

For example:

    {{ value|wordwrap:5 }}

If ``value`` is ``Joel is a slug``, the output would be:

    Joel
    is a
    slug



yesno
------

Maps values for true, false and (optionally) None, to the strings "yes", "no",
"maybe", or a custom mapping passed as a comma-separated list, and
returns one of those strings according to the value:

For example:

    {{ value|yesno:"yeah,no,maybe" }}



    ==========  ======================  ==================================
    Value       Argument                Outputs
    ==========  ======================  ==================================
    ``True``                            ``yes``
    ``True``    ``"yeah,no,maybe"``     ``yeah``
    ``False``   ``"yeah,no,maybe"``     ``no``
    ``None``    ``"yeah,no,maybe"``     ``maybe``
    ``None``    ``"yeah,no"``           ``"no"`` (converts None to False
                                        if no mapping for None is given)
    ==========  ======================  ==================================

