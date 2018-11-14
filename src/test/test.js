'use strict'

/*eslint key-spacing: 0, comma-spacing: 0 */

var rbushen = require('..'),
    Vector = require('../vector.js'),
    Node = require('../node.js'),
    t = require('tape')

t.createStream().pipe(process.stdout)

function sortedEqual(t, actual, expected, compare) {
    compare = compare || defaultCompare
    t.same(actual.slice().sort(compare), expected.slice().sort(compare))
}

function defaultCompare(a, b) {
    return (
        a.min0 - b.min0 ||
        a.min1 - b.min1 ||
        a.min2 - b.min2 ||
        a.max0 - b.max0 ||
        a.max1 - b.max1 ||
        a.max2 - b.max2
    )
}

function someData(n) {
    var data = []

    for (var i = 0; i < n; i++) {
        data.push({ min0: i, max0: i, min1: i, max1: i, min2: 0, max2: 0 })
    }
    return data
}

function arrToBBox(arr) {
    return {
        min0: arr[0],
        max0: arr[1],
        min1: arr[2],
        max1: arr[3],
        min2: arr[4],
        max2: arr[5]
    }
}

var data = [
    [0, 0, 0, 0, 0, 0],
    [10, 10, 10, 10, 10, 10],
    [20, 20, 20, 20, 20, 20],
    [25, 25, 0, 0, 0, 0],
    [35, 35, 10, 10, 5, 5],
    [45, 45, 20, 20, 10, 10],
    [0, 0, 25, 25, 50, 50],
    [10, 10, 35, 35, 60, 60],
    [20, 20, 45, 45, 30, 30],
    [25, 25, 25, 25, 25, 25],
    [35, 35, 35, 35, 35, 35],
    [45, 45, 45, 45, 45, 45],
    [50, 50, 0, 0, 25, 25],
    [60, 60, 10, 10, 30, 30],
    [70, 70, 20, 20, 30, 30],
    [75, 75, 0, 0, 10, 10],
    [85, 85, 10, 10, 60, 60],
    [95, 95, 20, 20, 0, 0],
    [50, 50, 25, 25, 20, 20],
    [60, 60, 35, 35, 50, 50],
    [70, 70, 45, 45, 70, 70],
    [75, 75, 25, 25, 45, 45],
    [85, 85, 35, 35, 15, 15],
    [95, 95, 45, 45, 5, 5],
    [0, 0, 50, 50, 0, 0],
    [10, 10, 60, 60, 80, 80],
    [20, 20, 70, 70, 40, 40],
    [25, 25, 50, 50, 20, 20],
    [35, 35, 60, 60, 55, 55],
    [45, 45, 70, 70, 35, 35],
    [0, 0, 75, 75, 30, 30],
    [10, 10, 85, 85, 50, 50],
    [20, 20, 95, 95, 25, 25],
    [25, 25, 75, 75, 45, 45],
    [35, 35, 85, 85, 50, 50],
    [45, 45, 95, 95, 15, 15],
    [50, 50, 50, 50, 50, 50],
    [60, 60, 60, 60, 60, 60],
    [70, 70, 70, 70, 70, 70],
    [75, 75, 50, 50, 30, 30],
    [85, 85, 60, 60, 30, 30],
    [95, 95, 70, 70, 45, 45],
    [50, 50, 75, 75, 20, 20],
    [60, 60, 85, 85, 65, 65],
    [70, 70, 95, 95, 85, 85],
    [75, 75, 75, 75, 75, 75],
    [85, 85, 85, 85, 85, 85],
    [95, 95, 95, 95, 95, 95]
].map(arrToBBox)

function intersects(a, b) {
    return (
        b.min0 <= a.max0 &&
        b.max0 >= a.min0 &&
        b.min1 <= a.max1 &&
        b.max1 >= a.min1 &&
        b.min2 <= a.max2 &&
        b.max2 >= a.min2
    )
}

function bfSearch(bbox, data) {
    return data.filter(function(node) {
        return intersects(bbox, node)
    })
}

function bfCollides(bbox, data) {
    return data.some(function(node) {
        return intersects(bbox, node)
    })
}

function randBox(size) {
    var x = Math.random() * (2 - size) - 1,
        y = Math.random() * (2 - size) - 1,
        z = Math.random() * (2 - size) - 1
    return {
        min0: x,
        max0: x + size * Math.random(),
        min1: y,
        max1: y + size * Math.random(),
        min2: z,
        max2: z + size * Math.random()
    }
}

