Game.Generator = function(seed, step, previous) {
  Generation.call(this, seed, step, previous);
  if (!this.Road) {
    Game.Generator.prototype.Road = this.compile(
      Game.Struct.Road,      
      ['previous', 'angle', 'type', 'ex', 'ey', 'collision'], 
      {previous: 'roads'}, 'road', 'roads');

    Game.Generator.prototype.Building = this.compile(
      Game.Struct.Building,  
      ['road', 'x', 'y', 'offsetAngle'], 
      {road: 'roads'}, 'building', 'buildings');

    Game.Generator.prototype.Room = this.compile(
      Game.Struct.Room,      
      ['building', 'number', 'origin'], 
      {building: 'buildings', origin: 'rooms'}, 'room', 'rooms');

    Game.Generator.prototype.Furniture = this.compile(
      Game.Struct.Furniture, 
      ['room', 'building', 'x', 'y', 'angle', 'anchor'], 
      {building: 'buildings', room: 'rooms'}, 'furniture');

    Game.Generator.prototype.Equipment = this.compile(
      Game.Struct.Equipment, 
      ['room', 'building', 'furniture'], 
      {}, 'equipment');
  }
  this.roads     = new Float64Array(previous ? previous.roads     : this.Road.size * 10000);
  this.buildings = new Float64Array(previous ? previous.buildings : this.Building.size * 10000);
  this.rooms     = new Float64Array(previous ? previous.rooms     : this.Room.size * 10000);
  this.furniture = new Float64Array(previous ? previous.furniture : this.Furniture.size * 100000);
  this.equipment = new Float64Array(previous ? previous.equipment : this.Equipment.size * 10000);

}

Game.Generator.prototype = Object.create(Generation.prototype)

Game.Generator.prototype.advance = function(polygons, segments) {
  var step = this.step = this.step + 1;
  var furnitureIndex = -1;
  var roads = null;
  var sourceRoads = [];
  var layers = [];
  var network = [];
  console.time('roads');

  this.Road.network = []
  var polygons = [];
  this.CityRoad(0)
  var count = 0;
  for (var roadIndex = 0; roadIndex < this.Road.count; roadIndex ++) {
    if (this.getRoadCollision(roadIndex) > 9) continue
      count++;
    var p = this.computeScaledPolygon(this.computeRoadPolygon(roadIndex))
    polygons.push(p)
    //roads.push(this.computeRoadVector(roadIndex).map(function(p) {
    //  return [p.x, p.y]
    //}))
    if (count % 5 == 0)
      this.RoadBuilding(roadIndex)
  }
    this.Road.network = this.computePolygonBinary(this.Road.network, polygons);

  console.timeEnd('roads');

  this.Road.count = roadIndex;

//  for (var roadIndex = 0; roadIndex < map.roads.length; roadIndex ++) {
//    var segment = map.segments[roadIndex]
//
//    if (roadIndex % 20 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;
//
//    this.RoadBuilding(roadIndex)
//  }

  this.processRoadsAndDistricts();

    /*
  this.allLines = [];
  console.time('pslg')
  var pslg = polygonToPSLG(this.allDistricts.concat(this.Road.network.slice(1)), {nested: true}, 'x', 'y')
  var triangles = cdt2d(pslg.points, pslg.edges, {interior: false})
  triangles.forEach(function(triangle) {
    this.allLines.push([pslg.points[triangle[0]], pslg.points[triangle[1]]])
    this.allLines.push([pslg.points[triangle[1]], pslg.points[triangle[2]]])
    this.allLines.push([pslg.points[triangle[2]], pslg.points[triangle[0]]])
  }, this)
  var voronoi = voronoiDiagram(pslg.points)
  this.allVoronoi = voronoi.cells.filter(function(cell) {
    return cell.indexOf(-1) == -1
  }).map(function(cell) {
    return cell.map(function(index) {
      return voronoi.positions[index]
    })
  })
  debugger
  console.timeEnd('pslg')*/
  return this;
}

