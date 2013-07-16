var {NodeList} = require('../nodelist');
var {Node} = require('../nodes');
var iter = require('../utils/iter');
var {TemplateSyntaxError} = require('../errors');

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
ForNode.prototype.getByType = Node.prototype.getByType;

ForNode.prototype.render = function(context) {
  var parentLoop = {};
  if (context.has('forloop')) {
    parentLoop = context.get('forloop');
  }
  context.push();
  var values = this.sequence.resolve(context, true) || [];
  if (typeof(values) === 'string') {
    values = values.split('');
  } else if (! (values instanceof Array)) {
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
    throw new TemplateSyntaxError("'for' statements should have at least for words");
  }
  var isReversed = bits.slice(-1)[0] === 'reversed';
  var inIndex = isReversed ? -3 : -2;
  if (bits.slice(inIndex)[0] != 'in') {
    throw new TemplateSyntaxError("'for' statements should use the format 'for x in y'");
  }
  var loopVars = bits.slice(1, inIndex).join(' ').split(/ *, */);
  for (var i = 0; i< loopVars.length; i++) {
    if (!loopVars[i] || loopVars[i].indexOf(' ') > -1) {
      throw new TemplateSyntaxError("'for' tag received an invalid argument");
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

/**
 * CycleNode
 */
var CycleNode = function(cyclevars, variableName, silent) {
  this.cyclevars = cyclevars;
  this.variableName = variableName;
  this.silent = silent || false;
  // uuit for toString() so i can put the object into renderContext
  this.uuid = java.util.UUID.randomUUID().toString();
  return this;
}
CycleNode.prototype.render = function(context) {
  if (! context.renderContext.has(this.uuid)) {
    context.renderContext.set(this.uuid, iter.cycle(this.cyclevars));
  }
  var cycleIter = context.renderContext.get(this.uuid);
  var value = cycleIter.next().resolve(context);
  if (this.variableName) {
    context.set(this.variableName, value);
  }
  if (this.silent) {
    return '';
  }
  return context.renderValue(value);
}
CycleNode.prototype.toString = function() {
  return this.uid;
}

CycleNode.prototype.getByType = Node.prototype.getByType;


/*
    Cycles among the given strings each time this tag is encountered.

    Within a loop, cycles among the given strings each time through
    the loop::

        {% for o in some_list %}
            <tr class="{% cycle 'row1' 'row2' %}">
                ...
            </tr>
        {% endfor %}

    Outside of a loop, give the values a unique name the first time you call
    it, then use that name each sucessive time through::

            <tr class="{% cycle 'row1' 'row2' 'row3' as rowcolors %}">...</tr>
            <tr class="{% cycle rowcolors %}">...</tr>
            <tr class="{% cycle rowcolors %}">...</tr>

    You can use any number of values, separated by spaces. Commas can also
    be used to separate values; if a comma is used, the cycle values are
    interpreted as literal strings.

    The optional flag "silent" can be used to prevent the cycle declaration
    from returning any value::

        {% cycle 'row1' 'row2' as rowcolors silent %}{# no value here #}
        {% for o in some_list %}
            <tr class="{% cycle rowcolors %}">{# first value will be "row1" #}
                ...
            </tr>
        {% endfor %}
*/
/*
    # Note: This returns the exact same node on each {% cycle name %} call;
    # that is, the node object returned from {% cycle a b c as name %} and the
    # one returned from {% cycle name %} are the exact same object. This
    # shouldn't cause problems (heh), but if it does, now you know.
    #
    # Ugly hack warning: This stuffs the named template dict into parser so
    # that names are only unique within each template (as opposed to using
    # a global variable, which would make cycle names have to be unique across
    # *all* templates.
*/
exports.cycle = function(parser, token) {
  var args = token.splitContents();
  if (args.length < 2)  {
    throw new TemplateSyntaxError('"cycle" tag requires at least two arguments');
  }
  if (args[1].indexOf(',') > -1) {
    // backwarsd compat with commas
    var pArgs = args[1].split(',').map(function(arg) {
      return '"' + arg + '"';
    });
    args.splice.apply(args, [1, 1].concat(pArgs));
  }

  if (args.length == 2) {
    // {% cycle foo %} case
    var name = args[1];
    if (! (name in parser.namedCycleNodes) ) {
      throw new TemplateSyntaxError('Named cycle ' + name + ' does not exist');
    }
    return parser.namedCycleNodes[name];
  }
  var asForm = false;
  var silent = false;
  if (args.length > 4) {
    // {% cycle ... as for [silent] %} case
    if (args.slice(-3)[0] == 'as') {
      if (args.slice(-1)[0] != 'silent') {
        throw new TemplateSyntaxError('Only "silent" flag is allowed after cycle\'s name');
      }
      asForm = true;
      silent = true;
      args = args.slice(0, -1);
    } else if (args.slice(-2)[0] == 'as') {
      asForm = true;
      silent = false;
    }
  }
  if (asForm) {
    var name = args.slice(-1)[0];
    var values = args.slice(1, -2).map(function(arg) {
      return parser.compileFilter(arg);
    });
    var node = new CycleNode(values, name, silent = silent);
    parser.namedCycleNodes[name] = node;
  } else {
    var values = args.slice(1).map(function(arg) {
      return parser.compileFilter(arg);
    });
    var node = new CycleNode(values);
  }
  return node;
}

var IfChangedNode = function(nodeListTrue, nodeListFalse, varList) {
  this.nodeListTrue = nodeListTrue;
  this.nodeListFalse = nodeListFalse;
  this.lastSeen = undefined;
  this.varList = varList && varList.length ? varList : null;
  this.id = java.util.UUID.randomUUID().toString();
  return this;
}
IfChangedNode.prototype.getByType = Node.prototype.getByType;
IfChangedNode.prototype.render = function(context) {
  if (context.has('forloop') && ! (this.id in context.get('forloop'))) {
    this.lastSeen = undefined;
    context.get('forloop')[this.id] = 1;
  }
  var nodeListTrueOutput = null;
  if (this.varList) {
    var compareTo = this.varList.map(function(v) {
      return v.resolve(context, true);
    });
    // FIXME catch except value error
  } else {
    var compareTo = nodeListTrueOutput = [this.nodeListTrue.render(context)];
  }
  var isEqual = this.lastSeen !== undefined && compareTo.every(function(ct, idx) {
    if (ct instanceof String) {
      ct = ct.toString();
    }
    var last = this.lastSeen[idx];
    if (last instanceof String) {
      last = last.toString();
    }
    return ct == last;
  }, this);
  if (isEqual) {
    return this.nodeListFalse.render(context);
  } else {
    this.lastSeen = compareTo.slice();
    return nodeListTrueOutput || this.nodeListTrue.render(context);
  }
  return '';
}

/**
    Checks if a value has changed from the last iteration of a loop.

    The ``{% ifchanged %}`` block tag is used within a loop. It has two
    possible uses.

    1. Checks its own rendered contents against its previous state and only
       displays the content if it has changed. For example, this displays a
       list of days, only displaying the month if it changes::

            <h1>Archive for {{ year }}</h1>

            {% for date in days %}
                {% ifchanged %}<h3>{{ date|date:"F" }}</h3>{% endifchanged %}
                <a href="{{ date|date:"M/d"|lower }}/">{{ date|date:"j" }}</a>
            {% endfor %}

    2. If given one or more variables, check whether any variable has changed.
       For example, the following shows the date every time it changes, while
       showing the hour if either the hour or the date has changed::

            {% for date in days %}
                {% ifchanged date.date %} {{ date.date }} {% endifchanged %}
                {% ifchanged date.hour date.date %}
                    {{ date.hour }}
                {% endifchanged %}
            {% endfor %}
*/

exports.ifchanged = function(parser, token) {
  var bits = token.splitContents();
  var nodeListTrue = parser.parse(['else', 'endifchanged']);
  var token = parser.nextToken();
  if (token.contents == 'else') {
    var nodeListFalse = parser.parse(['endifchanged']);
    parser.deleteFirstToken();
  } else {
    var nodeListFalse = new NodeList();
  }
  var values = bits.slice(1).map(function(bit) {
    return parser.compileFilter(bit);
  }, this);
  return new IfChangedNode(nodeListTrue, nodeListFalse, values);
}