exports.keys = function(value) {
   return Object.keys(value);
}
exports.keys.isSafe = false;

exports.byKey = function(value, arg) {
   return value && value[arg];
}
exports.byKey.isSafe = false;