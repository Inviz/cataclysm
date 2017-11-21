


P.animate = function(current, target, callback, tension, friction) {
  if (current === target) {
    //callback(current)
    return
  }
  if (tension == null)
    var spring = new Spring.Linear()
  else
    var spring = new Spring(tension || 7, friction || 10);
  if (spring[2] == null) { 
    spring[2] = current || 0;
  }
  spring[3] = target;
  spring.callback = callback;


  P.animate.current.push(spring)
  return spring
}
P.animate.current = [];

P.animate.finish = function(context, property) {
  var current = P.animate.current;
  for (var i = current.length; i--;) {
    var spring = current[i];
    if (spring.target === context && spring.property === property) {
      current.splice(i, 1);
      spring.callback(spring[3])

      return true;
      //break;
    }
  }
}
P.animate.cancel = function(context, property) {
  var current = P.animate.current;
  for (var i = current.length; i--;) {
    if (current[i].target === context && current[i].property === property) {
      current.splice(i, 1);
      return true;
      //break;
    }
  }
}

// set new target for animation, shift value by the difference
// if not currently animated, set instantly
P.animate.hurry = function(context, property, value, threshold) {
  var current = P.animate.current;
  for (var i = current.length; i--;) {
    var spring = current[i];
    if (spring.target === context && spring.property === property) {
      spring[2] += (value - spring[3])
      spring[9] += (value - spring[3]);
      spring[11] += (value - spring[3]);
      spring[3] += (value - spring[3]);
      context[property] = spring[2];
      //spring[12] = Spring.prototype.getTension(100)
      return spring;
      //break;
    }
  }
  context[property] = value;
}
P.animate.instantly = function(context, property, value) {
  var spring = P.animate.hurry(context, property, value, true) || P.animate.property(context, property, value, null, null, null, true)
  spring.hurried = false;
  spring[12] = Spring.prototype.getTension(150)
}

P.animate.property = function(target, object, property, value, tension, friction, delay, hurry) {
  var context = object ? target[object] : target;

  var transition = (context.transitions && context.transitions[property])
  if (transition) {
    if (transition.friction)
      friction = transition.friction;
    if (transition.tension)
      tension = transition.tension;
    if (transition.delay)
      delay = transition.delay;
    if (value === 0 && transition.delayOut)
      delay = transition.delayOut
  }

  if (isNaN(value)) {

    console.error("Animating NaN", target, property, value)
  }
  if (P.animate.progress == 1 && !hurry || P.animate.locks) {
    var old = context[property];
    var changed = old != value;
    context[property] = value;
    P.animate.onPropertyChange(context, property, value, old)
    //if (context === window.target)
    //  window.target.updateMatrixWorld()
    //if (context === window.light)
    //  window.light.updateMatrixWorld()
    return;
  }

  if (typeof value == 'function') {
    var getter = value;
    value = getter(context)
  }
  for (var i = 0, j = P.animate.current.length; i < j; i++) {
    var spring = P.animate.current[i];
    if (spring.target === context && spring.property === property) {
      spring[3] = value;
      if (tension)
        spring[12] = Spring.prototype.getTension(tension)
      if (friction)
        spring[13] = Spring.prototype.getFriction(friction)
      spring.getter = getter
      spring.delay = delay;
      return spring;
    }
  }
  var spring = P.animate(context[property], value, function(now) {
    var old = context[property]
    context[property] = now;
    P.animate.onPropertyChange(context, property, now, old);
  }, tension, friction)

  if (!spring)
    return

  spring.target = context;
  spring.property = property;
  spring.getter = getter;
  spring.delay = delay;

  return spring
}

P.animate.onPropertyChange = function(context, property, value, old) {

  //if (context === camera.position) {
  //  light.position.copy(camera.position)
  //}
  if (property === 'zoom' && context === camera) {
    P.instances.list.forEach(function(instances) {
      if (instances.zooming !== false) {
        instances.changes |= P.UPDATE_SCALE | P.UPDATE_OFFSET
      }
    })
  }
  if (property == 'opacity') {
    if (context.isMaterial) {
      if (value < 0.01)
        context.visible = false;
      else if (!context.visible)
        context.visible = true;
    } 
  }

  if (context.onPropertyChange)
    context.onPropertyChange(context, property, value, old);

  if (context instanceof THREE.Camera || context === camera.position|| context === camera.rotation) {
    P.Scene.onCameraMove(context === camera.rotation);
    P.Scene.setCamera()
  }

}


