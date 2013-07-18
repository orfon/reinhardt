var assert = require("assert");

var {Template} = require('../lib/template');
var {Context} = require('../lib/context');
var {markSafe} = require('../lib/utils');
var {Environment} = require('../lib/environment');
/**
 * Utility classes
 */

var OtherClass = function() {
      this.method = function() {
            return "OtherClass.method";
      }
      return this;
}

var SomeClass = function() {

      this.method = function() {
            return "SomeClass.method";
      }
      this.method2 = function(o) {
            return o;
      }
      this.method4 = function() {
            throw new Error('some');
      }
      this.otherclass = new OtherClass();
      return this;
}

var TestObj = function() {
      this.is_true = function() {
            return true;
      }
      this.is_false = function() {
            return false;
      }
      this.is_bad = function() {
            throw new Error();
      }
      return this;
}

exports.testBasic = function() {

      // register fake template loader for `include` testing later on
      var TestTemplateLoader = function() {
            this.loadTemplateSource = function(templateName) {
                  if (tests[templateName]) {
                        return [tests[templateName][0], templateName];
                  }
                  return null;
            }
            return this;
      }

      // 'template_name': ('template contents', 'context dict', 'expected string output' or Exception class)
      var tests = {
            //BASIC SYNTAX ################################################

            //Plain text should go through the template parser untouched
            'basic-syntax01': ["something cool", {}, "something cool"],

            //Variables should be replaced with their value in the current
            //context
            'basic-syntax02': ["{{ headline }}", {'headline':'Success'}, "Success"],

            //More than one replacement variable is allowed in a template
            'basic-syntax03': ["{{ first }} --- {{ second }}", {"first" : 1, "second" : 2}, "1 --- 2"],

            //Fail silently when a variable is not found in the current context
            'basic-syntax04': ["as{{ missing }}df", {}, ("asdf","asINVALIDdf")],

            //A variable may not contain more than one word
            'basic-syntax06': ["{{ multi word variable }}", {}, Error],

            //Raise TemplateSyntaxError for empty variable tags
            'basic-syntax07': ["{{ }}",        {}, Error],
            'basic-syntax08': ["{{        }}", {}, Error],

            //Attribute syntax allows a template to call an object's attribute
            'basic-syntax09': ["{{ var.method }}", {"var": new SomeClass()}, "SomeClass.method"],

            //Multiple levels of attribute access are allowed
            'basic-syntax10': ["{{ var.otherclass.method }}", {"var": new SomeClass()}, "OtherClass.method"],

            //Fail silently when a variable's attribute isn't found
            'basic-syntax11': ["{{ var.blech }}", {"var": new SomeClass()}, "INVALID"],

            //Raise TemplateSyntaxError when trying to access a variable beginning with an underscore
            // FIXME i don't do that
            // basic-syntax12': ["{{ var.__dict__ }}", {"var": SomeClass()}, Error],

            //Raise TemplateSyntaxError when trying to access a variable containing an illegal character
            'basic-syntax13': ["{{ va>r }}", {}, Error],
            'basic-syntax14': ["{{ (var.r) }}", {}, Error],
            'basic-syntax15': ["{{ sp%am }}", {}, Error],
            'basic-syntax16': ["{{ eggs! }}", {}, Error],
            'basic-syntax17': ["{{ moo? }}", {}, Error],

            //Attribute syntax allows a template to call a dictionary key's value
            'basic-syntax18': ["{{ foo.bar }}", {"foo" : {"bar" : "baz"}}, "baz"],

            //Fail silently when a variable's dictionary key isn't found
            'basic-syntax19': ["{{ foo.spam }}", {"foo" : {"bar" : "baz"}}, "INVALID"],

            //Fail silently when accessing a non-simple method
            // FIXME what?
            // 'basic-syntax20': ["{{ var.method2 }}", {"var": new SomeClass()}, "INVALID"],

            //Don't get confused when parsing something that is almost, but not
            //quite, a template tag.
            'basic-syntax21': ["a {{ moo %} b", {}, "a {{ moo %} b"],
            'basic-syntax22': ["{{ moo #}", {}, "{{ moo #}"],

            //Will try to treat "moo #} {{ cow" as the variable. Not ideal, but
            //costly to work around, so this triggers an error.
            'basic-syntax23': ["{{ moo #} {{ cow }}", {"cow": "cow"}, Error],

            //Embedded newlines make it not-a-tag.
            'basic-syntax24': ["{{ moo\n }}", {}, "{{ moo\n }}"],

            //Literal strings are permitted inside variables, mostly for i18n
            //purposes.
            'basic-syntax25': ['{{ "fred" }}', {}, "fred"],
            // FIXME nope i don't support that
            // basic-syntax26': ['{{ "\"fred\"" }}', {}, "\"fred\""],
            // 'basic-syntax27': ['{{ _("\"fred\"") }}', {}, "\"fred\""],

            //regression test for ticket #12554
            //make sure a silent_variable_failure Exception is supressed
            //on dictionary and attribute lookup
            //'basic-syntax28': ["{{ a.b }}", {'a': SilentGetItemClass()}, ('', 'INVALID')],
            //'basic-syntax29': ["{{ a.b }}", {'a': SilentAttrClass()}, ('', 'INVALID')],

            //Something that starts like a number but has an extra lookup works as a lookup.
            // FIXME nope
            /*
            'basic-syntax30': ["{{ 1.2.3 }}", {"1": {"2": {"3": "d"}}}, "d"],
            'basic-syntax31': ["{{ 1.2.3 }}", {"1": {"2": ["a", "b", "c", "d"]}}, "d"],
            'basic-syntax32': ["{{ 1.2.3 }}", {"1": [["x", "x", "x", "x"], ["y", "y", "y", "y"], ["a", "b", "c", "d"]]}, "d"],
            'basic-syntax33': ["{{ 1.2.3 }}", {"1": ["xxxx", "yyyy", "abcd"]}, "d"],
            'basic-syntax34': ["{{ 1.2.3 }}", {"1": [{"x": "x"}, {"y": "y"}, {"z": "z", "3": "d"}]}, "d"],
            */

            //Numbers are numbers even if their digits are in the context.
            'basic-syntax35': ["{{ 1 }}", {"1": "abc"}, "1"],
            'basic-syntax36': ["{{ 1.2 }}", {"1": "abc"}, "1.2"],

            //Call methods in the top level of the context
            'basic-syntax37': ['{{ callable }}', {"callable": function() { return "foo bar";}}, "foo bar"],

            //Call methods returned from dictionary lookups
            'basic-syntax38': ['{{ var.callable }}', {"var": {"callable": function() { return "foo bar"}}}, "foo bar"],

            // BUILT INS
            'builtins01': ['{{ true }}', {}, "true"],
            'builtins02': ['{{ false }}', {}, "false"],
            'builtins03': ['{{ null }}', {}, "null"],

            //////// ################ list index
            //List-index syntax allows a template to access a certain item of a subscriptable object.
            'list-index01': ["{{ var.1 }}", {"var": ["first item", "second item"]}, "second item"],

            //Fail silently when the list index is out of range.
            'list-index02': ["{{ var.5 }}", {"var": ["first item", "second item"]}, ("", "INVALID")],

            //Fail silently when the variable is not a subscriptable object.
            'list-index03': ["{{ var.1 }}", {"var": undefined}, "INVALID"],

            //Fail silently when variable is a dict without the specified key.
            'list-index04': ["{{ var.1 }}", {"var": {}}, "INVALID"],

            //Dictionary lookup wins out when dict's key is a string.
            'list-index05': ["{{ var.1 }}", {"var": {'1': "hello"}}, "hello"],

            //But list-index lookup wins out when dict's key is an int, which
            //behind the scenes is really a dictionary lookup (for a dict)
            //after converting the key to an int.
            'list-index06': ["{{ var.1 }}", {"var": {1: "hello"}}, "hello"],

            // WONTFIX in JS the key is always also tried as a string
            //Dictionary lookup wins out when there is a string and int version of the key.
            'list-index07': ["{{ var.1 }}", {"var": {'1': "hello", 1: "world"}}, "world"],

            //COMMENT SYNTAX ########################################################
/*
            FIXME where is this documented?
            'comment-syntax01': ["{//this is hidden #}hello", {}, "hello"],
            'comment-syntax02': ["{//this is hidden #}hello{//foo #}", {}, "hello"],

            //Comments can contain invalid stuff.
            'comment-syntax03': ["foo{// {% if %}  #}", {}, "foo"],
            'comment-syntax04': ["foo{// {% endblock %}  #}", {}, "foo"],
            'comment-syntax05': ["foo{// {% somerandomtag %}  #}", {}, "foo"],
            'comment-syntax06': ["foo{//{% #}", {}, "foo"],
            'comment-syntax07': ["foo{//%} #}", {}, "foo"],
            'comment-syntax08': ["foo{//%} #}bar", {}, "foobar"],
            'comment-syntax09': ["foo{//{{ #}", {}, "foo"],
            'comment-syntax10': ["foo{//}} #}", {}, "foo"],
            'comment-syntax11': ["foo{//{ #}", {}, "foo"],
            'comment-syntax12': ["foo{//} #}", {}, "foo"],
*/
            //COMMENT TAG ###########################################################
            'comment-tag01': ["{% comment %}this is hidden{% endcomment %}hello", {}, "hello"],
            'comment-tag02': ["{% comment %}this is hidden{% endcomment %}hello{% comment %}foo{% endcomment %}", {}, "hello"],

            //Comment tag can contain invalid stuff.
            'comment-tag03': ["foo{% comment %} {% if %} {% endcomment %}", {}, "foo"],
            'comment-tag04': ["foo{% comment %} {% endblock %} {% endcomment %}", {}, "foo"],
            'comment-tag05': ["foo{% comment %} {% somerandomtag %} {% endcomment %}", {}, "foo"],

            //FOR TAG ###########################################################
            'for-tag01': ["{% for val in values %}{{ val }}{% endfor %}", {"values": [1, 2, 3]}, "123"],
            'for-tag02': ["{% for val in values reversed %}{{ val }}{% endfor %}", {"values": [1, 2, 3]}, "321"],
            'for-tag-vars01': ["{% for val in values %}{{ forloop.counter }}{% endfor %}", {"values": [6, 6, 6]}, "123"],
            'for-tag-vars02': ["{% for val in values %}{{ forloop.counter0 }}{% endfor %}", {"values": [6, 6, 6]}, "012"],
            'for-tag-vars03': ["{% for val in values %}{{ forloop.revcounter }}{% endfor %}", {"values": [6, 6, 6]}, "321"],
            'for-tag-vars04': ["{% for val in values %}{{ forloop.revcounter0 }}{% endfor %}", {"values": [6, 6, 6]}, "210"],
            'for-tag-vars05': ["{% for val in values %}{% if forloop.first %}f{% else %}x{% endif %}{% endfor %}", {"values": [6, 6, 6]}, "fxx"],
            'for-tag-vars06': ["{% for val in values %}{% if forloop.last %}l{% else %}x{% endif %}{% endfor %}", {"values": [6, 6, 6]}, "xxl"],
            'for-tag-unpack01': ["{% for key,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1/two:2/"],
            'for-tag-unpack03': ["{% for key, value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1/two:2/"],
            'for-tag-unpack04': ["{% for key , value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1/two:2/"],
            'for-tag-unpack05': ["{% for key ,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1/two:2/"],
            'for-tag-unpack06': ["{% for key value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, Error],
            'for-tag-unpack07': ["{% for key,,value in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, Error],
            'for-tag-unpack08': ["{% for key,value, in items %}{{ key }}:{{ value }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, Error],
            //Ensure that a single loopvar doesn't truncate the list in val.
            'for-tag-unpack09': ["{% for val in items %}{{ val.0 }}:{{ val.1 }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1/two:2/"],
            //Otherwise, silently truncate if the length of loopvars differs to the length of each set of items.
            'for-tag-unpack10': ["{% for x,y in items %}{{ x }}:{{ y }}/{% endfor %}", {"items": [['one', 1, 'carrot'], ['two', 2, 'orange']]}, "one:1/two:2/"],
            'for-tag-unpack11': ["{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": [['one', 1], ['two', 2]]}, "one:1,INVALID/two:2,INVALID/"],
            'for-tag-unpack12': ["{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": [['one', 1, 'carrot'], ['two', 2]]}, "one:1,carrot/two:2,INVALID/"],
            'for-tag-unpack13': ["{% for x,y,z in items %}{{ x }}:{{ y }},{{ z }}/{% endfor %}", {"items": [['one', 1, 'carrot'], ['two', 2, 'cheese']]}, "one:1,carrot/two:2,cheese/"],
            'for-tag-unpack14': ["{% for x,y in items %}{{ x }}:{{ y }}/{% endfor %}", {"items": [1, 2]}, "INVALID:INVALID/INVALID:INVALID/"],
            'for-tag-empty01': ["{% for val in values %}{{ val }}{% empty %}empty text{% endfor %}", {"values": [1, 2, 3]}, "123"],
            'for-tag-empty02': ["{% for val in values %}{{ val }}{% empty %}values array empty{% endfor %}", {"values": []}, "values array empty"],
            'for-tag-empty03': ["{% for val in values %}{{ val }}{% empty %}values array not found{% endfor %}", {}, "values array not found"],
            // bug #5
            //'for-tag-filter-ws': ["{% for x in ''|add:'a b c' %}{{ x }}{% endfor %}", {}, 'a b c'],

            //FILTERS ###########################################################

            //Basic filter usage
            'filter-syntax01': ["{{ var|upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"],

            //Chained filters
            'filter-syntax02': ["{{ var|upper|lower }}", {"var": "Django is the greatest!"}, "django is the greatest!"],

            //Allow spaces before the filter pipe
            'filter-syntax03': ["{{ var |upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"],

            //Allow spaces after the filter pipe
            'filter-syntax04': ["{{ var| upper }}", {"var": "Django is the greatest!"}, "DJANGO IS THE GREATEST!"],

            //Raise TemplateSyntaxError for a nonexistent filter
            'filter-syntax05': ["{{ var|does_not_exist }}", {}, Error],

            //Raise TemplateSyntaxError when trying to access a filter containing an illegal character
            'filter-syntax06': ["{{ var|fil(ter) }}", {}, Error],

            //Raise TemplateSyntaxError for invalid block tags
            'filter-syntax07': ["{% nothing_to_see_here %}", {}, Error],

            //Raise TemplateSyntaxError for empty block tags
            'filter-syntax08': ["{% %}", {}, Error],

            //Chained filters, with an argument to the first one
            'filter-syntax09': ['{{ var|removetags:"b i"|upper|lower }}', {"var": "<b><i>Yes</i></b>"}, "yes"],

            //Literal string as argument is always "safe" from auto-escaping..
            // FIXME fix regex
            // 'filter-syntax10': ['{{ var|defaultifnull:" endquote\" hah" }}',
            //        {"var": null}, ' endquote" hah'],

            //Variable as argument
            'filter-syntax11': ['{{ var|defaultifnull:var2 }}', {"var": null, "var2": "happy"}, 'happy'],

            //Default argument testing
            'filter-syntax12': ['{{ var|yesno:"yup,nup,mup" }} {{ var|yesno }}', {"var": true}, 'yup yes'],

            //Fail silently for methods that raise an exception with a
            //"silent_variable_failure" attribute
            'filter-syntax13': ['1{{ var.method3 }}2', {"var": new SomeClass()}, ("12", "1INVALID2")],

            //In methods that raise an exception without a
            //"silent_variable_attribute" set to true, the exception propagates
            // FIXME
            // 'filter-syntax14': ['1{{ var.method4 }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)],

            //Escaped backslash in argument
            // FIXME i don't understand - why should it return 'foo\ba'?
            // filter-syntax15': ['{{ var|defaultifnull:"foo\bar" }}', {"var": null}, 'foo\ba'],

            //Escaped backslash using known escape char
            // FIXME regex doesn't work for this case
            // filter-syntax16': ['{{ var|defaultifnull:"foo\now" }}', {"var": null}, 'foo\now'],

            //Empty strings can be passed as arguments to filters
            // FIXME we always return 'INVALID'
            // filter-syntax17': ['{{ var|join:"" }}', {'va': ['a', 'b', 'c']}, 'abc'],

            //Make sure that any unicode strings are converted to bytestrings
            //in the final output.
            // FIXME
            // 'filter-syntax18': ['{{ var }}', {'va': UTF8Class()}, '\u0160\u0110\u0106\u017d\u0107\u017e\u0161\u0111'],

            //Numbers as filter arguments should work
            'filter-syntax19': ['{{ var|truncatewords:1 }}', {"var": "hello world"}, "hello ..."],

            //filters should accept empty string constants
            'filter-syntax20': ['{{ ""|defaultifnull:"was none" }}', {}, ""],

            'filter-syntax20a': ['{{ emptystring|defaultifnull:"was none" }}', {emptystring: ""}, ""],

            //Fail silently for non-callable attribute and dict lookups which
            //raise an exception with a "silent_variable_failure" attribute
            'filter-syntax21': ['1{{ var.silent_fail_key }}2', {"var": SomeClass()}, ("12", "1INVALID2")],
            'filter-syntax22': ['1{{ var.silent_fail_attribute }}2', {"var": SomeClass()}, ("12", "1INVALID2")],

            //INCLUDE TAG ###########################################################
            'include01': ['{% include "basic-syntax01" %}', {}, "something cool"],
            'include02': ['{% include "basic-syntax02" %}', {'headline': 'Included'}, "Included"],
            'include03': ['{% include template_name %}', {'template_name': 'basic-syntax02', 'headline': 'Included'}, "Included"],
            'include04': ['a{% include "nonexistent" %}b', {}, Error],
            'include 05': ['template with a space', {}, 'template with a space'],
            'include06': ['{% include "include 05"%}', {}, 'template with a space'],

            //extra inline context
            'include07': ['{% include "basic-syntax02" with headline="Inline" %}', {'headline': 'Included'}, 'Inline'],
            'include08': ['{% include headline with headline="Dynamic" %}', {'headline': 'basic-syntax02'}, 'Dynamic'],
            'include09': ['{{ first }}--{% include "basic-syntax03" with first=second|lower|upper second=first|upper %}--{{ second }}', {'first': 'Ul', 'second': 'lU'}, 'Ul--LU --- UL--lU'],

            //isolated context
            'include10': ['{% include "basic-syntax03" only %}', {'first': '1'}, 'INVALID --- INVALID'],
            'include11': ['{% include "basic-syntax03" only with second=2 %}', {'first': '1'}, 'INVALID --- 2'],
            'include12': ['{% include "basic-syntax03" with first=1 only %}', {'second': '2'}, '1 --- INVALID'],

            //autoescape context
            'include13': ['{% autoescape off %}{% include "basic-syntax03" %}{% endautoescape %}', {'first': '&'}, '& --- INVALID'],
            'include14': ['{% autoescape off %}{% include "basic-syntax03" with first=var1 only %}{% endautoescape %}', {'var1': '&'}, '& --- INVALID'],

            'include-error01': ['{% include "basic-syntax01" with %}', {}, Error],
            'include-error02': ['{% include "basic-syntax01" with "no key" %}', {}, Error],
            'include-error03': ['{% include "basic-syntax01" with dotted.arg="error" %}', {}, Error],
            'include-error04': ['{% include "basic-syntax01" something_random %}', {}, Error],
            'include-error05': ['{% include "basic-syntax01" foo="duplicate" foo="key" %}', {}, Error],
            'include-error06': ['{% include "basic-syntax01" only only %}', {}, Error],


            //IFEQUAL TAG ###########################################################
            'ifequal01': ["{% ifequal a b %}yes{% endifequal %}", {"a": 1, "b": 2}, ""],
            'ifequal02': ["{% ifequal a b %}yes{% endifequal %}", {"a": 1, "b": 1}, "yes"],
            'ifequal03': ["{% ifequal a b %}yes{% else %}no{% endifequal %}", {"a": 1, "b": 2}, "no"],
            'ifequal04': ["{% ifequal a b %}yes{% else %}no{% endifequal %}", {"a": 1, "b": 1}, "yes"],
            'ifequal05': ["{% ifequal a 'test' %}yes{% else %}no{% endifequal %}", {"a": "test"}, "yes"],
            'ifequal06': ["{% ifequal a 'test' %}yes{% else %}no{% endifequal %}", {"a": "no"}, "no"],
            'ifequal07': ['{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {"a": "test"}, "yes"],
            'ifequal08': ['{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {"a": "no"}, "no"],
            'ifequal09': ['{% ifequal a "test" %}yes{% else %}no{% endifequal %}', {}, "no"],
            'ifequal10': ['{% ifequal a b %}yes{% else %}no{% endifequal %}', {}, "yes"],

            //SMART SPLITTING
            'ifequal-split01': ['{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {}, "no"],
            'ifequal-split02': ['{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {'a': 'foo'}, "no"],
            'ifequal-split03': ['{% ifequal a "test man" %}yes{% else %}no{% endifequal %}', {'a': 'test man'}, "yes"],
            'ifequal-split04': ["{% ifequal a 'test man' %}yes{% else %}no{% endifequal %}", {'a': 'test man'}, "yes"],
            'ifequal-split05': ["{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': ''}, "no"],
            'ifequal-split06': ["{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': 'i "love" you'}, "yes"],
            'ifequal-split07': ["{% ifequal a 'i \"love\" you' %}yes{% else %}no{% endifequal %}", {'a': 'i love you'}, "no"],
            // FIXME probably regex broken for those weird cases
            //'ifequal-split08': ["{% ifequal a 'I\'m happy' %}yes{% else %}no{% endifequal %}", {'a': "I'm happy"}, "yes"],
            //'ifequal-split09': ["{% ifequal a 'slash\man' %}yes{% else %}no{% endifequal %}", {'a': "slash\man"}, "yes"],
            //'ifequal-split10': ["{% ifequal a 'slash\man' %}yes{% else %}no{% endifequal %}", {'a': "slashman"}, "no"],

            //NUMERIC RESOLUTION
            'ifequal-numeric01': ['{% ifequal x 5 %}yes{% endifequal %}', {'x': '5'}, ''],
            'ifequal-numeric02': ['{% ifequal x 5 %}yes{% endifequal %}', {'x': 5}, 'yes'],
            'ifequal-numeric03': ['{% ifequal x 5.2 %}yes{% endifequal %}', {'x': 5}, ''],
            'ifequal-numeric04': ['{% ifequal x 5.2 %}yes{% endifequal %}', {'x': 5.2}, 'yes'],
            'ifequal-numeric05': ['{% ifequal x 0.2 %}yes{% endifequal %}', {'x': .2}, 'yes'],
            // FIXME regex is broken for constants starting with a dot
            // 'ifequal-numeric06': ['{% ifequal x .2 %}yes{% endifequal %}', {'x': .2}, 'yes'],
            // WONTFIX? in js `2. === 2`
            // 'ifequal-numeric07': ['{% ifequal x 2. %}yes{% endifequal %}', {'x': 2}, ''],
            'ifequal-numeric08': ['{% ifequal x "5" %}yes{% endifequal %}', {'x': 5}, ''],
            'ifequal-numeric09': ['{% ifequal x "5" %}yes{% endifequal %}', {'x': '5'}, 'yes'],
            // FIXME regex does not work for - or + at start
            //'ifequal-numeric10': ['{% ifequal x -5 %}yes{% endifequal %}', {'x': -5}, 'yes'],
            //'ifequal-numeric11': ['{% ifequal x -5.2 %}yes{% endifequal %}', {'x': -5.2}, 'yes'],
            //'ifequal-numeric12': ['{% ifequal x +5 %}yes{% endifequal %}', {'x': 5}, 'yes'],

            //FILTER EXPRESSIONS AS ARGUMENTS
            'ifequal-filter01': ['{% ifequal a|upper "A" %}x{% endifequal %}', {'a': 'a'}, 'x'],
            'ifequal-filter02': ['{% ifequal "A" a|upper %}x{% endifequal %}', {'a': 'a'}, 'x'],
            'ifequal-filter03': ['{% ifequal a|upper b|upper %}x{% endifequal %}', {'a': 'x', 'b': 'X'}, 'x'],
            // NOTE: slice behaves very different compared to django but identical to js Array.slice
            'ifequal-filter04': ['{% ifequal x|slice:"1:2" "a" %}x{% endifequal %}', {'x': 'aaa'}, 'x'],
            'ifequal-filter05': ['{% ifequal x|slice:"1:2"|upper "A" %}x{% endifequal %}', {'x': 'aaa'}, 'x'],

            //IFNOTEQUAL TAG ########################################################
            'ifnotequal01': ["{% ifnotequal a b %}yes{% endifnotequal %}", {"a": 1, "b": 2}, "yes"],
            'ifnotequal02': ["{% ifnotequal a b %}yes{% endifnotequal %}", {"a": 1, "b": 1}, ""],
            'ifnotequal03': ["{% ifnotequal a b %}yes{% else %}no{% endifnotequal %}", {"a": 1, "b": 2}, "yes"],
            'ifnotequal04': ["{% ifnotequal a b %}yes{% else %}no{% endifnotequal %}", {"a": 1, "b": 1}, "no"],

            //NAMED ENDBLOCKS #######################################################

            //Basic test
            'namedendblocks01': ["1{% block first %}_{% block second %}2{% endblock second %}_{% endblock first %}3", {}, '1_2_3'],

            //Unbalanced blocks
            'namedendblocks02': ["1{% block first %}_{% block second %}2{% endblock first %}_{% endblock second %}3", {}, Error],
            'namedendblocks03': ["1{% block first %}_{% block second %}2{% endblock %}_{% endblock second %}3", {}, Error],
            'namedendblocks04': ["1{% block first %}_{% block second %}2{% endblock second %}_{% endblock third %}3", {}, Error],
            'namedendblocks05': ["1{% block first %}_{% block second %}2{% endblock first %}", {}, Error],

            //Mixed named and unnamed endblocks
            'namedendblocks06': ["1{% block first %}_{% block second %}2{% endblock %}_{% endblock first %}3", {}, '1_2_3'],
            'namedendblocks07': ["1{% block first %}_{% block second %}2{% endblock second %}_{% endblock %}3", {}, '1_2_3'],

            //INHERITANCE ###########################################################

            //Standard template with no inheritance
            'inheritance01': ["1{% block first %}&{% endblock %}3{% block second %}_{% endblock %}", {}, '1&3_'],

            //Standard two-level inheritance
            'inheritance02': ["{% extends 'inheritance01' %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {}, '1234'],

            //Three-level with no redefinitions on third level
            'inheritance03': ["{% extends 'inheritance02' %}", {}, '1234'],

            //Two-level with no redefinitions on second level
            'inheritance04': ["{% extends 'inheritance01' %}", {}, '1&3_'],

            //Two-level with double quotes instead of single quotes
            'inheritance05': ['{% extends "inheritance02" %}', {}, '1234'],

            //Three-level with variable parent-template name
            'inheritance06': ["{% extends foo %}", {'foo': 'inheritance02'}, '1234'],

            //Two-level with one block defined, one block not defined
            'inheritance07': ["{% extends 'inheritance01' %}{% block second %}5{% endblock %}", {}, '1&35'],

            //Three-level with one block defined on this level, two blocks defined next level
            'inheritance08': ["{% extends 'inheritance02' %}{% block second %}5{% endblock %}", {}, '1235'],

            //Three-level with second and third levels blank
            'inheritance09': ["{% extends 'inheritance04' %}", {}, '1&3_'],

            //Three-level with space NOT in a block -- should be ignored
            'inheritance10': ["{% extends 'inheritance04' %}      ", {}, '1&3_'],

            //Three-level with both blocks defined on this level, but none on second level
            'inheritance11': ["{% extends 'inheritance04' %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {}, '1234'],

            //Three-level with this level providing one and second level providing the other
            'inheritance12': ["{% extends 'inheritance07' %}{% block first %}2{% endblock %}", {}, '1235'],

            //Three-level with this level overriding second level
            'inheritance13': ["{% extends 'inheritance02' %}{% block first %}a{% endblock %}{% block second %}b{% endblock %}", {}, '1a3b'],

            //A block defined only in a child template shouldn't be displayed
            'inheritance14': ["{% extends 'inheritance01' %}{% block newblock %}NO DISPLAY{% endblock %}", {}, '1&3_'],

            //A block within another block
            'inheritance15': ["{% extends 'inheritance01' %}{% block first %}2{% block inner %}inner{% endblock %}{% endblock %}", {}, '12inner3_'],

            //A block within another block (level 2)
            'inheritance16': ["{% extends 'inheritance15' %}{% block inner %}out{% endblock %}", {}, '12out3_'],

            //{% load %} tag (parent -- setup for exception04)
            // NOTE: in a normal environment tags are loaded from packages not with weird relative paths
            'inheritance17': ["{% loadtag ./fakepackage/tags %}{% block first %}1234{% endblock %}", {}, '1234'],

            //{% load %} tag (standard usage, without inheritance)
            'inheritance18': ["{% loadtag ./fakepackage/tags %}{% echo this that theother %}5678", {}, 'this that theother5678'],

            //{% load %} tag (within a child template)
            'inheritance19': ["{% extends 'inheritance01' %}{% block first %}{% loadtag ./fakepackage/tags %}{% echo 400 %}5678{% endblock %}", {}, '140056783_'],

            //Two-level inheritance with {{ block.super }}
            'inheritance20': ["{% extends 'inheritance01' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '1&a3_'],

            //Three-level inheritance with {{ block.super }} from parent
            'inheritance21': ["{% extends 'inheritance02' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '12a34'],

            //Three-level inheritance with {{ block.super }} from grandparent
            'inheritance22': ["{% extends 'inheritance04' %}{% block first %}{{ block.super }}a{% endblock %}", {}, '1&a3_'],

            //Three-level inheritance with {{ block.super }} from parent and grandparent
            'inheritance23': ["{% extends 'inheritance20' %}{% block first %}{{ block.super }}b{% endblock %}", {}, '1&ab3_'],

            //Inheritance from local context without use of template loader
            'inheritance24': ["{% extends context_template %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {'context_template': new Template("1{% block first %}_{% endblock %}3{% block second %}_{% endblock %}")}, '1234'],

            //Inheritance from local context with variable parent template
            'inheritance25': ["{% extends context_template.1 %}{% block first %}2{% endblock %}{% block second %}4{% endblock %}", {'context_template': [new Template("Wrong"), new Template("1{% block first %}_{% endblock %}3{% block second %}_{% endblock %}")]}, '1234'],

            //Set up a base template to extend
            'inheritance26': ["no tags", {}, 'no tags'],

            //Inheritance from a template that doesn't have any blocks
            'inheritance27': ["{% extends 'inheritance26' %}", {}, 'no tags'],

            //Set up a base template with a space in it.
            'inheritance 28': ["{% block first %}!{% endblock %}", {}, '!'],

            //Inheritance from a template with a space in its name should work.
            'inheritance29': ["{% extends 'inheritance 28' %}", {}, '!'],

            //Base template, putting block in a conditional {% if %} tag
            'inheritance30': ["1{% if optional %}{% block opt %}2{% endblock %}{% endif %}3", {'optional': true}, '123'],

            //Inherit from a template with block wrapped in an {% if %} tag (in parent], still gets overridden
            'inheritance31': ["{% extends 'inheritance30' %}{% block opt %}two{% endblock %}", {'optional': true}, '1two3'],
            'inheritance32': ["{% extends 'inheritance30' %}{% block opt %}two{% endblock %}", {}, '13'],

            //Base template, putting block in a conditional {% ifequal %} tag
            'inheritance33': ["1{% ifequal optional 1 %}{% block opt %}2{% endblock %}{% endifequal %}3", {'optional': 1}, '123'],

            //Inherit from a template with block wrapped in an {% ifequal %} tag (in parent], still gets overridden
            'inheritance34': ["{% extends 'inheritance33' %}{% block opt %}two{% endblock %}", {'optional': 1}, '1two3'],
            'inheritance35': ["{% extends 'inheritance33' %}{% block opt %}two{% endblock %}", {'optional': 2}, '13'],

            //Base template, putting block in a {% for %} tag
            'inheritance36': ["{% for n in numbers %}_{% block opt %}{{ n }}{% endblock %}{% endfor %}_", {'numbers': '123'}, '_1_2_3_'],

            //Inherit from a template with block wrapped in an {% for %} tag (in parent], still gets overridden
            'inheritance37': ["{% extends 'inheritance36' %}{% block opt %}X{% endblock %}", {'numbers': '123'}, '_X_X_X_'],
            'inheritance38': ["{% extends 'inheritance36' %}{% block opt %}X{% endblock %}", {}, '_'],

            //The super block will still be found.
            //'inheritance39': ["{% extends 'inheritance30' %}{% block opt %}new{{ block.super }}{% endblock %}", {'optional': true}, '1new23'],
            'inheritance40': ["{% extends 'inheritance33' %}{% block opt %}new{{ block.super }}{% endblock %}", {'optional': 1}, '1new23'],
            'inheritance41': ["{% extends 'inheritance36' %}{% block opt %}new{{ block.super }}{% endblock %}", {'numbers': '123'}, '_new1_new2_new3_'],

            //Expression starting and ending with a quote
            // FIXME regex problem
            //'inheritance42': ["{% extends 'inheritance02'|cut:' ' %}", {}, '1234'],


            //Raise exception for invalid template name
            'exception01': ["{% extends 'nonexistent' %}", {}, Error],

            //Raise exception for invalid template name (in variable)
            'exception02': ["{% extends nonexistent %}", {}, Error],

            //Raise exception for extra {% extends %} tags
            'exception03': ["{% extends 'inheritance01' %}{% block first %}2{% endblock %}{% extends 'inheritance16' %}", {}, Error],

            //IF TAG ################################################################
            'if-tag01': ["{% if foo %}yes{% else %}no{% endif %}", {"foo": true}, "yes"],
            'if-tag02': ["{% if foo %}yes{% else %}no{% endif %}", {"foo": false}, "no"],
            'if-tag03': ["{% if foo %}yes{% else %}no{% endif %}", {}, "no"],

            'if-tag04': ["{% if foo %}foo{% elif bar %}bar{% endif %}", {'foo': true}, "foo"],
            'if-tag05': ["{% if foo %}foo{% elif bar %}bar{% endif %}", {'bar': true}, "bar"],
            'if-tag06': ["{% if foo %}foo{% elif bar %}bar{% endif %}", {}, ""],
            'if-tag07': ["{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {'foo': true}, "foo"],
            'if-tag08': ["{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {'bar': true}, "bar"],
            'if-tag09': ["{% if foo %}foo{% elif bar %}bar{% else %}nothing{% endif %}", {}, "nothing"],
            'if-tag10': ["{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'foo': true}, "foo"],
            'if-tag11': ["{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'bar': true}, "bar"],
            'if-tag12': ["{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {'baz': true}, "baz"],
            'if-tag13': ["{% if foo %}foo{% elif bar %}bar{% elif baz %}baz{% else %}nothing{% endif %}", {}, "nothing"],

            //Filters
            'if-tag-filter01': ["{% if foo|length == 5 %}yes{% else %}no{% endif %}", {'foo': 'abcde'}, "yes"],
            'if-tag-filter02': ["{% if foo|upper == 'ABC' %}yes{% else %}no{% endif %}", {}, "no"],

            //Equality
            'if-tag-eq01': ["{% if foo == bar %}yes{% else %}no{% endif %}", {}, "yes"],
            'if-tag-eq02': ["{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1}, "no"],
            'if-tag-eq03': ["{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1, 'bar': 1}, "yes"],
            'if-tag-eq04': ["{% if foo == bar %}yes{% else %}no{% endif %}", {'foo': 1, 'bar': 2}, "no"],
            'if-tag-eq05': ["{% if foo == '' %}yes{% else %}no{% endif %}", {}, "no"],

            //Comparison
            'if-tag-gt-01': ["{% if 2 > 1 %}yes{% else %}no{% endif %}", {}, "yes"],
            'if-tag-gt-02': ["{% if 1 > 1 %}yes{% else %}no{% endif %}", {}, "no"],
            'if-tag-gte-01': ["{% if 1 >= 1 %}yes{% else %}no{% endif %}", {}, "yes"],
            'if-tag-gte-02': ["{% if 1 >= 2 %}yes{% else %}no{% endif %}", {}, "no"],
            'if-tag-lt-01': ["{% if 1 < 2 %}yes{% else %}no{% endif %}", {}, "yes"],
            'if-tag-lt-02': ["{% if 1 < 1 %}yes{% else %}no{% endif %}", {}, "no"],
            'if-tag-lte-01': ["{% if 1 <= 1 %}yes{% else %}no{% endif %}", {}, "yes"],
            'if-tag-lte-02': ["{% if 2 <= 1 %}yes{% else %}no{% endif %}", {}, "no"],

            //Contains
            'if-tag-in-01': ["{% if 1 in x %}yes{% else %}no{% endif %}", {'x':[1]}, "yes"],
            'if-tag-in-02': ["{% if 2 in x %}yes{% else %}no{% endif %}", {'x':[1]}, "no"],
            'if-tag-not-in-01': ["{% if 1 not in x %}yes{% else %}no{% endif %}", {'x':[1]}, "no"],
            'if-tag-not-in-02': ["{% if 2 not in x %}yes{% else %}no{% endif %}", {'x':[1]}, "yes"],

            //AND
            'if-tag-and01': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'yes'],
            'if-tag-and02': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'no'],
            'if-tag-and03': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'no'],
            'if-tag-and04': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'no'],
            'if-tag-and05': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': false}, 'no'],
            'if-tag-and06': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'bar': false}, 'no'],
            'if-tag-and07': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'foo': true}, 'no'],
            'if-tag-and08': ["{% if foo and bar %}yes{% else %}no{% endif %}", {'bar': true}, 'no'],

            //OR
            'if-tag-or01': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'yes'],
            'if-tag-or02': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'yes'],
            'if-tag-or03': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'yes'],
            'if-tag-or04': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'no'],
            'if-tag-or05': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': false}, 'no'],
            'if-tag-or06': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'bar': false}, 'no'],
            'if-tag-or07': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'foo': true}, 'yes'],
            'if-tag-or08': ["{% if foo or bar %}yes{% else %}no{% endif %}", {'bar': true}, 'yes'],

            //multiple ORs
            'if-tag-or09': ["{% if foo or bar or baz %}yes{% else %}no{% endif %}", {'baz': true}, 'yes'],

            //NOT
            'if-tag-not01': ["{% if not foo %}no{% else %}yes{% endif %}", {'foo': true}, 'yes'],
            'if-tag-not02': ["{% if not not foo %}no{% else %}yes{% endif %}", {'foo': true}, 'no'],
            //not03 to not05 removed, now TemplateSyntaxErrors

            'if-tag-not06': ["{% if foo and not bar %}yes{% else %}no{% endif %}", {}, 'no'],
            'if-tag-not07': ["{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'no'],
            'if-tag-not08': ["{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'yes'],
            'if-tag-not09': ["{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'no'],
            'if-tag-not10': ["{% if foo and not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'no'],

            'if-tag-not11': ["{% if not foo and bar %}yes{% else %}no{% endif %}", {}, 'no'],
            'if-tag-not12': ["{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'no'],
            'if-tag-not13': ["{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'no'],
            'if-tag-not14': ["{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'yes'],
            'if-tag-not15': ["{% if not foo and bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'no'],

            'if-tag-not16': ["{% if foo or not bar %}yes{% else %}no{% endif %}", {}, 'yes'],
            'if-tag-not17': ["{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'yes'],
            'if-tag-not18': ["{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'yes'],
            'if-tag-not19': ["{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'no'],
            'if-tag-not20': ["{% if foo or not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'yes'],

            'if-tag-not21': ["{% if not foo or bar %}yes{% else %}no{% endif %}", {}, 'yes'],
            'if-tag-not22': ["{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'yes'],
            'if-tag-not23': ["{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'no'],
            'if-tag-not24': ["{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'yes'],
            'if-tag-not25': ["{% if not foo or bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'yes'],

            'if-tag-not26': ["{% if not foo and not bar %}yes{% else %}no{% endif %}", {}, 'yes'],
            'if-tag-not27': ["{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'no'],
            'if-tag-not28': ["{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'no'],
            'if-tag-not29': ["{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'no'],
            'if-tag-not30': ["{% if not foo and not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'yes'],

            'if-tag-not31': ["{% if not foo or not bar %}yes{% else %}no{% endif %}", {}, 'yes'],
            'if-tag-not32': ["{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': true}, 'no'],
            'if-tag-not33': ["{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': true, 'bar': false}, 'yes'],
            'if-tag-not34': ["{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': true}, 'yes'],
            'if-tag-not35': ["{% if not foo or not bar %}yes{% else %}no{% endif %}", {'foo': false, 'bar': false}, 'yes'],

            //Various syntax errors
            'if-tag-error01': ["{% if %}yes{% endif %}", {}, Error],
            'if-tag-error02': ["{% if foo and %}yes{% else %}no{% endif %}", {'foo': true}, Error],
            'if-tag-error03': ["{% if foo or %}yes{% else %}no{% endif %}", {'foo': true}, Error],
            'if-tag-error04': ["{% if not foo and %}yes{% else %}no{% endif %}", {'foo': true}, Error],
            'if-tag-error05': ["{% if not foo or %}yes{% else %}no{% endif %}", {'foo': true}, Error],
            'if-tag-error06': ["{% if abc def %}yes{% endif %}", {}, Error],
            'if-tag-error07': ["{% if not %}yes{% endif %}", {}, Error],
            'if-tag-error08': ["{% if and %}yes{% endif %}", {}, Error],
            'if-tag-error09': ["{% if or %}yes{% endif %}", {}, Error],
            'if-tag-error10': ["{% if == %}yes{% endif %}", {}, Error],
            'if-tag-error11': ["{% if 1 == %}yes{% endif %}", {}, Error],
            'if-tag-error12': ["{% if a not b %}yes{% endif %}", {}, Error],

            //If evaluations are shortcircuited where possible
            //If is_bad is invoked, it will raise a ShouldNotExecuteException
            'if-tag-shortcircuit01': ['{% if x.is_true or x.is_bad %}yes{% else %}no{% endif %}', {'x': new TestObj()}, "yes"],
            'if-tag-shortcircuit02': ['{% if x.is_false and x.is_bad %}yes{% else %}no{% endif %}', {'x': new TestObj()}, "no"],

            //Non-existent args
            'if-tag-badarg01':["{% if x|default:y %}yes{% endif %}", {}, ''],
            'if-tag-badarg02':["{% if x|default:y %}yes{% endif %}", {'y': 0}, ''],
            'if-tag-badarg03':["{% if x|default:y %}yes{% endif %}", {'y': 1}, 'yes'],
            'if-tag-badarg04':["{% if x|default:y %}yes{% else %}no{% endif %}", {}, 'no'],

            // constants can be single- or double-quoted strings
            // or numbers with optional +/- prefix
            'constant-regex01': ['{{ "foobar"|upper}}', {}, 'FOOBAR'],
            'constant-regex02': ["{{ 'foobar'|upper}}", {}, 'FOOBAR'],
            'constant-regex03': ["{{ list|join:' '}}", {list: [1,2]}, "1 2"],
            'constant-regex04': ["{{ list|join:''}}", {list: [1,2]}, "12"],


            //CYCLE TAG #############################################################
            'cycle01': ['{% cycle a %}', {}, Error],
            'cycle02': ['{% cycle a,b,c as abc %}{% cycle abc %}', {}, 'ab'],
            'cycle03': ['{% cycle a,b,c as abc %}{% cycle abc %}{% cycle abc %}', {}, 'abc'],
            'cycle04': ['{% cycle a,b,c as abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}', {}, 'abca'],
            'cycle05': ['{% cycle %}', {}, Error],
            'cycle06': ['{% cycle a %}', {}, Error],
            'cycle07': ['{% cycle a,b,c as foo %}{% cycle bar %}', {}, Error],
            'cycle08': ['{% cycle a,b,c as foo %}{% cycle foo %}{{ foo }}{{ foo }}{% cycle foo %}{{ foo }}', {}, 'abbbcc'],
            'cycle09': ["{% for i in test %}{% cycle a,b %}{{ i }},{% endfor %}", {'test': [0,1,2,3,4]}, 'a0,b1,a2,b3,a4,'],
            'cycle10': ["{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}", {}, 'ab'],
            'cycle11': ["{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}{% cycle abc %}", {}, 'abc'],
            'cycle12': ["{% cycle 'a' 'b' 'c' as abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}", {}, 'abca'],
            'cycle13': ["{% for i in test %}{% cycle 'a' 'b' %}{{ i }},{% endfor %}", {'test': [0,1,2,3,4]}, 'a0,b1,a2,b3,a4,'],
            'cycle14': ["{% cycle one two as foo %}{% cycle foo %}", {'one': '1','two': '2'}, '12'],
            'cycle15': ["{% for i in test %}{% cycle aye bee %}{{ i }},{% endfor %}", {'test': [0,1,2,3,4], 'aye': 'a', 'bee': 'b'}, 'a0,b1,a2,b3,a4,'],
            'cycle16': ["{% cycle one|lower two as foo %}{% cycle foo %}", {'one': 'A','two': '2'}, 'a2'],
            'cycle17': ["{% cycle 'a' 'b' 'c' as abc silent %}{% cycle abc %}{% cycle abc %}{% cycle abc %}{% cycle abc %}", {}, ""],
            'cycle18': ["{% cycle 'a' 'b' 'c' as foo invalid_flag %}", {}, Error],
            'cycle19': ["{% cycle 'a' 'b' as silent %}{% cycle silent %}", {}, "ab"],
            'cycle20': ["{% cycle one two as foo %} &amp; {% cycle foo %}", {'one' : 'A & B', 'two' : 'C & D'}, "A &amp; B &amp; C &amp; D"],
            //'cycle21': ["{% filter force_escape %}{% cycle one two as foo %} & {% cycle foo %}{% endfilter %}", {'one' : 'A & B', 'two' : 'C & D'}, "A &amp; B &amp; C &amp; D"],
            'cycle22': ["{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{{ x }}{% endfor %}", {'values': [1,2,3,4]}, "1234"],
            'cycle23': ["{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{{ abc }}{{ x }}{% endfor %}", {'values': [1,2,3,4]}, "a1b2c3a4"],
            'included-cycle': ['{{ abc }}', {'abc': 'xxx'}, 'xxx'],
            'cycle24': ["{% for x in values %}{% cycle 'a' 'b' 'c' as abc silent %}{% include 'included-cycle' %}{% endfor %}", {'values': [1,2,3,4]}, "abca"],
            'cycle24b': ["{% cycle a,b,c as bar %}{% cycle 1,2,3 as foo %}{% cycle bar %}{% cycle foo %}{% cycle bar %}{% cycle foo %}", {}, "a1b2c3"],

            'cycle25': ['{% cycle a as abc %}', {'a': '<'}, '&lt;'],
            'cycle26': ['{% cycle a b as ab %}{% cycle ab %}', {'a': '<', 'b': '>'}, '&lt;&gt;'],
            'cycle27': ['{% autoescape off %}{% cycle a b as ab %}{% cycle ab %}{% endautoescape %}', {'a': '<', 'b': '>'}, '<>'],
            'cycle28': ['{% cycle a|safe b as ab %}{% cycle ab %}', {'a': '<', 'b': '>'}, '<&gt;'],

            //IFCHANGED TAG #########################################################
            'ifchanged01': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': [1,2,3]}, '123'],
            'ifchanged02': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': [1,1,3]}, '13'],
            'ifchanged03': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% endfor %}', {'num': [1,1,1]}, '1'],
            'ifchanged04': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': [1, 2, 3], 'numx': [2, 2, 2]}, '122232'],
            'ifchanged05': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': [1, 1, 1], 'numx': [1, 2, 3]}, '1123123123'],
            'ifchanged06': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', {'num': [1, 1, 1], 'numx': [2, 2, 2]}, '1222'],
            'ifchanged07': ['{% for n in num %}{% ifchanged %}{{ n }}{% endifchanged %}{% for x in numx %}{% ifchanged %}{{ x }}{% endifchanged %}{% for y in numy %}{% ifchanged %}{{ y }}{% endifchanged %}{% endfor %}{% endfor %}{% endfor %}', {'num': [1, 1, 1], 'numx': [2, 2, 2], 'numy': [3, 3, 3]}, '1233323332333'],
            'ifchanged08': ['{% for data in datalist %}{% for c,d in data %}{% if c %}{% ifchanged %}{{ d }}{% endifchanged %}{% endif %}{% endfor %}{% endfor %}', {'datalist': [[[1, 'a'], [1, 'a'], [0, 'b'], [1, 'c']], [[0, 'a'], [1, 'c'], [1, 'd'], [1, 'd'], [0, 'e']]]}, 'accd'],

            //Test one parameter given to ifchanged.
            'ifchanged-param01': ['{% for n in num %}{% ifchanged n %}..{% endifchanged %}{{ n }}{% endfor %}', { 'num': [1,2,3] }, '..1..2..3'],
            'ifchanged-param02': ['{% for n in num %}{% for x in numx %}{% ifchanged n %}..{% endifchanged %}{{ x }}{% endfor %}{% endfor %}', { 'num': [1,2,3], 'numx': [5,6,7] }, '..567..567..567'],

            //Test multiple parameters to ifchanged.
            'ifchanged-param03': ['{% for n in num %}{{ n }}{% for x in numx %}{% ifchanged x n %}{{ x }}{% endifchanged %}{% endfor %}{% endfor %}', { 'num': [1,1,2], 'numx': [5,6,6] }, '156156256'],

            //Test a date+hour like construct, where the hour of the last day
            //is the same but the date had changed, so print the hour anyway.
            'ifchanged-param04': ['{% for d in days %}{% ifchanged %}{{ d.day }}{% endifchanged %}{% for h in d.hours %}{% ifchanged d h %}{{ h }}{% endifchanged %}{% endfor %}{% endfor %}', {'days':[{'day':1, 'hours':[1,2,3]},{'day':2, 'hours':[3]},] }, '112323'],

            //Logically the same as above, just written with explicit
            //ifchanged for the day.
            'ifchanged-param05': ['{% for d in days %}{% ifchanged d.day %}{{ d.day }}{% endifchanged %}{% for h in d.hours %}{% ifchanged d.day h %}{{ h }}{% endifchanged %}{% endfor %}{% endfor %}', {'days':[{'day':1, 'hours':[1,2,3]},{'day':2, 'hours':[3]},] }, '112323'],

            //Test the else clause of ifchanged.
            'ifchanged-else01': ['{% for id in ids %}{{ id }}{% ifchanged id %}-first{% else %}-other{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-first,1-other,2-first,2-other,2-other,3-first,'],

            'ifchanged-else02': ['{% for id in ids %}{{ id }}-{% ifchanged id %}{% cycle red,blue %}{% else %}grey{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-red,1-grey,2-blue,2-grey,2-grey,3-red,'],
            'ifchanged-else03': ['{% for id in ids %}{{ id }}{% ifchanged id %}-{% cycle red,blue %}{% else %}{% endifchanged %},{% endfor %}', {'ids': [1,1,2,2,2,3]}, '1-red,1,2-blue,2,2,3-red,'],

            'ifchanged-else04': ['{% for id in ids %}{% ifchanged %}***{{ id }}*{% else %}...{% endifchanged %}{{ forloop.counter }}{% endfor %}', {'ids': [1,1,2,2,2,3,4]}, '***1*1...2***2*3...4...5***3*6***4*7'],

            //FILTER TAG ############################################################
            'filter01': ['{% filter upper %}{% endfilter %}', {}, ''],
            'filter02': ['{% filter upper %}django{% endfilter %}', {}, 'DJANGO'],
            'filter03': ['{% filter upper|lower %}django{% endfilter %}', {}, 'django'],
            'filter04': ['{% filter cut:remove %}djangospam{% endfilter %}', {'remove': 'spam'}, 'django'],
            'filter05': ['{% filter safe %}fail{% endfilter %}', {}, Error],
            'filter05bis': ['{% filter upper|safe %}fail{% endfilter %}', {}, Error],
            'filter06': ['{% filter escape %}fail{% endfilter %}', {}, Error],
            'filter06bis': ['{% filter upper|escape %}fail{% endfilter %}', {}, Error],

            //FIRSTOF TAG ###########################################################
            'firstof01': ['{% firstof a b c %}', {'a':0,'b':0,'c':0}, ''],
            'firstof02': ['{% firstof a b c %}', {'a':1,'b':0,'c':0}, '1'],
            'firstof03': ['{% firstof a b c %}', {'a':0,'b':2,'c':0}, '2'],
            'firstof04': ['{% firstof a b c %}', {'a':0,'b':0,'c':3}, '3'],
            'firstof05': ['{% firstof a b c %}', {'a':1,'b':2,'c':3}, '1'],
            'firstof06': ['{% firstof a b c %}', {'b':0,'c':3}, '3'],
            'firstof07': ['{% firstof a b "c" %}', {'a':0}, 'c'],
            'firstof08': ['{% firstof a b "c and d" %}', {'a':0,'b':0}, 'c and d'],
            'firstof09': ['{% firstof %}', {}, Error],

            'firstof11': ['{% firstof a b %}', {'a': '<', 'b': '>'}, '&lt;'],
            'firstof12': ['{% firstof a b %}', {'a': '', 'b': '>'}, '&gt;'],
            'firstof13': ['{% autoescape off %}{% firstof a %}{% endautoescape %}', {'a': '<'}, '<'],
            'firstof14': ['{% firstof a|safe b %}', {'a': '<'}, '<'],

            // {% spaceless %} tag
            'spaceless01': ["{% spaceless %} <b>    <i> text </i>    </b> {% endspaceless %}", {}, "<b><i> text </i></b>"],
            'spaceless02': ["{% spaceless %} <b> \n <i> text </i> \n </b> {% endspaceless %}", {}, "<b><i> text </i></b>"],
            'spaceless03': ["{% spaceless %}<b><i>text</i></b>{% endspaceless %}", {}, "<b><i>text</i></b>"],
            'spaceless04': ["{% spaceless %}<b>   <i>{{ text }}</i>  </b>{% endspaceless %}", {'text' : 'This & that'}, "<b><i>This &amp; that</i></b>"],
            'spaceless05': ["{% autoescape off %}{% spaceless %}<b>   <i>{{ text }}</i>  </b>{% endspaceless %}{% endautoescape %}", {'text' : 'This & that'}, "<b><i>This & that</i></b>"],
            'spaceless06': ["{% spaceless %}<b>   <i>{{ text|safe }}</i>  </b>{% endspaceless %}", {'text' : 'This & that'}, "<b><i>This & that</i></b>"],

            ///// AUTOESCAPE TAG ##############################################
            'autoescape-tag01': ["{% autoescape off %}hello{% endautoescape %}", {}, "hello"],
            'autoescape-tag02': ["{% autoescape off %}{{ first }}{% endautoescape %}", {"first": "<b>hello</b>"}, "<b>hello</b>"],
            'autoescape-tag03': ["{% autoescape on %}{{ first }}{% endautoescape %}", {"first": "<b>hello</b>"}, "&lt;b&gt;hello&lt;/b&gt;"],

            // Autoescape disabling and enabling nest in a predictable way.
            'autoescape-tag04': ["{% autoescape off %}{{ first }} {% autoescape  on%}{{ first }}{% endautoescape %}{% endautoescape %}", {"first": "<a>"}, "<a> &lt;a&gt;"],

            'autoescape-tag05': ["{% autoescape on %}{{ first }}{% endautoescape %}", {"first": "<b>first</b>"}, "&lt;b&gt;first&lt;/b&gt;"],

            // Strings (ASCII or unicode) already marked as "safe" are not
            // auto-escaped
            'autoescape-tag06': ["{{ first }}", {"first": markSafe("<b>first</b>")}, "<b>first</b>"],
            'autoescape-tag07': ["{% autoescape on %}{{ first }}{% endautoescape %}", {"first": markSafe("<b>Apple</b>")}, "<b>Apple</b>"],

            // Literal string arguments to filters, if used in the result, are
            // safe.
            // FIXME regex?
            // 'autoescape-tag08': ['{% autoescape on %}{{ var|defaultifnull:" endquote\" hah" }}{% endautoescape %}', {"var": null}, ' endquote" hah'],

            // Objects which return safe strings as their __unicode__ method
            // won't get double-escaped.
            'autoescape-tag09': ['{{ unsafe }}', {'unsafe': 'you & me'}, 'you &amp; me'],
            'autoescape-tag10': ['{{ safe }}', {'safe': markSafe('you &gt; me')}, 'you &gt; me'],

            // The "safe" and "escape" filters cannot work due to internal
            // implementation details (fortunately, the (no)autoescape block
            // tags can be used in those cases)
            // FIXME see fixme in autoescpe tag
            // 'autoescape-filtertag01': ["{{ first }}{% filter safe %}{{ first }} x<y{% endfilter %}", {"first": "<a>"}, Error],

            // ifqeual compares unescaped vales.
            'autoescape-ifequal01': ['{% ifequal var "this & that" %}yes{% endifequal %}', { "var": "this & that" }, "yes"],

            // Arguments to filters are 'safe' and manipulate their input unescaped.
            'autoescape-filters01': ['{{ var|cut:"&" }}', { "var": "this & that" }, "this  that" ],
            'autoescape-filters02': ['{{ var|join:" & \" }}', { "var": ["Tom", "Dick", "Harry"] }, "Tom & Dick & Harry"],

            // Literal strings are safe.
            'autoescape-literals01': ['{{ "this & that" }}',{}, "this & that"],

            // Iterating over strings outputs safe characters.
            'autoescape-stringiterations01': ['{% for l in var %}{{ l }},{% endfor %}', {'var': 'K&R'}, "K,&amp;,R,"],

            // Escape requirement survives lookup.
            'autoescape-lookup01': ['{{ var.key }}', { "var": {"key": "this & that" }}, "this &amp; that"],

            // Verbatim template tag outputs contents without rendering.
            'verbatim-tag01': ['{% verbatim %}{{bare   }}{% endverbatim %}', {}, '{{bare   }}'],
            'verbatim-tag02': ['{% verbatim %}{% endif %}{% endverbatim %}', {}, '{% endif %}'],
            'verbatim-tag03': ["{% verbatim %}It's the {% verbatim %} tag{% endverbatim %}", {}, "It's the {% verbatim %} tag"],
            'verbatim-tag04': ['{% verbatim %}{% verbatim %}{% endverbatim %}{% endverbatim %}', {}, Error],
            'verbatim-tag05': ['{% verbatim %}{% endverbatim %}{% verbatim %}{% endverbatim %}', {}, ''],
            'verbatim-tag06': ["{% verbatim special %}Don't {% endverbatim %} just yet{% endverbatim special %}", {}, "Don't {% endverbatim %} just yet"],

            // WITH TAG ########################################################
            'with01': ['{% with key=dict.key %}{{ key }}{% endwith %}', {'dict': {'key': 50}}, '50'],
            // WONTFIX no legacy support
            // 'legacywith01': ['{% with dict.key as key %}{{ key }}{% endwith %}', {'dict': {'key': 50}}, '50'],

            'with02': ['{{ key }}{% with key=dict.key %}{{ key }}-{{ dict.key }}-{{ key }}{% endwith %}{{ key }}', {'dict': {'key': 50}}, 'INVALID50-50-50INVALID'],
            // WONTFIX not legacy support
            // 'legacywith02': ['{{ key }}{% with dict.key as key %}{{ key }}-{{ dict.key }}-{{ key }}{% endwith %}{{ key }}', {'dict': {'key': 50}}, 'INVALID50-50-50INVALID'],

            'with03': ['{% with a=alpha b=beta %}{{ a }}{{ b }}{% endwith %}', {'alpha': 'A', 'beta': 'B'}, 'AB'],

            'with-error01': ['{% with dict.key xx key %}{{ key }}{% endwith %}', {'dict': {'key': 50}}, Error],
            'with-error02': ['{% with dict.key as %}{{ key }}{% endwith %}', {'dict': {'key': 50}}, Error],

            //LOADING TAG LIBRARIES #################################################
            'load01': ["{% loadtag ./fakepackage/tags %}{% echo test %} {% echo2 test %}", {}, "test test"],
            // ??
            // 'load02': ["{% load subpackage.echo %}{% echo2 \"test\" %}", {}, "test"],

            //{% load %} tag, importing individual tags
            'load03': ["{% loadtag echo from ./fakepackage/tags %}{% echo this that theother %}", {}, 'this that theother'],
            'load04': ["{% loadtag echo other_echo from ./fakepackage/tags %}{% echo this that theother %} {% other_echo and another thing %}", {}, 'this that theother and another thing'],
            // different from django: either filter or tag
            'load05': ["{% loadfilter upper from ./fakepackage/filters %}{{ statement|upper }}", {'statement': 'not shouting'}, 'NOT SHOUTING'],

            //{% load %} tag errors
            'load09': ["{% loadtag from ./fakepackage/tags %}", {}, Error],
            'load09b': ["{% loadfilter from ./fakepackage/tags %}", {}, Error],
            'load10': ["{% loadtag echo from bad_library %}", {}, Error],
            'load11': ["{% loadfilter echo from bad_library %}", {}, Error],

            // WIDTHRATIO TAG ########################################################
            'widthratio01': ['{% widthratio a b 0 %}', {'a':50,'b':100}, '0'],
            'widthratio02': ['{% widthratio a b 100 %}', {'a':0,'b':0}, '0'],
            'widthratio03': ['{% widthratio a b 100 %}', {'a':0,'b':100}, '0'],
            'widthratio04': ['{% widthratio a b 100 %}', {'a':50,'b':100}, '50'],
            'widthratio05': ['{% widthratio a b 100 %}', {'a':100,'b':100}, '100'],

            // 62.5 will round down to 62
            'widthratio06': ['{% widthratio a b 100 %}', {'a':50,'b':80}, '62'],

            // 71.4 should round to 71
            'widthratio07': ['{% widthratio a b 100 %}', {'a':50,'b':70}, '71'],

            // Raise exception if we don't have 3 args, last one an integer
            'widthratio08': ['{% widthratio %}', {}, Error],
            'widthratio09': ['{% widthratio a b %}', {'a':50,'b':100}, Error],
            'widthratio10': ['{% widthratio a b 100.0 %}', {'a':50,'b':100}, '50'],

            // #10043: widthratio should allow max_width to be a variable
            'widthratio11': ['{% widthratio a b c %}', {'a':50,'b':100, 'c': 100}, '50'],

            // #18739: widthratio should handle None args consistently with non-numerics
            'widthratio12a': ['{% widthratio a b c %}', {'a':'a','b':100,'c':100}, ''],
            'widthratio12b': ['{% widthratio a b c %}', {'a':null,'b':100,'c':100}, ''],
            'widthratio13a': ['{% widthratio a b c %}', {'a':0,'b':'b','c':100}, ''],
            'widthratio13b': ['{% widthratio a b c %}', {'a':0,'b':null,'c':100}, ''],
            'widthratio14a': ['{% widthratio a b c %}', {'a':0,'b':100,'c':'c'}, Error],
            'widthratio14b': ['{% widthratio a b c %}', {'a':0,'b':100,'c':null}, Error],
      };

      // run tests twice: debug=true and debug=false
      [false, true].forEach(function(debug) {

         var env = new Environment({loader: new TestTemplateLoader(), debug: debug})
         for (var key in tests) {
               var test = tests[key];
               print (key, 'debug:', debug);
               if (test[2] == Error) {
                     assert.throws(function() {
                                 var t = env.getTemplate(key);
                                 t.render(new Context(test[1]));
                           },
                           test[2],
                           key
                     );
               } else {
                     var template = env.getTemplate(key);
                     assert.strictEqual(template.render(new Context(test[1])), test[2], key);
               }
         }
      });

}


//start the test runner if we're called directly from command line
if (require.main == module.id) {
    require('system').exit(require('test').run(exports, arguments[1]));
}

/*


            //In attribute and dict lookups that raise an unexpected exception
            //without a "silent_variable_attribute" set to true, the exception
            //propagates
            // FIXME 'filter-syntax23': ['1{{ var.noisy_fail_key }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)],
            // FIXME  'filter-syntax24': ['1{{ var.noisy_fail_attribute }}2', {"var": SomeClass()}, (SomeOtherException, SomeOtherException)],

            //EXCEPTIONS ############################################################


            //Raise exception for custom tags used in child with {% load %} tag in parent, not in child
            'exception04': ["{% extends 'inheritance17' %}{% block first %}{% echo 400 %}5678{% endblock %}", {}, Error],

            //Additional, more precise parsing tests are in SmartIfTests


            //INCLUSION ERROR REPORTING #############################################
            'include-fail1': ['{% load bad_tag %}{% badtag %}', {}, RuntimeError],
            'include-fail2': ['{% load broken_tag %}', {}, Error],
            'include-error07': ['{% include "include-fail1" %}', {}, ('', '', RuntimeError)],
            'include-error08': ['{% include "include-fail2" %}', {}, ('', '', Error)],
            'include-error09': ['{% include failed_include %}', {'failed_include': 'include-fail1'}, ('', '', RuntimeError)],
            'include-error10': ['{% include failed_include %}', {'failed_include': 'include-fail2'}, ('', '', Error)],

*/