P.Pin = function(properties) {
  var options = Object.create(properties);

  options.icon = {
    name: P.Icon.buttons[options.pin_type] && options.pin_type || options.icon || 'training',
    alignY: 0.5
  }
  if (!options.target)
    options.target = (!options.point && options.area.label)

  var area = (options.zone ? options.zone.area : options.area);
  if (options.start_datetime) {
    this.label = new P.Label.Pin({
      area: (options.zone ? options.zone.area : options.area),
      zone: options.zone,
      parent: this,
      pin: this,
      target: this
    });
  }
  
  this.panel = new P.Panel.Profile({
    parent: this,
    pin: this,
    target: this,
    attachY: 60,
    cardURL: options.card_url,
    icon: options.type == 'event' || options.card_url ? 'expand' : null
  })
  if (!options.color || !(options.color instanceof THREE.Color)) {
    var type = options.pin_type || options.icon;
    if (type === 'meeting_room' && !options.color)
      options.color = '#2d9cdb'
    if (type === 'beer')
      options.color = '#ffda87'

  }
  P.Object.call(this, options)
  if (this.color && !(this.color instanceof THREE.Color))
    this.color = new THREE.Color().setStyle(this.color)
  if (!this.color)
    this.color = new THREE.Color(0.7,0.7,0.7)

  this.changes = P.UPDATE_RESET
  this.icon.color = this.color
  console.info(this.coordinates, this, this.offset)
}

P.Pin.filter = function(areas) {};
P.Pin.compute = function() {
  var changes = this.changes;
  if (changes) {
    P.areas.forEach(function(area) {
      area.pins.forEach(function(pin) {
        pin.compute(changes | pin.changes)
        pin.changes = 0;
      })
    })
  }
  this.changes = 0;
}
P.Pin.changes = 0;


P.Pin.prototype = new P.Object;
P.Pin.prototype.constructor = P.Pin;
P.Pin.prototype.width = 1;
P.Pin.prototype.height = 1;
P.Pin.prototype.opacity = 1;
P.Pin.prototype.zIndex = 200
;
P.Pin.prototype.isEvent = function() {
  return this.start_datetime || (!this.point);
}
P.Pin.prototype.isBillboard = function() {
  return true;
}
P.Pin.prototype.color = new THREE.Color(0.7,0.7,0.7);
P.Pin.prototype.visibilityMethod = 'isPinVisible'
