Game.Generator = function(seed, step, previous) {
  Generation.call(this, seed, step, previous);
  if (!this.Road) {
    Game.Generator.prototype.City = Game.Generator.prototype.compile(
      Game.Struct.City,      
      ['x', 'y'], 
      {previous: 'roads'}, 'city', 'cities');

    Game.Generator.prototype.Road = Game.Generator.prototype.compile(
      Game.Struct.Road,      
      ['previous', 'angle', 'type', 'ex', 'ey', 'collision'], 
      {previous: 'roads'}, 'road', 'roads');

    Game.Generator.prototype.Block = Game.Generator.prototype.compile(
      Game.Struct.Block,      
      ['road', 'loop', 'type', 'x', 'y', 'angle'], 
      {road: 'roads'}, 'block', 'blocks');

    Game.Generator.prototype.Building = Game.Generator.prototype.compile(
      Game.Struct.Building,  
      ['road', 'x', 'y', 'offsetAngle'], 
      {road: 'roads', block: 'blocks'}, 'building', 'buildings');

    Game.Generator.prototype.Room = Game.Generator.prototype.compile(
      Game.Struct.Room,      
      ['building', 'number', 'origin'], 
      {building: 'buildings', origin: 'rooms'}, 'room', 'rooms');

    Game.Generator.prototype.Furniture = Game.Generator.prototype.compile(
      Game.Struct.Furniture, 
      ['room', 'building', 'x', 'y', 'angle', 'anchor'], 
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

  // fill blocks with buildings, rooms and furniture
  this.eachBlock(function(block) {
    this.BlockBuilding(block, function(building) {
      this.BuildingRoom(building, function(building, room) {
        this.BuildingRoomFurniture(building, room, function(building, room, furniture) {
          this.BuildingRoomFurnitureFurniture(building, room, furniture)
        })
      })
    })
  })


  return this;
}

Game.Struct = {};


Game.Distributions = {};
Game.Distributions.Rooms = {
  residence: {
    living_room: 1,
    kitchen: 1,
    pantry: 1
  }
}
Game.Distributions.Furniture = {
  living_room: {
    INSIDE_CENTER: {
      table: 0.8,
      sofa: 0.7
    },
    INSIDE_CORNER: {
      lamp: 0.5
    },
    ALONG_INWARDS: {
      shelf: 0.15
    }
  }
}
Game.Distributions.Objects = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      magazine: 0.2
    },
    OUTSIDE_INWARDS: {
      chair: 0.8
    }
  },

  chair: {
    INSIDE_TOP: {
      magazine: 0.2
    }
  }
}

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
Game.ANCHORS = {};
for (var p1 in Game.MASK) {
  Game.ANCHORS[p1] = Game.MASK[p1]
  for (var p2 in Game.MASK)
    Game.ANCHORS[p1 + '_' + p2] = Game.MASK[p1] | Game.MASK[p2]
}
