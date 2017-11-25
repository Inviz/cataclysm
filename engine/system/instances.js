THREE.InstancedMesh.distance = new THREE.Vector3;

THREE.InstancedMesh.prototype.lastVisible = [];

THREE.InstancedMesh.prototype.zoom = 1

// depth-sorting
THREE.InstancedMesh.prototype.addToSortedList = function(list, object) {
  if (false && this.material.transparent && object.centerX != null) {
    
  } else {
    return list.push(object) - 1
  }
}

THREE.InstancedMesh.prototype.push = function(list, object) {
  if (this.disappearing) {
    if (object.appeared) {
      if (!object.shouldBeRendered()) {
        object.appeared = object.onDisappear()
        return;
      }
    } else {
      if (object.shouldBeRendered()) {
        object.appeared = object.onAppear()
      }
      if (!object.appeared) {
        return;
      }
    }
  }
  this.addToSortedList(list, object)
}

THREE.InstancedMesh.prototype.clone = function(options) {

  var mesh = new THREE.InstancedMesh( 
    this.geometry.clone(),
    options && options.material || this.material, 
    0,       //instance count
    this._dynamic,   //is it dynamic
    this._colors,   //does it have color
    this._uniformScale,    //uniform scale, if you know that the placement function will not do a non-uniform scale, this will optimize the shader
    this._useMatrix,   // Does it use instance matrix?
    this._uvs,    // Does it use instance UVs?
    this._opacity     // Does it use instance opacity?
  )
  mesh.isFront = true;
  if (options) {
    for (var property in options)
      if (property != 'options')
        mesh[property] = options[property]
    if (options.defines)
      for (var property in options.defines)
        mesh.material.defines[property] = options.defines[property]
  }
  if (this.defines)
    for (var property in this.defines)
      mesh.material.defines[property] = this.defines[property]
  for (var property in this) {
    var value = this[property];
    if (this.hasOwnProperty(property) && mesh[property] == null)
      mesh[property] = this[property]
  }
  return mesh;
}

// Instances.collect('icons', array1, array2)
// Instances.collect(source)
// Instances.collect(source, 'icons', array1, array2)
THREE.InstancedMesh.prototype.collectFromInstances = function(key) {
  var result = [];

  // collect instances directly from first argument
  if (typeof key == 'object') {
    for (var i = 0; i < key.length; i++)
      if (key[i].shouldBeRendered())
        result.push(key[i]);
    var start = 1;
  } else {
    var start = 0;
  }

  // visit batches of instances of other types, 
  // collect nested instances of our type from them
  key = arguments[start];
  if (typeof key == 'string')
    for (var i = start + 1; i < arguments.length; i++) {
      var array = arguments[i];
      if (!array) continue;
      for (var j = 0; j < array.length; j++) {
        var objects = array[j] && array[j][key];
        if (!objects) continue;
        for (var k = 0; k < objects.length; k++) {
          if (!objects[k].shouldBeRendered()) continue;
          result.push(objects[k])
        }
      }
    }
  return result;
}

THREE.InstancedMesh.prototype.cull = function(areas, changed) {
  
}

THREE.InstancedMesh.prototype.buildList = function(visible, areas) {
  var cullAreas = P.cull.level != P.Zone;
  var getter = this.getter || this.name;
  var scene = P.Scene.current;
  if (scene && scene[this.getter]) {
    var source = scene[this.getter](areas);
    if (source) 
      for (var m = 0, n = source.length; m < n; m++)  {
        this.push(visible, source[m]);
      }
  }

  for (var i = 0, j = areas.length; i < j; i++) {
    var area = areas[i];
    if (area.visible === false && P.cull.level) continue;
    var source = area[getter];
    if (source) {
      if (typeof source == 'function')
        source = source.call(area, area, area);
      if (source) 
        for (var m = 0, n = source.length; m < n; m++)  {
          var object = source[m]
          var zone = object.zone || (object.zones && object.zones[0])
          if (!zone || zone.visible !== false || cullAreas)
            this.push(visible, object);
        }
    }
    if (!source || this.renderForZones || renderClones) {
      for (var k = 0, l = area.zones.length; k < l; k++) {
        var zone = area.zones[k];
        if (zone.visible === false && !cullAreas) continue;
        var source = zone[getter];
        if (typeof source == 'function')
          source = source.call(zone, zone, area);
        
        if (source) {
          for (var m = 0, n = source.length; m < n; m++) {
            this.push(visible, source[m]);
          }
        }
      }
    }
  }
  return visible
}

