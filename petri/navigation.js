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

function checkGivenObstacleIntersection(p1,p2, height, obstacles) {
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

        if (p1.box == parent && p.x == p1.x && p.y == p1.y
          || p2.box == parent && p.x == p2.x && p.y == p2.y) {
          continue
        }
        return true
      }
    }
  }
  if (height == p1.box.height) {
    c.x = p1.x + (p2.x - p1.x) / 2
    c.y = p1.y + (p2.y - p1.y) / 2
    for (var o = 0; o < obstacles.length; o++) {
      if (intersectPolygon(c, obstacles[o].polygon) && distanceToPolygon(c, obstacles[o].polygon) > 0)
        return true
    }
  }
  return false
}

function checkObstacleIntersectionCallback(node, bbox, p1, p2) {
  return (node.height < 1 || node.height > 2 || intersectRectangle(p1.x, p1.y, p2.x, p2.y, node.minX - 1, node.minY - 1, node.maxX + 1, node.maxY + 1)) 
}
function checkObstacleIntersection(p1, p2, height) {
  searching.minX = Math.min(p1.x - 1, p2.x + 1),
  searching.minY = Math.min(p1.y - 1, p2.y + 1),
  searching.maxX = Math.max(p1.x - 1, p2.x + 1),
  searching.maxY = Math.max(p1.y - 1, p2.y + 1)
  var obstacles = map.buildings;
  return checkGivenObstacleIntersection(p1,p2, height,obstacles)
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
      node.buildingsNetwork[a] = b1
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
      node.buildingsNetwork[a] = b2
    }
  }
}

rbush.prototype.analyzePoints = function(tree, node, points, height) {
  for (var i = 0; i < points.length; i++) {
    var p1 = points[i];
    loop: for (var j = 0; j < i; j++) {
      var p2 = points[j]
      var xyi = p1.x + p1.y * 10000;
      var xyj = p2.x + p2.y * 10000;
      if (xyi == xyj) continue;

      var a = Math.min(xyi, xyj) + Math.max(xyi, xyj) * 100000000 

      if (tree.tested[a] != null)
        continue

      //node.coordinates[xyi] = points[i]
      //node.coordinates[xyj] = points[j]

      tree.coordinates[xyi] = p1
      tree.coordinates[xyj] = p2
      
      if ((tree.tested[a] = checkObstacleIntersection(p1, p2, height)))
        continue;
      //node.network.push([points[i], points[j]])

      node.connections[a] = 1
      tree.connections[a] = 1


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
      }
    }
  }
}
rbush.prototype.compute = function() {
  var hull = require('concaveman');


  tree.coordinates = {};
  tree.connections = {};
  tree.buildingsNetwork = {};
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
      node.children.forEach(function(child) {
        if (child.clone) return;
          
        child.parent = node
        if (child.building) {
          node.districtConnections = [];
          child.building.parent = child
        }
        if (child.height == null)
          child.height = height;
      });
    })
    nodes.forEach(function(node) {
      var points = []
      node.children.forEach(function(child) {
        if (child.clone) return;
        if (child.points) {
          points.push.apply(points, child.points)
        }
        else
          points.push.apply(points, child.polygon)
      });
      node.points = points;

      node.connections = {};
      node.coordinates = {};
      node.hullNetwork = {};
      node.buildingsNetwork = {};

      tree.analyzePoints(tree, node, points, height);
      
      node.hull = []
      /*

      node.hull = hull(points.map(function(p) {
        return [p.x, p.y]
      }), 1.9, 0).map(function(p) {
        return {x: p[0], y: p[1], box: node}
      })


      node.hull.forEach(function(point, index) {
        var prev = node.hull[index - 1] || node.hull[node.hull.length - 1]

        var xyi = point.x + point.y * 10000;
        var xyj = prev.x + prev.y * 10000;
        var a = Math.min(xyi, xyj) + Math.max(xyi, xyj) * 100000000 

        if (xyi != xyj && !tree.hullNetwork[a] && tree.coordinates[xyi] && tree.coordinates[xyj])
          if (!checkObstacleIntersection(point, prev, height) && height > 1) {
            tree.hullNetwork[a] = 1;
            node.hullNetwork[a] = 1;

            tree.hullBranches[xyj] = (tree.hullBranches[xyj] || 0) + 1
            tree.hullBranches[xyi] = (tree.hullBranches[xyi] || 0) + 1
          }
      })

      node.polygon = node.hull;

      /*
      node.concave = node.network.filter(function(link) {
        check: for (var i = 0; i < 2; i++) {
          var p = link[i];
          for (var j = 0; j < node.hull.length; j++) {
            if (node.hull[j].x == p.x && node.hull[j].y == p.y)
              continue check
          }
          return false;
        }
        return true;
      })

      var queue = node.concave.slice();
      var result = [];
      var start = queue.pop();*/

    })

  }

  tree.distances = {};
  tree.levels[1].forEach(function(node) {
    node.distances = tree.solveDistances(node, node.connections)
    for (var property in node.distances) {
      tree.distances[property] = node.distances[property];
    }
  })
  var districts = {};
  tree.districtDistances = tree.solveDistances(districts, tree.districtNetwork, true)
  tree.solvedDistricts = districts.solvedPathfinding
  tree.globalNetwork = {};
  for (var hash in tree.districtNetwork) {
    tree.globalNetwork[tree.districtNetwork[hash]] = tree.districtNetwork[hash]
  }
  tree.globalDistances = tree.solveDistances(tree, tree.globalNetwork, false, function(a, b) {
    //if (!tree.distances[a * 100000000 + b] && !tree.distances[b * 100000000 + a] && tree.coordinates[a].box.parent == tree.coordinates[b].box.parent)
    //  debugger
    return tree.distances[a * 100000000 + b] || tree.distances[b * 100000000 + a]
  })

  tree.levels[1].forEach(function(node) {
    for (var property in node.solvedPathfinding)
      tree.solvedPathfinding[property] = node.solvedPathfinding[property]
    for (var property in node.distances) {
      tree.distances[property] = node.distances[property];
    }
  })
  tree.finalNetwork = {};


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

