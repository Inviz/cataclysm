P.Person = function(properties) {
  if (properties == null)
    return
  P.Icon.call(this, properties)
  this.panel = new P.Panel.Profile({
    person: this,
    target: this,
    parent: this
  })
  this.favorites = [];
  this.related = [];
  this.loaded = false;
}

P.Person.byId = function(id, source) {
  if (source == null)
    source = P.people;
  for (var i = 0; i < source.length; i++)
    if (source[i].id === id && source[i].clone !== source[i])
      return source[i];
}

P.Person.prototype = new P.Icon;
P.Person.prototype.constructor = P.Person;
P.Person.prototype.height = 50
P.Person.prototype.width = 50
P.Person.prototype.opacity = 0
P.Person.prototype.zooming = 1;
P.Person.prototype.className = 'person avatar'
P.Person.prototype.alignY = 0.5;
P.Person.prototype.zIndex = 10;
P.Person.prototype.stickyZ = -0.2;
P.Person.prototype.visibilityMethod = 'isPersonVisible'
P.Person.prototype.sprites = [
  {
    name: 'border',
    shouldBeRendered: function() {
      return P.Scene.target == this.target
          || P.Scene.me == this.target
          || P.Scene.meVisible == this.target
          || P.pointer.person == this.target
          || this.target.highlighted
    }
  }
]
P.Person.prototype.onClick = function() {

  if (P.Scene.target === this) {
    if (!P.Panel.expanded && P.Panel.current.indexOf(this.panel) > -1)
      return P.Scene.target.panel.onClick()
    else
      P.Panel.open(this)
  } else if ((P.Scene.target == this)) {
    P.Scene.setTarget(this.workplace || this);
    P.Panel.close()
    P.Scene.current.onInitialize()
  } else {
    if (this === P.Scene.meVisible) {
      P.Scene.setTarget(P.Scene.me);
      P.Person.instances.hideMe()
      P.Scene.stopStickyPerson()
      if (P.Scene.state == 'search') 
        P.Scene.navigate('floor')
    } else {
      P.Scene.setTarget(this)
    }

    if (P.currently.showingArea  
    && P.currently.showingArea  !== this.area
    && P.Scene.state !== 'graph') {
      P.pointer.area = this.area;
      var state = P.Scene.state
      var old = P.animate.progress;
      P.Scene.navigate(state)
      P.Panel.open(P.Scene.target)
    } else {
      P.Scene.current.onInitialize(true)
      P.Panel.open(P.Scene.target)
    }
  }
  P.animate.start();
}

P.Person.prototype.computePosition = function() {
  if (this.isSticky()) {
    return this._computePosition()
  } else {
    return this._computePosition().sub(this.area.shift)
  }
}

P.Person.prototype.computeAlignment = function() {
  if (this.isSticky()) {
    return this.alignment.set(
      - ((this.width + 28) * this.zoom) / 2,
      - (((this.height / 2) * this.zoom + Math.max(-this.height, (P.Person.slideY || 0) + 13 ) * 2)) / 2,
      0);
  } else {
    return this._computeAlignment()
  }
}

P.Person.prototype.stickyX = 1
P.Person.prototype.stickyY = -1

P.Person.prototype.isSticky = function() {
  return P.Scene.me && P.Scene.me.clone === this
}

P.Person.prototype.isBillboard = function() {
  return true
}

P.Person.prototype.getZIndex = function() {
  if (this.workplace && P.Scene.state != 'graph')
    return -10;
  else
    return (P.Scene.me === this ? 450 : P.Scene.target === this ? 350 : this.zIndex) + (camera.zoom < 0.6 ? 50 : 0);
}

P.Person.prototype.onHover = function(pointer) {
  pointer.person = this
  pointer.area = this.area;
  pointer.zone = this.zone;
  return pointer;
}
P.Person.prototype.onDisappear = function() {
  if (!this.imageUsers || !this.imageUsers.length) 
    P.Object.prototype.onDisappear.apply(this, arguments)
}
P.Person.prototype.onAppear = function() {
  var result = P.Object.prototype.onAppear.apply(this, arguments)
  if (this.workplace) {
    this.workplace.atlasIndex = this.atlasIndex
    this.workplace.instances.changes |= this.workplace.instances.UPDATE_UV
  }
  if (this.clone)
    this.clone.atlasIndex = this.atlasIndex;
  return result
}
P.Person.prototype.shouldBeRendered = function() {
  if (this === P.Scene.me)
    return true;
  if (this.opacity === 0)
    return;
  //if (this.workplace)
  //  return;
  return true
}

P.Person.prototype.render = P.Label.prototype.render
P.Person.prototype.build = function(element) {
  element.innerHTML = '<h2></h2>'
}

P.Person.prototype.matchesKeyword = function(q) {
  return (this.name && this.name.toLowerCase().trim().indexOf(q) > -1)
      || (this.tagline && this.tagline.toLowerCase().trim().indexOf(q) > -1)
      || (this.title && this.title.toLowerCase().trim().indexOf(q) > -1)
}

P.Person.prototype.update = function(element) {
  element.firstChild.textContent = this.display_initials || this.name.trim().split(/\s+/g).map(function(name) {
    return name.charAt(0)
  }).join('')
}

