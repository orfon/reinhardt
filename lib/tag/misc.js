const {Node} = require('../nodes');
const {markSafe} = require('../utils');
const {Context} = require('../context');
const {tokenKwargs} = require('../token');
const fs = require('fs');
const {TemplateSyntaxError} = require('../errors');

const CommentNode = function() {
    return this;
};
CommentNode.prototype = Object.create(Node.prototype);
CommentNode.prototype.constructor = CommentNode;

CommentNode.prototype.render = function(context) {
    return "";
};

/**
 Ignores everything between ``{% comment %}`` and ``{% endcomment %}``.
 */
exports.comment = (parser, token) => {
    parser.skipPast('endcomment');
    return new CommentNode();
};


const AutoEscapeControlNode = function(setting, nodeList) {
    Object.defineProperties(this, {
        setting: {value: setting, enumerable: true},
        nodeList: {value: nodeList, enumerable: true}
    });
    return this;
}
AutoEscapeControlNode.prototype = Object.create(Node.prototype);
AutoEscapeControlNode.prototype.constructor = AutoEscapeControlNode;

AutoEscapeControlNode.prototype.render = function(context) {
    const oldSetting = context.autoescape;
    context.autoescape = this.setting;
    const output = this.nodeList.render(context);
    context.autoescape = oldSetting;
    if (this.setting) {
        return markSafe(output);
    }
    return output;
};

/*
 Force autoescape behaviour for this block.
 */
exports.autoescape = (parser, token) => {
    const args = token.splitContents();
    if (args.length !== 2) {
        throw new TemplateSyntaxError("'Autoescape' tag requires exactly one argument");
    }
    const arg = args[1];
    if (['on', 'off'].indexOf(arg) === -1) {
        throw new TemplateSyntaxError("'Autoescape' argument should be 'on' or 'off'");
    }
    const nodeList = parser.parse(['endautoescape']);
    parser.deleteFirstToken();
    return new AutoEscapeControlNode(arg === 'on', nodeList);
};

const FilterNode = function(filterExpr, nodeList) {
    Object.defineProperties(this, {
        filterExpr: {value: filterExpr, enumerable: true},
        nodeList: {value: nodeList, enumerable: true}
    });
    return this;
}
FilterNode.prototype = Object.create(Node.prototype);
FilterNode.prototype.constructor = FilterNode;

FilterNode.prototype.render = function(context) {
    const output = this.nodeList.render(context);
    // apply filters
    context.update({'var': output});
    const filtered = this.filterExpr.resolve(context);
    context.pop();
    return filtered;
};

/*
    Filters the contents of the block through variable filters.

    Filters can also be piped through each other, and they can have
    arguments -- just like in variable syntax.

    Sample usage::

        {% filter force_escape|lower %}
            This text will be HTML-escaped, and will appear in lowercase.
        {% endfilter %}

    Note that the ``escape`` and ``safe`` filters are not acceptable arguments.
    Instead, use the ``autoescape`` tag to manage autoescaping for blocks of
    template code.
*/
exports.filter = (parser, token) => {
    const rest = token.contents.split(/\s+/)[1];
    const filterExpr = parser.compileFilter("var|" + rest);
    filterExpr.filters.forEach(filterInfo => {
        const filterFn = filterInfo[0];
        if (['escape', 'safe'].indexOf(filterFn._filterName) > -1) {
            throw new TemplateSyntaxError("filter " + filterFn._filterName
                    + " is not permitted.  Use the 'autoescape' tag instead.")
        }
    });
    const nodeList = parser.parse(['endfilter']);
    parser.deleteFirstToken();
    return new FilterNode(filterExpr, nodeList);
};

const FirstOfNode = function(vars) {
    Object.defineProperties(this, {
        vars: {value: vars, enumerable: true}
    });
    return this;
};
FirstOfNode.prototype = Object.create(Node.prototype);
FirstOfNode.prototype.constructor = FirstOfNode;

FirstOfNode.prototype.render = function(context) {
    let value = '';
    this.vars.some(variable => {
        value = variable.resolve(context, true);
        if (value) {
            return true;
        }
    });
    if (value) {
        return context.renderValue(value);
    }
    return '';
};


