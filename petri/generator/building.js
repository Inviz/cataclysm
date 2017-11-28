Game.Struct.Building = [
  function setBuildingWidth(width) {
    return 100 + this.random() * 50
  },
  function setBuildingLength(length) {
    return 100 + this.random() * 50
  },
  function setBuildingHeight(height) {
    return Math.max(30, Math.floor(this.random() * 1) * 30)
  },
  function setBuildingTransparent(transparent) {
    return 1//this.random() > 0.5
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
    // collide previously generated buildings
    var buildings = this.Building.rtree.search(box);
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
  function computeBuildingInternalShape(index) {
    var loops = [];
    this.eachRoom(function(room) {

      if (this.getRoomBuilding(room) == index && !this.getRoomCollision(room)) {
        loops.push(this.computeRoomShrunkPolygon(room))
      }
    })
    return loops
  },
  function computeBuildingInternalPSLG(index) {
    return this.computePSLG(this.computeBuildingInternalShape(index))
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
  function computeBuildingCorridorPolygon(index) {
    var loops = [];
    var allLoops = [];
    var pslg = this.computeBuildingPSLG(index);
    var points = pslg.points.map(function(p, index) {
      p.index = index;
      return {x: p[0], y: p[1], index: p.index}
    })

    // collect room points
    this.eachRoom(function(room) {
      if (this.getRoomBuilding(room) == index && !this.getRoomCollision(room)) {
        allLoops.unshift(this.computeRoomPolygon(room))
        this.computeRoomPolygon(room).room = room
        var origin = this.getRoomOrigin(room);
        if (origin == room || this.getRoomNumber(origin) != 0) {
          loops.push(this.computeRoomPolygon(room))
        }
      }
    })
    if (loops.length < 2)
      return null;
    var shortestDistance = Infinity

    //find two points that connect all rooms
    var mid = {x: 0,y:0}
    for (var s = 0; s < points.length; s++) {
      edges: for (var e = 0; e < s; e++) {
        var start = points[s];
        var end = points[e];
        mid.x = points[s].x + (points[e].x - points[s].x) / 2;
        mid.y = points[s].y + (points[e].y - points[s].y) / 2;

          var d = Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2), 2)
          if (d >= shortestDistance) continue;
          for (var loop = 0; loop < loops.length; loop++) {
            if (distanceToPolygon(start, loops[loop]) > 10 &&
                distanceToPolygon(end, loops[loop]) > 10 &&
                distanceToPolygon(mid, loops[loop]) > 10)
              continue edges;
          }

          shortestDistance = d;
          var bestStart = start;
          var bestEnd = end;
          //for (var loop;)
      }
    }
    if (!bestStart){
      console.error('fail', index)
      return null
    }
    var solution = this.computeNavigationNetwork(pslg)
    this.computeDistances(pslg, solution)
    var path = this.computePSLGPath(pslg, solution, bestStart, bestEnd)
    var p = path;
//    if (p.length > 1)
//      debugger

    // Omit intermediate points that are <5 units away from neighbour
    path = [bestStart].concat(path.slice(1, -1).map(function(p) {
      return {x: p[0], y: p[1], index: p.index}
    }), [bestEnd]).filter(function(p1, index, array) {
      if (index == 0 || index == array.length - 1) return true;
      var p1 = array[index]
      var p2 = array[(index + 1) % points.length]
      var p0 = array[(index || points.length) - 1]
      var d1 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 2);
      
      var d2 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2), 2);
      return d1 > 5 && d2 > 5
    })
    var shape = this.computeLineOffset(path, 25, 2);
    var buildingShape = this.computePolygonOffset(allLoops, 0.005, null, 2);

    shape = this.computePolygonBinary(shape, buildingShape, ClipperLib.ClipType.ctIntersection);

  
    // attempt to reduce corridor by subtracting intersections with each room
    // but only if it does not change door accessibility
    for (var attempts = 0; attempts < 2; attempts++)
    allLoops.forEach(function(polygon,loop) {
      var offset = this.computePolygonOffset([polygon], 5, null, 2);
      var diff = this.computePolygonBinary(shape, offset, ClipperLib.ClipType.ctDifference);
      if (diff.length == 1) {
        var offset = this.computePolygonOffset([polygon], .04, null, 2);
        var diff = this.computePolygonBinary(shape, offset, ClipperLib.ClipType.ctDifference);

        // ensure that there's at least a 20u segment shared by each room and corridor
        var points = equidistantPointsFromPolygon(diff[0], 20, true, null, 'x', 'y')
        loops: for (var l = 0; l < loops.length; l++) {
            if (polygon.room === loops[l].room) continue
            for (var p = 0; p < points.length; p++) {
              var p1 = points[p]
              var p2 = points[(p + 1) % points.length]
              var d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 2);
              if (d > 17)
              if (distanceToPolygon(p1, loops[l]) < 2 &&
                  distanceToPolygon(p2, loops[l]) < 2)
                continue loops;
            }
            return
        }
        shape = diff//this.computePolygonBinary(shape, [polygon], ClipperLib.ClipType.ctDifference);
      }
    }, this)


    // discard corridor if it shrank to living area
    if (shape.length) {
      var offset = this.computePolygonOffset([allLoops[allLoops.length - 1]], 1, null, 2);
      var diff = this.computePolygonBinary(shape, offset, ClipperLib.ClipType.ctDifference);
      if (diff.length == 0)
        return null
    }
//    shape = this.computePolygonOffset(shape, 0.01, null, 2);
//    shape = this.computePolygonBinary(shape, buildingShape, ClipperLib.ClipType.ctIntersection);
    return shape[0]
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

