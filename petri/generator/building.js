Game.Struct.Building = [
  function setWidth(width, context) {
    return 600 + context.random() * 200
  },
  function setHeight(height, context) {
    return 500 + context.random() * 500
  },
  function setOffsetAngle(offsetAngle, road) {
    return (Math.PI + offsetAngle)//360 * Math.random()
  },
  function setOffsetDistance(offsetDistance, width, height, road) {
    return width / 2 + 50 //100// * Math.random()
  },
  function setX (x, road, offsetDistance, offsetAngle) {
    if (x == null)
      x = road.x;
    return x + Math.cos(offsetAngle) * (offsetDistance);
  },
  function setY (y, road, offsetDistance, offsetAngle) {
    
    if (y == null)
      y = road.y;
    return y + Math.sin(offsetAngle) * (offsetDistance);
  },
  function setAngle (angle, offsetAngle) {
    return offsetAngle
  },
  function setRoad (road) {
    return road
  },
  function setCollision (collision, x, y, width, height, building, index, context) {
    // collide previously generated buildings
    var polygon1 = context.recomputeBuildingPolygon(index)
    for (var i = 0; i < index; i++) {
      if (!context.getBuildingCollision(i)) {
        var polygon2 = context.computeBuildingPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    // collide with road polygons
    for (var i = 0; i < context.Road.count; i++) {
      var polygon2 = context.computeRoadSurroundingPolygon(i)
      if (doPolygonsIntersect(polygon1, polygon2)) {
        return i + 1;
      }
    }
    return 0;
  },
  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle)
  },
  function computeShape(index, context) {
    var loops = [];
    context.eachRoom(function(room) {

      if (context.getRoomBuilding(room) == index ) {
        loops.push(context.computeRoomPolygon(room).map(function(pt) {
          return [pt.x, pt.y]//[Math.floor(pt.x * 1) / 1, Math.floor(pt.y * 1) / 1]
        }))
      }
    })
    return loops;
  },
  function computePSLG(index, context) {
    return context.computePSLG(context.computeBuildingShape(index))
  },
  function computeNavigationNetwork(index, context) {
    return context.computeNavigationNetwork(context.computeBuildingPSLG(index))
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeBuildingPolygon(index))
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeBuildingPolygon(index))
  }
]
Game.Generator.prototype.RoadBuilding = function(road, callback) {
  var distance = this.getRoadRange(road)
  var count = 13;
  var building = this.Building.count;
  var polygon = this.computeRoadSurroundingPolygon(road)
  var polygon = this.computeAnchorPoints(polygon, 500, 500)
  placement: for (var i = 0; i < count; i++) {

    var point = polygon.marginPointsShuffled[0][i % polygon.marginPointsShuffled[0].length];
    for (var attempt = 0; attempt < 3; attempt++) {
      this.Building(building, road, point[0], point[1], point[3])

      if (!this.getBuildingCollision(building)) {
        callback.call(this, building)
        building++
        continue placement;
      }
    }
  }

  this.Building.count = building
}

Game.Generator.prototype.BlockBuilding = function(block, callback) {
  var road = this.getBlockRoad(block)
  var loop = this.getBlockLoop(block)
  //if (loop) {
    var polygon = this.computeBlockInnerPolygon(block)[0]
    var polygon = this.computeAnchorPoints(polygon, 100, -300, null, null, 500, 500)
  if (loop)
    var points = polygon.paddingPointsShuffled[0];
  else
    var points = polygon.marginPointsShuffled[0];
  //} else {
  //  var polygon = this.computeRoadSurroundingPolygon(road)
  //  var polygon = this.computeAnchorPoints(polygon, 500, 500)
  //  var points = polygon.marginPointsShuffled[0];
  //}
  var building = this.Building.count;
  var count = 13;
  placement: for (var i = 0; i < count; i++) {

    var point = points[i % points.length];
    for (var attempt = 0; attempt < 6; attempt++) {
      this.Building(building, road, point[0], point[1], point[3])

      if (!this.getBuildingCollision(building)) {
        callback.call(this, building)
        building++
        continue placement;
      }
    }
  }

  this.Building.count = building
}
