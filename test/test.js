'use strict';

/*eslint key-spacing: 0, comma-spacing: 0 */

var rbush = require('..'),
    t = require('tape');

function sortedEqual(t, a, b, compare) {
    compare = compare || defaultCompare;
    t.same(a.slice().sort(compare), b.slice().sort(compare));
}

function defaultCompare(a, b) {
    return (a.minX - b.minX) || (a.minY - b.minY) || (a.minZ - b.minZ) ||
           (a.maxX - b.maxX) || (a.maxY - b.maxY) || (a.maxZ - b.maxZ);
}

function someData(n) {
    var data = [];

    for (var i = 0; i < n; i++) {
        data.push({minX: i, minY: i, minZ: 0, maxX: i, maxY: i, maxZ: 0});
    }
    return data;
}

function arrToBBox(arr) {
    return {
        minX: arr[0],
        minY: arr[1],
        minZ: arr[2],
        maxX: arr[3],
        maxY: arr[4],
        maxZ: arr[5]
    };
}

var data = [[0,0,0,0,0,0],[10,10,10,10,10,10],[20,20,20,20,20,20],[25,0,0,25,0,0],[35,10,5,35,10,5],
    [45,20,10,45,20,10],[0,25,50,0,25,50],[10,35,60,10,35,60],[20,45,30,20,45,30],[25,25,25,25,25,25],
    [35,35,35,35,35,35],[45,45,45,45,45,45],[50,0,25,50,0,25],[60,10,30,60,10,30],[70,20,30,70,20,30],
    [75,0,10,75,0,10],[85,10,60,85,10,60],[95,20,0,95,20,0],[50,25,20,50,25,20],[60,35,50,60,35,50],
    [70,45,70,70,45,70],[75,25,45,75,25,45],[85,35,15,85,35,15],[95,45,5,95,45,5],[0,50,0,0,50,0],
    [10,60,80,10,60,80],[20,70,40,20,70,40],[25,50,20,25,50,20],[35,60,55,35,60,55],[45,70,35,45,70,35],
    [0,75,30,0,75,30],[10,85,50,10,85,50],[20,95,25,20,95,25],[25,75,45,25,75,45],[35,85,50,35,85,50],
    [45,95,15,45,95,15],[50,50,50,50,50,50],[60,60,60,60,60,60],[70,70,70,70,70,70],[75,50,30,75,50,30],
    [85,60,30,85,60,30],[95,70,45,95,70,45],[50,75,20,50,75,20],[60,85,65,60,85,65],[70,95,85,70,95,85],
    [75,75,75,75,75,75],[85,85,85,85,85,85],[95,95,95,95,95,95]
].map(arrToBBox);


function intersects(a, b) {
    return b.minX <= a.maxX &&
            b.minY <= a.maxY &&
            b.minZ <= a.maxZ &&
            b.maxX >= a.minX &&
            b.maxY >= a.minY &&
            b.maxZ >= a.minZ;
}

function bfSearch(bbox, data) {
    return data.filter(function (node) {
        return intersects(bbox, node);
    });
}

function bfCollides(bbox, data) {
    return data.some(function (node) {
        return intersects(bbox, node);
    });
}

function randBox(size) {
    var x = Math.random() * (2 - size) - 1,
        y = Math.random() * (2 - size) - 1,
        z = Math.random() * (2 - size) - 1;
    return {
        minX: x,
        minY: y,
        minZ: z,
        maxX: x + size * Math.random(),
        maxY: y + size * Math.random(),
        maxZ: z + size * Math.random()
    };
}

function randBoxes(number, size) {
    var result = Array(number);
    for (let i = 0; i < number; i++) {
        result[i] = randBox(size);
    }
    return result;
}

var emptyData = [
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, Infinity, Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity],
    [-Infinity, -Infinity, -Infinity, Infinity, Infinity, -Infinity]
].map(arrToBBox);

t('constructor accepts a format argument to customize the data format', function (t) {
    var tree = rbush(4, ['.minXX', '.minYY', '.minZZ', '.maxXX', '.maxYY', '.maxZZ']);
    t.same(tree.toBBox({minXX: 1, minYY: 2, minZZ: 3, maxXX: 4, maxYY: 5, maxZZ: 6}),
        {minX: 1, minY: 2, minZ: 3, maxX: 4, maxY: 5, maxZ: 6});
    t.end();
});

