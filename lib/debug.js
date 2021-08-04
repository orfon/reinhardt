const {Lexer} = require('./lexer');
const {Parser} = require('./parser');
const {TemplateSyntaxError, TemplateDoesNotExist} = require('./errors');
const {NodeList} = require('./nodelist');
const {VariableNode} = require('./nodes');
const constants = require('./constants');

const DebugLexer = exports.DebugLexer = function(templateString, origin) {
    Lexer.apply(this, arguments);
    return this;
};

DebugLexer.prototype = Object.create(Lexer.prototype);
DebugLexer.prototype.constructor = DebugLexer;

DebugLexer.prototype.tokenize = function() {
    const result = [];
    let upto = 0;
    let match = null;
    while (match = constants.tagRe.exec(this.templateString)) {
        let start = match.index;
        let end = match.index + match[0].length;
        let slice;
        if (start > upto) {
            slice = this.templateString.slice(upto, start);
            result.push(this.createToken(slice, [upto, start], false));
            upto = start;
        }
        slice = this.templateString.slice(start, end);
        result.push(this.createToken(slice, [start, end], true));
        upto = end;
    }
    const lastBit = this.templateString.slice(upto);
    if (lastBit) {
        result.push(this.createToken(lastBit, upto + lastBit.length, false));
    }
    return result;

};

DebugLexer.prototype.createToken = function(tokenString, source, inTag) {
    const token = Lexer.prototype.createToken(tokenString, inTag);
    token.source = [this.origin, source];
    return token;
};

const DebugParser = exports.DebugParser = function() {
    Parser.apply(this, arguments);
    this.commandStack = [];
    return this;
}
DebugParser.prototype = Object.create(Parser.prototype);
DebugParser.prototype.constructor = DebugParser;

DebugParser.prototype.enterCommand = function(command, token) {
    this.commandStack.push([command, token.source]);
};

DebugParser.prototype.exitCommand = function() {
    this.commandStack.pop();
};

DebugParser.prototype.error = function(token, msg) {
    return this.sourceError(token.source, msg);
};

DebugParser.prototype.sourceError = function(source, msg) {
    const e = new TemplateSyntaxError(msg);
    e.templateSource = source;
    return e;
};

DebugParser.prototype.createNodeList = function() {
    return new DebugNodeList();
};

DebugParser.prototype.createVariableNode = function(contents) {
    return new DebugVariableNode(contents);
};

DebugParser.prototype.extendNodeList = function(nodeList, node, token) {
    node.source = token.source;
    Parser.prototype.extendNodeList.apply(this, arguments);
};

DebugParser.prototype.unclosedBlockTag = function(parseUntil) {
    const [command, source] = this.commandStack.pop();
    const msg = "Unclosed tag " + command + ". Looking for one of: " + (parseUntil.join(','));
    throw this.sourceError(source, msg);
};

DebugParser.prototype.compileFilterError = function(token, e) {
    if (!e.hasOwnProperty("templateSource")) {
        e.templateSource = token.source;
    }
};

DebugParser.prototype.compileFunctionError = function(token, e) {
    if (!e.hasOwnProperty("templateSource")) {
        e.templateSource = token.source;
    }
};

const DebugNodeList = function() {
    NodeList.apply(this, arguments);
    return this;
};
DebugNodeList.prototype = Object.create(NodeList.prototype);
DebugNodeList.prototype.constructor = DebugNodeList;

DebugNodeList.prototype.renderNode = function(node, context) {
    try {
        return node.render(context);
    } catch (e) {
        if (e instanceof TemplateSyntaxError || e instanceof TemplateDoesNotExist) {
            if (!e.hasOwnProperty("templateSource")) {
                e.templateSource = node.source;
            }
        }
        throw e;
    }
};

const DebugVariableNode = function() {
    VariableNode.apply(this, arguments);
    return this;
};
DebugVariableNode.prototype = Object.create(VariableNode.prototype);
DebugVariableNode.prototype.constructor = DebugVariableNode;

DebugVariableNode.prototype.render = function(context) {
    try {
        const output = this.filterExpression.resolve(context);
        return context.renderValue(output);
    } catch (e) {
        if (e instanceof TemplateSyntaxError || e instanceof TemplateDoesNotExist) {
            if (!e.hasOwnProperty("templateSource")) {
                e.templateSource = this.source;
            }
        }
        throw e;
    }
};