function randBoxes(number, size) {
    var result = Array(number)
    for (let i = 0; i < number; i++) {
        result[i] = randBox(size)
    }
    return result
}

var emptyData = [
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity],
    [-Infinity, Infinity, -Infinity, Infinity, -Infinity, Infinity]
].map(arrToBBox)

t('vector getters always return values', function(t) {
    var box1 = { min0: -2 },
        box2 = { max0: 1 },
        vec1 = new Vector()

    t.same(vec1.max(box1), -Infinity)
    t.same(vec1.min(box2), Infinity)
    t.end()
})

t('vector minimum works', function(t) {
    var box0 = { min0: -2, max0: 2 },
        box1 = { min0: -1, max0: 1 },
        vec0 = new Vector()

    t.same(vec0.maximum(box0, box1), box0.max0)
    t.same(vec0.minimum(box0, box1), box0.min0)
    t.end()
})

t('vector extend works', function(t) {
    var box0 = { min0: -2, max0: -Infinity },
        box1 = { min0: -1, max0: 3 },
        box2 = { min0: -2, max0: 3 },
        vec0 = new Vector()

    t.same(vec0.extend(box0, box1), box2)
    t.same(box0, box2)
    t.end()
})

t('vector intersect works', function(t) {
    var box0 = { max0: 4, min0: -4 },
        box1 = { max0: 1, min0: -2 },
        box2 = { max0: 5, min0: -1 },
        res1 = { max0: 1, min0: -2 },
        res2 = { max0: 1, min0: -1 },
        vec0 = new Vector()

    t.same(vec0.intersect(box0, box1), res1)
    t.same(vec0.intersect(box0, box2), res2)
    t.end()
})

t('node extend works along all specified vectors', function(t) {
    var box0 = { min0: -2, max0: 2, min1: -2, max1: 2, min2: -2, max2: 2 },
        box1 = { min0: -1, max0: 3, min1: -1, max1: 3, min2: -1, max2: 3 },
        box2 = { min0: -2, max0: 3, min1: -2, max1: 3, min2: -2, max2: 3 },
        boxEmpty = {},
        vec0 = new Vector('.min0', '.max0'),
        vec1 = new Vector('.min1', '.max1'),
        vec2 = new Vector('.min2', '.max2'),
        node0 = new Node(box0, [vec0, vec1, vec2])

    node0.extend(box0, box1)
    node0.extend(boxEmpty, box1)

    t.same(box0, box2)
    t.same(boxEmpty, box1)
    t.end()
})

t('node intersect works along all specified vectors', function(t) {
    var box0 = { max0: 3, min0: 0, max1: 3, min1: 0, max2: 3, min2: 0 },
        box1 = { max0: 2, min0: 0, max1: 2, min1: 0, max2: 2, min2: 0 },
        box2 = { max0: 1, min0: 0, max1: 1, min1: 0, max2: 1, min2: 0 },
        boxEmpty = {},
        vec0 = new Vector('.min0', '.max0'),
        vec1 = new Vector('.min1', '.max1'),
        vec2 = new Vector('.min2', '.max2'),
        node0 = new Node(box0, [vec0, vec1, vec2])

    node0.intersect(box0, box1)
    node0.intersect(box0, box2)
    node0.intersect(boxEmpty, box2)

    t.same(box0, box2)
    t.same(boxEmpty, box2)
    t.notSame(box0, box1)
    t.notSame(boxEmpty, box1)
    t.end()
})

t('node volume works', function(t) {
    var box0 = { min0: -2, max0: 2, min1: -2, max1: 2, min2: -2, max2: 2 },
        volume = (2 - -2) * (2 - -2) * (2 - -2),
        vec0 = new Vector('.min0', '.max0'),
        vec1 = new Vector('.min1', '.max1'),
        vec2 = new Vector('.min2', '.max2'),
        node0 = new Node(box0, [vec0, vec1, vec2])

    t.same(node0.volume(), volume)
    t.end()
})

t('node volume works', function(t) {
    var box0 = { min0: -2, max0: 2, min1: -2, max1: 2, min2: -2, max2: 2 },
        margin = 2 - -2 + (2 - -2) + (2 - -2),
        vec0 = new Vector('.min0', '.max0'),
        vec1 = new Vector('.min1', '.max1'),
        vec2 = new Vector('.min2', '.max2'),
        node0 = new Node(box0, [vec0, vec1, vec2])

    t.same(node0.bboxMargin(), margin)
    t.end()
})

