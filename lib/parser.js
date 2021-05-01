const constants = require('./constants');
const {FilterExpression} = require('./filterexpression');
const {TextNode, VariableNode} = require('./nodes');
const {NodeList} = require('./nodelist');
const {TemplateSyntaxError} = require('./errors');

const Parser = exports.Parser = function(tokens, environment, origin) {
    Object.defineProperties(this, {
        tokens: {value: tokens},
        environment: {value: environment},
        origin: {value: origin},
        tags: {value: {}},
        filters: {value: {}},
        // for {% block %}
        blocks: {value: []},
        // for {% cycle .. as .. %}
        namedCycleNodes: {value: {}}
    });

    this.addTags(require('./tag/logic'));
    this.addTags(require('./tag/loop'));
    this.addTags(require('./tag/loader'));
    this.addTags(require('./tag/misc'));
    this.addFilters(require('./filter/arrays'));
    this.addFilters(require('./filter/dates'));
    this.addFilters(require('./filter/logic'));
    this.addFilters(require('./filter/strings'));
    this.addFilters(require('./filter/htmlstrings'));
    this.addFilters(require('./filter/objects'));

    if (environment) {
        this.addEnvironmentExtensions();
    }
    return this;
};

Parser.prototype.addEnvironmentExtensions = function() {
    if (this.environment.extensions.filters) {
        let filterExt = this.environment.extensions.filters;
        if (!Array.isArray(filterExt)) {
            filterExt = [filterExt];
        }
        filterExt.forEach(extension => this.addFilters(extension));
    }
    if (this.environment.extensions.tags) {
        let tagExt = this.environment.extensions.tags;
        if (!Array.isArray(tagExt)) {
            tagExt = [tagExt];
        }
        tagExt.forEach(extension => this.addTags(extension));
    }
};

Parser.prototype.parse = function(parseUntil) {
    parseUntil || (parseUntil = []);
    const nodeList = this.createNodeList();

    while (this.tokens.length > 0) {
        let token = this.nextToken();
        if (token.tokenType === constants.TOKEN_TEXT) {
            this.extendNodeList(nodeList, new TextNode(token.contents), token);
        } else if (token.tokenType === constants.TOKEN_VAR) {
            if (!token.contents) {
                this.emptyVariable(token);
            }
            let node = this.createVariableNode(this.compileFilter(token.contents));
            this.extendNodeList(nodeList, node, token);
        } else if (token.tokenType === constants.TOKEN_BLOCK) {
            let command;
            try {
                command = token.contents.split(' ')[0];
            } catch (e) {
                this.emptyBlockTag(token);
            }
            if (parseUntil.indexOf(command) > -1) {
                this.prependToken(token);
                return nodeList;
            }
            let compileFunc = this.tags[command];
            if (!compileFunc || !(typeof (compileFunc) == 'function')) {
                this.invalidBlockTag(token, command);
            }
            this.extendNodeList(nodeList, compileFunc(this, token), token);
        }
    }
    if (parseUntil.length > 0) {
        this.unclosedBlockTag(parseUntil);
    }
    nodeList.setEnvironment(this.environment);
    return nodeList;
};

Parser.prototype.prependToken = function(token) {
    this.tokens.unshift(token);
};

Parser.prototype.createVariableNode = function(filterExpression) {
    return new VariableNode(filterExpression)
};

Parser.prototype.nextToken = function() {
    return this.tokens.shift();
};

Parser.prototype.compileFilter = function(token) {
    return new FilterExpression(token, this);
};

Parser.prototype.extendNodeList = function(nodeList, node) {
    if (node.mustBeFirst && this.nodelist.length > 0) {
        throw new TemplateSyntaxError("must be first tag in template");
    }
    // FIXME what does the containsNoText thing do? why attributeerror?
    nodeList.push(node);
};

Parser.prototype.emptyVariable = function(token) {
    throw this.error(token, 'Empty variable tag');
};

Parser.prototype.emptyBlockTag = function(token) {
    throw this.error(token, 'Empty block tag');
};

Parser.prototype.invalidBlockTag = function(token, command, parseUntil) {
    if (parseUntil) {
        throw this.error(token, "Invalid block tag: " + command + " expected " + parseUntil.join(', '));
    }
    throw this.error(token, 'Invalid block tag "' + command + '"');
}
Parser.prototype.unclosedBlockTag = function(parseUntil) {
    throw this.error(null, 'Unclosed tags: ' + parseUntil.join(', '));
};

Parser.prototype.addTags = function(lib) {
    Object.keys(lib).forEach(key => this.tags[key] = lib[key]);
};

Parser.prototype.addFilters = function(lib) {
    Object.keys(lib).forEach(key => this.filters[key] = lib[key]);
};

Parser.prototype.deleteFirstToken = function() {
    this.tokens.shift();
};

Parser.prototype.skipPast = function(endTag) {
    while (this.tokens.length > 0) {
        let token = this.nextToken();
        if (token.tokenType === constants.TOKEN_BLOCK && token.contents === endTag) {
            return;
        }
    }
    this.unclosedBlockTag([endTag]);
};

Parser.prototype.createNodeList = function() {
    return new NodeList();
};

Parser.prototype.error = function(token, msg) {
    return new TemplateSyntaxError(msg);
};
