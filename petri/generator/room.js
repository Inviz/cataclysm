Game.Struct.Room = [
  function setRoomNumber (number) {
    return number;
  },
  function setRoomOrigin (origin, number) {
    return origin || 0;
  },
  function setRoomAngle (angle, building) {
    return building.angle;
  },
  function setRoomOrientation (orientation) {
    return this.random() > 0.5 ? 1 : -1
  },
  function setRoomPlacement (placement) {
    return this.random() > 0.5 ? 1 : 0
  },
  function setRoomOffset (offset, number) {
    if (number == 0 || this.random() > 0.3)
      return 0
    return Math.floor(this.random() * 2) / 2
  },
  function setRoomWidth (width, number, building, placement) {
    if (width != null)
      return width;
    if (number == 0 || !placement)
      return building.width;
    else
      return building.width * (3 + Math.floor(this.random() * 3)) / 3
    return width;
  },
  function setRoomHeight (height, number, building, placement) {
    if (height != null)
      return height;
    if (number == 0 || placement)
      return building.length;
    else
      return building.length * (3 + Math.floor(this.random() * 3)) / 3
    return height;
  },
  function setRoomX (x, number, building, origin, angle, orientation, placement, width, height, offset) {
    if (x != null)
      return x;
    if (number == 0)
      return building.x;
    x = origin.x

    if (placement) {
      var distance = (origin.width + width) / 2;
      var offsetDistance = offset * origin.height
    } else {
      angle += Math.PI / 2;
      var distance = (origin.height + height) / 2;
      var offsetDistance = offset * origin.width
    }

    var angleShift = Math.cos(angle) * (distance + .00000001);
    var offsetShift = Math.cos((angle - Math.PI / 2)) * (offsetDistance);
    return x + (angleShift) * orientation + offsetShift
    //if (number == 0)
  },
  function setRoomY (y, number, building, origin, angle, orientation, placement, width, height, offset) {
    if (y != null)
      return y;
    if (number == 0)
      return building.y;
    y = origin.y

    if (placement) {
      var distance = (origin.width + width) / 2;
      var offsetDistance = offset * origin.height
    } else {
      angle += Math.PI / 2;
      var distance = (origin.height + height) / 2;
      var offsetDistance = offset * origin.width
    }

    var angleShift = Math.sin(angle) * (distance + .000000000001);
    var offsetShift = Math.sin((angle - Math.PI / 2)) * (offsetDistance);
    return y + (angleShift) * orientation + offsetShift
  },
  function setRoomBuilding (building) {
    return building;
  },
  function setRoomDistance (distance, x, y, building) {
    return Math.sqrt(Math.pow(x - building.x, 2) + Math.pow(y - building.y, 2), 2);
  },
  function computeRoomPolygon(x, y, width, height, angle, number, building) {
    if (number === 100) {// corridor
      return this.computeBuildingCorridorPolygon(building);
    } else {
      return this.computePolygonFromRotatedRectangle(x, y, width, height, angle)
    }
  },
  function computeRoomShrunkPolygon(index, building, number) {
    var corridor = this.computeBuildingCorridorPolygon(building);
    var polygon = this.computeRoomPolygon(index, true);
    if (corridor && number !== 100) {
      var diff = this.computePolygonBinary([polygon], [corridor], ClipperLib.ClipType.ctDifference);
      diff = this.computePolygonOffset(diff, -1, 1, 2)
      return this.computePolygonSimplification(diff)[0]
    } else {
      return polygon
    }
  },
  function computeRoomAnchorPoints(index) {
    return this.computeAnchorPoints(this.computeRoomShrunkPolygon(index), 1.2, 1.2, null, null, 10, 10)
  },
  function computeRoomSpinePoints(index) {
    return this.computeSpinePoints(this.computeRoomShrunkPolygon(index))
  },
  function computeRoomPoints(index) {
    var points = this.computeRoomAnchorPoints(index);
    this.computeRoomSpinePoints(index);
    return this.computePoints(points)
  },
  function computeRoomPolygonBox(index) {
    return this.computePolygonBox(this.computeRoomPolygon(index), index)
  },
  function setRoomCollision (collision, x, y, width, height, building, index, number) {
    if (collision != null)
      return collision
    // collide previously generated buildings
    var polygon1 = this.computeRoomPolygon(index, true)
    var box = this.computeRoomPolygonBox(index)
    for (var i = 0; i < this.Room.count; i++) {
      if (!this.getRoomCollision(i) && this.getRoomBuilding(i) === building) {
        var polygon2 = this.computeRoomPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
        // dont allow rooms to be too close to each other
        var distance = distanceBetweenPolygons(polygon1, polygon2);
        if (distance > 1 && distance < 30)
          return i + 1;
      }
    }
    var buildings = this.Building.rtree.search(box);
    for (var b = 0; b < buildings.length; b++) {
      if (doPolygonsIntersect(polygon1, buildings[b].polygon)) {
        return b + 1
      }
    }
    var roads = this.Road.rtree.search(box);
    for (var r = 0; r < roads.length; r++) {
      if (doPolygonsIntersect(polygon1, roads[r].polygon)) {
        return roads[r].index + 1;
      }
    }
    return 0
  },
]

