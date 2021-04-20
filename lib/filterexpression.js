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
     2   "variable"
     3   variable
     9   'variable'

     4 filterName

     6  "value"
     7  variable-value
     8  'value'  || value
     */
    if (parser && parser.environment !== undefined) {
        this.stringIfInvalid = parser.environment.TEMPLATE_STRING_IF_INVALID;
    } else {
        this.stringIfInvalid = constants.TEMPLATE_STRING_IF_INVALID;
    }
    this.token = token;
    const filterRe = /\s*(?:^_\("([^\\"]*(?:\\.[^\\"])*)"\)|^"([^\\"]*(?:\\.[^\\"]*)*)"|^([a-zA-Z0-9_.]+)|\|\s*(\w+)(?::(?:_\("([^\\"]*(?:\\.[^\\"])*)"\)|"([^\\"]*(?:\\.[^\\"]*)*)"|([a-zA-Z0-9_.]+)|'([^\\']*(?:\\.[^\\']*)*)'))?|^'([^\\']*(?:\\.[^\\']*)*)')/g;
    filterRe.lastIndex = 0;
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
        if (varObj === null) {
            let constant = (match[2] !== undefined) ? match[2] : match[9];
            let variable = match[3];
            if (constant !== undefined) {
                constant = '"' + constant + '"';
                varObj = (new Variable(constant)).resolve({});
            } else {
                varObj = new Variable(variable);
            }
        } else {
            let filterName = match[4];
            let args = [];
            let constantArg = match[6] !== undefined ? match[6] : match[8];
            let variableArg = match[7];
            if (constantArg !== undefined) {
                constantArg = '"' + constantArg + '"';
                args.push({
                    isVariable: false,
                    value: (new Variable(constantArg)).resolve({})
                });
            } else if (variableArg) {
                args.push({
                    isVariable: true,
                    value: new Variable(variableArg)
                })
            }
            let filterFunc = parser.filters[filterName];
            if (!filterFunc) {
                throw new TemplateSyntaxError('Unknown filter "' + filterName + '"');
            }
            filterFunc._filterName = filterName;
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
    let obj = null;
    if (this.varObj instanceof Variable) {
        obj = this.varObj.resolve(context);
        if (obj === undefined && ignoreFailures === false) {
            obj = this.stringIfInvalid;
            if (this.stringIfInvalid !== '') {
                if (this.stringIfInvalid.indexOf('%s') > -1) {
                    obj = obj.replace('%s', this.varObj.toString());
                }
                // return immediatly without
                // applying the filters
                return obj;
            }
        }
    } else {
        obj = this.varObj;
    }
    this.filters.forEach(filterDef => {
        let argVals = [];
        filterDef[1].forEach(function(arg) {
            if (arg.isVariable) {
                argVals.push(arg.value.resolve(context));
            } else {
                argVals.push(markSafe(arg.value));
            }
        }, this);
        if (filterDef[0].needsAutoescape === true) {
            argVals.push(context.autoescape);
        }
        let newObj = filterDef[0].apply(null, [obj].concat(argVals));
        //print ('[FilterExpression safeness] filter:', filterDef[0].isSafe, '| obj:', isSafe(obj), '| newObj:', isSafe(newObj));
        // If the filter returns a new string but we know that the filter itself isSafe
        // and the input string was safe, then repair the damage and mark the output
        // as safe
        if (filterDef[0].isSafe === true && isSafe(obj) === true) {
            obj = markSafe(newObj);
        } else if (isMarkedForEscaping(obj) === true) {
            obj = markForEscaping(newObj);
        } else {
            obj = newObj;
        }
    });
    return obj;
};