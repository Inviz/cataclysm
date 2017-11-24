Game.Struct.Building = [
  function setWidth(width, context) {
    return 600 + context.random() * 200
  },
  function setLength(length, context) {
    return 500 + context.random() * 500
  },
  function setHeight(height, context) {
    return Math.max(300, Math.floor(Math.random() * 3) * 300)
  },
  function setOffsetAngle(offsetAngle, road) {
    return (Math.PI + offsetAngle)//360 * Math.random()
  },
  function setBlock(block) {
    return block
  },
  function setRoofHeight(roofHeight, context) {
    return context.random() > 0.5 ? 450 : context.random() > 0.5 ? 100 : 200;
  },
  function setOffsetDistance(offsetDistance, width, length, road) {
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
  function setCollision (collision, x, y, width, length, building, index, context) {
    var polygon1 = context.recomputeBuildingPolygon(index)
    // collide previously generated buildings
    for (var i = 0; i < index; i++) {
      var polygon2 = context.computeBuildingOuterPolygon(i)
      if (doPolygonsIntersect(polygon1, polygon2)) {
        return i + 1;
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
  function computePolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, length, angle)
  },
  function computeShape(index, context) {
    var loops = [];
    context.eachRoom(function(room) {

      if (context.getRoomBuilding(room) == index && !context.getRoomCollision(room)) {
        loops.push(context.computeRoomPolygon(room))
      }
    })
    return loops
  },
  function computePSLG(index, context) {
    return context.computePSLG(context.computeBuildingShape(index))
  },
  function computeCleanPolygon(index, context) {
    return context.computePolygonSimplification(context.computeCleanPolygon(context.computeBuildingPSLG(index)))
  },
  function computeOuterPolygon(index, context) {
    return context.computePolygonOffset(context.computeBuildingCleanPolygon(index), 200, null, 2)[0]
  },
  function computeNavigationNetwork(index, context) {
    return context.computeNavigationNetwork(context.computeBuildingPSLG(index))
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeBuildingPolygon(index))
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeBuildingPolygon(index))
  },
  function computeFinalSpinePoints(index, context) {
    var polygon = context.computeBuildingCleanPolygon(index)
    var polygon = context.computePolygonOffset(polygon, 30, null, 2)[0]
    var polygon = context.computeSpinePoints(polygon, null, null, context.getBuildingRoofHeight(index));

    return polygon;
  },
  function computeRoofGeometry(index, context) {
    var polygon = context.computeBuildingFinalSpinePoints(index)
    var skeletonPath = new CompGeo.shapes.Path( polygon.skeleton.spokes );
    var shape = new CompGeo.shapes.Shape( polygon.skeletonInput.concat( skeletonPath) );
    if (isFinite(context.getBuildingRoofHeight(index)))
      var interior = context.computePolygonOffset([polygon], -context.getBuildingRoofHeight(index), null, 2)[0]
    var geometry = shape.triangulate(interior, polygon, function(poly) {
      return context.computePolygonBinary([poly], [polygon], ClipperLib.ClipType.ctDifference)[0]
    });
    return geometry
  }
]
Game.Generator.prototype.RoadBuilding = function(road, callback) {
  var distance = this.getRoadRange(road)
  var count = 13;
  var polygon = this.computeRoadSurroundingPolygon(road)
  var polygon = this.computeAnchorPoints(polygon, 500, 500)
  placement: for (var i = 0; i < count; i++) {

    var building = this.Building.count;
    var point = polygon.marginPointsShuffled[0][i % polygon.marginPointsShuffled[0].length];
    for (var attempt = 0; attempt < 3; attempt++) {
      this.Building(building, null, road, point[0], point[1], point[3])

      if (!this.getBuildingCollision(building)) {
        callback.call(this, building)
        this.Building.count++
        continue placement;
      }
    }
  }
}

Game.Generator.prototype.BlockBuilding = function(block, callback) {
  var road = this.getBlockRoad(block)
  var loop = this.getBlockLoop(block)
  //if (loop) {
    var polygon = this.computeBlockInnerPolygon(block)[0]
    var polygon = this.computeAnchorPoints(polygon, 100, -300, null, null, 500, 500)
  if (loop) {
    var angle = Math.PI
    var points = polygon.paddingPointsShuffled[0];
  }
  else
    var points = polygon.marginPointsShuffled[0];
  //} else {
  //  var polygon = this.computeRoadSurroundingPolygon(road)
  //  var polygon = this.computeAnchorPoints(polygon, 500, 500)
  //  var points = polygon.marginPointsShuffled[0];
  //}
  var count = 8;
  placement: for (var i = 0; i < count; i++) {
    var building = this.Building.count;
    var point = points[i % points.length];
    for (var attempt = 0; attempt < 26; attempt++) {
      this.Building(building, block, road, point[0], point[1], point[3] + (angle || 0))

      if (!this.getBuildingCollision(building)) {
        callback.call(this, building)
        this.Building.count++
        continue placement;
      }
    }
  }
  this.Building.count = building
}
