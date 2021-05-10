exports.keys = (value) => {
   return Object.keys(value);
}
exports.keys.isSafe = false;

exports.byKey = (value, arg) => {
   return value && value[arg];
}
exports.byKey.isSafe = false;

exports.add = (value, arg) => {
   if (Array.isArray(value)) {
      if (Array.isArray(arg)) {
         return value.concat(arg);
      }
      value.push(arg);
      return value;
   }
   const valNum = parseInt(value, 10);
   const argNum = parseInt(arg, 10);
   if (!isNaN(valNum) && !isNaN(argNum)) {
      return valNum + argNum;
   }
   return value + arg;
};