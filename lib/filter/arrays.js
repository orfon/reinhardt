const {conditionalEscape} = require('../utils/html');
const {markSafe} = require('../utils');

exports.join = (value, arg, autoescape) => {
    const originalValue = value;
    if (autoescape) {
        value = value.map(conditionalEscape)
    }
    let data;
    try {
        data = value.join(conditionalEscape(arg));
    } catch (e) {
        return originalValue;
    }
    return markSafe(data);
};
exports.join.isSafe = true;
exports.join.needsAutoescape = true;

exports.slice = (value, arg) => {
    const bits = arg.split(':');
    return value.slice.apply(value, bits);
};
exports.slice.isSafe = true;

exports.length = (value) => {
    if (Array.isArray(value) || typeof (value) === 'string' || value instanceof String) {
        return value.length;
    }
    return '';
};
exports.length.isSafe = true;

exports.length_is = (value, arg) => {
    const len = parseInt(arg);
    if (isNaN(len)) {
        return '';
    }
    if (value instanceof Array || typeof (value) === 'string' || value instanceof String) {
        return value.length === len;
    }
    return '';

};
exports.length_is.isSafe = false;

exports.sortByKey = (value, arg) => {
    if (!arg || !Array.isArray(value)) {
        return value;
    }
    return value.sort((a, b) => {
        if (a[arg] > b[arg]) {
            return -1;
        } else if (a[arg] < b[arg]) {
            return 1;
        }
        return 0;
    });
};
exports.sortByKey.isSafe = true;

exports.first = (value) => {
    if (Array.isArray(value)) {
        return value[0];
    }
    return '';
};
exports.first.isSafe = false;


exports.last = (value) => {
    if (Array.isArray(value)) {
        return value.slice(-1)[0];
    }
    return '';
};
exports.last.isSafe = true;
