
P.Object = function(properties) {
  if (properties != null)
    this.merge(properties)
  this.offset = new P.Object.Offset(this);
  this.alignment = new THREE.Vector3;
  this.position = new THREE.Vector3;
  this.shift = new P.Object.Shift(this);
  this.quaternion = new THREE.Quaternion;
  this.scale = new THREE.Vector3(1,1,1);
  this.uv = new THREE.Vector3(0,0,0)
  this.changes |= P.UPDATE_EVERYTHING
  
  this.icons = this.icons ? this.icons.map(this.getIcon, this) : [];
  if (this.icon) {
    this.icon = this.getIcon(this.icon)
    this.icons.push(this.icon)
  }
  if (this.sprites)
    this.sprites = this.sprites.map(this.getSprite, this)

  if (this.background)
    this.backgrounds = [this.getBackground(this.background)]
}

P.Object.prototype.zIndex = 0;
P.Object.prototype.zoom = 1;
P.Object.prototype.alignX = 0;
P.Object.prototype.alignY = 0;
P.Object.prototype.paddingX = 0;
P.Object.prototype.paddingY = 0;
P.Object.prototype.alignZ = 0;
P.Object.prototype.stickyX = -1;
P.Object.prototype.stickyY = 1;
P.Object.prototype.stickyZ = 0;
P.Object.prototype.color = new THREE.Color(1,1,1);
P.Object.prototype.opacity = 1;
//P.Object.prototype.fadeTension = 25;
//P.Object.prototype.fadeFriction = 12;
P.Object.prototype.renderIndex = 0;
P.Object.prototype.changes = 0;
P.Object.prototype.needsUpdate = function(changes) {
  if (changes == null)
    changes = P.UPDATE_RESET;

  this.changes |= changes

  var backgrounds = this.backgrounds;
  if (backgrounds) {
    for (var i = 0; i < backgrounds.length; i++)
      backgrounds[i].needsUpdate(changes)
  }

  var instances = this.getInstances();
  if (instances) {
    instances.changes |= changes;
    if (instances.backgrounds)
      instances.backgrounds.changes |= changes
    if (instances.sprites)
      instances.sprites.changes |= changes;
    if (instances.icons)
      instances.icons.changes |= changes;
    if (instances.panels)
      instances.panels.changes |= changes;
  }
}
P.Object.prototype.onPropertyChange = function(context, property, value, old, instances) {
  switch (property) {
    case 'paddingX':
    case 'paddingY':
    case 'paddingTop':
    case 'paddingLeft':
    case 'paddingRight':
    case 'paddingBottom':
      this.needsUpdate(P.UPDATE_OFFSET | P.UPDATE_SCALE)
      break;

    case 'alignX':
    case 'alignY':
      this.needsUpdate(P.UPDATE_ALIGNMENT | P.UPDATE_OFFSET)
      break;

    case 'zoom':
      this.needsUpdate(P.UPDATE_SCALE | P.UPDATE_ALIGNMENT)
      break;

    case 'opacity':
    case 'backgroundOpacity':
      if ((!value) ^ (!old)) {
        this.needsUpdate(P.UPDATE_CULLING | P.UPDATE_OPACITY)
      } else {
        this.needsUpdate(P.UPDATE_OPACITY)
      }
      break;

    case 'indication':
      P.Sprite.instances.front.changes |= P.UPDATE_SCALE;
      P.Sprite.instances.front.changes |= P.UPDATE_OPACITY;
      if ((!value) ^ (!old)) {
        P.Sprite.instances.front.changes |= P.UPDATE_RESET;
      }
      break;
  }
}
P.Object.prototype._onPropertyChange = P.Object.prototype.onPropertyChange;

P.Object.prototype.getInstances = function() {
  return this.instances;
}



P.Object.prototype.getX = function(includeShift) {
  return this.instances.position.x + this.offset.x + (includeShift ? this.shift.x : 0) + (this.alignment ? this.alignment.x : 0)
};
P.Object.prototype.getY = function(includeShift) {
  return this.instances.position.y + this.offset.y + (includeShift ? this.shift.y : 0) + (this.alignment ? this.alignment.y : 0)
};
P.Object.prototype.getZ = function(includeShift) {
  return this.instances.position.z + this.offset.z + (includeShift ? this.shift.z : 0) + (this.alignment ? this.alignment.z : 0)
};
P.Object.prototype._getX = P.Object.prototype.getX;
P.Object.prototype._getY = P.Object.prototype.getY;
P.Object.prototype._getZ = P.Object.prototype.getZ;

