'use strict';

module.exports = rbush3d;
module.exports.default = rbush3d;

var quickselect = require('quickselect');

function rbush3d(maxEntries, format) {
    if (!(this instanceof rbush3d)) return new rbush3d(maxEntries, format);

    // max entries in a node is 16 by default; min node fill is 40% for best performance
    this._maxEntries = Math.max(8, maxEntries || 16);
    this._minEntries = Math.max(4, Math.ceil(this._maxEntries * 0.4));

    if (format) {
        this._initFormat(format);
    }

    this.clear();
}

rbush3d.prototype = {

    all: function () {
        return this._all(this.data, []);
    },

    search: function (bbox) {

        var node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return result;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    },

    collides: function (bbox) {

        var node = this.data,
            toBBox = this.toBBox;

        if (!intersects(bbox, node)) return false;

        var nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child;

                if (intersects(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    },

    load: function (data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from scratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    },

    insert: function (item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    },

    clear: function () {
        this.data = createNode([]);
        return this;
    },

    remove: function (item, equalsFn) {
        if (!item) return this;

        var node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = findItem(item, node.children, equalsFn);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else node = null; // nothing found
        }

        return this;
    },

    toBBox: function (item) { return item; },

    compareVectors: [compareNodeMinX, compareNodeMinY, compareNodeMinZ],
    compareMinX: compareNodeMinX,
    compareMinY: compareNodeMinY,
    compareMinZ: compareNodeMinZ,

    toJSON: function () { return this.data; },

    fromJSON: function (data) {
        this.data = data;
        return this;
    },

    _all: function (node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    },

    _build: function (items, left, right, height) {

        var N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = createNode([]);
        node.leaf = false;
        node.height = height;

        let l = this.compareVectors.length;
        let dimensions = [];
        dimensions.unshift(Math.ceil(N / M));
        let counters = [];
        this.compareVectors.forEach((vector, index) => {
            if (dimensions.length < l)
                dimensions.unshift(dimensions[index] * Math.ceil(Math.pow(M, (l - index) / l)));
            counters.push(0);
        });

        const lastIndex = dimensions.length - 1;
        const deeper = (depth, ii, ll, rr) => {
            let dim = dimensions[depth];
            multiSelect(items, ll, rr, dim, this.compareVectors[depth]);

            for (counters[depth] = ll; counters[depth] <= rr; counters[depth] += dim) {

                let newRight = Math.min(counters[depth] + dim - 1, rr);

                if (depth < lastIndex)
                    deeper(depth + 1, ii, counters[depth], newRight);
                else
                    node.children.push(this._build(items, counters[depth], newRight, height - 1));
            }
        };
        deeper(0, 0, left, right);

        calcBBox(node, this.toBBox);

        return node;
    },

    _chooseSubtree: function (bbox, node, level, path) {

        var i, len, child, targetNode, volume, enlargement, minVolume, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minVolume = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                volume = bboxVolume(child);
                enlargement = enlargedVolume(bbox, child) - volume;

                // choose entry with the least volume enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minVolume = volume < minVolume ? volume : minVolume;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest volume
                    if (volume < minVolume) {
                        minVolume = volume;
                        targetNode = child;
                    }
                }
            }

            node = targetNode || node.children[0];
        }

        return node;
    },

    _insert: function (item, level, isNode) {

        var toBBox = this.toBBox,
            bbox = isNode ? item : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    },

    // split overflowed node into two
    _split: function (insertPath, level) {

        var node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    },

    _splitRoot: function (node, newNode) {
        // split root node
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    },

    _chooseSplitIndex: function (node, m, M) {

        var i, bbox1, bbox2, overlap, volume, minOverlap, minVolume, index;

        minOverlap = minVolume = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = distBBox(node, 0, i, this.toBBox);
            bbox2 = distBBox(node, i, M, this.toBBox);

            overlap = intersectionVolume(bbox1, bbox2);
            volume = bboxVolume(bbox1) + bboxVolume(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minVolume = volume < minVolume ? volume : minVolume;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum volume
                if (volume < minVolume) {
                    minVolume = volume;
                    index = i;
                }
            }
        }

        return index;
    },

    // sorts node children by the best axis for split
    _chooseSplitAxis: function (node, m, M) {

        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : compareNodeMinY,
            compareMinZ = node.leaf ? this.compareMinZ : compareNodeMinZ,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY),
            zMargin = this._allDistMargin(node, m, M, compareMinZ);

        // if total distributions margin value is minimal for x, sort by min0,
        // if total distributions margin value is minimal for y, sort by min1,
        // otherwise it's already sorted by min2
        if (xMargin < yMargin && xMargin < zMargin) {
            node.children.sort(compareMinX);
        } else if (yMargin < xMargin && yMargin < zMargin) {
            node.children.sort(compareMinY);
        }
    },

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin: function (node, m, M, compare) {

        node.children.sort(compare);

        var toBBox = this.toBBox,
            leftBBox = distBBox(node, 0, m, toBBox),
            rightBBox = distBBox(node, M - m, M, toBBox),
            margin = bboxMargin(leftBBox) + bboxMargin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            extend(rightBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    },

    _adjustParentBBoxes: function (bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    },

    _condense: function (path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);

                } else this.clear();

            } else calcBBox(path[i], this.toBBox);
        }
    },

    _initFormat: function (format) {
        // data format (min0, min1, min2, max0, max1, max2 accessors)

        // uses eval-type function compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        var compareArr = ['return a', ' - b', ';'];

        var bboxFunc = 'return {';
        this.compareVectors = [];
        format.forEach((vector, index) => {
            this.compareVectors.push(new Function('a', 'b', compareArr.join(vector)));
            bboxFunc += (!index ? '' : ', ') + (index % 2 ? 'max' : 'min') + Math.floor(index / 2) + ': a' + vector;
        });
        bboxFunc += '};';

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[2]));
        this.compareMinZ = new Function('a', 'b', compareArr.join(format[4]));

        this.toBBox = new Function('a', bboxFunc);
    }
};

