const {markSafe} = require('./utils');

const NodeList = exports.NodeList = function() {
   this.contents = [];
   return this;
};
NodeList.prototype.push = function(c) {
   this.contents.push(c);
};
NodeList.prototype.render = function(context) {
   const buffer = [];
   for (let i = 0; i< this.contents.length; i++) {
      let c = this.contents[i];
      // FIXME if instanceof Node...
      if (c && c.render && typeof(c.render) === 'function') {
         buffer.push(this.renderNode(c, context));
      } else {
         buffer.push(c);
      }
   }
   return markSafe(buffer.join(""));
};

NodeList.prototype.renderNode = function(node, context) {
   return node.render(context);
};

NodeList.prototype.getByType = function(type) {
   const nodes = [];
   this.contents.forEach(function(node) {
      nodes.push.apply(nodes, node.getByType(type));
   });
   return nodes;
};

NodeList.prototype.setEnvironment = function(env) {
   this.contents.forEach(function(node) {
      // this is duck typed `node instanceof NodeList`.
      // e.g. the IfNode is not instanceof NodeList but needs to handle
      // setEnvironment.
      if (typeof(node.setEnvironment) === 'function') {
         node.setEnvironment(env);
      } else {
         // otherwise set the `env` directly on the node
         // and search the node for other NodeLists (we don't use duck typing here 
         // because those objects are less under our control than the things
         // in a nodelist and could accidently have setEnvironment)
         node.env = env;
         Object.keys(node).forEach(key => {
            const value = node[key];
            if (value instanceof NodeList) {
               value.setEnvironment(env);
            }
         });
      }
   });
}