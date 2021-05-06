const html = require('./utils/html');
const {isSafe, isMarkedForEscaping} = require('./utils');

const Context = exports.Context = function(dict, autoescape) {
    Object.defineProperties(this, {
        autoescape: {value: autoescape !== false, writable: true, enumerable: true},
        dicts: {value: dict ? [dict] : [{}], enumerable: true},
        renderContext: {value: new RenderContext(), enumerable: true},
        environment: {value: null, writable: true, enumerable: true}
    });
    return this;
};

Context.prototype.push = function() {
    const dict = {};
    this.dicts.push(dict);
    return dict;
};

Context.prototype.pop = function() {
    if (this.dicts.length === 1) {
        throw new Error('pop() more often called then push()');
    }
    return this.dicts.pop();
};

/**
 Get a variable's value, starting at the current context and going upward
 */
Context.prototype.get = function(key, otherwise) {
    for (let i = this.dicts.length - 1; i >= 0; i--) {
        let dict = this.dicts[i];
        if (dict.hasOwnProperty(key)) {
            return dict[key];
        }
    }
    return otherwise;
};

Context.prototype.set = function(key, value) {
    this.dicts[this.dicts.length - 1][key] = value;
};

Context.prototype.has = function(key) {
    return this.get(key) !== undefined;
};

Context.prototype.update = function(dict) {
    this.dicts.push(dict);
};

Context.prototype.new = function(dict) {
    return new Context(dict, this.autoescape);
};

/**
 * Converts any value to a string to become part of a rendered template. This
 * means escaping, if required, and conversion to a unicode object. If value
 * is a string, it is expected to have already been translated.
 */
Context.prototype.renderValue = function(value) {
    // @@ TODO
    //value = template_localtime(value, use_tz=context.use_tz)
    //value = localize(value, use_l10n=context.use_l10n)
    if ((this.autoescape === true && isSafe(value) === false)
            || isMarkedForEscaping(value)) {
        return html.escape(value);
    }
    return value;
};

/**
 *
 */
const RenderContext = exports.RenderContext = function(dict) {
    Object.defineProperties(this, {
        dicts: {
            value: dict ? [dict] : [{}],
            enumerable: true
        }
    });
    return this;
};

RenderContext.prototype.push = Context.prototype.push;
RenderContext.prototype.pop = Context.prototype.pop;
RenderContext.prototype.set = Context.prototype.set;
RenderContext.prototype.has = Context.prototype.has;
RenderContext.prototype.get = function(key, otherwise) {
    const dict = this.dicts[this.dicts.length - 1];
    if (dict.hasOwnProperty(key)) {
        return dict[key];
    }
    return otherwise;
};