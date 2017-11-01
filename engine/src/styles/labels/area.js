P.Label.Area = function(properties) {
  if (!(this instanceof P.Label.Area))
    return new P.Label.Area(properties);
  P.Label.apply(this, arguments)

  return this;
}
P.Label.Area.prototype = new P.Label;
P.Label.Area.prototype.constructor = P.Label.Area;

P.Label.Area.prototype.className = 'area label content';
P.Label.Area.prototype.renderIndex = 0;
P.Label.Area.prototype.pointerPriority = 5;
P.Label.Area.prototype.paddingX = 15;
P.Label.Area.prototype.paddingY = 15;

P.Label.Area.prototype.background = {
  name: 'button'
}
P.Label.Area.prototype.computeAlignment = function(quaternion) {
  if (!this.isSticky()) {
    var alignment = this._computeAlignment()

    alignment.x += this.area.contentBox.min.y
    alignment.z -= this.area.contentBox.min.x 
    alignment.y += 20 / camera.zoom;
    alignment.z -= 4 / camera.zoom;
  } else {
    var alignX = 0.5;
    var alignY = 0.5;
    this.alignment.set(
      this.paddingX + this.width * alignX * this.zoom,
      - (this.paddingY + this.height * alignY * this.zoom),
      0
    )
  }
  return alignment;
}

P.Label.Area.prototype.update = function(element) {
  var tagline = element.getElementsByTagName('p')[0]
  var header = element.getElementsByTagName('h2')[0];
  this.simplified = P.Scene.state === 'location'
  tagline.textContent =  this.simplified ? '' : this.area.location.title;
  header.textContent = this.area.title
}

P.Label.Area.prototype.getKey = function() {
  return this.area.id ? 'area-' + this.area.id : this.area.title
}
P.Label.Area.prototype.onClick = function() {
  if (P.currently.showingArea === this.area && P.Scene.state !== 'search' && P.Scene.state !== 'graph') {
    P.Scene.navigate('location')
  } else {
    P.currently.showingArea = this.area;
    P.Scene.navigate('floor', null, new THREE.Vector3(
      this.area.areaBox.min.y + this.area.areaBox.height / 2,
      this.area.offset.y,
      -this.area.areaBox.min.x - this.area.areaBox.width / 2
    ))
  }

  return false;
}
P.Label.Area.prototype.shouldBeRendered = function() {
  if (P.Scene.state === 'location' || /*this.area.floorBox.topLeft === this.area || */this.area === P.currently.showingArea) 
    return true;
  return false
}

P.Label.Area.prototype.isSticky = function() {
  return this.area === P.currently.showingArea;
}
P.Label.Area.prototype.build = function(element) {
  element.innerHTML = '\
    <p>23 people</p>\
    <h2>Meeting area #3</h2>\
  '
};