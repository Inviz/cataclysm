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
  function setWallFrom (from) {
    return from || 0
  },
  function setWallTo (to) {
    return to || 0
  },
  function setWallLength (length, sx, sy, ex, ey) {
    if (Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2), 2) < 0.02)
      debugger
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
  var edges = pslg.edges.filter(function(edge, index) {
    var Sx = pslg.points[edge[0]][0]
    var Sy = pslg.points[edge[0]][1]
    var Ex = pslg.points[edge[1]][0]
    var Ey = pslg.points[edge[1]][1]
    var hasWindow = false;
    this.eachWall(function(wall) {
      if (this.getWallBuilding(wall) != building) return;
      if (this.getWallType(wall) != 100) return;
      var sx = this.getWallSx(wall)
      var sy = this.getWallSy(wall)
      var ex = this.getWallEx(wall)
      var ey = this.getWallEy(wall)
      debugger
      if (Math.sqrt(Math.pow(sx - Sx, 2) + Math.pow(sy - Sy, 2), 2) < 1 &&
          Math.sqrt(Math.pow(ex - Ex, 2) + Math.pow(ey - Ey, 2), 2) < 1 ||
          Math.sqrt(Math.pow(ex - Sx, 2) + Math.pow(ey - Sy, 2), 2) < 1 &&
          Math.sqrt(Math.pow(sx - Ex, 2) + Math.pow(sy - Ey, 2), 2) < 1) {
            hasWindow = true;
          }
    })
    return !hasWindow

  }, this)
  console.log(edges.length, pslg.edges.length)
  edges.forEach(function(edge, index) {
    var p1 = pslg.points[edge[0]];
    var p2 = pslg.points[edge[1]];
    this.Wall(this.Wall.count++, building, p1[0], p1[1], p2[0], p2[1])
  }, this)
}
Game.Generator.prototype.BuildingWallDoor = function(building, from, to) {
  if (from == null || to == null) {
    var rooms = [];
    this.eachRoom(function(room) {
      if (room != from && this.getRoomBuilding(room) == building) 
        rooms.push(room)
    });
    rooms.forEach(function(room, index) {
      if (from != null) {
        return this.BuildingWallDoor(building, from, room)
      } else{
        if (this.getRoomNumber(room) != 100 && this.getRoomNumber(room)) {
          var theirCorridorDoor;
          var ourCorridorDoor
          this.eachWall(function(door) {
            if (this.getWallTo(door) == from && this.getRoomNumber(this.getWallFrom(door)) == 100)
              theirCorridorDoor = true;
            if (this.getWallTo(door) == to && this.getRoomNumber(this.getWallFrom(door)) == 100)
              ourCorridorDoor = true;
          })
          if (!theirCorridorDoor || !ourCorridorDoor)
            this.BuildingWallDoor(building, room, this.getRoomOrigin(room))
        }
      }
    }, this)

  } else {

    var polygon1 = this.computeRoomShrunkPolygon(from, true);
    var polygon2 = this.computeRoomShrunkPolygon(to, true);
    var points = equidistantPointsFromPolygon(polygon1, 20, true, null, 'x', 'y')
    var placements = [];
    for (var p = 0; p < points.length; p++) {
      var p1 = points[p]
      var p2 = points[(p + 1) % points.length]
      var d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 2);

      if (d > 15)
      if (distanceToPolygon(p1, polygon2) < 2 &&
          distanceToPolygon(p2, polygon2) < 2) {
        placements.push([p1, p2])
        //this.BuildingWall(building)
      }
    }
    if (placements.length) {
      var placement = placements[Math.floor(this.random() * placements.length)]
      //placements.forEach(function(placement) {
        debugger
      this.Wall(this.Wall.count++, building, placement[0].x, placement[0].y, placement[1].x, placement[1].y, 100, from, to)

      //}, this)
    } else {
    //  console.error('couldnt find place for door between', from, 'and', to)
    }
    return
  }
}