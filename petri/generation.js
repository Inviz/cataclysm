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
Generation.prototype.Building  = Generation.prototype.compile(Game.Generator.Building,  ['road'], {road: 'roads'}, 'building', 'buildings');
Generation.prototype.Room      = Generation.prototype.compile(Game.Generator.Room,      ['building', 'x', 'y', 'angle'], {building: 'buildings'}, 'room', 'rooms');
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
Generation.prototype.RoadBuilding = function(roadIndex, buildingIndex) {
  var distance = this.getRoadRange(roadIndex)
  var count = 3;

  placement: for (var i = 0; i < count; i++) {
    ++buildingIndex
    for (var attempt = 0; attempt < 3; attempt++) {
      
      this.Building(buildingIndex, roadIndex)

      if (!this.getBuildingCollision(buildingIndex)) {
        this.BuildingRoom(buildingIndex)
        continue placement;
      }
    }
    --buildingIndex
  }

  return buildingIndex
}

Generation.prototype.BuildingRoom = function(buildingIndex) {
  //for (var r = 0; r < polygon.properties.buildings.length; r++) {
  //  var building = polygon.properties.buildings[r];
    var roomIndex = buildingIndex//tree.map.buildings.indexOf(building);
    this.Room(roomIndex, buildingIndex, 0,0,0)
    if (!this.getRoomCollision(roomIndex)) {
      this.BuildingRoomFurniture(buildingIndex, roomIndex)
    }
  //}
}

Generation.prototype.BuildingRoomFurniture = function(buildingIndex, roomIndex) {
  var building = this.computeRoomAnchorPoints(buildingIndex)
  building = this.computeRoomSpinePoints(buildingIndex)

  if (building) {
    debugger
    var furnitureIndex = this.Furniture.count;
    var bones = building.spinesShuffled;
    var max = Math.floor(this.random() * (bones.length - 1)) + 1

    // center points
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      furnitureIndex++;
      for (var attempt = 0; attempt < 21; attempt++) {
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
  tree.generateAnchorPointsForPolygon(polygon, polygon, null, 4)
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
  var roomIndex = -1;
  var buildingIndex = -1;
  for (var roadIndex = 0; roadIndex < map.roads.length; roadIndex ++) {
    var segment = map.roads[roadIndex]
    this.Road(roadIndex, segment[0], segment[1], segment[2], segment[3], segment[4], segment[5])
  }
  this.Road.count = roadIndex;

  for (var roadIndex = 0; roadIndex < map.roads.length; roadIndex ++) {
    var segment = map.segments[roadIndex]

    if (roadIndex % 20 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;

    buildingIndex = this.RoadBuilding(roadIndex, buildingIndex)
  }
  this.Building.count = buildingIndex
  return this;
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
  context.padding = new Offset(segments, 0).padding(padding)
  context.paddingPoints = context.padding.map(function(p) { return equidistantPointsFromPolygon(p, padding, true)});
  context.margin = new Offset(segments, 3).margin(5)
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