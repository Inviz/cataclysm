

P.Label.Company = function(properties) {
  if (!(this instanceof P.Label.Company))
    return new P.Label.Company(properties);
  if (properties.zone) {
    this.area = properties.zone.area;
  }
  P.Label.apply(this, arguments)
  if (this.zone) {
    this.offset.x += this.zone.coordinates.y
    this.offset.z -= this.zone.coordinates.x
  }
}
P.Label.Company.prototype = new P.Label;
P.Label.Company.prototype.constructor = P.Label.Company;
P.Label.Company.prototype.className = 'company label content';
P.Label.Company.prototype.alignX = 0
P.Label.Company.prototype.alignY = 0.5
P.Label.Company.prototype.zIndex = 0

P.Label.Company.prototype.getKey = function() {
  return 'company/' + this.parent.id
};


P.Label.Company.prototype.build = function(element) {
  element.innerHTML = '\
  <h2></h2>'
};
P.Label.Company.prototype.update = function(element) {
  element.getElementsByTagName('h2')[0].textContent = this.parent.title;
};
P.Label.Company.prototype.isBillboard = function() {
  return true;
};