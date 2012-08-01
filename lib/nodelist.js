var NodeList = exports.NodeList = function() {
   this.contents = [];
   return this;
}
NodeList.prototype.push = function(c) {
   this.contents.push(c);
}
NodeList.prototype.render = function(context) {
   var buffer = "";
   for (var i = 0; i< this.contents.length; i++) {
      buffer += this.contents[i].render(context);
   }
   return buffer;
}