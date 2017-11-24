P.geometry = function() {

}


P.geometry.box = function(box) {
  box.center = box.getCenter();
  box.height = box.max.y - box.min.y;
  box.width = box.max.x - box.min.x;
  box.depth = box.max.z - box.min.z;
  return box
}
P.geometry.hull = require('concaveman');

P.geometry.computeHull = function(points, pad) {
  var cloud = [];

  for (var i = 0; i < points.length; i++) {
    cloud.push([
      points[i].x,
      points[i].y
    ])

  if (pad !== false)
    // add dots every 3 grid points along the wall
    if (i % 2 == 1) {
      var distance = Math.sqrt(Math.pow(points[i].x - points[i - 1].x, 2) + Math.pow(points[i].y - points[i - 1].y, 2) )
      var grid = 14;
      for (var px = grid / 2; px < distance - grid / 2; px+= grid) {
        cloud.push([
          points[i - 1].x + (points[i].x - points[i - 1].x) * (px / distance), 
          points[i - 1].y + (points[i].y - points[i - 1].y) * (px / distance)
        ])
      }
    }
  }
  var hull = P.geometry.hull(cloud, 0.8, 10);


  // filter out points that lie on one line to reduce number of drawn polygons
  hull = hull.filter(function(point, index) {
    var prev = hull[index - 1];
    var next = hull[index + 1];
    if (prev == null || next == null)
      return true;

    var angle1 = Math.round(Math.atan2(point[1] - prev[1], point[0] - prev[0]) * 180 /Math.PI)
    var angle2 = Math.round(Math.atan2(next[1] - prev[1], next[0] - prev[0]) * 180 /Math.PI)

    return Math.abs(Math.abs(angle1) - Math.abs(angle2)) > 0
  }, this);

  if (hull.length > 1) {
    if (hull[0][0] === hull[hull.length - 1][0] &&
        hull[0][1] === hull[hull.length - 1][1]) {
      hull = hull.slice(0, hull.length - 1)
    }
  }

  return hull;

}

