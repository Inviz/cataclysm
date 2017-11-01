function Noise(vx, vy) {
  var Cx =   0.211324865405187;  // (3.0-sqrt(3.0))/6.0
  var Cy =   0.366025403784439;  // 0.5*(sqrt(3.0)-1.0)
  var Cz =  -0.577350269189626;  // -1.0 + 2.0 * C.x
  var Cw =   0.024390243902439; // 1.0 / 41.0

// First corner

  var idot = (vx * Cy) + (vy * Cy)
  var ix = Math.floor(vx + idot)
  var iy = Math.floor(vy + idot)

  var x0dot = (ix * Cx) + (iy * Cx)
  var x0x = vx - ix + x0dot
  var x0y = vy - iy + x0dot

// Other corners
  var i1x = x0x > x0y ? 1 : 0;
  var i1y = x0x > x0y ? 0 : 1;

  var x12x = x0x + Cx;
  var x12y = x0y + Cx;
  var x12z = x0x + Cz;
  var x12w = x0y + Cz;

  x12x -= i1x
  x12y -= i1y

// Permutations
  // Avoid truncation effects in permutation
  ix %= 289;
  iy %= 289;

  var tx = iy
  var ty = iy + i1y
  var tz = iy + 1

  tx = ((tx * 34 + 1) * tx) % 289;
  ty = ((ty * 34 + 1) * ty) % 289;
  tz = ((tz * 34 + 1) * tz) % 289;

  tx = tx + ix
  ty = ty + ix + i1x
  tz = tz + ix + 1

  var px = ((tx * 34 + 1) * tx) % 289;
  var py = ((ty * 34 + 1) * ty) % 289;
  var pz = ((tz * 34 + 1) * tz) % 289;

  var mx = Math.max(0, 0.5 - ((x0x * x0x) + (x0y * x0y)))
  var my = Math.max(0, 0.5 - ((x12x * x12x) + (x12y * x12y)))
  var mz = Math.max(0, 0.5 - ((x12z * x12z) + (x12w * x12w)))

  mx = Math.pow(mx, 4);
  my = Math.pow(my, 4);
  mz = Math.pow(mz, 4);

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  var xx = 2 * ((px * Cw) % 1) - 1
  var xy = 2 * ((py * Cw) % 1) - 1
  var xz = 2 * ((pz * Cw) % 1) - 1

  var hx = Math.abs(xx) - 0.5
  var hy = Math.abs(xy) - 0.5
  var hz = Math.abs(xz) - 0.5

  var oxx = Math.floor(xx + 0.5)
  var oxy = Math.floor(xy + 0.5)
  var oxz = Math.floor(xz + 0.5)

  var a0x = xx - oxx
  var a0y = xy - oxy
  var a0z = xz - oxz

  mx *= 1.79284291400159 - 0.85373472095314 * (a0x * a0x + hx * hx)
  my *= 1.79284291400159 - 0.85373472095314 * (a0y * a0y + hy * hy)
  mz *= 1.79284291400159 - 0.85373472095314 * (a0z * a0z + hz * hz)

  var gx = a0x * x0x + hx * x0y;
  var gy = a0y * x12x + hy * x12y;
  var gz = a0z * x12z + hz * x12w;

  return 130 * ((gx * mx) + (gy * my) + (gz * mz));
}

Game = {}

Game.random = function(seed, counter) {
  x = (171 * x) % 30269;
  y = (172 * y) % 30307;
  z = (170 * z) % 30323;
  return (x / 30269.0 + y / 30307.0 + z / 30323.0) % 1.0;
}
Game.random.seed = function(seed) {

}
Game.Action = {
  get_food: function() {
    
  },
  get_safe: function() {
    
  }
};

var index = 0;
for (var name in Game.Action) {
  Game.Action[name].index = index++;
}

Game.Area = [
  function temperature(temperature, simulation) {
    return temperature + ((simulation.step % 10) && (simulation.random() >= 0.5 ? 1 : -1));
  }
]

Game.Zone = [
  function cloudiness(cloudiness, simulation, index) {
    return (Noise(
      simulation.seed + simulation.step / 100,
      simulation.seed + index
    ) / 2 + 0.5) * 100
  },

  function light(light, simulation, index) {
    return (Noise(
      simulation.seed + 1000 + simulation.step / 100,
      simulation.seed + 1000 + index
    ) / 2 + 0.5) * 100
  },

  function temperature(temperature, area, holes) {
    if (holes > 1)
      return 0

    return temperature + (area.temperature - temperature)
  }
]

Game.Creature = [
  function hunger(hunger, simulation) {
    return Math.min(100, hunger + (simulation.step % 10 === 0));
  },

  // multiple transitions
  function fear_calming_down(fear) {
    return fear - fear / 100
  },

  function fear_from_damage(fear, damage) {
    return fear + Math.min(10, damage);
  },

  function fear_from_loud_noises(fear, noise) {
    return fear + Math.min(10, Math.max(0, (noise - 10)));
  },

  // exclusive sources of change 
  function room_temperature(temperature, zone, area) {
    if (zone)
      return temperature + (zone.temperature - temperature) / 10
    else 
      return temperature + (area.temperature - temperature) / 10
    return temperature
  },

  // decide action via in-place sorting by dynamic priority
  function action_got_hungry(action, hunger) {
    var priority = hunger;
    if (hunger > 1 && action % 1000 < priority) {
      return Game.Action.get_food.index * 1000 + priority
    }
    return action
  },

  function action_got_fearful(action, fear) {
    var priority = fear;
    if (fear > 50 && action % 1000 < priority) {
      return Game.Action.get_safe.index * 1000 + priority
    }
    return action
  }

]