/*
Outputs the first variable passed that is not False, without escaping.

    Outputs nothing if all the passed variables are False.

    Sample usage::

        {% firstof var1 var2 var3 %}

    This is equivalent to::

        {% if var1 %}
            {{ var1|safe }}
        {% else %}{% if var2 %}
            {{ var2|safe }}
        {% else %}{% if var3 %}
            {{ var3|safe }}
        {% endif %}{% endif %}{% endif %}

    but obviously much cleaner!

    You can also use a literal string as a fallback value in case all
    passed variables are False::

        {% firstof var1 var2 var3 "fallback value" %}

    If you want to escape the output, use a filter tag::

        {% filter force_escape %}
            {% firstof var1 var2 var3 "fallback value" %}
        {% endfilter %}
*/
exports.firstof = (parser, token) => {
    const bits = token.splitContents().slice(1);
    if (bits.length < 1) {
        throw new TemplateSyntaxError('"firstof" tag requires at least one argument');
    }
    const filterExpressions = bits.map(bit => parser.compileFilter(bit));
    return new FirstOfNode(filterExpressions);
};


const SpacelessNode = function(nodeList) {
    Object.defineProperties(this, {
        nodeList: {value: nodeList, enumerable: true}
    });
    return this;
};
SpacelessNode.prototype = Object.create(Node.prototype);
SpacelessNode.prototype.constructor = SpacelessNode;

SpacelessNode.prototype.render = function(context) {
    // first: replace whitespace after >
    // second: replace whitespace before first <
    return this.nodeList.render(context)
            .replace(/>\s+(<|$)/g, '>$1')
            .replace(/^\s</g, '<');
};


/*
    Removes whitespace between HTML tags, including tab and newline characters.

    Example usage::

        {% spaceless %}
            <p>
                <a href="foo/">Foo</a>
            </p>
        {% endspaceless %}

    This example would return this HTML::

        <p><a href="foo/">Foo</a></p>

    Only space between *tags* is normalized -- not space between tags and text.
    In this example, the space around ``Hello`` won't be stripped::

        {% spaceless %}
            <strong>
                Hello
            </strong>
        {% endspaceless %}
*/

exports.spaceless = (parser) => {
    const nodeList = parser.parse(['endspaceless']);
    parser.deleteFirstToken();
    return new SpacelessNode(nodeList);
};

const VerbatimNode = function(content) {
    Object.defineProperties(this, {
        content: {value: content, enumerable: true}
    });
    return this;
};
VerbatimNode.prototype = Object.create(Node.prototype);
VerbatimNode.prototype.constructor = VerbatimNode;

VerbatimNode.prototype.render = function(context) {
    return this.content;
};

/*
    Stops the template engine from rendering the contents of this block tag.

    Usage::

        {% verbatim %}
            {% don't process this %}
        {% endverbatim %}

    You can also designate a specific closing tag block (allowing the
    unrendered use of ``{% endverbatim %}``)::

        {% verbatim myblock %}
            ...
        {% endverbatim myblock %}
*/
exports.verbatim = (parser) => {
    const nodeList = parser.parse(['endverbatim']);
    parser.deleteFirstToken();
    return new VerbatimNode(nodeList.render(new Context()));
};

const WithNode = function(nodeList, extraContext) {
    Object.defineProperties(this, {
        nodeList: {value: nodeList, enumerable: true},
        extraContext: {value: extraContext, enumerable: true}
    });
    return this;
};
WithNode.prototype = Object.create(Node.prototype);
WithNode.prototype.constructor = WithNode;

WithNode.prototype.render = function(context) {
    const values = {};
    Object.keys(this.extraContext).forEach(key => {
        values[key] = this.extraContext[key].resolve(context);
    });
    context.update(values);
    const output = this.nodeList.render(context);
    context.pop();
    return output;
};

/*
    Adds one or more values to the context (inside of this block) for caching
    and easy access.

    For example::

        {% with total=person.some_sql_method %}
            {{ total }} object{{ total|pluralize }}
        {% endwith %}

    Multiple values can be added to the context::

        {% with foo=1 bar=2 %}
            ...
        {% endwith %}

    The legacy format of ``{% with person.some_sql_method as total %}`` is
    still accepted.
*/
exports.with = (parser, token) => {
    const bits = token.splitContents();
    const remainingBits = bits.slice(1);
    const extraContext = tokenKwargs(remainingBits, parser);
    if (!extraContext) {
        throw new TemplateSyntaxError('"with" expected at least on variable assignment');
    }
    if (remainingBits.length > 0) {
        throw new TemplateSyntaxError('"with" received an invalid token: "' + remainingBits[0] + '"');
    }
    const nodeList = parser.parse(['endwith']);
    parser.deleteFirstToken();
    return new WithNode(nodeList, extraContext);
};

