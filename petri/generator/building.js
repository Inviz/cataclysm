Game.Struct.Building = [
  function setBuildingWidth(width) {
    return 100 + this.random() * 20
  },
  function setBuildingLength(length) {
    return 80 + this.random() * 50
  },
  function setBuildingHeight(height) {
    return Math.max(30, Math.floor(this.random() * 1) * 30)
  },
  function setBuildingTransparent(transparent) {
    return this.random() > 0.5
  },
  function setBuildingOffsetAngle(offsetAngle, road) {
    return (Math.PI + offsetAngle)//360 * Math.random()
  },
  function setBuildingBlock(block) {
    return block
  },
  function setBuildingRoofHeight(roofHeight) {
    return this.random() > 0.5 ? 45 : this.random() > 0.5 ? 10 : 20;
  },
  function setBuildingOffsetDistance(offsetDistance, width, length, road) {
    return width / 2 + 5 //100// * Math.random()
  },
  function setBuildingX (x, road, offsetDistance, offsetAngle) {
    if (x == null)
      x = road.x;
    return x + Math.cos(offsetAngle) * (offsetDistance);
  },
  function setBuildingY (y, road, offsetDistance, offsetAngle) {
    
    if (y == null)
      y = road.y;
    return y + Math.sin(offsetAngle) * (offsetDistance);
  },
  function setBuildingAngle (angle, offsetAngle) {
    return offsetAngle
  },
  function setBuildingRoad (road) {
    return road
  },
  function setBuildingCollision (collision, x, y, width, length, building, index) {
    var polygon1 = this.computeBuildingPolygon(index, true)
    var box = this.computeBuildingPolygonBox(index, true);
    var buildings = this.Building.rtree.search(box); 
    // collide previously generated buildings
    for (var b = 0; b < buildings.length; b++) {
      if (doPolygonsIntersect(polygon1, buildings[b].polygon)) {
        return b + 1
      }
    }
    // collide with road polygons
    var roads = this.Road.rtree.search(box);
    for (var r = 0; r < roads.length; r++) {
      if (doPolygonsIntersect(polygon1, roads[r].polygon)) {
        return roads[r].index + 1;
      }
    }
    return 0;
  },
  function computeBuildingPolygon(x, y, width, length, angle) {
    return this.computePolygonFromRotatedRectangle(x, y, width, length, angle)
  },
  function computeBuildingPolygonBox(index) {
    return this.computePolygonBox(this.computeBuildingPolygon(index), index)
  },
  function computeBuildingOuterPolygonBox(index) {
    return this.computePolygonBox(this.computeBuildingOuterPolygon(index), index)
  },
  function computeBuildingShape(index) {
    var loops = [];
    this.eachRoom(function(room) {

      if (this.getRoomBuilding(room) == index && !this.getRoomCollision(room)) {
        loops.push(this.computeRoomPolygon(room))
      }
    })
    return loops
  },
  function computeBuildingPSLG(index) {
    return this.computePSLG(this.computeBuildingShape(index))
  },
  function computeBuildingCleanPolygon(index) {
    return this.computePolygonSimplification(this.computeCleanPolygon(this.computeBuildingPSLG(index)))
  },
  function computeBuildingOuterPolygon(index) {
    return this.computePolygonOffset(this.computeBuildingCleanPolygon(index), 20, null, 2)[0]
  },
  function computeBuildingNavigationNetwork(index) {
    return this.computeNavigationNetwork(this.computeBuildingPSLG(index))
  },
  function computeBuildingAnchorPoints(index) {
    return this.computeAnchorPoints(this.computeBuildingPolygon(index))
  },
  function computeBuildingSpinePoints(index) {
    return this.computeSpinePoints(this.computeBuildingPolygon(index))
  },
  function computeBuildingCorridor(index) {
    var pslg = this.computePSLG(index);
    var loops = this.computeBuildingShape(index)

    for (var start = 0; start < pslg.points.length; start++) {
      for (var end = 0; end <= pslg.points.length; end++) {
        //for (var loop;)
      }
    }
  },
  function computeBuildingFinalSpinePoints(index) {
    var polygon = this.computeBuildingCleanPolygon(index)
    var polygon = this.computePolygonOffset(polygon, 3, null, 2)[0]
    var polygon = this.computeSpinePoints(polygon, null, null, this.getBuildingRoofHeight(index));

    return polygon;
  },
  function computeBuildingRoofGeometry(index) {
    var polygon = this.computeBuildingFinalSpinePoints(index)
    var skeletonPath = new CompGeo.shapes.Path( polygon.skeleton.spokes );
    var shape = new CompGeo.shapes.Shape( polygon.skeletonInput.concat( skeletonPath) );
    if (isFinite(this.getBuildingRoofHeight(index)))
      var interior = this.computePolygonOffset([polygon], -this.getBuildingRoofHeight(index), null, 2)[0]
    var geometry = shape.triangulate(interior, polygon, function(poly) {
      return this.computePolygonBinary([poly], [polygon], ClipperLib.ClipType.ctDifference)[0]
    });
    return geometry
  }
]
Game.Generator.prototype.RoadBuilding = function(road, callback) {
  var distance = this.getRoadRange(road)
  var count = 13;
  var polygon = this.computeRoadSurroundingPolygon(road)
  var polygon = this.computeAnchorPoints(polygon, 50, 50)
  placement: for (var i = 0; i < count; i++) {

    var building = this.Building.count;
    var point = polygon.marginPointsShuffled[0][i % polygon.marginPointsShuffled[0].length];
    for (var attempt = 0; attempt < 3; attempt++) {
      this.Building(building, null, road, point[0], point[1], point[3])

      if (!this.getBuildingCollision(building)) {
        this.Building.count++
        callback.call(this, building)
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
    var polygon = this.computeAnchorPoints(polygon, 10, -30, null, null, 50, 50)
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
    var point = points[i % points.length];
    for (var attempt = 0; attempt < 26; attempt++) {
      var candidate = this.Building.count;
      this.Building(candidate, block, road, point[0], point[1], point[3] + (angle || 0))

      if (!this.getBuildingCollision(candidate)) {
        callback.call(this, candidate)
        this.Building.rtree.insert(this.computeBuildingOuterPolygonBox(candidate))
        this.Building.count++;
        continue placement;
      }
    }
  }
}