P.Object.prototype.shouldBeRendered = function() {
  return this.opacity !== 0;
}
P.Object.prototype.shouldBeDisplayed = function() {
  return true//this.opacity !== 0;
}

P.Object.prototype.getTotalX = function(includeShift) {
  return this.getX(includeShift !== false) + this.getParentX();
}
P.Object.prototype.getTotalY = function(includeShift) {
  return this.getY(includeShift !== false) + this.getParentY();
}
P.Object.prototype.getTotalZ = function(includeShift) {
  return this.getZ(includeShift !== false) + this.getParentZ();
}
P.Object.prototype.getZoom = function() {
  if (this.isSticky())
    return camera.zoom
  return camera.zoom > 1 ? Math.max(1, camera.zoom / 2) : camera.zoom; 
}
P.Object.prototype.getOpacity = function() {
  return camera.zoom > 1 ? Math.max(1, camera.zoom / 2) : camera.zoom; 
}
P.Object.prototype.getZIndex = function() {
  return this.zIndex;
}

P.Object.prototype.computeUV = function() {
  if (this.instances.material.map)
  return this.uv.set(
    this.instances.material.map.gridX + (this.instances.material.map.gridY / 10000),
    0,
    0
  )
}
P.Object.prototype._computeUV = P.Object.prototype.computeUV;
P.Object.prototype.computeAlignment = function() {
  var zoom = this.getZoom()
  if (this.isSticky()) {
    this.alignment.set(
      this.paddingX + this.scale.x * this.alignX * zoom,
      this.paddingY + this.scale.y * this.alignY * zoom,
      0
    )
  } else {
    this.alignment.set(
       this.scale.x * this.alignX,
       (this.attachY || 0) / zoom + (this.scale.y * this.alignY),
       0
    )

    this.alignment.applyQuaternion(this.quaternion)
    this.alignment.x += this.offsetX || 0
    this.alignment.y += this.offsetY || 0

  }

  return this.alignment
}
P.Object.prototype._computeAlignment = P.Object.prototype.computeAlignment;


P.Object.prototype.compute = function(changes) {
  if (changes & 1024/*this.UPDATE_TYPE*/)  {
    this.computeType();
  }

  if (changes & 16/*this.UPDATE_SCALE*/) {
    changes |= 4  /*this.UPDATE_ALIGNMENT*/
    this.computeScale()
  }

  if (changes & 32/*this.UPDATE_ROTATION*/) {
    changes |= 4  /*this.UPDATE_ALIGNMENT*/
    this.computeQuaternion()
  }

  if (changes & 4/*this.UPDATE_ALIGNMENT*/) {
    this.computeAlignment()
  }
  if (changes & 15/*this.UPDATE_POSITION*/)
    this.computePosition()

  if (changes & 512/*this.UPDATE_OPACITY*/)
    this.computeOpacity();

  if (changes & 128/*this.UPDATE_UV*/)
    this.computeUV();
  return changes
}
P.Object.prototype._compute = P.Object.prototype.compute

P.Object.prototype.computeType = function() {

};

P.Object.prototype.computeOpacity = function() {
  //return this.target ? this.target.opacity : 
  var parent = this.target ? this.target.opacity : 1;
  var own = (this.temporaryOpacity != null) ? this.temporaryOpacity : this.opacity
  return parent * own;
}
P.Object.prototype._computeOpacity = P.Object.prototype.computeOpacity

P.Object.prototype.computeColor = function() {
  return this.highlightColor || this.temporaryColor || this.color
}

P.Object.prototype._computeColor = P.Object.prototype.computeColor

