var map = City();

tree = rbush(4)

var minX =  Infinity
var maxX = -Infinity
var minY =  Infinity
var maxY = -Infinity


tree.roads = [];
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
map.buildings.forEach(function(building) {
  for (var i = 0; i < 4; i++) {
    var pX = building.corners[i].x
    var pY = building.corners[i].y
    if (pX > maxX) maxX = pX;
    if (pX < minX) minX = pX;
    if (pY > maxY) maxY = pY;
    if (pY < minY) minY = pY;
  }
})

var width = maxX - minX
var height = maxY - minY
if (width > height) {
  height = 1500 * (height / width)
  width = 1500
} else {
  width = 1500 * (width / height)
  height = 1500
}
var zoom = 1500 / (maxX - minX)
console.info(width, 'x', height)

map.segments.forEach(function(wall) {
  tree.roads.push([
    {x: Math.floor((wall.r.start.x - minX) * zoom), 
      y: Math.floor((wall.r.start.y - minY) * zoom)},
    {x: Math.floor((wall.r.end.x - minX) * zoom), 
      y: Math.floor((wall.r.end.y - minY) * zoom)},
    wall
  ])
})
map.buildings.forEach(function(building, index) {
  
  var minXB =  Infinity
  var maxXB = -Infinity
  var minYB =  Infinity
  var maxYB = -Infinity

  for (var i = 0; i < 4; i++) {
    var pX = building.corners[i].x
    var pY = building.corners[i].y
    if (pX > maxXB) maxXB = pX;
    if (pX < minXB) minXB = pX;
    if (pY > maxYB) maxYB = pY;
    if (pY < minYB) minYB = pY;
  }
  building.index = index
  var node = {
    building: building,
    minX: Math.floor((minXB - minX) * zoom), 
    minY: Math.floor((minYB - minY) * zoom),
    maxX: Math.floor((maxXB - minX) * zoom), 
    maxY: Math.floor((maxYB - minY) * zoom)
  }
  node.polygon = building.polygon = building.corners.map(function(corner) {
    return {
      x: Math.floor((corner.x - minX) * zoom),
      y: Math.floor((corner.y - minY) * zoom),
      box: node
    }
  })
  tree.insert(node)
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

tree.compute()

tree.somePaths = []
tree.someFails = []
tree.someDots = []

  tree.levels[1].forEach(function(node) {

    node.points.forEach(function(p1, i1) {
      var detached = true;
        var xyi = p1.x + p1.y * 10000;
      node.points.forEach(function(p2, i2) {
        var xyj = p2.x + p2.y * 10000;
        if (xyi == xyj) return;

        var a = Math.min(xyi, xyj) + Math.max(xyi, xyj) * 100000000 
        if (tree.connections[a])
          detached = false;
      })
      if (detached) {
        tree.someDots.push(xyi)

      }
    })
  })

//var points = Object.keys(tree.coordinates)
//for (var i = 0; i < 30; i++) {
//  var from = points[Math.floor(Math.random() * points.length)];
//  var to = points[Math.floor(Math.random() * points.length)]
//  var path = tree.getPath(from, to)
//  if (path.length > 2) {
//    tree.somePaths.push(path)
//  } else {
//    tree.someFails.push([from, to])
//  }
//}

var c = 0;
var points = Object.keys(tree.coordinates)
for (var hash in tree.districtNetwork) {
  if (c++ > 9) break

  var from = points[Math.floor(Math.random() * points.length)];
  var to = points[Math.floor(Math.random() * points.length)]
  if (c != 8) continue

  var A = tree.coordinates[from]
  var from = A.box.parent.districtHub
  var B = tree.coordinates[to]
  var to = B.box.parent.districtHub

  var path = tree.getPath(from, to)
  if (path.length >= 2 && path[path.length - 1] == to) {
    tree.somePaths.push(path)
  } else {
    tree.someFails.push([from, to])
  }
}
for (var i = 0; i < 30; i++) {

}

console.info(Object.keys(tree.globalDistances).length, 'connections')
