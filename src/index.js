'use strict'
var multiselect = require('./multiselect.js')
var Node = require('./node.js')
var Vector = require('./vector.js')

class rbushen {
    constructor(maxEntries, format = []) {
        // Safeguard for developer forgetting new keyword.
        if (!(this instanceof rbushen)) return new rbushen(maxEntries, format)

        // max entries in a node is 16 by default; min node fill is 40% for best performance
        this._maxEntries = Math.max(8, maxEntries || 16)
        this._minEntries = Math.max(4, Math.ceil(this._maxEntries * 0.4))

        // Object properties as undefined, initialized elsewhere.
        // Data is always a Node.
        this.vectors = []

        // Make sure that format params contains pairs of min-max
        // Other sanitization is up to user
        if (format.length % 2 != 0) return

        for (let i = 0; i < format.length / 2; i++) {
            this.vectors.push(new Vector(format[2 * i], format[2 * i + 1]))
        }

        this.clear()
    }

    clear() {
        this._root = new Node(this.vectors, [new Node(this.vectors)])
        this._root.leaf = false
        return this
    }

    pushVector(vector) {
        this.vectors.push(vector)
    }

    unshiftVector(vector) {
        this.vectors.unshift(vector)
    }

    clearVectors() {
        while (this.vectors.length) this.vectors.shift()
    }

    insert(item) {
        if (item) this._root.insert(item, [this._root])
        return this
    }
}

module.exports = rbushen
module.exports.default = rbushen
