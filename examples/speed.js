var {Template} = require('../lib/template');
var {Environment} = require('../lib/environment');

console.log('Starting speed tests...');


///////////// array loop
var tpl = new Template("{% for foo in bar %}{{ forloop.counter }} - {{ foo }}{% endfor %}");

var x = 2000;

console.time('array loop ' + x);
var d = Date.now();
var i = x;
while (i) {
  i -= 1;
  tpl.render({ bar: [ 'bar', 'baz', 'bop' ]});
}
console.timeEnd('array loop ' + x);
console.log("  ~ " + Math.round(x * 1000 / (Date.now() - d)) + " renders per sec.");

///////// includes
var env = new Environment({
  loader: module.resolve('./templates-speed/'),
});

var array = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "abcdefghijklmnopqrstuvwxyz"];
tpl = env.getTemplate('include_base.html')

i = x;
console.time('Render ' + x + ' Includes Templates');
d = Date.now();
while (i) {
  i -= 1;
  tpl.render({ array: array, foo: "baz", "included": "included.html" });
}
console.timeEnd('Render ' + x + ' Includes Templates');
console.log("  ~ " + Math.round(x * 1000 / (Date.now() - d)) + " renders per sec.");


////////// extends

tpl = env.getTemplate("extends_2.html");
i = x;
console.time('Render ' + x + ' Extends Templates');
d = Date.now();
while (i) {
  i -= 1;
  tpl.render({ array: array, foo: "baz", "included": "included.html" });
}
console.timeEnd('Render ' + x + ' Extends Templates');
console.log("  ~ " + Math.round(x * 1000 / (Date.now() - d)) + " renders per sec.");
