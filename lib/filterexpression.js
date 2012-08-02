var {Variable} = require('./variable');

/**
 *
    2   "variable"
    3   variable
    9   'variable'

    4 filterName

    6  "value"
    7  variable-value
    8  'value'  || value


 */
var filterRe =  /(?:^_\("([^\\"]*(?:\\.[^\\"])*)"\)|^"([^\\"]*(?:\\.[^\\"]*)*)"|^([a-zA-Z0-9_.]+)|\|(\w+)(?::(?:_\("([^\\"]*(?:\\.[^\\"])*)"\)|"([^\\"]*(?:\\.[^\\"]*)*)"|([a-zA-Z0-9_.]+)|'([^\\']*(?:\\.[^\\']*)*)'))?|^'([^\\']*(?:\\.[^\\']*)*)')/g;

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

var FilterExpression = exports.FilterExpression = function(token, parser) {
    this.token = token;
    var varObj = null;
    var filters = [];
    var upTo = 0;
    var match;
    filterRe.lastIndex = 0;
    while ((match = filterRe.exec(token)) !== null) {
        if (match.index != upTo) {
            throw new Error('Could not parse some characters: ' +
                    token.substring(0, match.index) + ', ' + token.substring(match.index, upTo));
        }
        if (varObj === null) {
            // FIXME only [10] and not [9]??
            var constant = match[2] || match[9];
            var variable = match[3];
            if (constant) {
                constant = '"' + constant + '"';
                varObj = (new Variable(constant)).resolve({});
            } else {
                varObj = new Variable(variable);
            }
        } else {
            var filterName = match[4];
            var args = [];
            var constantArg = match[6] || match[8];
            var variableArg = match[7];
            if (constantArg) {
                constantArg = '"' + constantArg + '"';
                args.push({
                    isVariable: false,
                    value: (new Variable(constantArg)).resolve({}),
                });
            } else if (variableArg) {
                args.push({
                    isVariable: true,
                    value: (new Variable(variableArg)).resolve({})
                })
            }
            var filterFunc = parser.filters[filterName];
            if (!filterFunc) {
                throw new Error('Unknown filter "' + filterName + '"');
            }
            // FIXME args_check whether enough arguments for filter
            filters.push([filterFunc, args]);
        }
        upTo = upTo + match[0].length;
    }
    if (upTo != token.length) {
        throw new Error('Could not parse the remainder:', token.substring(upTo));
    }
    this.filters = filters;
    this.varObj = varObj;
    return this;
}

// FIXME ignoreFailures
FilterExpression.prototype.resolve = function(context) {
    var obj = null;
    if (this.varObj instanceof Variable) {
        obj = this.varObj.resolve(context);
        // FIXME handle failure
    } else {
        obj = this.varObj;
    }
    for (var idx in this.filters) {
        var filterDef = this.filters[idx];
        var argVals = [];
        filterDef[1].forEach(function(arg) {
            if (arg.isVariable) {
                argVals.push(arg.resolve(context));
            } else {
                // FIXME mark_safe what does it do?
                argVals.push(arg.value);
            }
        }, this);
        obj = filterDef[0].apply(null, [obj].concat(argVals));
    };
    return obj;
}