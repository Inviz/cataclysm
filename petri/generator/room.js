

Game.Generator = {
  Road: [
    function setX (x) {
      return x;
    },
    function setY (y) {
      return y;
    },
    function setWidth (width) {
      return width
    },
    function setHeight (height) {
      return height
    },
    function setAngle (angle) {
      return angle
    },
    function setConnectivity(connectivity) {
      if (connectivity) {
        return 1
      } else {
        return 0
      }
    },
    function setRange(range, connectivity) {
      if (connectivity)
        return 200
      else
        return 100;
    },
    function computePolygon(x, y, width, height, angle) {
      return polygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
    },
    function computeAnchorPoints(index, context) {
      return context.computeAnchorPoints(context.computeRoadPolygon(), 10, 10)
    }
  ],
  Building: [
    function setOffsetAngle(offsetAngle) {
      return 360 * Math.random()
    },
    function setOffsetDistance(offsetDistance, road) {
      return road.range * Math.random()
    },
    function setX (x, road, offsetDistance, offsetAngle) {
      return road.x + Math.cos(offsetAngle * (Math.PI / 180)) * (offsetDistance);
    },
    function setY (y, road, offsetDistance, offsetAngle) {
      return road.y + Math.sin(offsetAngle * (Math.PI / 180)) * (offsetDistance);
    },
    function setAngle (angle, road) {
      return road.angle
    },
    function setWidth(width) {
      return 60
    },
    function setHeight(height) {
      return 100
    },
    function collide (collision, x, y, width, height, room, building, index, context) {
      // collide previously generated buildings
      var polygon1 = context.recomputeBuildingPolygon(index)
      for (var i = 0; i < index; i++) {
        if (!context.getBuildingCollision(i)) {
          var polygon2 = context.computeBuildingPolygon(i)
          if (doPolygonsIntersect(polygon1, polygon2)) {
            return i + 1;
          }
        }
      }
      // collide with road polygons
      for (var i = 0; i < context.Road.count; i++) {
        var polygon2 = context.computeRoadPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
      return 0;
    },
    function computePolygon(x, y, width, height, angle) {
      return polygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
    },
    function computeAnchorPoints(index, context) {
      return context.computeAnchorPoints(context.computeBuildingPolygon(index))
    },
    function computeSpinePoints(index, context) {
      return context.computeSpinePoints(context.computeBuildingPolygon(index))
    }
  ],

  Room: [
    function setX (x) {
      return x;
    },
    function setY (y) {
      return y;
    },
    function setAngle (angle) {
      return angle;
    },
    function setBuilding (building) {
      return building;
    },
    function computePolygon(index, context) {
      return context.computeBuildingPolygon(context.getRoomBuilding(index))
    },
    function computeAnchorPoints(index, context) {
      return context.computeAnchorPoints(context.computeRoomPolygon(index))
    },
    function computeSpinePoints(index, context) {
      return context.computeSpinePoints(context.computeRoomPolygon(index))
    },
    function collide (collision) {
      return 0;
    },
  ],

  Furniture: [
    function setAnchor (anchor) {
      return anchor;
    },
    function setWidth (width, anchor) {
      if (anchor == Game.ANCHORS.INSIDE_INWARDS || anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
        return 5
      } else {
        return 10 + 10 * Math.random()//width;

      }
    },
    function setHeight (height, width, anchor) {
      if (anchor == Game.ANCHORS.OUTSIDE_INWARDS) {
        return 5;
      } else {
        return 10 + 5 * Math.random()//height;
      }
    },
    function setAngle (angle, room, anchor) {
      angle = Math.floor((Math.PI  + angle) * (180 / Math.PI))
      if (anchor == Game.ANCHORS.INSIDE_CENTER && Math.random() > 0.8)
        return angle += Math.floor(Math.random() * 8) * 3
      return angle// + Math.floor(Math.random() * 8) * 2// + room.angle//angle;
    },
    function setX (x, anchor, angle, width) {
      var x1 = x + Math.random() * 6 - 3;;

      if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
        return x + Math.cos(angle * (Math.PI / 180)) * (width / 2 - 10 + 1)
      } 
      return x
    },

    function setY (y, anchor, angle, width) {
      var y1 = y + Math.random() * 6 - 3;;


      if (anchor == Game.ANCHORS.INSIDE_INWARDS) {
        return y + Math.sin(angle * (Math.PI / 180)) * (width / 2 - 10 + 1)
      } 
      return y
    },
    function setRoom (room) {
      return room;
    },
    function setType(type) {
      if (type == 0) {
        var number = Math.random();
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
      for (var i = 0; i < index; i++) {
        if (context.getFurnitureRoom(i) == room && !context.getFurnitureCollision(i)) {
          var polygon2 = context.computeFurniturePolygon(i)
          if (doPolygonsIntersect(polygon1, polygon2)) {
            return i + 1;
          }
        }
      }
      return 0
    },

    function computePolygon(x, y, width, height, angle) {
      return polygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
    }
  ],
  
  Equipment: [
    function angle (angle) {
      return angle;
    }
  ]
}


Game.Distributions = {};
Game.Distributions.Rooms = {
  residence: {
    living_room: 1,
    kitchen: 1,
    pantry: 1
  }
}
Game.Distributions.Furniture = {
  living_room: {
    INSIDE_CENTER: {
      table: 0.8,
      sofa: 0.7
    },
    INSIDE_CORNER: {
      lamp: 0.5
    },
    ALONG_INWARDS: {
      shelf: 0.15
    }
  }
}
Game.Distributions.Objects = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      magazine: 0.2
    },
    OUTSIDE_INWARDS: {
      chair: 0.8
    }
  },

  chair: {
    INSIDE_TOP: {
      magazine: 0.2
    }
  }
}

Game.MASK = {
  INSIDE: 1,
  OUTSIDE: 2,
  ALONG: 4,
  AROUND: 8,

  INWARDS: 16,
  OUTWARDS: 32,
  OPPOSITE: 64,
  CORNER: 128,
  TOP: 256,
  CENTER: 512,

}
Game.ANCHORS = {};
for (var p1 in Game.MASK) {
  Game.ANCHORS[p1] = Game.MASK[p1]
  for (var p2 in Game.MASK)
    Game.ANCHORS[p1 + '_' + p2] = Game.MASK[p1] | Game.MASK[p2]
}
