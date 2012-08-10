var {markSafe, isSafe, markForEscaping} = require('../utils');
var {escape} = require('../utils/html');

exports.capfirst = function(value) {
   return value && value.substring(0,1).toUpperCase() + value.substring(1) || '';
}
exports.capfirst.isSafe = true;

exports.lower = function(value) {
   return value && value.toLowerCase() || '';
}
exports.lower.isSafe = true;

exports.upper = function(value) {
   return value && value.toUpperCase() || '';
}
exports.upper.isSafe = false;

/**
  Marks the value as a string that should not be auto-escaped.
*/
exports.safe = function(value) {
   return markSafe(value);
}
exports.safe.isSafe = true;

/*
    Marks the value as a string that should be escaped even if autoescape is off but not if
    the string is already marked as safe
*/
exports.escape = function(value) {
   return markForEscaping(value)
}
exports.escape.isSafe = true;

/*
    Escapes a string's HTML. This returns a new string containing the escaped
    characters (as opposed to "escape", which marks the content for later
    possible escaping).
*/
exports.force_escape = function(value) {
   return escape(value);
}
exports.force_escape.isSafe = true;


/*
    Adds slashes before quotes. Useful for escaping strings in CSV, for
    example. Less useful for escaping JavaScript; use the ``escapejs``
    filter instead.
*/
exports.addslashes = function(value) {
   return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}
exports.addslashes.isSafe = true;

exports.capfirst = function(value) {
   if (typeof(value) !== 'string' && (! (value instanceof String))) {
      value = value && value.toString();
   }
   var out = value && (value.charAt(0).toUpperCase() + value.substring(1));
   return out;
}
exports.capfirst.isSafe = true;

/*
   //    Centers the value in a field of a given width
*/
exports.center = function(value, arg) {
   arg = arg || value.length;
   value = value + "";
   var diff = arg - value.length;
   if(diff % 2){
      value = value + " ";
      diff -= 1;
   }
   for(var i = 0; i < diff; i += 2){
      value = " " + value + " ";
   }
   return value;
}
exports.center.isSafe = true;

/**
    Removes all values of arg from the given string
 */
exports.cut = function(value, arg) {
   var safe = isSafe(value);
   arg = arg + "" || "";
   //value = value + "";
   var out = value.replace(new RegExp(arg, "g"), "");
   if (arg != ';' && safe) {
      return markSafe(out);
   }
   return out;
};

