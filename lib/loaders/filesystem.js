var fs = require('fs');
var {safeJoin} = require('../utils/fs');

var LoaderOrigin = exports.LoaderOrigin = function(loader, name, dirs) {
  [this.loader, this.loadName, this.dirs] = [loader, name, dirs];
  return this;
}
LoaderOrigin.prototype.reload = function() {
  return this.loader.loadTemplateSource(this.loadName)[0];
}

var Loader = exports.Loader = function(dirs) {
   this.templateDirs = dirs;
   if (arguments.length > 1) {
      this.templateDirs = Array.prototype.slice.apply(arguments, [0]);
   } else if (!  (this.templateDirs instanceof Array)) {
      this.templateDirs = [this.templateDirs];
   }
   return this;
}

/**
  Returns the absolute paths to "template_name", when appended to each
  directory in "template_dirs". Any paths that don't lie inside one of the
  template dirs are excluded from the result set, for security reasons.
*/
Loader.prototype.getTemplateSources = function(templateName) {
   return this.templateDirs.map(function(d) {
      try {
        return safeJoin(d, templateName);
      } catch (e) {
        return null;
      }
   }).filter(function(v) {
    return v !== null;
   });
}

Loader.prototype.loadTemplateSource = function(templateName) {
   var source = null;
   this.getTemplateSources(templateName).some(function(templatePath) {
      // FIXME debug mode which outputs the directories the loader tried
      if (fs.exists(templatePath) && fs.isFile(templatePath)) {
         source = fs.read(templatePath);
         return true;
      }
   });
   return [source, new LoaderOrigin(this, templateName, this.templateDirs)];
}