P.geometry.triangulatePolygon = function(points, offset, repair) {
  // triangulate hull
  if (points[0][0]) {
    var shape = new THREE.Shape(points[0]);
    shape.holes = points.slice(1).map(function(hull) {
      return new THREE.Path(hull)
    })
  } else {
    var shape = new THREE.Shape(points.concat([points[0]]));
  }
  var geometry = new THREE.ShapeGeometry(shape)

  return P.geometry.matrixesFromGeometry(geometry, true)
}
P.geometry.matrixesFromGeometry = function(geometry, inverted) {
  var floors = [];

    var mS = (new THREE.Matrix4()).identity();
    mS.elements[0] = -1;
    geometry.applyMatrix(mS);
  for ( var f = 0; f < geometry.faces.length; f ++ ) {
  
      var face = geometry.faces[ f ];
      var temp = face.a;
      face.a = face.c;
      face.c = temp;
  
  }
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
  for ( var f = 0; f < faceVertexUvs.length; f ++ ) {
  
      var temp = faceVertexUvs[ f ][ 0 ];
      faceVertexUvs[ f ][ 0 ] = faceVertexUvs[ f ][ 2 ];
      faceVertexUvs[ f ][ 2 ] = temp;
  
  }
  geometry.computeBoundingBox();
  var a = new THREE.Vector3;
  var b = new THREE.Vector3;
  var c = new THREE.Vector3;
  //for (var k = 0, l = geometry.vertices.length; k < l; k++) {
  //  geometry.vertices[k].z += Math.random() * 50
  //}

  for (var k = 0, l = geometry.faces.length; k < l; k++) {
    var face = geometry.faces[k];
    a.copy(geometry.vertices[face.a]);
    b.copy(geometry.vertices[face.b]);
    c.copy(geometry.vertices[face.c]);
    var matrix = P.geometry.matrixFromStandardTriangles(geometry.vertices[face.a],geometry.vertices[face.b],geometry.vertices[face.c]);
    floors.push(matrix)
  }

  return floors
}
P.geometry.extrudePolygon = function(polygon) {
  //var extrude = new THREE.ExtrudeGeometry( this.shapes[0], {
  //  bevelEnabled: false
  //} );

  //if (!this.mesh && this.name == 'zone') {
  //  extrude.faceVertexUvs = []
  //  debugger
  //  extrude.faces = extrude.faces.filter(function(face) {
  //    return !(face.normal.x == 0 && face.normal.y == 0)
  //  })
  //  //this.mesh = new THREE.Mesh(extrude)
  //  //scene.add(this.mesh)
  //}

  var height = 1;
  var j = polygon.length;
  var extrusion = [];
  var a = {x: 0, y: 0};
  var b = {x: 0, y: 0};
  var c = {x: 0, y: 0};
  var changeOrigin = new THREE.Matrix4()
  var changeOriginBack = new THREE.Matrix4()

  var position   = new THREE.Vector3;
  var quaternion = new THREE.Quaternion;
  var scale      = new THREE.Vector3;
  var v          = new THREE.Vector3;
  var euler      = new THREE.Euler;
 for (var i = 0; i < j; i++) {
   var f = polygon[(i || j) - 1];
   var t = polygon[i];
  //for (var i = 0; i < extrude.faces.length; i++) {
  //  var face = extrude.faces[i]
  //  var A = extrude.vertices[face.a];
  //  var B = extrude.vertices[face.b];
  //  var C = extrude.vertices[face.c];
  //  debugger
  //  var f = {x: B.x, y: B.y}
  //  var t = {x: A.x, y: A.y}
    a.x = 0;
    a.y = 0;
    b.x = (t.x - f.x);
    b.y = (t.y - f.y);
    c.x = 0;
    c.y = 0 + height;

    var distance = Math.sqrt(Math.pow(t.x - f.x, 2) + Math.pow(t.y - f.y, 2) );
    scale.set(distance, 1,100)
    quaternion.setFromEuler(
      euler.set(Math.PI / 2, Math.PI - (Math.atan2(t.y - f.y, t.x - f.x)), 0)
    )
    position.set(-f.x,f.y, 0)

    extrusion.push(new P.Overlay({
      isExtrusion: true,
      //area: this.area,
      zone: this,
      x: 0,
      y: 0.02,
      z: 0,
      //centerX: this.coordinates.y + this.height / 2,
      //centerY: 0,
      //centerZ: - (this.coordinates.x + this.width / 2),
      matrix: new THREE.Matrix4().compose(position, quaternion, scale)
    }))

    quaternion.setFromEuler(
      euler.set(Math.PI / 2, Math.PI - (Math.atan2(t.y - f.y, t.x - f.x)), Math.PI )
    )
    var m = new THREE.Matrix4().compose(position, quaternion, scale)
    changeOrigin.makeTranslation(-1,-1,0)
    m.multiply(changeOrigin)
    extrusion.push(new P.Overlay({
      isExtrusion: true,
      //area: this.area,
      zone: this,
      x: 0,
      y: 0.02,
      z: 0,
      //centerX: this.coordinates.y + this.height / 2,
      //centerY: 0,
      //centerZ: - (this.coordinates.x + this.width / 2),
      matrix: m,
      inverted: true
    }))

  }
  return extrusion
} 

P.geometry.intersectPolygon = function (point, vs, X, Y) {
  if (X == null)
    X = 'x';
  if (Y == null)
    Y = 'y';
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point.x, y = point.y;

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][X], yi = vs[i][Y];
      var xj = vs[j][X], yj = vs[j][Y];

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
};
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
P.geometry.triangleGeometry.faces.push( new THREE.Face3( 1,2,0 ) );
P.geometry.triangleGeometry.computeFaceNormals();
P.geometry.triangleGeometry.computeFlatVertexNormals();
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
  var m1 = P.geometry.matrices[0].set(
    a1.x - c1.x, 
    b1.x - c1.x, 
    0, 
    c1.x, 

    a1.y - c1.y, 
    b1.y - c1.y, 
    0, 
    c1.y, 

    a1.z - c1.z, 
    b1.z - c1.z, 
    1, 
    c1.z,

    0,0,0,1)
  var m2 = new THREE.Matrix4().set(
    a2.x - c2.x, 
    b2.x - c2.x, 
    0, 
    c2.x, 

    a2.y - c2.y, 
    b2.y - c2.y, 
    0, 
    c2.y, 

    a2.z - c2.z, 
    b2.z - c2.z, 
    1, 
    c2.z,

    0,0,0,1)

   m2.multiply(P.geometry.matrices[1].getInverse(m1))


   return m2
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
  var pathdata = 'M'+points[0].x+','+points[0].y
  for (var i = 1; i < points.length; i++)
    pathdata += ' L' + points[i].x + ',' + points[i].y
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