P.animate.scene = function(object, context, tension, friction, delay) {
  if (context == null)
    context = scene;
  for (var property in object) {
    if (!object.hasOwnProperty(property))
      continue;
    var f = null;
    var t = null;
    var d = null;
    var value = object[property];
    if (typeof value == 'function') {
      if (hooks == null)
        var hooks = [];
      if (!property.match(/^on[A-Z]|^get[A-Z]|^set[A-Z]|^should[A-Z]|^is[A-Z]|^_/))
        hooks.push(value);
    } else {
      switch (property) {
        case 'x':
          if (!context.offset) {
            P.animate.property(context, 'position', 'x', value, tension || 9, friction || 7, delay);
          } else {
            P.animate.property(context, 'offset', 'x', value, tension || 9, friction || 7, delay);
          }
          break;
          
        case 'y':
          if (!context.offset) {
            P.animate.property(context, 'position', 'y', value, tension || 9, friction || 7, delay);
          } else {
            P.animate.property(context, 'offset', 'y', value, tension || 9, friction || 7, delay);
          }
          break;
          
        case 'z':
          if (!context.offset) {
            P.animate.property(context, 'position', 'z', value, tension || 9, friction || 7, delay);
          } else {
            P.animate.property(context, 'offset', 'z', value, tension || 9, friction || 7, delay);
          }
          break;
          
        case 'opacity':
          P.animate.property(context, null, 'opacity', value, tension, friction, d || delay);
          break;

        case 'onlyShowDoors':
          P.animate.property(context, null, 'onlyShowDoors', value, tension, friction || 9, d || delay);
          break;

        case 'extrudeY':
          P.animate.property(context, null, 'extrudeY', value, tension || 8, friction || 7, delay);
          break;
        case 'showAllZones':
          P.animate.property(context, null, 'showAllZones', value, tension || 8, friction || 12, delay);
          break;

        case 'showExtrusions':
          P.animate.property(context, null, 'showExtrusions', value, tension || 8, friction || 12, delay);
          break;

        case 'paddingTop':
          P.animate.property(context, null, 'paddingTop', value, tension || 28, friction || 7, delay);
          break;
        case 'r':
        case 'g':
        case 'b':
          P.animate.property(context, null, property, value, tension || 28, friction || 27, delay);
          break;


        case 'rotateX':
          var t = context === camera ? 30 : tension || 20;
          var f = context === camera ? 17 : friction || 7;
          P.animate.property(context, 'rotation', 'x', value, t, f, delay);
          break;
          
        case 'rotateY':
          var t = context === camera ? 30 : tension || 20;
          var f = context === camera ? 17 : friction || 7;
          P.animate.property(context, 'rotation', 'y', value, t, f, delay);
          break;
        case 'rotateZ':
          var t = context === camera ? 30 : tension || 20;
          var f = context === camera ? 17 : friction || 7;
          if (context.rotation) {
            P.animate.property(context, 'rotation', 'z', value, t, f, delay);
          } else {
            P.animate.property(context, null, 'rotateZ', value, t, f, delay);
          }
          break;
          
        case 'scaleX':
          P.animate.property(context, 'scale', 'x', value, tension, friction, delay);
          break;
        case 'scaleY':
          P.animate.property(context, 'scale', 'y', value, tension, friction, delay);
          break;
        case 'scaleZ':
          P.animate.property(context, 'scale', 'z', value, tension, friction, delay);
          break;

        case 'shiftX':
          P.animate.property(context, 'shift', 'x', value, tension, friction, delay);
          break;
        case 'shiftY':
          P.animate.property(context, 'shift', 'y', value, tension, friction, delay);
          break;
        case 'shiftZ':
          P.animate.property(context, 'shift', 'z', value, tension, friction, delay);
          break;

        case 'camera':
          P.animate.scene(value, camera, tension || 14, friction || 12, delay);
          break;

        case 'wallHeight':
          P.animate.property(context, null, 'wallHeight', value, tension || 14, friction || 22, d || delay);
          
          break;

        case 'zoom':
          P.animate.property(context, null, 'zoom', value, tension || 5, friction || 10, delay);
          
          break;

        case 'light':
//          P.animate.scene(value, spotlight, 40, 5);
          P.animate.scene(value, light, 40, 5);
          break;
          
        case 'target':
          P.animate.scene(value, target);
          break;
        case 'wrapper':
          P.animate.scene(value, wrapper);
          break;
          
        case 'areas': case 'area':
          for (var i = 0; i < P.areas.length; i++)
            P.animate.scene(value, P.areas[i])
          break;

        case 'zones': case 'zone':
          if (context && context.zones) {
            for (var j = 0; j < context.zones.length; j++)
              P.animate.scene(value, context.zones[j])
          } else {
            for (var i = 0; i < P.areas.length; i++)
              for (var j = 0; j < P.areas[i].zones.length; j++)
                P.animate.scene(value, P.areas[i].zones[j])
          }
          break;

        case 'label':
          if (context.labels)
            for (var i = 0; i < context.labels.length; i++)
              P.animate.scene(value, context.labels[i])
          break;

        case 'person':
          if (context.people)
            for (var i = 0; i < context.people.length; i++)
              P.animate.scene(value, context.people[i])
          break;

        case 'fog':
          P.animate.scene(value, scene.fog)
          break;

        case 'material':
          P.animate.scene(value, context.material)
          break;

        default:
          if (context ) {
            if (typeof value == 'object') {
              var meta = (context || scene).getObjectByName(property);
              if (meta) P.animate.scene(value, meta)
            } else if (context !== scene) {
              P.animate.property(context, null, property, value);
            }
          }
          break;
      }
    }

  }

  if (hooks != null) {
    return hooks
    //for (var i = 0; i < hooks.length; i++) {
    //  var result = hooks[i].call(object, context);
    //  if (result != null) {
    //    if (typeof result === 'object')
    //      P.animate.scene(result, context)
    //  }
    //}
  }
}


