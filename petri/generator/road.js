Game.Struct.Road = [
  function setType (type) {
    return type
  },
  function setPrevious (previous) {
    return previous
  },
  function setAngle (angle, previous, ex, ey) {
    if (angle == null) {
      return Math.atan2(ey - previous.ey, ex - previous.ex) * 180 / Math.PI;
    }
    return angle + previous.angle
  },
  function setWidth (width, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_WIDTH : context.DEFAULT_SEGMENT_WIDTH;
  },
  function setLength (length, type, context, angle, ex, ey, previous) {
    if (ex != null) {
      return Math.sqrt(Math.pow(previous.ex - ex, 2) + Math.pow(previous.ey - ey, 2), 2)
    }
    return type === 0 ? context.HIGHWAY_SEGMENT_LENGTH : context.DEFAULT_SEGMENT_LENGTH;
  },
  function setEx (ex, previous, angle, length) {
    if (ex != null)
      return ex
    return previous.ex + Math.cos(angle * (Math.PI / 180)) * length;
  },
  function setEy (ey, previous, angle, length) {
    if (ey != null)
      return ey
    return previous.ey + Math.sin(angle * (Math.PI / 180)) * length;
  },
  function setX (x, ex, angle, length) {
    return ex - Math.cos(angle * (Math.PI / 180)) * length / 2;
  },
  function setY (y, ey, angle, length) {
    return ey - Math.sin(angle * (Math.PI / 180)) * length / 2;
  },
  function setSx (sx, ex, angle, length) {
    return ex - Math.cos(angle * (Math.PI / 180)) * length;
  },
  function setSy (sy, ey, angle, length) {
    return ey - Math.sin(angle * (Math.PI / 180)) * length;
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
      return 200
    else
      return 100;
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
      if (other == index || (context.getRoadCollision(other) > 10) || (other < 2 && index < 2))
        continue;
      // create crossroads on line intersection
      if (type <= 3) {
        var intersection = checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4)
        if (intersection && (intersection.x != x1 || intersection.y != y1)) {
          var distance = Math.sqrt(Math.pow(x1 - intersection.x, 2) + Math.pow(y1 - intersection.y, 2), 2);
          if (delay == null || distance < delay) {
            var target = other;
            var xn = intersection.x;
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
          var xn = x4;
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
          var xn = closest.x;
          var xy = closest.y;
          var type = 1;

          // split other path at the point
          var angleDiff = Math.abs(((context.getRoadAngle(index) % 180) + 180) - ((context.getRoadAngle(target) % 180) + 180))
          if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) 
            return type + (other + 1) * 10;

        }
      }

    }
    switch (type) {
      case 0: case 1: case 3: 
        minDegreeDifference = function(d1, d2) {
          var diff;
          diff = Math.abs(d1 - d2) % 180;
          return Math.min(diff, Math.abs(diff - 180));
        }
        // split other path at the point
        var angleDiff = Math.abs(((context.getRoadAngle(index) % 180) + 180) - ((context.getRoadAngle(target) % 180) + 180))
        if (angleDiff < context.MINIMUM_INTERSECTION_DEVIATION) 
          return type + (other + 1) * 10;

        //other.split(intersection, segment, segments, qTree)
        //segment.r.end = intersection
        break;

      // snap our path to their point
      case 2:
        //segment.r.end = point
        break;
    }
    if (xn != null) {
      context.Road(index, context.getRoadPrevious(index), null, context.getRoadType(index), xn, xy, type || 0);
      //context.Road(index, )
    }
    return type || 0;
  },
  function computePSLG(index, context) {
    return context.computePSLG([context.computeRoadPolygon(index)])
  },
  function computeVector(x, y, length, angle, context) {
    return context.computeVectorFromSegment(x, y, length, angle * (Math.PI / 180))
  },
  function computePolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length, width, angle * (Math.PI / 180))
  },
  function computeOuterPolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length + 20, width + 10, angle * (Math.PI / 180))
  },
  function computeSurroundingPolygon(x, y, width, length, angle, context) {
    return context.computePolygonFromRotatedRectangle(x, y, length + 60, width + 60, angle * (Math.PI / 180))
  },
  function computeAnchorPoints(index, context) {
    return context.computeAnchorPoints(context.computeRoadSurroundingPolygon(index), 5, 40)
  }
]

Game.Generator.prototype.CityRoad = function(city) {
  var queue = [];
  var centerX = 2000;
  var centerY = 1500;
  var roadIndex = 1;
  // create two opposite directed segments linked to each other
  queue.push(0, this.Road(0, 1, 0, 0, centerX + this.HIGHWAY_SEGMENT_LENGTH / 2, centerY))
   queue.push(0, this.Road(1, 0, 180, 0, centerX - this.HIGHWAY_SEGMENT_LENGTH / 2, centerY))

  var roadIndex = 2; 
  var count = 0;
  this.Road.count = 2;
  while (count < 150) {
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
    if (!Math.floor(collision / 10)) {
      count++

      if (!collision) 
        this.CityRoadRoad(city, roadIndex, queue, minT + 1)
    }
  }
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
    var roadRandomStraight = this.Road(roadIndex++, road, this.RANDOM_STRAIGHT_ANGLE(), roadType);
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
        queue.push(priority, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), roadType))
      else if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority, this.Road(roadIndex++, road, - 90 + this.RANDOM_BRANCH_ANGLE(), roadType))
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
      queue.push(priority, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), 1))
    else if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
      queue.push(priority, this.Road(roadIndex++, road, - 90 + this.RANDOM_BRANCH_ANGLE(), 1))
  }
  
  return this.Road.count = roadIndex;
}

Game.Generator.prototype.DEFAULT_SEGMENT_LENGTH = 300
Game.Generator.prototype.HIGHWAY_SEGMENT_LENGTH = 400
Game.Generator.prototype.DEFAULT_SEGMENT_WIDTH = 6
Game.Generator.prototype.HIGHWAY_SEGMENT_WIDTH = 16
Game.Generator.prototype.SEGMENT_COUNT_LIMIT = 100

Game.Generator.prototype.ROAD_SNAP_DISTANCE = 100
// global goals
Game.Generator.prototype.HIGHWAY_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.HIGHWAY_BRANCH_PROBABILITY = 0.05;
Game.Generator.prototype.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY = 5;
Game.Generator.prototype.NORMAL_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.DEFAULT_BRANCH_PROBABILITY = 0.3,
      
Game.Generator.prototype.MINIMUM_INTERSECTION_DEVIATION = 30,

Game.Generator.prototype.RANDOM_BRANCH_ANGLE = function() {
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