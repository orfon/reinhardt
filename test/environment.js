var assert = require("assert");
var {Environment} = require('../lib/reinhardt');
var {markSafe} = require('../lib/utils');

// a fake tag module
var echoTagModule = (function() {
	/**
	 * outputs the "foo" property of the environment
	 */
	var EchoFooNode = function(val) {
	   this.value = val;
	   return this;
	}
	EchoFooNode.prototype.render = function(context) {
	   return markSafe(this.env.config.foo);
	}
	EchoFooNode.prototype.getByType = function() {
	   return [];
	}

	return {
		echofoo: function(parser, token) {
	   		return new EchoFooNode();
   		}
	}
})();

exports.testEnv = function() {

	var templates = new Environment({
		debug: true,
		foo: 'bar'
	});
	
	assert.isTrue(templates.DEBUG);
	// other options are put into Environment.config
	assert.isUndefined(templates.foo);
	assert.equal(templates.config.foo, 'bar');
}

exports.testEnvConfig = function() {
	// the {% echofoo %} tag must output
	// the "foo" property of the environment config

	var templates = new Environment({
		loader: module.resolve('./envtest/'),
		tags: echoTagModule,
		debug: false,
		foo: 'bar'
	});

	// child extends master.html, we check whether the env
	// is available in the master template.
	// Additionally the env needs to be passed down any nodelist (that's why
	// there are so many nested if-blocks %}
	var t = templates.getTemplate('child.html');
	assert.equal(t.render(), 'Master: bar\n\nChild: bar\n\n\n\n\t\n\t\tbar\n\t\n');

	// passing everything in as array should give same result
	templates = new Environment({
		loader: [module.resolve('./envtest/')],
		tags: [echoTagModule],
		debug: true,
		foo: 'bar'
	});
	var t = templates.getTemplate('child.html');
	assert.equal(t.render(), 'Master: bar\n\nChild: bar\n\n\n\n\t\n\t\tbar\n\t\n');

}