if (typeof rbush == 'undefined')
  rbush = require('rbush')
var intersection = {};
function checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  var denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  var numeA = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
  var numeB = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));

  if (denom == 0) {
    if (numeA == 0 && numeB == 0) {
      return ;
    }
    return ;
  }

  var uA = numeA / denom;
  var uB = numeB / denom;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    intersection.x = x1 + (uA * (x2 - x1)),
    intersection.y = y1 + (uA * (y2 - y1))
    
    return intersection
  }

  return;
}

var c = {};
var searching = {};

function checkGivenObstacleIntersection(p1,p2, obstacles) {
  for (var o = 0; o < obstacles.length; o++) {
    var obstacle = obstacles[o];
    var poly = obstacle.polygon;
    for (var k = 0, l = poly.length - 1; k < poly.length; l = k++) {
      var p;
      if (p = checkIntersection(poly[k].x, poly[k].y,
                            poly[l].x, poly[l].y,
                            p1.x, p1.y, 
                            p2.x, p2.y 
                        )) {
        var parent = obstacle.parent

        // check if path is along the way
        if (p.x == p1.x && p.y == p1.y && (p1.boxes ? p1.boxes.indexOf(parent) > -1 : p1.box == parent)
          || p.x == p2.x && p.y == p2.y && (p2.boxes ? p2.boxes.indexOf(parent) > -1 : p2.box == parent)) {
          continue
        }
        return true
      }
    }
  }

  var closestPolygons = []
    c.x = p1.x + (p2.x - p1.x) / 2
    c.y = p1.y + (p2.y - p1.y) / 2
    for (var o = 0; o < obstacles.length; o++) {
      var b1 = p1.box;
      var d = distanceToPolygon(c, obstacles[o].polygon);
      if (intersectPolygon(c, obstacles[o].polygon) 
        && (distanceToPolygon(c, obstacles[o].polygon) > 0))
        return true
    }

  return
}

function checkObstacleIntersection(p1, p2) {
  var obstacles = map.buildings;
  return checkGivenObstacleIntersection(p1,p2,obstacles)
}
intersectPolygon = function (point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i].x, yi = vs[i].y;
      var xj = vs[j].x, yj = vs[j].y;

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
};

distanceToLine = (function() {
  function sqr(x) { return x * x }
  function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
  function distToSegmentSquared(p, v, w) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, { x: v.x + t * (w.x - v.x),
                      y: v.y + t * (w.y - v.y) });
  }
  return function(p, v, w) { 
    return Math.sqrt(distToSegmentSquared(p, v, w)); 
  }
})();


function intersectRectangle (x1, y1, x2, y2, minX, minY, maxX, maxY) {  
    // Completely outside.
    if ((x1 <= minX && x2 <= minX) || (y1 <= minY && y2 <= minY) || (x1 >= maxX && x2 >= maxX) || (y1 >= maxY && y2 >= maxY))
        return false;

    var m = (y2 - y1) / (x2 - x1);

    var y = m * (minX - x1) + y1;
    if (y > minY && y < maxY) return true;

    y = m * (maxX - x1) + y1;
    if (y > minY && y < maxY) return true;

    var x = (minY - y1) / m + x1;
    if (x > minX && x < maxX) return true;

    x = (maxY - y1) / m + x1;
    if (x > minX && x < maxX) return true;

    return false;
}

distanceToPolygon = function (point, poly) {
  var minDistance = Infinity;
  for (var i = 0; i < poly.length; i++) {
    var p1 = poly[i];
    var prev = (i == 0 ? poly.length : i) - 1,
        p2 = poly[prev]
    var distance = distanceToLine(point, p1, p2);
    if (minDistance > distance)
      minDistance = distance;
  };
  return minDistance;
}

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

rbush.prototype.analyzePoints = function(node, points) {
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
  points = this.points
  this.totalPoints = length;

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
rbush.prototype.compute = function() {
  var hull = require('concaveman');


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
        if (child.points) {
          points.push.apply(points, child.points)
        }
        else
          points.push.apply(points, child.polygon)
      });
      node.points = points;
      
      node.hull = []
      
    })

  }
  tree.analyzePoints(tree.data, tree.data.points);
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