// reinitialize culling
THREE.InstancedMesh.prototype.filter = function(areas, changes) {
  if (this.beforeCull)
    this.beforeCull()

  // collect objects 
  if ((!this.lastVisible || changes & this.UPDATE_CULLING) && !this.willFade()) {
    var visible = this.getUnculled ? this.getUnculled() : []; 
    visible = this.buildList(visible, areas)
    if (this.sortList)
      visible = this.sortList(visible)
    
  } else {
    visible = this.lastVisible;
  }
  var result = visible || [];


  // unload old objects
  var oldObjects = this.lastVisible;
  if (oldObjects)
    for (var i = 0; i < oldObjects.length; i++) {
      var index = oldObjects[i].index;
      if (index != null && result[index] != oldObjects[i]) {
        oldObjects[i].index = null;
        if (oldObjects[i].appeared)
          oldObjects[i].appeared = oldObjects[i].onDisappear()
        var changed = true;
      }
    }
  this.lastVisibleChanged = changed || !oldObjects || oldObjects.length != result.length

  this.lastVisible = result
};

THREE.InstancedMesh.prototype.generateDoubleBuffers = function() {
  var attributes = this.geometry.attributes; 
  var props = this.props;
  this.doubleBuffers = true;
  for (var i = 0; i < props.length; i++) {
    var property = this.props[i];
    if (attributes[property]) {
      var array = new (attributes[property].array.constructor)(attributes[property].array.length)
      attributes[property].array2 = array
    }
  }
}

THREE.InstancedMesh.prototype.swapBuffers = function() {
  var attributes = this.geometry.attributes; 
  var props = this.props;
  for (var i = 0; i < props.length; i++) {
    var property = this.props[i];
    if (attributes[property]) {
      var array = attributes[property].array
      attributes[property].array = attributes[property].array2
      attributes[property].array2 = array;
    }
  }
}
P.UPDATE_SHIFT      = THREE.InstancedMesh.prototype.UPDATE_SHIFT      = 1
P.UPDATE_OFFSET     = THREE.InstancedMesh.prototype.UPDATE_OFFSET     = 2
P.UPDATE_ALIGNMENT  = THREE.InstancedMesh.prototype.UPDATE_ALIGNMENT  = 4
P.UPDATE_PARENT     = THREE.InstancedMesh.prototype.UPDATE_PARENT     = 8
 
P.UPDATE_POSITION   = THREE.InstancedMesh.prototype.UPDATE_POSITION   = 8 + 4 + 2 + 1
 
P.UPDATE_SCALE      = THREE.InstancedMesh.prototype.UPDATE_SCALE      = 16
P.UPDATE_ROTATION   = THREE.InstancedMesh.prototype.UPDATE_ROTATION   = 32
P.UPDATE_COLOR      = THREE.InstancedMesh.prototype.UPDATE_COLOR      = 64
P.UPDATE_UV         = THREE.InstancedMesh.prototype.UPDATE_UV         = 128
P.UPDATE_OPACITY    = THREE.InstancedMesh.prototype.UPDATE_OPACITY    = 512
 
P.UPDATE_TYPE       = THREE.InstancedMesh.prototype.UPDATE_TYPE       = 1024
P.UPDATE_CULLING    = THREE.InstancedMesh.prototype.UPDATE_CULLING    = 2048

P.UPDATE_RESET      = THREE.InstancedMesh.prototype.UPDATE_RESET      = 4095
P.UPDATE_EVERYTHING = THREE.InstancedMesh.prototype.UPDATE_EVERYTHING = 1023
P.UPDATE_STYLES     = THREE.InstancedMesh.prototype.UPDATE_STYLES     = 4 | 16 | 32 | 64 | 512

THREE.InstancedMesh.prototype.props = [
  'instancePosition', 'instanceQuaternion', 'instanceColor', 'instanceScale', 'instanceUV', 'instanceOpacity',
  '_instanceMatrixA', '_instanceMatrixB', '_instanceMatrixC', '_instanceMatrixD'
]

