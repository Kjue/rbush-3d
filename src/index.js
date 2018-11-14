'use strict'
var multiselect = require('./multiselect.js')
var Node = require('./node.js')
var Vector = require('./vector.js')

class rbushen {
    constructor(maxEntries, format) {
        // Safeguard for developer forgetting new keyword.
        if (!(this instanceof rbushen)) return new rbushen(maxEntries, format)

        // max entries in a node is 16 by default; min node fill is 40% for best performance
        this._maxEntries = Math.max(8, maxEntries || 16)
        this._minEntries = Math.max(4, Math.ceil(this._maxEntries * 0.4))

        // Object properties as undefined, initialized elsewhere.
        // Data is always a Node.
        this.data = undefined
        this.vectors = []
    }

    // ************** PUBLIC METHODS ******************

    clear() {
        this.data = new Node()
        return this
    }

    _initFormat(format) {
        // data format (min0, max0, min1, max1, min2, max2 accessors)
        // format altered to make way for enumerated min-max-accessors
        // i.e. format = ['.min0', '.max0', ...] to satisfy accessors

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        var compareArr = ['return a', ' - b', ';']

        var bboxFunc = 'return {'
        this.compareVectors = []
        format.forEach((vector, index) => {
            this.compareVectors.push(new Function('a', 'b', compareArr.join(vector)))
            bboxFunc +=
                (!index ? '' : ', ') +
                (index % 2 ? 'max' : 'min') +
                Math.floor(index / 2) +
                ': a' +
                vector
        })
        bboxFunc += '};'

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]))
        this.compareMinY = new Function('a', 'b', compareArr.join(format[2]))
        this.compareMinZ = new Function('a', 'b', compareArr.join(format[4]))

        this.toBBox = new Function('a', bboxFunc)

        this.vectors.push(new Vector())
    }

    insert(item) {
        if (item) this._insert(item, this.data.height - 1)
        return this
    }

    // ************** PRIVATE METHODS ******************

    _insert(item, level, isNode) {
        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = []

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath)

        // put the item into the node
        node.children.push(item)
        // extend(node, bbox);
        node.extend(bbox)

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level)
                level--
            } else break
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level)
    }
}

module.exports = rbushen
module.exports.default = rbushen
