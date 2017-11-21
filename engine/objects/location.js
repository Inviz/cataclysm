P.Location = function(properties) {
  
  if (properties == null)
    return;

  if (!(this instanceof P.Location))
    return new P.Location(properties);

  P.Object.apply(this, arguments);
}


P.Location.prototype = new P.Object
P.Location.prototype.north = 0