P.animate.start = function(renderNow) {
  if (P.animate.scheduled && !renderNow)
    return;
  var startTime;
  var slowdown = 1;

  var slow = location.search.match(/slowdown=([\d.-]+)/)
  if (slow) {
    slowdown = parseFloat(slow[1])
  }

  var onSingleFrame = function() {
    var time = +(new Date);
    if (!P.animate.startTime)
      P.animate.startTime = time;

    cancelAnimationFrame(P.animate.scheduled);
    if (P.animate.frame(time, P.animate.startTime, slowdown)) {
      P.animate.scheduled = requestAnimationFrame(onSingleFrame);
    } else {
      P.animate.startTime = null;
      P.animate.scheduled = null;
    }
    render()
  }
  if (!renderNow)
    P.animate.scheduled = requestAnimationFrame(onSingleFrame);
  else
    onSingleFrame();
}

P.animate.stats = {};
P.animate.frame = function(time, startTime, speed) {
  if (!P.animate.current.length) return;
  var animated = 0;
  for (var i = P.animate.current.length; i--;) {
    var spring = P.animate.current[i];
    if (spring.getter) {
      spring[3] = spring.getter(spring.target)
    }
    var warpedTime = (time - startTime) * (spring.hurried ? 1.7 : 0)
                    + (time - startTime) * (speed || 0);
    var animationTime = time + warpedTime ;

    var elapsedTime = animationTime - startTime;
    if (spring.delay) {
      if (!spring.delayTime)
        spring.delayTime = animationTime;
      if (animationTime - spring.delayTime < spring.delay)
        continue;
    }
    var t = spring.compute === Spring.Linear.prototype.compute ? '-' : '+'
    if (spring.target instanceof P.Object.Offset)
      P.animate.stats[t + spring.property + '.offset'] = (P.animate.stats[t + spring.property + '.offset']  || 0 ) + 1;
    else if (spring.target instanceof P.Object.Shift)
      P.animate.stats[t + spring.property + '.shift'] = (P.animate.stats[t + spring.property + '.shift']  || 0 ) + 1;
    else if (spring.target == camera.rotation)
      P.animate.stats[t + spring.property + '.camera.rotation'] = (P.animate.stats[t + spring.property + '.camera.rotation']  || 0 ) + 1;
    else if (spring.target == camera.position)
      P.animate.stats[t + spring.property + '.camera.position'] = (P.animate.stats[t + spring.property + '.camera.position']  || 0 ) + 1;
    else
      P.animate.stats[t + spring.property ] = (P.animate.stats[t + spring.property]  || 0 ) + 1;
    // camera need precise animation, objects dont
    if ((spring.property == 'x' || spring.property == 'y' || spring.property == 'z' || spring.property == 'constant')
      && (spring.target != camera.position && spring.target != camera.rotation)) {
      var REST_THRESHOLD = 0.01
      var DISPLACEMENT_THRESHOLD = 0.001
    } else {
      var REST_THRESHOLD = 0.001
      var DISPLACEMENT_THRESHOLD =0.0001
    }
    //var ctx = spring.target.context || spring.target;
    //if (!P.animate.stats) P.animate.stats = {};
    //var key = ctx.instances && ctx.instances.name || 'obj'
    //if (! P.animate.stats[key])  P.animate.stats[key] = {};
    //P.animate.stats[key][spring.property] = (P.animate.stats[key][spring.property] || 0) + 1;
    var value = spring.compute(animationTime, startTime, spring.REST_THRESHOLD || REST_THRESHOLD, DISPLACEMENT_THRESHOLD)
    if (value !== undefined) {
      animated++;
      spring.callback(value);
    }

    if (spring[2] === spring[3] || typeof spring[3] !== 'number' || isNaN(spring[3])) {
      P.animate.current.splice(i, 1)
      spring.callback(spring[3]);
    }
  }
  P.animate.lastAnimated = animated;
  return P.animate.current.length || animated;
};

P.animate.locks = 0;
P.animate.lock = function() {
  this.locks++;
}
P.animate.unlock = function() {
  this.locks--;
}

