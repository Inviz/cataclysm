Generation = function() {

}

Generation.prototype = Object.create(Simulation.prototype)

Generation.prototype.Room     = Generation.prototype.compile(Game.Room, ['simulation'], {}, 'room');
Generation.prototype.Points   = Generation.prototype.compile(Game.Room, ['simulation', 'room'], {}, 'room');
