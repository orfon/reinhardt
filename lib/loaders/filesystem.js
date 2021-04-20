const fs = require('fs');
const {safeJoin} = require('../utils/fs');

const LoaderOrigin = exports.LoaderOrigin = function(loader, loadName, dirs) {
    Object.defineProperties(this, {
        "loader": {"value": loader},
        "loadName": {"value": loadName},
        "dirs": {"value": dirs}
    });
    return this;
};

LoaderOrigin.prototype.reload = function() {
    return this.loader.loadTemplateSource(this.loadName)[0];
};

const Loader = exports.Loader = function(dirs) {
    if (arguments.length > 1) {
        dirs = Array.prototype.slice.call(arguments);
    } else if (!Array.isArray(dirs)) {
        dirs = [dirs];
    }
    Object.defineProperties(this, {
        "templateDirs": {"value": dirs}
    });
    return this;
};

/**
 Returns the absolute paths to "template_name", when appended to each
 directory in "template_dirs". Any paths that don't lie inside one of the
 template dirs are excluded from the result set, for security reasons.
 */
Loader.prototype.getTemplateSources = function(templateName) {
    return this.templateDirs.map(directory => {
        try {
            return safeJoin(directory, templateName);
        } catch (e) {
            return null;
        }
    }).filter(path => path !== null);
};

Loader.prototype.loadTemplateSource = function(templateName) {
    let source = null;
    this.getTemplateSources(templateName).some(path => {
        // FIXME debug mode which outputs the directories the loader tried
        if (fs.exists(path) && fs.isFile(path)) {
            source = fs.read(path);
            return true;
        }
    });
    return [source, new LoaderOrigin(this, templateName, this.templateDirs)];
};