Game.Struct.Road = [
  function setType (type) {
    return type
  },
  function setPrevious (previous) {
    return previous
  },
  function setAngle (angle, previous, ex, ey) {
    if (angle == null) {
      return Math.atan2(ey - previous.ey, ex - previous.ex)
    }
    return angle + previous.angle
  },
  function setWidth (width, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_WIDTH : context.DEFAULT_SEGMENT_WIDTH;
  },
  function setLength (length, type, context, ex, ey, previous, index) {
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
      return context.random > 0.8 ? 2 : 1
    }
  },
  function setRange(range, connectivity) {
    if (connectivity)
      return 2000
    else
      return 1000;
  },
  function setPopulation(population, index, context) {
    var vector = context.computeRoadVector(index);
    return (context.computeTripleNoise(context.getRoadSx(index), context.getRoadSy(index)) 
          + context.computeTripleNoise(context.getRoadEx(index), context.getRoadEy(index))) / 2;
  },
  function collide(collision, index, context) {
    if (collision != null)
      return collision;
    var type = null;
    var x1 = context.getRoadSx(index)
    var y1 = context.getRoadSy(index)
    var x2 = context.getRoadEx(index)
    var y2 = context.getRoadEy(index)
    for (var other = 0; other < context.Road.count; other++) {
      var x3 = context.getRoadSx(other)
      var y3 = context.getRoadSy(other);
      var x4 = context.getRoadEx(other)
      var y4 = context.getRoadEy(other);
      if (other == index || (context.getRoadCollision(other) == 1) || (other < 2 && index < 2))
        continue;
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
        }
      }
      // snap to closest road
      var closest = closestOnLineXY(x2, y2, x3, y3, x4, y4);
      var closestDistance = Math.sqrt(Math.pow(x2 - closest.x, 2) + Math.pow(y2 - closest.y, 2), 2);
      if (closestDistance < context.ROAD_SNAP_DISTANCE) {

        if (type <= 1) {
          var target = other;
          var xx = closest.x;
          var xy = closest.y;
          var type = 1;

          // split other path at the point
          var angleDiff = Math.abs(((context.getRoadAngle(index) % Math.PI) + Math.PI) - ((context.getRoadAngle(target) % Math.PI) + Math.PI))
          if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) 
            return 1;

        }
      }

    }
    switch (type) {
      case 0: case 1: case 3: 
        // split other path at the point
        var angleDiff = Math.abs(((context.getRoadAngle(index) % Math.PI) + Math.PI) - ((context.getRoadAngle(target) % Math.PI) + Math.PI))
        if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) 
          return 1

        //other.split(intersection, segment, segments, qTree)
        //segment.r.end = intersection
        break;

      // snap our path to their point
      case 2:
        //segment.r.end = point
        break;
    }
    if (xx != null) {
      context.eachRoad(function(other) {
        if (other == index) return;
        var ox = context.getRoadEx(other);
        var oy = context.getRoadEy(other);
        var d = Math.sqrt(Math.pow(ox - xx, 2) + Math.pow(oy - xy, 2), 2)
        if (d < context.POINT_SNAP_DISTANCE) {
          xn = ox;
          xy = oy;
        }
      })
      // update current segment to snap to point on target line
      context.Road(index, context.getRoadPrevious(index), null, context.getRoadType(index), xx, xy, type || 0);
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
    return context.computePolygonFromRotatedRectangle(x, y, length + 200, width + 100, angle)
  },
  function computeSurroundingPolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length + 600, width + 600, angle)
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoadSurroundingPolygon(index), 50, 400)
  }
]

