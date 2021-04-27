const {Lexer} = require('./lexer');
const {Parser} = require('./parser');
const {Context} = require('./context');
const {DebugLexer, DebugParser} = require('./debug');

const StringOrigin = function(source) {
    Object.defineProperties(this, {
        source: {value: source}
    });
    return this;
};

StringOrigin.prototype.reload = function() {
    return this.source;
};

/**
 * Construct a template from a string
 * @param {String} templateString
 * @param {Environment} [environment] Optional template environment
 * @param {Object} [origin] Optional template origin
 * @type Template
 * @constructor
 */
const Template = exports.Template = function(templateString, environment, origin) {
    // FIXME if no environment passed here, create a default one
    if (origin === undefined && (environment === undefined || environment.DEBUG === true)) {
        origin = new StringOrigin(templateString);
    }

    let lexer, parser;
    if (environment && environment.DEBUG) {
        lexer = new DebugLexer(templateString, origin);
        parser = new DebugParser(lexer.tokenize(), environment, origin);
    } else {
        lexer = new Lexer(templateString);
        parser = new Parser(lexer.tokenize(), environment);
    }

    Object.defineProperties(this, {
        nodeList: {value: parser.parse()},
        origin: {value: origin}
    });
    return this;
};

/** @ignore **/
Template.prototype._render = function(context) {
    return this.nodeList.render(context).toString();
};

/**
 * @returns {String} the rendered template
 */
Template.prototype.render = function(context) {
    if (!context) {
        context = new Context();
    } else if (!(context instanceof Context)) {
        context = new Context(context);
    }
    context.renderContext.push();
    try {
        return this._render(context);
    } finally {
        context.renderContext.pop();
    }
};

Template.prototype.toString = function() {
    return "[reinhardt Template]";
};