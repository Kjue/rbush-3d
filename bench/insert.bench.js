var Benchmark = require('benchmark'),
    rbush3d = require('../rbush3d'),
    genData = require('./gendata');

var rbush = require('rbush');


var N = 10000,
    maxFill = 16;

var data = genData(N, 1);
var data2 = genData.convertTo2d(data);

new Benchmark.Suite()
.add('insert ' + N + ' items (' + maxFill + ' node size)', function () {
    var tree = rbush3d(maxFill);
    for (var i = 0; i < N; i++) {
        tree.insert(data[i]);
    }
})
.add('insert ' + N + ' items (' + maxFill + ' node size), rbush(original 2d version)', function () {
    var tree = rbush(maxFill);
    for (var i = 0; i < N; i++) {
        tree.insert(data[i]);
    }
})
.on('error', function(event) {
    console.log(event.target.error);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();
