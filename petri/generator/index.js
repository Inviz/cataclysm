Game.Generator = function(seed, step, previous) {
  Generation.call(this, seed, step, previous);
  if (!this.Road) {
    Game.Generator.prototype.City = Game.Generator.prototype.compile(
      Game.Struct.City,      
      ['x', 'y'], 
      {previous: 'roads'}, 'city', 'cities');

    Game.Generator.prototype.Road = Game.Generator.prototype.compile(
      Game.Struct.Road,      
      ['city', 'previous', 'angle', 'type', 'ex', 'ey', 'collision', 'sx', 'sy'], 
      {previous: 'roads', city: 'cities'}, 'road', 'roads');

    Game.Generator.prototype.Wall = Game.Generator.prototype.compile(
      Game.Struct.Wall,      
      ['building', 'sx', 'sy', 'ex', 'ey', 'type', 'from', 'to', 'capStart', 'capEnd'], 
      {building: 'buildings'}, 'wall', 'walls');

    Game.Generator.prototype.Block = Game.Generator.prototype.compile(
      Game.Struct.Block,      
      ['road', 'loop', 'type', 'x', 'y', 'angle'], 
      {road: 'roads'}, 'block', 'blocks');

    Game.Generator.prototype.Building = Game.Generator.prototype.compile(
      Game.Struct.Building,  
      ['block', 'road', 'x', 'y', 'offsetAngle'], 
      {road: 'roads', block: 'blocks'}, 'building', 'buildings');

    Game.Generator.prototype.Room = Game.Generator.prototype.compile(
      Game.Struct.Room,      
      ['building', 'number', 'origin', 'collision', 'x', 'y', 'width', 'height'], 
      {building: 'buildings', origin: 'rooms'}, 'room', 'rooms');

    Game.Generator.prototype.Furniture = Game.Generator.prototype.compile(
      Game.Struct.Furniture, 
      ['room', 'building', 'x', 'y', 'angle', 'offsetAngle', 'anchor', 'type', 'previous'], 
      {building: 'buildings', room: 'rooms'}, 'furniture');

    Game.Generator.prototype.Equipment = Game.Generator.prototype.compile(
      Game.Struct.Equipment, 
      ['room', 'building', 'furniture'], 
      {}, 'equipment');
  }
  this.cities    = new Float64Array(previous ? previous.cities    : this.Block.size * 100);
  this.blocks    = new Float64Array(previous ? previous.blocks    : this.Block.size * 10000);
  this.roads     = new Float64Array(previous ? previous.roads     : this.Road.size * 10000);
  this.buildings = new Float64Array(previous ? previous.buildings : this.Building.size * 10000);
  this.rooms     = new Float64Array(previous ? previous.rooms     : this.Room.size * 10000);
  this.furniture = new Float64Array(previous ? previous.furniture : this.Furniture.size * 100000);
  this.equipment = new Float64Array(previous ? previous.equipment : this.Equipment.size * 10000);
  this.walls     = new Float64Array(previous ? previous.walls     : this.Wall.size * 10000);

}

Game.Generator.prototype = Object.create(Generation.prototype)

Game.Generator.prototype.advance = function() {
  var step = this.step = this.step + 1;
  var city = 0;
  // set up city settings
  this.City(city);

  // generate roads
  this.CityRoad(city)

  // generate blocks
  this.CityBlock(city);

  // fill blocks with multi-room buildings
  this.eachBlock(function(block) {
    // place a building at one of block's anchor points
    this.BlockBuildings(block, function(building) {
      // allocate larger building zones 
      this.BuildingRoomZones(building)
      // produce entrance door at anchor point
      this.BuildingWallEntrance(building)
      // make corridor room that connects all remote zones to main zone
      this.BuildingCorridorRoom(building, function(building, corridor) {
        // connect all zones to corridor
        this.BuildingRoomWallDoor(building, corridor)
      })
      // connect adjacent zones unless they both have doors to corridor 
      this.BuildingRoomWallDoor(building)
      // divide zones into rooms
      this.BuildingRooms(building, function(building, from, to) {
        // connect divided rooms
        this.BuildingRoomWallDoor(building, from, to)
      })
    })
  })
  // place windows in rooms
  this.eachRoom(function(room) {
    this.BuildingRoomWallWindows(this.getRoomBuilding(room), room)
  });
  // register walls not intersecting doors or windows 
  this.eachBuilding(function(building) {
    this.BuildingWalls(building);
  })
  // fill rooms with furniture
  this.eachRoom(function(room) {
    this.BuildingRoomFurniture(this.getRoomBuilding(room), room, function(building, room, furniture) {
      // generate dependent furniture (i.e. chairs around a table)
      this.BuildingRoomFurnitureFurniture(building, room, furniture)
    })
  })


  return this;
}

Game.Struct = {};
Game.Distributions = {};
Game.Objects = {};
Game.MASK = {
  INSIDE: 1,
  OUTSIDE: 2,
  ALONG: 4,
  AROUND: 8,

  INWARDS: 16,
  OUTWARDS: 32,
  OPPOSITE: 64,
  CORNER: 128,
  TOP: 256,
  CENTER: 512,

}


Game.compile = function() {
  Game.ANCHOR = {};
  for (var p1 in Game.MASK) {
    Game.ANCHOR[p1] = Game.MASK[p1]
    for (var p2 in Game.MASK)
      Game.ANCHOR[p1 + '_' + p2] = Game.MASK[p1] | Game.MASK[p2]
  }
  Game.compile.Blueprint(Game.Distributions.Rooms)
  Game.compile.Furniture()

}
Game.compile.Blueprint = function(blueprint, root) {
  var weights = [];
  for (var property in blueprint) {
    if (typeof blueprint[property] == 'object') {
      Game.compile.Blueprint(blueprint[property], root || blueprint)
    } else {
      if (Game.ANCHOR[property])
        weights.push(blueprint[property], Game.ANCHOR[property]);
    }
  }
  if (weights)
    blueprint.weights = weights;
}
Game.compile.Furniture = function() {
  var index = 0;
  for (var property in Game.Furniture) {
    Game.Furniture[index] = Game.Furniture[property]
    Game.Furniture[property].index = index++;
    Game.Furniture[property].name = property;
  }
  var index = 0;
  for (var property in Game.Constructions) {
    var number = Game.Constructions[property].index || index++;
    Game.Constructions[number] = Game.Constructions[property]
    Game.Constructions[property].index = number;
    Game.Constructions[property].name = property;
  }
}