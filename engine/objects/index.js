P.instances = function() {
  P.instances.distinct = [
    P.Floor.prototype.instances      = P.Floor.instances      = P.Floor.instanced(),
    P.Road.prototype.instances       = P.Road.instances       = P.Road.instanced(),
    P.Roof.prototype.instances       = P.Roof.instances       = P.Roof.instanced(),
    P.Background.prototype.instances = P.Background.instances = P.Background.instanced(),
    P.Underlay.prototype.instances   = P.Underlay.instances   = P.Underlay.instanced(),
    P.Sprite.prototype.instances     = P.Sprite.instances     = P.Sprite.instanced(),
    P.Icon.prototype.instances       = P.Icon.instances       = P.Icon.instanced(),
    P.Label.prototype.instances      = P.Label.instances      = P.Label.instanced(),
    P.Panel.prototype.instances      = P.Panel.instances      = P.Panel.instanced(),
    P.Wall.prototype.instances       = P.Wall.instances       = P.Wall.instanced(),
    P.Overlay.prototype.instances    = P.Overlay.instances    = P.Overlay.instanced(),
    P.Furniture.prototype.instances  = P.Furniture.instances  = P.Furniture.instanced(),
    P.Box.prototype.instances        = P.Box.instances        = P.Box.instanced()
  ]
  P.instances.distinct.map(function(instances) {
    return P.Scene.add(instances)
  })
  P.instances.list = [
    P.Floor.instances,
    P.Road.instances,
    P.Roof.instances,

    P.Wall.instances,
    P.Furniture.instances,
    P.Box.instances,
    P.Overlay.instances,
    P.Underlay.instances,
    P.Label.instances,
    P.Label.instances.front,
    P.Panel.instances,
    P.Icon.instances,
    P.Icon.instances.front,
    P.Sprite.instances,
    P.Sprite.instances.front,
    P.Background.instances,
    P.Background.instances.front
  ]
  P.cull.order = P.instances.list
  return
  //P.Scene.add(P.Line.prototype.instances       = P.Line.instances       = P.Line.instanced());
  //P.Scene.add(P.Underlay.prototype.instances   = P.Underlay.instances   = P.Underlay.instanced());
  //P.Scene.add(P.Furniture.prototype.instances  = P.Furniture.instances  = P.Furniture.instanced());
  //P.Scene.add(P.Wall.prototype.instances       = P.Wall.instances       = P.Wall.instanced());
  //P.Scene.add(P.Overlay.prototype.instances    = P.Overlay.instances    = P.Overlay.instanced());
  //P.Scene.add(P.Background.prototype.instances = P.Background.instances = P.Background.instanced());
  //P.Scene.add(P.Sprite.prototype.instances     = P.Sprite.instances     = P.Sprite.instanced());
  //P.Scene.add(P.Label.prototype.instances      = P.Label.instances      = P.Label.instanced());
  //P.Scene.add(P.Person.prototype.instances     = P.Person.instances     = P.Person.instanced());
  //P.Scene.add(P.Company.prototype.instances    = P.Company.instances    = P.Company.instanced());
  //P.Scene.add(P.Icon.prototype.instances       = P.Icon.instances       = P.Icon.instanced());
  

  // set dependent instances

  /*
  P.Label.instances.front.backgrounds = P.Background.instances.front;
  P.Label.instances.front.icons = P.Icon.instances.front;
  P.Icon.instances.front.backgrounds = P.Background.instances.front;

  P.Label.instances.backgrounds = P.Background.instances;
  P.Label.instances.icons = P.Icon.instances;
  P.Icon.instances.backgrounds = P.Background.instances;
  P.Icon.instances.backgrounds = P.Background.instances;
  P.Panel.instances.backgrounds = P.Background.instances;
  P.Panel.instances.icons = P.Icon.instances.front;

  P.Person.instances.sprites = P.Sprite.instances;
  // single floor polygon
  
  P.Person.instances.panels = P.Panel.instances;*/


}
