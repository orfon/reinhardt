var smart_split_re = /("(?:[^"\\]*(?:\\.[^"\\]*)*)"|'(?:[^'\\]*(?:\\.[^'\\]*)*)'|[^\s]+)/g;
var split_re = /\s+/g;
var split = function(/*String|RegExp?*/ splitter, /*Integer?*/ limit){
   splitter = splitter || split_re;
   if(!(splitter instanceof RegExp)){
      splitter = new RegExp(splitter, "g");
   }
   if(!splitter.global){
      throw new Error("You must use a globally flagged RegExp with split " + splitter);
   }
   splitter.exec(""); // Reset the global

   var part, parts = [], lastIndex = 0, i = 0;
   while((part = splitter.exec(this))){
      parts.push(this.slice(lastIndex, splitter.lastIndex - part[0].length));
      lastIndex = splitter.lastIndex;
      if(limit && (++i > limit - 1)){
         break;
      }
   }
   parts.push(this.slice(lastIndex));
   return parts;
};

var Token = function(tokenType, contents) {
   this.tokenType = tokenType;
   this.contents = "" + contents.trim();
   this.contents.split = split;
   return this;
}

Token.prototype.split = function() {
   return String.prototype.split.apply(this.contents, arguments);
}

Token.prototype.splitContents = function(limit) {
   var bit, bits = [], i = 0;
   limit = limit || 999;
   while(i++ < limit && (bit = smart_split_re.exec(this.contents))){
      bit = bit[0];
      if(bit.charAt(0) == '"' && bit.slice(-1) == '"'){
         bits.push('"' + bit.slice(1, -1).replace('\\"', '"').replace('\\\\', '\\') + '"');
      }else if(bit.charAt(0) == "'" && bit.slice(-1) == "'"){
         bits.push("'" + bit.slice(1, -1).replace("\\'", "'").replace('\\\\', '\\') + "'");
      }else{
         bits.push(bit);
      }
   }
   return bits;
}