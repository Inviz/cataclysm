Game.Generator.Furniture = [
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
]
