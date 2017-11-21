P.Icon = function(properties) {
  P.Object.call(this, properties)
}

P.Icon.prototype = new P.Object;
P.Icon.prototype.height = 38
P.Icon.prototype.width = 38
P.Icon.prototype.opacity = 1
P.Icon.prototype.alignX = 0;
P.Icon.prototype.alignY = 0;
P.Icon.prototype.attachY = 10;
P.Icon.prototype.visibilityMethod = 'isIconVisible'

P.Icon.prototype.isForeground = function() {
  return this.ui;
}
P.Icon.prototype.isSticky = function() {
  return this.ui;
}
P.Icon.prototype.getZIndex = function() {
  return 100;
}

P.Icon.prototype.computeQuaternion = function() {
  this._computeQuaternion();
  
  if (this.isCompass) {
    if (this.target && this.target instanceof P.Person && this.target.workplace) {
      var workplace = this.target.workplace
      var screen1 = P.Scene.getScreenXY(workplace.position, this._v3);
      var screen1 = P.Scene.getScreenXY(workplace.person.position, this._o3);
      var rad = Math.atan2(screen2.y - screen1.y + 25, screen2.x - screen1.x + 25)
      this._q.setFromAxisAngle(_v3.set(0, 0, -1), rad - Math.PI / 2)
      this.quaternion.multiplyQuaternions(this._q, this.quaternion)
    }
  }

  return this.quaternion

}

P.Icon.prototype.computeAlignment = function() {
    this._computeAlignment()
  if (this.target) {
    if (this.isCompass) {
      var offsetX = (this.target.compassX || 0) / camera.zoom;
      var offsetY = (-this.target.compassY - 24)  / camera.zoom;
    }
  }
  return this.alignment
}
/*


  var width = (object.width || 0)  / camera.zoom;
  var height = (object.height || 0) / camera.zoom;

  var iconOffset = 2;
  if (object.target && object.target instanceof P.Person) {
    iconOffset = 2;
  } else if (P.Scene.state == 'location') {
    iconOffset = 3.5;
  }

  if (icon.isCompass) {
    var offsetX = object.compassX / camera.zoom;
    var offsetY = (-object.compassY - 24)  / camera.zoom;
  }

  var offset = _v3.set(
    (offsetX || 0) + (width - scales[object.index * 3]) / 2, 
    (offsetY || 0) + (scales[object.index * 3 + 1]) / 2 + (icon.height + (icon.paddingY || 0)) * scale / iconOffset, 
    0).applyQuaternion( _q)
  var zOffset = (icon.zIndex || -1) ;
  offset.x -= (P.Scene.cameraDirection.x * zOffset)
  offset.y -= (P.Scene.cameraDirection.y * zOffset)
  offset.z -= (P.Scene.cameraDirection.z * zOffset)
  this.setPositionAt( index, _position.add(offset));
}


*/

P.Icon.loaded = {};
P.Icon.array = [];
P.Icon.load = function(name, instances) {
  if (!P.Icon.loaded[name]) {
    var opts = Object.create(P.Icon.buttons[name] || {})
    opts.type = P.Icon.buttons[name]
    opts.imageSRC = 'images/icons/' + name + '.png'
    opts.opacity = 1
    if (opts.ui)
      opts.pointerPriority = 20
    
    var icon = P.Icon.loaded[name] = new P.Icon(opts);
    if (instances)
      icon.instances = instances;
    if (icon.isForeground()) {
      icon.instances = P.Icon.instances.front
      P.Icon.array.push(P.Icon.loaded[name])
    }
    icon.onAppear(true)
    if (name === 'search') {
      P.Scene.updateSearch()
    }
  }  
  return P.Icon.loaded[name]
}
P.Icon.show = function(name) {
  var icon = P.Icon.load(name);
  icon.isHidden = false;
  icon.fade(true);
}
P.Icon.hide = function(name) {
  var icon = P.Icon.load(name);
  icon.isHidden = true;
  icon.fade(false);
}

P.Icon.prototype.shouldBeRendered = function() {
  if (this.opacity === 0)
    return;
  return true
}
P.Icon.prototype.onHover = function(pointer) {
  pointer.icon = this
  return pointer;
}
P.Icon.prototype.computeUV = function() {
  if (this.atlasIndex == null)
    this.atlasIndex = P.Icon.load(this.name).atlasIndex
  return this._computeUV()
}
P.Icon.prototype.onAppear = function(force) {
  if (force === true)
    return this._onAppear()
  this.computeUV()
  return this.atlasIndex != null
}

P.Icon.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.icons,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'icons',
      getter: 'getIcons',
      disappearing: true,
      defines: {
        USE_CHANNEL_PACKING: ''
      }
    },
    {
      name: 'icons_front',
      buildList: function() {
        return this.collectFromInstances(P.Icon.array, 'icons', 
          P.Label.instances.front.lastVisible, 
          P.Panel.instances.lastVisible)
      }
    }
  )
};