Game.Struct.Road = [
  function setType (type) {
    return type
  },
  function setPrevious (previous) {
    return previous
  },
  function setAngle (angle, previous, ex, ey, sx, sy) {
    if (angle == null) {
      if (sx != null)
        return Math.atan2(ey - sy, ex - sx)
      else
        return Math.atan2(ey - previous.ey, ex - previous.ex)
    }
    return angle + previous.angle
  },
  function setWidth (width, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_WIDTH : context.DEFAULT_SEGMENT_WIDTH;
  },
  function setLength (length, type, context, ex, ey, previous, index, sx, sy) {
    if (sx != null && ex != null) {
      return Math.sqrt(Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2), 2)
    }
    if (ex != null && (index > 2 || context.Road.count > 2)) {
      return Math.sqrt(Math.pow(previous.ex - ex, 2) + Math.pow(previous.ey - ey, 2), 2)
    }
    return type === 0 ? context.HIGHWAY_SEGMENT_LENGTH : context.DEFAULT_SEGMENT_LENGTH;
  },
  function setEx (ex, previous, angle, length) {
    if (ex != null)
      return ex
    return previous.ex + Math.cos(angle) * length;
  },
  function setEy (ey, previous, angle, length) {
    if (ey != null)
      return ey
    return previous.ey + Math.sin(angle) * length;
  },
  function setX (x, ex, angle, length) {
    return ex - Math.cos(angle) * length / 2;
  },
  function setY (y, ey, angle, length) {
    return ey - Math.sin(angle) * length / 2;
  },
  function setSx (sx, ex, angle, length) {
    return ex - Math.cos(angle) * length;
  },
  function setSy (sy, ey, angle, length) {
    return ey - Math.sin(angle) * length;
  },
  function setConnectivity(connectivity, context) {
    if (connectivity) {
      return 1
    } else {
      return 0
    }
  },
  function setRange(range, connectivity) {
    if (connectivity)
      return 2000
    else
      return 1000;
  },
  function setPopulation(population, index, context, city) {
    var vector = context.computeRoadVector(index);
    var x = city.x;
    var y = city.y;
    return (context.computeTripleNoise(context.getRoadSx(index) + x, context.getRoadSy(index) + y) 
          + context.computeTripleNoise(context.getRoadEx(index) + x, context.getRoadEy(index) + y)) / 2;
  },
  function setStatus(status) {
    return status
  },
  function setCollision(collision, index, context, city) {
    if (collision != null)
      return collision;
    var type = null;
    var x1 = context.getRoadSx(index)
    var y1 = context.getRoadSy(index)
    var x2 = context.getRoadEx(index)
    var y2 = context.getRoadEy(index)
    var ninety = Math.PI;
    for (var other = 0; other < context.Road.count; other++) {
      var x3 = context.getRoadSx(other)
      var y3 = context.getRoadSy(other);
      var x4 = context.getRoadEx(other)
      var y4 = context.getRoadEy(other);
      var otherCollision = context.getRoadCollision(other)
      if (other == index || otherCollision === 1 || otherCollision === -1 || (other < 2 && index < 2))
        continue;
      // snap to closest road
      //var closest = closestOnLineXY(x4, y4, x1, y1, x2, y2);
      //var closestDistance = Math.sqrt(Math.pow(x2 - closest.x, 2) + Math.pow(y2 - closest.y, 2), 2);
      //if (closestDistance < context.ROAD_SNAP_DISTANCE) {
      //  if (type <= 4 && (bestDistance == null || bestDistance > closestDistance)) {
      //    var target = other;
      //    var xx = closest.x;
      //    var xy = closest.y;
      //    var bestDistance = closestDistance;
      //    var type = 4;
      //  }
      //}
      // create crossroads on line intersection
      if (type <= 3) {

        var intersection = checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4)
        if (intersection && (intersection.x != x1 || intersection.y != y1)) {
          var distance = Math.sqrt(Math.pow(x1 - intersection.x, 2) + Math.pow(y1 - intersection.y, 2), 2);
          if (delay == null || distance < delay) {
            var target = other;
            var xx = intersection.x;
            var xy = intersection.y;
            var delay = distance;
          }
          var type = 3;
        // reject close roads that are too similar
          var angleDiff = context.computeDegreeDifference(context.getRoadAngle(index), context.getRoadAngle(other))
          if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) {
            return 1;
          } 
        } else if (intersection && !type) {
          type = 0;
        }
      }
      // join endpoints
      if (type <= 2 || target === other) {
        var distance = Math.sqrt(Math.pow(x2 - x4, 2) + Math.pow(y2 - y4, 2), 2);
        if (distance < context.ROAD_SNAP_DISTANCE) {
          var target = other;
          var xx = x4;
          var xy = y4;
          var type = 2;

          var angleDiff = context.computeDegreeDifference(context.getRoadAngle(index), context.getRoadAngle(other))
          if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) {
            return 1;
          } 
        }

      }
      // snap to closest road
      var closest = closestOnLineXY(x2, y2, x3, y3, x4, y4);
      var closestDistance = Math.sqrt(Math.pow(x2 - closest.x, 2) + Math.pow(y2 - closest.y, 2), 2);
      if (closestDistance < context.ROAD_SNAP_DISTANCE) {
        if (type <= 1 && (bestDistance == null || bestDistance > closestDistance)) {
          var target = other;
          var xx = closest.x;
          var xy = closest.y;
          var bestDistance = closestDistance;
          var type = 1;
        }

        var angleDiff = context.computeDegreeDifference(context.getRoadAngle(index), context.getRoadAngle(other))
        if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) {
          return 1;
        } 
      }
    }
    if (xx != null) {
      // find if intersection point can be snapped to a nearby point
      context.eachRoad(function(other) {
        if (other == index) return;
        var ox = context.getRoadEx(other);
        var oy = context.getRoadEy(other);
        var d = Math.sqrt(Math.pow(ox - xx, 2) + Math.pow(oy - xy, 2), 2)
        if (d < context.POINT_SNAP_DISTANCE) {
          xx = ox;
          xy = oy;
        }
      })

      // update current segment to snap to point on target line
      context.Road(index, city, context.getRoadPrevious(index), null, context.getRoadType(index), xx, xy, type || 0);

    }
    if (target != null) {
      return 10 + target;
    }

    return 0;
  },
  function computePSLG(index, context) {
    return context.computePSLG([context.computeRoadPolygon(index)])
  },
  function computeVector(x, y, length, angle, context) {
    return context.computeVectorFromSegment(x, y, length, angle)
  },
  function computePolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length, width, angle)
  },
  function computeOuterPolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length + 200, width + 200, angle)
  },
  function computeSurroundingPolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length + 300, width +300, angle)
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoadSurroundingPolygon(index), 50, 400)
  }
]


