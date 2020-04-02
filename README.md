# RBushen

RBushen is N-dimensional version of [RBush](https://github.com/mourner/rbush). Inspired by the [RBush-3D](https://github.com/Eronana/rbush-3d).

## Work-in-progress

This project is a work-in-progress. I was inspired by the RBush-3d that implemented one more dimension to the 2D version. I thought it useful to allow for as many dimensions as one might want. I am thinking of adding Parallel.js to this mix too, but first things first. I'm switching XYZ parameters to be free variables and calling them just indexed vectors. I intend the usage paradigm to follow the same lines as before.

This work has not progressed since 2018 mostly because I found a workaround on my 3D environment that enabled me to achieve the performance I wanted. That did still not mean this indexing mechanism was obsolete. Rather that the use case is different.

## Usage

### Creating a Tree

```js
var tree = rbushen();
```

An optional argument to `rbushen` defines the maximum number of entries in a tree node.
`16` (used by default) is a reasonable choice for most applications.
Higher value means faster insertion and slower search, and vice versa.

```js
var tree = rbushen(16);
```

### Adding Data

Insert an item:

```js
var item = {
  minX: 20,
  minY: 40,
  minZ: 60,
  maxX: 30,
  maxY: 50,
  maxZ: 70,
  foo: "bar"
};
tree.insert(item);
```

### Removing Data

Remove a previously inserted item:

```js
tree.remove(item);
```

By default, RBush-3D removes objects by reference.
However, you can pass a custom `equals` function to compare by value for removal,
which is useful when you only have a copy of the object you need removed (e.g. loaded from server):

```js
tree.remove(itemCopy, function(a, b) {
  return a.id === b.id;
});
```

Remove all items:

```js
tree.clear();
```

### Data Format

By default, RBush-3D assumes the format of data points to be an object
with `minX`, `minY`, `minZ`, `maxX`, `maxY` and `maxZ` properties.
You can customize this by providing an array with corresponding accessor strings
as a second argument to `rbushen` like this:

```js
var tree = rbushen(16, ["[0]", "[1]", "[2]", "[0]", "[1]", "[2]"]); // accept [x, y, z] points
tree.insert([20, 50, 80]);
```

### Bulk-Inserting Data

Bulk-insert the given data into the tree:

```js
tree.load([item1, item2, ...]);
```

Bulk insertion is usually ~2-3 times faster than inserting items one by one.
After bulk loading (bulk insertion into an empty tree),
subsequent query performance is also ~20-30% better.

Note that when you do bulk insertion into an existing tree,
it bulk-loads the given data into a separate tree
and inserts the smaller tree into the larger tree.
This means that bulk insertion works very well for clustered data
(where items in one update are close to each other),
but makes query performance worse if the data is scattered.

### Search

```js
var result = tree.search({
  minX: 40,
  minY: 20,
  minZ: 50,
  maxX: 80,
  maxY: 70,
  maxZ: 90
});
```

Returns an array of data items (points or rectangles) that the given bounding box intersects.

Note that the `search` method accepts a bounding box in `{minX, minY, minZ, maxX, maxY, maxZ}` format
regardless of the format specified in the constructor (which only affects inserted objects).

```js
var allItems = tree.all();
```

Returns all items of the tree.

### Collisions

```js
var result = tree.collides({
  minX: 40,
  minY: 20,
  minZ: 50,
  maxX: 80,
  maxY: 70,
  maxZ: 90
});
```

Returns `true` if there are any items intersecting the given bounding box, otherwise `false`.

### Export and Import

```js
// export data as JSON object
var treeData = tree.toJSON();

// import previously exported data
var tree = rbushen(16).fromJSON(treeData);
```

Importing and exporting as JSON allows you to use RBush-3D on both the server (using Node.js) and the browser combined,
e.g. first indexing the data on the server and and then importing the resulting tree data on the client for searching.

Note that the `nodeSize` option passed to the constructor must be the same in both trees for export/import to work properly.

## Performance

The following sample performance test was done by generating
random uniformly distributed rectangles of ~0.01% area and setting `maxEntries` to `16`
(see `debug/perf.js` script).
Performed with Node.js v8.9.1 on a MacBook Pro (15-inch, 2017).

| Test                         | RBush-3D | [RBush](https://github.com/mourner/rbush) (2D version) |
| ---------------------------- | -------- | ------------------------------------------------------ |
| insert 1M items one by one   | 4.30s    | 2.94s                                                  |
| 1000 searches of 0.01% area  | 0.02s    | 0.03s                                                  |
| 1000 searches of 1% area     | 0.09s    | 0.31s                                                  |
| 1000 searches of 10% area    | 0.73s    | 1.80s                                                  |
| remove 1000 items one by one | 0.02s    | 0.02s                                                  |
| bulk-insert 1M items         | 1.40s    | 1.17s                                                  |

TODO: Need to update benchmarking results.

## Algorithms Used

- single insertion: non-recursive R-tree insertion with overlap minimizing split routine from R\*-tree (split is very effective in JS, while other R\*-tree modifications like reinsertion on overflow and overlap minimizing subtree search are too slow and not worth it)
- single deletion: non-recursive R-tree deletion using depth-first tree traversal with free-at-empty strategy (entries in underflowed nodes are not reinserted, instead underflowed nodes are kept in the tree and deleted only when empty, which is a good compromise of query vs removal performance)
- bulk loading: OMT algorithm (Overlap Minimizing Top-down Bulk Loading) combined with Floyd–Rivest selection algorithm
- bulk insertion: STLT algorithm (Small-Tree-Large-Tree)
- search: standard non-recursive R-tree search

## Papers

- [R-trees: a Dynamic Index Structure For Spatial Searching](http://www-db.deis.unibo.it/courses/SI-LS/papers/Gut84.pdf)
- [The R\*-tree: An Efficient and Robust Access Method for Points and Rectangles+](http://dbs.mathematik.uni-marburg.de/publications/myPapers/1990/BKSS90.pdf)
- [OMT: Overlap Minimizing Top-down Bulk Loading Algorithm for R-tree](http://ftp.informatik.rwth-aachen.de/Publications/CEUR-WS/Vol-74/files/FORUM_18.pdf)
- [Bulk Insertions into R-Trees Using the Small-Tree-Large-Tree Approach](http://www.cs.arizona.edu/~bkmoon/papers/dke06-bulk.pdf)
- [R-Trees: Theory and Applications (book)](http://www.apress.com/9781852339777)

## Development

```bash
npm install  # install dependencies

npm test     # check the code with JSHint and run tests
npm run perf # run performance benchmarks
npm run cov  # report test coverage (with more detailed report in coverage/lcov-report/index.html)
npm run viz  # show 3d visualization in browser
```
