var assert = require('assert');
var {IfParser} = require('../lib/smartif');

var assertCalcEqual = function(tokens, expected) {
    assert.equal(new IfParser(tokens).parse().eval({}), expected);
}

/**
    We only test things here that are difficult to test elsewhere
    Many other tests are found in the main tests for builtin template tags
    Test parsing via the printed parse tree
*/
exports.testNot = function() {
    var foo = new IfParser(['not', false]).parse();
    assert.equal(foo.toString(), '(not (literal false))');
    assert.isTrue(foo.eval({}));
    assert.isFalse(new IfParser(['not', true]).parse().eval({}));
}


exports.testOr = function() {
    var foo = new IfParser([true, 'or', false]).parse();
    assert.equal('(or (literal true) (literal false))', foo);
    assert.isTrue(foo.eval({}));
}

exports.testIn = function() {
    var list = [1,2,3];
    assertCalcEqual([1, 'in', list], true);
    assertCalcEqual([1, 'in', null], false);
    assertCalcEqual([null, 'in', list], false);

};

exports.testNotIn = function() {
    var list = [1,2,3]
    assertCalcEqual([1, 'not', 'in', list], false);
    assertCalcEqual([4, 'not', 'in', list], true);
    assertCalcEqual([1, 'not', 'in', null], false);
    assertCalcEqual([null, 'not', 'in', list], true);
}


exports.testPrecedence = function() {
    // (false and false) or true == true   <- we want this one, like Python
    // false and (false or true) == false
    assertCalcEqual([false, 'and', false, 'or', true], true)

    // FIXME DANGER  in js: false || false && false === false
    // true or (false and false) == true   <- we want this one, like Python
    // (true or false) and false == false
    assertCalcEqual([true, 'or', false, 'and', false], true)

    // (1 or 1) == 2  -> false
    // 1 or (1 == 2)  -> true   <- we want this one
    assertCalcEqual([1, 'or', 1, '==', 2], true)

    assertCalcEqual([true, '==', true, 'or', true, '==', false], true)

    assert.equal(new IfParser([1, '==', 2, 'and', 3, 'or', 4]).parse(),
        "(or (and (== (literal 1) (literal 2)) (literal 3)) (literal 4))");

}


//start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports, arguments[1]));
}