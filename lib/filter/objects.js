exports.keys = function(value) {
   return Object.keys(value);
}
exports.keys.isSafe = false;

exports.byKey = function(value, arg) {
   return value && value[arg];
}
exports.byKey.isSafe = false;

exports.add = function(value, arg) {
   if (value instanceof Array) {
      if (arg instanceof Array) {
         return value.concat(arg);
      }
      value.push(arg);
      return value;
   }
   var valNum = parseInt(value, 10);
   var argNum = parseInt(arg, 10);
   if (!isNaN(valNum) && !isNaN(argNum)) {
      return valNum + argNum;
   }
   return value + arg;
}