var intersection = {}
function checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4, strict) {
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
function isOnLine(x, y, endx, endy, px, py) {
    var f = function(somex) { return (endy - y) / (endx - x) * (somex - x) + y; };
    return Math.abs(f(px) - py) < 1e-6 // tolerance, rounding errors
        && px >= x && px <= endx;      // are they also on this segment?
}
function isOnLine2(initial_x, initial_y, endx, endy, pointx, pointy, tolerate) {
     var slope = (endy-initial_y)/(endx-initial_x);
     var y = slope * pointx + initial_y;

     if((y <= pointy+tolerate && y >= pointy-tolerate) && (pointx >= initial_x+tolerate && pointx <= endx-tolerate)) {
         return true;
     }
     return false;
}
    /*
function getLineLineDistance(x1, y1, x2, y2, x3, y3, x4, y4) {
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

  var iX = x1 + (uA * (x2 - x1))
  var iY = y1 + (uA * (y2 - y1))
  
  // if lines intersect, distance is zero
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return 0
  }

  return;
}*/
function checkGivenPolygonIntersection(polygon1, polygon2) {
  for (var k = 0; k < polygon1.length; k++) {
    var p1 = polygon1[k]
    var p2 = polygon1[(k + 1) % polygon1.length]
    for (var l = 0; l < polygon2.length; l++) {
      var p3 = polygon2[l]
      var p4 = polygon2[(l + 1) % polygon2.length]
      if (checkIntersection(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y)) {
        return true;
      }
    }
  }
  return false;
}
function checkGivenObstacleIntersection(p1,p2, obstacles, a, b, start) {
  if (!a) a = 0;
  if (!b) b = 0;
  if (start == null)
    start = 1;
  if (!obstacles)
    var obstacles = tree.union.polygons;
  for (var o = 0; o < obstacles.length; o++) {
    var obstacle = obstacles[o];
    if (obstacle.geometry)
      var poly = obstacle.geometry.coordinates[0]
    else
      var poly = obstacle
    var p = null;
    var intersections = 0;
    var lastpx = null
    var lastpy = null;
    for (var k = start; k < poly.length; k++) {
      var l = k ? k - 1 : poly.length - 1;
      var kx = poly[k][a]
      var ky = poly[k][b]
      var lx = poly[l][a]
      var ly = poly[l][b]

      // if line lies on polygon, allow it (because we merged geometry before)
      if (kx == p1.x && ky == p1.y && lx == p2.x && ly == p2.y
      ||  kx == p2.x && ky == p2.y && lx == p1.x && ly == p1.y) {
        return false;
      }
      var p;

      // check if line intersect at least two polygon segments, excluding corners
      if (p = checkIntersection(kx, ky,
                            lx, ly,
                            p1.x, p1.y, 
                            p2.x, p2.y 
                        )) {
        if (lastpx != p.x || lastpy != p.y) {

          intersections++;
          var lastpx = p.x;
          var lastpy = p.y;
        }

      }
    }
    if (intersections > 1)
      return true
  }
  return
}

function checkObstacleIntersection(p1, p2) {
  return checkGivenObstacleIntersection(p1,p2,tree.union.polygons)
}
intersectPolygon = function (point, vs, X, Y, start) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;
  if (X == null) X = 0;
  if (Y == null) Y = 1;
  if (start == null) start = 1;
  var inside = false;
  if (start == null)
    start = 1;
  for (var i = start, j = 0; i < vs.length; i++) {
      var j = i ? i - 1 : vs.length - 1;
      var xi = vs[i][X], yi = vs[i][Y];
      var xj = vs[j][X], yj = vs[j][Y];

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

closestOnLine = function(pt0, pt1, pt2) {
  function dist2(pt1, pt2) { 
      return Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2);
  }
  
  var l2 = dist2(pt1, pt2);
  if (l2 == 0) 
      return pt1;
  
  var t = ((pt0.x - pt1.x) * (pt2.x - pt1.x) + (pt0.y - pt1.y) * (pt2.y - pt1.y)) / l2;
  
  if (t < 0) 
      return pt1;
  if (t > 1) 
      return pt2;
  
  return {x: pt1.x + t * (pt2.x - pt1.x), y: pt1.y + t * (pt2.y - pt1.y)};
}

closestOnLineArray = function(pt0, pt1, pt2) {
  function dist2(pt1, pt2) { 
      return Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2);
  }
  
  var l2 = dist2(pt1, pt2);
  if (l2 == 0) 
      return pt1;
  
  var t = ((pt0[0] - pt1[0]) * (pt2[0] - pt1[0]) + (pt0[1] - pt1[1]) * (pt2[1] - pt1[1])) / l2;
  
  if (t < 0) 
      return pt1;
  if (t > 1) 
      return pt2;
  
  return [pt1[0] + t * (pt2[0] - pt1[0]), pt1[1] + t * (pt2[1] - pt1[1])];
}


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
  for (var i = 1; i < poly.length; i++) {
    var p1 = poly[i];
    var prev = (i == 0 ? poly.length : i) - 1,
        p2 = poly[prev]
    var distance = distanceToLine(point, p1, p2);
    if (minDistance > distance) {
      minDistance = distance;
    }
  };
  return minDistance;
}