// move values within array
THREE.InstancedMesh.prototype.moveObjectIndex = function(oldIndex, newIndex) {

  var attributes = this.geometry.attributes; 
  if (attributes.instancePosition) {
    attributes.instancePosition.array[newIndex * 3 + 0] = attributes.instancePosition.array2[oldIndex * 3 + 0]
    attributes.instancePosition.array[newIndex * 3 + 1] = attributes.instancePosition.array2[oldIndex * 3 + 1]
    attributes.instancePosition.array[newIndex * 3 + 2] = attributes.instancePosition.array2[oldIndex * 3 + 2]
  }
  if (attributes.instanceQuaternion) {
    attributes.instanceQuaternion.array[newIndex * 4 + 0] = attributes.instanceQuaternion.array2[oldIndex * 4 + 0]
    attributes.instanceQuaternion.array[newIndex * 4 + 1] = attributes.instanceQuaternion.array2[oldIndex * 4 + 1]
    attributes.instanceQuaternion.array[newIndex * 4 + 2] = attributes.instanceQuaternion.array2[oldIndex * 4 + 2]
    attributes.instanceQuaternion.array[newIndex * 4 + 3] = attributes.instanceQuaternion.array2[oldIndex * 4 + 3]
  }
  if (attributes.instanceColor) {
    attributes.instanceColor.array[newIndex * 3 + 0] = attributes.instanceColor.array2[oldIndex * 3 + 0]
    attributes.instanceColor.array[newIndex * 3 + 1] = attributes.instanceColor.array2[oldIndex * 3 + 1]
    attributes.instanceColor.array[newIndex * 3 + 2] = attributes.instanceColor.array2[oldIndex * 3 + 2]
  }
  if (attributes.instanceScale) {
    attributes.instanceScale.array[newIndex * 3 + 0] = attributes.instanceScale.array2[oldIndex * 3 + 0]
    attributes.instanceScale.array[newIndex * 3 + 1] = attributes.instanceScale.array2[oldIndex * 3 + 1]
    attributes.instanceScale.array[newIndex * 3 + 2] = attributes.instanceScale.array2[oldIndex * 3 + 2]
  }
  if (attributes._instanceMatrixA) {
    attributes._instanceMatrixA.array[newIndex * 4 + 0] = attributes._instanceMatrixA.array2[oldIndex * 4 + 0]
    attributes._instanceMatrixA.array[newIndex * 4 + 1] = attributes._instanceMatrixA.array2[oldIndex * 4 + 1]
    attributes._instanceMatrixA.array[newIndex * 4 + 2] = attributes._instanceMatrixA.array2[oldIndex * 4 + 2]
    attributes._instanceMatrixA.array[newIndex * 4 + 3] = attributes._instanceMatrixA.array2[oldIndex * 4 + 3]
  }
  if (attributes._instanceMatrixB) {
    attributes._instanceMatrixB.array[newIndex * 4 + 0] = attributes._instanceMatrixB.array2[oldIndex * 4 + 0]
    attributes._instanceMatrixB.array[newIndex * 4 + 1] = attributes._instanceMatrixB.array2[oldIndex * 4 + 1]
    attributes._instanceMatrixB.array[newIndex * 4 + 2] = attributes._instanceMatrixB.array2[oldIndex * 4 + 2]
    attributes._instanceMatrixB.array[newIndex * 4 + 3] = attributes._instanceMatrixB.array2[oldIndex * 4 + 3]
  }
  if (attributes._instanceMatrixC) {
    attributes._instanceMatrixC.array[newIndex * 4 + 0] = attributes._instanceMatrixC.array2[oldIndex * 4 + 0]
    attributes._instanceMatrixC.array[newIndex * 4 + 1] = attributes._instanceMatrixC.array2[oldIndex * 4 + 1]
    attributes._instanceMatrixC.array[newIndex * 4 + 2] = attributes._instanceMatrixC.array2[oldIndex * 4 + 2]
    attributes._instanceMatrixC.array[newIndex * 4 + 3] = attributes._instanceMatrixC.array2[oldIndex * 4 + 3]
  }
  if (attributes._instanceMatrixD) {
    attributes._instanceMatrixD.array[newIndex * 4 + 0] = attributes._instanceMatrixD.array2[oldIndex * 4 + 0]
    attributes._instanceMatrixD.array[newIndex * 4 + 1] = attributes._instanceMatrixD.array2[oldIndex * 4 + 1]
    attributes._instanceMatrixD.array[newIndex * 4 + 2] = attributes._instanceMatrixD.array2[oldIndex * 4 + 2]
    attributes._instanceMatrixD.array[newIndex * 4 + 3] = attributes._instanceMatrixD.array2[oldIndex * 4 + 3]
  }
  if (attributes.instanceUV) {
    attributes.instanceUV.array[newIndex * 4 + 0] = attributes.instanceUV.array2[oldIndex * 4 + 0]
    attributes.instanceUV.array[newIndex * 4 + 1] = attributes.instanceUV.array2[oldIndex * 4 + 1]
    attributes.instanceUV.array[newIndex * 4 + 2] = attributes.instanceUV.array2[oldIndex * 4 + 2]
    attributes.instanceUV.array[newIndex * 4 + 3] = attributes.instanceUV.array2[oldIndex * 4 + 3]
  }
  if (attributes.instanceOpacity) {
    attributes.instanceOpacity.array[newIndex + 0] = attributes.instanceOpacity.array2[oldIndex + 0]
 }
}

