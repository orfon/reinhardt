const Template = exports.Template = require('./template').Template;
const {Loader} = require('./loaders/filesystem');
const {TemplateDoesNotExist} = require('./errors');
const constants = require("./constants");

/**
 * Non standard properties are added to `config` property of the environment
 * and are accesible in nodes.
 * @param {Object} options configuration
 *
 */
const TemplateEnvironment = exports.Environment = function(options) {
    const loader = (typeof (options.loader) === 'string' || Array.isArray(options.loader)) ?
            new Loader(options.loader) :
            options.loader;
    const extensions = {
        filters: options.filters,
        tags: options.tags
    };
    const isInDebugMode = options.debug === true;
    const stringIfUndefined = (options.stringIfUndefined !== undefined) ?
            options.stringIfUndefined :
            constants.TEMPLATE_STRING_IF_INVALID;
    delete options.loader;
    delete options.filters;
    delete options.tags;
    delete options.debug;

    Object.defineProperties(this, {
        loader: {value: loader},
        extensions: {value: extensions},
        DEBUG: {value: isInDebugMode},
        stringIfUndefined: {value: stringIfUndefined},
        config: {value: options}
    });
    return this;
};

/**
 * @returns {Object} a JSGI response object
 */
TemplateEnvironment.prototype.renderResponse = function(templateName, context) {
    const template = this.getTemplate(templateName);
    return {
        status: 200,
        headers: {"Content-Type": "text/html; charset=utf-8"},
        body: [template.render(context)]
    };
}

/**
 * @returns {Template} A template instance
 */
TemplateEnvironment.prototype.getTemplate = function(templateName, history) {
    const [source, origin] = this.loader.loadTemplateSource(templateName, this, history || []);
    if (source) {
        if (typeof (source.render) != 'function') {
            return new Template(source, this, origin);
        }
        return source;
    }
    throw new TemplateDoesNotExist('Template does not exist "' + templateName + '"');
};
