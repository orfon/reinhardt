var {markSafe} = require('./utils');

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
      // FIXME if instanceof Node...
      if (c.render && typeof(c.render) === 'function') {
         buffer += c.render(context);
      } else {
         buffer += c;
      }
   }
   return markSafe(buffer);
}

NodeList.prototype.getByType = function(type) {
   var nodes = [];
   this.contents.forEach(function(node) {
      nodes.push.apply(nodes, node.getByType(type));
   });
   return nodes;
}