'use strict'

class Node {
    /**
     * Default constructor for nodes always creates leaf-nodes.
     * @param {*} vectors vectors to evaluate in the node
     * @param {*} children children to add
     * @param {*} maxlength maximum lenght of the node
     */
    constructor(vectors = [], children = [], maxlength = 16) {
        this.vectors = vectors
        this.children = children
        this.leaf = true
        this.height = 1
        this.maxlength = maxlength
    }

    addVector(vector) {
        this.vectors.push(vector)
    }

    clearVectors() {
        this.vectors = []
    }

    findItem(item, items, equalsFn) {
        if (!equalsFn) return items.indexOf(item)

        for (var i = 0; i < items.length; i++) {
            if (equalsFn(item, items[i])) return i
        }
        return -1
    }

    /**
     * Gets the bounding box for this node for its item.
     * Caches the value, so it has to be updated where necessary.
     * Initial bounding box only looks at the item, not children.
     */
    get bbox() {
        // This should work now as we are making a new object and extending it.
        // Note, what is the performance characteristics?
        if (this._bbox == undefined) {
            this._bbox = this.emptyBox
            this._bbox = this.calcBBox()
        }
        return this._bbox
    }

    get emptyBox() {
        return this.extend({}, {})
    }

    /**
     * Extend specified item a by specified item b along all vectors
     * in the node. Returns the bounding box.
     */
    get extend() {
        return function(a, b) {
            if (b == void 0) {
                this.vectors.forEach((vector) => {
                    vector.extend(this.bbox, a)
                })
                return this.bbox
            } else {
                this.vectors.forEach((vector) => {
                    vector.extend(a, b)
                })
                return a
            }
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
                .map((vector) => vector.length(a || this.bbox))
                .reduce((x, y) => x * y)
        }
    }

    /**
     * Gets the bounding box margin or sum of lenghts along vectors
     * of the specified item or item in this node along the vectors
     * of this node.
     * @param a specified item; defaults to this.bbox
     */
    get bboxMargin() {
        return function(a) {
            return this.vectors
                .map((vector) => vector.length(a || this.bbox))
                .reduce((x, y) => x + y)
        }
    }

    /**
     * Gets the enlarged volume of the specified items along this
     * nodes vectors. Does not modify underlying items!
     * Returns a bounding box along nodes vectors.
     * @param {*} a specified item to extend
     * @param {*} b specified item for the extension
     */
    get enlargedVolume() {
        const _this = this

        return function(a, b) {
            return _this.volume(_this.extend(Object.assign({}, a), b))
            // return b == void 0
            //       ? _this.volume(_this.extend(Object.assign({}, _this.bbox), a))
            //       : _this.volume(_this.extend(Object.assign({}, a), b))
        }
    }

    /**
     * Gets the intersection volume of the specified items along this
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
        if (!(this instanceof Node)) return new Node().calcBBox(arguments)

        var _k = k || 0,
            _p = p || this.children.length,
            cbox = this.emptyBox

        var res = this.emptyBox
        for (var i = _k, child; i < _p; i++) {
            child = this.children[i]
            cbox = child instanceof Node ? child.bbox : child
            this.extend(res, cbox)
        }

        return res
    }

    insert(item, path = [this]) {
        var tree = this.chooseSubtree(item)
        if (tree.leaf) tree.insertUpdate(item)
        else tree.insert(item, path.concat(tree))
        tree._split(path.concat(tree))
    }

    insertUpdate(item) {
        this.children.push(item)
        this.extend(item)
    }

    /**
     * Select the best candidate from this node's children or return the node.
     * @param {*} item to be added
     */
    chooseSubtree(item) {
        if (this.leaf) return this

        let calcs = this.children.map((child) => {
            let v = this.volume(child.bbox)
            return {
                v: v,
                e: this.enlargedVolume(child.bbox, item) - v,
                c: child
            }
        })
        let leastEx = calcs.reduce((prev, cur) => {
            return prev.e < cur.e ? prev : cur
        })
        let leastVol = calcs.reduce((prev, cur) => {
            return prev.v < cur.v ? prev : cur
        })

        return leastVol.v > leastEx.e ? leastEx.c : leastVol.c
    }

