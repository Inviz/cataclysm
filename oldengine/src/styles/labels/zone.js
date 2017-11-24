




P.Label.Zone = function(properties) {
  if (!(this instanceof P.Label.Zone))
    return new P.Label.Zone(properties);
  if (properties.zone) {
    this.area = properties.zone.area;
  }
  P.Label.apply(this, arguments)
  if (!this.title)
    this.title = ''
  this.uid = Math.floor(Math.random() * 10000000000)
}
P.Label.Zone.prototype = new P.Label;
P.Label.Zone.prototype.constructor = P.Label.Zone;

P.Label.Zone.prototype.className = 'zone label content';
P.Label.Zone.prototype.alignY = 0.5
P.Label.Zone.prototype.shouldBeRendered = function() {
  return ((!this.zone.structural && this.zone.show_label !== false) || P.Scene.state === 'editor') 
       && this.opacity != 0
}

P.Label.Zone.prototype.background = {
  name: 'label',
  padding: 10,
  radius: 1
}

P.Label.Zone.prototype.computeAlignment = function(quaternion) {
  this._computeAlignment(quaternion)
  this.alignment.y += 31;
  if (P.Scene.state !== 'search')
    this.alignment.z -= 8;

  if (this.zone) {
    this.alignment.x += this.zone.corner.y
    this.alignment.z -= this.zone.corner.x
  }
  return this.alignment
}
P.Label.Zone.prototype.getKey = function() {
  return 'zone-' + (this.zone.id || this.uid)
}
P.Label.Zone.prototype.update = function(element) {
  var tagline = element.getElementsByTagName('p')[0]
  var header = element.getElementsByTagName('h2')[0];
  tagline.textContent = this.zone.display_label || this.zone.title
  if (this.zone.value && P.Scene.state === 'chart') {
    header.style.display = 'block';
    header.textContent = this.zone.value + '%';
    header.parentNode.style.borderRadius = '20px';
  } else {
    header.style.display = 'none';
    header.parentNode.style.borderRadius = '20px 20px 0 0';
  }
  if (this.zone.observed == null || this.zone.observed === true)
    header.parentNode.style.color = '#111'
  else
    header.parentNode.style.color = '#444'
}


P.Label.Zone.prototype.build = function(element) {
  element.innerHTML = '\
  <p>Meeting area #3</p>\
  <h2>55%</h2>'
};