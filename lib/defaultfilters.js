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
   return (new Date(value)).format(format);
}