Game.Generator.prototype.processRoadsAndDistricts = function() {

  console.time('district gen');
  var scale = 10;
  // fill spaces between road segments
  this.Road.network = this.computePolygonOffset(this.Road.network, 0, 3 * scale, 2)

  // holes are districts
  this.Road.insideDistricts = this.Road.network.slice(1)


  var buildingsByRoad = {};
  this.eachBuilding(function(building) {
    var road = this.getBuildingRoad(building);
    var roadVector = this.computeRoadVector(road)
    if (!buildingsByRoad[road])
      buildingsByRoad[road] = [];

    var x = this.getBuildingX(building);
    var y = this.getBuildingY(building)

    var index = isPointAboveLine(roadVector[0].x, roadVector[0].y, 
                                 roadVector[1].x, roadVector[1].y, 
                                 x, y) ? 1 : 0
    var collection = buildingsByRoad[road][index] || (buildingsByRoad[road][index] = [])
    this.eachRoom(function(room) {
      if (this.getRoomBuilding(room) == building) {

        collection.push(this.computeScaledPolygon(this.computeRoomPolygon(room)))
      }
    })
  })


  this.allRoadDistricts = [];
  this.allOriginalPoints = [];
  for (var road in buildingsByRoad) {
    buildingsByRoad[road].forEach(function(group) {
      this.allRoadDistricts.push.apply(this.allRoadDistricts, this.computePolygonOffset(group, 0, 30 * scale, 2))
    }, this)
  }

  this.allDistricts = this.computePolygonBinary([], this.allRoadDistricts)
  console.timeEnd('district gen');

  console.time('network padding')
  this.Road.sidewalks = [];
  this.Road.network.slice(1).map(function(p, index) {
    var shrunk = this.computePolygonOffset([p], -20 * scale, 10 * scale, 0);
    if (shrunk.length)
      this.Road.sidewalks.push.apply(this.Road.sidewalks, shrunk) 
  }, this)
  this.Road.networkPadding = this.computePolygonOffset(this.Road.network, 20 * scale, -10 * scale, 0)
  console.timeEnd('network padding')


  console.time('district manipulation')
  this.allPoints = [];
  this.allDistricts = this.allDistricts.map(function(d) {

    var poly = this.computePolygonHull(d, 4, 20 * scale)
    return poly//this.computePolygonOffset([poly], 100, 0, 2)[0]
  }, this)
  this.allDistricts = this.computePolygonSimplification(this.allDistricts, 10 * scale)
  this.allVoronoi = this.Road.networkPadding

  //for (var i = 0; i < 1; i++) {
  //  var expansion = [];
  //  this.allPoints = this.allPoints.map(function(district, index, array) {
  //    var expanded = this.computePolygonOffset([district], 130, 0, 2);
  //    expanded = this.computePolygonBinary(expanded, this.allDistricts, ClipperLib.ClipType.ctDifference)
  //    expanded = this.computePolygonBinary(expanded, expansion, ClipperLib.ClipType.ctDifference)
  //    expanded = this.computePolygonOffset(expanded, -10, 0, 2);
  //    if (expanded[0])
  //    expansion.push(expanded[0])
  //    return expanded[0]
  //  }, this).filter(function(d) { return d})
  //}
  console.timeEnd('district manipulation')

  console.time('outline computation')

  // this.allDistricts = this.computePolygonBinary(this.allDistricts, [this.Road.networkPadding], ClipperLib.ClipType.ctDifference)
    
  this.allPoints = this.allDistricts

  this.allPoints = this.computePolygonOffset(this.allPoints, 10 * scale, 0, 2)
  // grow districts and join them into outline
  this.outline = this.computePolygonOffset(this.allDistricts, 135 * scale, 0, 2)
  this.outline = [this.computePolygonHull([].concat.apply([], this.outline),1, 2 * scale)]

  /*
  // subtract road network first time
  this.outline = this.computePolygonBinary(this.outline, this.Road.networkPadding, ClipperLib.ClipType.ctDifference);
  
    // detect corners and small cutouts created by intersection of road network
  [1].forEach(function(d) {
    this.diff =   this.computePolygonBinary(this.outline, this.computePolygonOffset(
      this.allPoints, d * scale, 0, 2
    ), ClipperLib.ClipType.ctDifference)
    this.smallShapes = this.diff.filter(function(shape) {
      return shape.length < 18
    }, this)
    this.allPoints =  this.computePolygonBinary(this.allPoints, this.computePolygonOffset(
      this.smallShapes, 10 * scale, 0, 2
    ))

    // filter out small kinks
    this.allPoints = this.allPoints.filter(function(loop) {
      return Math.abs(ClipperLib.Clipper.Area(loop)) > (100 * scale) * (100 * scale)
    })
    this.allPoints = this.computePolygonBinary(this.allPoints, this.Road.networkPadding, ClipperLib.ClipType.ctDifference)
  }, this)*/

  this.allPoints = this.allPoints.map(function(loop) {
    var hull = this.computePolygonHull(loop,0, 10 * scale)
    var diff = this.computePolygonBinary([hull], [loop], ClipperLib.ClipType.ctDifference)
    var intersection = this.computePolygonBinary(this.allPoints, diff, ClipperLib.ClipType.ctIntersection);
    if (!intersection.length || Math.abs(ClipperLib.Clipper.Area(intersection[0])) < (5 * scale) * (5 * scale))
      return hull
    //var hull = this.computePolygonHull(loop,1.8, 30 * scale);
    //var diff = this.computePolygonBinary([hull], [loop], ClipperLib.ClipType.ctDifference)
    //var intersection = this.computePolygonBinary(this.allPoints, diff, ClipperLib.ClipType.ctIntersection);
    //if (!intersection.length || Math.abs(ClipperLib.Clipper.Area(intersection[0])) < (5 * scale) * (5 * scale))
    //  return hull 
    
    return loop//this.computePolygonHull(loop,1.8, 30 * scale);
  }, this)
  this.allPoints = this.computePolygonBinary(this.allPoints, this.Road.insideDistricts, ClipperLib.ClipType.ctDifference)
  
  this.allPoints = this.computePolygonBinary(this.allPoints, this.Road.networkPadding, ClipperLib.ClipType.ctDifference)
  
  //this.allPoints = this.computePolygonOffset(this.allPoints, -10 * scale, 10 * scale, 0)
  this.Road.network = this.computePolygonOffset(this.Road.network, 15 * scale, -15 * scale, 0)
  
  this.allPoints = this.computeScaledPolygon(this.allPoints, 0.1);
  this.allVoronoi = this.computeScaledPolygon(this.Road.networkPadding, 0.1);
  this.Road.network = this.computeScaledPolygon(this.Road.network, 0.1);
  this.Road.sidewalks = this.computeScaledPolygon(this.Road.sidewalks, 0.1);

  //this.allPoints = this.computePolygonBinary(this.allPoints, [this.Road.networkPadding], ClipperLib.ClipType.ctDifference)
    
  console.timeEnd('outline computation')
}

