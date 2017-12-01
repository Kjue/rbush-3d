var Benchmark = require('benchmark'),
    rbush3d = require('../rbush3d'),
    genData = require('./gendata');

var N = 10000,
    maxFill = 16;

var data = genData(N, 1);

new Benchmark.Suite()
.add('bulk loading ' + N + ' items (' + maxFill + ' node size)', function () {
    var tree = rbush3d(maxFill);
    tree.load(data);
})
.on('error', function(event) {
    console.log(event.target.error);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();
