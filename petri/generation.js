Generation = function(seed, step, previous) {
  this.seed = seed;
  this.setSeed(previous ? Math.floor(previous.random() * 100000000) : seed)
  this.step      = step;
  noise.seed(this.random())
}
Generation.prototype = Object.create(Simulation.prototype);


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

Generation.prototype.computePolygonBox = function(polygon, index) {
  var box = getPolygonBox(polygon);
  box.index = index;
  box.polygon = polygon;
  return box;
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
Generation.prototype.computePSLG = function(polygons) {
  var colors
  var points = []
  var edges = []
  // unroll loops into pslg
  for(var i=0; i<polygons.length; ++i) {
    var loop = polygons[i]
    var offset = points.length
    for(var j=0; j<loop.length; ++j) {
      points.push([loop[j].x, loop[j].y])
      edges.push([ offset+j, offset+(j+1)%loop.length ])
      if (loop.length == 1)
        break;
    }
  }


  // snap points to lines
  for (var p = 0; p < points.length; p++) {
    for (var i = 0; i < edges.length; ++i) {
      var e = edges[i]
      var p1 = points[e[0]]
      var p2 = points[e[1]]
  
      if (p == e[0] || p == e[1]) continue;
      var t1 = points[p]
      var c1 = closestOnLineArray(t1, p1, p2);
      var d = Math.sqrt(Math.pow(c1[0] - t1[0], 2) + Math.pow(c1[1] - t1[1], 2), 2)
      if (d <  5) {
        edges.push([e[0], p])
        edges.push([p, e[1]])
        edges.splice(i, 1)
        if (colors) {
          colors.push(colors[i])
          colors.push(colors[i])
          colors.splice(i, 1)
        }
        i--
      }
    }
  }

  // merge points
  var pts = [];
  pts: for (var p = 0; p < points.length; p++) {
      var a = points[p]
    for (var o = 0; o < pts.length; o++) {
      var b = pts[o]
      var d = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2), 2)
      if (d < 2) {
        for (var e = 0; e < edges.length; e++) {
          if (edges[e][0] == p)
            edges[e][0] = o;
          if (edges[e][1] == p)
            edges[e][1] = o;
        }
        continue pts;
      }
    }
    pts.push(a)
    for (var e = 0; e < edges.length; e++) {
      if (edges[e][0] == p)
        edges[e][0] = pts.indexOf(a);
      if (edges[e][1] == p)
        edges[e][1] = pts.indexOf(a);
    }
  }
  points = pts;

  // filter out short edges
  //for (var i = 0; i < edges.length; ++i) {
  //  var a = points[edges[i][0]]
  //  var b = points[edges[i][1]]
  //  var d = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2), 2)
  //  if (d < 0.5) {
  //    if (colors)
  //      colors.splice(i, 1)
  //    edges.splice(i--, 1)
  //  }
  //}

  // filter out dupe edges
  for (var e = 0; e < edges.length; e++) {
    for (var o = 0; o < e; o++) {
      if (edges[e][0] == edges[o][0] && edges[e][1] == edges[o][1]
      || edges[e][1] == edges[o][0] && edges[e][0] == edges[o][1]
      || edges[e][0] == edges[e][1]) {
        if (colors)
          colors.splice(e, 1)
        edges.splice(e--, 1)
        
        break;
      }
    }
  }

  // simplify colinear lines
  //for (var p = 0; p < points.length; p++) {
  //  var foundEdges = [];
  //  for (var e = 0; e < edges.length; e++) {
  //    if (edges[e][0] == p || edges[e][1] == p) {
  //      foundEdges.push(edges[e]);
  //    }  
  //  }
  //  if (foundEdges.length == 0) {
  //  } else if (foundEdges.length == 2) {
  //    var angle1 = Math.atan2(points[foundEdges[0][0]][1] - points[foundEdges[0][1]][1], points[foundEdges[0][0]][0] - points[foundEdges[0][1]][0])
  //    var angle2 = Math.atan2(points[foundEdges[1][0]][1] - points[foundEdges[1][1]][1], points[foundEdges[1][0]][0] - points[foundEdges[1][1]][0])
  //    var angleDiff = this.computeDegreeDifference(angle1, angle2)
  //    if (angleDiff < 0.01) {
  //      if (foundEdges[0][0] == p) {
  //        if (foundEdges[1][0] == p)
  //          foundEdges[0][0] = foundEdges[1][1]
  //        else
  //          foundEdges[0][0] = foundEdges[1][0]
  //      } else {
  //        if (foundEdges[1][0] == p)
  //          foundEdges[0][1] = foundEdges[1][1]
  //        else
  //          foundEdges[0][1] = foundEdges[1][0]
  //      }
  //      edges.splice(edges.indexOf(foundEdges[1]), 1)
  //    }
  //  }
  //}

  return {
    points: points,
    edges: edges
  }
}
Generation.prototype.computeCleanPolygon = function(pslg) {
  return PSLGToPoly(pslg.points, pslg.edges).map(function(loop) {
    loop = loop.map(function(point) {
      return {x: point[0], y: point[1]}
    })
    return loop
  })
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
Generation.prototype.computePSLGPath = function(pslg, solution, a, b) {
  var path = [];
  var length = pslg.points.length;
  var last = a.index
  var target = last * length;
  for (var current = b; current; ) {
    path.unshift(current)
    if (current.index == last)
      break
    current = pslg.points[solution.transitions[current.index + target]]
  }
  return path
};
Generation.prototype.computeLineOffset = function(path, padding, type) {
  if (type == null)
    type = 1;
  var co = new ClipperLib.ClipperOffset(2, 0.25); // constructor
  var offseted_paths = new ClipperLib.Paths(); // empty solution
  co.AddPaths([path], type, ClipperLib.EndType.etOpenSquare);
  co.Execute(offseted_paths, padding);
  return offseted_paths
}
Generation.prototype.computePolygonOffset = function(paths, margin, padding, type) {
  if (type == null)
    type = 1;
  //var off_result = ClipperLib.Clipper.SimplifyPolygons(paths, 0)
  if (margin) {
    var co = new ClipperLib.ClipperOffset(2, 0.25); // constructor
    var offsetted_paths = new ClipperLib.Paths(); // empty solution
    co.AddPaths(paths, type, ClipperLib.EndType.etClosedPolygon);
    co.Execute(offsetted_paths, margin);
  } else {
    var offsetted_paths = paths;
  }
  if (padding) {
    var padded_paths = new ClipperLib.Paths(); // empty solution
    var co = new ClipperLib.ClipperOffset(2, 0.25); // constructor
    co.AddPaths(offsetted_paths, type, ClipperLib.EndType.etClosedPolygon);
    co.Execute(padded_paths, padding);
    padded_paths.sort(function(a, b) {
      return b.length - a.length
    })
    return padded_paths;
  }

  return offsetted_paths;
}
Generation.prototype.computePolygonSimplification = function(polygon, distance, simplify) {
  var simplified_path = new ClipperLib.Paths(); // empty solution
  var simplified_path2 = new ClipperLib.Paths(); // empty solution
  simplified_path = ClipperLib.JS.Lighten(polygon, distance || .5);
  simplified_path[0] = simplifyColinearLines(simplified_path[0], 'x', 'y')
  if (simplify)
    ClipperLib.Clipper.SimplifyPolygons(simplified_path, 0)
  return simplified_path
}
Generation.prototype.computeScaledPolygon = function(poly, scale) {
  if (scale == null || scale === true)
    scale = 10;
  else if (scale === false)
    scale = 0.1
  return poly.map(function(loop) {
    if (loop[0] && loop[0])
      return loop.map(function(p) {
        return {x: scale * p.x, y: scale * p.y}
      })
    else
      return {x: scale * loop.x, y: scale * loop.y}

  })
}
Generation.prototype.computePolygonBinary = function(subj_paths, clip_paths, type, flag) {
  //var off_result = ClipperLib.Clipper.SimplifyPolygons(paths, 0)
  if (type == null)
    type = ClipperLib.ClipType.ctUnion

  var cpr = new ClipperLib.Clipper(flag);
  cpr.AddPaths(subj_paths, ClipperLib.PolyType.ptSubject, true);  // true means closed path
  cpr.AddPaths(clip_paths, ClipperLib.PolyType.ptClip, true);

  var solution_paths = new ClipperLib.Paths();
  var succeeded = cpr.Execute(type, solution_paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  
  return solution_paths;
}

Generation.prototype.computePolygonHull = function(polygon, concavity, distance) {
  if (polygon[0][0])
    var points = [].concat.apply([], polygon)
  else
    var points = [].concat(polygon);
  return concaveman(points.map(function(p) {
        return [p.x, p.y]
      }), concavity, distance).map(function(p) {
        return {x: p[0], y: p[1]}
      });
}

Generation.prototype.computeDistances = function(pslg, solution) {
    var length = pslg.points.length
    var distances = solution.distances;
    var transitions = solution.transitions
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
Generation.prototype.computeDegreeDifference = function(d1, d2) {
  var diff = Math.abs(d1 - d2) % Math.PI;
  return Math.min(diff, Math.abs(diff - Math.PI));
}

Generation.prototype.computeAnchorPoints = function(points, padding, margin, context, segments, mDash, pDash) {
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
  if (mDash == null)
    mDash = margin;
  if (pDash == null)
    pDash = padding;
  context.padding = this.computePolygonOffset([points], 0, -padding, 2).map(function(pp) {
    return pp.map(function(p) {
      return [p.x, p.y]
    })
  })
  context.paddingPoints = context.padding.map(function(p) { return equidistantPointsFromPolygon(p, Math.abs(pDash), true, false)}) 
  if (!context.paddingPoints.length)
    context.paddingPoints = [[]]

  context.margin = this.computePolygonOffset([points], margin, 0, 2).map(function(pp) {
    return pp.map(function(p) {
      return [p.x, p.y]
    })
  })
  context.marginPoints = context.margin.map(function(p) { return equidistantPointsFromPolygon(p, Math.abs(mDash), true, true)});

  context.paddingPoints[0].forEach(function(spine) {
    spine[3] = Math.PI + angleToPolygon({x: spine[0], y: spine[1]}, points)
    spine[4] = Game.ANCHOR.INSIDE | Game.ANCHOR.OUTWARDS | Game.ANCHOR.INWARDS
    for (var i = 0; i < context.padding[0].length; i++) {
      var p = context.padding[0][i];
      var pp = context.padding[0][i ? i - 1 : context.padding[0].length - 1];
      var pn = context.padding[0][(i + 1) % context.padding[0].length];
      if (p[0] == spine[0] && p[1] == spine[1]) {
        spine[4] = Game.ANCHOR.INSIDE_CORNER;
        var closestCorner = findClosestPoint(spine, points);  
        spine[5] = angleBetweenLines(p[0], p[1], pp[0], pp[1], p[0], p[1], pn[0], pn[1]) 
//        spine[3] += angle / 2
      }
    }
  })
  context.paddingPointsShuffled = [this.shuffleArray(context.paddingPoints[0].slice())]
  context.paddingStraightPointsShuffled = [context.paddingPointsShuffled[0].filter(function(point) {
    return point[3] % Math.PI / 2 == 0
  })]
  if (!context.marginPoints[0])
    context.marginPoints[0] = [];
  context.marginPoints[0].forEach(function(spine) {
    spine[3] = angleToPolygon({x: spine[0], y: spine[1]}, points)
    spine[4] = Game.ANCHOR.OUTSIDE | Game.ANCHOR.OUTWARDS | Game.ANCHOR.INWARDS
    for (var i = 0; i < context.margin[0].length; i++) {
      var p = context.margin[0][i];
      var pp = context.margin[0][i ? i - 1 : context.margin[0].length - 1];
      var pn = context.margin[0][(i + 1) % context.margin[0].length];
      if (p[0] == spine[0] && p[1] == spine[1]) {
        spine[4] = Game.ANCHOR.OUTSIDE_CORNER;
        var closestCorner = findClosestPoint(spine, points);  
        spine[5] = angleBetweenLines(p[0], p[1], pp[0], pp[1], p[0], p[1], pn[0], pn[1]) 
//        spine[3] += angle / 2
      }
    }
  })
  context.marginPointsShuffled = [this.shuffleArray(context.marginPoints[0].slice())]
  context.marginStraightPointsShuffled = [context.marginPointsShuffled[0].filter(function(spine) {
    return Math.abs(angleToPolygon({x: spine[0], y: spine[1]}, points, true) % (Math.PI / 2)) < 0.01
  })]

  return context
}
Generation.prototype.computePoints = function(points, straight) {
  var margin = straight ? points.marginStraightPoints[0] : points.marginPoints[0]
  points.allPoints = margin.concat(points.paddingPoints[0] || [], points.spines || [])
  points.allPointsShuffled = this.shuffleArray(points.allPoints);
  return points;
}
Generation.prototype.computeSpinePoints = function(points, context, segments, distance) {
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

  var skeleton = new CompGeo.Skeleton( pather.path,distance || Infinity );

  context.skeleton = skeleton
  context.skeletonInput = pather.path
  context.spines = [];
  context.backbone = [];
  //var skeletonPath = new CompGeo.shapes.Path( skeleton.spokes );
  //var shape = new CompGeo.shapes.Shape( path.concat( skeletonPath ) ) 


  var uniqueness = {};
  skeleton.spokes = skeleton.spokes.filter(function(spoke) {
    if (!isFinite(spoke.start[0]) || !isFinite(spoke.start[1]) || !isFinite(spoke.end[0]) || !isFinite(spoke.end[1]))
      return false;

    var start = {x: spoke.end[0], y: spoke.end[1]};
    if (!intersectPolygon(start, segments) &&
      distanceToPolygon(start, points) > 1) 
    return false;
    return true;
  });
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
      spoke.end[3] = angleToPolygon({x: spoke.end[0], y: spoke.end[1]}, points)
      spoke.end[4] = Game.ANCHOR.CENTER
      context.spines.push(spoke.end)
    }
  })

  context.spinesShuffled = this.shuffleArray(context.spines)
  return context
}

Generation.prototype.computeTripleNoise = function(x, y) {
  var value1, value2, value3;
  value1 = (noise.simplex2(x / 10000, y / 10000) + 1) / 2;
  value2 = (noise.simplex2(x / 20000 + 500, y / 20000 + 500) + 1) / 2;
  value3 = (noise.simplex2(x / 20000 + 1000, y / 20000 + 1000) + 1) / 2;
  return Math.pow((value1 * value2 + value3) / 2, 2);
}

Generation.prototype.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(this.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
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