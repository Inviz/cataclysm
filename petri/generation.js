Generation = function(seed, step, previous) {
  this.seed = seed;
  this.setSeed(previous ? Math.floor(previous.random() * 100000000) : seed)
  this.step      = step;
  this.roads     = new Float64Array(previous ? previous.roads     : this.Road.size * 10000);
  this.buildings = new Float64Array(previous ? previous.buildings : this.Building.size * 10000);
  this.rooms     = new Float64Array(previous ? previous.rooms     : this.Room.size * 10000);
  this.furniture = new Float64Array(previous ? previous.furniture : this.Furniture.size * 10000);
  this.equipment = new Float64Array(previous ? previous.equipment : this.Equipment.size * 10000);

}
Generation.prototype = Object.create(Simulation.prototype)

Generation.prototype.Road      = Generation.prototype.compile(Game.Generator.Road,      ['x', 'y', 'angle', 'width', 'height', 'connectivity'], {}, 'road', 'roads');
Generation.prototype.Building  = Generation.prototype.compile(Game.Generator.Building,  ['road', 'x', 'y', 'offsetAngle'], {road: 'roads'}, 'building', 'buildings');
Generation.prototype.Room      = Generation.prototype.compile(Game.Generator.Room,      ['building', 'number', 'origin'], {building: 'buildings', origin: 'rooms'}, 'room', 'rooms');
Generation.prototype.Furniture = Generation.prototype.compile(Game.Generator.Furniture, ['room', 'building', 'x', 'y', 'angle', 'anchor'], {building: 'buildings', room: 'rooms'}, 'furniture');
Generation.prototype.Equipment = Generation.prototype.compile(Game.Generator.Equipment, ['room', 'building', 'furniture'], {}, 'equipment');
/*
  for (var i = 0; i < map.segments.length; i ++) {
    var segment = map.segments[i]

    if (i % 10 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;

    if (segment.links.f.length) {
      var links = 5// + Math.floor(Math.random() * 5) 
      var distance = 400;
    } else {
      var links = 5// + Math.floor(Math.random() * 5) 
      var distance = 200;
    }
    var newBuildings = BuildGen.buildingFactory.aroundSegment(
      callback,
      segment, 
      links, distance, qTree
    )
    newBuildings.forEach(function(building) {
      qTree.insert(building.collider.limits())

    })
    buildings = buildings.concat(newBuildings)
  }*/