angleToPolygon = function (point, poly, relative) {
  var minDistance = Infinity;
  for (var i = 0; i < poly.length; i++) {
    var p1 = poly[i];
    var prev = (i == 0 ? poly.length : i) - 1,
        p2 = poly[prev]
    var distance = distanceToLine(point, p1, p2);
    if (minDistance > distance) {
      var best1 = p1;
      var best2 = p2;
      minDistance = distance;
    }
  };
  if (best1) {
    var c = closestOnLine(point, best1, best2);
    var angle1 = Math.atan2(c.y - point.y,
                               c.x - point.x);
    var angle2 = Math.atan2(best1.y - best2.y,
                               best1.x - best2.x);
    if (relative)
      return angle2 - angle1
    return angle1;
  }
}

equidistantPointsFromPolygon = function(poly, length, binary) {
  if (length == null)
    length = 10;
  var result = [];
  for (var i = 0; i < poly.length; i++) {
    var p1 = poly[i];
    var prev = (i == 0 ? poly.length : i) - 1,
        p2 = poly[prev]

    var x1 = p1[0]
    var y1 = p1[1]
    var x2 = p2[0]
    var y2 = p2[1]
    var L = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2), 2);
    if (!L) {
      if (!result.length)
        result.push([x1, y1])
      continue
    }
    if (binary) {
      var d = Math.floor(L / length);
      target = L / (d || 1)
    }
    else
      var target = length;
    segmenting: for (var s = 0; s <= L; s += binary ? target : target / 4) {
      var p = s / L
      //if (s + length * 0.6 > L)
      //  p = 1;
      var xs = x2+p*(x1-x2);
      var ys = y2+p*(y1-y2)
      for (var j = 0; j < result.length; j++) {
        var x0 = result[j][0]
        var y0 = result[j][1]
        var l = Math.sqrt(Math.pow(x0 - xs, 2) + Math.pow(y0 - ys, 2), 2);
        if (l < length) {
          continue segmenting
        }
      }
      result.push([xs, ys])
    }


  }
  result.push(result[0])

  return result;
}


equidistantPointsFromSegments = function(segments, length, binary) {
  if (length == null)
    length = 10;
  var result = [];
  for (var i = 0; i < segments.length; i++) {
    var p1 = segments[i][0];
    var p2 = segments[i][1];

    var x1 = p1[0]
    var y1 = p1[1]
    var x2 = p2[0]
    var y2 = p2[1]
    var L = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2), 2);
    if (!L)
      continue;
    if (binary) {
      var target = L;
      for (var d = 2; d < 10; d++) {
        if (target / d < length)
          break;
      }
      target /= (d - 1);
    }
    else
      var target = length;
    segmenting: for (var s = 0; s <= L; s += binary ? target : target / 4) {
      var p = s / L
      //if (s + target * 0.6 > L)
      //  p = 1;
      var xs = x2+p*(x1-x2);
      var ys = y2+p*(y1-y2)
      for (var j = 0; j < result.length; j++) {
        var x0 = result[j][0]
        var y0 = result[j][1]
        var l = Math.sqrt(Math.pow(x0 - xs, 2) + Math.pow(y0 - ys, 2), 2);
        if (l < length) {
          continue segmenting
        }
      }
      result.push([xs, ys])
    }


  }
  return result;
}


//Converts a polygon to a planar straight line graph
function polygonToPSLG(loops, options, X, Y) {
  if(!Array.isArray(loops)) {
    throw new Error('poly-to-pslg: Error, invalid polygon')
  }
  if(loops.length === 0) {
    return {
      points: [],
      edges:  []
    }
  }

  options = options || {}

  var nested = true
  if('nested' in options) {
    nested = !!options.nested
  } else if(loops[0].length === 2 && typeof loops[0][0] === 'number') {
    //Hack:  If use doesn't pass in a loop, then try to guess if it is nested
    nested = false
  }
  if(!nested) {
    loops = [loops]
  }

  //First we just unroll all the points in the dumb/obvious way
  var points = []
  var edges = []
  for(var i=0; i<loops.length; ++i) {
    var loop = loops[i]
    var offset = points.length
    for(var j=0; j<loop.length; ++j) {
      points.push([loop[j][X], loop[j][Y]])
      edges.push([ offset+j, offset+(j+1)%loop.length ])
    }
  }

  //Then we run snap rounding to clean up self intersections and duplicate verts
  var clean = 'clean' in options ? true : !!options.clean
  if(clean) {
    cleanPSLG(points, edges)
  }

  //Finally, we return the resulting PSLG
  return {
    points: points,
    edges:  edges
  }
}