'use strict'

class Node {
    constructor(item, vectors = [], children = []) {
        this.item = item
        this.children = children
        this.height = 1
        this.leaf = true
        this.vectors = vectors
    }

    addVector(vector) {
        this.vectors.push(vector)
    }

    clearVectors() {
        this.vectors = []
    }

    /**
     * Gets the bounding box for this node for its item.
     * Caches the value, so it has to be updated where necessary.
     * Initial bounding box only looks at the item, not children.
     */
    get bbox() {
        // This should work now as we are making a new object and extending it.
        // Note, what is the performance characteristics?
        if (!this._bbox) {
            this._bbox = this.calcBBox()
        }
        return this._bbox
    }

    /**
     * Extend specified item a by specified item b along all vectors
     * in the node. Returns the bounding box.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get extend() {
        return function(a, b) {
            this.vectors.forEach((vector) => {
                vector.extend(a, b)
            })
            return a
        }
    }

    /**
     * Intersect specified item a by specified item b along all
     * vectors in the node. Returns the bounding box.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get intersect() {
        return function(a, b) {
            this.vectors.forEach((vector) => {
                vector.intersect(a, b)
            })
            return a
        }
    }

    /**
     * Gets the volume of the specified item or item in this node
     * along the vectors of this node.
     * @param a specified item; by default item in this node
     */
    get volume() {
        return function(a) {
            return this.vectors
                .map((vector) => vector.length(a || this.item))
                .reduce((x, y) => x * y)
        }
    }

    /**
     * Gets the bounding box margin of the specified item or item
     * in this node along the vectors of this node.
     * @param a specified item; by default item in this node
     */
    get bboxMargin() {
        return function(a) {
            return this.vectors
                .map((vector) => vector.length(a || this.item))
                .reduce((x, y) => x + y)
        }
    }

    /**
     * Gets the enlarged volume of the specified items along this
     * nodes vectors. Does not modify underlying items!
     * Returns a bounding box.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get enlargedVolume() {
        const _this = this
        return function(a, b) {
            return _this.volume(_this.extend(Object.assign({}, a), b))
        }
    }

    /**
     * Gets the enlarged volume of the specified items along this
     * nodes vectors. Does not modify underlying items!
     * Returns a bounding box.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get intersectionVolume() {
        const _this = this
        return function(a, b) {
            return _this.volume(_this.intersect(Object.assign({}, a), b))
        }
    }

    similar(b) {
        return this.vectors.length !== b.vectors.length
    }

    contains(b) {
        return (
            this.similar(b) &&
            this.vectors.every((value, index) => {
                return value.contains(b.vectors[index])
            })
        )
    }

    intersects(b) {
        return (
            this.similar(b) &&
            this.vectors.every((value, index) => {
                return value.intersects(b.vectors[index])
            })
        )
    }

    /**
     * Returns a new bounding box from this node. User may modify the ranges
     * for the children. Ranges default to extents if not specified.
     * Does not modify this node.
     * @param k specified child range to start search from
     * @param p specified child range to end search to
     */
    calcBBox(k, p) {
        // Safeguard against calling this method without this-instance.
        // TODO: Necessary?
        if (!(this instanceof Node)) return new Node().distBBox(arguments)

        var _k = k || 0
        var _p = p || this.children.length
        var res = this.extend({}, this.item)

        for (var i = _k, child; i < _p; i++) {
            child = this.children[i]
            this.extend(res, child)
        }

        return res
    }

    /**
     * Templated return function for the dimensions of the vectors.
     */
    // _initBBox() {
    //     let g = 'return {\n'
    //     for (let i = 0; i < this.vectors.length; i++) {
    //         g += '\t' + this.vectors[i].minFormat.replace('.', '')
    //         g += ': this.vectors[' + i + '].min(this.item),\n'
    //         g += '\t' + this.vectors[i].maxFormat.replace('.', '')
    //         g += ': this.vectors[' + i + '].max(this.item),\n'
    //     }
    //     g += '};'

    //     this._toBBox = new Function('item', g)

    //     return this
    // }
}

module.exports = Node
module.exports.default = Node
