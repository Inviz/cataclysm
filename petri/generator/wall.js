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
    return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2), 2)
  },
  function setWallAngle (angle, ex, ey, sx, sy) {
    return Math.atan2(ey - sy, ex - sx)
  },
  function setWallWidth (width, type) {
    return 2;
  },
  function computeWallPolygon(x, y, width, length, angle, number, building) {
    return this.computePolygonFromRotatedRectangle(x, y, length + 2, width + 2, angle)
  },
  function computeWallOuterPolygon(x, y, width, length, angle, number, building) {
    return this.computePolygonFromRotatedRectangle(x, y, length + 4, width + 38, angle)
  }

]


Game.Generator.prototype.BuildingWallEntrance = function(building) {
  this.eachRoom(function(room) {
    if (this.getRoomBuilding(room) == building &&  this.getRoomNumber(room) == 0) {
      this.BuildingRoomWallDoor(building, room, -1)
    }
  })
}

Game.Generator.prototype.BuildingWallWindows = function(building) {
  this.getBuildingCleanPolygon
  this.eachRoom(function(room) {
    if (this.getRoomBuilding(room) == building &&  this.getRoomNumber(room) == 0) {
      this.BuildingRoomWallDoor(building, room, -1)
    }
  })
}
Game.Generator.prototype.BuildingWall = function(building) {
  var shape = this.computeBuildingInternalShape(building)
  var pslg = this.computeBuildingInternalPSLG(building)
  var edges = pslg.edges.filter(function(edge, index) {
    var Sx = pslg.points[edge[0]][0]
    var Sy = pslg.points[edge[0]][1]
    var Ex = pslg.points[edge[1]][0]
    var Ey = pslg.points[edge[1]][1]
    var x = Sx + (Ex - Sx) / 2
    var y = Sy + (Ey - Sy) / 2
    var hasWindow = false;
    this.eachWall(function(wall) {
      if (this.getWallBuilding(wall) != building) return;
      if (this.getWallType(wall) != 100) return;
      var sx = this.getWallSx(wall)
      var sy = this.getWallSy(wall)
      var ex = this.getWallEx(wall)
      var ey = this.getWallEy(wall)
      if (Math.sqrt(Math.pow(sx - Sx, 2) + Math.pow(sy - Sy, 2), 2) < 3 &&
          Math.sqrt(Math.pow(ex - Ex, 2) + Math.pow(ey - Ey, 2), 2) < 3 ||
          Math.sqrt(Math.pow(ex - Sx, 2) + Math.pow(ey - Sy, 2), 2) < 3 &&
          Math.sqrt(Math.pow(sx - Ex, 2) + Math.pow(sy - Ey, 2), 2) < 3) {
            hasWindow = true;
          }
    })
    return !hasWindow

  }, this)
  edges.forEach(function(edge, index) {
    var p1 = pslg.points[edge[0]];
    var p2 = pslg.points[edge[1]];
    this.Wall(this.Wall.count++, building, p1[0], p1[1], p2[0], p2[1])
  }, this)
}
Game.Generator.prototype.BuildingRoomWallDoor = function(building, from, to) {
  if (from == null || to == null) {
    var rooms = [];
    this.eachRoom(function(room) {
      if (room != from && this.getRoomBuilding(room) == building) 
        rooms.push(room)
    });
    rooms.forEach(function(room, index) {
      if (from != null) {
        return this.BuildingRoomWallDoor(building, from, room)
      } else{
        if (this.getRoomNumber(room) != 100 && this.getRoomNumber(room)) {
          var theirCorridorDoor;
          var ourCorridorDoor
          this.eachWall(function(door) {
            if (this.getWallTo(door) == room && this.getRoomNumber(this.getWallFrom(door)) == 100)
              theirCorridorDoor = true;
            if (this.getWallTo(door) == this.getRoomOrigin(room) && this.getRoomNumber(this.getWallFrom(door)) == 100)
              ourCorridorDoor = true;
          })
          if (!theirCorridorDoor || !ourCorridorDoor)
            this.BuildingRoomWallDoor(building, room, this.getRoomOrigin(room))
        }
      }
    }, this)

  } else {

    var polygon1 = this.computeRoomShrunkPolygon(from, true);
    if (to != -1)
      var polygon2 = this.computeRoomShrunkPolygon(to, true);
    else
      var polygon2 = this.computeBuildingCleanPolygon(building)[0];
    var points = equidistantPointsFromPolygon(polygon1, 20, true, null, 'x', 'y')
    var placements = [];
    var minDistance = Infinity
    for (var p = 0; p < points.length; p++) {
      var p1 = points[p]
      var p2 = points[(p + 1) % points.length]
      var d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2), 2);

      if (d > 15)
      if (distanceToPolygon(p1, polygon2) < 0.3 &&
          (distanceToPolygon(p2, polygon2) < 0.3)) {

        // put entrance as close to anchor point as possible
        if (to == -1) {
          var distance = Math.sqrt(Math.pow(p1.x - this.getBuildingAnchorX(building), 2) + Math.pow(p1.y - this.getBuildingAnchorY(building), 2), 2)
          if (minDistance > distance) {
            minDistance = distance;
            placements.length = 0;
          } else {
            continue;
          }
        }
        placements.push([p1, p2])
        //this.BuildingWall(building)
      }
    }
    if (placements.length) {
      var placement = placements[Math.floor(this.random() * placements.length)]
      //placements.forEach(function(placement) {
      this.Wall(this.Wall.count++, building, placement[0].x, placement[0].y, placement[1].x, placement[1].y, 100, from, to)

      //}, this)
    } else {
    //  console.error('couldnt find place for door between', from, 'and', to)
    }
    return
  }
}