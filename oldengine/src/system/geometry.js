P.geometry = function() {

}


P.geometry.box = function(box) {
  box.center = box.getCenter();
  box.height = box.max.y - box.min.y;
  box.width = box.max.x - box.min.x;
  box.depth = box.max.z - box.min.z;
  return box
}

P.geometry.intersectPoint = function(point, target, radius, offset) {
  var x = - point.z + offset.offset.z
  var y = point.x - offset.offset.x
  var distance = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2) )
  return distance <= radius ;
}
P.geometry.addPointToPolygon = function(polygon, point) {
  if (!polygon)
    polygon = P.currently.resizingPolygon;
  var minDistance = Infinity
  var position = -1;
  
  var a = {x: 0, y: 0}
  var b = {x: 0, y: 0}

  if (polygon.length > 2)
  for (var i = 0; i < polygon.length; i++) {
    var p = (i || polygon.length) - 1;
    var cx = polygon[i][0] + (polygon[i][0] - polygon[p][0]) / 2
    var cy = polygon[i][1] + (polygon[i][1] - polygon[p][1]) / 2
  
    a.x = polygon[i][0]
    a.y = polygon[i][1]
    b.x = polygon[p][0]
    b.y = polygon[p][1]
    var distance = P.geometry.distanceToLine(point, a, b)


    if (distance <= minDistance) {
      minDistance = distance;
      position = i;
    }

  }
  if (position == -1)
    polygon.push([point.x, point.y])
  else
    polygon.splice(position, 0, [point.x, point.y])
  //P.geometry.sortPolygon(polygon)
}

P.geometry.removePointFromPolygon = function(polygon, point) {
  var minDistance = Infinity
  var position = -1;
  for (var i = 0; i < polygon.length; i++) {
    var distance = Math.sqrt(Math.pow(point.x - polygon[i][0], 2) + Math.pow(point.y - polygon[i][1], 2) )
    if (distance < minDistance) {
      minDistance = distance;
      position = i;
    }
  }
  if (position != -1)
    polygon.splice(position, 1)

}

