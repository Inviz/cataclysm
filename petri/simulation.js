
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
  this.Area(0)
  for (var i = 0; i < 10; i++)
    this.Zone(i)
  for (var i = 0; i < 10000; i++) {
    this.Creature(i)
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

Simulation.prototype.compileFunction = function(source, args, attributes, properties, relations, changed) {
  var attribute = attributes[args[0]]
  var prefix = 'data[start + ';
  var suffix = ']';
  // pass context to reference relations
  args.forEach(function(arg) {
    if (relations[arg] && args.indexOf('this') == -1 && args.indexOf('context') == -1) {
      args.push('context')
      source = source.replace(')', ', context)')
    }
  })
  var name = source.match(/function\s+(\w+)/)[1]
  var call = prefix + attributes[args[0]] + suffix + ' = ' + name + '(' + args.map(function(arg, i) {
    if (arg === 'context')
      return 'this'
    if (changed) {
      if (changed.indexOf(arg) == -1) {
        var computing = source.match(/function\s+compute(\w+)/);
        if (changed && i == 0 && !computing)
          changed.push(arg)
        if ((properties.indexOf(arg) > -1 && !computing) || arg === 'index')
          return arg
      }
    } else {
      if (arg == 'context')
        return 'this'
      if (i == 0 || arg == 'index')
        return arg
    }
    return prefix + attributes[arg] + suffix 
  }).join(', ') + ')'
  return {
    source: source,
    call: call,
    name: name,
    attribute: args[0]
  }

  
}
Simulation.prototype.compile = function(functions, properties, relations, name, collection) {
  var attributes = {}
  var size = 0;

  // access functions as strings

  functions = functions.map(function(fn) {
    return fn.toString()
  })

  // index all attributes used in function
  var allArgs = functions.map(function(fn) {
    return fn.match(/\(\s*(.*?)\s*\)/)[1].split(/\s*,\s*/).map(function(arg, index) {
      if (properties.indexOf(arg) == -1 || index == 0)
        if (attributes[arg] == null)
          attributes[arg] = size++
      return arg;
    })
  })


  var self = this;
  var changed = [];

  var setters = [];
  var invocations = functions.map(function(fn, index) {
    var compiled = this.compileFunction(fn, allArgs[index], attributes, properties, relations, changed)
    functions[index] = compiled.source;
    if (compiled.name.match(/^set[A-Z]/))
      setters.push(this.compileFunction(fn, allArgs[index], attributes, properties, relations))
    return compiled.call;
  }, this)


  // fetch/store arguments as array indecies
  var prefix = name.charAt(0).toUpperCase() + name.substring(1)
  var related = ''
  for (var property in relations)
    related = 'var ' + property + ' = this[' + relations[property] + ']' 
  if (!collection)
    collection = name;

  this['each' + prefix] = function(callback) {
    var count = this[prefix].count;
    for (var index = 0; index < count; index++)
      callback.call(this, index)
  }

  var memo = prefix + 'Memoization'
  this[memo] = [];
  var computedProperties = {};
  var immediate = invocations.filter(function(invocation, index) {
    var prop = functions[index].match(/function\s+compute(\w+)/)

    if (prop) {
      computedProperties['compute' + prefix + prop[1]] = 
        new Function(
          functions[index] + '\n'
        + 'return function compute' + prefix + prop[1] + ' (index) {\n'
        + 'if (isNaN(index) || Math.floor(index) !== index) throw "Incorrect index in \\"compute' + prefix + prop[1] +'\\"";'
        + 'var data = this.' + collection + ';\n'
        + 'var start = index * ' + size + ';\n'
        + 'if (!this.computed' + prefix + prop[1] + ') this.' + memo + '.push(this.computed' + prefix + prop[1] + ' = {});\n' 
        + 'return (this.computed' + prefix + prop[1] + '[index] || (this.computed' + prefix + prop[1] + '[index] = ' + invocation.split('=')[1] + '))'
        + '}'
        )()
      computedProperties['recompute' + prefix + prop[1]] = 
        new Function(
          functions[index] + '\n'
        + 'return function compute' + prefix + prop[1] + ' (index) {\n'
        + 'var data = this.' + collection + ';\n'
        + 'var start = index * ' + size + ';\n'
        + 'if (!this.computed' + prefix + prop[1] + ') this.' + memo + '.push(this.computed' + prefix + prop[1] + ' = {});\n' 
        + 'return (this.computed' + prefix + prop[1] + '[index] = ' + invocation.split('=')[1] + ')'
        + '}'
        )()
      return false
    }
    return true;
  })

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
        if (!type) {
          var p = relations[object];
          var index = attributes[key]
          var osize = size;
        } else {
          var index = type.attributes[key]
          var osize = type.size;
        }
        return 'context.' + relations[object] + '[' + object + ' * ' + osize + ' + ' + index + ']'
      }) + '\n'

    // 
    + 'function ' + name + ' (index, ' + properties.join(',') + ') {\n'
    + '  var data = this.' + collection + ';\n'
    + '  var start = index * ' + size + ';\n'
    + '  ' + immediate.join(';\n  ')
    + '  \nreturn index;\n'
    + '};\n ' +
    setters.map(function(setter) {

      var suffix = setter.attribute.charAt(0).toUpperCase() + setter.attribute.substring(1);
      var offset = attributes[setter.attribute]
      setter.fullName = 'set' + prefix + suffix
      setter.source = '  return ' + setter.call;
      if (setter.source.indexOf('data[') > -1) {
        setter.source =  '  var data = this.' + collection + ';\n' +
                         '  var start = index * ' + size + ';\n' +
                         setter.source
      }
      return name + '.' + setter.name + ' = function(index, ' + setter.attribute + ') {\n' +
        setter.source + '\n}\n'
    }).join(';\n') + 
    'return ' + name + ';')()

  var that = this;
  var assignments = [];
  for (var attribute in attributes) (function(attribute, offset) {
    var suffix = attribute.charAt(0).toUpperCase() + attribute.substring(1);
    that['get' + prefix + suffix] = new Function('index',
      'return this.' + collection + '[' + size + ' * index + ' + offset + ']'
    )
    assignments.push('this.' + collection + '[' + size + ' * to + ' + offset + '] = this.' + collection + '[' + size + ' * from + ' + offset + ']')
  })(attribute, attributes[attribute]);

  that['move' + prefix] = new Function('from', 'to',
    assignments.join(';\n') + '\n' + 
    'this.' + memo + '.forEach(function(object) {\n\
      if (object.hasOwnProperty(from))\n\
        object[to] = object[from];\n\
      else\n\
        object[to] = undefined;\n\
      object[from] = undefined;\n\
    })\n\
    return to;'
  )
  that['uncompute' + prefix] = new Function('index',
    'this.' + memo + '.forEach(function(object) {\n\
      if (object.hasOwnProperty(index))\n\
        object[index] = undefined;\n\
    })\n\
    return index;'
  )

  that['filter' + prefix] = new Function('callback', '\
    var remap = {};\n\
    var count = 0;\n\
    for (var index = 0; index < this.' + prefix + '.count; index++) {\n\
      if (callback.call(this, index)) {\n\
        remap[index] = count;\n\
        this.move' + prefix + '(index, count)\n\
        count++;\n\
      }\n\
    }\n\
    for (var index = 0; index < count; index++) \n\
      this.set' + prefix + 'Previous(index, remap[this.get' + prefix + 'Previous(index)])\n\
    return this.' + prefix + '.count = count;\n\
  ')

  for (var property in computedProperties) {
    this[property] = computedProperties[property]
  }

  setters.forEach(function(setter) {
    this[setter.fullName] = result[setter.name]
  }, this)
  result.count = 0;
  result.size = size;
  result.attributes = attributes
  return result;
}
