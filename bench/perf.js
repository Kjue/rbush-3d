'use strict';

// Dimensions
const DIM = 3;
// Substitute for dimensional distance.
const N = 1000000;
// Maximum fill for rbushen.
const maxFill = 16;

console.log('number: ' + N);
console.log('maxFill: ' + maxFill);

var format = [];
for (let i = 0; i < DIM; i++) {
    format.push('.min' + i);
    format.push('.max' + i);
}

function genData(N, size, dim) {
    let g = '';
    for (let i = 0; i < dim; i++) {
        g += 'var _' + i + ' = Math.random() * (100 - ' + size + ');\n';
    }
    g += 'return {\n';
    for (let i = 0; i < dim; i++) {
        g += '\tmin' + i + ': _' + i + ',\n';
        g += '\tmax' + i + ': _' + i + '+' + size + ' * Math.random(),\n';
    }
    g += '};';

    let f = new Function(g);

    var data = [];
    for (var i = 0; i < N; i++) {
        data.push(f());
    }
    return data;
}

var data = genData(N, 1, DIM);
var data2 = genData(N, 1, DIM);
var bboxes100 = genData(1000, 100 * Math.sqrt(0.1), DIM);
var bboxes10 = genData(1000, 10, DIM);
var bboxes1 = genData(1000, 1, DIM);

var rbush3d = typeof require !== 'undefined' ? require('..') : rbush3d;

var tree = rbush3d(maxFill, format);

console.time('insert one by one');
for (var i = 0; i < N; i++) {
    tree.insert(data[i]);
}
console.timeEnd('insert one by one');

console.time('1000 searches 10%');
for (i = 0; i < 1000; i++) {
    tree.search(bboxes100[i]);
}
console.timeEnd('1000 searches 10%');

console.time('1000 searches 1%');
for (i = 0; i < 1000; i++) {
    tree.search(bboxes10[i]);
}
console.timeEnd('1000 searches 1%');

console.time('1000 searches 0.01%');
for (i = 0; i < 1000; i++) {
    tree.search(bboxes1[i]);
}
console.timeEnd('1000 searches 0.01%');


console.time('remove 1000 one by one');
for (i = 0; i < 1000; i++) {
    tree.remove(data[i]);
}
console.timeEnd('remove 1000 one by one');

console.time('bulk-insert 1M more');
tree.load(data2);
console.timeEnd('bulk-insert 1M more');

console.time('1000 searches 1%');
for (i = 0; i < 1000; i++) {
    tree.search(bboxes10[i]);
}
console.timeEnd('1000 searches 1%');

console.time('1000 searches 0.01%');
for (i = 0; i < 1000; i++) {
    tree.search(bboxes1[i]);
}
console.timeEnd('1000 searches 0.01%');