P.geometry.distanceToLine = (function() {
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

P.geometry.closetPointOnLine = function() {
  function pointLineSegmentParameter(p2, p0, p1) {
    var x10 = p1.x - p0.x, y10 = p1.y - p0.y,
        x20 = p2.x - p0.x, y20 = p2.y - p0.y;
    return (x20 * x10 + y20 * y10) / (x10 * x10 + y10 * y10);
  }
  return function(p, start, end) {
    var t = pointLineSegmentParameter(p, start, end),
        x10 = end.x - start.x,
        y10 = end.y - start.y
    return {x: start.x + t * x10, y: start.y + t * y10};
  }
}();

P.geometry.p = {};
P.geometry.intersectLine = function(point, start, end, radius, offset) {
  var p = P.geometry.p;
  p.x = - point.z + offset.offset.z
  p.y = point.x - offset.offset.x
  if (P.geometry.distanceToLine(p, start, end) > radius)
    return
  return P.geometry.closetPointOnLine(p, start, end)

}


P.geometry.sortPolygon = function(polygon) {
  
  var center = P.geometry.getPolygonCenter(polygon)
  return polygon.sort(function(a, b) {
    
    return P.geometry.comparePolygonPoints(a, b, center) ? 1 : -1
  })
}
P.geometry.getPolygonCenter = function(arr) {
  var minX, maxX, minY, maxY;
  for(var i=0; i< arr.length; i++){
      minX = (arr[i][0] < minX || minX == null) ? arr[i][0] : minX;
      maxX = (arr[i][0] > maxX || maxX == null) ? arr[i][0] : maxX;
      minY = (arr[i][1] < minY || minY == null) ? arr[i][1] : minY;
      maxY = (arr[i][1] > maxY || maxY == null) ? arr[i][1] : maxY;
  }
  return [(minX + maxX) /2, (minY + maxY) /2];
}
P.geometry.comparePolygonPoints = function(a, b, center) {
  if (a[0] - center[0] >= 0 && b[0] - center[0] < 0)
      return true;
  if (a[0] - center[0] < 0 && b[0] - center[0] >= 0)
      return false;
  if (a[0] - center[0] == 0 && b[0] - center[0] == 0) {
      if (a[1] - center[1] >= 0 || b[1] - center[1] >= 0)
          return a[1] > b[1];
      return b[1] > a[1];
  }

  // compute the cross product of vectors (center -> a) x (center -> b)
  var det = (a[0] - center[0]) * (b[1] - center[1]) - (b[0] - center[0]) * (a[1] - center[1]);
  if (det < 0)
      return true;
  if (det > 0)
      return false;

  // points a and b are on the same line from the center
  // check which point is closer to the center
  var d1 = (a[0] - center[0]) * (a[0] - center[0]) + (a[1] - center[1]) * (a[1] - center[1]);
  var d2 = (b[0] - center[0]) * (b[0] - center[0]) + (b[1] - center[1]) * (b[1] - center[1]);
  return d1 > d2;
}


P.geometry.distanceToPolygon = function (point, poly) {
  var minDistance = Infinity;
  var start = {x: 0, y: 0}
  var end = {x: 0, y: 0}
  for (var i = 0; i < poly.length; i++) {
    var p1 = poly[i];
    var prev = (i == 0 ? poly.length : i) - 1,
        p2 = poly[prev]

    start.x = p2[0]
    start.y = p2[1]
    end.x = p1[0]
    end.y = p1[1]

    var distance = P.geometry.distanceToLine(point, start, end);
    if (minDistance > distance)
      minDistance = distance;
  };
  return minDistance;
}



P.geometry.triangle = [
  new THREE.Vector3(0,0,0),
  new THREE.Vector3(1,0,0),
  new THREE.Vector3(1,1,0)
]
P.geometry.matrices = [
  new THREE.Matrix4(),
  new THREE.Matrix4()
]
P.geometry.triangleGeometry = new THREE.Geometry();
P.geometry.triangleGeometry.vertices = P.geometry.triangle.slice()
P.geometry.triangleGeometry.faces.push( new THREE.Face3( 0,1,2 ) );
P.geometry.triangleGeometry.computeFaceNormals();
P.geometry.triangleGeometry.computeVertexNormals();
P.geometry.triangleBufferGeometry = new THREE.BufferGeometry().fromGeometry(P.geometry.triangleGeometry)
P.geometry.matrixFromStandardTriangles = function(a2,b2,c2) {
  return P.geometry.matrixFromTriangles(
    P.geometry.triangle[0],
    P.geometry.triangle[1],
    P.geometry.triangle[2],
    a2, b2, c2
  )
}

// generate transformation matrix to turn one 2d triangle into another
P.geometry.matrixFromTriangles = function(a1,b1,c1,a2,b2,c2) { 
  var m1 = P.geometry.matrices[0].set(a1.x - c1.x, b1.x - c1.x, 0, c1.x, a1.y - c1.y, b1.y - c1.y, 0, c1.y, 0,0,1,0,0,0,0,1)
  var m2 = new THREE.Matrix4().set(a2.x - c2.x, b2.x - c2.x, 0, c2.x, a2.y - c2.y, b2.y - c2.y, 0, c2.y, 0,0,1,0,0,0,0,1)

  return m2.multiply(m1.getInverse(m1))
};














P.geometry.polygonArea = function(vertices) {
  var area = 0;
  for (var i = 0; i < vertices.length; i++) {
      j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
  }
  return area / 2;
}


P.geometry.convertPolyToPath = function(poly){
  var svgNS = poly.ownerSVGElement.namespaceURI;
  var path = document.createElementNS(svgNS,'path');
  var points = poly.getAttribute('points').split(/\s+|,/);
  var x0=points.shift(), y0=points.shift();
  var pathdata = 'M'+x0+','+y0+'L'+points.join(' ');
  if (poly.tagName=='polygon') pathdata+='z';
  path.setAttribute('d',pathdata);
  return path
}
P.geometry.convertPointsToPath = function(points) {
  var svgNS = "http://www.w3.org/2000/svg";
  var path = document.createElementNS(svgNS,'path');
  var pathdata = 'M'+points[0][0]+','+points[0][1]
  for (var i = 1; i < points.length; i++)
    pathdata += ' L' + points[i][0] + ',' + points[i][1]
  path.setAttribute('d',pathdata);
  path.d = pathdata
  return path
}
P.geometry.convertRectToPath = function(poly){
  var svgNS = poly.ownerSVGElement.namespaceURI;
  var path = document.createElementNS(svgNS,'path');
  var x = parseFloat(poly.getAttributeNS(null, 'x') || 0);
  var y = parseFloat(poly.getAttributeNS(null, 'y') || 0);
  var width = parseFloat(poly.getAttributeNS(null, 'width') || 0);
  var height = parseFloat(poly.getAttributeNS(null, 'height') || 0);
  var pathdata = 'M' + x + ',' + y;
  pathdata += ' L' + (x + width) + ',' + y;
  pathdata += ' L' + (x + width) + ',' + (y + height);
  pathdata += ' L' + (x) + ',' + (y + height);
  pathdata += ' Z';
  console.log(pathdata, 123)
  path.setAttribute('d',pathdata);
  return path
};




