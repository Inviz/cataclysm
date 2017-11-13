Game.Generator.Building = [
  function setWidth(width) {
    return 60 + Math.random() * 20
  },
  function setHeight(height) {
    return 50 + Math.random() * 50
  },
  function setOffsetAngle(offsetAngle, road) {
    return ((Math.PI) + offsetAngle) * (180 / Math.PI)//360 * Math.random()
  },
  function setOffsetDistance(offsetDistance, width, height, road) {
    return width / 2//100// * Math.random()
  },
  function setX (x, road, offsetDistance, offsetAngle) {
    if (x == null)
      x = road.x;
    return x + Math.cos(offsetAngle * (Math.PI / 180)) * (offsetDistance);
  },
  function setY (y, road, offsetDistance, offsetAngle) {
    
    if (y == null)
      y = road.y;
    return y + Math.sin(offsetAngle * (Math.PI / 180)) * (offsetDistance);
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
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
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