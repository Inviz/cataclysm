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
  function setOrientation (orientation) {
    return Math.random() > 0.5 ? 1 : -1
  },
  function setPlacement (placement) {
    return Math.random() > 0.5 ? 1 : 0
  },
  function setOffset (offset, number) {
    if (number == 0 || Math.random() > 0.3)
      return 0
    return Math.floor(Math.random() * 3) / 3
  },
  function setWidth (width, number, building, placement) {
    if (number == 0 || !placement)
      return building.width;
    else
      return building.width * (2 + (Math.random() * 3)) / 3
    return width;
  },
  function setHeight (height, number, building, placement) {
    if (number == 0 || placement)
      return building.height;
    else
      return building.height * (2 + (Math.random() * 3)) / 3
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
      angle += 90;
      var distance = (origin.height + height) / 2;
      var offsetDistance = offset * origin.width
    }

    var angleShift = Math.cos(angle * (Math.PI / 180)) * (distance + .1);
    var offsetShift = Math.cos((angle - 90) * (Math.PI / 180)) * (offsetDistance);
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
      angle += 90;
      var distance = (origin.height + height) / 2;
      var offsetDistance = offset * origin.width
    }

    var angleShift = Math.sin(angle * (Math.PI / 180)) * (distance + .1);
    var offsetShift = Math.sin((angle - 90) * (Math.PI / 180)) * (offsetDistance);
    return y + (angleShift) * orientation + offsetShift
  },
  function setBuilding (building) {
    return building;
  },
  function setDistance (distance, x, y, building) {
    return Math.sqrt(Math.pow(x - building.x, 2) + Math.pow(y - building.y, 2), 2);
  },
  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoomPolygon(index))
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeRoomPolygon(index))
  },
  function collide (collision, x, y, width, height, building, index, context, number) {
    // collide previously generated buildings
    var polygon1 = context.recomputeRoomPolygon(index)
    for (var i = 0; i < index; i++) {
      if (!context.getRoomCollision(i) && (context.getRoomNumber(i) !== number || context.getRoomBuilding(i) !== building)) {
        var polygon2 = context.computeRoomPolygon(i)
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

Game.Generator.prototype.BuildingRoom = function(buildingIndex) {
  var roomIndex = this.Room.count;
  var min = 1;
  var max = 4;
  var rooms = 3//Math.floor(Math.random() * (max - min) + min)
  var first = roomIndex;
  placement: for (var i = 0; i < rooms; i++) {
    var candidateIndex = roomIndex;
    var minDistance = Infinity;
    var bestPlacement = null;
    for (var attempt = 0; attempt < 5; attempt++) {
      this.Room(roomIndex, buildingIndex, i, first + Math.floor(Math.random() * (i)))
      if (!this.getRoomCollision(roomIndex)) {
        var distance = this.getRoomDistance(roomIndex);
        if (distance < minDistance) {
          minDistance = distance;
          bestPlacement = roomIndex;
          ++roomIndex
        }
      }
    }
    
    if (bestPlacement != null) {
      this.moveRoom(bestPlacement, candidateIndex);
      this.recomputeRoomPolygon(candidateIndex)
      this.BuildingRoomFurniture(buildingIndex, candidateIndex)
      roomIndex = candidateIndex + 1;
    } else {
      roomIndex = candidateIndex
      break
    }
  }
  this.Room.count = roomIndex
}