t('vector contains works with external items', function(t) {
    var box0 = { min0: -2, max0: 2 },
        box1 = { min0: -1, max0: 1 },
        box2 = { min0: -3, max0: 3 },
        vec0 = new Vector('.min0', '.max0')

    t.true(vec0.contains(box0, box1))
    t.false(vec0.contains(box0, box2))
    t.end()
})

t('vector intersects works with external items', function(t) {
    var box0 = { min0: -1, max0: 2 },
        box1 = { min0: -2, max0: 0 },
        box2 = { min0: -6, max0: -5 },
        vec0 = new Vector('.min0', '.max0')

    t.true(vec0.intersects(box0, box1))
    t.false(vec0.intersects(box0, box2))
    t.end()
})

t('node provides bounding boxes', function(t) {
    var box0 = { min0: -1, max0: 2 },
        box1 = { min0: -1, max0: 2 },
        vec0 = new Vector('.min0', '.max0'),
        node0 = new Node(box0, [vec0])

    t.same(node0.bbox, box1)
    t.end()
})

t('node bounding boxes extend with children', function(t) {
    var box0 = { min0: 0, max0: 1 },
        box1 = { min0: 0, max0: 2 },
        box2 = { min0: 0, max0: 3 },
        vec0 = new Vector('.min0', '.max0'),
        node0 = new Node(box0, [vec0], [box1, box2]),
        node1 = new Node(box0, [vec0], [box1, box2])

    t.same(node0.calcBBox(0, 1), box1)
    t.same(node0.calcBBox(1, 2), box2)
    t.same(node1.calcBBox(), box2)

    t.end()
})

t('node enlarged volume works', function(t) {
    var box0 = { min0: 0, max0: 1, min1: 0, max1: 0 },
        box00 = { min0: 0, max0: 1, min1: 0, max1: 0 },
        box1 = { min0: 0, max0: 2, min1: 0, max1: 0 },
        box2 = { min0: 0, max0: 3, min1: 0, max1: 0 },
        vec0 = new Vector('.min0', '.max0'),
        vec1 = new Vector('.min1', '.max1'),
        node0 = new Node(box0, [vec0]),
        node1 = new Node(box0, [vec0, vec1])

    // This set only looks at vec0 and volume is 3
    t.same(node0.enlargedVolume(box0, box1), node0.volume(box1))
    t.same(node0.enlargedVolume(box1, box2), node0.volume(box2))
    // This set looks at both vec0 and vec1 and volume is 0
    t.same(node1.enlargedVolume(box0, box1), node1.volume(box1))
    t.same(node1.enlargedVolume(box1, box2), node1.volume(box2))

    t.same(box0, box00, 'Enlarged volume does not modify the original')

    t.end()
})

// t('constructor accepts a format argument to customize the data format', function (t) {
//     var tree = rbushen(8, ['.minXX', '.maxXX', '.minYY', '.maxYY', '.minZZ', '.maxZZ']);
//     t.same(tree.toBBox({minXX: 1, maxXX: 2, minYY: 3, maxYY: 4, minZZ: 5, maxZZ: 6}),
//         arrToBBox([1, 2, 3, 4, 5, 6]));
//     t.end();
// });

// t('constructor uses 16 max entries by default', function (t) {
//     var tree = rbushen().load(someData(16));
//     t.equal(tree.toJSON().height, 1);

//     var tree2 = rbushen().load(someData(17));
//     t.equal(tree2.toJSON().height, 2);
//     t.end();
// });

// t('#toBBox, #compareMinX, #compareMinY can be overriden to allow custom data structures', function (t) {

//     var tree = rbushen(8);
//     tree.toBBox = function (item) {
//         return {
//             min0: item.minXX,
//             max0: item.maxXX,
//             min1: item.minYY,
//             max1: item.maxYY,
//             min2: item.minZZ,
//             max2: item.maxZZ
//         };
//     };
//     tree.compareMinX = function (a, b) {
//         return a.minXX - b.minXX;
//     };
//     tree.compareMinY = function (a, b) {
//         return a.minYY - b.minYY;
//     };
//     tree.compareMinZ = function (a, b) {
//         return a.minZZ - b.minZZ;
//     };

