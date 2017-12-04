RBush-3D
=====

RBush-3D is 3D version of [RBush](https://github.com/mourner/rbush).

## TODO
- [x] real 3D test
- [ ] Demos
- [x] Benchmarks


## Performance

The following sample performance test was done by generating
random uniformly distributed rectangles of ~0.01% area and setting `maxEntries` to `16`
(see `debug/perf.js` script).
Performed with Node.js v8.9.1 on a MacBook Pro (15-inch, 2017).

Test                         | RBush-3D | [RBush](https://github.com/mourner/rbush) (2D version)
---------------------------- | -------- | ------
insert 1M items one by one   | 4.30s    | 2.94s
1000 searches of 0.01% area  | 0.02s    | 0.03s
1000 searches of 1% area     | 0.09s    | 0.31s
1000 searches of 10% area    | 0.73s    | 1.80s
remove 1000 items one by one | 0.02s    | 0.02s
bulk-insert 1M items         | 1.40s    | 1.17s