P.Object.stats = {}
P.Object.prototype.computePosition = function() {
  var k = this.instances ? this.instances.name : 'other'
  P.Object.stats[k] = (P.Object.stats[k] || 0) + 1
  // attach to target position
  if (this.getTarget()) {
    this.position
      .copy(this.target.computeFinalPosition())
      .add(this.alignment)

  // position in 2d screen space
  } else if (this.isSticky()) {
    return this.position.set( 
      this.stickyX + (this.alignment.x / window.innerWidth * 2), 
      this.stickyY + (this.alignment.y / window.innerHeight * 2), 
      this.stickyZ
    ).unproject( camera );

  // position in 3d world
  } else {
    this.position
      .copy(this.offset)
      .add(this.instances.position)
      .add(this.shift)
      .add(this.alignment)
      .add(this.getParent())
  }

  // reproject 3d to 2d for screen space objects attached to 3d point
  if (this.projected) {
    this.position.project(camera)
    this.position.z = this.projected// - zOffset
    if (this.onProject)
      this.onProject()
    this.position.unproject( camera )
  }

  return this.position
}
P.Object.prototype._computePosition = P.Object.prototype.computePosition;

P.Object.prototype.computeFinalPosition = function() {
  var zIndex = this.getZIndex();
  if (zIndex) {
    this._v3.copy(this.position)
    this._v3.x -= P.Scene.cameraDirection.x * zIndex;
    this._v3.y -= P.Scene.cameraDirection.y * zIndex;
    this._v3.z -= P.Scene.cameraDirection.z * zIndex;
    return this._v3
  }
  return this.position
}
P.Object.prototype.computeScale = function() {
  var width = this.width;
  if (width == null) {
    var target = this.getTarget();
    if (target) {
      var zoom = target.zoom / target.getZoom();
      this.scale.copy(target.scale);
      this.scale.x += zoom * ((this.padding || 0) * 2 + (target.paddingLeft || 0) + (target.paddingRight || 0))
      this.scale.y += zoom * ((this.padding || 0) * 2 + (target.paddingTop || 0) + (target.paddingBottom || 0))
    }
    return this.scale
  } else {
    var zoom = this.zoom / this.getZoom();
    return this.scale.set(
      width * zoom,
      this.height* zoom,
      width * zoom)
  }
}
P.Object.prototype._computeScale = P.Object.prototype.computeScale;

P.Object.prototype.up = new THREE.Vector3().set(0,1, 0)
P.Object.prototype.ahead = new THREE.Vector3().set(-1,0,0)
P.Object.prototype.computeQuaternion = function() {
  if (this.getTarget()) {
    return this.quaternion.copy(this.target.quaternion);
  } else if (this.isBillboard()){
    return this.quaternion.copy(camera.quaternion)
  } else {
    return this.quaternion.setFromAxisAngle(this.up, Math.PI / 2)
  }
}
P.Object.prototype._computeQuaternion = P.Object.prototype.computeQuaternion;


P.Object.zero = new THREE.Vector3;
P.Object.prototype.getParent = function(includeShift) {
  var parent = (this.zone || this.area || this.city);
  if (parent)
    return parent.currentPosition;
  return P.Object.zero;
}
P.Object.prototype.getParentX = function(includeShift) {
  var parent = (this.zone || this.area || this.city)
  if (parent)
    return parent.currentPosition.x;
  return 0;
}
P.Object.prototype.getParentY = function(includeShift) {
  var parent = (this.zone || this.area || this.city)
  if (parent)
    return parent.currentPosition.y;
  return 0;
}
P.Object.prototype.getParentZ = function(includeShift) {
  var parent = (this.zone || this.area || this.city)
  if (parent)
    return parent.currentPosition.z;
  return 0;
}

P.Object.prototype.fade = function(value, delay, tension, friction) {
  switch (value) {
    case true:
      this.hidden = false;
      value = this.targetOpacity || 1;
      if (this.loaded === false) {
        value = 0.01;
      }
      break;

    case false:
      this.hidden = true;
      value = 0;
      break;

    default:
      if (this.beforeTargetOpacity != null) {
        this.beforeTargetOpacity = value;
        return;
      }
      this.targetOpacity = value;
      if (this.hidden)
        return;
      if (this.loaded === false)
        value = 0.01;
  }
  P.animate.property(this, null, 'opacity', value, tension || this.fadeTension, friction || this.fadeFriction, delay)
}