Game.Generator.prototype.BuildingRoomZones = function(building, callback) {
  var min = 1;
  var max = this.random() > 0.6 ? 5 : 4;
  var rooms = max - min//Math.floor(Math.random() * (max - min) + min)
  var first = this.Room.count;
  var candidate = 9999;
  placement: for (var i = 0; i < rooms; i++) {
    var minDistance = Infinity;
    for (var attempt = 0; attempt < 5; attempt++) {
      this.Room(candidate, building, i * 10, first + Math.floor(this.random() * (i)))
      if (!this.getRoomCollision(candidate)) {
        var distance = this.getRoomDistance(candidate);
        if (distance < minDistance) {
          minDistance = distance;
          this.moveRoom(candidate, this.Room.count);
          continue
        }
      }
      this.uncomputeRoom(candidate)
    }
    
    if (isFinite(minDistance)) {
      if (callback)
        callback.call(this, building, this.Room.count)
      this.Room.count++
    }
  }
}


Game.Generator.prototype.BuildingCorridorRoom = function(building, callback) {
  var corridor = this.computeBuildingCorridorPolygon(building);
  if (corridor) {
    this.eachRoom(function(room) {
      if (this.getRoomBuilding(room) != building|| this.getRoomNumber(room) != 0) return;
      var count = this.Room.count++;
      this.Room(count, building, 100, room, 0)
      if (callback)
        callback.call(this, building, count)
      count++
    })
  }
}

Game.Generator.prototype.BuildingRooms = function(building, callback) {
  var rooms = [];
  var max;
  this.eachRoom(function(room) {
    if (this.getRoomBuilding(room) != building || this.getRoomNumber(room) == 100) return
    if (this.getRoomNumber(room) > max || max == null)
      max = this.getRoomNumber(room);
    rooms.push(room)
  })
  rooms.forEach(function(room) {
    this.BuildingDividedRoomPair(building, room, max, callback)
  }, this)
  this.computeBuildingShape(building, true)
  this.computeBuildingPSLG(building, true)
}


Game.Generator.prototype.BuildingDividedRoomPair = function(building, room, rooms, callback) {
  var ratios = [0.5, 2 / 3, 1.5 / 1, 1, 1, 1 / 1.5, 3 / 2, 2]
  var x = this.getRoomX(room);
  var y = this.getRoomY(room);
  var width = this.getRoomWidth(room);
  var height = this.getRoomHeight(room);
  var angle = this.getRoomAngle(room);
    var ratio = ratios[Math.floor(this.random() * ratios.length)];
  var number = this.getRoomNumber(room);
  if (number == 0) {
    var minSize = 60;
    if (this.random() > 0.5 && rooms.length > 1)
      return
  } else {
    var minSize = 40;
  }
  var candidate1 = 9998
  var candidate2 = 9999;
  attempts: for (var attempt = 0; attempt < 50; attempt++) {
    this.uncomputeRoom(candidate1)
    this.uncomputeRoom(candidate2)
    if (width / height > 0.9 && width / height < 1.1 ? this.random() > 0.5 : (this.getRoomPlacement(room) ? this.random() > 0.25 : this.random() > 0.75)) {
      var a = width / (ratio + 1);
      var b = a * ratio;
      this.Room(candidate1, building, number, this.getRoomNumber(origin), 0, 
        x - Math.cos(angle) * (a - width) / 2, 
        y - Math.sin(angle) * (a - width) / 2, 
        a, height)
      this.Room(candidate2, building, number + 1, room, 0, 
        x + Math.cos(angle) * (b - width) / 2, 
        y + Math.sin(angle) * (b - width) / 2,
        b, height)
    } else {
      var a = height / (ratio + 1);
      var b = a * ratio;
      this.Room(candidate1, building, number, this.getRoomNumber(origin), 0, 
        x - Math.cos(angle + Math.PI / 2) * (a - height) / 2, 
        y - Math.sin(angle + Math.PI / 2) * (a - height) / 2, 
        width, a)
      this.Room(candidate2, building, number + 1, number, 0, 
        x + Math.cos(angle + Math.PI / 2) * (b - height) / 2, 
        y + Math.sin(angle + Math.PI / 2) * (b - height) / 2,
        width, b)
    }
    // ensure at least 40 units of width 
    var doors = []
    var entrance;
    this.eachWall(function(wall) {
      if (this.getWallType(wall) != 100)
        return;

      if ((this.getWallTo(wall) == room || this.getWallFrom(wall) == room)) {
        doors.push(wall)
      }
      if (this.getWallTo(wall) == room) {
        entrance = wall;
      }
    })
    if (this.computePolygonOffset([this.computeRoomShrunkPolygon(candidate1)], 0, -minSize / 2, 2).length == 1
    && this.computePolygonOffset([this.computeRoomShrunkPolygon(candidate2)], 0, -minSize / 2, 2).length == 1) {
      for (var d = 0; d < doors.length; d++) {
        if (doPolygonsIntersect(this.computeRoomShrunkPolygon(candidate1), this.computeWallOuterPolygon(doors[d]))
          && doPolygonsIntersect(this.computeRoomShrunkPolygon(candidate2), this.computeWallOuterPolygon(doors[d])))
          continue attempts;
      }
      if (entrance != null && doPolygonsIntersect(this.computeRoomShrunkPolygon(candidate1), this.computeWallOuterPolygon(entrance))) {
        this.moveRoom(candidate1, room)
        this.moveRoom(candidate2, this.Room.count)
        if (callback)
          callback.call(this, building, room, this.Room.count)
      } else {
        this.moveRoom(candidate2, room)
        this.moveRoom(candidate1, this.Room.count)
        if (callback)
          callback.call(this, building, this.Room.count, room)
      }
      this.Room.count++
      break;
    }
  }
  this.computeRoomPolygon(room, true)
}