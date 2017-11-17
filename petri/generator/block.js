Game.Struct.Block = [
  function setLoop (loop) {
    return loop;
  },
  function setRoad (road) {
    return road;
  },
  function setRoad (road) {
    return road;
  },
  function setAngle(angle, loop, road) {
    if (!loop)
      return road.angle;
    return angle;
  },
  function setWidth(width, loop, context, index) {
    if (loop)
      width = context.computeBlockPolygonCenter(index).width;
    else if (context.random() > 0.8)
      return 2000 + (context.random() * 3000)
    else
      return 4000 + (context.random() * 3000)
    return width;
  },
  function setHeight(height, loop, context, index) {
    if (loop)
      height = context.computeBlockPolygonCenter(index).height;
    else if (context.random() > 0.8)
      return 3000
    else 
      return 4000
    return height;
  },
  function setShift(shift, context) {
    return Math.floor(context.random() * 4) - 2;
  },
  function setSide(side, shift, context) {
    if (shift == 1)
      return 0
    return Math.floor(context.random() * 3) - 1;
  },
  function setX(x, road, loop, angle, width, height, context, index, shift, side) {
    if (loop)
      x = context.computeBlockPolygonCenter(index).x;
    else {
      x = road.ex + Math.cos(angle) * shift * width / 2
                 + Math.cos(angle - Math.PI / 2) * side * (height / 2)
    }
    return x ;
  },
  function setY(y, road, loop, angle, width, height, context, index, shift, side) {
    if (loop)
      y = context.computeBlockPolygonCenter(index).y;
    else {
      y = road.ey + Math.sin(angle) * shift * width / 2
                 + Math.sin(angle - Math.PI / 2) * side * (height / 2) 
    }
    return y;
  },

  function setCollision (collision, road, index, loop, context) {
    if (loop)
      return 0;
    // collide previously generated blocks
    var polygon1 = context.recomputeBlockPolygon(index)
    for (var i = 0; i < index; i++) {
      if (!context.getBlockCollision(i)) {
        var polygon2 = context.computeBlockPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    var prev = context.getRoadPrevious(road)
    for (var i = 0; i < context.Road.count; i++) {
      if (road == i || prev == i) continue;
      var polygon2 = context.computeRoadPolygon(i)
      if (doPolygonsIntersect(polygon1, polygon2)) {
        return i + 1;
      }
    }
    return 0;
  },

  function computePolygon(index, loop, context, x, y, width, height, angle) {
    if (loop)
      return context.Road.network[loop];
    else {
      var rectangle = context.computePolygonFromRotatedRectangle(x, y, width, height, angle)
      return rectangle
      //return context.computePolygonBinary([rectangle], context.Road.network, ClipperLib.ClipType.ctDifference)[0]
    }
  },

  function computePolygonCenter(index, context) {
    return polygonCenter(context.computeBlockPolygon(index))
  },

  function computeClippedPolygon(index, context) {
    return context.computePolygonBinary([rectangle], context.Road.network, ClipperLib.ClipType.ctDifference)[0]
  },

  function computeInnerPolygon(index, context) {
    return context.computePolygonOffset([context.computeBlockPolygon(index)], -200, 100, 0);
  }
]

Game.Generator.prototype.CityBlock = function(city) {
  var block = 0; 
  for (var i = 1; i < this.Road.network.length; i++) {
    this.Block(block++, null, i)
  }
  roads: for (var road = 0; road < this.Road.count; road ++) {
    if (this.getRoadConnectivity(road))
      var attempts = 3;
    else
      var attempts = 25;
    for (var attempt = 0; attempt < attempts; attempt++) {
        this.Block(block, road)
        if (!this.getBlockCollision(block)) {
          block++
          break
        }
    }
  }
  this.Block.count = block;
}