const LoadNode = function() {
    return this;
}
LoadNode.prototype = Object.create(Node.prototype);
LoadNode.prototype.constructor = LoadNode;

LoadNode.prototype.render = function(context) {
    return '';
};

const loadFilterOrTag = (parser, token, addFunction) => {
    const bits = token.splitContents();
    let lib;
    if (bits.length >= 4 && bits.slice(-2)[0] === 'from') {
        let tagLib = bits.slice(-1)[0];
        // if tagLib is relative, resolve it relative to the
        // main module of the application
        if (tagLib[0] === '.') {
            tagLib = fs.resolve(require.main.id, tagLib);
        }
        try {
            lib = require(tagLib);
        } catch (e) {
            throw new Error('"' + tagLib + '" is not a valid filter/tag library: ' + e.toString());
        }
        const tempLib = {};
        bits.slice(1, -2).forEach(name => {
            if (lib.hasOwnProperty(name)) {
                tempLib[name] = lib[name];
            } else {
                throw new Error('"' + name + '" is not a valid filter/tag in "' + tagLib + '"');
            }
        });
        addFunction.call(parser, tempLib);
    } else {
        bits.slice(1).forEach(tagLib => {
            // if tagLib is relative, resolve it relative to the
            // main module of the application
            if (tagLib[0] === '.') {
                tagLib = fs.resolve(require.main.id, tagLib);
            }
            try {
                const lib = require(tagLib);
                addFunction.call(parser, lib);
            } catch (e) {
                throw new Error('"' + tagLib + '" is not a valid filter/tag library: ' + e.toString());
            }
        });
    }
    return new LoadNode();
};

/*
    Loads a custom template tag set.

    For example, to load the template tags in
    ``django/templatetags/news/photos.py``::

        {% load news.photos %}

    Can also be used to load an individual tag/filter from
    a library::

        {% load byline from news %}

*/

exports.loadfilter = (parser, token) => {
    return loadFilterOrTag(parser, token, parser.addFilters);
};

exports.loadtag = (parser, token) => {
    return loadFilterOrTag(parser, token, parser.addTags);
};

const WidthRatioNode = function(valueExpression, maxExpression, maxWidth) {
    Object.defineProperties(this, {
        valueExpression: {value: valueExpression, enumerable: true},
        maxExpression: {value: maxExpression, enumerable: true},
        maxWidth: {value: maxWidth, enumerable: true}
    });
    return this;
}
WidthRatioNode.prototype = Object.create(Node.prototype);
WidthRatioNode.prototype.constructor = WidthRatioNode;

WidthRatioNode.prototype.render = function(context) {
    const maxWidth = parseInt(this.maxWidth.resolve(context), 10);
    let value = this.valueExpression.resolve(context);
    let maxValue = this.maxExpression.resolve(context);
    if (isNaN(maxWidth)) {
        throw Error("widthratio final argument must be an number")
    }
    let ratio;
    try {
        value = parseFloat(value);
        maxValue = parseFloat(maxValue);
        if (isNaN(value) || isNaN(maxValue)) {
            return '';
        }
        ratio = (value / maxValue) * maxWidth;
    } catch (e) {
        return '';
    }
    if (isNaN(ratio)) {
        return "0";
    }
    return "" + Math.floor(ratio);
};

/**
 For creating bar charts and such, this tag calculates the ratio of a given
 value to a maximum value, and then applies that ratio to a constant.

 For example::

 <img src='bar.gif' height='10' width='{% widthratio this_value max_value 100 %}' />

 Above, if ``this_value`` is 175 and ``max_value`` is 200, the image in
 the above example will be 88 pixels wide (because 175/200 = .875;
 .875 * 100 = 87.5 which is rounded up to 88).
 */
exports.widthratio = (parser, token) => {
    const bits = token.splitContents();
    if (bits.length !== 4) {
        throw new TemplateSyntaxError("widthratio takes 3 arguments");
    }
    const [tag, thisValueExpression, maxValueExpression, maxWidth] = bits;
    return new WidthRatioNode(
            parser.compileFilter(thisValueExpression),
            parser.compileFilter(maxValueExpression),
            parser.compileFilter(maxWidth)
    );
};