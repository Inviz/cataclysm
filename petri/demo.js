

tree = rbush(4)


tree.roads = [];
tree.polygons = [];


/*
map.roads =[]
map.segments.forEach(function(wall) {
  var x1 = (wall.r.start.x - minX) * 1.2
  var y1 = (wall.r.start.y - minY) * 1.2
  var x2 = (wall.r.end.x - minX) * 1.2
  var y2 = (wall.r.end.y - minY) * 1.2
  map.roads.push([
    x1 + (x2 - x1) / 2,
    y1 + (y2 - y1) / 2,
    - wall.dir(),
    wall.width * zoom,
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2), 2),
    wall.links.f.length
  ])
})*/
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