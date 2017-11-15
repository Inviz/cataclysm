Game.Struct.Block = [
  function setLoop (loop) {
    return loop;
  },
  function setAngle(angle, loop, road) {
    if (!loop)
      return road.angle;
    return angle;
  },
  function setWidth(width, loop, context, index) {
    if (loop)
      width = context.computeBlockPolygonCenter(index).width;
    else 
      return 4000 + (context.random() * 3000)
    return width;
  },
  function setHeight(height, loop, context, index) {
    if (loop)
      height = context.computeBlockPolygonCenter(index).height;
    else 
      return 4000
    return height;
  },
  function setX(x, road, loop, angle, width, context, index) {
    if (loop)
      x = context.computeBlockPolygonCenter(index).x;
    else
      x = road.x + Math.cos(angle) * Math.max(100, (width - road.length ) / 2);
    return x ;
  },
  function setY(y, road, loop, angle, width, context, index) {
    if (loop)
      y = context.computeBlockPolygonCenter(index).y;
    else
      y = road.y + Math.sin(angle) * Math.max(100, (width - road.length) / 2);
    return y;
  },

  function computePolygon(index, loop, context, x, y, width, height, angle) {
    if (loop)
      return context.Road.network[loop];
    else {
      return context.computePolygonFromRotatedRectangle(x, y, width, height, angle)
    }
  },

  function computePolygonCenter(index, context) {
    return polygonCenter(context.computeBlockPolygon(index))
  },

  function computeInnerPolygon(index, context) {
    return context.computePolygonOffset([context.computeBlockPolygon(index)], -200, 100, 0);
  }
]