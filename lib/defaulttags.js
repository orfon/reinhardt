var {NodeList} = require('./nodelist');

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
IfEqualNode.prototype.render = function(context) {
   var val1 = this.var1.resolve(context, true);
   var val2 = this.var2.resolve(context, true);
   if ( (this.negate && val1 != val2) || (!this.negate && val1 == val2)) {
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

/**
 * ForNode
 */
var ForNode = function(loopVars, sequence, isReversed, nodeListLoop, nodeListEmpty) {
  this.loopVars = loopVars;
  this.sequence = sequence;
  this.isReversed = isReversed;
  this.nodeListLoop = nodeListLoop;
  if (nodeListEmpty) {
    this.nodeListEmpty = nodeListEmpty;
  } else {
    this.nodeListEmpty = new NodeList();
  }
  return this;
}

ForNode.prototype.render = function(context) {
  var parentLoop = {};
  if (context.has('forloop')) {
    parentLoop = context.get('forloop');
  }
  context.push();
  var values = this.sequence.resolve(context, true) || [];
  if (!values instanceof Array) {
    values = [values];
  }
  // FIXME if values is object put the property values into an array
  var lenValues = values.length;
  if (lenValues < 1) {
    context.pop();
    return this.nodeListEmpty.render(context);
  }
  var nodeList = new NodeList();
  if (this.isReversed) {
    values = values.slice(0);
    values.reverse();
  }
  var loopDict = {'parentloop': parentLoop};
  context.set('forloop', loopDict);
  values.forEach(function(item, i) {
    loopDict.counter0 = i;
    loopDict.counter = i+1;
    loopDict.revcounter = lenValues - i;
    loopDict.revcounter0 = lenValues - i - 1;
    loopDict.first = (i == 0);
    loopDict.last = (i == lenValues - 1);
    var popContext = false;
    if (this.loopVars.length > 1) {
      try {
        var zipped = {};
        for (var k = 0; k < item.length && k < this.loopVars.length; k++) {
          zipped[this.loopVars[k]] = item[k];
        }
        popContext = true;
        context.update(zipped);
      } catch (e) {}
    } else {
      context.set(this.loopVars[0], item);
    }
    this.nodeListLoop.contents.forEach(function(node) {
      nodeList.push(node.render(context));
    });
    /*
     The loop variables were pushed on to the context so pop them
     off again. This is necessary because the tag lets the length
     of loopVars differ to the length of each set of items and we
     don't want to leave any vars from the previous loop on the
     context.
    */
    if (popContext) {
      context.pop();
    }
  }, this);
  context.pop();
  return nodeList.render(context);
}

/**
    Loops over each item in an array.
    For example, to display a list of athletes given ``athlete_list``::

        <ul>
        {% for athlete in athlete_list %}
            <li>{{ athlete.name }}</li>
        {% endfor %}
        </ul>

    You can loop over a list in reverse by using
    ``{% for obj in list reversed %}``.

    You can also unpack multiple values from a two-dimensional array::

        {% for key,value in dict.items %}
            {{ key }}: {{ value }}
        {% endfor %}

    The ``for`` tag can take an optional ``{% empty %}`` clause that will
    be displayed if the given array is empty or could not be found::

        <ul>
          {% for athlete in athlete_list %}
            <li>{{ athlete.name }}</li>
          {% empty %}
            <li>Sorry, no athletes in this list.</li>
          {% endfor %}
        <ul>

    The above is equivalent to -- but shorter, cleaner, and possibly faster
    than -- the following::

        <ul>
          {% if althete_list %}
            {% for athlete in athlete_list %}
              <li>{{ athlete.name }}</li>
            {% endfor %}
          {% else %}
            <li>Sorry, no athletes in this list.</li>
          {% endif %}
        </ul>

    The for loop sets a number of variables available within the loop:

        ==========================  ================================================
        Variable                    Description
        ==========================  ================================================
        ``forloop.counter``         The current iteration of the loop (1-indexed)
        ``forloop.counter0``        The current iteration of the loop (0-indexed)
        ``forloop.revcounter``      The number of iterations from the end of the
                                    loop (1-indexed)
        ``forloop.revcounter0``     The number of iterations from the end of the
                                    loop (0-indexed)
        ``forloop.first``           True if this is the first time through the loop
        ``forloop.last``            True if this is the last time through the loop
        ``forloop.parentloop``      For nested loops, this is the loop "above" the
                                    current one
        ==========================  ================================================
 */
exports.for = function(parser, token) {
  var bits = token.splitContents();
  if (bits.length < 4) {
    throw new Error("'for' statements should have at least for words: " + token.contents);
  }
  var isReversed = bits.slice(-1)[0] === 'reversed';
  var inIndex = isReversed ? -3 : -2;
  if (bits.slice(inIndex)[0] != 'in') {
    throw new Error("'for' statements should use the format 'for x in y': " + token.contents);
  }
  var loopVars = bits.slice(1, inIndex).join(' ').split(/ *, */);
  for (var i = 0; i< loopVars.length; i++) {
    if (!loopVars[i] || loopVars[i].indexOf(' ') > -1) {
      throw new Error("'for' tag received an invalid argument: " + token.contents);
    }
  }
  var sequence = parser.compileFilter(bits.slice(inIndex+1)[0]);
  var nodeListLoop = parser.parse(['empty', 'endfor']);
  var token = parser.nextToken();
  var nodeListEmpty = null;
  if (token.contents === 'empty') {
    nodeListEmpty = parser.parse(['endfor']);
    parser.deleteFirstToken();
  }
  return new ForNode(loopVars, sequence, isReversed, nodeListLoop, nodeListEmpty);
}