const {Variable} = require('./variable');
const {isSafe, markSafe, isMarkedForEscaping, markForEscaping} = require('./utils');
const {TemplateSyntaxError} = require('./errors');
const constants = require("./constants");
/*

Parses a variable token and its optional filters (all as a single string),
and return a list of tuples of the filter name and arguments.
Sample::

>>> token = 'variable|default:"Default value"|date:"Y-m-d"'
>>> p = Parser('')
>>> fe = FilterExpression(token, p)
>>> len(fe.filters)
2
>>> fe.var
<Variable: 'variable'>

*/

const FilterExpression = exports.FilterExpression = function(token, parser) {
    /**
     regex groups:
     2   "value" or 'value'
     3   variable

     4 filterName
     6  "value" or 'value'
     7  variable
     */
    if (parser && parser.environment !== undefined) {
        this.stringIfInvalid = parser.environment.TEMPLATE_STRING_IF_INVALID;
    } else {
        this.stringIfInvalid = constants.TEMPLATE_STRING_IF_INVALID;
    }
    this.token = token;
    const filterRe = /\s*(?:(["'])(.*?)\1|([a-zA-Z0-9_.]+)|\|\s*(\w+)(?::(?:(["'])(.*?)\5|([a-zA-Z0-9_.]+)))?)/g;
    const filters = [];
    let varObj = null;
    let upTo = 0;
    let match;
    while ((match = filterRe.exec(token)) !== null) {
        if (match.index !== upTo) {
            throw new TemplateSyntaxError('Could not parse some characters after "' +
                    token.substring(0, match.index) + '", namely: "' +
                    token.substring(upTo, match.index) + '" in "' + token + '"', upTo, match.index);
        }
        let filterName, filterFunc, constant, variable, args;
        if (varObj === null) {
            constant = match[2];
            variable = match[3];
            varObj = (constant !== undefined) ? markSafe(constant) : new Variable(variable);
        } else {
            filterName = match[4];
            constant = match[6];
            variable = match[7];
            filterFunc = parser.filters[filterName];
            if (!filterFunc) {
                throw new TemplateSyntaxError('Unknown filter "' + filterName + '"');
            }
            filterFunc._filterName = filterName;
            if (constant !== undefined || variable !== undefined) {
                args = [{
                    isVariable: variable !== undefined,
                    value: (variable !== undefined) ? new Variable(variable) : markSafe(constant)
                }];
            } else {
                args = [];
            }
            // FIXME args_check whether enough arguments for filter
            filters.push([filterFunc, args]);
        }
        upTo = upTo + match[0].length;
    }
    if (upTo !== token.length) {
        throw new TemplateSyntaxError('Could not parse the remainder: "' + token.substring(upTo) + '"');
    }
    Object.defineProperties(this, {
        filters: {value: filters, enumerable: true},
        varObj: {value: varObj, enumerable: true}
    });
    return this;
};

FilterExpression.prototype.resolve = function(context, ignoreFailures) {
    ignoreFailures = ignoreFailures === true;
    let obj = this.varObj;
    if (obj instanceof Variable) {
        obj = obj.resolve(context);
        if (obj === undefined && ignoreFailures === false) {
            obj = this.stringIfInvalid;
            if (this.stringIfInvalid !== '') {
                if (this.stringIfInvalid.indexOf('%s') > -1) {
                    obj = obj.replace('%s', this.varObj.toString());
                }
                // return immediately without
                // applying the filters
                return obj;
            }
        }
    }
    return this.filters.reduce((obj, filterDef) => {
        const argVals = filterDef[1].map(arg => {
            return (arg.isVariable) ? arg.value.resolve(context) : markSafe(arg.value);
        });
        if (filterDef[0].needsAutoescape === true) {
            argVals.push(context.autoescape);
        }
        const newObj = filterDef[0].apply(null, [obj].concat(argVals));
        //print ('[FilterExpression safeness] filter:', filterDef[0].isSafe, '| obj:', isSafe(obj), '| newObj:', isSafe(newObj));
        // If the filter returns a new string but we know that the filter itself isSafe
        // and the input string was safe, then repair the damage and mark the output
        // as safe
        if (filterDef[0].isSafe === true && isSafe(obj) === true) {
            return markSafe(newObj);
        } else if (isMarkedForEscaping(obj) === true) {
            return markForEscaping(newObj);
        }
        return newObj;
    }, obj);
};