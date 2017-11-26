Game.Struct.Block = [
  function setBlockLoop (loop) {
    return loop;
  },
  function setBlockRoad (road) {
    return road;
  },
  function setBlockRoad (road) {
    return road;
  },
  function setBlockAngle(angle, loop, road) {
    if (!loop)
      return road.angle;
    return angle;
  },
  function setBlockWidth(width, loop, index) {
    if (loop)
      width = this.computeBlockPolygonCenter(index).width;
    else if (this.random() > 0.8)
      return 500 + (this.random() * 300)
    else
      return 600 + (this.random() * 300)
    return width;
  },
  function setBlockHeight(height, loop, index) {
    if (loop)
      height = this.computeBlockPolygonCenter(index).height;
    else if (this.random() > 0.8)
      return 500
    else 
      return 600
    return height;
  },
  function setBlockShift(shift) {
    return - Math.floor(this.random() * 2);
  },
  function setBlockSide(side, shift) {
    if (shift == 0)
      return 0
    return Math.floor(this.random() * 3) - 1;
  },
  function setBlockX(x, road, loop, angle, width, height, index, shift, side) {
    if (loop)
      x = this.computeBlockPolygonCenter(index).x;
    else {
      x = road.ex + Math.cos(angle) * shift * width / 2
                 + Math.cos(angle - Math.PI / 2) * side * (height / 2)
    }
    return x ;
  },
  function setBlockY(y, road, loop, angle, width, height, index, shift, side) {
    if (loop)
      y = this.computeBlockPolygonCenter(index).y;
    else {
      y = road.ey + Math.sin(angle) * shift * width / 2
                 + Math.sin(angle - Math.PI / 2) * side * (height / 2) 
    }
    return y;
  },

  function setBlockCollision (collision, road, index, loop) {
    if (loop)
      return 0;
    // collide previously generated blocks
    var polygon1 = this.computeBlockPolygon(index, true)
    for (var i = 0; i < index; i++) {
      if (!this.getBlockCollision(i) && !this.getBlockLoop(i)) {
        var polygon2 = this.computeBlockPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    var prev = this.getRoadPrevious(road)
    var box = this.computeBlockPolygonBox(index, true)
    var roads = this.Road.rtree.search(box);
    for (var r = 0; r < roads.length; r++) {
      var i = roads[r].index
      if (road == i || prev == i) continue;
      var polygon2 = this.computeRoadPolygon(i)
      if (doPolygonsIntersect(polygon1, polygon2)) {
        return i + 1;
      }
    }
    return 0;
  },

  function computeBlockPolygon(index, loop, x, y, width, height, angle) {
    if (loop)
      return this.Road.network[loop];
    else {
      var rectangle = this.computePolygonFromRotatedRectangle(x, y, width, height, angle)
      return rectangle
      //return this.computePolygonBinary([rectangle], this.Road.network, ClipperLib.ClipType.ctDifference)[0]
    }
  },

  function computeBlockPolygonBox(index) {
    return this.computePolygonBox(this.computeBlockPolygon(index), index)
  },

  function computeBlockPolygonCenter(index) {
    return polygonCenter(this.computeBlockPolygon(index))
  },

  function computeBlockClippedPolygon(index) {
    return this.computePolygonBinary([rectangle], this.Road.network, ClipperLib.ClipType.ctDifference)[0]
  },

  function computeBlockInnerPolygon(index) {
    return this.computePolygonOffset([this.computeBlockPolygon(index)], -20, 10, 0);
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