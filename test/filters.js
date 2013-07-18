var assert = require("assert");
var {markSafe} = require('../lib/utils');
var {Template} = require('../lib/template');
var {Context} = require('../lib/context');
var {Environment} = require('../lib/environment');

var UnsafeClass = function() {
    return this;
}
UnsafeClass.prototype.toString = function() {
    return 'you & me';
}

var SafeClass = function() {
    return this;
}
SafeClass.prototype.toString = function() {
    return markSafe('you &gt; me');
}

exports.testFilters = function() {

    // 'template_name': ['template contents', 'context dict',
    //                   'expected string output' or Exception class)
    var tests = {
        'filter-addslash01': ["{% autoescape off %}{{ a|addslashes }} {{ b|addslashes }}{% endautoescape %}", {"a": "<a>'", "b": markSafe("<a>'")}, '<a>\\\' <a>\\\''],
        'filter-addslash02': ["{{ a|addslashes }} {{ b|addslashes }}", {"a": "<a>'", "b": markSafe("<a>'")}, '&lt;a&gt;\\\&#39; <a>\\\''],

        'filter-capfirst01': ["{% autoescape off %}{{ a|capfirst }} {{ b|capfirst }}{% endautoescape %}", {"a": "fred>", "b": markSafe("fred&gt;")}, "Fred> Fred&gt;"],
        'filter-capfirst02': ["{{ a|capfirst }} {{ b|capfirst }}", {"a": "fred>", "b": markSafe("fred&gt;")}, "Fred&gt; Fred&gt;"],

        // Note that applying fix_ampsersands in autoescape mode leads to
        // double escaping.
        'filter-fix_ampersands01': ["{% autoescape off %}{{ a|fixampersands }} {{ b|fixampersands }}{% endautoescape %}", {"a": "a&b", "b": markSafe("a&b")}, "a&amp;b a&amp;b"],
        'filter-fix_ampersands02': ["{{ a|fixampersands }} {{ b|fixampersands }}", {"a": "a&b", "b": markSafe("a&b")}, "a&amp;amp;b a&amp;b"],

        'filter-floatformat01': ["{% autoescape off %}{{ a|floatformat }} {{ b|floatformat }}{% endautoescape %}", {"a": "1.42", "b": markSafe("1.42")}, "1.4 1.4"],
        'filter-floatformat02': ["{{ a|floatformat }} {{ b|floatformat }}", {"a": "1.42", "b": markSafe("1.42")}, "1.4 1.4"],

        // The contents of "linenumbers" is escaped according to the current
        // autoescape setting.
        // FIXME nope the filters work the same no matter how autoescape is set
        /*'filter-linenumbers01': ["{{ a|linenumbers }} {{ b|linenumbers }}", {"a": "one\n<two>\nthree", "b": markSafe("one\n&lt;two&gt;\nthree")}, "1. one\n2. &lt;two&gt;\n3. three 1. one\n2. &lt;two&gt;\n3. three"],
        'filter-linenumbers02': ["{% autoescape off %}{{ a|linenumbers }} {{ b|linenumbers }}{% endautoescape %}", {"a": "one\n<two>\nthree", "b": markSafe("one\n&lt;two&gt;\nthree")}, "1. one\n2. <two>\n3. three 1. one\n2. &lt;two&gt;\n3. three"],
        */
        'filter-lower01': ["{% autoescape off %}{{ a|lower }} {{ b|lower }}{% endautoescape %}", {"a": "Apple & banana", "b": markSafe("Apple &amp; banana")}, "apple & banana apple &amp; banana"],
        'filter-lower02': ["{{ a|lower }} {{ b|lower }}", {"a": "Apple & banana", "b": markSafe("Apple &amp; banana")}, "apple &amp; banana apple &amp; banana"],

        // The make_list filter can destroy existing escaping, so the results are
        // escaped.
        'filter-make_list01': ["{% autoescape off %}{{ a|make_list }}{% endautoescape %}", {"a": markSafe("&")}, '&'],
        // NOTE django returns `['&']` for toString of array whereas js returns `'&'`
        'filter-make_list02': ["{{ a|make_list }}", {"a": markSafe("'&'")}, "&#39;,&amp;,&#39;"],

        // FIXME missing stringformat
        //'filter-make_list03': ['{% autoescape off %}{{ a|make_list|stringformat:"s"|safe }}{% endautoescape %}', {"a": markSafe("&")}, str_prefix("[%(_)s'&']")],
        //'filter-make_list04': ['{{ a|make_list|stringformat:"s"|safe }}', {"a": markSafe("&")}, str_prefix("[%(_)s'&']")],

        // Running slugify on a pre-escaped string leads to odd behavior,
        // but the result is still safe.
        'filter-slugify01': ["{% autoescape off %}{{ a|slugify }} {{ b|slugify }}{% endautoescape %}", {"a": "a & b", "b": markSafe("a &amp; b")}, "a-b a-amp-b"],
        'filter-slugify02': ["{{ a|slugify }} {{ b|slugify }}", {"a": "a & b", "b": markSafe("a &amp; b")}, "a-b a-amp-b"],

        // Notice that escaping is applied *after* any filters, so the string
        // formatting here only needs to deal with pre-escaped characters.
        /*'filter-stringformat01': ['{% autoescape off %}.{{ a|stringformat:"5s" }}. .{{ b|stringformat:"5s" }}.{% endautoescape %}',
            {"a": "a<b", "b": markSafe("a<b")}, ".  a<b. .  a<b."],
        'filter-stringformat02': ['.{{ a|stringformat:"5s" }}. .{{ b|stringformat:"5s" }}.', {"a": "a<b", "b": markSafe("a<b")},
            ".  a&lt;b. .  a<b."],
        */

        // Test the title filter
        'filter-title1' : ['{{ a|title }}', {'a' : 'JOE\'S CRAB SHACK'}, 'Joe&#39;s Crab Shack'],
        'filter-title2' : ['{{ a|title }}', {'a' : '555 WEST 53RD STREET'}, '555 West 53rd Street'],

        'filter-truncatewords01': ['{% autoescape off %}{{ a|truncatewords:"2" }} {{ b|truncatewords:"2"}}{% endautoescape %}',
            {"a": "alpha & bravo", "b": markSafe("alpha &amp; bravo")}, "alpha & ... alpha &amp; ..."],
        'filter-truncatewords02': ['{{ a|truncatewords:"2" }} {{ b|truncatewords:"2"}}',
            {"a": "alpha & bravo", "b": markSafe("alpha &amp; bravo")}, "alpha &amp; ... alpha &amp; ..."],

        'filter-truncatechars01': ['{{ a|truncatechars:5 }}', {'a': "Testing, testing"}, "Te..."],
        'filter-truncatechars02': ['{{ a|truncatechars:7 }}', {'a': "Testing"}, "Testing"],

        // The "upper" filter messes up entities (which are case-sensitive],
        // so it's not safe for non-escaping purposes.
        'filter-upper01': ['{% autoescape off %}{{ a|upper }} {{ b|upper }}{% endautoescape %}', {"a": "a & b", "b": markSafe("a &amp; b")}, "A & B A &AMP; B"],
        'filter-upper02': ['{{ a|upper }} {{ b|upper }}', {"a": "a & b", "b": markSafe("a &amp; b")}, "A &amp; B A &amp;AMP; B"],
        'filter-wordcount01': ['{% autoescape off %}{{ a|wordcount }} {{ b|wordcount }}{% endautoescape %}', {"a": "a & b", "b": markSafe("a &amp; b")}, "3 3"],
        'filter-wordcount02': ['{{ a|wordcount }} {{ b|wordcount }}', {"a": "a & b", "b": markSafe("a &amp; b")}, "3 3"],

        'filter-wordwrap01': ['{% autoescape off %}{{ a|wordwrap:"3" }} {{ b|wordwrap:"3" }}{% endautoescape %}', {"a": "a & b", "b": markSafe("a & b")}, "a &\nb a &\nb"],
        'filter-wordwrap02': ['{{ a|wordwrap:"3" }} {{ b|wordwrap:"3" }}', {"a": "a & b", "b": markSafe("a & b")}, "a &amp;\nb a &\nb"],

        'filter-ljust01': ['{% autoescape off %}.{{ a|ljust:"5" }}. .{{ b|ljust:"5" }}.{% endautoescape %}', {"a": "a&b", "b": markSafe("a&b")}, ".a&b  . .a&b  ."],
        'filter-ljust02': ['.{{ a|ljust:"5" }}. .{{ b|ljust:"5" }}.', {"a": "a&b", "b": markSafe("a&b")}, ".a&amp;b  . .a&b  ."],

        'filter-rjust01': ['{% autoescape off %}.{{ a|rjust:"5" }}. .{{ b|rjust:"5" }}.{% endautoescape %}', {"a": "a&b", "b": markSafe("a&b")}, ".  a&b. .  a&b."],
        'filter-rjust02': ['.{{ a|rjust:"5" }}. .{{ b|rjust:"5" }}.', {"a": "a&b", "b": markSafe("a&b")}, ".  a&amp;b. .  a&b."],

        'filter-center01': ['{% autoescape off %}.{{ a|center:"5" }}. .{{ b|center:"5" }}.{% endautoescape %}', {"a": "a&b", "b": markSafe("a&b")}, ". a&b . . a&b ."],
        'filter-center02': ['.{{ a|center:"5" }}. .{{ b|center:"5" }}.', {"a": "a&b", "b": markSafe("a&b")}, ". a&amp;b . . a&b ."],

        'filter-cut01': ['{% autoescape off %}{{ a|cut:"x" }} {{ b|cut:"x" }}{% endautoescape %}', {"a": "x&y", "b": markSafe("x&amp;y")}, "&y &amp;y"],
        'filter-cut02': ['{{ a|cut:"x" }} {{ b|cut:"x" }}', {"a": "x&y", "b": markSafe("x&amp;y")}, "&amp;y &amp;y"],
        'filter-cut03': ['{% autoescape off %}{{ a|cut:"&" }} {{ b|cut:"&" }}{% endautoescape %}', {"a": "x&y", "b": markSafe("x&amp;y")}, "xy xamp;y"],
        'filter-cut04': ['{{ a|cut:"&" }} {{ b|cut:"&" }}', {"a": "x&y", "b": markSafe("x&amp;y")}, "xy xamp;y"],
        // Passing ';' to cut can break existing HTML entities, so those strings
        // are auto-escaped.
        'filter-cut05': ['{% autoescape off %}{{ a|cut:";" }} {{ b|cut:";" }}{% endautoescape %}', {"a": "x&y", "b": markSafe("x&amp;y")}, "x&y x&ampy"],
        'filter-cut06': ['{{ a|cut:";" }} {{ b|cut:";" }}', {"a": "x&y", "b": markSafe("x&amp;y")}, "x&amp;y x&amp;ampy"],

        // The "escape" filter works the same whether autoescape is on or off,
        // but it has no effect on strings already marked as safe.
        'filter-escape01': ['{{ a|escape }} {{ b|escape }}', {"a": "x&y", "b": markSafe("x&y")}, "x&amp;y x&y"],
        'filter-escape02': ['{% autoescape off %}{{ a|escape }} {{ b|escape }}{% endautoescape %}', {"a": "x&y", "b": markSafe("x&y")}, "x&amp;y x&y"],

        // It is only applied once, regardless of the number of times it
        // appears in a chain.
        'filter-escape03': ['{% autoescape off %}{{ a|escape|escape }}{% endautoescape %}', {"a": "x&y"}, "x&amp;y"],
        'filter-escape04': ['{{ a|escape|escape }}', {"a": "x&y"}, "x&amp;y"],

        // Force_escape is applied immediately. It can be used to provide
        // double-escaping, for example.
        'filter-force-escape01': ['{% autoescape off %}{{ a|force_escape }}{% endautoescape %}', {"a": "x&y"}, "x&amp;y"],
        'filter-force-escape02': ['{{ a|force_escape }}', {"a": "x&y"}, "x&amp;y"],
        'filter-force-escape03': ['{% autoescape off %}{{ a|force_escape|force_escape }}{% endautoescape %}', {"a": "x&y"}, "x&amp;amp;y"],
        'filter-force-escape04': ['{{ a|force_escape|force_escape }}', {"a": "x&y"}, "x&amp;amp;y"],

        // Because the result of force_escape is "safe", an additional
        // escape filter has no effect.
        'filter-force-escape05': ['{% autoescape off %}{{ a|force_escape|escape }}{% endautoescape %}', {"a": "x&y"}, "x&amp;y"],
        'filter-force-escape06': ['{{ a|force_escape|escape }}', {"a": "x&y"}, "x&amp;y"],
        'filter-force-escape07': ['{% autoescape off %}{{ a|escape|force_escape }}{% endautoescape %}', {"a": "x&y"}, "x&amp;y"],
        'filter-force-escape08': ['{{ a|escape|force_escape }}', {"a": "x&y"}, "x&amp;y"],

        // The contents in "linebreaks" and "linebreaksbr" are escaped
        // according to the current autoescape setting.
        'filter-linebreaks01': ['{{ a|linebreaks }} {{ b|linebreaks }}', {"a": "x&\ny", "b": markSafe("x&\ny")}, "<p>x&amp;<br />y</p> <p>x&<br />y</p>"],
        'filter-linebreaks02': ['{% autoescape off %}{{ a|linebreaks }} {{ b|linebreaks }}{% endautoescape %}', {"a": "x&\ny", "b": markSafe("x&\ny")}, "<p>x&<br />y</p> <p>x&<br />y</p>"],

        'filter-linebreaksbr01': ['{{ a|linebreaksbr }} {{ b|linebreaksbr }}', {"a": "x&\ny", "b": markSafe("x&\ny")}, "x&amp;<br />y x&<br />y"],
        'filter-linebreaksbr02': ['{% autoescape off %}{{ a|linebreaksbr }} {{ b|linebreaksbr }}{% endautoescape %}', {"a": "x&\ny", "b": markSafe("x&\ny")}, "x&<br />y x&<br />y"],

        'filter-safe01': ["{{ a }} -- {{ a|safe }}", {"a": "<b>hello</b>"}, "&lt;b&gt;hello&lt;/b&gt; -- <b>hello</b>"],
        'filter-safe02': ["{% autoescape off %}{{ a }} -- {{ a|safe }}{% endautoescape %}", {"a": "<b>hello</b>"}, "<b>hello</b> -- <b>hello</b>"],

        // FIXME missing filter safeseq
        //'filter-safeseq01': ['{{ a|join:", " }} -- {{ a|safeseq|join:", " }}', {"a": ["&", "<"]}, "&amp;, &lt; -- &, <"],
        //'filter-safeseq02': ['{% autoescape off %}{{ a|join:", " }} -- {{ a|safeseq|join:", " }}{% endautoescape %}', {"a": ["&", "<"]}, "&, < -- &, <"],
        // Literal string arguments to the default filter are always treated as
        // safe strings, regardless of the auto-escaping state.

        // Note: we have to use {"a": ""} here, otherwise the invalid template
        // variable string interferes with the test result.
        'filter-default01': ['{{ a|default:"x<" }}', {"a": ""}, "x<"],
        'filter-default02': ['{% autoescape off %}{{ a|default:"x<" }}{% endautoescape %}', {"a": ""}, "x<"],
        'filter-default03': ['{{ a|default:"x<" }}', {"a": markSafe("x>")}, "x>"],
        'filter-default04': ['{% autoescape off %}{{ a|default:"x<" }}{% endautoescape %}', {"a": markSafe("x>")}, "x>"],

        'filter-default_if_null01': ['{{ a|default:"x<" }}', {"a": null}, "x<"],
        'filter-default_if_null02': ['{% autoescape off %}{{ a|default:"x<" }}{% endautoescape %}', {"a": null}, "x<"],
        // Chaining a bunch of safeness-preserving filters should not alter
        // the safe status either way.
        'chaining01': ['{{ a|capfirst|center:"7" }}.{{ b|capfirst|center:"7" }}', {"a": "a < b", "b": markSafe("a < b")}, " A &lt; b . A < b "],
        'chaining02': ['{% autoescape off %}{{ a|capfirst|center:"7" }}.{{ b|capfirst|center:"7" }}{% endautoescape %}', {"a": "a < b", "b": markSafe("a < b")}, " A < b . A < b "],

        // Using a filter that forces a string back to unsafe:
        'chaining03': ['{{ a|cut:"b"|capfirst }}.{{ b|cut:"b"|capfirst }}', {"a": "a < b", "b": markSafe("a < b")}, "A &lt; .A < "],
        'chaining04': ['{% autoescape off %}{{ a|cut:"b"|capfirst }}.{{ b|cut:"b"|capfirst }}{% endautoescape %}', {"a": "a < b", "b": markSafe("a < b")}, "A < .A < "],

        // Using a filter that forces safeness does not lead to double-escaping
        'chaining05': ['{{ a|escape|capfirst }}', {"a": "a < b"}, "A &lt; b"],
        'chaining06': ['{% autoescape off %}{{ a|escape|capfirst }}{% endautoescape %}', {"a": "a < b"}, "A &lt; b"],

        // Force to safe, then back (also showing why using force_escape too
        // early in a chain can lead to unexpected results).
        'chaining07': ['{{ a|force_escape|cut:";" }}', {"a": "a < b"}, "a &amp;lt b"],
        'chaining08': ['{% autoescape off %}{{ a|force_escape|cut:";" }}{% endautoescape %}', {"a": "a < b"}, "a &lt b"],
        'chaining09': ['{{ a|cut:";"|force_escape }}', {"a": "a < b"}, "a &lt; b"],
        'chaining10': ['{% autoescape off %}{{ a|cut:";"|force_escape }}{% endautoescape %}', {"a": "a < b"}, "a &lt; b"],
        'chaining11': ['{{ a|cut:"b"|safe }}', {"a": "a < b"}, "a < "],
        'chaining12': ['{% autoescape off %}{{ a|cut:"b"|safe }}{% endautoescape %}', {"a": "a < b"}, "a < "],
        'chaining13': ['{{ a|safe|force_escape }}', {"a": "a < b"}, "a &lt; b"],
        'chaining14': ['{% autoescape off %}{{ a|safe|force_escape }}{% endautoescape %}', {"a": "a < b"}, "a &lt; b"],

        // Filters decorated with stringfilter still respect is_safe.
        'autoescape-stringfilter01': ['{{ unsafe|capfirst }}', {'unsafe': new UnsafeClass()}, 'You &amp; me'],
        'autoescape-stringfilter02': ['{% autoescape off %}{{ unsafe|capfirst }}{% endautoescape %}', {'unsafe': new UnsafeClass()}, 'You & me'],
        'autoescape-stringfilter03': ['{{ safe|capfirst }}', {'safe': new SafeClass()}, 'You &gt; me'],
        'autoescape-stringfilter04': ['{% autoescape off %}{{ safe|capfirst }}{% endautoescape %}', {'safe': new SafeClass()}, 'You &gt; me'],

        // length filter.
        'length01': ['{{ list|length }}', {'list': ['4', null, true, {}]}, '4'],
        'length02': ['{{ list|length }}', {'list': []}, '0'],
        'length03': ['{{ string|length }}', {'string': ''}, '0'],
        'length04': ['{{ string|length }}', {'string': 'django'}, '6'],
        // Invalid uses that should fail silently.
        'length05': ['{{ int|length }}', {'int': 7}, ''],
        'length06': ['{{ null|length }}', {'null': null}, ''],

        // length_is filter.
        'length_is01': ['{% if some_list|length_is:"4" %}Four{% endif %}', {'some_list': ['4', null, true, {}]}, 'Four'],
        'length_is02': ['{% if some_list|length_is:"4" %}Four{% else %}Not Four{% endif %}', {'some_list': ['4', null, true, {}, 17]}, 'Not Four'],
        'length_is03': ['{% if mystring|length_is:"4" %}Four{% endif %}', {'mystring': 'word'}, 'Four'],
        'length_is04': ['{% if mystring|length_is:"4" %}Four{% else %}Not Four{% endif %}', {'mystring': 'Python'}, 'Not Four'],
        'length_is05': ['{% if mystring|length_is:"4" %}Four{% else %}Not Four{% endif %}', {'mystring': ''}, 'Not Four'],
        // FIXME width not implemented
        // 'length_is06': ['{% with var|length as my_length %}{{ my_length }}{% endwith %}', {'var': 'django'}, '6'],
        // Boolean return value from length_is should not be coerced to a string

        // FIXME filterexpression regex does not understand constant with double quotes: "X"|length_is:0
        'length_is07': ['{% if x|length_is:0 %}Length is 0{% else %}Length not 0{% endif %}', {x: "X"}, 'Length not 0'],
        'length_is08': ['{% if x|length_is:1 %}Length is 1{% else %}Length not 1{% endif %}', {x: "X"}, 'Length is 1'],
        // Invalid uses that should fail silently.
        'length_is09': ['{{ var|length_is:"fish" }}', {'var': 'django'}, ''],
        // WONTFIX this actually makes sense in JS
        // 'length_is10': ['{{ int|length_is:"1" }}', {'int': 7}, ''],
        'length_is11': ['{{ null|length_is:"1" }}', {'null': null}, ''],

        'join01': ['{{ a|join:", " }}', {'a': ['alpha', 'beta & me']}, 'alpha, beta &amp; me'],
        'join02': ['{% autoescape off %}{{ a|join:", " }}{% endautoescape %}', {'a': ['alpha', 'beta & me']}, 'alpha, beta & me'],
        'join03': ['{{ a|join:" &amp; " }}', {'a': ['alpha', 'beta & me']}, 'alpha &amp; beta &amp; me'],
        'join04': ['{% autoescape off %}{{ a|join:" &amp; " }}{% endautoescape %}', {'a': ['alpha', 'beta & me']}, 'alpha &amp; beta & me'],

        // Test that joining with unsafe joiners don't result in unsafe strings (#11377)
        'join05': ['{{ a|join:var }}', {'a': ['alpha', 'beta & me'], 'var': ' & '}, 'alpha &amp; beta &amp; me'],
        'join06': ['{{ a|join:var }}', {'a': ['alpha', 'beta & me'], 'var': markSafe(' & ')}, 'alpha & beta &amp; me'],
        'join07': ['{{ a|join:var|lower }}', {'a': ['Alpha', 'Beta & me'], 'var': ' & ' }, 'alpha &amp; beta &amp; me'],
        'join08': ['{{ a|join:var|lower }}', {'a': ['Alpha', 'Beta & me'], 'var': markSafe(' & ')}, 'alpha & beta &amp; me'],

        'filter-striptags01': ['{{ a|striptags }} {{ b|striptags }}', {"a": "<a>x</a> <p><b>y</b></p>", "b": markSafe("<a>x</a> <p><b>y</b></p>")}, "x y x y"],
        'filter-striptags02': ['{% autoescape off %}{{ a|striptags }} {{ b|striptags }}{% endautoescape %}', {"a": "<a>x</a> <p><b>y</b></p>", "b": markSafe("<a>x</a> <p><b>y</b></p>")}, "x y x y"],

        'filter-slice01': ['{{ a|slice:"1:3" }} {{ b|slice:"1:3" }}', {"a": "a&b", "b": markSafe("a&b")}, "&amp;b &b"],
        'filter-slice02': ['{% autoescape off %}{{ a|slice:"1:3" }} {{ b|slice:"1:3" }}{% endautoescape %}', {"a": "a&b", "b": markSafe("a&b")}, "&b &b"],

        'filter-removetags01': ['{{ a|removetags:"a b" }} {{ b|removetags:"a b" }}', {"a": "<a>x</a> <p><b>y</b></p>", "b": markSafe("<a>x</a> <p><b>y</b></p>")}, "x &lt;p&gt;y&lt;/p&gt; x <p>y</p>"],
        'filter-removetags02': ['{% autoescape off %}{{ a|removetags:"a b" }} {{ b|removetags:"a b" }}{% endautoescape %}', {"a": "<a>x</a> <p><b>y</b></p>", "b": markSafe("<a>x</a> <p><b>y</b></p>")}, "x <p>y</p> x <p>y</p>"],

        'filter-keys': ['{% for key in obj|keys %} {{key}} {{obj|byKey:key}} {% endfor %}', {"obj": {"a": 1, "b": 2, "c": 3}}, " a 1  b 2  c 3 "],
        'filter-keys': ['{% for key in obj|keys %} {{key}} {{obj|byKey:key}} {% endfor %}', {"obj": [11,22,33,44]}, " 0 11  1 22  2 33  3 44 "],

         // Tests for #11687 and #16676
         'add01': ['{{ i|add:"5" }}', {'i': 2000}, '2005'],
         // we allow this:
         'add02': ['{{ i|add:"napis" }}', {'i': 2000}, '2000napis'],
         // and this:
         'add03': ['{{ i|add:16 }}', {'i': 'not_an_int'}, 'not_an_int16'],
         'add04': ['{{ i|add:"16" }}', {'i': 'not_an_int'}, 'not_an_int16'],
         'add05': ['{{ l1|add:l2 }}', {'l1': [1, 2], 'l2': [3, 4]}, '1,2,3,4'],
         // nope 'add07': ['{{ d|add:t }}', {'d': date(2000, 1, 1], 't': timedelta(10)}, 'Jan. 11, 2000'],

        'date01': ['{{ d|date:"MM" }}', {'d': new Date(2008, 0, 1)}, '01'],
        'date02': ['{{ d|date }}', {'d': new Date(2008, 0, 1)}, 'Jan. 1, 2008'],
         // Ticket 9520: Make sure |date doesn't blow up on non-dates
        'date03': ['{{ d|date:"m" }}', {'d': 'fail_string'}, ''],
        // ISO date formats
        // i don't understand
        // date04': ['{{ d|date:"o" }}', {'d': new Date(2008, 12, 29)}, '2009'],
        // date05': ['{{ d|date:"o" }}', {'d': new Date(2010, 0, 3)}, '2009'],
        // Timezone name
        // how to? 'date06': ['{{ d|date:"e" }}', {'d': new Date(2009, 3, 12, tzinfo=FixedOffset(30))}, '+0030'],
        'date07': ['{{ d|date:"e" }}', {'d': new Date(2009, 3, 12)}, ''],
        'filter-first01': ['{{ a|first }} {{ b|first }}', {"a": ["a&b", "x"], "b": [markSafe("a&b"), "x"]}, "a&amp;b a&b"],
        'filter-first02': ['{% autoescape off %}{{ a|first }} {{ b|first }}{% endautoescape %}', {"a": ["a&b", "x"], "b": [markSafe("a&b"), "x"]}, "a&b a&b"],

        'filter-last01': ['{{ a|last }} {{ b|last }}', {"a": ["x", "a&b"], "b": ["x", markSafe("a&b")]}, "a&amp;b a&b"],
        'filter-last02': ['{% autoescape off %}{{ a|last }} {{ b|last }}{% endautoescape %}', {"a": ["x", "a&b"], "b": ["x", markSafe("a&b")]}, "a&b a&b"],

    };

    [false, true].forEach(function(debug) {
       var env = new Environment({debug: debug});
       for (var key in tests) {
           var test = tests[key];
           print (key, 'debug:', debug);
           if (test[2] == Error) {
                 assert.throws(function() {
                             var t = new Template(test[0], env);
                             t.render(new Context(test[1]));
                       },
                       test[2],
                       key
                 );
           } else {
                 var template = new Template(test[0], env);
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
// Default compare with datetime.now()
        'filter-timesince01' : ['{{ a|timesince }}', {'a': datetime.now() + timedelta(minutes=-1, seconds = -10)}, '1 minute'],
        'filter-timesince02' : ['{{ a|timesince }}', {'a': datetime.now() - timedelta(days=1, minutes = 1)}, '1 day'],
        'filter-timesince03' : ['{{ a|timesince }}', {'a': datetime.now() - timedelta(hours=1, minutes=25, seconds = 10)}, '1 hour, 25 minutes'],

        // Compare to a given parameter
        'filter-timesince04' : ['{{ a|timesince:b }}', {'a':now - timedelta(days=2], 'b':now - timedelta(days=1)}, '1 day'],
        'filter-timesince05' : ['{{ a|timesince:b }}', {'a':now - timedelta(days=2, minutes=1], 'b':now - timedelta(days=2)}, '1 minute'],

        // Check that timezone is respected
        'filter-timesince06' : ['{{ a|timesince:b }}', {'a':now_tz - timedelta(hours=8], 'b':now_tz}, '8 hours'],

        // Regression for #7443
        'filter-timesince07': ['{{ earlier|timesince }}', { 'earlier': now - timedelta(days=7) }, '1 week'],
        'filter-timesince08': ['{{ earlier|timesince:now }}', { 'now': now, 'earlier': now - timedelta(days=7) }, '1 week'],
        'filter-timesince09': ['{{ later|timesince }}', { 'later': now + timedelta(days=7) }, '0 minutes'],
        'filter-timesince10': ['{{ later|timesince:now }}', { 'now': now, 'later': now + timedelta(days=7) }, '0 minutes'],

        // Ensures that differing timezones are calculated correctly
        'filter-timesince11' : ['{{ a|timesince }}', {'a': now}, '0 minutes'],
        'filter-timesince12' : ['{{ a|timesince }}', {'a': now_tz}, '0 minutes'],
        'filter-timesince13' : ['{{ a|timesince }}', {'a': now_tz_i}, '0 minutes'],
        'filter-timesince14' : ['{{ a|timesince:b }}', {'a': now_tz, 'b': now_tz_i}, '0 minutes'],
        'filter-timesince15' : ['{{ a|timesince:b }}', {'a': now, 'b': now_tz_i}, ''],
        'filter-timesince16' : ['{{ a|timesince:b }}', {'a': now_tz_i, 'b': now}, ''],

        // Regression for #9065 (two date objects).
        'filter-timesince17' : ['{{ a|timesince:b }}', {'a': today, 'b': today}, '0 minutes'],
        'filter-timesince18' : ['{{ a|timesince:b }}', {'a': today, 'b': today + timedelta(hours=24)}, '1 day'],

        // Default compare with datetime.now()
        'filter-timeuntil01' : ['{{ a|timeuntil }}', {'a':datetime.now() + timedelta(minutes=2, seconds = 10)}, '2 minutes'],
        'filter-timeuntil02' : ['{{ a|timeuntil }}', {'a':(datetime.now() + timedelta(days=1, seconds = 10))}, '1 day'],
        'filter-timeuntil03' : ['{{ a|timeuntil }}', {'a':(datetime.now() + timedelta(hours=8, minutes=10, seconds = 10))}, '8 hours, 10 minutes'],

        // Compare to a given parameter
        'filter-timeuntil04' : ['{{ a|timeuntil:b }}', {'a':now - timedelta(days=1], 'b':now - timedelta(days=2)}, '1 day'],
        'filter-timeuntil05' : ['{{ a|timeuntil:b }}', {'a':now - timedelta(days=2], 'b':now - timedelta(days=2, minutes=1)}, '1 minute'],

        // Regression for #7443
        'filter-timeuntil06': ['{{ earlier|timeuntil }}', { 'earlier': now - timedelta(days=7) }, '0 minutes'],
        'filter-timeuntil07': ['{{ earlier|timeuntil:now }}', { 'now': now, 'earlier': now - timedelta(days=7) }, '0 minutes'],
        'filter-timeuntil08': ['{{ later|timeuntil }}', { 'later': now + timedelta(days=7, hours=1) }, '1 week'],
        'filter-timeuntil09': ['{{ later|timeuntil:now }}', { 'now': now, 'later': now + timedelta(days=7) }, '1 week'],

        // Ensures that differing timezones are calculated correctly
        'filter-timeuntil10' : ['{{ a|timeuntil }}', {'a': now_tz_i}, '0 minutes'],
        'filter-timeuntil11' : ['{{ a|timeuntil:b }}', {'a': now_tz_i, 'b': now_tz}, '0 minutes'],

        // Regression for #9065 (two date objects).
        'filter-timeuntil12' : ['{{ a|timeuntil:b }}', {'a': today, 'b': today}, '0 minutes'],
        'filter-timeuntil13' : ['{{ a|timeuntil:b }}', {'a': today, 'b': today - timedelta(hours=24)}, '1 day'],


        'filter-urlize01': ['{% autoescape off %}{{ a|urlize }} {{ b|urlize }}{% endautoescape %}', {"a": "http://example.com/?x=&y=", "b": markSafe("http://example.com?x=&amp;y=")}, '<a href="http://example.com/?x=&y=" rel="nofollow">http://example.com/?x=&y=</a> <a href="http://example.com?x=&amp;y=" rel="nofollow">http://example.com?x=&amp;y=</a>'],
        'filter-urlize02': ['{{ a|urlize }} {{ b|urlize }}', {"a": "http://example.com/?x=&y=", "b": markSafe("http://example.com?x=&amp;y=")}, '<a href="http://example.com/?x=&amp;y=" rel="nofollow">http://example.com/?x=&amp;y=</a> <a href="http://example.com?x=&amp;y=" rel="nofollow">http://example.com?x=&amp;y=</a>'],
        'filter-urlize03': ['{% autoescape off %}{{ a|urlize }}{% endautoescape %}', {"a": markSafe("a &amp; b")}, 'a &amp; b'],
        'filter-urlize04': ['{{ a|urlize }}', {"a": markSafe("a &amp; b")}, 'a &amp; b'],

        // This will lead to a nonsense result, but at least it won't be
        // exploitable for XSS purposes when auto-escaping is on.
        'filter-urlize05': ['{% autoescape off %}{{ a|urlize }}{% endautoescape %}', {"a": "<script>alert('foo')</script>"}, "<script>alert('foo')</script>"],
        'filter-urlize06': ['{{ a|urlize }}', {"a": "<script>alert('foo')</script>"}, '&lt;script&gt;alert(&#39;foo&#39;)&lt;/script&gt;'],

        // mailto: testing for urlize
        'filter-urlize07': ['{{ a|urlize }}', {"a": "Email me at me@example.com"}, 'Email me at <a href="mailto:me@example.com">me@example.com</a>'],
        'filter-urlize08': ['{{ a|urlize }}', {"a": "Email me at <me@example.com>"}, 'Email me at &lt;<a href="mailto:me@example.com">me@example.com</a>&gt;'],

        'filter-urlizetrunc01': ['{% autoescape off %}{{ a|urlizetrunc:"8" }} {{ b|urlizetrunc:"8" }}{% endautoescape %}', {"a": '"Unsafe" http://example.com/x=&y=', "b": markSafe('&quot;Safe&quot; http://example.com?x=&amp;y=')}, '"Unsafe" <a href="http://example.com/x=&y=" rel="nofollow">http:...</a> &quot;Safe&quot; <a href="http://example.com?x=&amp;y=" rel="nofollow">http:...</a>'],
        'filter-urlizetrunc02': ['{{ a|urlizetrunc:"8" }} {{ b|urlizetrunc:"8" }}', {"a": '"Unsafe" http://example.com/x=&y=', "b": markSafe('&quot;Safe&quot; http://example.com?x=&amp;y=')}, '&quot;Unsafe&quot; <a href="http://example.com/x=&amp;y=" rel="nofollow">http:...</a> &quot;Safe&quot; <a href="http://example.com?x=&amp;y=" rel="nofollow">http:...</a>'],

        'filter-random01': ['{{ a|random }} {{ b|random }}', {"a": ["a&b", "a&b"], "b": [markSafe("a&b"], markSafe("a&b")]}, "a&amp;b a&b"],
        'filter-random02': ['{% autoescape off %}{{ a|random }} {{ b|random }}{% endautoescape %}', {"a": ["a&b", "a&b"], "b": [markSafe("a&b"], markSafe("a&b")]}, "a&b a&b"],

        'filter-unordered_list01': ['{{ a|unordered_list }}', {"a": ["x>", [["<y", []]]]}, "\t<li>x&gt;\n\t<ul>\n\t\t<li>&lt;y</li>\n\t</ul>\n\t</li>"],
        'filter-unordered_list02': ['{% autoescape off %}{{ a|unordered_list }}{% endautoescape %}', {"a": ["x>", [["<y", []]]]}, "\t<li>x>\n\t<ul>\n\t\t<li><y</li>\n\t</ul>\n\t</li>"],
        'filter-unordered_list03': ['{{ a|unordered_list }}', {"a": ["x>", [[markSafe("<y"], []]]]}, "\t<li>x&gt;\n\t<ul>\n\t\t<li><y</li>\n\t</ul>\n\t</li>"],
        'filter-unordered_list04': ['{% autoescape off %}{{ a|unordered_list }}{% endautoescape %}', {"a": ["x>", [[markSafe("<y"], []]]]}, "\t<li>x>\n\t<ul>\n\t\t<li><y</li>\n\t</ul>\n\t</li>"],
        'filter-unordered_list05': ['{% autoescape off %}{{ a|unordered_list }}{% endautoescape %}', {"a": ["x>", [["<y", []]]]}, "\t<li>x>\n\t<ul>\n\t\t<li><y</li>\n\t</ul>\n\t</li>"],


        'filter-phone2numeric01': ['{{ a|phone2numeric }} {{ b|phone2numeric }}', {"a": "<1-800-call-me>", "b": markSafe("<1-800-call-me>") }, "&lt;1-800-2255-63&gt; <1-800-2255-63>"],
        'filter-phone2numeric02': ['{% autoescape off %}{{ a|phone2numeric }} {{ b|phone2numeric }}{% endautoescape %}', {"a": "<1-800-call-me>", "b": markSafe("<1-800-call-me>") }, "<1-800-2255-63> <1-800-2255-63>"],
        'filter-phone2numeric03': ['{{ a|phone2numeric }}', {"a": "How razorback-jumping frogs can level six piqued gymnasts!"}, "469 729672225-5867464 37647 226 53835 749 747833 49662787!"],

        // Ensure iriencode keeps safe strings:
        'filter-iriencode01': ['{{ url|iriencode }}', {'url': '?test=1&me=2'}, '?test=1&amp;me=2'],
        'filter-iriencode02': ['{% autoescape off %}{{ url|iriencode }}{% endautoescape %}', {'url': '?test=1&me=2'}, '?test=1&me=2'],
        'filter-iriencode03': ['{{ url|iriencode }}', {'url': markSafe('?test=1&me=2')}, '?test=1&me=2'],
        'filter-iriencode04': ['{% autoescape off %}{{ url|iriencode }}{% endautoescape %}', {'url': markSafe('?test=1&me=2')}, '?test=1&me=2'],

        // urlencode
        'filter-urlencode01': ['{{ url|urlencode }}', {'url': '/test&"/me?/'}, '/test%26%22/me%3F/'],
        'filter-urlencode02': ['/test/{{ urlbit|urlencode:"" }}/', {'urlbit': 'escape/slash'}, '/test/escape%2Fslash/'],

        'escapejs01': [r'{{ a|escapejs }}', {'a': 'testing\r\njavascript \'string" <b>escaping</b>'}, 'testing\\u000D\\u000Ajavascript \\u0027string\\u0022 \\u003Cb\\u003Eescaping\\u003C/b\\u003E'],
        'escapejs02': [r'{% autoescape off %}{{ a|escapejs }}{% endautoescape %}', {'a': 'testing\r\njavascript \'string" <b>escaping</b>'}, 'testing\\u000D\\u000Ajavascript \\u0027string\\u0022 \\u003Cb\\u003Eescaping\\u003C/b\\u003E'],

*/