/*

  function consume_food(hunger, Food) {
    return hunger + Food.nutrition
  },

  function Food(zone) {
    return zone.food
  },

  function Food(food) {
    return food
  },
*/



Game.Building = {

}

function Simulation(step, seed, previous) {
  this.seed = seed;
  this.setSeed(previous ? Math.floor(previous.random() * 100000000) : seed)
  this.step      = step;
  this.creatures = new Uint32Array(previous ? previous.creatures : this.Creature.size * 10000);
  this.areas     = new Uint32Array(previous ? previous.areas : this.Area.size * 10000);
  this.zones     = new Uint32Array(previous ? previous.zones : this.Zone.size * 10000);
}
Simulation.prototype.advance = function() {
  var step = this.step = this.step + 1;
  this.Area('areas', 0, this)
  for (var i = 0; i < 10; i++)
    this.Zone('zones', i, this)
  for (var i = 0; i < 10000; i++) {
    this.Creature('creatures', i, this)
  }
  return this;
}
Simulation.prototype.next = function() {
  return new Simulation(this.step, this.seed, this).advance()
}

Simulation.prototype.setSeed = function(seed) {
  this.seedX = (seed % 30268) + 1;
  seed = (seed - (seed % 30268)) / 30268;
  this.seedY = (seed % 30306) + 1;
  seed = (seed - (seed % 30306)) / 30306;
  this.seedZ = (seed % 30322) + 1;
}

Simulation.prototype.random = function() {
  return ((this.seedX = (171 * this.seedX) % 30269) / 30269.0 + 
          (this.seedY = (172 * this.seedY) % 30307) / 30307.0 + 
          (this.seedZ = (170 * this.seedZ) % 30323) / 30323.0) % 1.0;
}

Simulation.prototype.compile = function(functions, properties, relations, name) {
  var attributes = {}
  var size = 0;

  // access functions as strings
  functions = functions.map(function(fn) {
    return fn.toString()
  })

  // index all attributes used in function
  var allArgs = functions.map(function(fn) {
    return fn.match(/\(\s*(.*?)\s*\)/)[1].split(/\s*,\s*/).map(function(arg, index) {
      if (properties.indexOf(arg) == -1)
        if (attributes[arg] == null)
          attributes[arg] = size++
      return arg;
    })
  })

  // fetch/store arguments as array indecies
  var self = this;
  var invocations = functions.map(function(fn, index) {
    var args = allArgs[index];
    var attribute = attributes[args[0]]
    var prefix = 'data[start + ';
    var suffix = ']';
    // pass context to reference relations
    args.forEach(function(arg) {
      if (relations[arg] && args.indexOf('simulation') == -1) {
        args.push('simulation')
        functions[index] = functions[index].replace(')', ', simulation)')
      }
    })
    var name = fn.match(/function\s+(\w+)/)[1]
    return prefix + attributes[args[0]] + suffix + ' = ' + name + '(' + args.map(function(arg) {
      if (properties.indexOf(arg) > -1 || arg === 'index')
        return arg
      return prefix + attributes[arg] + suffix 
    }).join(', ') + ')'
  });

  var related = ''
  for (var property in relations)
    related = 'var ' + property + ' = this[' + relations[property] + ']' 
  var result = new Function( 
    // bake functions into local context
    functions.join('\n')

      // replace constants 
      .replace(/Game\.Action\.(\w+)\.index/g, function(m, key) {
        return Game.Action[key].index

      // convert relations into array lookups
      }).replace(/(\w+)\.(\w+)/g, function(m, object, key) {
        if (!relations[object])
          return m;
        var type = self[object.charAt(0).toUpperCase() + object.substring(1)];
        var index = type.attributes[key]
        var size = type.size;
        return 'simulation.' + relations[object] + '[' + object + ' * ' + size + ' + ' + index + ']'
      }) + '\n'

    // 
    + 'return (function ' + name + ' (key, index, ' + properties.join(',') + ') {\n'
    + 'var data = this[key];'
    + 'var start = index * ' + size + ';\n'
    + invocations.join(';\n')
    + '})')()

  result.size = size;
  result.attributes = attributes
  return result;
}

Simulation.prototype.Area     = Simulation.prototype.compile(Game.Area, ['simulation'], {}, 'area');
Simulation.prototype.Zone     = Simulation.prototype.compile(Game.Zone, ['simulation'], {area: 'areas'}, 'Zone');
Simulation.prototype.Creature = Simulation.prototype.compile(Game.Creature, ['simulation'], {zone: 'zones', area: 'areas'}, 'Creature');

function Test() {
  var state = new Simulation(0, 123)
  state.areas[0] = 10000
  state.areas[1] = 10000
  var states = [];
  for (var x = 0; x < 10000; x++) {
    state = state.advance()
    states.push(state);
    if (states.length > 5)
      states.pop()
  }
  state.history = states
  return state
}

var state = Test()
//console.log(state, Simulation.prototype.Creature)