Generation.prototype.RoadBuilding = function(roadIndex) {
  var distance = this.getRoadRange(roadIndex)
  var count = 13;
  var buildingIndex = this.Building.count;
  var polygon = this.computeRoadSurroundingPolygon(roadIndex)
  var polygon = this.computeRoadAnchorPoints(roadIndex)
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

Generation.prototype.BuildingRoom = function(buildingIndex) {
  var roomIndex = this.Room.count;
  var min = 1;
  var max = 4;
  var rooms = 3//Math.floor(Math.random() * (max - min) + min)
  var first = roomIndex;
  placement: for (var i = 0; i < rooms; i++) {
    var candidateIndex = roomIndex;
    var minDistance = Infinity;
    var bestPlacement = null;
    for (var attempt = 0; attempt < 5; attempt++) {
      this.Room(roomIndex, buildingIndex, i, first + Math.floor(Math.random() * (i)))
      if (!this.getRoomCollision(roomIndex)) {
        var distance = this.getRoomDistance(roomIndex);
        if (distance < minDistance) {
          minDistance = distance;
          bestPlacement = roomIndex;
          ++roomIndex
        }
      }
    }
    
    if (bestPlacement != null) {
      this.moveRoom(bestPlacement, candidateIndex);
      this.recomputeRoomPolygon(candidateIndex)
      this.BuildingRoomFurniture(buildingIndex, candidateIndex)
      roomIndex = candidateIndex + 1;
    } else {
      roomIndex = candidateIndex
      break
    }
  }
  this.Room.count = roomIndex
}

Generation.prototype.BuildingRoomFurniture = function(buildingIndex, roomIndex) {
  var building = this.computeRoomAnchorPoints(roomIndex)
  building = this.computeRoomSpinePoints(roomIndex)

  if (building) {
    var furnitureIndex = this.Furniture.count;
    var bones = building.spinesShuffled;
    var max = Math.floor(this.random() * (bones.length - 1)) + 1

    // center points
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      furnitureIndex++;
      for (var attempt = 0; attempt < 3; attempt++) {
        this.Furniture(furnitureIndex, roomIndex, buildingIndex, bone[0], bone[1], bone[3] || 0, Game.ANCHORS.INSIDE_CENTER)
        
        if (!this.getFurnitureCollision(furnitureIndex)) {
          furnitureIndex = this.BuildingRoomFurnitureFurniture(buildingIndex, roomIndex, furnitureIndex)
          
          continue placements;
        }
      }
      furnitureIndex--
    }

    // wall points
    var bones = building.paddingPointsShuffled[0];
    var max = Math.floor(this.random() * (bones.length - 1)) + 1
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      furnitureIndex++;
      for (var attempt = 0; attempt < 21; attempt++) {
        this.Furniture(furnitureIndex, roomIndex, buildingIndex, bone[0], bone[1], bone[3] || 0, Game.ANCHORS.INSIDE_INWARDS)
        if (!this.getFurnitureCollision(furnitureIndex)) {
          continue placements
        }
      }
      furnitureIndex--
    }
    this.Furniture.count = furnitureIndex;
  }
  return furnitureIndex;

}
Generation.prototype.BuildingRoomFurnitureFurniture = function(buildingIndex, roomIndex, furnitureIndex) {
  var polygon = this.recomputeFurniturePolygon(furnitureIndex);
  var polygon = this.recomputeFurnitureAnchorPoints(furnitureIndex);
  var slots = polygon.marginStraightPointsShuffled[0];
  var maxS = Math.floor(this.random() * (slots.length - 1)) + 1
  slots: for (var p = 0; p < maxS; p++) {
    var slot = slots[p];
    furnitureIndex++;
    for (var attempt = 0; attempt < 21; attempt++) {
      this.Furniture(furnitureIndex, roomIndex, buildingIndex, slot[0], slot[1], slot[3] ||0, Game.ANCHORS.OUTSIDE_INWARDS)
      if (!this.getFurnitureCollision(furnitureIndex)) {
        continue slots
      }
    }
    furnitureIndex--
  }
  return furnitureIndex
}
Generation.prototype.advance = function(polygons, segments) {
  var step = this.step = this.step + 1;
  var furnitureIndex = -1;
  var roads = null;
  var sourceRoads = [];
  var layers = [];
  for (var roadIndex = 0; roadIndex < map.roads.length; roadIndex ++) {
    var segment = map.roads[roadIndex]
    this.Road(roadIndex, segment[0], segment[1], segment[2], segment[3], segment[4], segment[5])
    var p = this.computeRoadOuterPolygon(roadIndex)
    p = p.map(function(p) {
      return [Math.floor(p.x), Math.floor(p.y)]
    })
    sourceRoads.push(p.concat([p[0]]))
    //p = new Offset([p.concat([p[0]])], 3).padding(15)[0]
    var layer = this.getRoadLayer(roadIndex);
    if (!layers[layer])
      layers[layer] = [];
    layers[layer].push(p)
    //roads.push(this.computeRoadVector(roadIndex).map(function(p) {
    //  return [p.x, p.y]
    //}))
  }


  this.Road.count = roadIndex;

  for (var roadIndex = 0; roadIndex < map.roads.length; roadIndex ++) {
    var segment = map.segments[roadIndex]

    if (roadIndex % 20 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;

    this.RoadBuilding(roadIndex)
  }


  console.time('pslg');
  layers.forEach(function(loops, layer) {
    loops = loops.map(function(loop) {
      return loop.filter(function(point, index) {
        var prev = loop[index - 1];
        var next = loop[index + 1];
        if (prev == null || next == null)
          return true;

        var angle1 = Math.round(Math.atan2(point[1] - prev[1], point[0] - prev[0]) * 180 /Math.PI)
        var angle2 = Math.round(Math.atan2(next[1] - prev[1], next[0] - prev[0]) * 180 /Math.PI)

        return Math.abs(Math.abs(angle1) - Math.abs(angle2)) > 0.01
      }, this)
    })
    var p = this.computePSLG(loops)
    if (roads == null)
      roads = p
    else {
      roads = overlayPSLG(p.points, p.edges, roads.points, roads.edges, 'or')
      roads.edges = roads.red.concat(roads.blue)
    }

  }, this);


  //var pslg = this.computePSLG(this.allPoints)
  //this.districtPSLG = overlayPSLG(pslg.points, pslg.edges, roads.points, roads.edges, 'sub')
  //this.districtPolygon = this.districtPolygon

  this.Road.network = PSLGToPoly(roads.points, roads.edges).map(function(loop, index) {
    loop = loop.concat([loop[0]])
    if (index == 0)
      return loop;
    return loop//new Offset(loop.reverse(), 5).margin(100)
  })

  this.Road.insideDistricts = this.Road.network.slice(1)
  console.timeEnd('pslg');


  var buildingsByRoad = {};
  this.eachBuilding(function(building) {
    var road = this.getBuildingRoad(building);
    var roadVector = this.computeRoadVector(road)
    if (!buildingsByRoad[road])
      buildingsByRoad[road] = [];

    var x = this.getBuildingX(building);
    var y = this.getBuildingY(building)
    var xy = {x: x, y: y}
    for (var d = 0; d < this.Road.insideDistricts.length; d++)
      if (intersectPolygon(xy, this.Road.insideDistricts[d]))
        return;
    

    var index = isPointAboveLine(roadVector[0].x, roadVector[0].y, 
                                 roadVector[1].x, roadVector[1].y, 
                                 x, y) ? 1 : 0
    var collection = buildingsByRoad[road][index] || (buildingsByRoad[road][index] = [])
    this.eachRoom(function(room) {
      if (this.getRoomBuilding(room) == building) {

        collection.push.apply(collection, this.computeRoomPolygon(room))
      }
    })
  })
  console.time('district gen');
  this.allRoadDistricts = [];
  this.allOriginalPoints = [];
  for (var road in buildingsByRoad) {
    // compute hull of all buildings around road segment
    buildingsByRoad[road].forEach(function(group) {
      if (!group.length) return;
      var hull = simplifyColinearLines(equidistantPointsFromPolygon(concaveman(group.map(function(point) {
        return [point.x, point.y]
      }), 3,10), 10))

      try {
        var extension = simplifyColinearLines(equidistantPointsFromPolygon(new Offset(hull, 3).margin(25)[0], 10));
      } catch(e) {
        var extension = hull
        console.log('fail')
      }
      this.allOriginalPoints.push(extension)
      this.allRoadDistricts.push([
        parseInt(road),
        hull,
        extension
      ])
    }, this)
  }

  this.allDistricts = this.allRoadDistricts.slice();
  for (var i = 0; i < this.allDistricts.length; i++) {
    for (var j = 0; j < i; j++) {
      var poly1 = this.allDistricts[i][2];
      var poly2 = this.allDistricts[j][2];
      if (doPolygonsIntersect(poly1, poly2, 0, 1)) {
        var union = martinez.union(poly1, poly2);
        if (union.length > 1) {
          union = [simplifyColinearLines(concaveman(poly1.concat(poly2), 2.2,10))]
        }
        this.allDistricts[i][2] = union[0]
        this.allDistricts.splice(j--, 1);
        i--;
      }
    } 
  }
  console.time('network padding')
  this.Road.networkPadding = new Offset(this.Road.network[0].slice(0), 5).margin(15)[0]

  console.timeEnd('network padding')



  this.allPoints = [];
  roads: for (var i = 0; i < this.allDistricts.length; i++) {
    var road = this.allDistricts[i][2]

    road = simplifyColinearLines(equidistantPointsFromPolygon(concaveman((road),3,15), 20))
    road = martinez.diff(road, this.Road.networkPadding)[0]
    //road = new Offset(simplifyColinearLines(road), 3).padding(10)[0];
    //road = new Offset(simplifyColinearLines(equidistantPointsFromPolygon(road, 5)), 5).margin(10)[0];
    //for (var j = 0; j < this.allPoints.length; j++) {
    //  var union = martinez.union(road, this.allPoints[j]);
    //  if (union.length == 1) {
    //    road = union[0]
    //    this.allPoints.splice(j--, 1)
    //  }
    //}
//      road = new Offset([road], 5).padding(15)[0];

      //road = simplifyColinearLines(equidistantPointsFromPolygon(road, 15))
    //var pslg = this.computePSLG(road);
      //road = PSLGToPoly(pslg.points, pslg.edges)[0]
      //var offset = new Offset([road], 5).margin(15)[0];

      this.allPoints.push(road)
  }
  console.timeEnd('district gen');




   network = []//this.Road.network = network
/*
  //this.Road.network = new Offset(roads, 3).margin(40);

  this.Road.sidewalks = [];
  roads: for (var i = 0; i < sidewalks.length; i++) {
    var road = sidewalks[i]
    for (var j = 0; j < network.length; j++) {
      var union = martinez.union(road, network[j]);
      if (union.length == 1) {
        road = union[0]
        network.splice(j--, 1)
      }
    }
    this.Road.sidewalks.push(road)
  }*/
  //this.Road.network = new Offset(network.slice(), 5).margin(12);
  //this.Road.sidewalks = new Offset(network.slice(), 5).margin(15);

  //var pslg = this.computePSLG(this.Road.network);
  //debugger
  //this.Road.network = this.computeCleanPolygon(pslg)
  this.Road.sidewalks = []
  return this;
}

Generation.prototype.computePolygonFromRotatedRectangle = function(x, y, width, height, angle) {
  var polygon = [];
  for (var i = 0; i < 4; i++) {
    var Ox = width * ((i > 1) ? .5 : -.5)
    var Oy = height * ((i == 0 || i == 3) ? -.5 : .5)   
    polygon.push({
      x: x + (Ox  * Math.cos(angle)) - (Oy * Math.sin(angle)),
      y: y + (Ox  * Math.sin(angle)) + (Oy * Math.cos(angle))
    });
  }
  return polygon;
}

Generation.prototype.computeVectorFromSegment = function(x, y, distance, angle) {
  var v2 = [];
  for (var i = 0; i < 2; i++) {
    var Ox = 0
    var Oy = distance * ((i) ? .5 : -.5)//height * ((i == 0 || i == 3) ? -.5 : .5)   
    v2.push({
      x: x + (Ox  * Math.cos(angle)) - (Oy * Math.sin(angle)),
      y: y + (Ox  * Math.sin(angle)) + (Oy * Math.cos(angle))
    });
  }
  return v2;
}

Generation.prototype.computeAnchorPoints = function(points, padding, margin, context, segments) {
  if (!context)
    context = points
  if (!segments) {
    segments = points.map(function(p) { return [p.x, p.y]})
    segments.push(segments[0])
  }
  if (padding == null)
    padding = 10;
  if (margin == null)
    margin = 6;
  context.padding = new Offset([segments], 0).padding(padding)
  context.paddingPoints = context.padding.map(function(p) { return equidistantPointsFromPolygon(p, padding, true)});
  context.margin = new Offset([segments], 3).margin(6)
  context.marginPoints = context.margin.map(function(p) { return equidistantPointsFromPolygon(p, margin)});
  context.paddingPoints[0].forEach(function(spine) {
    spine[3] = angleToPolygon({x: spine[0], y: spine[1]}, points)
  })
  context.paddingPointsShuffled = [shuffleArray(context.paddingPoints[0].slice())]
  context.paddingStraightPointsShuffled = [context.paddingPointsShuffled[0].filter(function(point) {
    return point[3] % Math.PI / 2 == 0
  })]
  context.marginPoints[0].forEach(function(spine) {
    spine[3] = angleToPolygon({x: spine[0], y: spine[1]}, points)
  })
  context.marginPointsShuffled = [shuffleArray(context.marginPoints[0].slice())]
  context.marginStraightPointsShuffled = [context.marginPointsShuffled[0].filter(function(spine) {
    return Math.abs(angleToPolygon({x: spine[0], y: spine[1]}, points, true) % (Math.PI / 2)) < 0.01
  })]

  return context
}

Generation.prototype.computePSLG = function(polygons) {
  return polygonToPSLG(polygons, {clean: true}, 0, 1);
}
Generation.prototype.computeCleanPolygon = function(pslg) {
  return PSLGToPoly(pslg.points, pslg.edges);
}
Generation.prototype.getConnectivity = function(a, b, pslg) {
  for (var i = 0; i < pslg.edges.length; i++)
    if (pslg.edges[i][0] == a && pslg.edges[i][1] == b
     || pslg.edges[i][1] == a && pslg.edges[i][0] == b)
      return true;
}
Generation.prototype.computeNavigationNetwork = function(pslg, callback) {
  var points = pslg.points;
  var length = points.length;
  var network = {};
  network.distances  = new Uint16Array(length * length);
  network.transitions = new Uint16Array(length * length);
  if (callback == null)
    callback = this.getConnectivity;

  for (var i = 0; i < length * length; i++) {
    network.distances[i] = 65535
    network.transitions[i] = 65535
  }
  for (var i = 0; i < points.length; i++) {
    var p1 = points[i];
    network.distances[i * length + i] = 0
    network.transitions[i * length + i] = i;

    loop: for (var j = 0; j < i; j++) {

      var p2 = points[j];
      if (!callback(i, j, pslg, this))
        continue;
      var d = Math.sqrt(
        Math.pow(p1[0] - p2[0], 2) +
        Math.pow(p1[1] - p2[1], 2)
      , 2)
      network.distances[i * length + j] = 
      network.distances[j * length + i] = d
      network.transitions[i * length + j] = i
      network.transitions[j * length + i] = j;
    }
  }
  return network
}

Generation.prototype.computeDistances = function() {
    var length = this.totalPoints
    var i,j,k,d
    for (k = 0; k < length; ++k) {
      for (i = 0; i < length; ++i) {
        for (j = 0; j < length; ++j) {
          var il = i * length;
          var kj = distances[k * length + j];
          if (distances[il + j] > distances[il + k] + kj) {
            distances[il + j] = distances[il + k] + kj
            transitions[il + j] = transitions[k * length + j]
          }
        }
      }
    }
}

Generation.prototype.computePathPoints = function(points, padding, margin, context, segments) {
  if (!context)
    context = points
  if (!segments) {
    segments = points.map(function(p) { return [p.x, p.y]})
    segments.push(segments[0])
  }
  if (padding == null)
    padding = 10;
  if (margin == null)
    margin = 6;
  context.padding = new Offset(segments, 0).padding(padding)
  context.paddingPoints = context.padding.map(function(p) { return equidistantPointsFromPolygon(p, padding, true)});
  context.margin = new Offset(segments, 3).margin(6)
  context.marginPoints = context.margin.map(function(p) { return equidistantPointsFromPolygon(p, margin)});
  context.paddingPoints[0].forEach(function(spine) {
    spine[3] = angleToPolygon({x: spine[0], y: spine[1]}, points)
  })
  context.paddingPointsShuffled = [shuffleArray(context.paddingPoints[0].slice())]
  context.paddingStraightPointsShuffled = [context.paddingPointsShuffled[0].filter(function(point) {
    return point[3] % Math.PI / 2 == 0
  })]
  context.marginPoints[0].forEach(function(spine) {
    spine[3] = angleToPolygon({x: spine[0], y: spine[1]}, points)
  })
  context.marginPointsShuffled = [shuffleArray(context.marginPoints[0].slice())]
  context.marginStraightPointsShuffled = [context.marginPointsShuffled[0].filter(function(spine) {
    return Math.abs(angleToPolygon({x: spine[0], y: spine[1]}, points, true) % (Math.PI / 2)) < 0.01
  })]

  return context
}
Generation.prototype.computeSpinePoints = function(points, context, segments) {
  if (!context)
    context = points
  if (!segments) {
    segments = points.map(function(p) { return [p.x, p.y]})
    segments.push(segments[0])
  }
  var points = segments.map(function(p) { return {x: p[0], y: p[1]}});
  segments.forEach(function(to, index) {
    if (index == 0)
      pather = new CompGeo.shapes.Pather(to)
    else
      pather.lineTo(to)
  })

  if (pather.path.isClockwise) {
    segments.slice().reverse().forEach(function(to, index) {
      if (index == 0)
        pather = new CompGeo.shapes.Pather(to)
      else
        pather.lineTo(to)
    })
  }
  pather.close();

  var skeleton = new CompGeo.Skeleton( pather.path, Infinity );

  context.skeleton = skeleton
  context.bones = [];
  context.backbone = [];
  //var skeletonPath = new CompGeo.shapes.Path( skeleton.spokes );
  //var shape = new CompGeo.shapes.Shape( path.concat( skeletonPath ) ) 


  var uniqueness = {};
  skeleton.spokes.forEach(function(spoke) {
    var key = Math.floor(spoke.end[0]) + 'x' + Math.floor(spoke.end[1]);
    var start = {x: spoke.start[0], y: spoke.start[1]};
    if (intersectPolygon(start, segments) &&
      distanceToPolygon(start, points) > 1) {
      context.backbone.push([spoke.start, spoke.end])
    }
    if (uniqueness[key]) {
      return
    } else {
      uniqueness[key] = true;
      context.bones.push(spoke.end)
    }
  })

  context.spinesShuffled = shuffleArray(context.bones)
  return context
}
/*
Generation.prototype.computeBoundingBox = function(polygon, box) {
  if (!box)
    var box = {min: [Infinity, Infinity], max: [-Infinity, -Infinity]};
  for (var i = 0; i < polygon.length; i++) {
    var p = polygon[i];
    if (box.min[0] > p.x)
      box.min[0] = p.x;
    if (box.min[1] > p.y)
      box.min[1] = p.y;
    if (box.max[0] < p.x)
      box.max[0] = p.x;
    if (box.max[1] < p.y)
      box.max[1] = p.y;
  }
  return box;
}
Generation.prototype.computeBoundingBoxDiff = function(polygon, box) {
  if (!box)
    var box = {min: [Infinity, Infinity], max: [-Infinity, -Infinity]};
  var diff = 0;
  for (var i = 0; i < polygon.length; i++) {
    diff = Math.max(0, box.min[0] - p.x)
           + Math.max(0, box.min[1] - p.y)
           + Math.max(0, p.x - box.max[0])
           + Math.max(0, p.y - box.max[1])
  }
  return diff;
}*/