//     // TODO: Ordering should not matter here but check none the same.
//     var data = [
//         {minXX: -115, maxXX: -105, minYY:  45, maxYY:  55, minZZ:  25, maxZZ:  35},
//         {minXX:  105, maxXX:  115, minYY:  45, maxYY:  55, minZZ:  25, maxZZ:  35},
//         {minXX:  105, maxXX:  115, minYY: -55, maxYY: -45, minZZ:  25, maxZZ:  35},
//         {minXX: -115, maxXX: -105, minYY: -55, maxYY: -45, minZZ:  25, maxZZ:  35},
//         {minXX: -115, maxXX: -105, minYY:  45, maxYY:  55, minZZ: -35, maxZZ: -25},
//         {minXX:  105, maxXX:  115, minYY:  45, maxYY:  55, minZZ: -35, maxZZ: -25},
//         {minXX:  105, maxXX:  115, minYY: -55, maxYY: -45, minZZ: -35, maxZZ: -25},
//         {minXX: -115, maxXX: -105, minYY: -55, maxYY: -45, minZZ: -35, maxZZ: -25}
//     ];

//     tree.load(data);

//     function byXXYYZZ(a, b) {
//         return a.minXX - b.minXX || a.minYY - b.minYY || a.minZZ - b.minZZ;
//     }

//     sortedEqual(t, tree.search(arrToBBox([-180, 180, -90, 90, -50, 50])),
//         data, byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 0, -90,  90, -50, 0])), [
//         {minXX: -115, minYY: -55, minZZ: -35, maxXX: -105, maxYY: -45, maxZZ: -25},
//         {minXX: -115, minYY: 45, minZZ: -35, maxXX: -105, maxYY: 55, maxZZ: -25}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([0, 180, -90, 90, 0, 50])), [
//         {minXX: 105, minYY: -55, minZZ: 25, maxXX: 115, maxYY: -45, maxZZ: 35},
//         {minXX: 105, minYY: 45, minZZ: 25, maxXX: 115, maxYY: 55, maxZZ: 35}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 180, 0, 90, -50, 0])), [
//         {minXX: -115, minYY: 45, minZZ: -35, maxXX: -105, maxYY: 55, maxZZ: -25},
//         {minXX: 105, minYY: 45, minZZ: -35, maxXX: 115, maxYY: 55, maxZZ: -25}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 180, -90, 0, 0, 50])), [
//         {minXX: -115, minYY: -55, minZZ: 25, maxXX: -105, maxYY: -45, maxZZ: 35},
//         {minXX: 105, minYY: -55, minZZ: 25, maxXX: 115, maxYY: -45, maxZZ: 35}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 0, -90, 90, 0, 50])), [
//         {minXX: -115, minYY: -55, minZZ: 25, maxXX: -105, maxYY: -45, maxZZ: 35},
//         {minXX: -115, minYY: 45, minZZ: 25, maxXX: -105, maxYY: 55, maxZZ: 35}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([0, 180, -90, 90, -50, 0])), [
//         {minXX: 105, minYY: -55, minZZ: -35, maxXX: 115, maxYY: -45, maxZZ: -25},
//         {minXX: 105, minYY: 45, minZZ: -35, maxXX: 115, maxYY: 55, maxZZ: -25}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 180, 0, 90, 0, 50])), [
//         {minXX: -115, minYY: 45, minZZ: 25, maxXX: -105, maxYY: 55, maxZZ: 35},
//         {minXX: 105, minYY: 45, minZZ: 25, maxXX: 115, maxYY: 55, maxZZ: 35}
//     ], byXXYYZZ);

//     sortedEqual(t, tree.search(arrToBBox([-180, 180, -90, 0, -50, 0])), [
//         {minXX: -115, minYY: -55, minZZ: -35, maxXX: -105, maxYY: -45, maxZZ: -25},
//         {minXX: 105, minYY: -55, minZZ: -35, maxXX: 115, maxYY: -45, maxZZ: -25}
//     ], byXXYYZZ);
//     t.end();
// });

// t('#load bulk-loads the given data given max node entries and forms a proper search tree', function (t) {

//     var tree = rbushen(8).load(data);
//     t.same(tree.all().length, data.length);
//     sortedEqual(t, tree.all(), data);

//     t.end();
// });

// t('#load uses standard insertion when given a low number of items', function (t) {

//     var tree = rbushen(16)
//         .load(data)
//         .load(data.slice(0, 6));

//     var tree2 = rbushen(16)
//         .load(data)
//         .insert(data[0])
//         .insert(data[1])
//         .insert(data[2])
//         .insert(data[3])
//         .insert(data[4])
//         .insert(data[5]);

//     t.same(tree.toJSON(), tree2.toJSON());
//     t.end();
// });

