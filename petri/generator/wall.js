Game.Struct.Wall = [
  function setWallType (type) {
    return type || 0
  },
  function setWallBuilding (building) {
    return building
  },
  function setWallAngle (angle, ex, ey, sx, sy) {
    return Math.atan2(ey - sy, ex - sx)
  },
  function setCapStart(capStart) {
    return capStart || 0;
  },
  function setCapEnd(capEnd) {
    return capEnd || 0;
  },
  function setWallWidth (width, type) {
    return 2;
  },
  function setWallX (x, sx, ex, capStart, capEnd, angle, width) {
    var cap = (capStart + capEnd) * width / 2
    return sx + (ex - sx) / 2// + Math.cos(angle) * cap
  },
  function setWallY (y, sy, ey, capStart, capEnd, angle, width) {
    var cap = (capStart + capEnd) * width / 2
    return sy + (ey - sy) / 2// + Math.sin(angle) * cap
  },
  function setWallSx (sx, x, angle, type, capStart, width) {
    if (type == 0)
      return sx + Math.cos(angle) * capStart * (width);
    var width = Game.Constructions[type].width;
    return x - Math.cos(angle) * width / 2
  },
  function setWallSy (sy, y, angle, type, capStart, width) {
    if (type == 0)
      return sy + Math.sin(angle) * capStart * (width);
    var width = Game.Constructions[type].width;
    return y - Math.sin(angle) * width / 2
  },
  function setWallEx (ex, x, angle, type, capEnd, width) {
    if (type == 0)
      return ex - Math.cos(angle) * capEnd * (width);
    var width = Game.Constructions[type].width;
    return x + Math.cos(angle) * width / 2
  },
  function setWallEy (ey, y, angle, type, capEnd, width) {
    if (type == 0)
      return ey - Math.sin(angle) * capEnd * (width);
    var width = Game.Constructions[type].width;
    return y + Math.sin(angle) * width / 2
  },
  function setWallFrom (from) {
    return from || 0
  },
  function setWallTo (to) {
    return to || 0
  },
  function setWallLength (length, sx, sy, ex, ey, capStart, capEnd, width) {
    return Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2), 2)// + (capStart + capEnd) * width
  },
  function setWallHeight (height, building) {
    return this.getBuildingHeight(building)
  },
  function computeWallPolygon(x, y, width, length, angle, number, building) {
    return this.computePolygonFromRotatedRectangle(x, y, length + 2, width + 2, angle)
  },
  function computeWallOuterPolygon(x, y, width, length, angle, number, building) {
    return this.computePolygonFromRotatedRectangle(x, y, length + 4, width + 38, angle)
  },
  function setWallCollision (collision, building, index, x, y) {
    var polygon0 = this.computeBuildingCleanPolygon(building)[0]
    var polygon1 = this.computeWallPolygon(index, true)
    var intersectedRooms = 0;
    var pt = {x: x, y: y}
    if (!intersectPolygon(pt, polygon0) &&
        distanceToPolygon(pt, polygon0) > 1)
      return 1;
    for (var i = 0; i < this.Room.count; i++) {
      if (this.getRoomBuilding(i) == building) {
        var polygon2 = this.computeRoomShrunkPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          intersectedRooms++;
        }
      }
    }
    if (intersectedRooms > 1)
      return intersectedRooms;

    for (var i = 0; i < this.Wall.count; i++) {
      if (this.getWallBuilding(i) == building) {
        var polygon2 = this.computeWallPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return 1;
        }
      }
    }
    return 0;
  }

]


Game.Generator.prototype.BuildingWallEntrance = function(building) {
  this.eachRoom(function(room) {
    if (this.getRoomBuilding(room) == building &&  this.getRoomNumber(room) == 0) {
      this.BuildingRoomWallDoor(building, room, -1)
    }
  })
}

Game.Generator.prototype.BuildingRoomWallWindows = function(building, room) {
  var polygon0 = this.computeBuildingCleanPolygon(building)[0];
  var polygon1 = this.computeRoomPolygon(room);
  if (this.getRoomNumber(room) == 0 && Math.random() > 0.5) {
    var points = equidistantPointsFromPolygon(polygon0, 35, true, null, 'x', 'y');
    var chance = 0.5;
    var type = 201;
  }
  else {
    var points = equidistantPointsFromPolygon(polygon0, 25, true, null, 'x', 'y');
    var chance = 0.3;
    var type = 200;
  }

  points.forEach(function(point, index) {
    var next = points[index + 1] || points[0];
    if (distanceToPolygon(point, polygon0) > 2
    || distanceToPolygon(next, polygon0) > 2) 
      return
    if (this.random() > 0.3)
      return; 
    if (distanceToPolygon(point, polygon1) < 5)
    this.Wall(this.Wall.count, building, point.x, point.y, next.x, next.y, type)
    if (!this.getWallCollision(this.Wall.count)) {
      this.Wall.count++
    }
  }, this)
}
Game.Generator.prototype.BuildingWalls = function(building) {
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
    edge.cap = pslg.caps[index]
    this.eachWall(function(wall) {
      if (this.getWallBuilding(wall) != building) return;
      if (this.getWallType(wall) < 100) return;
      var sx = this.getWallSx(wall)
      var sy = this.getWallSy(wall)
      var ex = this.getWallEx(wall)
      var ey = this.getWallEy(wall)
      if (Math.sqrt(Math.pow(sx - Sx, 2) + Math.pow(sy - Sy, 2), 2) < 3 &&
          Math.sqrt(Math.pow(ex - Ex, 2) + Math.pow(ey - Ey, 2), 2) < 3 ||
          Math.sqrt(Math.pow(ex - Sx, 2) + Math.pow(ey - Sy, 2), 2) < 3 &&
          Math.sqrt(Math.pow(sx - Ex, 2) + Math.pow(sy - Ey, 2), 2) < 3) {
            this.uncomputeWall(wall)
            this.Wall(wall, building, Sx, Sy, Ex, Ey, this.getWallType(wall), this.getWallFrom(wall), this.getWallTo(wall), edge.cap[0], edge.cap[1])
            hasWindow = true;
          }
    })
    return !hasWindow

  }, this)
  edges.forEach(function(edge, index) {
    var p1 = pslg.points[edge[0]];
    var p2 = pslg.points[edge[1]];
    this.Wall(this.Wall.count++, building, p1[0], p1[1], p2[0], p2[1], null, null, null, edge.cap[0], edge.cap[1])
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