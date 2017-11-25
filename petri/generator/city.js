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
    } while (value > 0.25 || value < 0.15)
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
    return context.computePolygonOffset(context.computeCityPolygon(index), 25, -25, 0)
  },
  function computeCleanInsidePolygon(context, index) {
    return context.computeCleanPolygon(polygonToPSLG(context.computeCityInsidePolygon(index), {clean: true}, 'x', 'y')).map(function(hole) {
      return hole.map(function(p) {
        return {x: p[0], y: p[1]}
      })
    })
  },

  function computeRoadConnectivity(context) {
    var connectivity = {};
    context.eachRoad(function(road) {
      var key = Math.floor(context.getRoadEx(road) / 10) + 'x' + Math.floor(context.getRoadEy(road) / 10)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
      var key = Math.floor(context.getRoadSx(road) / 10) + 'x' + Math.floor(context.getRoadSy(road) / 10)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
    })
    context.eachRoad(function(road) {
      var key = Math.floor(context.getRoadEx(road) / 10) + 'x' + Math.floor(context.getRoadEy(road) / 10)
      context.setRoadConnectivity(road, connectivity[key].length - 1);
    })
    return connectivity;
  }
]


