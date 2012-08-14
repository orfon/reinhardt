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

var FilterNode = function(filterExpr, nodeList) {
   this.filterExpr = filterExpr;
   this.nodeList = nodeList;
   return this;
}
FilterNode.prototype.getByType = Node.prototype.getByType;
FilterNode.prototype.render = function(context) {
   var output = this.nodeList.render(context);
   // apply filters
   context.update({'var': output});
   var filtered = this.filterExpr.resolve(context);
   context.pop();
   return filtered;
}

/*
    Filters the contents of the block through variable filters.

    Filters can also be piped through each other, and they can have
    arguments -- just like in variable syntax.

    Sample usage::

        {% filter force_escape|lower %}
            This text will be HTML-escaped, and will appear in lowercase.
        {% endfilter %}

    Note that the ``escape`` and ``safe`` filters are not acceptable arguments.
    Instead, use the ``autoescape`` tag to manage autoescaping for blocks of
    template code.
*/
exports.filter = function(parser, token) {
   var rest = token.contents.split(/\s+/)[1];
   var filterExpr = parser.compileFilter("var|" + rest);
   // FIXME I don't know name of functions used as filters but I
   // should throw a warning if "safe" or "escape" or used
   var nodeList = parser.parse(['endfilter']);
   parser.deleteFirstToken();
   return new FilterNode(filterExpr, nodeList);
}