// t('#load does nothing if loading empty data', function (t) {
//     var tree = rbushen().load([]);

//     t.same(tree.toJSON(), rbushen().toJSON());
//     t.end();
// });

// t('#load handles the insertion of maxEntries + 2 empty bboxes', function (t) {
//     var tree = rbushen(8)
//         .load(emptyData);

//     t.equal(tree.toJSON().height, 2);
//     sortedEqual(t, tree.all(), emptyData);

//     t.end();
// });

// t('#insert handles the insertion of maxEntries + 2 empty bboxes', function (t) {
//     var tree = rbushen(8);

//     emptyData.forEach(function (datum) {
//         tree.insert(datum);
//     });

//     t.equal(tree.toJSON().height, 2);
//     sortedEqual(t, tree.all(), emptyData);

//     t.end();
// });

// t('#load properly splits tree root when merging trees of the same height', function (t) {
//     var tree = rbushen(8)
//         .load(data)
//         .load(data);

//     t.equal(tree.toJSON().height, 3);
//     sortedEqual(t, tree.all(), data.concat(data));

//     t.end();
// });

// t('#load properly merges data of smaller or bigger tree heights', function (t) {
//     var smaller = someData(5);

//     var tree1 = rbushen(8)
//         .load(data)
//         .load(smaller);

//     var tree2 = rbushen(8)
//         .load(smaller)
//         .load(data);

//     t.equal(tree1.toJSON().height, tree2.toJSON().height);

//     sortedEqual(t, tree1.all(), data.concat(smaller));
//     sortedEqual(t, tree2.all(), data.concat(smaller));

//     t.end();
// });

// t('#search finds matching points in the tree given a bbox', function (t) {

//     var tree = rbushen(8).load(data);
//     var bbox = arrToBBox([40, 20, 90, 80, 70, 90]);
//     var result = tree.search(bbox);
//     var expectedResult = bfSearch(bbox, data);
//     sortedEqual(t, result, expectedResult);
//     t.end();
// });

// t('#collides returns true when search finds matching points', function (t) {

//     var tree = rbushen(8).load(data);
//     var result = tree.collides(arrToBBox([40, 80, 20, 70, 10, 90]));

//     t.same(result, true);

//     t.end();
// });

// t('#search returns an empty array if nothing found', function (t) {
//     var result = rbushen(8).load(data).search(arrToBBox([200, 200, 200, 210, 210, 210]));

//     t.same(result, []);
//     t.end();
// });

// t('#collides returns false if nothing found', function (t) {
//     var tree = rbushen(8).load(data);
//     var result = tree.collides(arrToBBox([200, 200, 200, 210, 210, 210]));
//     var result2 = tree.collides(arrToBBox([2, 2, 2, 3, 3, 3]));

//     t.same(result, false);
//     t.same(result2, false);
//     t.end();
// });

// t('#all returns all points in the tree', function (t) {

//     var tree = rbushen(8).load(data);
//     var result = tree.all();

//     sortedEqual(t, result, data);
//     sortedEqual(t, tree.search(arrToBBox([0, 100, 0, 100, 0, 100])), data);

//     t.end();
// });

// t('#toJSON & #fromJSON exports and imports search tree in JSON format', function (t) {

//     var tree = rbushen(8).load(data);
//     var tree2 = rbushen(8).fromJSON(tree.data);

//     sortedEqual(t, tree.all(), tree2.all());
//     t.end();
// });

// t('#insert adds an item to an existing tree correctly', function (t) {
//     var items = [
//         [0, 0, 0, 0, 0, 0],
//         [1, 1, 1, 1, 1, 1],
//         [2, 2, 2, 2, 2, 2],
//         [3, 3, 3, 3, 3, 3],
//         [4, 4, 4, 4, 4, 4],
//         [5, 5, 5, 5, 5, 5],
//         [1, 2, 1, 3, 2, 3],
//         [2, 3, 2, 4, 3, 4],
//         [3, 4, 3, 5, 4, 5],
//     ].map(arrToBBox);

//     var tree = rbushen(8).load(items.slice(0, 7));

//     tree.insert(items[7]);
//     t.equal(tree.toJSON().height, 1);
//     sortedEqual(t, tree.all(), items.slice(0, 8));

//     tree.insert(items[8]);
//     t.equal(tree.toJSON().height, 2);
//     sortedEqual(t, tree.all(), items);

//     t.end();
// });

// t('#insert does nothing if given undefined', function (t) {
//     t.same(
//         rbushen().load(data),
//         rbushen().load(data).insert());
//     t.end();
// });

