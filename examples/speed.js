var {Template} = require('../lib/template');
var {Environment} = require('../lib/environment');

console.log('Starting speed tests...');


///////////// array loop
var tpl = new Template("{% for foo in bar %}{{ forloop.counter }} - {{ foo }}{% endfor %}");

console.time('array loop');
var i = 10000;
var d = new Date();
while (i) {
  i -= 1;
  tpl.render({ bar: [ 'bar', 'baz', 'bop' ]});
}
console.timeEnd('array loop');
console.log("  ~ " + Math.round(1000000 / (new Date() - d)) + " renders per sec.");

///////// includes
var env = new Environment({
  loader: module.resolve('./templates-speed/'),
});

var array = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "abcdefghijklmnopqrstuvwxyz"];
tpl = env.getTemplate('include_base.html')

i = 1000;
console.time('Render 1000 Includes Templates');
d = new Date();
while (i) {
  i -= 1;
  tpl.render({ array: array, foo: "baz", "included": "included.html" });
}
console.timeEnd('Render 1000 Includes Templates');
console.log("  ~ " + Math.round(1000000 / (new Date() - d)) + " renders per sec.");


////////// extends

tpl = env.getTemplate("extends_2.html");
i = 1000;
console.time('Render 1000 Extends Templates');
d = new Date();
while (i) {
  i -= 1;
  tpl.render({ array: array, foo: "baz", "included": "included.html" });
}
console.timeEnd('Render 1000 Extends Templates');
console.log("  ~ " + Math.round(1000000 / (new Date() - d)) + " renders per sec.");
