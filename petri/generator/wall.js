Game.Struct.Wall = [
  function setWallType (type) {
    return type
  },
  function setWallBuilding (building) {
    return building
  },
  function setWallSx (sx) {
    return sx
  },
  function setWallSy (sy) {
    return sy
  },
  function setWallEx (ex) {
    return ex
  },
  function setWallEy (ey) {
    return ey
  },
  function setWallX (x, sx, ex) {
    return sx + (ex - sx) / 2
  },
  function setWallY (y, sy, ey) {
    return sy + (ey - sy) / 2
  },
  function setWallLength (length, sx, sy, ex, ey) {
    return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2), 2)
  },
  function setWallAngle (angle, ex, ey, sx, sy) {
    return Math.atan2(ey - sy, ex - sx)
  },
  function setWallWidth (width, type) {
    return 10;
  }

]


Game.Generator.prototype.BuildingWall = function(building) {
  var pslg = this.computeBuildingPSLG(building)
  pslg.edges.forEach(function(edge, index) {
    var p1 = pslg.points[edge[0]];
    var p2 = pslg.points[edge[1]];
    this.Wall(this.Wall.count++, building, p1[0], p1[1], p2[0], p2[1])
  }, this)
}