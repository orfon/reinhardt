const constants = require('./constants');
const {markSafe} = require('./utils');
const {Context, RenderContext} = require('./context');

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

const Variable = exports.Variable = function(variable) {
    const first = variable.charAt(0);
    const last = variable.slice(-1);
    let literal = null;
    let lookups = null;
    if (!isNaN(parseInt(variable))) {
        literal = variable.indexOf('.') > -1 ? parseFloat(variable) : parseInt(variable);
    } else if (first === '"' && first === last) {
        // FIXME what does unescape_string_literal do?
        literal = markSafe(variable.slice(1, -1));
    } else {
        if (variable === 'true') {
            literal = true;
        } else if (variable === 'false') {
            literal = false;
        } else if (variable === 'null') {
            literal = null;
        } else {
            lookups = variable.split(constants.VARIABLE_ATTRIBUTE_SEPARATOR);
        }
    }
    Object.defineProperties(this, {
        variable: {value: variable},
        literal: {value: literal},
        lookups: {value: lookups}
    });
    return this;
};

Variable.prototype.resolve = function(context) {
    if (this.lookups) {
        let current = context;
        for (let i = 0; i < this.lookups.length; i++) {
            let base = current;
            let part = this.lookups[i];
            if (current instanceof Context || current instanceof RenderContext) {
                current = current.get(part);
            } else {
                current = current[part];
            }
            if (current === undefined || current === null) {
                break;
            }
            // FIXME security don't exec functions with altersData=true
            if (typeof (current) === 'function') {
                current = current.call(base);
            }
            // FIXME why date _normalize? how does it help dojo?
        }
        return current;
    }
    return this.literal;
};

Variable.prototype.toString = function() {
    return this.literal || this.lookups.join('.');
};