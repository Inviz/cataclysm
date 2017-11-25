Game.Struct.Room = [
  function setNumber (number) {
    return number;
  },
  function setOrigin (origin, number) {
    return origin;
  },
  function setAngle (angle, building) {
    return building.angle;
  },
  function setOrientation (orientation, context) {
    return context.random() > 0.5 ? 1 : -1
  },
  function setPlacement (placement, context) {
    return context.random() > 0.5 ? 1 : 0
  },
  function setOffset (offset, number, context) {
    if (number == 0 || context.random() > 0.3)
      return 0
    return Math.floor(context.random() * 3) / 3
  },
  function setWidth (width, number, building, placement, context) {
    if (number == 0 || !placement)
      return building.width;
    else
      return building.width * (2 + (context.random() * 3)) / 3
    return width;
  },
  function setHeight (height, number, building, placement, context) {
    if (number == 0 || placement)
      return building.length;
    else
      return building.length * (2 + (context.random() * 3)) / 3
    return height;
  },
  function setX (x, number, building, origin, angle, orientation, placement, width, height, offset) {
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
  function setY (y, number, building, origin, angle, orientation, placement, width, height, offset) {
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
  function setBuilding (building) {
    return building;
  },
  function setDistance (distance, x, y, building) {
    return Math.sqrt(Math.pow(x - building.x, 2) + Math.pow(y - building.y, 2), 2);
  },
  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle)
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoomPolygon(index), .2, .2, null, null, 10, 10)
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeRoomPolygon(index))
  },
  function computePoints(index, context) {
    var points = context.computeRoomAnchorPoints(index);
    context.computeRoomSpinePoints(index);
    return context.computePoints(points)
  },
  function setCollision (collision, x, y, width, height, building, index, context, number) {
    // collide previously generated buildings
    var polygon1 = context.computeRoomPolygon(index)
    for (var i = 0; i < context.Room.count; i++) {
      if (!context.getRoomCollision(i) && context.getRoomBuilding(i) === building) {
        var polygon2 = context.computeRoomPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    // collide previously generated buildings
    for (var i = 0; i < context.Building.count; i++) {
      if (i !== building) {
        var polygon2 = context.computeBuildingOuterPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    // collide with road polygons
    for (var i = 0; i < context.Road.count; i++) {
      var polygon2 = context.computeRoadSurroundingPolygon(i)
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