    _split(path) {
        // If balanced, just return
        if (this.children.length <= this.maxlength) return
        var newNode = new Node(this.vectors, [], this.maxlength),
            vector = this._chooseSplitAxis(this.children),
            index = this._chooseSplitIndex(this.children, vector),
            nodeIndex = path.findIndex((v) => v == this)

        newNode.children = this.children.splice(0, index)
        this._bbox = this.calcBBox()
        newNode._bbox = newNode.calcBBox()
        path[nodeIndex - 1].children.push(newNode)
        path[nodeIndex - 1]._bbox = path[nodeIndex - 1].calcBBox()
    }

    /**
     * Return the vector from this node with largest variance.
     * TODO: Consider if most items along the vector was suitable.
     */
    _chooseSplitAxis() {
        return [...this.vectors].sort((a, b) => a.length(this.bbox) < b.length(this.bbox))[0]
    }

    /**
     * Choose the split index as the last item to be included in the left side.
     * @param {*} items collection of items to sort
     * @param {*} vector vector by which to split
     */
    _chooseSplitIndex(items, vector) {
        items.sort((a, b) => vector.min(a) - vector.min(b))
        return this.maxlength / 2 - 1
    }

    insert_(item, path = [], parentVolume = this.volume(), level = this.height - 1) {
        var delta,
            minDelta = Infinity,
            minVolume = Infinity,
            target = this,
            volume

        // Breadth-first recursion needed
        // Find smallest volume child and insert there
        // Do not investigate leaves. Nodes contain additional nodes and leaves.
        if (!this.leaf && path.length - 1 < level) {
            for (let i = 0, child; i < this.children.length; i++) {
                child = this.children[i]
                volume = this.volume(child)
                delta = parentVolume - volume

                if (delta < minDelta) {
                    minDelta = delta
                    minVolume = Math.min(volume, minVolume)
                    if (child instanceof Node) {
                        target = child
                    }
                } else if (delta === minDelta) {
                    if (volume < minVolume) {
                        minVolume = volume
                        if (child instanceof Node) {
                            target = child
                        }
                    }
                }
            }
        }

        if (target.leaf) {
            // Do the insert
            target.children.push(item)
            target.extend(item)
        } else if (target !== this) {
            target.insert_(item, target, path, volume, level)
        }

        target.balance(path)
    }

    balance() {
        if (this && this.children.length >= this.maxlength) {
            // split
            console.log('split')
        }
    }

    __insert(item) {
        var insertPath = [],
            bbox = this.extend({}, item),
            level = this.height - 1

        // TODO: Consider refactor as this modifies another node of children.
        // find the best node for accommodating the item, saving all nodes along the path too
        var node = chooseSubtree(bbox, this.children, level, insertPath)

        // put the item into the node
        node.children.push(item)
        // extend(node, bbox);
        this.extend(node.bbox, bbox)

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this.__split(insertPath, level)
                level--
            } else break
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level)
    }

    __split(insertPath, level) {
        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries

        this._chooseSplitAxis(node, m, M)

        var splitIndex = this._chooseSplitIndex(node, m, M)

        var newNode = new Node(
            this.vectors,
            node.children.splice(splitIndex, node.children.length - splitIndex)
        )
        newNode.height = node.height
        newNode.leaf = node.leaf

        this.calcBBox(node, this.toBBox)
        this.calcBBox(newNode, this.toBBox)

        if (level) insertPath[level - 1].children.push(newNode)
        else this._splitRoot(node, newNode)
    }

    splitRoot(node, newNode) {
        this.data = new Node(this.vectors, [node, newNode])
        this.data.height = node.height + 1
        this.data.leaf = false
        this.calcBBox(this.data, this.toBBox)
    }
}

function chooseSubtree(bbox, node, level, path) {
    var i, len, child, targetNode, volume, enlargement, minVolume, minEnlargement

    // eslint-disable-next-line no-constant-condition
    while (true) {
        path.push(node)

        if (node.leaf || path.length - 1 === level) break

        minVolume = minEnlargement = Infinity

        for (i = 0, len = node.children.length; i < len; i++) {
            child = node.children[i]
            volume = child.volume()
            enlargement = child.enlargedVolume(child, bbox) - volume

            // choose entry with the least volume enlargement
            if (enlargement < minEnlargement) {
                minEnlargement = enlargement
                minVolume = volume < minVolume ? volume : minVolume
                targetNode = child
            } else if (enlargement === minEnlargement) {
                // otherwise choose one with the smallest volume
                if (volume < minVolume) {
                    minVolume = volume
                    targetNode = child
                }
            }
        }

        node = targetNode || node.children[0]
    }

    return node
}

module.exports = Node
module.exports.default = Node
