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
      var c = this.contents[i];
      if (typeof(c) === 'string' || typeof(c) === 'number') {
         buffer += c;
      } else {
         buffer += c.render(context);
      }
   }
   return buffer;
}

NodeList.prototype.getByType = function(type) {
   var nodes = [];
   this.contents.forEach(function(node) {
      nodes.push.apply(nodes, node.getByType(type));
   });
   return nodes;
}