rbush.prototype.solveDistances = function(node, points, useValueForDistance, callback) {
  
  var indecies = {};
  var distances = {};
  var byIndex = {};
  var number = 0;
  for (var hash in points) {
    var n = parseInt(hash)
    var a = n % 100000000
    var b = (n - a) / 100000000


    if (useValueForDistance) {
      var n = parseInt(points[hash])
      var p1 = n % 100000000
      var p2 = (n - p1) / 100000000
    } else {
      var p1 = a
      var p2 = b
    }

    var ax = p1 % 10000
    var ay = (p1 - ax) / 10000

    var bx = p2 % 10000
    var by = (p2 - bx) / 10000

    var d = Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2), 2);

    if (indecies[a] == null) {
      byIndex[number] = a;
      indecies[a] = number++;
    }
    if (indecies[b] == null) {
      byIndex[number] = b;
      indecies[b] = number++
    }
    distances[hash] = d;
  }
  var length = number;
  var graph = new Uint32Array(length * length)
  var transitions = new Uint32Array(length * length)
  var i,j,k


  for (i = 0; i < length; ++i) {
    for (j = 0; j < length; ++j) 
      graph[i * length + j] = 9999999
    graph[i * length + i] = 0
    transitions[i * length + j] = 9999999
  }

  if (callback)
  for (i = 0; i < length; ++i) {
    var a = byIndex[i];
    for (j = 0; j < i; ++j) { 
      var b = byIndex[j]
      d = callback(a, b)
      if (d != null) {
        graph[i * length + j] = graph[j * length + i] = d
        transitions[i * length + j] = i
        transitions[j * length + i] = j
      }
    }
  }

  for (var hash in points) {
    var d = distances[hash];
    var n = parseInt(hash)
    var a = n % 100000000
    var b = (n - a) / 100000000
    graph[indecies[b] * length + indecies[a]] = graph[indecies[a] * length + indecies[b]] = d;

    if (d != 0 && d < 9999999) {
      transitions[indecies[b] * length + indecies[a]] = indecies[b]
      transitions[indecies[a] * length + indecies[b]] = indecies[a]
    }
  }
   
  for (k = 0; k < length; ++k) {
    for (i = 0; i < length; ++i) {
      for (j = 0; j < length; ++j) {
        var il = i * length;
        var kj = graph[k * length + j];
        if (graph[il + j] > graph[il + k] + kj) {
          graph[il + j] = graph[il + k] + kj
          transitions[il + j] = transitions[k * length + j]
        }
      }
    }
  }

  node.solvedDistances = graph;
  node.solvedTransitions = transitions;
  node.solvedPathfinding = {};
  node.pointsByIndex = byIndex
  node.pointsIndecies = indecies;

  var result = {};
  for (i = 0; i < length; ++i) {
    for (j = 0; j < length; ++j) {
      var distance = graph[i * length + j];
      if (i == j  || distance > 999999)
        continue
      result[byIndex[i] * 100000000 + byIndex[j]] = distance
      node.solvedPathfinding[byIndex[i] * 100000000 + byIndex[j]] = byIndex[transitions[j * length + i]]
    }
  }
  return result
};

rbush.prototype.getPath = function(a, b) {
  var path = [];
  var transitions = this.solvedPathfinding
  b = parseInt(b);
  a = parseInt(a);
  var current = a;
  path.push(a);

  // route out of current district
  var A = tree.coordinates[a].box.parent.districtHub
  var B = tree.coordinates[b].box.parent.districtHub
  var i = 0;
  if (A != B) {
    var key = Math.min(A, B) + Math.max(A, B) * 100000000;
    var link = tree.districtNetwork[key]

    debugger
    // if districts are not in line of sight
    if (!link) {
      var next = this.solvedDistricts[key]
      var key = Math.min(A, next) + Math.max(A, next) * 100000000;
      var link = tree.districtNetwork[key]
    }

    // districts are in line of sigh
    if (link ) {
      var old = current;
      var outport = Math.floor(link % 100000000)
      if (tree.coordinates[outport].box.parent.districtHub != A)
        var outport = Math.floor(link / 100000000)
      current = outport
    }
  }

  while (current) {
    i++;
    if (i > 500)
      break;
    var key = current * 100000000 + b;
    var target = transitions[key];
    if (target != null) {
      var subtarget = transitions[current * 100000000 + target];
      if (subtarget) {
        while (current) {
          var key = current * 100000000 + target;
          current = transitions[key]
          if (!current)
            break
          path.push(current)
        }
      }
    }
    current = target;
    if (!current)
      break
    path.push(current)
  }
  if (old)
    return this.getPath(old, outport).concat(path.slice(1)).concat(b)
  else
    return path
}