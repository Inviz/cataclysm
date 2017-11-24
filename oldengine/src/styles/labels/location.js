P.Panel.Location = function(properties) {
  if (!(this instanceof P.Panel.Location))
    return new P.Panel.Location(properties);
  P.Panel.apply(this, arguments)


  return this;
}
P.Panel.Location.prototype = new P.Panel;
P.Panel.Location.prototype.constructor = P.Panel.Location;
P.Panel.Location.prototype.className = 'location panel content';

P.Panel.Location.prototype.x = 0;
P.Panel.Location.prototype.y = 0;
P.Panel.Location.prototype.z = 0;
P.Panel.Location.prototype.alignX = 0.5;
P.Panel.Location.prototype.alignY = 0.5;
P.Panel.Location.prototype.radius = 1;
P.Panel.Location.prototype.important = true


P.Panel.Location.prototype.computeAlignment = function(quaternion) {
  var alignment = this._computeAlignment(camera.quaternion)
  var offset = 60
  alignment.x += this.area.contentBox.min.y
  alignment.z -= this.area.contentBox.min.x 
  alignment.y = (offset + this.height) / camera.zoom;
  return alignment;
}

P.Panel.Location.prototype.shouldBeRendered = function() {
  if (P.Scene.state === 'location')
    return this.area.location.areas[0] === this.area
}

P.Panel.Location.prototype.update = function(stats) {
  stats.querySelector('h1').textContent = this.area.location.title;
  stats.querySelector('h2').textContent = this.area.location.community.title;
  this.area.stats = stats;
}

P.Panel.Location.prototype.build = function(element) {
  element.innerHTML = '\
      <h1></h1>\
      <h2></h2>\
  '
};