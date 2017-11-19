Game.Struct.Furniture = [
  function setAnchor (anchor) {
    return anchor;
  },
  function setPrevious (previous) {
    return previous;
  },
  function setWidth (width, type) {
    return Game.Furniture[type].width;
  },
  function setHeight (height, type) {
    return Game.Furniture[type].height;
  },
  function setAngle (angle, room, anchor, context, height, width) {
    if (angle == null)
      angle = 0;
    //if (height > width)
    //  angle += Math.PI / 2
    if ((anchor & Game.ANCHOR.CENTER) && context.random() > 0.8)
      return angle += (Math.floor(context.random() * 8) * 3) * Math.PI / 180
    return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
  },
  function setOffsetAngle(offsetAngle, angle) {
    return angle + (offsetAngle || 0);
  },
  function setOffsetDistance(offsetDistance, height, type) {
    if (type == Game.Furniture.chair.index)
      return - height / 6;
    return height / 2
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
    var polygon1 = context.recomputeFurniturePolygon(index)
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
    return context.computePolygonFromRotatedRectangle(x, y, height, width, angle)
  },

  function computeAnchorPoints(index, context) {
    debugger
    return context.computeAnchorPoints(context.computeFurniturePolygon(index), 2, 2, null, null, 50, 50)
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
          this.BuildingRoomFurniture(building, room, null, furniture, blueprint[item])
        }
      }
    }
    /*
    // center points
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      var furniture = this.Furniture.count;
      for (var attempt = 0; attempt < 3; attempt++) {
        this.Furniture(furniture, room, building, bone[0], bone[1], angle, Game.ANCHOR.INSIDE_CENTER)
        
        if (!this.getFurnitureCollision(furniture)) {
          this.Furniture.count++;
          callback.call(this, building, room, furniture)
          continue placements;
        }
      }
    }

    // wall points
    var bones = points.paddingPointsShuffled[0];
    var max = Math.floor(this.random() * (bones.length - 1)) + 1
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      var furniture = this.Furniture.count;
      for (var attempt = 0; attempt < 21; attempt++) {
        this.Furniture(furniture, room, building, bone[0], bone[1], bone[3] || 0, Game.ANCHOR.INSIDE_INWARDS)
        if (!this.getFurnitureCollision(furniture)) {
          this.Furniture.count++;
          //callback.call(this, building, room, furnitureIndex)
          continue placements
        }
      }
    }*/
  }
}
Game.Generator.prototype.BuildingRoomFurnitureFurniture = function(building, room, furniture, callback) {
  var polygon = this.recomputeFurniturePolygon(furniture);
  var polygon = this.recomputeFurnitureAnchorPoints(furniture);
  var slots = polygon.marginStraightPointsShuffled[0];
  var maxS = Math.floor(this.random() * (slots.length - 1)) + 1
  slots: for (var p = 0; p < maxS; p++) {
    var slot = slots[p];
    var nextFurniture = this.Furniture.count;
    for (var attempt = 0; attempt < 21; attempt++) {
      this.Furniture(nextFurniture, room, building, slot[0], slot[1], slot[3] ||0, Game.ANCHOR.OUTSIDE_INWARDS, furniture)
      if (!this.getFurnitureCollision(nextFurniture)) {
        this.Furniture.count++;
        continue slots
      }
    }
  }
}