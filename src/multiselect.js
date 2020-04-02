'use strict'
var quickselect = require('quickselect')

function multiselect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid

    while (stack.length) {
        right = stack.pop()
        left = stack.pop()

        if (right - left <= n) continue

        mid = left + Math.ceil((right - left) / n / 2) * n
        quickselect(arr, mid, left, right, compare)

        stack.push(left, mid, mid, right)
    }
}

module.exports = multiselect
module.exports.default = multiselect
