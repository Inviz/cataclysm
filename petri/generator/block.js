Game.Struct.Block = [
  function setLoop (loop) {
    return loop;
  },
  function setX(x, loop, context, index) {
    if (loop != null)
      loop = context.computeBlockPolygonCenter(index).x;
    return x;
  },
  function setY(y, loop, context, index) {
    if (loop != null)
      loop = context.computeBlockPolygonCenter(index).y;
    return y;
  },
  function setWidth(width, loop, context, index) {
    if (loop != null)
      loop = context.computeBlockPolygonCenter(index).width;
    return width;
  },
  function setHeight(height, loop, context, index) {
    if (loop != null)
      loop = context.computeBlockPolygonCenter(index).height;
    return height;
  },
  function setAngle(angle) {
    return angle;
  },

  function computePolygon(index, loop, context) {
    if (loop)
      return context.Road.network[loop];
    else
      return context.computePolygonFromRotatedRectangle(x, y, width, height, angle * (Math.PI / 180))
  },

  function computePolygonCenter(index, context) {
    return polygonCenter(context.computeBlockPolygon(index))
  },

  function computeInnerPolygon(index, context) {
    return context.computePolygonOffset([context.computeBlockPolygon(index)], -200, 100, 0);
  }
]