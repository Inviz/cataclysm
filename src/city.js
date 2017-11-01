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
  Mapgen.config.mapGeneration = {
        BUILDING_PLACEMENT_LOOP_LIMIT: 3,
        DEFAULT_SEGMENT_LENGTH: 300,
        HIGHWAY_SEGMENT_LENGTH: 250,
        DEFAULT_SEGMENT_WIDTH: 30,
        HIGHWAY_SEGMENT_WIDTH: 60,
        RANDOM_BRANCH_ANGLE: function() {
          return randomAngle(branchAngleDev);
        },
        RANDOM_STRAIGHT_ANGLE: function() {
          return randomAngle(forwardAngleDev);
        },
        DEFAULT_BRANCH_PROBABILITY: 0.4,
        HIGHWAY_BRANCH_PROBABILITY: 0.05,
        HIGHWAY_BRANCH_POPULATION_THRESHOLD: 0.1,
        NORMAL_BRANCH_POPULATION_THRESHOLD: 0.1,
        NORMAL_BRANCH_TIME_DELAY_FROM_HIGHWAY: 5,
        MINIMUM_INTERSECTION_DEVIATION: 30,
        SEGMENT_COUNT_LIMIT: 150,
        DEBUG_DELAY: 0,
        ROAD_SNAP_DISTANCE: 50,
        HEAT_MAP_PIXEL_DIM: 50,
        DRAW_HEATMAP: false,
        QUADTREE_PARAMS: {
          x: -10000,
          y: -10000,
          width: 40000,
          height: 40000
        },
        QUADTREE_MAX_OBJECTS: 10,
        QUADTREE_MAX_LEVELS: 10,
        DEBUG: false
      }

  var size = 0.5//Math.random();
  Mapgen.config.mapGeneration.SEGMENT_COUNT_LIMIT = 150 + size * 200
  var map = Mapgen.generate(2)

  var qTree = map.qTree
  var buildings = []
  var callback = function(){
    return BuildGen.buildingFactory.fromProbability(new Date().getTime())
  }
  for (var i = 0; i < map.segments.length; i ++) {
    var segment = map.segments[i]

    if (i % 10 != 0 && segment.links.f.length && segment.links.f.length < 2) continue;

    if (segment.links.f.length) {
      var links = 5// + Math.floor(Math.random() * 5) 
      var distance = 400;
    } else {
      var links = 5// + Math.floor(Math.random() * 5) 
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
}