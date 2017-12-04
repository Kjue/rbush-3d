
module.exports = genData;

function randBox(size) {
    var x = Math.random() * (100 - size),
        y = Math.random() * (100 - size),
        z = Math.random() * (100 - size);
    return [x, y, z,
        x + size * Math.random(),
        y + size * Math.random(),
        z + size * Math.random()];
}

function genData(N, size) {
    var data = [];
    for (var i = 0; i < N; i++) {
        data.push(randBox(size));
    }
    return data;
};

genData.convertTo2d = function (data) {
    return data.map(function (bbox) {
        return {
            minX: bbox.minX,
            minY: bbox.minY,
            maxX: bbox.maxX,
            maxY: bbox.maxY
        };
    });
}

