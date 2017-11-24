Game.Struct.Wall = [
  function setType (type) {
    return type
  },
  function setBuilding (building) {
    return building
  },
  function setSx (sx) {
    return sx
  },
  function setSy (sy) {
    return sy
  },
  function setEx (ex) {
    return ex
  },
  function setEy (ey) {
    return ey
  },
  function setX (x, sx, ex) {
    return sx + (ex - sx) / 2
  },
  function setY (y, sy, ey) {
    return sy + (ey - sy) / 2
  },
  function setLength (length, sx, sy, ex, ey) {
    return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2), 2)
  },
  function setAngle (angle, ex, ey, sx, sy) {
    return Math.atan2(ey - sy, ex - sx)
  },
  function setWidth (width, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_WIDTH : context.DEFAULT_SEGMENT_WIDTH;
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