THREE.InstancedMesh.prototype.compareArrays = function(before, after) {
  if (before.length != after.length) {
    return false
  } else {
    for (var i = 0; i < after.length; i++)
      if (before[i] !== after[i])
        return false;
  }
  return true;
}
THREE.InstancedMesh.prototype.willFade = function(instances) {
  if (this.material.opacity === 0)
    return true;
  var name = this.name;
  if (P.Scene.current)
  return P.Scene.current[name] && P.Scene.current[name].material && P.Scene.current[name].material.opacity === 0
}
THREE.InstancedMesh.prototype.compute = function(objects, changes) {
  var batchChanges = changes;

  var features = this.features || P.UPDATE_RESET;
  // let objects update, accummulate bitmasks of changes 
  for (var i = 0, j = objects.length; i < j; i++) {
    var instance = objects[i];
    var instanceChanges = changes | instance.changes;
    if (instance.index == null) 
      instanceChanges |= P.UPDATE_STYLES
    if (instanceChanges)
      batchChanges |= instance.compute(instanceChanges & features)
    instance.changes = null;
  }

  return batchChanges
}
THREE.InstancedMesh.create = function(geometry, material, features, options, front) {
  var mesh = new THREE.InstancedMesh( 
    geometry,
    material, 
    0,       //instance count
    false,   //is it dynamic
    !!(features & P.UPDATE_COLOR),    //does it have color
    true,    //uniform scale, if you know that the placement function will not do a non-uniform scale, this will optimize the shader
    !!(geometry === P.geometry.triangleBufferGeometry),   // Does it use instance matrix?
    !!(features & P.UPDATE_UV),    // Does it use instance UVs?
    !!(features & P.UPDATE_OPACITY)    // Does it use instance opacity?
  );
  mesh.features = features;
  for (var property in options)
    mesh[property] = options[property]

  if (options.defines)
    for (var property in options.defines)
      mesh.material.defines[property] = options.defines[property]

  if (options.sort) {
    mesh.sortList = function(list) {
      return list.sort(options.sort)
    }
  }
  if (options.rotateX)
    mesh.rotation.x = options.rotateX;
  if (options.rotateY)
    mesh.rotation.y = options.rotateY;
  if (options.rotateZ)
    mesh.rotation.z = options.rotateZ;

  if (front)
    mesh.front = mesh.clone(front)
  return mesh;
}
THREE.InstancedMesh.prototype.updateAt = function(index, instance, changes) {
  if (this._useMatrix) { // uses matrix
    if (changes & 63/*this.UPDATE_POSITION|this.UPDATE_SCALE|this.UPDATE_ROTATION*/) {
      var m = instance.matrix.elements
      var scaleY = instance.scale.y || 1;
      this.geometry.attributes._instanceMatrixA.setXYZW(index, m[0], m[1], m[2],  m[3])
      this.geometry.attributes._instanceMatrixB.setXYZW(index, m[4] * scaleY, m[5] * scaleY, m[6] * scaleY,  m[7] * scaleY)
      this.geometry.attributes._instanceMatrixC.setXYZW(index, m[8], m[9], m[10], m[11])
      this.geometry.attributes._instanceMatrixD.setXYZW(index, 
        (m[12] + instance.position.z), 
        (m[13] + instance.position.x), 
        (m[14] + instance.position.y), m[15])
    }
  } else {
    if (changes & 15/*this.UPDATE_POSITION*/) 
      this.setPositionAt( index , instance.computeFinalPosition());

    if (changes & 16/*this.UPDATE_SCALE*/)
      this.setScaleAt( index , instance.scale );

    if (changes & 32/*this.UPDATE_ROTATION*/) 
      this.setQuaternionAt( index , instance.quaternion);
  }

  if (changes & 64/*this.UPDATE_COLOR*/)
    this.setColorAt(index, instance.computeColor())

  if (changes & 128/*this.UPDATE_UV*/) 
    this.geometry.attributes.instanceUV.setXYZW(index, 
        instance.atlasIndex,
        instance.uv.x,
        instance.uv.y,
        instance.uv.z)

  if (changes & 512/*this.UPDATE_OPACITY*/)
    this.geometry.attributes.instanceOpacity.setX(index, instance.computeOpacity())
}
THREE.InstancedMesh.prototype.upload = function(list, changes) {
  var length = list.length;
  if (!this.doubleBuffers)
    var regen = true;

  if (this.setUpdateRange(length, changes) || regen) {
    this.generateDoubleBuffers()
  }

  this.swapBuffers()

  var features = this.features || P.UPDATE_RESET;
  for (var i = 0; i < length; i++) {
    var instance = list[i];
    var oldIndex = instance.index;
    instance.index = i;
    var reuse = oldIndex != null && !regen;
    // restore data from previous frame at the new position
    if (reuse) {
      this.moveObjectIndex(oldIndex, i)
    }
    // generate new data if necessary
    if (!reuse || changes)
      this.updateAt(instance.index, instance, (reuse ? changes & features : features) )
  }
  this.geometry.maxInstancedCount = length;
}