t('constructor uses 9 max entries by default', function (t) {
    var tree = rbush().load(someData(9));
    t.equal(tree.toJSON().height, 1);

    var tree2 = rbush().load(someData(10));
    t.equal(tree2.toJSON().height, 2);
    t.end();
});

t('#toBBox, #compareMinX, #compareMinY can be overriden to allow custom data structures', function (t) {

    var tree = rbush(4);
    tree.toBBox = function (item) {
        return {
            minX: item.minXX,
            minY: item.minYY,
            minZ: item.minZZ,
            maxX: item.maxXX,
            maxY: item.maxYY,
            maxZ: item.maxZZ
        };
    };
    tree.compareMinX = function (a, b) {
        return a.minXX - b.minXX;
    };
    tree.compareMinY = function (a, b) {
        return a.minYY - b.minYY;
    };
    tree.compareMinZ = function (a, b) {
        return a.minZZ - b.minZZ;
    };

    var data = [
        {minXX: -115, minYY:  45, minZZ:  25, maxXX: -105, maxYY:  55, maxZZ:  35},
        {minXX:  105, minYY:  45, minZZ:  25, maxXX:  115, maxYY:  55, maxZZ:  35},
        {minXX:  105, minYY: -55, minZZ:  25, maxXX:  115, maxYY: -45, maxZZ:  35},
        {minXX: -115, minYY: -55, minZZ:  25, maxXX: -105, maxYY: -45, maxZZ:  35},
        {minXX: -115, minYY:  45, minZZ: -35, maxXX: -105, maxYY:  55, maxZZ: -25},
        {minXX:  105, minYY:  45, minZZ: -35, maxXX:  115, maxYY:  55, maxZZ: -25},
        {minXX:  105, minYY: -55, minZZ: -35, maxXX:  115, maxYY: -45, maxZZ: -25},
        {minXX: -115, minYY: -55, minZZ: -35, maxXX: -105, maxYY: -45, maxZZ: -25}
    ];

    tree.load(data);

    function byXXYYZZ(a, b) {
        return a.minXX - b.minXX || a.minYY - b.minYY || a.minZZ - b.minZZ;
    }

    sortedEqual(t, tree.search({minX: -180, minY: -90, minZ: -50, maxX: 180, maxY: 90, maxZ: 50}),
        data, byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: -90, minZ: -50, maxX: 0, maxY: 90, maxZ: 0}), [
        {minXX: -115, minYY: -55, minZZ: -35, maxXX: -105, maxYY: -45, maxZZ: -25},
        {minXX: -115, minYY: 45, minZZ: -35, maxXX: -105, maxYY: 55, maxZZ: -25}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: 0, minY: -90, minZ: 0, maxX: 180, maxY: 90, maxZ: 50}), [
        {minXX: 105, minYY: -55, minZZ: 25, maxXX: 115, maxYY: -45, maxZZ: 35},
        {minXX: 105, minYY: 45, minZZ: 25, maxXX: 115, maxYY: 55, maxZZ: 35}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: 0, minZ: -50, maxX: 180, maxY: 90, maxZ: 0}), [
        {minXX: -115, minYY: 45, minZZ: -35, maxXX: -105, maxYY: 55, maxZZ: -25},
        {minXX: 105, minYY: 45, minZZ: -35, maxXX: 115, maxYY: 55, maxZZ: -25}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: -90, minZ: 0, maxX: 180, maxY: 0, maxZ: 50}), [
        {minXX: -115, minYY: -55, minZZ: 25, maxXX: -105, maxYY: -45, maxZZ: 35},
        {minXX: 105, minYY: -55, minZZ: 25, maxXX: 115, maxYY: -45, maxZZ: 35}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: -90, minZ: 0, maxX: 0, maxY: 90, maxZ: 50}), [
        {minXX: -115, minYY: -55, minZZ: 25, maxXX: -105, maxYY: -45, maxZZ: 35},
        {minXX: -115, minYY: 45, minZZ: 25, maxXX: -105, maxYY: 55, maxZZ: 35}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: 0, minY: -90, minZ: -50, maxX: 180, maxY: 90, maxZ: 0}), [
        {minXX: 105, minYY: -55, minZZ: -35, maxXX: 115, maxYY: -45, maxZZ: -25},
        {minXX: 105, minYY: 45, minZZ: -35, maxXX: 115, maxYY: 55, maxZZ: -25}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: 0, minZ: 0, maxX: 180, maxY: 90, maxZ: 50}), [
        {minXX: -115, minYY: 45, minZZ: 25, maxXX: -105, maxYY: 55, maxZZ: 35},
        {minXX: 105, minYY: 45, minZZ: 25, maxXX: 115, maxYY: 55, maxZZ: 35}
    ], byXXYYZZ);

    sortedEqual(t, tree.search({minX: -180, minY: -90, minZ: -50, maxX: 180, maxY: 0, maxZ: 0}), [
        {minXX: -115, minYY: -55, minZZ: -35, maxXX: -105, maxYY: -45, maxZZ: -25},
        {minXX: 105, minYY: -55, minZZ: -35, maxXX: 115, maxYY: -45, maxZZ: -25}
    ], byXXYYZZ);
    t.end();
});

