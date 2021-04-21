const {NodeList} = require('../nodelist');
const {Node} = require('../nodes');
const {IfParser, Literal} = require('../smartif');
const {TemplateSyntaxError} = require('../errors');

/**
 * IfEqualNode
 */
const IfEqualNode = function(var1, var2, nodeListTrue, nodeListFalse, negate) {
    this.var1 = var1;
    this.var2 = var2;
    this.nodeListTrue = nodeListTrue;
    this.nodeListFalse = nodeListFalse;
    this.negate = negate;
    return this;
};
IfEqualNode.prototype.getByType = Node.prototype.getByType;

IfEqualNode.prototype.render = function(context) {
    let val1 = this.var1.resolve(context, true);
    let val2 = this.var2.resolve(context, true);
    // convert both to string primitive if they are String instances
    // because 'test' !== new String('test')
    if (val1 instanceof String) {
        val1 = val1.toString();
    }
    if (val2 instanceof String) {
        val2 = val2.toString();
    }
    if ((this.negate && val1 !== val2) || (!this.negate && val1 === val2)) {
        return this.nodeListTrue.render(context);
    }
    return this.nodeListFalse.render(context);
};

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

const doIfEqual = function(parser, token, negate) {
    const bits = token.splitContents();
    if (bits.length !== 3) {
        throw new TemplateSyntaxError(bits[0] + ' takes two arguments');
    }
    const endTag = 'end' + bits[0];
    const nodeListTrue = parser.parse(['else', endTag]);
    token = parser.nextToken();
    let nodeListFalse;
    if (token.contents === 'else') {
        nodeListFalse = parser.parse([endTag]);
        parser.deleteFirstToken();
    } else {
        nodeListFalse = new NodeList();
    }
    const val1 = parser.compileFilter(bits[1]);
    const val2 = parser.compileFilter(bits[2]);
    return new IfEqualNode(val1, val2, nodeListTrue, nodeListFalse, negate);
};

exports.ifequal = function(parser, token) {
    return doIfEqual(parser, token, false);
};

exports.ifnotequal = function(parser, token) {
    return doIfEqual(parser, token, true);
};

/**
 * IfNode
 */

const IfNode = function(conditionsNodeLists) {
    Object.defineProperties(this, {
        conditionsNodeLists: {value: conditionsNodeLists}
    });
    return this;
};

// FIXME either this custom getByType
// or a defineProperty "childnodelists" which would
// return smth the normal getByType can work with
IfNode.prototype.getByType = function(type) {
    const nodes = [];
    if (this instanceof type) {
        nodes.push(this);
    }
    this.conditionsNodeLists.forEach(conditionNodeList => {
        nodes.push.apply(nodes, conditionNodeList[1].getByType(type));
    });
    return nodes;
};

IfNode.prototype.render = function(context) {
    for (let i = 0; i < this.conditionsNodeLists.length; i += 1) {
        let nodeList = this.conditionsNodeLists[i];
        let condition = nodeList[0];
        let match = (condition !== null) ? condition.eval(context) : true;
        if (match) {
            return nodeList[1].render(context);
        }
    }
    return '';
};

IfNode.prototype.setEnvironment = function(env) {
    this.conditionsNodeLists.forEach(conditionAndList => {
        conditionAndList[1].setEnvironment(env);
    });
};


/**
 * TemplateLiteral
 */

const TemplateLiteral = function(value, text) {
    Literal.call(this, value);
    Object.defineProperties(this, {
        text: {value: text} // nicer error msg
    });
    return this;
};
TemplateLiteral.prototype = Object.create(Literal.prototype);
TemplateLiteral.prototype.constructor = TemplateLiteral;

TemplateLiteral.prototype.display = function() {
    return this.text;
};
TemplateLiteral.prototype.eval = function(context) {
    return this.value.resolve(context, true);
};

/**
 * TemplateIfParser
 */
const TemplateIfParser = function(parser, tokens) {
    Object.defineProperties(this, {
        templateParser: {value: parser}
    });
    IfParser.call(this, tokens);
    return this;
};
TemplateIfParser.prototype = Object.create(IfParser.prototype);
TemplateIfParser.prototype.constructor = TemplateIfParser;

TemplateIfParser.prototype.createVar = function(value) {
    return new TemplateLiteral(this.templateParser.compileFilter(value), value);
};

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
    let bits = token.splitContents().slice(1);
    let condition = (new TemplateIfParser(parser, bits)).parse();
    let nodeList = parser.parse(['elif', 'else', 'endif']);
    const conditionsNodeLists = [[condition, nodeList]];
    token = parser.nextToken();

    // {% elif ... %} repeatable
    while (token.contents.startsWith('elif')) {
        bits = token.splitContents().slice(1);
        condition = (new TemplateIfParser(parser, bits)).parse();
        nodeList = parser.parse(['elif', 'else', 'endif']);
        conditionsNodeLists.push([condition, nodeList]);
        token = parser.nextToken();
    }
    // {% else %} optional
    if (token.contents === 'else') {
        nodeList = parser.parse(['endif']);
        conditionsNodeLists.push([null, nodeList]);
        token = parser.nextToken();
    }
    if (token.contents !== 'endif') {
        throw new TemplateSyntaxError('Missing endif tag');
    }
    return new IfNode(conditionsNodeLists);
};