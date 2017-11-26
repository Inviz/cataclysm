Game.Struct.Room = [
  function setRoomNumber (number) {
    return number;
  },
  function setRoomOrigin (origin, number) {
    return origin;
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
    return Math.floor(this.random() * 3) / 3
  },
  function setRoomWidth (width, number, building, placement) {
    if (number == 0 || !placement)
      return building.width;
    else
      return building.width * (2 + (this.random() * 3)) / 3
    return width;
  },
  function setRoomHeight (height, number, building, placement) {
    if (number == 0 || placement)
      return building.length;
    else
      return building.length * (2 + (this.random() * 3)) / 3
    return height;
  },
  function setRoomX (x, number, building, origin, angle, orientation, placement, width, height, offset) {
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

    var angleShift = Math.sin(angle) * (distance + .00000001);
    var offsetShift = Math.sin((angle - Math.PI / 2)) * (offsetDistance);
    return y + (angleShift) * orientation + offsetShift
  },
  function setRoomBuilding (building) {
    return building;
  },
  function setRoomDistance (distance, x, y, building) {
    return Math.sqrt(Math.pow(x - building.x, 2) + Math.pow(y - building.y, 2), 2);
  },
  function computeRoomPolygon(x, y, width, height, angle) {
    return this.computePolygonFromRotatedRectangle(x, y, width, height, angle)
  },
  function computeRoomAnchorPoints(index) {
    return this.computeAnchorPoints(this.computeRoomPolygon(index), .2, .2, null, null, 10, 10)
  },
  function computeRoomSpinePoints(index) {
    return this.computeSpinePoints(this.computeRoomPolygon(index))
  },
  function computeRoomPoints(index) {
    var points = this.computeRoomAnchorPoints(index);
    this.computeRoomSpinePoints(index);
    return this.computePoints(points)
  },
  function setRoomCollision (collision, x, y, width, height, building, index, number) {
    // collide previously generated buildings
    var polygon1 = this.computeRoomPolygon(index)
    for (var i = 0; i < this.Room.count; i++) {
      if (!this.getRoomCollision(i) && this.getRoomBuilding(i) === building) {
        var polygon2 = this.computeRoomPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    // collide previously generated buildings
    for (var i = 0; i < this.Building.count; i++) {
      if (i !== building) {
        var polygon2 = this.computeBuildingOuterPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    // collide with road polygons
    for (var i = 0; i < this.Road.count; i++) {
      var polygon2 = this.computeRoadSurroundingPolygon(i)
      if (doPolygonsIntersect(polygon1, polygon2)) {
        return i + 1;
      }
    }
    return 0
  },
]

Game.Generator.prototype.BuildingRoom = function(building, callback) {
  var min = 1;
  var max = 4;
  var rooms = 3//Math.floor(Math.random() * (max - min) + min)
  var first = this.Room.count;
  var candidate = 9999;
  placement: for (var i = 0; i < rooms; i++) {
    var minDistance = Infinity;
    for (var attempt = 0; attempt < 5; attempt++) {
      this.Room(candidate, building, i, first + Math.floor(this.random() * (i)))
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
      callback.call(this, building, this.Room.count++)
    }
  }
}
