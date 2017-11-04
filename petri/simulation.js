
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