THREE.InstancedMesh.prototype.setUpdateRange = function(length, changes) {
  changes |= this.changes

  if (length > this.numInstances) {
    this.numInstances = length;
    var result = true;
  } else {
    var updateRange = {offset: 0, count: length}
    var attributes = this.geometry.attributes; 
    if (attributes.instancePosition && ((changes & this.UPDATE_POSITION))) {
      attributes.instancePosition.needsUpdate = true
      attributes.instancePosition.updateRange = updateRange
    }
    if (attributes.instanceQuaternion && ((changes & this.UPDATE_ROTATION))) {
      attributes.instanceQuaternion.needsUpdate = true
      attributes.instanceQuaternion.updateRange = updateRange
    }
    if (attributes.instanceColor && ((changes & this.UPDATE_COLOR))) {
      attributes.instanceColor.needsUpdate = true
      attributes.instanceColor.updateRange = updateRange
    }
    if (attributes.instanceScale && ((changes & this.UPDATE_SCALE))) {
      attributes.instanceScale.needsUpdate = true
      attributes.instanceScale.updateRange = updateRange
    }
    if (attributes._instanceMatrixA && ((changes & this.UPDATE_POSITION))) {
      attributes._instanceMatrixA.needsUpdate = true
      attributes._instanceMatrixA.updateRange = updateRange
    }
    if (attributes._instanceMatrixB && ((changes & this.UPDATE_POSITION))) {
      attributes._instanceMatrixB.needsUpdate = true
      attributes._instanceMatrixB.updateRange = updateRange
    }
    if (attributes._instanceMatrixC && ((changes & this.UPDATE_POSITION))) {
      attributes._instanceMatrixC.needsUpdate = true
      attributes._instanceMatrixC.updateRange = updateRange
    }
    if (attributes._instanceMatrixD && ((changes & this.UPDATE_POSITION))) {
      attributes._instanceMatrixD.needsUpdate = true
      attributes._instanceMatrixD.updateRange = updateRange
    }
    if (attributes.instanceUV && ((changes & this.UPDATE_UV))) {
      attributes.instanceUV.needsUpdate = true
      attributes.instanceUV.updateRange = updateRange
    }
    if (attributes.instanceOpacity && ((changes & this.UPDATE_OPACITY))) {
      attributes.instanceOpacity.needsUpdate = true
      attributes.instanceOpacity.updateRange = updateRange
    }
  }
  return result

};