Game.Generator.prototype.DEFAULT_SEGMENT_LENGTH = 3000
Game.Generator.prototype.HIGHWAY_SEGMENT_LENGTH = 4000
Game.Generator.prototype.DEFAULT_SEGMENT_WIDTH = 160
Game.Generator.prototype.HIGHWAY_SEGMENT_WIDTH = 260

// global goals
Game.Generator.prototype.HIGHWAY_BRANCH_POPULATION_THRESHOLD = 0.15;
Game.Generator.prototype.HIGHWAY_BRANCH_PROBABILITY = 0.1;
Game.Generator.prototype.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY = 5;
Game.Generator.prototype.NORMAL_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.DEFAULT_BRANCH_PROBABILITY = 0.4,

// local constraints
Game.Generator.prototype.MINIMUM_INTERSECTION_DEVIATION = 30 * Math.PI  / 180,
Game.Generator.prototype.ROAD_SNAP_DISTANCE = 1000
Game.Generator.prototype.POINT_SNAP_DISTANCE = 250

Game.Generator.prototype.RANDOM_BRANCH_ANGLE = function() {
  if (this.random() > 0.66)
    return 0
  return this.randomAngle(3);
}
Game.Generator.prototype.HIGHWAY_RANDOM_STRAIGHT_ANGLE= function() {
  return this.randomAngle(15);
}
Game.Generator.prototype.RANDOM_STEER_ANGLE= function() {
  if (this.random() > 0.95)
    return 0
  return this.randomAngle(2);
}
Game.Generator.prototype.randomRange = function(min, max) {
  return this.random()*(max - min) + min;
}
Game.Generator.prototype.randomAngle = function(limit) {
  var nonUniformNorm, val;
  nonUniformNorm = Math.pow(Math.abs(limit), 3);
  val = 0;
  while (val === 0 || this.random() < Math.pow(Math.abs(val), 3) / nonUniformNorm) {
    val = this.randomRange(-limit, +limit);
  }
  return val;
}

