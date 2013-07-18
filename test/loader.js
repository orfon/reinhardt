var assert = require('assert');
var {Context} = require('../lib/context');
var {Environment} = require('../lib/environment');

var MockLoader = function() {
   this.templateAccess = {
      'foo': 0,
      'bar': 0
   }
   this.loadTemplateSource = function(templateName) {
      if (!templateName in this.templateAccess) {
         return null;
      }
      this.templateAccess[templateName]++;
      return [templateName, templateName];
   }

   this.reset = function() {
      for (var key in this.templateAccess) {
         this.templateAccess[key] = 0;
      }
   }
   return this;
}

var c = {};

exports.testLoaderOrderA = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsLoader = new FsLoader(module.resolve('./templatedir/bar/'),
                               module.resolve('./templatedir/foo/'));
   var env = new Environment({loader: fsLoader});
   assert.equal(env.getTemplate('test.html').render(c), 'bar');
   assert.equal(env.getTemplate('baz/test.html').render(c), 'baz');
}

exports.testLoaderOrderB = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsLoader = new FsLoader(module.resolve('./templatedir/foo/'),
                               module.resolve('./templatedir/bar/'));
   var env = new Environment({loader: fsLoader});
   assert.equal(env.getTemplate('test.html').render(c), 'foo');
   assert.equal(env.getTemplate('baz/test.html').render(c), 'baz');
}

// does it return the same as raw filesystem loader?
exports.testCachedLoader = function() {
   var FsLoader = require('../lib/loaders/filesystem').Loader;
   var fsLoader = new FsLoader(module.resolve('./templatedir/foo/'),
                              module.resolve('./templatedir/bar/'));
   var CachedLoader = require('../lib/loaders/cached').Loader;
   var cachedLoader = new CachedLoader(fsLoader)

   var env = new Environment({loader: cachedLoader});
   assert.equal(env.getTemplate('test.html').render(c), 'foo');
   assert.equal(env.getTemplate('baz/test.html').render(c), 'baz');
}

// does it cache?
exports.testCacheLoaderCaching = function() {
   var mockLoader = new MockLoader();
   var CachedLoader = require('../lib/loaders/cached').Loader;
   var cachedLoader = new CachedLoader(mockLoader);

   var env = new Environment({loader: cachedLoader});
   assert.equal(env.getTemplate('foo').render(c), 'foo');
   // one access to foo template
   assert.equal(mockLoader.templateAccess.foo, 1);
   // try again
   assert.equal(env.getTemplate('foo').render(c), 'foo');
   // still only one access
   assert.equal(mockLoader.templateAccess.foo, 1);
   // same for bar
   assert.equal(env.getTemplate('bar').render(c), 'bar');
   assert.equal(env.getTemplate('bar').render(c), 'bar');
   assert.equal(mockLoader.templateAccess.bar, 1);

}

//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}
