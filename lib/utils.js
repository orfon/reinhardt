exports.extend = function(subClass, superClass) {
   if (subClass === undefined) {
      throw new Error('unknown subClass');
   }
   if (superClass === undefined) {
      throw new Error('unknown superClass');
   }
   // new Function() is evil
   var f = new Function();
   f.prototype = superClass.prototype;

   subClass.prototype = new f();
   subClass.prototype.constructor = subClass;
   subClass.superClass = superClass.prototype;
   subClass.superConstructor = superClass;
   return;
};

exports.markSafe = function(text) {
   var value = text;
   if (typeof(text) !== 'string' && !(text instanceof String)) {
      if (text && typeof(text.toString) === 'function') {
         value = text.toString();
      } else {
         value = JSON.stringify(text);
      }
   }
   if (value.isSafe === true) {
      return value;
   }
   // must be string instance or we can't attach properties to it
   if (! (value instanceof String)) {
      value = new String(value);
   }
   value.isSafe = true;
   return value;
}

exports.isSafe = function(text) {
   var value = text;
   // if not already string, try to convert to
   // this is useful if you have an object whose string representation
   // you want to use
   if (typeof(text) !== 'string' && !(text instanceof String)) {
      if (text && typeof(text.toString) === 'function') {
         value = text.toString();
      } else {
         return false;
      }
   }
   return (value && value.isSafe === true) || false;
}

exports.markForEscaping = function(text) {
   var value = text;
   if (typeof(text) !== 'string' && !(text instanceof String)) {
      if (text && typeof(text.toString) === 'function') {
         value = text.toString();
      } else {
         value = JSON.stringify(text);
      }
   }

   if (value.doEscape === true || value.isSafe === true) {
      return value;
   }
   // must be string instance or we can't attach properties to it
   if (!(value instanceof String)) {
      value = new String(value);
   }
   value.doEscape = true;
   return value;
}

exports.isMarkedForEscaping = function(text) {
   // if not string -> not marked
   if (typeof(text) !== 'string' && !(text instanceof String)) {
      return false;
   }
   return (text && text.doEscape === true);
}