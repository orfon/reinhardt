var {NodeList} = require('../nodelist');
var {Node} = require('../nodes');
/**
 * IfEqualNode
 */
var IfEqualNode = function(var1, var2, nodeListTrue, nodeListFalse, negate) {
   this.var1 = var1;
   this.var2 = var2;
   this.nodeListTrue = nodeListTrue;
   this.nodeListFalse = nodeListFalse;
   this.negate = negate;
   return this;
}
IfEqualNode.prototype.getByType = Node.prototype.getByType;

IfEqualNode.prototype.render = function(context) {
   var val1 = this.var1.resolve(context, true);
   var val2 = this.var2.resolve(context, true);
   if ( (this.negate && val1 !== val2) || (!this.negate && val1 === val2)) {
      return this.nodeListTrue.render(context);
   }
   return this.nodeListFalse.render(context);
}

// FIXME what are they used for?
// IfEqualNode.childNodeLists = ['nodeListTrue', 'nodeListFalse'];

/*
    Outputs the contents of the block if the two arguments equal each other.

    Examples::

        {% ifequal user.id comment.user_id %}
            ...
        {% endifequal %}

        {% ifnotequal user.id comment.user_id %}
            ...
        {% else %}
            ...
        {% endifnotequal %}
*/

var doIfEqual = function(parser, token, negate) {
   var bits = token.splitContents();
   if (bits.length != 3) {
      throw new Error(bits[0] + ' takes two arguments');
   }
   var endTag = 'end' + bits[0];
   var nodeListTrue = parser.parse(['else', endTag]);
   var token = parser.nextToken();
   if (token.contents == 'else') {
      var nodeListFalse = parser.parse([endTag]);
      parser.deleteFirstToken();
   } else {
      var nodeListFalse = new NodeList();
   }
   var val1 = parser.compileFilter(bits[1]);
   var val2 = parser.compileFilter(bits[2]);
   return new IfEqualNode(val1, val2, nodeListTrue, nodeListFalse, negate);
}
exports.ifequal = function(parser, token) {
   return doIfEqual(parser, token, false);
}

exports.ifnotequal = function(parser, token) {
   return doIfEqual(parser, token, true);
}