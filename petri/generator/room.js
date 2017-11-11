

Game.Generator = {
  City: [

  ],
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
    function setLayer(layer, index, context) {
      var polygon1 = context.computeRoadOuterPolygon(index);
      groups: for (var group = 0; group < 5; group++) {
        for (var i = 0; i < index; i++) {
          var layer = context.getRoadLayer(i)
          if (layer == group) {
            var polygon2 = context.computeRoadOuterPolygon(i)
            if (doPolygonsIntersect(polygon1, polygon2)) {
              continue groups
            }
          }
        }
        break;;
      }
      return group
    },
    function computePSLG(index, context) {
      return context.computePSLG([context.computeRoadPolygon(index)])
    },
    function computeVector(x, y, height, angle, context) {
      return context.computeVectorFromSegment(x, y, height, angle * (Math.PI / 180))
    },
    function computePolygon(x, y, width, height, angle, context) {
      return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
    },
    function computeOuterPolygon(x, y, width, height, angle, context) {
      return context.computePolygonFromRotatedRectangle(x, y, width + 20, height + 20, angle * (Math.PI / 180))
    },
    function computeSurroundingPolygon(x, y, width, height, angle, context) {
      return context.computePolygonFromRotatedRectangle(x, y, width + 40, height + 40, angle * (Math.PI / 180))
    },
    function computeSplittingPolygon(x, y, width, height, angle, context) {
      return context.computePolygonFromRotatedRectangle(x, y, width + 40, height + 40, angle * (Math.PI / 180))
    },
    function computeAnchorPoints(index, context) {
      return context.computeAnchorPoints(context.computeRoadSurroundingPolygon(index), 5, 40)
    }
  ],
  Building: [
    function setWidth(width) {
      return 60 + Math.random() * 20
    },
    function setHeight(height) {
      return 50 + Math.random() * 50
    },
    function setOffsetAngle(offsetAngle, road) {
      return ((Math.PI) + offsetAngle) * (180 / Math.PI)//360 * Math.random()
    },
    function setOffsetDistance(offsetDistance, width, height, road) {
      return width / 2//100// * Math.random()
    },
    function setX (x, road, offsetDistance, offsetAngle) {
      if (x == null)
        x = road.x;
      return x + Math.cos(offsetAngle * (Math.PI / 180)) * (offsetDistance);
    },
    function setY (y, road, offsetDistance, offsetAngle) {
      
      if (y == null)
        y = road.y;
      return y + Math.sin(offsetAngle * (Math.PI / 180)) * (offsetDistance);
    },
    function setAngle (angle, road) {
      return road.angle
    },
    function setRoad (road) {
      return road
    },
    function collide (collision, x, y, width, height, building, index, context) {
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
        var polygon2 = context.computeRoadSurroundingPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
      return 0;
    },
    function computePolygon(x, y, width, height, angle, context) {
      return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
    },
    function computeShape(index, context) {
      var loops = [];
      context.eachRoom(function(room) {

        if (context.getRoomBuilding(room) == index ) {
          loops.push(context.computeRoomPolygon(room).map(function(pt) {
            return [pt.x, pt.y]//[Math.floor(pt.x * 1) / 1, Math.floor(pt.y * 1) / 1]
          }))
        }
      })
      return loops;
    },
    function computePSLG(index, context) {
      return context.computePSLG(context.computeBuildingShape(index))
    },
    function computeNavigationNetwork(index, context) {
      return context.computeNavigationNetwork(context.computeBuildingPSLG(index))
    },
    function computeAnchorPoints(index, context) {
      return context.computeAnchorPoints(context.computeBuildingPolygon(index))
    },
    function computeSpinePoints(index, context) {
      return context.computeSpinePoints(context.computeBuildingPolygon(index))
    }
  ],

  Room: [
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
        var polygon2 = context.computeRoadOuterPolygon(i)
        if (doPolygonsIntersect(polygon1, polygon2)) {
          return i + 1;
        }
      }
      return 0
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
