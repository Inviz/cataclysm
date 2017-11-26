Game.Struct.Furniture = [
  function setFurnitureAnchor (anchor) {
    return anchor;
  },
  function setFurniturePrevious (previous) {
    return previous;
  },
  function setFurnitureWidth (width, type) {
    return Game.Furniture[type].length;
  },
  function setFurnitureLength (height, type) {
    return Game.Furniture[type].width;
  },
  function setFurnitureAngle (angle, room, anchor, height, width) {
    if (angle == null)
      angle = 0;
    //if (height > width)
    //  angle += Math.PI / 2
    //if ((anchor & Game.ANCHOR.CENTER) && this.random() > 0.8)
    //  return angle += (Math.floor(this.random() * 8) * 3) * Math.PI / 180
    return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
  },
  function setFurnitureOffsetAngle(offsetAngle, angle) {
    return angle + (offsetAngle || 0);
  },
  function setFurnitureOffsetDistance(offsetDistance, width, type) {
    //if (type == Game.Furniture.chair.index)
    //  return - height / 6;
    return width / 2
  },
  function setFurnitureX (x, anchor, angle, offsetDistance, offsetAngle, height, width) {
    if (anchor & Game.ANCHOR.CENTER) {
      return x;
    } else if (anchor & Game.ANCHOR.CORNER) {
      return x + Math.cos(offsetAngle) * (width / 2)
               + Math.cos(angle) * (height / 2)
    } else if (!(anchor & Game.ANCHOR.INWARDS) ^ !(anchor & Game.ANCHOR.OUTSIDE)) {
      return x + Math.cos(offsetAngle) * offsetDistance
    } else {
      return x - Math.cos(offsetAngle) * offsetDistance
    }
    return x
  },

  function setFurnitureY (y, anchor, angle, offsetDistance, offsetAngle, height, width) {
    if (anchor & Game.ANCHOR.CENTER) {
      return y;
    } else if (anchor & Game.ANCHOR.CORNER) {
      return y + Math.sin(offsetAngle) * (width / 2)
               + Math.sin(angle) * (height / 2)
    } else if (!(anchor & Game.ANCHOR.INWARDS) ^ !(anchor & Game.ANCHOR.OUTSIDE)) {
      return y + Math.sin(offsetAngle) * offsetDistance
    } else {
      return y - Math.sin(offsetAngle) * offsetDistance
    }
    return y
  },
  function setFurnitureRoom (room) {
    return room;
  },
  function setFurnitureType(type) {
    return type
  },
  function setFurnitureCollision (collision, x, y, width, height, room, building, previous, index, anchor) {
    var polygon1 = this.computeFurniturePolygon(index, true)
    var polygon0 = this.computeRoomPolygon(room);
    if (checkGivenPolygonIntersection(polygon0, polygon1)
    || !intersectPolygon(polygon1[0], polygon0, 'x', 'y', 0)) {
      return 1;
    }
    for (var i = this.Furniture.count - 50; i < this.Furniture.count; i++) {
      if (i != previous && this.getFurnitureRoom(i) == room && !this.getFurnitureCollision(i)) {
        var polygon2 = this.computeFurniturePolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    return 0
  },

  function computeFurniturePolygon(x, y, width, height, angle) {
    return this.computePolygonFromRotatedRectangle(x, y, width, height, angle)
  },

  function computeFurnitureAnchorPoints(index, type) {
    if (type == Game.Furniture.table.index) {
      return this.computeAnchorPoints(this.computeFurniturePolygon(index), .2, .2, null, null, 12, 12)

    } else {
      return this.computeAnchorPoints(this.computeFurniturePolygon(index), .2, .2, null, null, 5, 5)
    }
  },
  function computeFurnitureSpinePoints(index) {
    return this.computeSpinePoints(this.computeFurniturePolygon(index))
  },
  function computeFurniturePoints(index) {
    var points = this.computeFurnitureAnchorPoints(index);
    this.computeFurnitureSpinePoints(index);
    return this.computePoints(points)
  },
]

Game.Generator.prototype.BuildingRoomFurniture = function(building, room, callback, previous, blueprint) {
  if (previous != null) {
    var points = this.computeFurniturePoints(previous).allPoints
    var angle = this.getFurnitureAngle(previous)
  } else {

    var points = this.computeRoomPoints(room).allPoints
    var angle = this.getRoomAngle(room)
  }
  if (!blueprint)
    var blueprint = Game.Distributions.Rooms.living_room;
  var types = Game.Distributions.Rooms

  if (points) {
    for (var item in blueprint) {
      if (!blueprint[item] || !blueprint[item].weights) 
        continue;
      if (blueprint[item].min) {
        var max = blueprint[item].min + Math.floor(this.random() * (blueprint[item].max - blueprint[item].min + 1))
      } else {
        var max = 1;
      }
      for (var attempt = 0; attempt < max; attempt++) {
        var candidate = this.Furniture.count;
        var weights = blueprint[item].weights;
        var bestCandidate = null;
        var maxWeight = 0;
        for (var i = 0; i < points.length; i++) {
          var point = points[i];
          var weight = 0;
          var anchor
          for (var b = 0; b < weights.length; b += 2) {
            if ((point[4] & weights[b + 1]) == weights[b + 1]) {
              if (weights[b] > weight) {
                weight = weights[b]
                var anchor = weights[b + 1]
              }
            }
          }
          if (weight > 0 && maxWeight <= weight) {
            this.Furniture(candidate, room, building, point[0], point[1], point[3], point[5], anchor, Game.Furniture[item].index, previous)
            if (!this.getFurnitureCollision(candidate)) {
              var maxWeight = weight;
              var bestCandidate = candidate++;
            } 
          }
        }
        if (bestCandidate != null) {
          var furniture = this.moveFurniture(bestCandidate, this.Furniture.count++)
          this.computeFurniturePolygon(furniture, true);
          this.BuildingRoomFurniture(building, room, null, furniture, blueprint[item])
        }
      }
    }
  }
}