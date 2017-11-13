Game.Struct.Road = [
  function setType (type) {
    return type
  },
  function setPrevious (previous) {
    return previous
  },
  function setAngle (angle, previous) {
    return angle + previous.angle
  },
  function setWidth (width, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_WIDTH : context.DEFAULT_SEGMENT_WIDTH;
  },
  function setLength (length, type, context) {
    return type === 0 ? context.HIGHWAY_SEGMENT_LENGTH : context.DEFAULT_SEGMENT_LENGTH;
  },
  function setEX (ex, x, previous, angle, length) {
    if (x != null)
      return x + Math.cos(angle * (Math.PI / 180)) * length / 2;
    return previous.ex + Math.cos(angle * (Math.PI / 180)) * length;
  },
  function setEY (ey, y, previous, angle, length) {
    if (y != null)
      return y + Math.sin(angle * (Math.PI / 180)) * length / 2;
    return previous.ey + Math.sin((angle) * (Math.PI / 180)) * length;
  },
  function setX (x, ex, angle, length) {
    if (x != null)
      return x;
    return ex - Math.cos((angle) * (Math.PI / 180)) * length / 2;
  },
  function setY (y, ey, angle, length) {
    if (y != null)
      return y;
    return ey - Math.sin((angle) * (Math.PI / 180)) * length / 2;
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
  function setPopulation(population, index, context) {
    var vector = context.computeRoadVector(index);
    return (context.computeTripleNoise(vector[0].x, vector[0].y) 
          + context.computeTripleNoise(vector[1].x, vector[1].y)) / 2;
  },
  function collide(collision) {
    return 0;
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
  queue.push(0, this.Road(0, 1, 0, 0, centerX, centerY))
 queue.push(0, this.Road(1, 0, 180, 0))

  var roadIndex = 2; 
  var count = 0;
  this.Road.count = 2;
  while (count <25) {
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
    count++

    //if (!this.getRoadCollision(roadIndex)) {
     this.CityRoadRoad(city, roadIndex, queue, minT)
    //}
  }
}

Game.Generator.prototype.CityRoadRoad = function(city, road, queue, priority) {
  var roadType = this.getRoadType(road);
  //var roadAngle = this.getRoadAngle(road);
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
      queue.push(priority, roadRandomStraight)
    } else { 
      queue.push(priority, roadAhead)
    }

    // make a highway T-junction
    if (Math.max(populationRandomStraight, populationAhead) > this.HIGHWAY_BRANCH_POPULATION_THRESHOLD) {
      var delay = this.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY;
      if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority + delay, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), roadType))
      else if (this.random() < this.HIGHWAY_BRANCH_PROBABILITY)
        queue.push(priority + delay, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), roadType))
    }

  // continue regular road ahead
  } else {
    if (populationAhead > this.NORMAL_BRANCH_POPULATION_THRESHOLD) {
      queue.push(priority, roadAhead)
    }
  }

  // branch off regular road (even from highway)
  if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
    queue.push(priority, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), 0))
  else if (this.random() < this.DEFAULT_BRANCH_PROBABILITY)
    queue.push(priority, this.Road(roadIndex++, road, 90 + this.RANDOM_BRANCH_ANGLE(), 0))

  
  return this.Road.count = roadIndex;
}

Game.Generator.prototype.DEFAULT_SEGMENT_LENGTH = 300
Game.Generator.prototype.HIGHWAY_SEGMENT_LENGTH = 400
Game.Generator.prototype.DEFAULT_SEGMENT_WIDTH = 6
Game.Generator.prototype.HIGHWAY_SEGMENT_WIDTH = 16
Game.Generator.prototype.SEGMENT_COUNT_LIMIT = 100

// global goals
Game.Generator.prototype.HIGHWAY_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.HIGHWAY_BRANCH_PROBABILITY = 0.05;
Game.Generator.prototype.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY = 5;
Game.Generator.prototype.NORMAL_BRANCH_POPULATION_THRESHOLD = 0.1;
Game.Generator.prototype.DEFAULT_BRANCH_PROBABILITY = 0.4,
      
Game.Generator.prototype.MINIMUM_INTERSECTION_DEVIATION = 30,

Game.Generator.prototype.RANDOM_BRANCH_ANGLE = function() {
  return Game.Generator.randomAngle(3);
}
Game.Generator.prototype.RANDOM_STRAIGHT_ANGLE= function() {
  return Game.Generator.randomAngle(15);
}
Game.Generator.randomRange = function(min, max) {
  return Math.random()*(max - min) + min;
}
Game.Generator.randomAngle = function(limit) {
  var nonUniformNorm, val;
  nonUniformNorm = Math.pow(Math.abs(limit), 3);
  val = 0;
  while (val === 0 || Math.random() < Math.pow(Math.abs(val), 3) / nonUniformNorm) {
    val = Game.Generator.randomRange(-limit, +limit);
  }
  return val;
}