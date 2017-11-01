




P.Label.Pin = function(properties) {
  if (!(this instanceof P.Label.Pin))
    return new P.Label.Pin(properties);
  if (properties.zone) {
    this.area = properties.zone.area;
  }
  P.Label.apply(this, arguments)
  if (this.target && this.target instanceof P.Person)
    this.className += ' person'
}
P.Label.Pin.prototype = new P.Label;
P.Label.Pin.prototype.constructor = P.Label.Pin;
P.Label.Pin.prototype.className = 'pin label content';
P.Label.Pin.prototype.alignX = 0
P.Label.Pin.prototype.alignY = -0.5
P.Label.Pin.prototype.isBillboard = function() {
  return true
}

P.Label.Pin.prototype.shouldBeRendered = function() {
  return (!this.target || this.getTarget().opacity != 0) && P.Scene.state !== 'graph';
}
/*
P.Label.Pin.prototype.computeAlignment = function(quaternion) {
  var target = this.getTarget();
  if (target) {
    var scale = (target.scale || 1);
    var width = target.width;
    var height = target.height;
    
    if (target instanceof P.Person) {
      var x = (width + 10) / camera.zoom 
      var y =  (height / 3) / camera.zoom 

    } else {
      var x = width / 2 / camera.zoom 
      var y = - (20) / camera.zoom 

    }

    var attachIndex = this.attachIndex;
    if (attachIndex == null) {
      if (!target.attachedItems)
        target.attachedItems = 0;
      target.attachedItems++;
      this.attachIndex = attachIndex = target.attachedItems - 1;
    }
    if (target instanceof P.Label)
      x +=  35 / camera.zoom
    this.alignment.set(x + attachIndex * 50 / camera.zoom,y,0).applyQuaternion(this.quaternion)
    this.alignment.x -= (P.Scene.cameraDirection.x)
    this.alignment.y -= (P.Scene.cameraDirection.y)
    this.alignment.z -= (P.Scene.cameraDirection.z)
  } else {
    this._computeAlignment(quaternion)
    var offsetX = camera.currentType == 'flat' ?  0 : 0;
    var offsetY = camera.currentType == 'flat' ?  15 : 0;

    if (this.parent.coordinates) {
      this.alignment.x += (this.zone ? this.parent.coordinates.y - this.zone.coordinates.y : 0)  + offsetY
      this.alignment.z -= (this.zone ? this.parent.coordinates.x - this.zone.coordinates.x : 0)
    } else {
      this.alignment.x += (this.zone ? this.zone.height : 0) / 2  + offsetY
      this.alignment.z -= (this.zone ? this.zone.width : 0) / 2
    }
  }

  return this.alignment
}*/
P.Label.Pin.prototype.getKey = function() {
  return 'pins/' + this.parent.type + '/' + (this.parent.id)
}
P.Label.Pin.prototype.update = function(element) {
  var tagline = element.getElementsByTagName('p')[0]
  var header = element.getElementsByTagName('h2')[0];
  var date = this.parent.type != 'pin' && this.parent.start_datetime
  if (date) {
    date = new Date(date);
    var h = date.getHours();
    var m = date.getMinutes();
    if (h < 10)
      h = '0' + h;
    if (m < 10)
      m = '0' + m
    var time = h + ':' + m
    tagline.innerHTML = time// + (this.event.subtitle ? '<br>' + this.event.subtitle : '')
  } else {
    tagline.innerHTML = '';
  }
}

P.Label.Pin.prototype.build = function(element) {
  element.innerHTML = '\
  <p>Meeting area #3</p>'
};