var $s = require('ringo/utils/strings');

var {NodeList} = require('../nodelist');
var {Node} = require('../nodes');
var {IfParser, Literal} = require('../smartif');
var {extend} = require('../utils');
var {TemplateSyntaxError} = require('../errors');

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
   // convert both to string primitive if they are String instances
   // because 'test' !== new String('test')
   if (val1 instanceof String) {
      val1 = val1.toString();
   }
   if (val2 instanceof String) {
      val2 = val2.toString();
   }
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
      throw new TemplateSyntaxError(bits[0] + ' takes two arguments');
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
 * IfNode
 */

var IfNode = function(conditionsNodeLists) {
  this.conditionsNodeLists = conditionsNodeLists;
  return this;
}
// FIXME either this custom getByType
// or a defineProperty "childnodelists" which would
// return smth the normal getByType can work with
IfNode.prototype.getByType = function(type) {
   var nodes = [];
   if (this instanceof type) {
      nodes.push(this);
   }
   this.conditionsNodeLists.forEach(function(conditionNodeList) {
      nodes.push.apply(nodes, conditionNodeList[1].getByType(type));
   }, this);
   return nodes;
}
IfNode.prototype.render = function(context) {
  for (var key in this.conditionsNodeLists) {
    var cnd = this.conditionsNodeLists[key];
    var condition = cnd[0];
    if (condition !== null) {
      //try {
        var match = condition.eval(context);
      /*} catch (e) {
        match = null;
      }*/
    } else {
      match = true;
    }
    if (match) {
      return cnd[1].render(context);
    }
  }
  return '';
}

IfNode.prototype.setEnvironment = function(env) {
  this.conditionsNodeLists.forEach(function(conditionAndList) {
    conditionAndList[1].setEnvironment(env);
  });
}


/**
 * TemplateLiteral
 */

var TemplateLiteral = function(value, text) {
  TemplateLiteral.superConstructor.apply(this, [value]);
  this.text = text; // nicer error msg
  return this;
}
extend(TemplateLiteral, Literal);
TemplateLiteral.prototype.display = function() {
  return this.text;
}
TemplateLiteral.prototype.eval = function(context) {
  return this.value.resolve(context, true);
}

/**
 * TemplateIfParser
 */
var TemplateIfParser = function(parser, tokens) {
  this.templateParser = parser;
  TemplateIfParser.superConstructor.apply(this, [tokens]);
  return this;
}
extend(TemplateIfParser, IfParser);
TemplateIfParser.prototype.createVar = function(value) {
  return new TemplateLiteral(this.templateParser.compileFilter(value), value);
}

/*
 The ``{% if %}`` tag evaluates a variable, and if that variable is "true"
    (i.e., exists, is not empty, and is not a false boolean value), the
    contents of the block are output:

    ::

        {% if athlete_list %}
            Number of athletes: {{ athlete_list|count }}
        {% elif athlete_in_locker_room_list %}
            Athletes should be out of the locker room soon!
        {% else %}
            No athletes.
        {% endif %}

    In the above, if ``athlete_list`` is not empty, the number of athletes will
    be displayed by the ``{{ athlete_list|count }}`` variable.

    As you can see, the ``if`` tag may take one or several `` {% elif %}``
    clauses, as well as an ``{% else %}`` clause that will be displayed if all
    previous conditions fail. These clauses are optional.

    ``if`` tags may use ``or``, ``and`` or ``not`` to test a number of
    variables or to negate a given variable::

        {% if not athlete_list %}
            There are no athletes.
        {% endif %}

        {% if athlete_list or coach_list %}
            There are some athletes or some coaches.
        {% endif %}

        {% if athlete_list and coach_list %}
            Both atheletes and coaches are available.
        {% endif %}

        {% if not athlete_list or coach_list %}
            There are no athletes, or there are some coaches.
        {% endif %}

        {% if athlete_list and not coach_list %}
            There are some athletes and absolutely no coaches.
        {% endif %}

    Comparison operators are also available, and the use of filters is also
    allowed, for example::

        {% if articles|length >= 5 %}...{% endif %}

    Arguments and operators _must_ have a space between them, so
    ``{% if 1>2 %}`` is not a valid if tag.

    All supported operators are: ``or``, ``and``, ``in``, ``not in``
    ``==`` (or ``=``), ``!=``, ``>``, ``>=``, ``<`` and ``<=``.

    Operator precedence follows Python.
*/
exports.if = function(parser, token) {
  // { %if ... %}
  var bits = token.splitContents().slice(1);
  var condition = (new TemplateIfParser(parser, bits)).parse();
  var nodeList = parser.parse(['elif','else', 'endif']);
  var conditionsNodeLists = [[condition, nodeList]];
  var token = parser.nextToken();

  // {% elif ... %} repeatable
  while ($s.startsWith(token.contents, 'elif')) {
    bits = token.splitContents().slice(1);
    let condition = (new TemplateIfParser(parser, bits)).parse();
    let nodeList = parser.parse(['elif', 'else', 'endif']);
    conditionsNodeLists.push([condition, nodeList]);
    token = parser.nextToken();
  }
  // {% else %} optional
  if (token.contents == 'else') {
    let nodeList = parser.parse(['endif']);
    conditionsNodeLists.push([null, nodeList]);
    token = parser.nextToken();
  }
  if (token.contents !== 'endif') {
    throw new TemplateSyntaxError('Missing endif tag');
  }
  return new IfNode(conditionsNodeLists);

}