P.Object.prototype.willBeVisible = function() {
  return P.Scene.current.isObjectVisible(this, P.Scene.current[this.visibilityMethod])
}
P.Object.prototype.visibilityMethod = 'isObjectVisible'


P.Object.prototype.isImportant = function() {
  return false;
}
P.Object.prototype.onTextureReady = function() {
  if (this.imageUsers) {
    for (var i = 0; i < this.imageUsers.length; i++) {
      this.imageUsers[i].loaded = true;
      this.imageUsers[i].fade(this.imageUsers[i].willBeVisible())
    }
  }
  this.loaded = true
  this.fade(this.willBeVisible())
  P.animate.start()
}


P.Object.prototype.getTarget = function() {
  return this.target;
}
P.Object.prototype.isSticky = function() {
  return false;
}
P.Object.prototype.isBillboard = function() {
  return this.isSticky();
}
P.Object.prototype.isForeground = function() {
  return false;
}

P.Object.prototype.moveTo = function(x, y, z) {
  if (x != null)
    P.animate.property(this, 'offset', 'x', x);
  if (y != null)
    P.animate.property(this, 'offset', 'y', y);
  if (z != null)
    P.animate.property(this, 'offset', 'z', z);

}
P.Object.prototype.shiftTo = function(x, y, z) {
  if (x != null)
    P.animate.property(this, 'shift', 'x', x);
  if (y != null)
    P.animate.property(this, 'shift', 'y', y);
  if (z != null)
    P.animate.property(this, 'shift', 'z', z);

}
P.Object.prototype.moveToCoordinates = function(x, y, z) {
  return this.moveTo(y, z, -x)
}
P.Object.prototype.shiftToCoordinates = function(x, y, z) {
  return this.shiftTo(y - this.coordinates.y, (this.coordinates.z || 0) - (z || 0),  -(x - this.coordinates.x))
}
P.Object.prototype.shiftToPosition = function(x, y, z) {
  return this.shiftTo(y - this.offset.x, (this.coordinates.z || 0) - (z || 0),  -(x - this.coordinates.x))
}

P.Object.prototype.getIcon = function(icon) {
  if (typeof icon == 'string')
    var opts = {name: icon}
  else
    var opts = Object.create(icon)
  var settings = P.Icon.buttons[opts.name];
  if (settings) {
    for (var property in settings)
      if (opts[property] == null)
        opts[property] = settings[property]
  }
  opts.target = this;
  return new P.Icon(opts)
}
P.Object.prototype.getSprite = function(sprite) {
  if (typeof sprite == 'string')
    var opts = {name: sprite}
  else
    var opts = Object.create(sprite)
  var settings = P.sprites[opts.name];
  if (settings) {
    for (var property in settings)
      if (opts[property] == null)
        opts[property] = settings[property]
  }
  opts.target = this;
  return new P.Sprite(opts)
}
P.Object.prototype.getBackground = function(sprite) {
  if (typeof sprite == 'string')
    var opts = {name: sprite}
  else
    var opts = Object.create(sprite)
  var settings = P.sprites[opts.name];
  if (settings) {
    for (var property in settings)
      if (opts[property] == null)
        opts[property] = settings[property]
  }
  opts.target = this;
  return new P.Background(opts)
}
P.Object.prototype.getPosition = function(includeShift, v3) {
  if (v3 == null)
    v3 = new THREE.Vector3;
  return v3.set(
    this.getTotalX(includeShift), 
    this.getTotalY(includeShift), 
    this.getTotalZ(includeShift));
}
P.Object.prototype.getCenter = function(includeShift, v3) {
  v3 = this.getPosition(includeShift, v3);
  v3.x += this.height / 2;
  v3.z -= this.width / 2;
  return v3;
}


P.Object.prototype.merge = function(object) {
  for (var property in object)
    this[property] = object[property]
}


P.Object.prototype.onAppear = function(force) {
  if (this.opacity === 0 && !force)
    return;
  if (this.atlasIndex == null && this.instances.material.map) {
    this.atlasIndex = this.instances.material.map.allocate(this)
    return this.atlasIndex != null;
  }
}
P.Object.prototype._onAppear = P.Object.prototype.onAppear

P.Object.prototype.onDisappear = function() {
  if (this.instances.material.map) {
    this.instances.material.map.release(this, this.imageSRC)
  }
};