Game.Generator.prototype.CityRoad = function(city) {
  var queue = [];
  // create two opposite directed segments linked to each other
  var centerX = this.getCityX(city)
  var centerY = this.getCityY(city)
  queue.push(0, this.Road(0, 1, 0, 0, centerX + this.HIGHWAY_SEGMENT_LENGTH / 2, centerY))
  queue.push(0, this.Road(1, 0, Math.PI, 0, centerX - this.HIGHWAY_SEGMENT_LENGTH / 2, centerY))

  var roadIndex = 2; 
  var count = 0;
  this.Road.count = 2;
  var limit = location.search.match(/limit=([^&]+)/);
  if (limit)
    var limit = parseFloat(limit[1])
  else
    limit = 100;
  while (count < limit) {
    if (!queue.length) {
      break
    }
    var minT = Infinity;
    var minI = null;
    var roadIndex;
    for (var i = 0; i < queue.length; i += 2) {
      var t = queue[i];
      if (t < minT) {
        minT = t;
        minI = i;
        roadIndex = queue[i + 1]
      }
    }
    if (minI != null)
      queue.splice(minI, 2);

    var collision = this.getRoadCollision(roadIndex);
    if (collision !== 1) {
      count++

      // segment that did not snap to other, can continue or branch
      if (collision === 0) {
        this.CityRoadRoad(city, roadIndex, queue, minT + 1)

      // segment that did snap may split the other road
      } else {
        var target = collision - 10;
        var xx = this.getRoadEx(roadIndex);
        var xy = this.getRoadEy(roadIndex);
        var ex = this.getRoadEx(target);
        var ey = this.getRoadEy(target);
        // split target segment
        if (this.getRoadEx(target) != xx || this.getRoadEy(target) != xy)
          if (this.getRoadSx(target) != xx || this.getRoadSy(target) != xy) {
            this.Road(target, this.getRoadPrevious(target), null, this.getRoadType(target), xx, xy, 0);
            this.Road(this.Road.count++, target, null, this.getRoadType(target), ex, ey, 0);
          }
      }
    }
  }

  var roadCount = this.Road.count;
  this.filterRoad(function(road) {
    return this.getRoadCollision(road) !== 1
  })
  console.log('new count', this.Road.count, roadCount)
}

Game.Generator.prototype.CityRoadRoad = function(city, road, queue, priority) {
  var roadType = this.getRoadType(road);
  var roadIndex = this.Road.count;

  // continue road ahead

  var roadAhead = this.Road(roadIndex++, road, 0, roadType);
  var populationAhead = this.getRoadPopulation(roadAhead);

  // previous road was a highway
  if (roadType === 0) {

    // steer highway into direction with higher population
    var roadRandomStraight = this.Road(roadIndex++, road, (this.RANDOM_STRAIGHT_ANGLE()) * (Math.PI / 180), roadType);
    var populationRandomStraight = this.getRoadPopulation(roadRandomStraight);
    if (populationRandomStraight > populationAhead) {
      this.moveRoad(roadRandomStraight, roadAhead)
      populationAhead = populationRandomStraight
    }
    queue.push(priority, roadAhead)
    roadIndex = roadRandomStraight;

    // make a highway T-junction
    if (populationAhead > this.HIGHWAY_BRANCH_POPULATION_THRESHOLD) {
      if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority, this.Road(roadIndex++, road, (90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), roadType))
      else if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority, this.Road(roadIndex++, road, (- 90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), roadType))
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
      queue.push(priority, this.Road(roadIndex++, road, (90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), 1))
    else if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
      queue.push(priority, this.Road(roadIndex++, road, (- 90 + this.RANDOM_BRANCH_ANGLE()) * (Math.PI / 180), 1))
  }
  
  return this.Road.count = roadIndex;
}

Game.Generator.prototype.DEFAULT_SEGMENT_LENGTH = 3000
Game.Generator.prototype.HIGHWAY_SEGMENT_LENGTH = 4000
Game.Generator.prototype.DEFAULT_SEGMENT_WIDTH = 160
Game.Generator.prototype.HIGHWAY_SEGMENT_WIDTH = 260
Game.Generator.prototype.SEGMENT_COUNT_LIMIT = 100

// global goals
Game.Generator.prototype.HIGHWAY_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.HIGHWAY_BRANCH_PROBABILITY = 0.05;
Game.Generator.prototype.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY = 5;
Game.Generator.prototype.NORMAL_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.DEFAULT_BRANCH_PROBABILITY = 0.4,

// local constraints
Game.Generator.prototype.MINIMUM_INTERSECTION_DEVIATION = 30 * Math.PI  / 180,
Game.Generator.prototype.ROAD_SNAP_DISTANCE = 700
Game.Generator.prototype.POINT_SNAP_DISTANCE = 150

Game.Generator.prototype.RANDOM_BRANCH_ANGLE = function() {
  if (this.random() > 0.5)
    return 0
  return this.randomAngle(3);
}
Game.Generator.prototype.RANDOM_STRAIGHT_ANGLE= function() {
  return this.randomAngle(15);
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