t('#load bulk-loads the given data given max node entries and forms a proper search tree', function (t) {

    var tree = rbush(4).load(data);
    sortedEqual(t, tree.all(), data);

    t.end();
});

t('#load uses standard insertion when given a low number of items', function (t) {

    var tree = rbush(8)
        .load(data)
        .load(data.slice(0, 3));

    var tree2 = rbush(8)
        .load(data)
        .insert(data[0])
        .insert(data[1])
        .insert(data[2]);

    t.same(tree.toJSON(), tree2.toJSON());
    t.end();
});

t('#load does nothing if loading empty data', function (t) {
    var tree = rbush().load([]);

    t.same(tree.toJSON(), rbush().toJSON());
    t.end();
});

t('#load handles the insertion of maxEntries + 2 empty bboxes', function (t) {
    var tree = rbush(10)
        .load(emptyData);

    t.equal(tree.toJSON().height, 2);
    sortedEqual(t, tree.all(), emptyData);

    t.end();
});

t('#insert handles the insertion of maxEntries + 2 empty bboxes', function (t) {
    var tree = rbush(10);

    emptyData.forEach(function (datum) {
        tree.insert(datum);
    });

    t.equal(tree.toJSON().height, 2);
    sortedEqual(t, tree.all(), emptyData);

    t.end();
});

t('#load properly splits tree root when merging trees of the same height', function (t) {
    var tree = rbush(4)
        .load(data)
        .load(data);

    t.equal(tree.toJSON().height, 4);
    sortedEqual(t, tree.all(), data.concat(data));

    t.end();
});

t('#load properly merges data of smaller or bigger tree heights', function (t) {
    var smaller = someData(10);

    var tree1 = rbush(4)
        .load(data)
        .load(smaller);

    var tree2 = rbush(4)
        .load(smaller)
        .load(data);

    t.equal(tree1.toJSON().height, tree2.toJSON().height);

    sortedEqual(t, tree1.all(), data.concat(smaller));
    sortedEqual(t, tree2.all(), data.concat(smaller));

    t.end();
});

t('#search finds matching points in the tree given a bbox', function (t) {

    var tree = rbush(4).load(data);
    var bbox = {minX: 40, minY: 20, minZ: 90, maxX: 80, maxY: 70, maxZ: 90};
    var result = tree.search(bbox);
    var expectedResult = bfSearch(bbox, data);
    sortedEqual(t, result, expectedResult);
    t.end();
});

t('#collides returns true when search finds matching points', function (t) {

    var tree = rbush(4).load(data);
    var result = tree.collides({minX: 40, minY: 20, minZ: 10, maxX: 80, maxY: 70, maxZ: 90});

    t.same(result, true);

    t.end();
});

t('#search returns an empty array if nothing found', function (t) {
    var result = rbush(4).load(data).search([200, 200, 200, 210, 210, 210]);

    t.same(result, []);
    t.end();
});

t('#collides returns false if nothing found', function (t) {
    var result = rbush(4).load(data).collides([200, 200, 200, 210, 210, 210]);

    t.same(result, false);
    t.end();
});

t('#all returns all points in the tree', function (t) {

    var tree = rbush(4).load(data);
    var result = tree.all();

    sortedEqual(t, result, data);
    sortedEqual(t, tree.search({minX: 0, minY: 0, minZ: 0, maxX: 100, maxY: 100, maxZ: 100}), data);

    t.end();
});

t('#toJSON & #fromJSON exports and imports search tree in JSON format', function (t) {

    var tree = rbush(4).load(data);
    var tree2 = rbush(4).fromJSON(tree.data);

    sortedEqual(t, tree.all(), tree2.all());
    t.end();
});

