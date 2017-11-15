Game.Struct.Building = [
  function setWidth(width, context) {
    return 60 + context.random() * 20
  },
  function setHeight(height, context) {
    return 50 + context.random() * 50
  },
  function setOffsetAngle(offsetAngle, road) {
    return ((Math.PI) + offsetAngle)//360 * Math.random()
  },
  function setOffsetDistance(offsetDistance, width, height, road) {
    return width / 2//100// * Math.random()
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
  function setAngle (angle, road) {
    return road.angle
  },
  function setRoad (road) {
    return road
  },
  function collide (collision, x, y, width, height, building, index, context) {
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
Game.Generator.prototype.RoadBuilding = function(roadIndex) {
  var distance = this.getRoadRange(roadIndex)
  var count = 13;
  var buildingIndex = this.Building.count;
  var polygon = this.computeRoadSurroundingPolygon(roadIndex)
  var polygon = this.computeAnchorPoints(polygon, 50, 50)
  placement: for (var i = 0; i < count; i++) {

    var point = polygon.marginPointsShuffled[0][i % polygon.marginPointsShuffled[0].length];
    for (var attempt = 0; attempt < 3; attempt++) {
      this.Building(buildingIndex, roadIndex, point[0], point[1], point[3])

      if (!this.getBuildingCollision(buildingIndex)) {
        this.BuildingRoom(buildingIndex)
        buildingIndex++
        continue placement;
      }
    }
  }

  this.Building.count = buildingIndex
}
