        tests = {
            ### BASIC SYNTAX ################################################

            # Plain text should go through the template parser untouched
            'basic-syntax01': ("something cool", {}, "something cool"),

            # Variables should be replaced with their value in the current
            # context
            'basic-syntax02': ("{{ headline }}", {'headline':'Success'}, "Success"),

            # More than one replacement variable is allowed in a template
            'basic-syntax03': ("{{ first }} --- {{ second }}", {"first" : 1, "second" : 2}, "1 --- 2"),

            # Fail silently when a variable is not found in the current context
            'basic-syntax04': ("as{{ missing }}df", {}, ("asdf","asINVALIDdf")),

            # A variable may not contain more than one word
            'basic-syntax06': ("{{ multi word variable }}", {}, template.TemplateSyntaxError),

            # Raise TemplateSyntaxError for empty variable tags
            'basic-syntax07': ("{{ }}",        {}, template.TemplateSyntaxError),
            'basic-syntax08': ("{{        }}", {}, template.TemplateSyntaxError),

            # Attribute syntax allows a template to call an object's attribute
            'basic-syntax09': ("{{ var.method }}", {"var": SomeClass()}, "SomeClass.method"),

            # Multiple levels of attribute access are allowed
            'basic-syntax10': ("{{ var.otherclass.method }}", {"var": SomeClass()}, "OtherClass.method"),

            # Fail silently when a variable's attribute isn't found
            'basic-syntax11': ("{{ var.blech }}", {"var": SomeClass()}, ("","INVALID")),

            # Raise TemplateSyntaxError when trying to access a variable beginning with an underscore
            'basic-syntax12': ("{{ var.__dict__ }}", {"var": SomeClass()}, template.TemplateSyntaxError),

            # Raise TemplateSyntaxError when trying to access a variable containing an illegal character
            'basic-syntax13': ("{{ va>r }}", {}, template.TemplateSyntaxError),
            'basic-syntax14': ("{{ (var.r) }}", {}, template.TemplateSyntaxError),
            'basic-syntax15': ("{{ sp%am }}", {}, template.TemplateSyntaxError),
            'basic-syntax16': ("{{ eggs! }}", {}, template.TemplateSyntaxError),
            'basic-syntax17': ("{{ moo? }}", {}, template.TemplateSyntaxError),

            # Attribute syntax allows a template to call a dictionary key's value
            'basic-syntax18': ("{{ foo.bar }}", {"foo" : {"bar" : "baz"}}, "baz"),

            # Fail silently when a variable's dictionary key isn't found
            'basic-syntax19': ("{{ foo.spam }}", {"foo" : {"bar" : "baz"}}, ("","INVALID")),

            # Fail silently when accessing a non-simple method
            'basic-syntax20': ("{{ var.method2 }}", {"var": SomeClass()}, ("","INVALID")),

            # Don't get confused when parsing something that is almost, but not
            # quite, a template tag.
            'basic-syntax21': ("a {{ moo %} b", {}, "a {{ moo %} b"),
            'basic-syntax22': ("{{ moo #}", {}, "{{ moo #}"),

            # Will try to treat "moo #} {{ cow" as the variable. Not ideal, but
            # costly to work around, so this triggers an error.
            'basic-syntax23': ("{{ moo #} {{ cow }}", {"cow": "cow"}, template.TemplateSyntaxError),

            # Embedded newlines make it not-a-tag.
            'basic-syntax24': ("{{ moo\n }}", {}, "{{ moo\n }}"),

            # Literal strings are permitted inside variables, mostly for i18n
            # purposes.
            'basic-syntax25': ('{{ "fred" }}', {}, "fred"),
            'basic-syntax26': (r'{{ "\"fred\"" }}', {}, "\"fred\""),
            'basic-syntax27': (r'{{ _("\"fred\"") }}', {}, "\"fred\""),

            # regression test for ticket #12554
            # make sure a silent_variable_failure Exception is supressed
            # on dictionary and attribute lookup
            'basic-syntax28': ("{{ a.b }}", {'a': SilentGetItemClass()}, ('', 'INVALID')),
            'basic-syntax29': ("{{ a.b }}", {'a': SilentAttrClass()}, ('', 'INVALID')),

            # Something that starts like a number but has an extra lookup works as a lookup.
            'basic-syntax30': ("{{ 1.2.3 }}", {"1": {"2": {"3": "d"}}}, "d"),
            'basic-syntax31': ("{{ 1.2.3 }}", {"1": {"2": ("a", "b", "c", "d")}}, "d"),
            'basic-syntax32': ("{{ 1.2.3 }}", {"1": (("x", "x", "x", "x"), ("y", "y", "y", "y"), ("a", "b", "c", "d"))}, "d"),
            'basic-syntax33': ("{{ 1.2.3 }}", {"1": ("xxxx", "yyyy", "abcd")}, "d"),
            'basic-syntax34': ("{{ 1.2.3 }}", {"1": ({"x": "x"}, {"y": "y"}, {"z": "z", "3": "d"})}, "d"),

            # Numbers are numbers even if their digits are in the context.
            'basic-syntax35': ("{{ 1 }}", {"1": "abc"}, "1"),
            'basic-syntax36': ("{{ 1.2 }}", {"1": "abc"}, "1.2"),

            # Call methods in the top level of the context
            'basic-syntax37': ('{{ callable }}', {"callable": lambda: "foo bar"}, "foo bar"),

            # Call methods returned from dictionary lookups
            'basic-syntax38': ('{{ var.callable }}', {"var": {"callable": lambda: "foo bar"}}, "foo bar"),

            'builtins01': ('{{ True }}', {}, "True"),
            'builtins02': ('{{ False }}', {}, "False"),
            'builtins03': ('{{ None }}', {}, "None"),

            # List-index syntax allows a template to access a certain item of a subscriptable object.
            'list-index01': ("{{ var.1 }}", {"var": ["first item", "second item"]}, "second item"),

            # Fail silently when the list index is out of range.
            'list-index02': ("{{ var.5 }}", {"var": ["first item", "second item"]}, ("", "INVALID")),

            # Fail silently when the variable is not a subscriptable object.
            'list-index03': ("{{ var.1 }}", {"var": None}, ("", "INVALID")),

            # Fail silently when variable is a dict without the specified key.
            'list-index04': ("{{ var.1 }}", {"var": {}}, ("", "INVALID")),

            # Dictionary lookup wins out when dict's key is a string.
            'list-index05': ("{{ var.1 }}", {"var": {'1': "hello"}}, "hello"),

            # But list-index lookup wins out when dict's key is an int, which
            # behind the scenes is really a dictionary lookup (for a dict)
            # after converting the key to an int.
            'list-index06': ("{{ var.1 }}", {"var": {1: "hello"}}, "hello"),

            # Dictionary lookup wins out when there is a string and int version of the key.
            'list-index07': ("{{ var.1 }}", {"var": {'1': "hello", 1: "world"}}, "hello"),

            # Basic filter usage
            'filter-syntax01': ("{{ var|upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"),

            # Chained filters
            'filter-syntax02': ("{{ var|upper|lower }}", {"var": "Django is the greatest!"}, "django is the greatest!"),

            # Allow spaces before the filter pipe
            'filter-syntax03': ("{{ var |upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"),

            # Allow spaces after the filter pipe
            'filter-syntax04': ("{{ var| upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"),

            # Raise TemplateSyntaxError for a nonexistent filter
            'filter-syntax05': ("{{ var|does_not_exist }}", {}, template.TemplateSyntaxError),

            # Raise TemplateSyntaxError when trying to access a filter containing an illegal character
            'filter-syntax06': ("{{ var|fil(ter) }}", {}, template.TemplateSyntaxError),

            # Raise TemplateSyntaxError for invalid block tags
            'filter-syntax07': ("{% nothing_to_see_here %}", {}, template.TemplateSyntaxError),

            # Raise TemplateSyntaxError for empty block tags
            'filter-syntax08': ("{% %}", {}, template.TemplateSyntaxError),

            # Chained filters, with an argument to the first one
            'filter-syntax09': ('{{ var|removetags:"b i"|upper|lower }}', {"var": "<b><i>Yes</i></b>"}, "yes"),

            # Literal string as argument is always "safe" from auto-escaping..
            'filter-syntax10': (r'{{ var|default_if_none:" endquote\" hah" }}',
                    {"var": None}, ' endquote" hah'),

            # Variable as argument
            'filter-syntax11': (r'{{ var|default_if_none:var2 }}', {"var": None, "var2": "happy"}, 'happy'),

            # Default argument testing
            'filter-syntax12': (r'{{ var|yesno:"yup,nup,mup" }} {{ var|yesno }}', {"var": True}, 'yup yes'),

            # Fail silently for methods that raise an exception with a
            # "silent_variable_failure" attribute
            'filter-syntax13': (r'1{{ var.method3 }}2', {"var": SomeClass()}, ("12", "1INVALID2")),

            # In methods that raise an exception without a
            # "silent_variable_attribute" set to True, the exception propagates
            'filter-syntax14': (r'1{{ var.method4 }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)),

            # Escaped backslash in argument
            'filter-syntax15': (r'{{ var|default_if_none:"foo\bar" }}', {"var": None}, r'foo\bar'),

            # Escaped backslash using known escape char
            'filter-syntax16': (r'{{ var|default_if_none:"foo\now" }}', {"var": None}, r'foo\now'),

            # Empty strings can be passed as arguments to filters
            'filter-syntax17': (r'{{ var|join:"" }}', {'var': ['a', 'b', 'c']}, 'abc'),

            # Make sure that any unicode strings are converted to bytestrings
            # in the final output.
            'filter-syntax18': (r'{{ var }}', {'var': UTF8Class()}, '\u0160\u0110\u0106\u017d\u0107\u017e\u0161\u0111'),

            # Numbers as filter arguments should work
            'filter-syntax19': ('{{ var|truncatewords:1 }}', {"var": "hello world"}, "hello ..."),

            #filters should accept empty string constants
            'filter-syntax20': ('{{ ""|default_if_none:"was none" }}', {}, ""),

            # Fail silently for non-callable attribute and dict lookups which
            # raise an exception with a "silent_variable_failure" attribute
            'filter-syntax21': (r'1{{ var.silent_fail_key }}2', {"var": SomeClass()}, ("12", "1INVALID2")),
            'filter-syntax22': (r'1{{ var.silent_fail_attribute }}2', {"var": SomeClass()}, ("12", "1INVALID2")),

            # In attribute and dict lookups that raise an unexpected exception
            # without a "silent_variable_attribute" set to True, the exception
            # propagates
            'filter-syntax23': (r'1{{ var.noisy_fail_key }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)),
            'filter-syntax24': (r'1{{ var.noisy_fail_attribute }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)),

            ### COMMENT SYNTAX ########################################################
            'comment-syntax01': ("{# this is hidden #}hello", {}, "hello"),
            'comment-syntax02': ("{# this is hidden #}hello{# foo #}", {}, "hello"),

            # Comments can contain invalid stuff.
            'comment-syntax03': ("foo{#  {% if %}  #}", {}, "foo"),
            'comment-syntax04': ("foo{#  {% endblock %}  #}", {}, "foo"),
            'comment-syntax05': ("foo{#  {% somerandomtag %}  #}", {}, "foo"),
            'comment-syntax06': ("foo{# {% #}", {}, "foo"),
            'comment-syntax07': ("foo{# %} #}", {}, "foo"),
            'comment-syntax08': ("foo{# %} #}bar", {}, "foobar"),
            'comment-syntax09': ("foo{# {{ #}", {}, "foo"),
            'comment-syntax10': ("foo{# }} #}", {}, "foo"),
            'comment-syntax11': ("foo{# { #}", {}, "foo"),
            'comment-syntax12': ("foo{# } #}", {}, "foo"),

            ### COMMENT TAG ###########################################################
            'comment-tag01': ("{% comment %}this is hidden{% endcomment %}hello", {}, "hello"),
            'comment-tag02': ("{% comment %}this is hidden{% endcomment %}hello{% comment %}foo{% endcomment %}", {}, "hello"),

            # Comment tag can contain invalid stuff.
            'comment-tag03': ("foo{% comment %} {% if %} {% endcomment %}", {}, "foo"),
            'comment-tag04': ("foo{% comment %} {% endblock %} {% endcomment %}", {}, "foo"),
            'comment-tag05': ("foo{% comment %} {% somerandomtag %} {% endcomment %}", {}, "foo"),

            ### CYCLE TAG #############################################################
            'cycle01': ('{% cycle a %}', {}, template.TemplateSyntaxError),
            'cycle02': ('{% cycle a,b,c as abc %}{% cycle abc %}', {}, 'ab'),
            'cycle03': ('{% cycle a,b,c as abc %}{% cycle abc %}{% cycle abc %}', {}, 'abc'),
            'cycle04': ('{% cycle a,b,c as abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}', {}, 'abca'),
            'cycle05': ('{% cycle %}', {}, template.TemplateSyntaxError),
            'cycle06': ('{% cycle a %}', {}, template.TemplateSyntaxError),
            'cycle07': ('{% cycle a,b,c as foo %}{% cycle bar %}', {}, template.TemplateSyntaxError),
            'cycle08': ('{% cycle a,b,c as foo %}{% cycle foo %}{{ foo }}{{ foo }}{% cycle foo %}{{ foo }}', {}, 'abbbcc'),
            'cycle09': ("{% for i in test %}{% cycle a,b %}{{ i }},{% endfor %}", {'test': range(5)}, 'a0,b1,a2,b3,a4,'),
            'cycle10': ("{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}", {}, 'ab'),
            'cycle11': ("{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}{% cycle abc %}", {}, 'abc'),
            'cycle12': ("{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}", {}, 'abca'),
            'cycle13': ("{% for i in test %}{% cycle 'a' 'b' %}{{ i }},{% endfor %}", {'test': range(5)}, 'a0,b1,a2,b3,a4,'),
            'cycle14': ("{% cycle one two as foo %}{% cycle foo %}", {'one': '1','two': '2'}, '12'),
            'cycle15': ("{% for i in test %}{% cycle aye bee %}{{ i }},{% endfor %}", {'test': range(5), 'aye': 'a', 'bee': 'b'}, 'a0,b1,a2,b3,a4,'),
            'cycle16': ("{% cycle one|lower two as foo %}{% cycle foo %}", {'one': 'A','two': '2'}, 'a2'),
            'cycle17': ("{% cycle 'a' 'b' 'c' as abc silent %}{% cycle abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}", {}, ""),
            'cycle18': ("{% cycle 'a' 'b' 'c' as foo invalid_flag %}", {}, template.TemplateSyntaxError),
            'cycle19': ("{% cycle 'a' 'b' as silent %}{% cycle silent %}", {}, "ab"),
            'cycle20': ("{% cycle one two as foo %} &amp; {% cycle foo %}", {'one' : 'A & B', 'two' : 'C & D'}, "A & B &amp; C & D"),
            'cycle21': ("{% filter force_escape %}{% cycle one two as foo %} & {% cycle foo %}{% endfilter %}", {'one' : 'A & B', 'two' : 'C & D'}, "A &amp; B &amp; C &amp; D"),
            'cycle22': ("{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{{ x }}{% endfor %}", {'values': [1,2,3,4]}, "1234"),
            'cycle23': ("{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{{ abc }}{{ x }}{% endfor %}", {'values': [1,2,3,4]}, "a1b2c3a4"),
            'included-cycle': ('{{ abc }}', {'abc': 'xxx'}, 'xxx'),
            'cycle24': ("{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{% include 'included-cycle' %}{% endfor %}", {'values': [1,2,3,4]}, "abca"),

            ### EXCEPTIONS ############################################################

            # Raise exception for invalid template name
            'exception01': ("{% extends 'nonexistent' %}", {}, (template.TemplateDoesNotExist, template.TemplateDoesNotExist)),

            # Raise exception for invalid template name (in variable)
            'exception02': ("{% extends nonexistent %}", {}, (template.TemplateSyntaxError, template.TemplateDoesNotExist)),

            # Raise exception for extra {% extends %} tags
            'exception03': ("{% extends 'inheritance01' %}{% block first %}2{% endblock %}{% extends 'inheritance16' %}", {}, template.TemplateSyntaxError),

            # Raise exception for custom tags used in child with {% load %} tag in parent, not in child
            'exception04': ("{% extends 'inheritance17' %}{% block first %}{% echo 400 %}5678{% endblock %}", {}, template.TemplateSyntaxError),

            ### FILTER TAG ############################################################
            'filter01': ('{% filter upper %}{% endfilter %}', {}, ''),
            'filter02': ('{% filter upper %}django{% endfilter %}', {}, 'DJANGO'),
            'filter03': ('{% filter upper|lower %}django{% endfilter %}', {}, 'django'),
            'filter04': ('{% filter cut:remove %}djangospam{% endfilter %}', {'remove': 'spam'}, 'django'),

            ### FIRSTOF TAG ###########################################################
            'firstof01': ('{% firstof a b c %}', {'a':0,'b':0,'c':0}, ''),
            'firstof02': ('{% firstof a b c %}', {'a':1,'b':0,'c':0}, '1'),
            'firstof03': ('{% firstof a b c %}', {'a':0,'b':2,'c':0}, '2'),
            'firstof04': ('{% firstof a b c %}', {'a':0,'b':0,'c':3}, '3'),
            'firstof05': ('{% firstof a b c %}', {'a':1,'b':2,'c':3}, '1'),
            'firstof06': ('{% firstof a b c %}', {'b':0,'c':3}, '3'),
            'firstof07': ('{% firstof a b "c" %}', {'a':0}, 'c'),
            'firstof08': ('{% firstof a b "c and d" %}', {'a':0,'b':0}, 'c and d'),
            'firstof09': ('{% firstof %}', {}, template.TemplateSyntaxError),
            'firstof10': ('{% firstof a %}', {'a': '<'}, '<'), # Variables are NOT auto-escaped.

            ### FOR TAG ###############################################################
            'for-tag01': ("{% for val in values %}{{ val }}{% endfor %}", {"values": [1, 2, 3]}, "123"),
            'for-tag02': ("{% for val in values reversed %}{{ val }}{% endfor %}", {"values": [1, 2, 3]}, "321"),
            'for-tag-vars01': ("{% for val in values %}{{ forloop.counter }}{% endfor %}", {"values": [6, 6, 6]}, "123"),
            'for-tag-vars02': ("{% for val in values %}{{ forloop.counter0 }}{% endfor %}", {"values": [6, 6, 6]}, "012"),
            'for-tag-vars03': ("{% for val in values %}{{ forloop.revcounter }}{% endfor %}", {"values": [6, 6, 6]}, "321"),
            'for-tag-vars04': ("{% for val in values %}{{ forloop.revcounter0 }}{% endfor %}", {"values": [6, 6, 6]}, "210"),
            'for-tag-vars05': ("{% for val in values %}{% if forloop.first %}f{% else %}x{% endif %}{% endfor %}", {"values": [6, 6, 6]}, "fxx"),
            'for-tag-vars06': ("{% for val in values %}{% if forloop.last %}l{% else %}x{% endif %}{% endfor %}", {"values": [6, 6, 6]}, "xxl"),
            'for-tag-unpack01': ("{% for key,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, "one:1/two:2/"),
            'for-tag-unpack03': ("{% for key, value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, "one:1/two:2/"),
            'for-tag-unpack04': ("{% for key , value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, "one:1/two:2/"),
            'for-tag-unpack05': ("{% for key ,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, "one:1/two:2/"),
            'for-tag-unpack06': ("{% for key value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, template.TemplateSyntaxError),
            'for-tag-unpack07': ("{% for key,,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, template.TemplateSyntaxError),
            'for-tag-unpack08': ("{% for key,value, in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, template.TemplateSyntaxError),
            # Ensure that a single loopvar doesn't truncate the list in val.
            'for-tag-unpack09': ("{% for val in items %}{{ val.0 }}:{{ val.1 }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, "one:1/two:2/"),
            # Otherwise, silently truncate if the length of loopvars differs to the length of each set of items.
            'for-tag-unpack10': ("{% for x,y in items %}{{ x }}:{{ y }}/{% endfor %}", {"items": (('one', 1, 'carrot'), ('two', 2, 'orange'))}, "one:1/two:2/"),
            'for-tag-unpack11': ("{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": (('one', 1), ('two', 2))}, ("one:1,/two:2,/", "one:1,INVALID/two:2,INVALID/")),
            'for-tag-unpack12': ("{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": (('one', 1, 'carrot'), ('two', 2))}, ("one:1,carrot/two:2,/", "one:1,carrot/two:2,INVALID/")),
            'for-tag-unpack13': ("{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": (('one', 1, 'carrot'), ('two', 2, 'cheese'))}, ("one:1,carrot/two:2,cheese/", "one:1,carrot/two:2,cheese/")),
            'for-tag-unpack14': ("{% for x,y in items %}{{ x }}:{{ y }}/{% endfor %}", {"items": (1, 2)}, (":/:/", "INVALID:INVALID/INVALID:INVALID/")),
            'for-tag-empty01': ("{% for val in values %}{{ val }}{% empty %}empty text{% endfor %}", {"values": [1, 2, 3]}, "123"),
            'for-tag-empty02': ("{% for val in values %}{{ val }}{% empty %}values array empty{% endfor %}", {"values": []}, "values array empty"),
            'for-tag-empty03': ("{% for val in values %}{{ val }}{% empty %}values array not found{% endfor %}", {}, "values array not found"),

            ### IF TAG ################################################################
            'if-tag01': ("{% if foo %}yes{% else %}no{% endif %}", {"foo": True}, "yes"),
            'if-tag02': ("{% if foo %}yes{% else %}no{% endif %}", {"foo": False}, "no"),
            'if-tag03': ("{% if foo %}yes{% else %}no{% endif %}", {}, "no"),

            'if-tag04': ("{% if foo %}foo{% elif bar %}bar{% endif %}", {'foo': True}, "foo"),
            'if-tag05': ("{% if foo %}foo{% elif bar %}bar{% endif %}", {'bar': True}, "bar"),
            'if-tag06': ("{% if foo %}foo{% elif bar %}bar{% endif %}", {}, ""),
            'if-tag07': ("{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {'foo': True}, "foo"),
            'if-tag08': ("{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {'bar': True}, "bar"),
            'if-tag09': ("{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {}, "nothing"),
            'if-tag10': ("{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'foo': True}, "foo"),
            'if-tag11': ("{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'bar': True}, "bar"),
            'if-tag12': ("{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'baz': True}, "baz"),
            'if-tag13': ("{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {}, "nothing"),

            # Filters
            'if-tag-filter01': ("{% if foo|length == 5 %}yes{% else %}no{% endif %}", {'foo': 'abcde'}, "yes"),
            'if-tag-filter02': ("{% if foo|upper == 'ABC' %}yes{% else %}no{% endif %}", {}, "no"),

            # Equality
            'if-tag-eq01': ("{% if foo == bar %}yes{% else %}no{% endif %}", {}, "yes"),
            'if-tag-eq02': ("{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1}, "no"),
            'if-tag-eq03': ("{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1, 'bar': 1}, "yes"),
            'if-tag-eq04': ("{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1, 'bar': 2}, "no"),
            'if-tag-eq05': ("{% if foo == '' %}yes{% else %}no{% endif %}", {}, "no"),

            # Comparison
            'if-tag-gt-01': ("{% if 2 > 1 %}yes{% else %}no{% endif %}", {}, "yes"),
            'if-tag-gt-02': ("{% if 1 > 1 %}yes{% else %}no{% endif %}", {}, "no"),
            'if-tag-gte-01': ("{% if 1 >= 1 %}yes{% else %}no{% endif %}", {}, "yes"),
            'if-tag-gte-02': ("{% if 1 >= 2 %}yes{% else %}no{% endif %}", {}, "no"),
            'if-tag-lt-01': ("{% if 1 < 2 %}yes{% else %}no{% endif %}", {}, "yes"),
            'if-tag-lt-02': ("{% if 1 < 1 %}yes{% else %}no{% endif %}", {}, "no"),
            'if-tag-lte-01': ("{% if 1 <= 1 %}yes{% else %}no{% endif %}", {}, "yes"),
            'if-tag-lte-02': ("{% if 2 <= 1 %}yes{% else %}no{% endif %}", {}, "no"),

            # Contains
            'if-tag-in-01': ("{% if 1 in x %}yes{% else %}no{% endif %}", {'x':[1]}, "yes"),
            'if-tag-in-02': ("{% if 2 in x %}yes{% else %}no{% endif %}", {'x':[1]}, "no"),
            'if-tag-not-in-01': ("{% if 1 not in x %}yes{% else %}no{% endif %}", {'x':[1]}, "no"),
            'if-tag-not-in-02': ("{% if 2 not in x %}yes{% else %}no{% endif %}", {'x':[1]}, "yes"),

            # AND
            'if-tag-and01': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'yes'),
            'if-tag-and02': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'no'),
            'if-tag-and03': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'no'),
            'if-tag-and04': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'no'),
            'if-tag-and05': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': False}, 'no'),
            'if-tag-and06': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'bar': False}, 'no'),
            'if-tag-and07': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': True}, 'no'),
            'if-tag-and08': ("{% if foo and bar %}yes{% else %}no{% endif %}", {'bar': True}, 'no'),

            # OR
            'if-tag-or01': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'yes'),
            'if-tag-or02': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'yes'),
            'if-tag-or03': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'yes'),
            'if-tag-or04': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'no'),
            'if-tag-or05': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': False}, 'no'),
            'if-tag-or06': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'bar': False}, 'no'),
            'if-tag-or07': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': True}, 'yes'),
            'if-tag-or08': ("{% if foo or bar %}yes{% else %}no{% endif %}", {'bar': True}, 'yes'),

            # multiple ORs
            'if-tag-or09': ("{% if foo or bar or baz %}yes{% else %}no{% endif %}", {'baz': True}, 'yes'),

            # NOT
            'if-tag-not01': ("{% if not foo %}no{% else %}yes{% endif %}", {'foo': True}, 'yes'),
            'if-tag-not02': ("{% if not not foo %}no{% else %}yes{% endif %}", {'foo': True}, 'no'),
            # not03 to not05 removed, now TemplateSyntaxErrors

            'if-tag-not06': ("{% if foo and not bar %}yes{% else %}no{% endif %}", {}, 'no'),
            'if-tag-not07': ("{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'no'),
            'if-tag-not08': ("{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'yes'),
            'if-tag-not09': ("{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'no'),
            'if-tag-not10': ("{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'no'),

            'if-tag-not11': ("{% if not foo and bar %}yes{% else %}no{% endif %}", {}, 'no'),
            'if-tag-not12': ("{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'no'),
            'if-tag-not13': ("{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'no'),
            'if-tag-not14': ("{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'yes'),
            'if-tag-not15': ("{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'no'),

            'if-tag-not16': ("{% if foo or not bar %}yes{% else %}no{% endif %}", {}, 'yes'),
            'if-tag-not17': ("{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'yes'),
            'if-tag-not18': ("{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'yes'),
            'if-tag-not19': ("{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'no'),
            'if-tag-not20': ("{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'yes'),

            'if-tag-not21': ("{% if not foo or bar %}yes{% else %}no{% endif %}", {}, 'yes'),
            'if-tag-not22': ("{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'yes'),
            'if-tag-not23': ("{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'no'),
            'if-tag-not24': ("{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'yes'),
            'if-tag-not25': ("{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'yes'),

            'if-tag-not26': ("{% if not foo and not bar %}yes{% else %}no{% endif %}", {}, 'yes'),
            'if-tag-not27': ("{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'no'),
            'if-tag-not28': ("{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'no'),
            'if-tag-not29': ("{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'no'),
            'if-tag-not30': ("{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'yes'),

            'if-tag-not31': ("{% if not foo or not bar %}yes{% else %}no{% endif %}", {}, 'yes'),
            'if-tag-not32': ("{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': True}, 'no'),
            'if-tag-not33': ("{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': True, 'bar': False}, 'yes'),
            'if-tag-not34': ("{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': True}, 'yes'),
            'if-tag-not35': ("{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': False, 'bar': False}, 'yes'),

            # Various syntax errors
            'if-tag-error01': ("{% if %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error02': ("{% if foo and %}yes{% else %}no{% endif %}", {'foo': True}, template.TemplateSyntaxError),
            'if-tag-error03': ("{% if foo or %}yes{% else %}no{% endif %}", {'foo': True}, template.TemplateSyntaxError),
            'if-tag-error04': ("{% if not foo and %}yes{% else %}no{% endif %}", {'foo': True}, template.TemplateSyntaxError),
            'if-tag-error05': ("{% if not foo or %}yes{% else %}no{% endif %}", {'foo': True}, template.TemplateSyntaxError),
            'if-tag-error06': ("{% if abc def %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error07': ("{% if not %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error08': ("{% if and %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error09': ("{% if or %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error10': ("{% if == %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error11': ("{% if 1 == %}yes{% endif %}", {}, template.TemplateSyntaxError),
            'if-tag-error12': ("{% if a not b %}yes{% endif %}", {}, template.TemplateSyntaxError),

            # If evaluations are shortcircuited where possible
            # If is_bad is invoked, it will raise a ShouldNotExecuteException
            'if-tag-shortcircuit01': ('{% if x.is_true or x.is_bad %}yes{% else %}no{% endif %}', {'x': TestObj()}, "yes"),
            'if-tag-shortcircuit02': ('{% if x.is_false and x.is_bad %}yes{% else %}no{% endif %}', {'x': TestObj()}, "no"),

            # Non-existent args
            'if-tag-badarg01':("{% if x|default_if_none:y %}yes{% endif %}", {}, ''),
            'if-tag-badarg02':("{% if x|default_if_none:y %}yes{% endif %}", {'y': 0}, ''),
            'if-tag-badarg03':("{% if x|default_if_none:y %}yes{% endif %}", {'y': 1}, 'yes'),
            'if-tag-badarg04':("{% if x|default_if_none:y %}yes{% else %}no{% endif %}", {}, 'no'),

            # Additional, more precise parsing tests are in SmartIfTests

            ### IFCHANGED TAG #########################################################
            'ifchanged01': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': (1,2,3)}, '123'),
            'ifchanged02': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': (1,1,3)}, '13'),
            'ifchanged03': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': (1,1,1)}, '1'),
            'ifchanged04': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': (1, 2, 3), 'numx': (2, 2, 2)}, '122232'),
            'ifchanged05': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': (1, 1, 1), 'numx': (1, 2, 3)}, '1123123123'),
            'ifchanged06': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': (1, 1, 1), 'numx': (2, 2, 2)}, '1222'),
            'ifchanged07': ('{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% for y in numy %}{% ifchanged %}{{ y }}{% endifchanged %}{% endfor %}{% endfor %}{% endfor %}', {'num': (1, 1, 1), 'numx': (2, 2, 2), 'numy': (3, 3, 3)}, '1233323332333'),
            'ifchanged08': ('{% for data in datalist %}{% for c,d in data %}{% if c %}{% ifchanged %}{{ d }}{% endifchanged %}{% endif %}{% endfor %}{% endfor %}', {'datalist': [[(1, 'a'), (1, 'a'), (0, 'b'), (1, 'c')], [(0, 'a'), (1, 'c'), (1, 'd'), (1, 'd'), (0, 'e')]]}, 'accd'),

            # Test one parameter given to ifchanged.
            'ifchanged-param01': ('{% for n in num %}{% ifchanged n %}..{% endifchanged %}{{ n }}{% endfor %}', { 'num': (1,2,3) }, '..1..2..3'),
            'ifchanged-param02': ('{% for n in num %}{% for x in numx %}{% ifchanged n %}..{% endifchanged %}{{ x }}{% endfor %}{% endfor %}', { 'num': (1,2,3), 'numx': (5,6,7) }, '..567..567..567'),

            # Test multiple parameters to ifchanged.
            'ifchanged-param03': ('{% for n in num %}{{ n }}{% for x in numx %}{% ifchanged x n %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', { 'num': (1,1,2), 'numx': (5,6,6) }, '156156256'),

            # Test a date+hour like construct, where the hour of the last day
            # is the same but the date had changed, so print the hour anyway.
            'ifchanged-param04': ('{% for d in days %}{% ifchanged %}{{ d.day }}{% endifchanged %}{% for h in d.hours %}{% ifchanged d h %}{{ h }}{% endifchanged %}{% endfor %}{% endfor %}', {'days':[{'day':1, 'hours':[1,2,3]},{'day':2, 'hours':[3]},] }, '112323'),

            # Logically the same as above, just written with explicit
            # ifchanged for the day.
            'ifchanged-param05': ('{% for d in days %}{% ifchanged d.day %}{{ d.day }}{% endifchanged %}{% for h in d.hours %}{% ifchanged d.day h %}{{ h }}{% endifchanged %}{% endfor %}{% endfor %}', {'days':[{'day':1, 'hours':[1,2,3]},{'day':2, 'hours':[3]},] }, '112323'),

            # Test the else clause of ifchanged.
            'ifchanged-else01': ('{% for id in ids %}{{ id }}{% ifchanged id %}-first{% else %}-other{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-first,1-other,2-first,2-other,2-other,3-first,'),

            'ifchanged-else02': ('{% for id in ids %}{{ id }}-{% ifchanged id %}{% cycle red,blue %}{% else %}grey{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-red,1-grey,2-blue,2-grey,2-grey,3-red,'),
            'ifchanged-else03': ('{% for id in ids %}{{ id }}{% ifchanged id %}-{% cycle red,blue %}{% else %}{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-red,1,2-blue,2,2,3-red,'),

            'ifchanged-else04': ('{% for id in ids %}{% ifchanged %}***{{ id }}*{% else %}...{% endifchanged %}{{ forloop.counter }}{% endfor %}', {'ids': [1,1,2,2,2,3,4]}, '***1*1...2***2*3...4...5***3*6***4*7'),

            ### IFEQUAL TAG ###########################################################
            'ifequal01': ("{% ifequal a b %}yes{% endifequal %}", {"a": 1, "b": 2}, ""),
            'ifequal02': ("{% ifequal a b %}yes{% endifequal %}", {"a": 1, "b": 1}, "yes"),
            'ifequal03': ("{% ifequal a b %}yes{% else %}no{% endifequal %}", {"a": 1, "b": 2}, "no"),
            'ifequal04': ("{% ifequal a b %}yes{% else %}no{% endifequal %}", {"a": 1, "b": 1}, "yes"),
            'ifequal05': ("{% ifequal a 'test' %}yes{% else %}no{% endifequal %}", {"a": "test"}, "yes"),
            'ifequal06': ("{% ifequal a 'test' %}yes{% else %}no{% endifequal %}", {"a": "no"}, "no"),
            'ifequal07': ('{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {"a": "test"}, "yes"),
            'ifequal08': ('{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {"a": "no"}, "no"),
            'ifequal09': ('{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {}, "no"),
            'ifequal10': ('{% ifequal a b %}yes{% else %}no{% endifequal %}', {}, "yes"),

            # SMART SPLITTING
            'ifequal-split01': ('{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {}, "no"),
            'ifequal-split02': ('{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {'a': 'foo'}, "no"),
            'ifequal-split03': ('{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {'a': 'test man'}, "yes"),
            'ifequal-split04': ("{% ifequal a 'test man' %}yes{% else %}no{% endifequal %}", {'a': 'test man'}, "yes"),
            'ifequal-split05': ("{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': ''}, "no"),
            'ifequal-split06': ("{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': 'i "love" you'}, "yes"),
            'ifequal-split07': ("{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': 'i love you'}, "no"),
            'ifequal-split08': (r"{% ifequal a 'I\'m happy' %}yes{% else %}no{% endifequal %}", {'a': "I'm happy"}, "yes"),
            'ifequal-split09': (r"{% ifequal a 'slash\man' %}yes{% else %}no{% endifequal %}", {'a': r"slash\man"}, "yes"),
            'ifequal-split10': (r"{% ifequal a 'slash\man' %}yes{% else %}no{% endifequal %}", {'a': r"slashman"}, "no"),

            # NUMERIC RESOLUTION
            'ifequal-numeric01': ('{% ifequal x 5 %}yes{% endifequal %}', {'x': '5'}, ''),
            'ifequal-numeric02': ('{% ifequal x 5 %}yes{% endifequal %}', {'x': 5}, 'yes'),
            'ifequal-numeric03': ('{% ifequal x 5.2 %}yes{% endifequal %}', {'x': 5}, ''),
            'ifequal-numeric04': ('{% ifequal x 5.2 %}yes{% endifequal %}', {'x': 5.2}, 'yes'),
            'ifequal-numeric05': ('{% ifequal x 0.2 %}yes{% endifequal %}', {'x': .2}, 'yes'),
            'ifequal-numeric06': ('{% ifequal x .2 %}yes{% endifequal %}', {'x': .2}, 'yes'),
            'ifequal-numeric07': ('{% ifequal x 2. %}yes{% endifequal %}', {'x': 2}, ''),
            'ifequal-numeric08': ('{% ifequal x "5" %}yes{% endifequal %}', {'x': 5}, ''),
            'ifequal-numeric09': ('{% ifequal x "5" %}yes{% endifequal %}', {'x': '5'}, 'yes'),
            'ifequal-numeric10': ('{% ifequal x -5 %}yes{% endifequal %}', {'x': -5}, 'yes'),
            'ifequal-numeric11': ('{% ifequal x -5.2 %}yes{% endifequal %}', {'x': -5.2}, 'yes'),
            'ifequal-numeric12': ('{% ifequal x +5 %}yes{% endifequal %}', {'x': 5}, 'yes'),

            # FILTER EXPRESSIONS AS ARGUMENTS
            'ifequal-filter01': ('{% ifequal a|upper "A" %}x{% endifequal %}', {'a': 'a'}, 'x'),
            'ifequal-filter02': ('{% ifequal "A" a|upper %}x{% endifequal %}', {'a': 'a'}, 'x'),
            'ifequal-filter03': ('{% ifequal a|upper b|upper %}x{% endifequal %}', {'a': 'x', 'b': 'X'}, 'x'),
            'ifequal-filter04': ('{% ifequal x|slice:"1" "a" %}x{% endifequal %}', {'x': 'aaa'}, 'x'),
            'ifequal-filter05': ('{% ifequal x|slice:"1"|upper "A" %}x{% endifequal %}', {'x': 'aaa'}, 'x'),

            ### IFNOTEQUAL TAG ########################################################
            'ifnotequal01': ("{% ifnotequal a b %}yes{% endifnotequal %}", {"a": 1, "b": 2}, "yes"),
            'ifnotequal02': ("{% ifnotequal a b %}yes{% endifnotequal %}", {"a": 1, "b": 1}, ""),
            'ifnotequal03': ("{% ifnotequal a b %}yes{% else %}no{% endifnotequal %}", {"a": 1, "b": 2}, "yes"),
            'ifnotequal04': ("{% ifnotequal a b %}yes{% else %}no{% endifnotequal %}", {"a": 1, "b": 1}, "no"),

            ## INCLUDE TAG ###########################################################
            'include01': ('{% include "basic-syntax01" %}', {}, "something cool"),
            'include02': ('{% include "basic-syntax02" %}', {'headline': 'Included'}, "Included"),
            'include03': ('{% include template_name %}', {'template_name': 'basic-syntax02', 'headline': 'Included'}, "Included"),
            'include04': ('a{% include "nonexistent" %}b', {}, ("ab", "ab", template.TemplateDoesNotExist)),
            'include 05': ('template with a space', {}, 'template with a space'),
            'include06': ('{% include "include 05"%}', {}, 'template with a space'),

            # extra inline context
            'include07': ('{% include "basic-syntax02" with headline="Inline" %}', {'headline': 'Included'}, 'Inline'),
            'include08': ('{% include headline with headline="Dynamic" %}', {'headline': 'basic-syntax02'}, 'Dynamic'),
            'include09': ('{{ first }}--{% include "basic-syntax03" with first=second|lower|upper second=first|upper %}--{{ second }}', {'first': 'Ul', 'second': 'lU'}, 'Ul--LU --- UL--lU'),

            # isolated context
            'include10': ('{% include "basic-syntax03" only %}', {'first': '1'}, (' --- ', 'INVALID --- INVALID')),
            'include11': ('{% include "basic-syntax03" only with second=2 %}', {'first': '1'}, (' --- 2', 'INVALID --- 2')),
            'include12': ('{% include "basic-syntax03" with first=1 only %}', {'second': '2'}, ('1 --- ', '1 --- INVALID')),

            # autoescape context
            'include13': ('{% autoescape off %}{% include "basic-syntax03" %}{% endautoescape %}', {'first': '&'}, ('& --- ', '& --- INVALID')),
            'include14': ('{% autoescape off %}{% include "basic-syntax03" with first=var1 only %}{% endautoescape %}', {'var1': '&'}, ('& --- ', '& --- INVALID')),

            'include-error01': ('{% include "basic-syntax01" with %}', {}, template.TemplateSyntaxError),
            'include-error02': ('{% include "basic-syntax01" with "no key" %}', {}, template.TemplateSyntaxError),
            'include-error03': ('{% include "basic-syntax01" with dotted.arg="error" %}', {}, template.TemplateSyntaxError),
            'include-error04': ('{% include "basic-syntax01" something_random %}', {}, template.TemplateSyntaxError),
            'include-error05': ('{% include "basic-syntax01" foo="duplicate" foo="key" %}', {}, template.TemplateSyntaxError),
            'include-error06': ('{% include "basic-syntax01" only only %}', {}, template.TemplateSyntaxError),

            ### INCLUSION ERROR REPORTING #############################################
            'include-fail1': ('{% load bad_tag %}{% badtag %}', {}, RuntimeError),
            'include-fail2': ('{% load broken_tag %}', {}, template.TemplateSyntaxError),
            'include-error07': ('{% include "include-fail1" %}', {}, ('', '', RuntimeError)),
            'include-error08': ('{% include "include-fail2" %}', {}, ('', '', template.TemplateSyntaxError)),
            'include-error09': ('{% include failed_include %}', {'failed_include': 'include-fail1'}, ('', '', RuntimeError)),
            'include-error10': ('{% include failed_include %}', {'failed_include': 'include-fail2'}, ('', '', template.TemplateSyntaxError)),


            ### NAMED ENDBLOCKS #######################################################

            # Basic test
            'namedendblocks01': ("1{% block first %}_{% block second %}2{% endblock second %}_{% endblock first %}3", {}, '1_2_3'),

            # Unbalanced blocks
            'namedendblocks02': ("1{% block first %}_{% block second %}2{% endblock first %}_{% endblock second %}3", {}, template.TemplateSyntaxError),
            'namedendblocks03': ("1{% block first %}_{% block second %}2{% endblock %}_{% endblock second %}3", {}, template.TemplateSyntaxError),
            'namedendblocks04': ("1{% block first %}_{% block second %}2{% endblock second %}_{% endblock third %}3", {}, template.TemplateSyntaxError),
            'namedendblocks05': ("1{% block first %}_{% block second %}2{% endblock first %}", {}, template.TemplateSyntaxError),

            # Mixed named and unnamed endblocks
            'namedendblocks06': ("1{% block first %}_{% block second %}2{% endblock %}_{% endblock first %}3", {}, '1_2_3'),
            'namedendblocks07': ("1{% block first %}_{% block second %}2{% endblock second %}_{% endblock %}3", {}, '1_2_3'),

            ### INHERITANCE ###########################################################

            # Standard template with no inheritance
            'inheritance01': ("1{% block first %}&{% endblock %}3{% block second %}_{% endblock %}", {}, '1&3_'),

            # Standard two-level inheritance
            'inheritance02': ("{% extends 'inheritance01' %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {}, '1234'),

            # Three-level with no redefinitions on third level
            'inheritance03': ("{% extends 'inheritance02' %}", {}, '1234'),

            # Two-level with no redefinitions on second level
            'inheritance04': ("{% extends 'inheritance01' %}", {}, '1&3_'),

            # Two-level with double quotes instead of single quotes
            'inheritance05': ('{% extends "inheritance02" %}', {}, '1234'),

            # Three-level with variable parent-template name
            'inheritance06': ("{% extends foo %}", {'foo': 'inheritance02'}, '1234'),

            # Two-level with one block defined, one block not defined
            'inheritance07': ("{% extends 'inheritance01' %}{% block second %}5{% endblock %}", {}, '1&35'),

            # Three-level with one block defined on this level, two blocks defined next level
            'inheritance08': ("{% extends 'inheritance02' %}{% block second %}5{% endblock %}", {}, '1235'),

            # Three-level with second and third levels blank
            'inheritance09': ("{% extends 'inheritance04' %}", {}, '1&3_'),

            # Three-level with space NOT in a block -- should be ignored
            'inheritance10': ("{% extends 'inheritance04' %}      ", {}, '1&3_'),

            # Three-level with both blocks defined on this level, but none on second level
            'inheritance11': ("{% extends 'inheritance04' %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {}, '1234'),

            # Three-level with this level providing one and second level providing the other
            'inheritance12': ("{% extends 'inheritance07' %}{% block first %}2{% endblock %}", {}, '1235'),

            # Three-level with this level overriding second level
            'inheritance13': ("{% extends 'inheritance02' %}{% block first %}a{% endblock %}{% block second %}b{% endblock %}", {}, '1a3b'),

            # A block defined only in a child template shouldn't be displayed
            'inheritance14': ("{% extends 'inheritance01' %}{% block newblock %}NO DISPLAY{% endblock %}", {}, '1&3_'),

            # A block within another block
            'inheritance15': ("{% extends 'inheritance01' %}{% block first %}2{% block inner %}inner{% endblock %}{% endblock %}", {}, '12inner3_'),

            # A block within another block (level 2)
            'inheritance16': ("{% extends 'inheritance15' %}{% block inner %}out{% endblock %}", {}, '12out3_'),

            # {% load %} tag (parent -- setup for exception04)
            'inheritance17': ("{% load testtags %}{% block first %}1234{% endblock %}", {}, '1234'),

            # {% load %} tag (standard usage, without inheritance)
            'inheritance18': ("{% load testtags %}{% echo this that theother %}5678", {}, 'this that theother5678'),

            # {% load %} tag (within a child template)
            'inheritance19': ("{% extends 'inheritance01' %}{% block first %}{% load testtags %}{% echo 400 %}5678{% endblock %}", {}, '140056783_'),

            # Two-level inheritance with {{ block.super }}
            'inheritance20': ("{% extends 'inheritance01' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '1&a3_'),

            # Three-level inheritance with {{ block.super }} from parent
            'inheritance21': ("{% extends 'inheritance02' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '12a34'),

            # Three-level inheritance with {{ block.super }} from grandparent
            'inheritance22': ("{% extends 'inheritance04' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '1&a3_'),

            # Three-level inheritance with {{ block.super }} from parent and grandparent
            'inheritance23': ("{% extends 'inheritance20' %}{% block first %}{{ block.super }}b{% endblock %}", {}, '1&ab3_'),

            # Inheritance from local context without use of template loader
            'inheritance24': ("{% extends context_template %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {'context_template': template.Template("1{% block first %}_{% endblock %}3{% block second %}_{% endblock %}")}, '1234'),

            # Inheritance from local context with variable parent template
            'inheritance25': ("{% extends context_template.1 %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {'context_template': [template.Template("Wrong"), template.Template("1{% block first %}_{% endblock %}3{% block second %}_{% endblock %}")]}, '1234'),

            # Set up a base template to extend
            'inheritance26': ("no tags", {}, 'no tags'),

            # Inheritance from a template that doesn't have any blocks
            'inheritance27': ("{% extends 'inheritance26' %}", {}, 'no tags'),

            # Set up a base template with a space in it.
            'inheritance 28': ("{% block first %}!{% endblock %}", {}, '!'),

            # Inheritance from a template with a space in its name should work.
            'inheritance29': ("{% extends 'inheritance 28' %}", {}, '!'),

            # Base template, putting block in a conditional {% if %} tag
            'inheritance30': ("1{% if optional %}{% block opt %}2{% endblock %}{% endif %}3", {'optional': True}, '123'),

            # Inherit from a template with block wrapped in an {% if %} tag (in parent), still gets overridden
            'inheritance31': ("{% extends 'inheritance30' %}{% block opt %}two{% endblock %}", {'optional': True}, '1two3'),
            'inheritance32': ("{% extends 'inheritance30' %}{% block opt %}two{% endblock %}", {}, '13'),

            # Base template, putting block in a conditional {% ifequal %} tag
            'inheritance33': ("1{% ifequal optional 1 %}{% block opt %}2{% endblock %}{% endifequal %}3", {'optional': 1}, '123'),

            # Inherit from a template with block wrapped in an {% ifequal %} tag (in parent), still gets overridden
            'inheritance34': ("{% extends 'inheritance33' %}{% block opt %}two{% endblock %}", {'optional': 1}, '1two3'),
            'inheritance35': ("{% extends 'inheritance33' %}{% block opt %}two{% endblock %}", {'optional': 2}, '13'),

            # Base template, putting block in a {% for %} tag
            'inheritance36': ("{% for n in numbers %}_{% block opt %}{{ n }}{% endblock %}{% endfor %}_", {'numbers': '123'}, '_1_2_3_'),

            # Inherit from a template with block wrapped in an {% for %} tag (in parent), still gets overridden
            'inheritance37': ("{% extends 'inheritance36' %}{% block opt %}X{% endblock %}", {'numbers': '123'}, '_X_X_X_'),
            'inheritance38': ("{% extends 'inheritance36' %}{% block opt %}X{% endblock %}", {}, '_'),

            # The super block will still be found.
            'inheritance39': ("{% extends 'inheritance30' %}{% block opt %}new{{ block.super }}{% endblock %}", {'optional': True}, '1new23'),
            'inheritance40': ("{% extends 'inheritance33' %}{% block opt %}new{{ block.super }}{% endblock %}", {'optional': 1}, '1new23'),
            'inheritance41': ("{% extends 'inheritance36' %}{% block opt %}new{{ block.super }}{% endblock %}", {'numbers': '123'}, '_new1_new2_new3_'),

            # Expression starting and ending with a quote
            'inheritance42': ("{% extends 'inheritance02'|cut:' ' %}", {}, '1234'),

            ### LOADING TAG LIBRARIES #################################################
            'load01': ("{% load testtags subpackage.echo %}{% echo test %} {% echo2 \"test\" %}", {}, "test test"),
            'load02': ("{% load subpackage.echo %}{% echo2 \"test\" %}", {}, "test"),

            # {% load %} tag, importing individual tags
            'load03': ("{% load echo from testtags %}{% echo this that theother %}", {}, 'this that theother'),
            'load04': ("{% load echo other_echo from testtags %}{% echo this that theother %} {% other_echo and another thing %}", {}, 'this that theother and another thing'),
            'load05': ("{% load echo upper from testtags %}{% echo this that theother %} {{ statement|upper }}", {'statement': 'not shouting'}, 'this that theother NOT SHOUTING'),
            'load06': ("{% load echo2 from subpackage.echo %}{% echo2 \"test\" %}", {}, "test"),

            # {% load %} tag errors
            'load07': ("{% load echo other_echo bad_tag from testtags %}", {}, template.TemplateSyntaxError),
            'load08': ("{% load echo other_echo bad_tag from %}", {}, template.TemplateSyntaxError),
            'load09': ("{% load from testtags %}", {}, template.TemplateSyntaxError),
            'load10': ("{% load echo from bad_library %}", {}, template.TemplateSyntaxError),
            'load11': ("{% load subpackage.echo_invalid %}", {}, template.TemplateSyntaxError),
            'load12': ("{% load subpackage.missing %}", {}, template.TemplateSyntaxError),