Game.Struct = {};


Game.Distributions = {};
Game.Distributions.Rooms = {
  residence: {
    living_room: 1,
    kitchen: 1,
    pantry: 1
  }
}
Game.Distributions.Furniture = {
  living_room: {
    INSIDE_CENTER: {
      table: 0.8,
      sofa: 0.7
    },
    INSIDE_CORNER: {
      lamp: 0.5
    },
    ALONG_INWARDS: {
      shelf: 0.15
    }
  }
}
Game.Distributions.Objects = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      magazine: 0.2
    },
    OUTSIDE_INWARDS: {
      chair: 0.8
    }
  },

  chair: {
    INSIDE_TOP: {
      magazine: 0.2
    }
  }
}

Game.MASK = {
  INSIDE: 1,
  OUTSIDE: 2,
  ALONG: 4,
  AROUND: 8,

  INWARDS: 16,
  OUTWARDS: 32,
  OPPOSITE: 64,
  CORNER: 128,
  TOP: 256,
  CENTER: 512,

}
Game.ANCHORS = {};
for (var p1 in Game.MASK) {
  Game.ANCHORS[p1] = Game.MASK[p1]
  for (var p2 in Game.MASK)
    Game.ANCHORS[p1 + '_' + p2] = Game.MASK[p1] | Game.MASK[p2]
}