/**
   Replaces ampersands with ``&amp;`` entities
*/
exports.fixampersands = function(value) {
   var regex = /&(?!(\w+|#\d+);)/g;
   return value.replace(regex, "&amp;");
}
exports.fixampersands.isSafe = true;

exports.floatformat = function(value, arg){
   // summary:
   //    Format a number according to arg
   // description:
   //    If called without an argument, displays a floating point
   //    number as 34.2 -- but only if there's a point to be displayed.
   //    With a positive numeric argument, it displays that many decimal places
   //    always.
   //    With a negative numeric argument, it will display that many decimal
   //    places -- but only if there's places to be displayed.
   arg = parseInt(arg || -1, 10);
   value = parseFloat(value);
   var m = value - value.toFixed(0);
   if(!m && arg < 0){
      return value.toFixed();
   }
   value = value.toFixed(Math.abs(arg));
   return (arg < 0) ? parseFloat(value) + "" : value;
};
exports.floatformat.isSafe = true;

/*
var _urlquote = function(url, safe){
   if(!safe){
      safe = "/";
   }
   return Tokenize(url, /([^\w-_.])/g, function(token){
      if(safe.indexOf(token) == -1){
         if(token == " "){
            return "+";
         }else{
            var hex = token.charCodeAt(0).toString(16).toUpperCase();
            while(hex.length < 2){
               hex = "0" + hex;
            }
            return "%" + hex;
         }
      }
      return token;
   }).join("");
};

exports.iriencode = function(value){
   return _urlquote(value, "/#%[]=:;$&()+,!");
};
exports.iriencode.isSafe = true;
*/

// FIXME this will not work in an autoescaped environment
exports.linenumbers = function(value){
   // summary:
   //    Displays text with line numbers
   var lines = value.split("\n");
   var output = [];
   var width = (lines.length + "").length;
   for(var i = 0, line; i < lines.length; i++){
      line = lines[i];
      output.push(ljust(i + 1, width) + ". " + escape(line));
   }
   return output.join("\n");
};
exports.linenumbers.isSafe = true;

var ljust = exports.ljust = function(value, arg){
   value = value + "";
   arg = parseInt(arg, 10);
   while(value.length < arg){
      value = value + " ";
   }
   return value;
};
exports.ljust.isSafe = true;

exports.make_list = function(value){
   // summary:
   //    Returns the value turned into a list. For an integer, it's a list of
   //    digits. For a string, it's a list of characters.
   var output = [];
   if(typeof value == "number"){
      value = value + "";
   }
   if(value.charAt){
      for(var i = 0; i < value.length; i++){
         output.push(value.charAt(i));
      }
      return output;
   }
   if(typeof value == "object"){
      for(var key in value){
         output.push(value[key]);
      }
      return output;
   }
   return [];
};

exports.rjust = function(value, arg){
   value = value + "";
   arg = parseInt(arg, 10);
   while(value.length < arg){
      value = " " + value;
   }
   return value;
};
exports.rjust.isSafe = true;

exports.slugify = function(value){
   // summary:
   //    Converts to lowercase, removes
   //    non-alpha chars and converts spaces to hyphens
   value = value.replace(/[^\w\s-]/g, "").toLowerCase();
   return value.replace(/[\-\s]+/g, "-");
};
exports.slugify.isSafe = true;

// FIXME missing stringformat

exports.title = function(value){
   // summary:
   //    Converts a string into titlecase
   var last, title = "";
   for(var i = 0, current; i < value.length; i++){
      current = value.charAt(i);
      if(last == " " || last == "\n" || last == "\t" || !last){
         title += current.toUpperCase();
      }else{
         title += current.toLowerCase();
      }
      last = current;
   }
   return title;
};
exports.title.isSafe = true;

exports.truncatewords = function(value, arg){
   // summary:
   //    Truncates a string after a certain number of words
   // arg: Integer
   //    Number of words to truncate after
   var _truncatewords = /[ \n\r\t]/;
   arg = parseInt(arg, 10);
   if(!arg){
      return value;
   }

   for(var i = 0, j = value.length, count = 0, current, last; i < value.length; i++){
      current = value.charAt(i);
      if(_truncatewords.test(last)){
         if(!_truncatewords.test(current)){
            ++count;
            if(count == arg){
               return value.substring(0, j + 1) + ' ...';
            }
         }
      }
      if(!_truncatewords.test(current)){
         j = i;
      }
      last = current;
   }
   return value;
};
exports.truncatewords.isSafe = true;

// FIXME missing truncatewords_html
/*
var _urlize = /^((?:[(>]|&lt;)*)(.*?)((?:[.,)>\n]|&gt;)*)$/;
var _urlize2 = /^\S+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+$/;
exports.urlize = function(value){
   return urlizetrunc(value);
};
var urlizetrunc = exports.urlizetrunc = function(value, arg){
   arg = parseInt(arg);
   return Tokenize(value, /(\S+)/g, function(word){
      var matches = dojox.dtl.filter.strings._urlize.exec(word);
      if(!matches){
         return word;
      }
      var lead = matches[1];
      var middle = matches[2];
      var trail = matches[3];

      var startsWww = middle.indexOf("www.") == 0;
      var hasAt = middle.indexOf("@") != -1;
      var hasColon = middle.indexOf(":") != -1;
      var startsHttp = middle.indexOf("http://") == 0;
      var startsHttps = middle.indexOf("https://") == 0;
      var firstAlpha = /[a-zA-Z0-9]/.test(middle.charAt(0));
      var last4 = middle.substring(middle.length - 4);

      var trimmed = middle;
      if(arg > 3){
         trimmed = trimmed.substring(0, arg - 3) + "...";
      }

      if(startsWww || (!hasAt && !startsHttp && middle.length && firstAlpha && (last4 == ".org" || last4 == ".net" || last4 == ".com"))){
         return '<a href="http://' + middle + '" rel="nofollow">' + trimmed + '</a>';
      }else if(startsHttp || startsHttps){
         return '<a href="' + middle + '" rel="nofollow">' + trimmed + '</a>';
      }else if(hasAt && !startsWww && !hasColon && dojox.dtl.filter.strings._urlize2.test(middle)){
         return '<a href="mailto:' + middle + '">' + middle + '</a>';
      }
      return word;
   }).join("");
};
*/

exports.truncatechars = function(value, arg) {
   try {
      var length = parseInt(arg, 10);
   } catch (e) {
      return value;
   }
   if (value.length === length) {
      return value;
   }
   // FIXME this is a stupid filter
   return value.substring(0, length-3) + '...';
}
exports.truncatechars.isSafe = true;

exports.wordcount = function(value){
   value = value.trim();
   if(!value){ return 0; }
   return value.split(/\s+/g).length;
};
exports.wordcount.isSafe = false;

exports.wordwrap = function(value, arg){
   arg = parseInt(arg);
   // summary:
   //    Wraps words at specified line length
   var output = [];
   var parts = value.split(/\s+/g);
   if(parts.length){
      var word = parts.shift();
      output.push(word);
      var pos = word.length - word.lastIndexOf("\n") - 1;
      for(var i = 0; i < parts.length; i++){
         word = parts[i];
         if(word.indexOf("\n") != -1){
            var lines = word.split(/\n/g);
         }else{
            var lines = [word];
         }
         pos += lines[0].length + 1;
         if(arg && pos > arg){
            output.push("\n");
            pos = lines[lines.length - 1].length;
         }else{
            output.push(" ");
            if(lines.length > 1){
               pos = lines[lines.length - 1].length;
            }
         }
         output.push(word);
      }
   }
   return output.join("");
};
exports.wordwrap.isSafe = true;