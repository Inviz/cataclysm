Game.Struct.Furniture = [
  function setAnchor (anchor) {
    return anchor;
  },
  function setWidth (width, anchor, context) {
    if (anchor == Game.ANCHORS.INSIDE_INWARDS || anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
      return 5
    } else {
      return 10 + 10 * context.random()//width;

    }
  },
  function setHeight (height, width, anchor, context) {
    if (anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
      return 5;
    } else {
      return 10 + 5 * context.random()//height;
    }
  },
  function setAngle (angle, room, anchor, context) {
    angle = Math.floor((Math.PI  + angle) * (180 / Math.PI))
    if (anchor == Game.ANCHORS.INSIDE_CENTER && context.random() > 0.8)
      return angle += Math.floor(context.random() * 8) * 3
    return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
  },
  function setX (x, anchor, angle, width, context) {
    var x1 = x + context.random() * 6 - 3;;

    if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
      return x + Math.cos(angle * (Math.PI / 180)) * (width / 2 - 10 + 1)
    } 
    return x
  },

  function setY (y, anchor, angle, width, context) {
    var y1 = y + context.random() * 6 - 3;;


    if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
      return y + Math.sin(angle * (Math.PI / 180)) * (width / 2 - 10 + 1)
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
  function collide (collision, x, y, width, height, room, building, index, context) {
    var polygon1 = context.recomputeFurniturePolygon(index)
    var polygon0 = context.computeRoomPolygon(room);
    if (checkGivenPolygonIntersection(polygon0, polygon1)
    || !intersectPolygon(polygon1[0], polygon0, 'x', 'y', 0)) {
      return 1;
    }
    for (var i = Math.max(0, index - 50); i < index; i++) {
      if (context.getFurnitureRoom(i) == room && !context.getFurnitureCollision(i)) {
        var polygon2 = context.computeFurniturePolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
    }
    return 0
  },

  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
  },

  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeFurniturePolygon(index), 4)
  },
  function computeSpinePoints(index, context) {
    return context.computeSpinePoints(context.computeFurniturePolygon(index))
  },
]

Game.Generator.prototype.BuildingRoomFurniture = function(buildingIndex, roomIndex) {
  var building = this.computeRoomAnchorPoints(roomIndex)
  building = this.computeRoomSpinePoints(roomIndex)

  if (building) {
    var furnitureIndex = this.Furniture.count;
    var bones = building.spinesShuffled;
    var max = Math.floor(this.random() * (bones.length - 1)) + 1

    // center points
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      furnitureIndex++;
      for (var attempt = 0; attempt < 3; attempt++) {
        this.Furniture(furnitureIndex, roomIndex, buildingIndex, bone[0], bone[1], bone[3] || 0, Game.ANCHORS.INSIDE_CENTER)
        
        if (!this.getFurnitureCollision(furnitureIndex)) {
          furnitureIndex = this.BuildingRoomFurnitureFurniture(buildingIndex, roomIndex, furnitureIndex)
          
          continue placements;
        }
      }
      furnitureIndex--
    }

    // wall points
    var bones = building.paddingPointsShuffled[0];
    var max = Math.floor(this.random() * (bones.length - 1)) + 1
    placements: for (var p = 0; p < max; p++) {
      var bone = bones[p];
      furnitureIndex++;
      for (var attempt = 0; attempt < 21; attempt++) {
        this.Furniture(furnitureIndex, roomIndex, buildingIndex, bone[0], bone[1], bone[3] || 0, Game.ANCHORS.INSIDE_INWARDS)
        if (!this.getFurnitureCollision(furnitureIndex)) {
          continue placements
        }
      }
      furnitureIndex--
    }
    this.Furniture.count = furnitureIndex;
  }
  return furnitureIndex;

}
Game.Generator.prototype.BuildingRoomFurnitureFurniture = function(buildingIndex, roomIndex, furnitureIndex) {
  var polygon = this.recomputeFurniturePolygon(furnitureIndex);
  var polygon = this.recomputeFurnitureAnchorPoints(furnitureIndex);
  var slots = polygon.marginStraightPointsShuffled[0];
  var maxS = Math.floor(this.random() * (slots.length - 1)) + 1
  slots: for (var p = 0; p < maxS; p++) {
    var slot = slots[p];
    furnitureIndex++;
    for (var attempt = 0; attempt < 21; attempt++) {
      this.Furniture(furnitureIndex, roomIndex, buildingIndex, slot[0], slot[1], slot[3] ||0, Game.ANCHORS.OUTSIDE_INWARDS)
      if (!this.getFurnitureCollision(furnitureIndex)) {
        continue slots
      }
    }
    furnitureIndex--
  }
  return furnitureIndex
}