function triangleNormal(x0, y0, z0, x1, y1, z1, x2, y2, z2, output) {
  if (!output) output = []

  var p1x = x1 - x0
  var p1y = y1 - y0
  var p1z = z1 - z0

  var p2x = x2 - x0
  var p2y = y2 - y0
  var p2z = z2 - z0

  var p3x = p1y * p2z - p1z * p2y
  var p3y = p1z * p2x - p1x * p2z
  var p3z = p1x * p2y - p1y * p2x

  var mag = Math.sqrt(p3x * p3x + p3y * p3y + p3z * p3z)
  if (mag === 0) {
    output[0] = 0
    output[1] = 0
    output[2] = 0
  } else {
    output[0] = p3x / mag
    output[1] = p3y / mag
    output[2] = p3z / mag
  }

  return output
}

















/*
var vIndex = ['a','b', 'c', 'd'];
var startIndex, endIndex, count, indexCount, compareIndex01, compareIndex02, compareEdge;
var edgeAlreadyProcessed = false;

function _sortAdjacentFaces(adjacentFacesArray){
    for (var i = 0; i < adjacentFacesArray.length; i++){
        //console.log("VERTEX NUMBER: " , i, "\n")
        _sort(adjacentFacesArray[i], i);
    }
}

function _sort(facesPerVertex, vertexIndex){
    startIndex = vertexIndex;
    var edges = [];
    if(facesPerVertex!=undefined)
    for (var  i = 0; i < facesPerVertex.length; i++){

        facesPerVertex[edges.length].face instanceof THREE.Face4 ? count = 4 : count = 3;
        //find endIndex
        for (var j = 0; j < count; j++){
            if (facesPerVertex[edges.length].face[vIndex[j]] === startIndex){
                endIndex =   facesPerVertex[edges.length].face[vIndex[(j+1)%count]];
            }
        }
        //console.log("endIndex: ", endIndex);

        //if there aren't any edges in here yet, just push!
        if (edges.length < 1 ){
            edges.push( startIndex <= endIndex ?  {edge: [startIndex, endIndex] } : {edge: [endIndex, startIndex] } );
        }else{
            //else check if the edge is already in there! if it is, need to find new endIndex!
            for (var k = 0; k < edges.length; k++){
                if (! ((edges[k].edge[0]  === startIndex && edges[k].edge[1]=== endIndex) || (edges[k].edge[0]  === endIndex && edges[k].edge[1]=== startIndex )) )    {
                    edgeAlreadyProcessed = false;
                } else{
                    console.log("warning: edge already used");
                    //at this point, one would have to get a new endIndex!!!
                    edgeAlreadyProcessed = true;
                    break;
                }
            }
            if (!edgeAlreadyProcessed) {
                edges.push( startIndex <= endIndex ?  {edge: [startIndex, endIndex] } : {edge: [endIndex, startIndex] } );
            }
        }

        outerLoop:   for (j = edges.length; j < facesPerVertex.length; j++){
            //check if face is face3 or face4 and adjust loop-length appropriately
            facesPerVertex[j].face instanceof THREE.Face3 ? indexCount = 3: indexCount = 4;
            for ( k = 0; k < indexCount; k++){
                compareIndex01 =  facesPerVertex[j].face[vIndex[k]];
                compareIndex02 = facesPerVertex[j].face[vIndex[(k+1)%indexCount]];
                compareIndex01 <= compareIndex02 ? compareEdge = [compareIndex01, compareIndex02]  : compareEdge = [compareIndex02, compareIndex01];
                if (compareEdge[0] === edges[edges.length-1].edge[0] && compareEdge[1] === edges[edges.length-1].edge[1]){
                    //only swap if those 2 array elements do not follow each other in the array!
                    if ( j !== edges.length){
                        _swap(facesPerVertex, j, edges.length);
                        break outerLoop;
                    }
                }
            }
        }
    }
}

function _swap(array, index, startIndex ){
    // console.log("swap! ", index, startIndex)
    var temp = array[index];
    array[index] = array[startIndex];
    array[startIndex] = temp;
}

// calculates the average vector for one smoothing group by taking all non-normalized face normals (which are thereby area-weighted!) and just add them together.
//in the end, check if there are two smoothing groups that belong together, if so, add their vectors together and write them back on both averageVector attributes of the 2 smoothing groups
function _calculateVectorSumsForSmoothingGroups(connectedFaces, geometry){
    var smoothingGroupVectorSums = {};
    var smoothingGroup;

    for (var i = 0; i <connectedFaces.length; i++ ){
        //assign smoothing group ID by using only the first value of the array (in case it has more than 1 value)
        //in practice, as we where going "around the vertex", only the first/last face can have 2 smoothing groups
        smoothingGroup = connectedFaces[i].smoothingGroup[0];

        //if the groupID does not exist, use the newly calculated face normal as a start
        if ( !smoothingGroupVectorSums[smoothingGroup]){
            smoothingGroupVectorSums[smoothingGroup] = {averageVec: _calculateFaceNormal(connectedFaces[i].face, geometry)};

        }else{
            //check if groupID already used. if it is, instead of adding a new groupID entry, just add the un normalized face-normal
            smoothingGroupVectorSums[smoothingGroup].averageVec.add(_calculateFaceNormal(connectedFaces[i].face, geometry))
        }
    }

    //combine 2 smoothing groups if necessary
    if (connectedFaces[0].smoothingGroup.length === 2){

        var group1 = smoothingGroupVectorSums[connectedFaces[0].smoothingGroup[0]];
        var group2 = smoothingGroupVectorSums[connectedFaces[0].smoothingGroup[1]];

        var combinedVec = new THREE.Vector3().addVectors(group1.averageVec, group2.averageVec);

        //now both groups use the combined result
        group1.averageVec.copy(combinedVec);
        group2.averageVec.copy(combinedVec);
    }
    //console.log("sums: " ,smoothingGroupVectorSums)
    return smoothingGroupVectorSums;
}

function _calculateFaceNormal(face, geometry){
    //no normalization in this function as these are weighted normals
    var vA, vB, vC, vD;
    var cb = new THREE.Vector3(), ab = new THREE.Vector3(),
        db = new THREE.Vector3(), dc = new THREE.Vector3(), bc = new THREE.Vector3();

    if ( face instanceof THREE.Face3){
        vA = geometry.vertices[ face.a ];
        vB = geometry.vertices[ face.b ];
        vC = geometry.vertices[ face.c ];

        cb.subVectors( vC, vB );
        ab.subVectors( vA, vB );
        cb.cross( ab );
        return cb;
    }

    if (face instanceof  THREE.Face4){

        vA = geometry.vertices[ face.a ];
        vB = geometry.vertices[ face.b ];
        vC = geometry.vertices[ face.c ];
        vD = geometry.vertices[ face.d ];

        //triable abd
        db.subVectors( vD, vB );
        ab.subVectors( vA, vB );
        db.cross( ab );

        // triangle bcd
        dc.subVectors( vD, vC );
        bc.subVectors( vB, vC );
        dc.cross( bc );

        dc.add(db) ;
        return dc.multiplyScalar(0.5);
    }
}

THREE.calculateVertexNormals  = function(geometry, angle){
        //reset vertex normals to zero-vectors
        for (var i = 0; i < geometry.faces.length; i++){
            if (geometry.faces[i] instanceof  THREE.Face3){
                geometry.faces[i].vertexNormals.length = 0;
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() ) ;
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );

            } else if (geometry.faces[i] instanceof  THREE.Face4 ){
                geometry.faces[i].vertexNormals.length = 0;
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );
                geometry.faces[i].vertexNormals.push( new THREE.Vector3() );
            }
        }

        //save face index per vertex index
        var adjacentNormals = [];
        var vN;

        for (var v = 0; v < geometry.vertices.length; v++){
            for (var f = 0; f < geometry.faces.length; f++){
                //this is needed for correct indexing of the given vertex with its vertexNormal.
                if (geometry.faces[f].a === v){
                    vN =  geometry.faces[f].vertexNormals[0];
                }else if(geometry.faces[f].b === v){
                    vN =  geometry.faces[f].vertexNormals[1];
                }else if(geometry.faces[f].c === v){
                    vN =  geometry.faces[f].vertexNormals[2];
                }else  if(geometry.faces[f].d === v){
                    vN =  geometry.faces[f].vertexNormals[3];
                }else{
                    vN = null;
                }
                if (vN !== null){
                    adjacentNormals[v] = adjacentNormals[v] || [];
                    adjacentNormals[v].push({face: geometry.faces[f], vertexNormal: vN, smoothingGroup:  []});
                }
            }
        }
        // sort faces in "adjacentNormals' because the face-objects are not sorted in an adjacent way, meaning that when going around 1 vertex by iterating through those faces
        // one does not know if face[i] and face[i+1] are adjacent in the array.
        _sortAdjacentFaces(adjacentNormals);

        //recalculate vertex normals
        var adjacentFaceNormal01 = new THREE.Vector3();
        var adjacentFaceNormal02 = new THREE.Vector3();
        var dotProduct;
        var angleBetweenFacesRad;
        var smoothing;
        var smoothingGroupID = 0;

        var normal, smoothingGroup;


        for (v = 0; v < geometry.vertices.length; v++){
            //for all faces the vertex is connected to
      if(adjacentNormals[v]!=undefined)
            for (i = 0; i < adjacentNormals[v].length; i++){
                //compare two adjacent faces (i) and (i+19 that are connected by the specified vertex v
                adjacentFaceNormal01.copy(adjacentNormals[v][i].face.normal);
                adjacentFaceNormal02.copy(adjacentNormals[v][(i+1)%adjacentNormals[v].length].face.normal);
                //calculate the dot product of the two face normals
                dotProduct = adjacentNormals[v][i].face.normal.dot( adjacentFaceNormal02 );

                //now calculate the angle between those 2 faces using the dot Product and the face normal length/ norm of the vector
                //result is in radian measure
                angleBetweenFacesRad = Math.acos( dotProduct / ( adjacentFaceNormal01.length() * adjacentFaceNormal02.length() ));

                if (THREE.Math.radToDeg(angleBetweenFacesRad) <= angle){
                    //console.log("angle:", _radToDeg(angleBetweenFacesRad)  + "    " ,i, (i+1)%adjacentNormals[v].length);
                    smoothing = true;

                    //if there are any smoothing groups, one will have to check if the array already contains the to be added groupID
                    if (adjacentNormals[v][i].smoothingGroup.length > 0){
                        for (var k = 0; k < adjacentNormals[v][i].smoothingGroup.length; k++){
                            if ( adjacentNormals[v][i].smoothingGroup[k] !== smoothingGroupID) {
                                adjacentNormals[v][i].smoothingGroup.push( smoothingGroupID);
                                break;
                            }
                        }
                    } else{
                        //else , smoothing group is still empty so just push the ID in
                        adjacentNormals[v][i].smoothingGroup.push( smoothingGroupID);
                    }
                    //same for the next (i+1) face in the array...
                    if (adjacentNormals[v][(i+1)%adjacentNormals[v].length].smoothingGroup.length > 0){
                        for ( k = 0; k < adjacentNormals[v][(i+1)%adjacentNormals[v].length].smoothingGroup.length; k++){
                            if ( adjacentNormals[v][(i+1)%adjacentNormals[v].length].smoothingGroup[k] !== smoothingGroupID) {
                                adjacentNormals[v][(i+1)%adjacentNormals[v].length].smoothingGroup.push(smoothingGroupID);
                                break;
                            }
                        }
                    } else{
                        adjacentNormals[v][(i+1)%adjacentNormals[v].length].smoothingGroup.push(smoothingGroupID);
                    }
                } else{
                    //if the angle is larger than specified, there is a hard edge between the 2 checked faces and therefore, increment smoothing group ID
                    //and use the existing face normal as the vertex normal
                    smoothingGroupID++;
                    adjacentNormals[v][i].vertexNormal.add(adjacentNormals[v][i].face.normal);
                    adjacentNormals[v][(i+1)%adjacentNormals[v].length].vertexNormal.add(adjacentNormals[v][(i+1)%adjacentNormals[v].length].face.normal);
                }
            }
            // console.log("counttest ", countTest);
            // console.log(adjacentNormals[v])


            // average vertexNormals based on smoothingGroupIDs
            //only loop if anything got smoothed at all
            if (smoothing){
                var groupIDNormals = _calculateVectorSumsForSmoothingGroups(adjacentNormals[v], geometry);

                for (k = 0; k < adjacentNormals[v].length; k++){
                    normal = adjacentNormals[v][k];
                    smoothingGroup = normal.smoothingGroup[0];
                    if (smoothingGroup !== undefined){
                        var groupNormal = groupIDNormals[smoothingGroup];
                        normal.vertexNormal.copy( groupNormal.averageVec );
                    }
                }
            }

            // reset values per vertex.
            // this also means that smoothingGroupIDs are local to their vertex with its connected faces.
            smoothing = false;
            smoothingGroupID = 0;
        }


        // if everything is calculated, last but not least normalize all vertex normals to have unit- vectors
        for (i = 0; i < geometry.faces.length; i++){
            for (var j = 0; j < geometry.faces[i].vertexNormals.length; j++){
                geometry.faces[i].vertexNormals[j].normalize();
            }
        }
    }

*/
