P.Label = function(properties) {
  if (properties == null)
    return;

  if (!(this instanceof P.Label))
    return new P.Label(properties);

  P.Object.call(this, properties)
  return this
}

P.Label.prototype = new P.Object;
P.Label.prototype.width = 0;
P.Label.prototype.height = 0;
P.Label.prototype.alignX = 0;
P.Label.prototype.opacity = 0;
P.Label.prototype.zIndex = 5;
P.Label.prototype.renderIndex = 1;
P.Label.prototype.visibilityMethod = 'isLabelVisible'
P.Label.prototype.getZoom = function() {
  return camera.zoom; 
}
P.Label.prototype.className = 'label content';

P.Label.prototype.getInstances = function() {
  return this.isForeground() ? this.instances.front || this.instances: this.instances;;
}

P.Label.prototype.stickyX = -1;
P.Label.prototype.stickyY = 1;

P.Label.prototype.getZIndex = function() {
  if (this.target) {
    return 5
  }
  return this.zIndex
}
P.Label.prototype._qq = new THREE.Quaternion;
P.Label.prototype._v3 = new THREE.Vector3;
P.Label.prototype.computeQuaternion = function() {
  this._computeQuaternion()
  if (!this.getTarget() && !this.isBillboard()) {
    var angle = camera.rotation.y * 2 - Math.PI / 2;
    if (angle < - Math.PI / 4 || P.Scene.rotateLabels) {
      this._qq.setFromAxisAngle(this.ahead,Math.abs(angle))
      this.quaternion.multiply(this._qq)
    }
  }
  return this.quaternion
}

P.Label.prototype.computeUV = function() {
  return this.uv.set(
    this.offsetWidth + (this.offsetHeight / 10000),
    0,0)
}

P.Label.prototype.computePosition = function() {
  this._computePosition()
  if (this.important && !this.projected) {
    var screen = P.Scene.getScreenXY(this.position, this._v3)
    var offscreen = screen.x - this.scale.x / 2 * P.Scene.oneZPixel.x - (this.zone ? 5 : 5);
    if (offscreen < 0)
      this.position.z += Math.max(-this.area.width, (offscreen / P.Scene.oneZPixel.x))
  }
  return this.position
}

P.Label.prototype.isSticky = function() {
  var target = this.getTarget();
  return target && target.isSticky()
}
P.Label.prototype.isForeground = function() {
  return this.isSticky();
}
P.Label.prototype.onTexturePrepare = function() {
  this.renderStart = new Date;
  delete this.height
  delete this.width;
}

P.Label.prototype.onBeforeHover = function(pointer) {
  if (this.disabled) {
    pointer._label = this;
    return false
  }
}
P.Label.prototype.onHover = function(pointer) {

  pointer.label = this
  pointer.area = this.area || this.zone && this.zone.area
  pointer.zone = this.zone;
  pointer.label = this;
  
}

P.Label.prototype.onTextureReady = function(element) {
  this.offsetWidth = element.offsetWidth;
  this.offsetHeight = element.offsetHeight;
  if (this.measureElement)
    this.measureElement(element);
  console.info('ready', this.offsetWidth + 'x' + this.offsetHeight, new Date - this.renderStart);
  this.height = this.offsetHeight / 2;
  this.width = this.offsetWidth / 2
  this.needsUpdate(P.UPDATE_SCALE);
}

P.Label.prototype.onTextureReuse = function(old) {
  console.info('reuse', this.offsetWidth + 'x' + this.offsetHeight);
  this.offsetHeight = old.offsetHeight;
  this.offsetWidth  = old.offsetWidth;
  this.height = this.offsetHeight / 2;
  this.width = this.offsetWidth / 2
  this.needsUpdate(P.UPDATE_SCALE);
}

P.Label.prototype.invalidate = function() {
  this.unrendered = true;
  if (this.appeared && this.opacity !== 0) {
    this.onAppear(true)
  } else {
    this.onDisappear()
  }
}

P.Label.prototype.onAppear = function(update) {
  if (this.opacity === 0)
    return;
  var instances = this.getInstances()
  var released = instances.material.map.released;
  var index = released.indexOf(this);
  var atlasIndex = this.atlasIndex;
  if (atlasIndex == null || index == -1 || update || this.unrendered) {
    this.atlasIndex = instances.material.map.allocate(this, undefined, update)
  }
  if (atlasIndex !== this.atlasIndex) {
    this.needsUpdate(P.UPDATE_UV | P.UPDATE_OFFSET)
  }
  if (index > -1)
    released.splice(index, 1)
  return this.atlasIndex != null;
}
P.Label.prototype.onDisappear = function() {
  this.instances.material.map.release(this)
}
P.Label.prototype.isImportant = function() {
  return this.zone ? this.zone.area === P.currently.showingArea : true;
}
P.Label.prototype.render = function(body) {
  if (!this.constructor.element) {
    this.constructor.wrapper = document.createElement('div');
    this.constructor.wrapper.classList.add('wrapper');
    this.constructor.wrapper.style.width = this.instances.material.map.gridX + 'px';
    this.constructor.wrapper.style.height = this.instances.material.map.gridY + 'px';
    this.constructor.wrapper.style.overflow = 'hidden';
    this.constructor.element = document.createElement('div');
    this.constructor.element.className = this.className
    this.constructor.wrapper.appendChild(this.constructor.element)
    body.appendChild(this.constructor.wrapper);
    this.build(this.constructor.element)
  }
  if (this.constructor.element.className !== this.className)
    this.constructor.element.className = this.className
  this.update(this.constructor.element)
    
  return this.constructor.element;
}


P.Label.instanced = function() {
  return THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.text,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_COLOR | P.UPDATE_UV | P.UPDATE_OPACITY,
    {
      name: 'labels',
      getter: 'getLabels',
      renderForZones: true,
      disappearing: true,
      sort: function(a, b) {
        return a.renderIndex - b.renderIndex
      },
      buildList: function() {
        this.front.list = [];
        return THREE.InstancedMesh.prototype.buildList.apply(this, arguments);
      },
      addToSortedList: function(list, object) {
        if (object.isForeground()) 
          this.front.list.push(object)
        else
          return list.push(object) - 1
      }
    }, 
    {
      name: 'labels-front',
      buildList: function(visible) {
        visible.push.apply(visible, this.list)
        return this.list;
      } 
    }
  )
};