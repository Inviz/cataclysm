Game.Struct.Furniture = [
  function setAnchor (anchor) {
    return anchor;
  },
  function setPrevious (previous) {
    return previous;
  },
  function setWidth (width, type) {
    return Game.Furniture[type].length;
  },
  function setLength (height, type) {
    return Game.Furniture[type].width;
  },
  function setAngle (angle, room, anchor, context, height, width) {
    if (angle == null)
      angle = 0;
    //if (height > width)
    //  angle += Math.PI / 2
    //if ((anchor & Game.ANCHOR.CENTER) && context.random() > 0.8)
    //  return angle += (Math.floor(context.random() * 8) * 3) * Math.PI / 180
    return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
  },
  function setOffsetAngle(offsetAngle, angle) {
    return angle + (offsetAngle || 0);
  },
  function setOffsetDistance(offsetDistance, width, type) {
    //if (type == Game.Furniture.chair.index)
    //  return - height / 6;
    return width / 2
  },
  function setX (x, anchor, angle, offsetDistance, offsetAngle, height, width, context) {
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

  function setY (y, anchor, angle, offsetDistance, offsetAngle, height, width, context) {
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
  function setRoom (room) {
    return room;
  },
  function setType(type, context) {
    return type
  },
  function setCollision (collision, x, y, width, height, room, building, previous, index, context, anchor) {
    var polygon1 = context.computeFurniturePolygon(index, true)
    var polygon0 = context.computeRoomPolygon(room);
    if (checkGivenPolygonIntersection(polygon0, polygon1)
    || !intersectPolygon(polygon1[0], polygon0, 'x', 'y', 0)) {
      return 1;
    }
    for (var i = context.Furniture.count - 50; i < context.Furniture.count; i++) {
      if (i != previous && context.getFurnitureRoom(i) == room && !context.getFurnitureCollision(i)) {
        var polygon2 = context.computeFurniturePolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    return 0
  },

  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle)
  },

  function computeAnchorPoints(index, context, type) {
    if (type == Game.Furniture.table.index) {
      return context.computeAnchorPoints(context.computeFurniturePolygon(index), .2, .2, null, null, 12, 12)

    } else {
      return context.computeAnchorPoints(context.computeFurniturePolygon(index), .2, .2, null, null, 5, 5)
    }
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeFurniturePolygon(index))
  },
  function computePoints(index, context) {
    var points = context.computeFurnitureAnchorPoints(index);
    context.computeFurnitureSpinePoints(index);
    return context.computePoints(points)
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