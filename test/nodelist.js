var assert = require("assert");

var {Template} = require('../lib/template');
var {NodeList} = require('../lib/nodelist');
var {VariableNode} = require('../lib/nodes');

exports.testFor = function() {

    var source = '{% for i in 1 %}{{ a }}{% endfor %}';
    var template = new Template(source);
    var vars = template.nodeList.getByType(VariableNode)
    assert.equal(vars.length, 1);
}

exports.testIf = function() {
    var source =  '{% if x %}{{ a }}{% endif %}';
    var template = new Template(source);
    var vars = template.nodeList.getByType(VariableNode)
    assert.equal(vars.length, 1);
}

exports.testIfEqual = function() {
    var source = '{% ifequal x y %}{{ a }}{% endifequal %}';
    var template = new Template(source);
    var vars = template.nodeList.getByType(VariableNode)
    assert.equal(vars.length, 1);
}

exports.testIfChanged = function() {
    var source = '{% ifchanged x %}{{ a }}{% endifchanged %}';
    var template = new Template(source);
    var vars = template.nodeList.getByType(VariableNode)
    assert.equal(vars.length, 1);
}
