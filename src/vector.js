'use strict'
const compareArr = ['return a', ' - b', ';']
const minArr = ['return a', ' == void 0 ? Infinity : a', ';']
const maxArr = ['return a', ' == void 0 ? -Infinity : a', ';']

// function (a) { return a.min == void 0 ? 1: 0; };

class Vector {
    constructor(minFormat = '.min0', maxFormat = '.max0') {
        this.minFormat = minFormat.replace('.', '')
        this.maxFormat = maxFormat.replace('.', '')
        this._min = new Function('a', minArr.join(minFormat))
        this._max = new Function('a', maxArr.join(maxFormat))
        this._compareMin = new Function('a', 'b', compareArr.join(minFormat))
        this._compareMax = new Function('a', 'b', compareArr.join(maxFormat))
    }

    /**
     * Returns the minimum value function along this vector.
     */
    get min() {
        return this._min
    }

    /**
     * Returns the maximum value function along this vector.
     */
    get max() {
        return this._max
    }

    /**
     * Returns the minimum value of two items along this vector.
     * @param a first item with vector values
     * @param b second item with vector values
     */
    get minimum() {
        return function(a, b) {
            return this._compareMin(a, b) < 0 ? this.min(a) : this.min(b)
        }
    }

    /**
     * Returns the maximum value of two items along this vector.
     * @param a first item with vector values
     * @param b second item with vector values
     */
    get maximum() {
        return function(a, b) {
            return this._compareMax(a, b) > 0 ? this.max(a) : this.max(b)
        }
    }

    /**
     * Returns the length of the item along this vector.
     * @param a specified item with vector values
     */
    get length() {
        return function(a) {
            return this.max(a) - this.min(a)
        }
    }

    /**
     * Extends the specified item a by specified item b.
     * Returns a function to run the operation.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get extend() {
        return function(a, b) {
            a[this.minFormat] = this.minimum(a, b)
            a[this.maxFormat] = this.maximum(a, b)
            return a
            // TODO: Test for performance!
            // var c = Object.assign({}, a)
            // c[this.minFormat] = this.minimum(a, b)
            // c[this.maxFormat] = this.maximum(a, b)
            // const res = Object.assign({}, c)
            // return res
        }
    }

    /**
     * Intersects the specified item a by specified item b.
     * Returns a function to run the operation.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get intersect() {
        return function(a, b) {
            a[this.maxFormat] = this._compareMax(a, b) < 0 ? this.max(a) : this.max(b)
            a[this.minFormat] = this._compareMin(a, b) > 0 ? this.min(a) : this.min(b)
            return a
        }
    }

    get contains() {
        return function(a, b) {
            return this.min(a) <= this.min(b) && this.max(a) >= this.max(b)
        }
    }

    get intersects() {
        return function(a, b) {
            return this.max(a) >= this.min(b) && this.min(a) <= this.max(b)
        }
    }

    get compare() {
        return function(a, b) {
            return this._compareMin(a, b)
        }
    }
}

module.exports = Vector
module.exports.default = Vector
