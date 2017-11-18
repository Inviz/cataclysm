Game.Struct.Furniture = [
  function setAnchor (anchor) {
    return anchor;
  },
  function setPrevious (previous) {
    return previous;
  },
  function setWidth (width, anchor, context) {
    if (anchor == Game.ANCHORS.INSIDE_INWARDS || anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
      return 70
    } else {
      return 150 + 100 * context.random()//width;

    }
  },
  function setHeight (height, width, anchor, context) {
    if (anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
      return 70;
    } else {
      return 150 + 50 * context.random()//height;
    }
  },
  function setAngle (angle, room, anchor, context) {
    angle = angle + Math.PI
    if (anchor == Game.ANCHORS.INSIDE_CENTER && context.random() > 0.8)
      return angle += (Math.floor(context.random() * 8) * 3) * Math.PI / 180
    return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
  },
  function setX (x, anchor, angle, width, context) {
    var x1 = x + context.random() * 60 - 30;;

    if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
      return x + Math.cos(angle) * (width / 2 - 100 + 10)
    } 
    return x
  },

  function setY (y, anchor, angle, width, context) {
    var y1 = y + context.random() * 60 - 30;;


    if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
      return y + Math.sin(angle) * (width / 2 - 100 + 10)
    } 
    return y
  },
  function setRoom (room) {
    return room;
  },
  function setType(type, context) {
    if (type == 0) {
      var number = context.random();
      if (number > 0.5) {
        return 1
      } else {
        return 2;
      }
    }
  },
  function collide (collision, x, y, width, height, room, building, previous, index, context) {
    var polygon1 = context.recomputeFurniturePolygon(index)
    var polygon0 = context.computeRoomPolygon(room);
    if (checkGivenPolygonIntersection(polygon0, polygon1)
    || !intersectPolygon(polygon1[0], polygon0, 'x', 'y', 0)) {
      return 1;
    }
    for (var i = Math.max(0, index - 50); i < index; i++) {
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

  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeFurniturePolygon(index), 50, 5, null, null, 50, 50)
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeFurniturePolygon(index))
  },
]

Game.Generator.prototype.BuildingRoomFurniture = function(building, room, callback) {
  var roomPolygon = this.computeRoomAnchorPoints(room)
  var roomPolygon = this.computeRoomSpinePoints(room)
  var angle = this.getRoomAngle(room)

  if (roomPolygon) {
    var furniture = this.Furniture.count;
    var bones = roomPolygon.spinesShuffled;
    var max = Math.floor(this.random() * (bones.length - 1)) + 1

    // center points
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      var furniture = this.Furniture.count;
      for (var attempt = 0; attempt < 3; attempt++) {
        this.Furniture(furniture, room, building, bone[0], bone[1], angle, Game.ANCHORS.INSIDE_CENTER)
        
        if (!this.getFurnitureCollision(furniture)) {
          this.Furniture.count++;
          callback.call(this, building, room, furniture)
          continue placements;
        }
      }
    }

    // wall points
    var bones = roomPolygon.paddingPointsShuffled[0];
    var max = Math.floor(this.random() * (bones.length - 1)) + 1
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      var furniture = this.Furniture.count;
      for (var attempt = 0; attempt < 21; attempt++) {
        this.Furniture(furniture, room, building, bone[0], bone[1], bone[3] || 0, Game.ANCHORS.INSIDE_INWARDS)
        if (!this.getFurnitureCollision(furniture)) {
          this.Furniture.count++;
          //callback.call(this, building, room, furnitureIndex)
          continue placements
        }
      }
    }
    this.Furniture.count = furniture;
  }
  return furniture;

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
      this.Furniture(nextFurniture, room, building, slot[0], slot[1], slot[3] ||0, Game.ANCHORS.OUTSIDE_INWARDS, furniture)
      if (!this.getFurnitureCollision(nextFurniture)) {
        this.Furniture.count++;
        continue slots
      }
    }
  }
}