Game.Generator.prototype.CityRoad = function(city) {
  var queue = [];
  // create two opposite directed segments linked to each other
  var centerX = 0//this.getCityX(city)
  var centerY = 0//this.getCityY(city)
  var centerX0 = centerX + this.HIGHWAY_SEGMENT_LENGTH / 2;
  var centerX1 = centerX - this.HIGHWAY_SEGMENT_LENGTH / 2
  queue.push(0, this.Road(0, city, 1, 0, 0, centerX0, centerY))
  queue.push(0, this.Road(1, city, 0, Math.PI, 0, centerX1, centerY))

  var road = 2; 
  var count = 0;
  this.Road.count = 2;
  var limit = location.search.match(/limit=([^&]+)/);
  if (limit)
    var limit = parseFloat(limit[1])
  else
    limit = this.Road.limit || 100;
  while (count < limit) {
    if (!queue.length) {
      break
    }
    var minT = Infinity;
    var minI = null;
    var road;
    for (var i = 0; i < queue.length; i += 2) {
      var t = queue[i];
      if (t < minT) {
        minT = t;
        minI = i;
        road = queue[i + 1]
      }
    }
    if (minI != null)
      queue.splice(minI, 2);

    var collision = this.setRoadCollision(road);

    if (collision !== 1) {
      count++
      // segment that did not snap to other, can continue or branch
      if (collision === 0) {
        this.CityRoadRoad(city, road, queue, minT + 1)

      // segment that did snap may split the other road
      } else {
        var target = collision - 10;
        var xx = this.getRoadEx(road);
        var xy = this.getRoadEy(road);
        var ex = this.getRoadEx(target);
        var ey = this.getRoadEy(target);
        // split target segment
        if ((this.getRoadEx(target) != xx || this.getRoadEy(target) != xy)
          && (this.getRoadSx(target) != xx || this.getRoadSy(target) != xy)) {
            this.Road(this.Road.count, city, this.getRoadPrevious(target), null, this.getRoadType(target), xx, xy, 0, this.getRoadSx(target), this.getRoadSy(target));
            this.Road(target, city, this.Road.count, null, this.getRoadType(target), ex, ey, 0, xx, xy);
            this.Road.count++
        }
        this.setRoadCollision(road, 0)
      }
    }
  }

  var roadCount = this.Road.count;
  this.filterRoad(function(road) {
    return !this.getRoadCollision(road)
  })
  this.computeCityRoadConnectivity(0);
  this.Road.network = this.computeCityInsidePolygon(0);
  console.log('new count', this.Road.count, roadCount)
}

Game.Generator.prototype.CityRoadRoad = function(city, road, queue, priority) {
  var roadType = this.getRoadType(road);
  var nextRoad = this.Road.count;

  // continue road ahead

  if (roadType == 0)
    var roadAhead = this.Road(nextRoad++, city, road, 0, roadType, null, null, -1);
  else
    var roadAhead = this.Road(nextRoad++, city, road, this.RANDOM_STEER_ANGLE() * (Math.PI / 180), roadType, null, null, -1);

  var populationAhead = this.getRoadPopulation(roadAhead);

  // previous road was a highway
  if (roadType === 0) {

    // steer highway into direction with higher population
    var roadRandomStraight = this.Road(nextRoad++, city, road, (this.HIGHWAY_RANDOM_STRAIGHT_ANGLE()) * (Math.PI / 180), roadType, null, null, -1);
    var populationRandomStraight = this.getRoadPopulation(roadRandomStraight);
    if (populationRandomStraight > populationAhead) {
      this.moveRoad(roadRandomStraight, roadAhead)
      populationAhead = populationRandomStraight
    }
    queue.push(priority, roadAhead)
    nextRoad = roadRandomStraight;

    // make a highway T-junction
    if (populationAhead > this.HIGHWAY_BRANCH_POPULATION_THRESHOLD) {
      if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority, this.Road(nextRoad++, city, road, (90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), roadType, null, null, -1))
      else if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority, this.Road(nextRoad++, city, road, (- 90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), roadType, null, null, -1))
    }

    priority += this.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY;
      
  // continue regular road ahead
  } else {
    if (populationAhead > this.NORMAL_BRANCH_POPULATION_THRESHOLD) {
      queue.push(priority, roadAhead)
    }
  }

  // branch off regular road (even from highway)
  if (populationAhead > this.NORMAL_BRANCH_POPULATION_THRESHOLD) {
    if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
      queue.push(priority, this.Road(nextRoad++, city, road, (90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), 1, null, null, -1))
    else if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
      queue.push(priority, this.Road(nextRoad++, city, road, (- 90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), 1, null, null, -1))
  }
  
  return this.Road.count = nextRoad;
}