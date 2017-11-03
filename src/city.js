
function City(size) {

    branchAngleDev = 3;

    forwardAngleDev = 15;

    randomAngle = function(limit) {
      var nonUniformNorm, val;
      nonUniformNorm = Math.pow(Math.abs(limit), 3);
      val = 0;
      while (val === 0 || Math.random() < Math.pow(Math.abs(val), 3) / nonUniformNorm) {
        val = Mapgen.math.randomRange(-limit, +limit);
      }
      return val;
    };
    Mapgen.config.mapGeneration.BUILDING_PLACEMENT_LOOP_LIMIT = 3
    Mapgen.config.mapGeneration.DEFAULT_SEGMENT_LENGTH = 300
    Mapgen.config.mapGeneration.HIGHWAY_SEGMENT_LENGTH = 250
    Mapgen.config.mapGeneration.DEFAULT_SEGMENT_WIDTH = 30
    Mapgen.config.mapGeneration.HIGHWAY_SEGMENT_WIDTH = 60
    Mapgen.config.mapGeneration.RANDOM_BRANCH_ANGLE = function() {
      return randomAngle(branchAngleDev);
    },
    Mapgen.config.mapGeneration.RANDOM_STRAIGHT_ANGLE= function() {
      return randomAngle(forwardAngleDev);
    },
    Mapgen.config.mapGeneration.DEFAULT_BRANCH_PROBABILITY = 0.5
    Mapgen.config.mapGeneration.HIGHWAY_BRANCH_PROBABILITY = 0.04
    Mapgen.config.mapGeneration.HIGHWAY_BRANCH_POPULATION_THRESHOLD = 0.1
    Mapgen.config.mapGeneration.NORMAL_BRANCH_POPULATION_THRESHOLD = 0.1
    Mapgen.config.mapGeneration.NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY = 5
    Mapgen.config.mapGeneration.MINIMUM_INTERSECTION_DEVIATION = 30
    Mapgen.config.mapGeneration.SEGMENT_COUNT_LIMIT = 150
    Mapgen.config.mapGeneration.DEBUG_DELAY = 0
    Mapgen.config.mapGeneration.ROAD_SNAP_DISTANCE = 50
    Mapgen.config.mapGeneration.HEAT_MAP_PIXEL_DIM = 50
    Mapgen.config.mapGeneration.DRAW_HEATMAP = false
    Mapgen.config.mapGeneration.QUADTREE_PARAMS= {
      x: -10000,
      y: -10000,
      width: 40000,
      height: 40000
    },
    Mapgen.config.mapGeneration.QUADTREE_MAX_OBJECTS = 10
    Mapgen.config.mapGeneration.QUADTREE_MAX_LEVELS = 10
    Mapgen.config.mapGeneration.DEBUG = false

  var size = 0.25//Math.random();
  Mapgen.config.mapGeneration.SEGMENT_COUNT_LIMIT = 100 + size * 200
  var map = Mapgen.generate(2)

  var qTree = map.qTree
  var buildings = []
  var callback = function(){
    return BuildGen.buildingFactory.fromProbability(new Date().getTime())
  }
  for (var i = 0; i < map.segments.length; i ++) {
    var segment = map.segments[i]

    if (i % 20 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;

    if (segment.links.f.length) {
      var links = 3// + Math.floor(Math.random() * 5) 
      var distance = 400;
    } else {
      var links = 3// + Math.floor(Math.random() * 5) 
      var distance = 200;
    }
    var newBuildings = BuildGen.buildingFactory.aroundSegment(
      callback,
      segment, 
      links, distance, qTree
    )
    newBuildings.forEach(function(building) {
      qTree.insert(building.collider.limits())

    })
    buildings = buildings.concat(newBuildings)
  }

  map.buildings = buildings;
  return map
};