function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);

    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.min0 = Infinity;
    destNode.max0 = -Infinity;
    destNode.min1 = Infinity;
    destNode.max1 = -Infinity;
    destNode.min2 = Infinity;
    destNode.max2 = -Infinity;

    for (var i = k, child; i < p; i++) {
        child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }

    return destNode;
}

function extend(a, b) {
    a.min0 = Math.min(a.min0, b.min0);
    a.max0 = Math.max(a.max0, b.max0);
    a.min1 = Math.min(a.min1, b.min1);
    a.max1 = Math.max(a.max1, b.max1);
    a.min2 = Math.min(a.min2, b.min2);
    a.max2 = Math.max(a.max2, b.max2);
    return a;
}

function compareNodeMinX(a, b) { return a.min0 - b.min0; }
function compareNodeMinY(a, b) { return a.min1 - b.min1; }
function compareNodeMinZ(a, b) { return a.min2 - b.min2; }

function bboxVolume(a)   {
    return (a.max0 - a.min0) *
           (a.max1 - a.min1) *
           (a.max2 - a.min2);
}

function bboxMargin(a) {
    return (a.max0 - a.min0) + (a.max1 - a.min1) + (a.max2 - a.min2);
}

function enlargedVolume(a, b) {
    var min0 = Math.min(a.min0, b.min0),
        max0 = Math.max(a.max0, b.max0),
        min1 = Math.min(a.min1, b.min1),
        max1 = Math.max(a.max1, b.max1),
        min2 = Math.min(a.min2, b.min2),
        max2 = Math.max(a.max2, b.max2);

    return (max0 - min0) *
           (max1 - min1) *
           (max2 - min2);
}

function intersectionVolume(a, b) {
    var min0 = Math.max(a.min0, b.min0),
        max0 = Math.min(a.max0, b.max0),
        min1 = Math.max(a.min1, b.min1),
        max1 = Math.min(a.max1, b.max1),
        min2 = Math.max(a.min2, b.min2),
        max2 = Math.min(a.max2, b.max2);

    return Math.max(0, max0 - min0) *
           Math.max(0, max1 - min1) *
           Math.max(0, max2 - min2);
}

function contains(a, b) {
    return a.min0 <= b.min0 &&
           b.max0 <= a.max0 &&
           a.min1 <= b.min1 &&
           b.max1 <= a.max1 &&
           a.min2 <= b.min2 &&
           b.max2 <= a.max2;
}

function intersects(a, b) {
    return b.min0 <= a.max0 &&
           b.max0 >= a.min0 &&
           b.min1 <= a.max1 &&
           b.max1 >= a.min1 &&
           b.min2 <= a.max2 &&
           b.max2 >= a.min2;
}

function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        min0: Infinity,
        max0: -Infinity,
        min1: Infinity,
        max1: -Infinity,
        min2: Infinity,
        max2: -Infinity
    };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right],
        mid;

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);

        stack.push(left, mid, mid, right);
    }
}
