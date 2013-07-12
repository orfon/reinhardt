var {Node} = require('../nodes');
var {markSafe} = require('../utils');
var {Context} = require('../context');
var {tokenKwargs} = require('../token');
var fs = require('fs');
var {TemplateSyntaxError} = require('../errors');

var CommentNode = function() {
   return this;
}
CommentNode.prototype.getByType = Node.prototype.getByType;
CommentNode.prototype.render = function(context) {
   return markSafe("");
}

/**
    Ignores everything between ``{% comment %}`` and ``{% endcomment %}``.
 */
exports.comment = function(parser, token) {
   parser.skipPast('endcomment');
   return new CommentNode();
}


var AutoEscapeControlNode = function(setting, nodeList) {
   this.setting = setting;
   this.nodeList = nodeList;
   return this;
}
AutoEscapeControlNode.prototype.getByType = Node.prototype.getByType;
AutoEscapeControlNode.prototype.render = function(context) {
   var oldSetting = context.autoescape;
   context.autoescape = this.setting;
   var output = this.nodeList.render(context);
   context.autoescape = oldSetting;
   if (this.setting) {
      return markSafe(output);
   } else {
      return output;
   }
}

/*
 Force autoescape behaviour for this block.
 */
exports.autoescape = function(parser, token) {
   var args = token.splitContents();
   if (args.length != 2) {
      throw new TemplateSyntaxError("'Autoescape' tag requires exactly one argument");
   }
   var arg = args[1];
   if (['on', 'off'].indexOf(arg) == -1) {
      throw new TemplateSyntaxError("'Autoescape' argument should be 'on' or 'off'");
   }
   var nodeList = parser.parse(['endautoescape']);
   parser.deleteFirstToken();
   return new AutoEscapeControlNode(arg === 'on', nodeList);
}

var FilterNode = function(filterExpr, nodeList) {
   this.filterExpr = filterExpr;
   this.nodeList = nodeList;
   return this;
}
FilterNode.prototype.getByType = Node.prototype.getByType;
FilterNode.prototype.render = function(context) {
   var output = this.nodeList.render(context);
   // apply filters
   context.update({'var': output});
   var filtered = this.filterExpr.resolve(context);
   context.pop();
   return filtered;
}

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
exports.filter = function(parser, token) {
   var rest = token.contents.split(/\s+/)[1];
   var filterExpr = parser.compileFilter("var|" + rest);
   filterExpr.filters.forEach(function(filterInfo) {
      var filterFn = filterInfo[0];
      if (['escape', 'safe'].indexOf(filterFn._filterName) > -1) {
         throw new TemplateSyntaxError("filter " + filterFn._filterName
               + " is not permitted.  Use the 'autoescape' tag instead.")
      }
   });
   var nodeList = parser.parse(['endfilter']);
   parser.deleteFirstToken();
   return new FilterNode(filterExpr, nodeList);
}

var FirstOfNode = function(vars) {
   this.vars = vars;
   return this;
}
FirstOfNode.prototype.getByType = Node.prototype.getByType;
FirstOfNode.prototype.render = function(context) {
   var value = '';
   this.vars.some(function(v) {
      value = v.resolve(context, true);
      if (value) return true;
   });
   if (value) {
      return context.renderValue(value);
   }
   return '';
}


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
exports.firstof = function(parser, token) {
   var bits = token.splitContents().slice(1);
   if (bits.length < 1) {
      throw new TemplateSyntaxError('"firstof" tag requires at least one argument');
   }
   var filterExpressions = bits.map(function(bit) {
      return parser.compileFilter(bit);
   }, this);
   return new FirstOfNode(filterExpressions);
}


var SpacelessNode = function(nodeList) {
   this.nodeList = nodeList;
   return this;
}
SpacelessNode.prototype.getByType = Node.prototype.getByType;
SpacelessNode.prototype.render = function(context) {
   var value = this.nodeList.render(context);
   // first: replace whitespace after >
   // second: replace whitespace before first <
   return value.replace(/>\s+(<|$)/g, '>$1').replace(/^\s</g, '<');
}


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

exports.spaceless = function(parser, token) {
   var nodeList = parser.parse(['endspaceless']);
   parser.deleteFirstToken();
   return new SpacelessNode(nodeList);
}

var VerbatimNode = function(content) {
   this.content = content;
   return this;
}
VerbatimNode.prototype.getByType = Node.prototype.getByType;
VerbatimNode.prototype.render = function(context) {
   return this.content;
}

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
exports.verbatim = function(parser, token) {
   var nodeList = parser.parse(['endverbatim']);
   parser.deleteFirstToken();
   return new VerbatimNode(nodeList.render(new Context()));
}