// t('#insert forms a valid tree if items are inserted one by one', function (t) {
//     var tree = rbushen(8);

//     for (var i = 0; i < data.length; i++) {
//         tree.insert(data[i]);
//     }

//     var tree2 = rbushen(8).load(data);

//     t.ok(tree.toJSON().height - tree2.toJSON().height <= 1);

//     sortedEqual(t, tree.all(), tree2.all());
//     t.end();
// });

// t('#remove removes items correctly', function (t) {
//     var tree = rbushen(8).load(data);

//     var len = data.length;

//     tree.remove(data[0]);
//     tree.remove(data[1]);
//     tree.remove(data[2]);

//     tree.remove(data[len - 1]);
//     tree.remove(data[len - 2]);
//     tree.remove(data[len - 3]);

//     sortedEqual(t,
//         data.slice(3, len - 3),
//         tree.all());
//     t.end();
// });
// t('#remove does nothing if nothing found', function (t) {
//     t.same(
//         rbushen().load(data),
//         rbushen().load(data).remove([13, 13, 13, 13, 13, 13]));
//     t.end();
// });
// t('#remove does nothing if given undefined', function (t) {
//     t.same(
//         rbushen().load(data),
//         rbushen().load(data).remove());
//     t.end();
// });
// t('#remove brings the tree to a clear state when removing everything one by one', function (t) {
//     var tree = rbushen(8).load(data).load(data);

//     for (var i = 0; i < data.length; i++) {
//         tree.remove(data[i]);
//         tree.remove(data[i]);
//     }

//     t.same(tree.toJSON(), rbushen(8).toJSON());
//     t.end();
// });
// t('#remove accepts an equals function', function (t) {
//     var tree = rbushen(8).load(data);

//     var item = {min0: 20, max0: 20, min1: 70, max1: 70, min2: 90, max2: 90, foo: 'bar'};

//     tree.insert(item);
//     tree.remove(JSON.parse(JSON.stringify(item)), function (a, b) {
//         return a.foo === b.foo;
//     });

//     sortedEqual(t, tree.all(), data);
//     t.end();
// });

// t('#clear should clear all the data in the tree', function (t) {
//     t.same(
//         rbushen(8).load(data).clear().toJSON(),
//         rbushen(8).toJSON());
//     t.end();
// });

// t('should have chainable API', function (t) {
//     t.doesNotThrow(function () {
//         rbushen()
//             .load(data)
//             .insert(data[0])
//             .remove(data[0]);
//     });
//     t.end();
// });

// t('compare #bulk-load and #insert with random data', function (t) {
//     var BOXEX_NUMBER = 10000, BOX_SIZE = 100000;
//     var randomBoxes = randBoxes(BOXEX_NUMBER, BOX_SIZE);
//     var tree = rbushen(8).load(randomBoxes);
//     var tree2 = rbushen(8);

//     randomBoxes.forEach(function (bbox) {
//         tree2.insert(bbox);
//     });
//     sortedEqual(t, tree.all(), randomBoxes);
//     sortedEqual(t, tree2.all(), randomBoxes);
//     t.end();
// });

// t('#search with random data', function (t) {
//     var POINT_SIZE = 10000, BOX_SIZE = 10000;
//     var POINTS_NUMBER = 10000, BOXEX_NUMBER = 100;

//     var randomPoints = randBoxes(POINTS_NUMBER, POINT_SIZE);
//     var randomBoxes = randBoxes(BOXEX_NUMBER, BOX_SIZE);
//     var tree = rbushen(8).load(randomPoints);

//     randomBoxes.forEach(function (bbox) {
//         var result = tree.search(bbox);
//         var expectedResult = bfSearch(bbox, randomPoints);
//         sortedEqual(t, result, expectedResult);
//     });
//     t.end();
// });

// t('#collides with random data', function (t) {
//     var POINT_SIZE = 100000, BOX_SIZE = 1000;
//     var POINTS_NUMBER = 100000, BOXEX_NUMBER = 1000;

//     var randomPoints = randBoxes(POINTS_NUMBER, POINT_SIZE);
//     var randomBoxes = randBoxes(BOXEX_NUMBER, BOX_SIZE);
//     var tree = rbushen(8).load(randomPoints);

//     randomBoxes.forEach(function (bbox) {
//         var result = tree.collides(bbox);
//         var expectedResult = bfCollides(bbox, randomPoints);
//         t.same(result, expectedResult);
//     });
//     t.end();
// });