t('#insert adds an item to an existing tree correctly', function (t) {
    var items = [
        [0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1],
        [2, 2, 2, 2, 2, 2],
        [3, 3, 3, 3, 3, 3],
        [1, 1, 2, 2, 3, 3]
    ].map(arrToBBox);

    var tree = rbush(4).load(items.slice(0, 3));

    tree.insert(items[3]);
    t.equal(tree.toJSON().height, 1);
    sortedEqual(t, tree.all(), items.slice(0, 4));

    tree.insert(items[4]);
    t.equal(tree.toJSON().height, 2);
    sortedEqual(t, tree.all(), items);

    t.end();
});

t('#insert does nothing if given undefined', function (t) {
    t.same(
        rbush().load(data),
        rbush().load(data).insert());
    t.end();
});

t('#insert forms a valid tree if items are inserted one by one', function (t) {
    var tree = rbush(4);

    for (var i = 0; i < data.length; i++) {
        tree.insert(data[i]);
    }

    var tree2 = rbush(4).load(data);

    t.ok(tree.toJSON().height - tree2.toJSON().height <= 1);

    sortedEqual(t, tree.all(), tree2.all());
    t.end();
});

t('#remove removes items correctly', function (t) {
    var tree = rbush(4).load(data);

    var len = data.length;

    tree.remove(data[0]);
    tree.remove(data[1]);
    tree.remove(data[2]);

    tree.remove(data[len - 1]);
    tree.remove(data[len - 2]);
    tree.remove(data[len - 3]);

    sortedEqual(t,
        data.slice(3, len - 3),
        tree.all());
    t.end();
});
t('#remove does nothing if nothing found', function (t) {
    t.same(
        rbush().load(data),
        rbush().load(data).remove([13, 13, 13, 13, 13, 13]));
    t.end();
});
t('#remove does nothing if given undefined', function (t) {
    t.same(
        rbush().load(data),
        rbush().load(data).remove());
    t.end();
});
t('#remove brings the tree to a clear state when removing everything one by one', function (t) {
    var tree = rbush(4).load(data);

    for (var i = 0; i < data.length; i++) {
        tree.remove(data[i]);
    }

    t.same(tree.toJSON(), rbush(4).toJSON());
    t.end();
});
t('#remove accepts an equals function', function (t) {
    var tree = rbush(4).load(data);

    var item = {minX: 20, minY: 70, minZ: 90, maxX: 20, maxY: 70, maxZ: 90, foo: 'bar'};

    tree.insert(item);
    tree.remove(JSON.parse(JSON.stringify(item)), function (a, b) {
        return a.foo === b.foo;
    });

    sortedEqual(t, tree.all(), data);
    t.end();
});

t('#clear should clear all the data in the tree', function (t) {
    t.same(
        rbush(4).load(data).clear().toJSON(),
        rbush(4).toJSON());
    t.end();
});

t('should have chainable API', function (t) {
    t.doesNotThrow(function () {
        rbush()
            .load(data)
            .insert(data[0])
            .remove(data[0]);
    });
    t.end();
});

t('#search with random data', function (t) {
    var POINT_SIZE = 10000, BOX_SIZE = 10000;
    var POINTS_NUMBER = 10000, BOXEX_NUMBER = 100;

    var randomPoints = randBoxes(POINTS_NUMBER, POINT_SIZE);
    var randomBoxes = randBoxes(BOXEX_NUMBER, BOX_SIZE);
    var tree = rbush(8).load(randomPoints);

    randomBoxes.forEach(function (bbox) {
        var result = tree.search(bbox);
        var expectedResult = bfSearch(bbox, randomPoints);
        sortedEqual(t, result, expectedResult);
    });
    t.end();
});

t('#collides with random data', function (t) {
    var POINT_SIZE = 100000, BOX_SIZE = 1000;
    var POINTS_NUMBER = 100000, BOXEX_NUMBER = 10000;

    var randomPoints = randBoxes(POINTS_NUMBER, POINT_SIZE);
    var randomBoxes = randBoxes(BOXEX_NUMBER, BOX_SIZE);
    var tree = rbush(8).load(randomPoints);

    randomBoxes.forEach(function (bbox) {
        var result = tree.collides(bbox);
        var expectedResult = bfCollides(bbox, randomPoints);
        t.same(result, expectedResult);
    });
    t.end();
});
