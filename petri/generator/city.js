Game.Struct.City = [
  function setX(x, index) {
    if (x == null)
      x = this.computeCityStartingPoint(index).x
    return x;
  },
  function setY(y, index) {
    if (y == null)
      y = this.computeCityStartingPoint(index).y
    return y;
  },

  function computeStartingPoint(index) {
    do {
      var x = Math.floor(this.random() * 1000000 - 500000);
      var y = Math.floor(this.random() * 1000000 - 500000); 
      var value = this.computeTripleNoise(x, y);
    } while (value > 0.25 || value < 0.15)
    return {x: x, y: y}
  },

  function computePolygon(index) {
    var polygons = [];
    this.eachRoad(function(road) {
      polygons.push(this.computeRoadPolygon(road))
    })
    return this.computePolygonBinary([], polygons);
  },

  function computeInsidePolygon(index) {
    return this.computePolygonOffset(this.computeCityPolygon(index), 25, -25, 0)
  },
  function computeCleanInsidePolygon(index) {
    return this.computePolygonSimplification(this.computeCityInsidePolygon(index), null, true)
  },

  function computeRoadConnectivity(index) {
    var connectivity = {};
    this.eachRoad(function(road) {
      var key = Math.floor(this.getRoadEx(road) / 10) + 'x' + Math.floor(this.getRoadEy(road) / 10)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
      var key = Math.floor(this.getRoadSx(road) / 10) + 'x' + Math.floor(this.getRoadSy(road) / 10)
      if (!connectivity[key]) connectivity[key] = [];
      connectivity[key].push(road);
    })
    this.eachRoad(function(road) {
      var key = Math.floor(this.getRoadEx(road) / 10) + 'x' + Math.floor(this.getRoadEy(road) / 10)
      this.setRoadConnectivity(road, connectivity[key].length - 1);
    })
    return connectivity;
  }
]


