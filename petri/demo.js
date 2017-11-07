
var map = City();

tree = rbush(4)

var minX =  Infinity
var maxX = -Infinity
var minY =  Infinity
var maxY = -Infinity


tree.roads = [];
tree.polygons = [];
map.segments.forEach(function(wall) {
  var pX = wall.r.start.x
  var pY = wall.r.start.y
  if (pX > maxX) maxX = pX;
  if (pX < minX) minX = pX;
  if (pY > maxY) maxY = pY;
  if (pY < minY) minY = pY;
  var pX = wall.r.end.x
  var pY = wall.r.end.y
  if (pX > maxX) maxX = pX;
  if (pX < minX) minX = pX;
  if (pY > maxY) maxY = pY;
  if (pY < minY) minY = pY;

})
/*
map.buildings.forEach(function(building) {
  for (var i = 0; i < 4; i++) {
    var pX = building.corners[i].x
    var pY = building.corners[i].y
    if (pX > maxX) maxX = pX;
    if (pX < minX) minX = pX;
    if (pY > maxY) maxY = pY;
    if (pY < minY) minY = pY;
  }
})*/

var width = maxX - minX
var height = maxY - minY
if (width > height) {
  height = 1500 * (height / width)
  width = 1500
} else {
  width = 1500 * (width / height)
  height = 1500
}
var zoom = 3200 / (maxX - minX)
console.info(width, 'x', height)


map.roads =[]
map.segments.forEach(function(wall) {
  var x1 = wall.r.start.x - minX
  var y1 = wall.r.start.y - minY
  var x2 = wall.r.end.x - minX
  var y2 = wall.r.end.y - minY
  map.roads.push([
    x1 + (x2 - x1) / 2,
    y1 + (y2 - y1) / 2,
    - wall.dir(),
    wall.width * zoom,
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2), 2),
    wall.links.f.length
  ])
})
/*
map.buildings.forEach(function(building, index) {
  
  var minXB =  Infinity
  var maxXB = -Infinity
  var minYB =  Infinity
  var maxYB = -Infinity

  var corners = building.generateCorners()
  for (var i = 0; i < 4; i++) {
    var pX = corners[i].x
    var pY = corners[i].y
    if (pX > maxXB) maxXB = pX;
    if (pX < minXB) minXB = pX;
    if (pY > maxYB) maxYB = pY;
    if (pY < minYB) minYB = pY;
  }
  building.index = index
  var node = {
    building: building,
    minX: (minXB - minX) * zoom, 
    minY: (minYB - minY) * zoom,
    maxX: (maxXB - minX) * zoom, 
    maxY: (maxYB - minY) * zoom
  }

  var coordinates = [];
  node.points = building.points = corners.map(function(corner) {
    var point = {
      type: 'Feature',
      properties: {
        box: node
      },
      geometry: {
        type: 'Point',
        coordinates: [
          Math.floor((corner.x - minX) * zoom), 
          Math.floor((corner.y - minY) * zoom)
        ]
      }
    }
    point.x = point.geometry.coordinates[0]
    point.y = point.geometry.coordinates[1]
    point.box = node;
    coordinates.push([point.x, point.y])
    return point
  })

  coordinates.push(coordinates[0])
  var polygons = {
    type: 'Feature',
    properties: {
      box: node,
      building: building
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  }
  tree.polygons.push(polygons)
  tree.insert(node)

  //building.diagonal -= 10;
  //building.corners = building.generateCorners()
})

tree._leaves = function (node, result, height) {
    var nodesToSearch = [];
    while (node) {
      if (node.height == height) {
        if (!node.clone)
          result.push(node);
      }
      else nodesToSearch.push.apply(nodesToSearch, node.children);

      node = nodesToSearch.pop();
    }
    return result;
}
*/