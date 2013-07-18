"if" tag details
===================

This document describes the operator details of the if tag.

**Table of Contents**

- [Boolean operators](#boolean-operators)
- [== operator](#-operator)
- [!= operator](#-operator-1)
- [< operator](#-operator-2)
- [> operator](#-operator-3)
- [<= operator](#-operator-4)
- [>= operator](#-operator-5)
- [in operator](#in-operator)
- [not in operator](#not-in-operator)
- [Filters](#filters)
- [Complex expressions](#complex-expressions)

Boolean operators
------

`if` tags may use ``and``, ``or`` or ``not`` to test a number of
variables or to negate a given variable:

    {% if athlete_list and coach_list %}
        Both athletes and coaches are available.
    {% endif %}

    {% if not athlete_list %}
        There are no athletes.
    {% endif %}

    {% if athlete_list or coach_list %}
        There are some athletes or some coaches.
    {% endif %}

    {% if not athlete_list or coach_list %}
        There are no athletes or there are some coaches (OK, so
        writing English translations of boolean logic sounds
        stupid; it's not our fault).
    {% endif %}

    {% if athlete_list and not coach_list %}
        There are some athletes and absolutely no coaches.
    {% endif %}

Use of both ``and`` and ``or`` clauses within the same tag is allowed, with
``and`` having higher precedence than ``or`` e.g.:

    {% if athlete_list and coach_list or cheerleader_list %}

will be interpreted like:

    if (athlete_list and coach_list) or cheerleader_list

Use of actual parentheses in the `if` tag is invalid syntax.  If you need
them to indicate precedence, you should use nested `if` tags.

`if` tags may also use the operators ``==``, ``!=``, ``<``, ``>``,
``<=``, ``>=`` and ``in`` which work as follows:


``==`` operator
------

Equality. Example:

    {% if somevar == "x" %}
      This appears if variable somevar equals the string "x"
    {% endif %}

``!=`` operator
------

Inequality. Example:

    {% if somevar != "x" %}
      This appears if variable somevar does not equal the string "x",
      or if somevar is not found in the context
    {% endif %}

``<`` operator
------

Less than. Example:

    {% if somevar < 100 %}
      This appears if variable somevar is less than 100.
    {% endif %}

``>`` operator
------

Greater than. Example:

    {% if somevar > 0 %}
      This appears if variable somevar is greater than 0.
    {% endif %}

``<=`` operator
------

Less than or equal to. Example:

    {% if somevar <= 100 %}
      This appears if variable somevar is less than 100 or equal to 100.
    {% endif %}

``>=`` operator
------

Greater than or equal to. Example:

    {% if somevar >= 1 %}
      This appears if variable somevar is greater than 1 or equal to 1.
    {% endif %}

``in`` operator
------

Contained within. This operator is supported by many Python containers to test
whether the given value is in the container.  The following are some examples
of how ``x in y`` will be interpreted:

    {% if "bc" in "abcdef" %}
      This appears since "bc" is a substring of "abcdef"
    {% endif %}

    {% if "hello" in greetings %}
      If greetings is a list or set, one element of which is the string
      "hello", this will appear.
    {% endif %}

    {% if user in users %}
      If users is a QuerySet, this will appear if user is an
      instance that belongs to the QuerySet.
    {% endif %}

``not in`` operator
------

Not contained within.  This is the negation of the ``in`` operator.


The comparison operators cannot be 'chained' like in Python or in mathematical
notation. For example, instead of using:

    {% if a > b > c %}  (WRONG)

you should use:

    {% if a > b and b > c %}


Filters
------

You can also use filters in the `if` expression. For example:

    {% if messages|length >= 100 %}
       You have lots of messages today!
    {% endif %}

Complex expressions
------

All of the above can be combined to form complex expressions. For such
expressions, it can be important to know how the operators are grouped when the
expression is evaluated - that is, the precedence rules.  The precedence of the
operators, from lowest to highest, is as follows:

* ``or``
* ``and``
* ``not``
* ``in``
* ``==``, ``!=``, ``<``, ``>``, ``<=``, ``>=``

So, for example, the following complex
`if` tag:

    {% if a == b or c == d and e %}

...will be interpreted as:

    (a == b) or ((c == d) and e)

If you need different precedence, you will need to use nested `if` tags.
Sometimes that is better for clarity anyway, for the sake of those who do not
know the precedence rules.