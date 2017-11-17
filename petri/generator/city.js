Game.Struct.City = [
  function setX(x, context, index) {
    if (x == null)
      x = context.computeCityStartingPoint(index).x
    return x;
  },
  function setY(y, context, index) {
    if (y == null)
      y = context.computeCityStartingPoint(index).y
    return y;
  },

  function computeStartingPoint(context) {
    do {
      var x = Math.floor(context.random() * 1000000 - 500000);
      var y = Math.floor(context.random() * 1000000 - 500000); 
      var value = context.computeTripleNoise(x, y);
    } while (value > 0.15 || value < 0.1)
    return {x: x, y: y}
  },

  function computePolygon(context) {
    var polygons = [];
    context.eachRoad(function(road) {
      polygons.push(context.computeRoadPolygon(road))
    })
    return context.computePolygonBinary([], polygons);
  },

  function computeInsidePolygon(context, index) {
    return context.computePolygonOffset(context.computeCityPolygon(index), 150, -150, 0)
  },

  function computeRoadConnectivity(context) {
    var connectivity = {};
    context.eachRoad(function(road) {
      var key = Math.floor(context.getRoadEx(road) / 100) + 'x' + Math.floor(context.getRoadEy(road) / 100)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
      var key = Math.floor(context.getRoadSx(road) / 100) + 'x' + Math.floor(context.getRoadSy(road) / 100)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
    })
    context.eachRoad(function(road) {
      var key = Math.floor(context.getRoadEx(road) / 100) + 'x' + Math.floor(context.getRoadEy(road) / 100)
      context.setRoadConnectivity(road, connectivity[key].length - 1);
    })
    return connectivity;
  }
]


