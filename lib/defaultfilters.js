var $d = require('ringo/utils/dates');

exports.capfirst = function(value) {
   return value && value.substring(0,1).toUpperCase() + value.substring(1);
}

exports.lower = function(value) {
   return value.toLowerCase();
}

exports.upper = function(value) {
   return value.toUpperCase();
}

exports.dateFormat = function(value, arg) {
   var format = arg || 'YYY-mm';
   return $d.format(value, format);
}

// NOTE this is like default_if_none in django
exports.defaultifnull = function(value, arg) {
   if (value === null) {
      return arg;
   }
   return value;
}

exports.default = function(value, arg) {
   return value || arg;
}

/**
    Given a string mapping values for true, false and (optionally) null,
    returns one of those strings according to the value:

    ==========  ======================  ==================================
    Value       Argument                Outputs
    ==========  ======================  ==================================
    ``True``    ``"yeah,no,maybe"``     ``yeah``
    ``False``   ``"yeah,no,maybe"``     ``no``
    ``null``    ``"yeah,no,maybe"``     ``maybe``
    ``null``    ``"yeah,no"``           ``"no"`` (converts null to False
                                        if no mapping for null is given.
*/
exports.yesno = function(value, arg) {
   arg = arg || 'yes,no,maybe';
   var bits = arg.split(',');
   if (bits.length < 2) {
      return value;
   }
   var [yes, no, maybe] = bits;
   if (value === null) {
      return maybe;
   }
   if (value) {
      return yes;
   }
   return no;
}

exports.join = function(value, arg) {
   return value.join(arg);
}