var WithNode = function(nodeList, extraContext) {
   this.nodeList = nodeList;
   this.extraContext = extraContext;
   return this;
}
WithNode.prototype.getByType = Node.prototype.getByType;
WithNode.prototype.render = function(context) {
   var values = {};
   for (var key in this.extraContext) {
      values[key] = this.extraContext[key].resolve(context);
   }
   context.update(values);
   var output = this.nodeList.render(context);
   context.pop();
   return output;
}

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
exports.with = function(parser, token) {
   var bits = token.splitContents();
   var remainingBits = bits.slice(1);
   var extraContext = tokenKwargs(remainingBits, parser);
   if (!extraContext) {
      throw new TemplateSyntaxError('"with" expected at least on variable assignment');
   }
   if (remainingBits.length > 0) {
      throw new TemplateSyntaxError('"with" received an invalid token: "' + remainingBits[0] + '"');
   }
   var nodeList = parser.parse(['endwith']);
   parser.deleteFirstToken();
   return new WithNode(nodeList, extraContext);
}

var LoadNode = function() {
   return this;
}
LoadNode.prototype.getByType = Node.prototype.getByType;
LoadNode.prototype.render = function(context) {
   return '';
}

var loadFilterOrTag = function(parser, token, addFunction) {
   var bits = token.splitContents();
   if (bits.length >= 4 && bits.slice(-2)[0] == 'from') {
      var tagLib = bits.slice(-1)[0];
      // if tagLib is relative, resolve it relative to the
      // main module of the application
      if (tagLib[0] == '.') {
         tagLib = fs.resolve(require.main.id, tagLib);
      }
      try {
         var lib = require(tagLib);
      } catch (e) {
         throw new Error('"' + tagLib +'" is not a valid filter/tag library: ' + e.toString());
      }
      var tempLib = {};
      bits.slice(1, -2).forEach(function(name) {
         if (name in lib) {
            tempLib[name] = lib[name];
         } else {
            throw new Error('"' + name + '" is not a valid filter/tag in "' + tagLib + '"');
         }
      }, this);
      addFunction.call(parser, tempLib);
   } else {
      bits.slice(1).forEach(function(tagLib) {
         // if tagLib is relative, resolve it relative to the
         // main module of the application
         if (tagLib[0] == '.') {
            tagLib = fs.resolve(require.main.id, tagLib);
         }
         try {
            var lib = require(tagLib);
            addFunction.call(parser, lib);
         } catch (e) {
            throw new Error('"' + tagLib +'" is not a valid filter/tag library: ' + e.toString());
         }
      }, this);
   }
   return new LoadNode();
}

/*
    Loads a custom template tag set.

    For example, to load the template tags in
    ``django/templatetags/news/photos.py``::

        {% load news.photos %}

    Can also be used to load an individual tag/filter from
    a library::

        {% load byline from news %}

*/

exports.loadfilter = function(parser, token) {
   return loadFilterOrTag(parser, token, parser.addFilters);
}

exports.loadtag = function(parser, token) {
   return loadFilterOrTag(parser, token, parser.addTags);
}

var WidthRatioNode = function(valueExpression, maxExpression, maxWidth) {
   this.valueExpression = valueExpression;
   this.maxExpression = maxExpression;
   this.maxWidth = maxWidth;
   return this;
}
WidthRatioNode.prototype.getByType = Node.prototype.getByType;
WidthRatioNode.prototype.render = function(context) {
   var value = this.valueExpression.resolve(context);
   var maxValue = this.maxExpression.resolve(context);
   var maxWidth = parseInt(this.maxWidth.resolve(context), 10);
   if (isNaN(maxWidth)) {
      throw Error("widthratio final argument must be an number")
   }
   try {
      value = parseFloat(value);
      maxValue = parseFloat(maxValue);
      if (isNaN(value) || isNaN(maxValue)) {
         return '';
      }
      var ratio = (value / maxValue) * maxWidth;
   } catch (e) {
      return '';
   }
   if (isNaN(ratio)) {
      return "0";
   }
   return "" + Math.floor(ratio);
}

/**
    For creating bar charts and such, this tag calculates the ratio of a given
    value to a maximum value, and then applies that ratio to a constant.

    For example::

        <img src='bar.gif' height='10' width='{% widthratio this_value max_value 100 %}' />

    Above, if ``this_value`` is 175 and ``max_value`` is 200, the image in
    the above example will be 88 pixels wide (because 175/200 = .875;
    .875 * 100 = 87.5 which is rounded up to 88).
*/
exports.widthratio = function(parser, token) {
   var bits = token.splitContents();
   if (bits.length != 4) {
      throw new TemplateSyntaxError("widthratio takes 3 arguments");
   }
   var [tag, thisValueExpression, maxValueExpression, maxWidth] = bits;
   return new WidthRatioNode(
      parser.compileFilter(thisValueExpression),
      parser.compileFilter(maxValueExpression),
      parser.compileFilter(maxWidth)
   );
}