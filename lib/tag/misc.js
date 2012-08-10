var {Node} = require('../nodes');
var {markSafe} = require('../utils');

var CommentNode = function() {
   return this;
}
CommentNode.prototype.getByType = Node.prototype.getByType;
CommentNode.prototype.render = function(context) {
   return markSafe("");
}

/**
    Ignores everything between ``{% comment %}`` and ``{% endcomment %}``.
 */
exports.comment = function(parser, token) {
   parser.skipPast('endcomment');
   return new CommentNode();
}


var AutoEscapeControlNode = function(setting, nodeList) {
   this.setting = setting;
   this.nodeList = nodeList;
   return this;
}
AutoEscapeControlNode.prototype.getByType = Node.prototype.getByType;
AutoEscapeControlNode.prototype.render = function(context) {
   var oldSetting = context.autoescape;
   context.autoescape = this.setting;
   var output = this.nodeList.render(context);
   context.autoescape = oldSetting;
   if (this.setting) {
      return markSafe(output);
   } else {
      return output;
   }
}

/*
 Force autoescape behaviour for this block.
 */
exports.autoescape = function(parser, token) {
   var args = token.splitContents();
   if (args.length != 2) {
      throw new Error("'Autoescape' tag requires exactly one argument");
   }
   var arg = args[1];
   if (['on', 'off'].indexOf(arg) == -1) {
      throw new Error("'Autoescape' argument should be 'on' or 'off'");
   }
   var nodeList = parser.parse(['endautoescape']);
   parser.deleteFirstToken();
   return new AutoEscapeControlNode(arg === 'on', nodeList);
}