var c = require('./constants');
var {markSafe} = require('./utils');
var {Context, RenderContext} = require('./context');

/**
  A template variable, resolvable against a given context. The variable may
    be a hard-coded string (if it begins and ends with single or double quote
    marks):

        >>> c = {'article': {'section':u'News'}}
        >>> Variable('article.section').resolve(c)
        u'News'
        >>> Variable('article').resolve(c)
        {'section': u'News'}
        >>> class AClass: pass
        >>> c = AClass()
        >>> c.article = AClass()
        >>> c.article.section = u'News'
*/

var Variable = exports.Variable = function(variable) {
    this.variable = variable;
    this.literal = null;
    this.lookups = null;
    var first  = variable.charAt(0);
    var last = variable.slice(-1);
    if (!isNaN(parseInt(variable))) {
        this.literal = variable.indexOf('.') > -1 ? parseFloat(variable) : parseInt(variable);
    } else if (first == '"' && first == last) {
        // FIXME what does unescape_string_literal do?
        this.literal = markSafe(variable.slice(1, -1));
    } else {
        if (variable == 'true') {
            this.literal = true;
        } else if (variable == 'false') {
            this.literal = false;
        } else if (variable == 'null') {
            this.literal = null;
        } else {
            this.lookups = variable.split(c.VARIABLE_ATTRIBUTE_SEPARATOR);
        }
    }
    return this;
}

Variable.prototype.resolve = function(context) {
    if (this.lookups) {
        var current = context;
        for (var i = 0; i< this.lookups.length; i++) {
            var base = current;
            var part = this.lookups[i];
            if (current instanceof Context || current instanceof RenderContext) {
                current = current.get(part);
            } else {
                current = current[part];
            }
            if (current === undefined || current === null) {
                break;
            }
            // FIXME security don't exec functions with altersData=true
            if (typeof(current) === 'function') {
                current = current.call(base);
            }
            // FIXME why date _normalize? how does it help dojo?
        }
        return current;
    } else {
        return this.literal;
    }
}

Variable.prototype.toString = function() {
    return this.literal || this.lookups.join('.');
}