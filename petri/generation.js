Generation = function(seed, step, previous) {
  this.seed = seed;
  this.setSeed(previous ? Math.floor(previous.random() * 100000000) : seed)
  this.step      = step;
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
Generation.prototype.computePolygonSimplification = function(polygon, distance) {
  var simplified_path = new ClipperLib.Paths(); // empty solution
  simplified_path = ClipperLib.JS.Lighten(polygon, distance || 2);
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
Generation.prototype.computePolygonBinary = function(subj_paths, clip_paths, type) {
  //var off_result = ClipperLib.Clipper.SimplifyPolygons(paths, 0)
  if (type == null)
    type = ClipperLib.ClipType.ctUnion

  var cpr = new ClipperLib.Clipper();
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
  context.padding = this.computePolygonOffset([points], 0, -padding, 2).map(function(pp) {
    return pp.map(function(p) {
      return [p.x, p.y]
    })
  })
  context.paddingPoints = context.padding.map(function(p) { return equidistantPointsFromPolygon(p, padding, true)});

  context.margin = this.computePolygonOffset([points], margin, 0, 2).map(function(pp) {
    return pp.map(function(p) {
      return [p.x, p.y]
    })
  })
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