P.Company = function() {
  if (!(this instanceof P.Company))
    return new P.Company(properties);
  P.Object.apply(this, arguments)
  this.imageSRC = this.logo_thumbnail
  if (!this.imageSRC) {
    this.label = new P.Label.Company({
      area: (this.zone ? this.zone.area : this.area),
      zone: this.zone,
      company: this,
      parent: this,
      shiftY: 100,
      coordinates: {x: 0, y: 0},
      background: false
    });
    this.panel = new P.Panel.Profile({
      parent: this,
      company: this,
      target: this.label
    })
  } else {
    this.loaded = false;
    this.panel = new P.Panel.Profile({
      parent: this,
      company: this,
      target: this
    })
  }
}

P.Company.instanced = function() {
  return P.Person.instances.clone({
    material: P.materials.companies,
    getUnculled: null,
    name: 'companies',
    getter: 'getCompanies',
    renderForZones: true,
    disappearing: true
  });
}

P.Company.prototype = new P.Object;
P.Company.prototype.constructor = P.Company;
P.Company.prototype.color = new THREE.Color(1,0,0);
P.Company.prototype.width = 50
P.Company.prototype.height = 50
P.Company.prototype.alignY = 0.5;
P.Company.prototype.zIndex = 130
P.Company.prototype.getZoom = P.Person.prototype.getZoom;
P.Company.prototype.visibilityMethod = 'isCompanyVisible'
P.Company.prototype.isBillboard = function() {
  return true
}


P.Company.prototype.onHover = function(pointer) {
  pointer.company = this
  pointer.area = this.area;
  pointer.zone = this.zone;
  return pointer;
}

P.Company.prototype.onClick = function() {
  if (P.Scene.target === this) {
    if (!P.Panel.expanded && P.Panel.current.indexOf(this.panel) > -1)
      return P.Scene.target.panel.onClick()
    else
      P.Panel.open(this)
  } else {
    P.Scene.setTarget(this)
    P.Panel.open(this)
  }
  P.Scene.current.onInitialize()
  P.animate.start()

}
P.Company.prototype.setZone = function(zone) {
  this.zone = zone
  this.area = zone.area;
  if (!this.imageSRC) {
    this.label.offset.x = zone.coordinates.y + zone.height / 2
    this.label.offset.z = - zone.coordinates.x - zone.width / 2
    this.label.offset.onPropertyChange(this.label.offset, 'x')
    this.label.zone = zone
    this.label.area = area
  }
  this.coordinates = {
    x: zone.coordinates.x + zone.width / 2,
    y: zone.coordinates.y + zone.height / 2
  }
  this.offset.x = zone.coordinates.y + zone.height / 2
  this.offset.z = - zone.coordinates.x - zone.width / 2
  this.offset.onPropertyChange(this.offset, 'x')
  zone.companies = [this]
}