P.Person.prototype.setPosition = function(position) {
  var area = P.Area.byId(position.area_id);
  this.isGhost = position.is_ghost
  if (this.isGhost)
    this.fade(0.6)
  else
    this.fade(1);
  this.workplace_id = position.workplace_id;
      this.zoneLayoutResult = null;
  if (area) {
    if (position.point) {
      this.point = {
        x: position.point.coordinates[0], 
        y: position.point.coordinates[1], 
        z: position.point.coordinates[2]
      }
      this.coordinates.x = this.point.x;
      this.coordinates.y = this.point.y;
    }
    var zone = P.Area.byId(position.zone_id, area.zones);
    //if (this.zone != zone) {
      if (this.zone) {
        var index = this.zone.people.indexOf(this);
        if (index > -1)
          this.zone.people.splice(index, 1);
        this.zone.dirtyPeopleLayout = true;
      }
      if (zone) {
        zone.people.push(this)
        zone.dirtyPeopleLayout = true;
      }
      this.zone = zone;
      this.zone_id = zone ? zone.id : null
        var oldArea = this.area;
      if (area != oldArea) {
        var that = this;
        setTimeout(function() { //fixme, animation
          if (oldArea) {
            var index = oldArea.people.indexOf(that);
            if (index > -1)
              oldArea.people.splice(index, 1)
          }
          that.area = area;
        }, 300)
          var index = area.people.indexOf(this);
          if (index == -1)
            area.people.push(this)
        if (P.currently.showingArea == area)
          that.area = area;
        this.fade(P.currently.showingArea == area)
      }

      if (P.Scene.current && !P.Scene.current.shouldLayoutPeople()) {
        P.animate.lock()
      }

    this.moveToCoordinates(this.point.x, this.point.y);


    if (P.Scene.current && !P.Scene.current.shouldLayoutPeople()) {
      P.Scene.current.settings()
      P.Scene.current.onInitialize()
      P.animate.unlock()
    }
  }
}

P.Person.prototype.setStatus = function(status) {
  if (status != this.status) {
    this.status = status;
    this.panel.invalidate();
    if (this.workplace)
      this.workplace.panel.invalidate()
  }
}
P.Person.prototype.getZoom = function() {
  var me = P.Scene.me
  return camera.zoom > 1 && (!me || me.clone != this) ? Math.max(1, camera.zoom / 2) : camera.zoom; 
}

P.Person.instanced = function() {
  var People = THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.people,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY,
    {
      name: 'people',
      getter: 'getPeople',
      disappearing: true
    }
  )

  People.beforeCull = function() {
    var person = P.Scene.me
    if (person) {
      _v3.set(person.getTotalX(), 
              person.getTotalY(), 
              person.getTotalZ())
      var screen = P.Scene.getScreenXY(_v3)
      var px = person.height / 2
      if (P.Scene.showPanels || P.Scene.doNotStickPerson || (screen.x >= px && screen.y >= px && screen.x < window.innerWidth - px  && screen.y < window.innerHeight - px)) {
        this.hideMe()
      } else {

        if (screen.y < px)
          var a = screen.y - px;
        if (screen.y - window.innerHeight + px > 0)
          var b = - (screen.y - window.innerHeight + px);
        if (screen.x < px)
          var c = screen.x - px;
        if (screen.x - window.innerWidth + px > 0)
          var d = - (screen.x - window.innerWidth + px);
        var slideY = Math.min(a || 0, b || 0, c || 0, d || 0)
        if (slideY != P.Person.slideY) {
          P.Person.instances.changes |= P.Person.instances.UPDATE_ALIGNMENT;
          P.Sprite.instances.changes |= P.Person.instances.UPDATE_OFFSET;
        }
        P.Person.slideY = slideY
        P.Sprite.instances.changes |= P.Person.instances.UPDATE_ROTATION
        P.Sprite.instances.changes |= P.Person.instances.UPDATE_UV

        this.showMe()
        
      }

    }
  }

  People.getUnculled = function() {
    var result = [];
    var person = P.Scene.me;
    if (P.Scene.meVisible)
      result.push(P.Scene.meVisible)
    //if (P.Scene.target && P.Scene.target !== P.Scene.me)
    //  result.push(P.Scene.target);
    return result;
  }

  People.showMe = function() {
    if (P.Scene.meVisible) return;
    if (!P.Scene.me.clone) {
      P.Scene.me.clone = new P.Person({})
      P.Scene.me.clone.atlasIndex = P.Scene.me.atlasIndex;
      P.Scene.me.clone.opacity = 1;
    }

    P.Scene.meVisible = P.Scene.me.clone;
    P.Person.instances.changes |= P.Person.instances.UPDATE_RESET;
    P.Sprite.instances.changes |= P.Person.instances.UPDATE_RESET;
  }
  People.hideMe = function() {
    if (!P.Scene.meVisible) return;
    P.Scene.meVisible = null;
    P.Person.instances.changes |= P.Person.instances.UPDATE_RESET;
    P.Sprite.instances.changes |= P.Person.instances.UPDATE_RESET;

  }
  People.disappearing = true;

  P.Person.prototype.instances = People
  P.Person.prototype.limitZoom = 1;

  return People
};