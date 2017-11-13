Game.Generator.Road = [
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
  function computePSLG(index, context) {
    return context.computePSLG([context.computeRoadPolygon(index)])
  },
  function computeVector(x, y, height, angle, context) {
    return context.computeVectorFromSegment(x, y, height, angle * (Math.PI / 180))
  },
  function computePolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width, height - 2, angle * (Math.PI / 180))
  },
  function computeOuterPolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width + 20, height + 10, angle * (Math.PI / 180))
  },
  function computeSurroundingPolygon(x, y, width, height, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, width + 60, height + 60, angle * (Math.PI / 180))
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoadSurroundingPolygon(index), 5, 40)
  }
]