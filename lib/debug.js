var $o = require("ringo/utils/objects");

var {Lexer} = require('./lexer');
var {Parser} = require('./parser');
var {TemplateSyntaxError, TemplateDoesNotExist} = require('./errors');
var {NodeList} = require('./nodelist');
var {VariableNode} = require('./nodes');
var {escape} = require('./utils/html');
var {isSafe, isMarkedForEscaping} = require('./utils');
var c = require('./constants');

var DebugLexer = exports.DebugLexer = function(templateString, origin) {
	Lexer.apply(this, arguments);
	return this;
}

DebugLexer.prototype.tokenize = function() {
	var result = [];
	var upto = 0;
	var match = null;
	while (match = c.tagRe.exec(this.templateString)) {
		var start = match.index;
		var end = match.index + match[0].length;
		if (start > upto) {
			let slice = this.templateString.slice(upto, start);
			result.push(this.createToken(slice, [upto, start], false));
			upto = start;
		}
		let slice = this.templateString.slice(start, end);
		result.push(this.createToken(slice, [start, end], true));
		upto = end;
	}
	var lastBit = this.templateString.slice(upto);
	if (lastBit) {
		result.push(this.createToken(lastBit, (upto, upto + lastBit.length), false));
	}
	return result;

}
DebugLexer.prototype.createToken = function(tokenString, source, inTag) {
	var token = Lexer.prototype.createToken(tokenString, inTag);
	token.source = [this.origin, source];
	return token;
}

var DebugParser = exports.DebugParser = function() {
	Parser.apply(this, arguments);
	this.commandStack = [];
	return this;
}
DebugParser.prototype = Object.create(Parser.prototype);
DebugParser.prototype.constructor = DebugParser;
DebugParser.prototype.enterCommand = function(command, token) {
	this.commandStack.push([command, token.source]);
}

DebugParser.prototype.exitCommand = function() {
	this.commandStack.pop();
}

DebugParser.prototype.error = function(token, msg) {
	return this.sourceError(token.source, msg);
}

DebugParser.prototype.sourceError = function(source, msg) {
	var e = new TemplateSyntaxError(msg);
	e.templateSource = source;
	return e;
}

DebugParser.prototype.createNodeList = function() {
	return new DebugNodeList();
}

DebugParser.prototype.createVariableNode = function(contents) {
	return new DebugVariableNode(contents);
}

DebugParser.prototype.extendNodeList = function(nodeList, node, token) {
	node.source = token.source;
	Parser.prototype.extendNodeList.apply(this, arguments);
}

DebugParser.prototype.unclosedBlockTag = function(parseUntil) {
	var [command, source] = this.commandStack.pop();
	var msg = "Unclosed tag " + command + ". Looking for one of: " + (parseUntil.join(','));
	throw this.sourceError(source, msg);
}

DebugParser.prototype.compileFilterError = function(token, e) {
	if (! ("templateSource" in e)) {
		e.templateSource = token.source;
	}
}

DebugParser.prototype.compileFunctionError = function(token, e) {
	if (! ("templateSource" in e)) {
		e.templateSource = token.source;
	}
}

var DebugNodeList = function() {
	NodeList.apply(this, arguments);
	return this;
}
DebugNodeList.prototype = Object.create(NodeList.prototype);
DebugNodeList.prototype.constructor = DebugNodeList;
DebugNodeList.prototype.renderNode = function(node, context) {
	try {
		return node.render(context);
	} catch (e if (e instanceof TemplateSyntaxError) || (e instanceof TemplateDoesNotExist)) {
		if (! ("templateSource" in e)) {
			e.templateSource = node.source;
		}
		throw e;
	}
}

var DebugVariableNode = function() {
	VariableNode.apply(this, arguments);
	return this;
}
DebugVariableNode.prototype = Object.create(VariableNode.prototype);
DebugVariableNode.prototype.constructor = VariableNode;
DebugVariableNode.prototype.render = function(context) {
	try {
		var output = this.filterExpression.resolve(context);
	} catch (e if (e instanceof TemplateSyntaxError) || (e instanceof TemplateDoesNotExist)) {
		if (! ("templateSource" in e)) {
			e.templateSource = this.source;
			throw e;
		}
	}
   return context.renderValue(output);
}