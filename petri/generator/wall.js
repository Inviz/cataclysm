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
  var shape = this.computeBuildingInternalShape(building)
  var pslg = this.computeBuildingInternalPSLG(building)
  pslg.edges.forEach(function(edge, index) {
    var p1 = pslg.points[edge[0]];
    var p2 = pslg.points[edge[1]];
    this.Wall(this.Wall.count++, building, p1[0], p1[1], p2[0], p2[1])
  }, this)
}
Game.Generator.prototype.BuildingWallDoor = function(building, from, to) {
  if (from == null || to == null) {
    var rooms = [];
    this.eachRoom(function(room) {
      if (this.getRoomBuilding(room) != building) 
        return;
      rooms.push(room)
    });
    rooms.forEach(function(room, index) {
      if (from != null) {
        return this.BuildingWallDoor(building, from, room)
      } else {
        for (var i = 0; i < index; i++)
          this.BuildingWallDoor(building, room, rooms[i])
      }
    })
  } else {
    var polygon1 = this.computeRoomShrunkPolygon(from);
    var polygon2 = this.computeRoomShrunkPolygon(to);
    var points = equidistantPointsFromPolygon(polygon1, 20, true, null, 'x', 'y')
    for (var p = 0; p < points.length; p++) {
      var p1 = points[p]
      var p2 = points[(p + 1) % points.length]
      var d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 2);
      if (d > 17)
      if (distanceToPolygon(p1, loops[l]) < 2 &&
          distanceToPolygon(p2, loops[l]) < 2) {
        debugger
        //this.BuildingWall(building)
      }
    }
    return
  }
}