P.Object.prototype._v3 = new THREE.Vector3;
P.Object.prototype._o3 = new THREE.Vector3;
P.Object.prototype._q = new THREE.Quaternion;


P.Object.Offset = function(context) {
  this.context = context;
  if (context.coordinates && !(context instanceof P.Zone)) {
    this.set(context.coordinates.y, context.coordinates.z || 0, - context.coordinates.x)
  }
};
P.Object.Offset.prototype = new THREE.Vector3;
P.Object.Offset.prototype.onPropertyChange = function() {
  this.context.needsUpdate(P.UPDATE_OFFSET)
  var instances = this.context.getInstances();
  if (instances) {
    if (this.context instanceof P.Person) {
      P.Icon.instances.front.changes |= P.UPDATE_ROTATION
    }
    if (instances.panels) {
      instances.panels.changes |= instances.UPDATE_OFFSET
      P.Icon.instances.front.changes |= instances.UPDATE_OFFSET
    }
  }
}
P.Object.Offset.prototype.transitions = {
  x: {
    friction: 7,
    tension: 9
  },
  y: {
    friction: 7,
    tension: 9
  },
  z: {
    friction: 7,
    tension: 9
  }
}
P.Object.Shift = function(context) {
  this.context = context;
};
P.Object.Shift.prototype = new THREE.Vector3;
P.Object.Shift.prototype.onPropertyChange = function() {
  this.context.needsUpdate(P.UPDATE_SHIFT)
  var instances = this.context.getInstances();
  if (instances) {
    if (this.context instanceof P.Person) {
      P.Icon.instances.front.changes |= P.UPDATE_ROTATION
    }
    if (instances.panels) {
      instances.panels.changes |= instances.UPDATE_OFFSET
      P.Icon.instances.front.changes |= instances.UPDATE_OFFSET
    }
  }

}
P.Object.Shift.prototype.transitions = {
  x: {
    friction: 7,
    tension: 9
  },
  y: {
    friction: 7,
    tension: 9
  },
  z: {
    friction: 7,
    tension: 9
  }
}



P.Object.prototype.setPolygon = function(points, subtract) {
  if (points[0][0]) {
    var shape = points[0]
  } else {
    var shape = points;
  }
  //var clockwise = P.geometry.polygonArea(points) > 0;
  //if (clockwise)
  //  points = points.reverse()
  //P.geometry.sortPolygon(points)
  this.computeBox(shape)
    this.coordinates = this.box.min
  return P.geometry.triangulatePolygon(points).map(function(matrix) {
    if (subtract) {
      var copy = matrix.clone()
      copy.elements[12] -= this.box.min.x
      copy.elements[13] += this.box.min.y
      return copy;
    }
    return matrix;
  }, this)
}

P.Object.prototype.computeBox = function(points, useImage) {

  // compute bounding box
  var box = this.box = new THREE.Box2;
  this.contentBox = new THREE.Box2;
  var p = new THREE.Vector2;
  this.corner = new THREE.Vector2().set(Infinity, Infinity)
  for (var i = 0; i < points.length; i++) {
    p.set(points[i].x, points[i].y)
    this.contentBox.expandByPoint(p)
    var grid = 10;
    if (this.corner.y - p.y > grid || (Math.abs(p.y - this.corner.y) < grid && p.x < this.corner.x)) {
      this.corner.copy(p)
    }
  }
 

  if (isNaN(this.contentBox.min.y))
    debugger
  if (!isFinite(this.contentBox.min.y)) {
    this.contentBox.expandByPoint(p.set(0,0))
    if (!isFinite(box.min.y))
      this.box.expandByPoint(p.set(0,0))
  } else {
    this.box.expandByPoint(this.contentBox.min)
    this.box.expandByPoint(this.contentBox.max)
  }

  // compute and normalize offset
  this.height = box.max.y - box.min.y;
  this.width = box.max.x - box.min.x;
  box.height = box.max.y - box.min.y;
  box.width = box.max.x - box.min.x;
  if (box.min.x !== 0 || box.min.y !== 0) {
    if (this.name == 'area') {
      //this.expand()
      var updatedBox = box;
    }
  }
  this.center = box.getCenter()
  return updatedBox
}
