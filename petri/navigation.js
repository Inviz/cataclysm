if (typeof rbush == 'undefined')
  rbush = require('rbush')

rbush.prototype.connectBuildings = function(tree, node, xyi, xyj, b1, b2, a, distance) {
  if (b1 != b2) {
    var d1 = b1.parent.parent
    var d2 = b2.parent.parent;
    if (!b1.buildingsOnSight)
      b1.buildingsOnSight = [];

    if (b1.buildingsOnSight.indexOf(b2) == -1) {
      b1.buildingsOnSight.push(b2);
      tree.buildingsNetwork[a] = b1
      if (!d1.districtHub)
        d1.districtHub = xyi
      if (!d2.districtHub)
        d2.districtHub = xyj
      if (d1 != d2) {
        tree.districtHubs[d2.districtHub] = 1
        tree.districtHubs[d1.districtHub] = 1
        register = true;
      }
    }
    if (d1 != d2) {
      var dkey = Math.min(d1.districtHub, d2.districtHub) +
          Math.max(d1.districtHub, d2.districtHub) * 100000000

      var di = d1.districtConnections.indexOf(d2);
      if (di == -1) {
        tree.districtNetwork[dkey] = a
        d1.districtConnections.push(d2, distance, a)
      } else if (d1.districtConnections[di + 1] > distance) {
        tree.districtNetwork[dkey] = a
        d1.districtConnections.splice(di, 3, d2, distance, a)
      } else {
        distance = d1.districtConnections[di + 1]
      }
    }
    if (!b2.buildingsOnSight)
      b2.buildingsOnSight = [];
    if (b2.buildingsOnSight.indexOf(b1) == -1) {
      b2.buildingsOnSight.push(b1);
      tree.buildingsNetwork[a] = b2
    }
  }
}

rbush.prototype.setXY = function(collection, value, x, y) {
  collection[value]
}

rbush.prototype.generateAnchorPointsForPolygon = function(points, context, segments, padding, margin) {
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
}
rbush.prototype.analyzePoints = function(node, points, solve) {
  

  var length = 0;
  this.coordinates = {};
  this.points = [];
  for (var i = 0; i < points.length; i++) {
    var p1 = points[i];
    var xyi = p1.x + p1.y * 10000;
    var other = this.coordinates[xyi];
    if (other != null) {
      if (!other.boxes)
        other.boxes = [other.box, p1.box]
      else
        other.boxes.push(p1.box)
      continue;
    }
    p1.index = length++;
    this.coordinates[xyi] = p1;
    this.points.push(p1)
  }
  
  tree.skeletons = [];
  tree.union = {
    geometry: {
      coordinates: tree.polygons.map(function(poly) {
        return poly.geometry.coordinates
      })
    }
  }
  tree.union = [];
  tree.polygons.forEach(function(polygon) {
    var current = tree.union;
    for (var i = 0; i < current.length; i++) {
      var union = martinez.union(current[i].geometry.coordinates, polygon.geometry.coordinates);
      if (union.length == 1) {
        current[i].geometry.coordinates = union;
        current[i].properties.buildings.push(polygon.properties.building)
        return;
      }
    }
    current.push({
      type: 'Feature',
      properties: {
        buildings: [polygon.properties.building]
      },
      geometry: {
        type: 'Polygon',
        coordinates: polygon.geometry.coordinates
      }
    })
  })
  tree.union.map(function(polygon) {
    var path = [];
    var segments = polygon.geometry.coordinates[0]
    
    
    tree.skeletons.push(skeleton)


    return polygon
  })
  points = this.points
  this.totalPoints = length;
  if (!solve) return;
  this.distances  = new Uint16Array(length * length);
  this.transitions = new Uint16Array(length * length);

  for (var i = 0; i < length * length; i++) {
    this.distances[i] = 65535
    this.transitions[i] = 65535
  }
  for (var i = 0; i < points.length; i++) {
    var p1 = points[i];
    this.distances[i * length + i] = 0
    this.transitions[i * length + i] = i;

    loop: for (var j = 0; j < i; j++) {

      var p2 = points[j];
      if (checkObstacleIntersection(p1, p2))
        continue;
      var d = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2)
      , 2)
      this.distances[i * length + j] = 
      this.distances[j * length + i] = d
      this.transitions[i * length + j] = i
      this.transitions[j * length + i] = j;
      /*
      var b1 = p1.box && p1.box.building;
      if (b1) {
        tree.buildingsPoints[xyi] = b1;
      }
      else
        var b1 = tree.buildingsPoints[xyi]
      var b2 = p2.box && p2.box.building;
      if (b2) {
        tree.buildingsPoints[xyj] = b2;
      }
      else
        var b2 = tree.buildingsPoints[xyj]

      var register = false;
        
      if (b1 && b2) {
        var distance = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2)
        , 2)
        this.connectBuildings(tree, node, xyi, xyj, b1, b2, a, distance)
      }*/
    }
  }
}
rbush.prototype.compute = function(solve) {
  tree.coordinates = {};
  tree.hullNetwork = {};
  tree.hullBranches = {}
  tree.buildingsPoints = {};
  tree.districtNetwork = {};
  tree.districtHubs = {};
  tree.map = map;
  tree.levels = {};
  tree.tested = {};
  tree.buildings = [];

  for (var level = this.data.height; level > -1; level--) {
    var height = this.data.height - level;
    var nodes = tree._leaves(tree.data, [], height)
    tree.levels[height] = nodes
    nodes.forEach(function(node) {
      var points = []
      node.children.forEach(function(child) {
        if (child.clone) return;
        child.parent = node
        if (child.building) {
          child.building.parent = child
        }
        if (child.height == null)
          child.height = height;
        points.push.apply(points, child.points)
      });
      node.points = points;
      
      node.hull = []
      
    })

  }
  tree.analyzePoints(tree.data, tree.data.points, solve);
  if (solve)
    tree.solveDistances(tree.distances, tree.transitions)

  /*
  for (var xyi in tree.hullBranches) {
    if (tree.hullBranches[xyi] < 3) continue;
    for (var xyj in tree.hullBranches) {
      if (tree.hullBranches[xyj] < 3) continue;
      var a = Math.min(xyi, xyj) + Math.max(xyi, xyj) * 100000000 
      var p1 = tree.coordinates[xyj]
      var p2 = tree.coordinates[xyi]
      if (p1 && p2 && !checkObstacleIntersection(p1, p2, 5)) {
        tree.hullNetwork[a] = 1
      }
    }      
  }*/
}

rbush.prototype.solveDistances = function(distances, transitions) {
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
};

rbush.prototype.getPath = function(a, b) {
  var path = [];
  var length = this.totalPoints
  var target = a.index * length;
  for (var current = b; current; ) {
    path.unshift(current)
    if (current == a)
      break
    current = this.points[this.transitions[current.index + target]]
  }
  return path
};