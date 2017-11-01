
POSIT_PRELOAD = function() {
return
  
for (var property in P.sprites)
  P.Sprite.instances.material.map.allocate({}, P.sprites[property])

setTimeout(function() {
  for (var property in P.icons)
    P.Sprite.instances.material.map.allocate({}, P.icons[property])

}, 3000);

setTimeout(function() {

  (new Image).src = ('./images/furniture/chair.png?ver=' + P.version.commit);
  (new Image).src = ('./images/furniture/chairs.png?ver=' + P.version.commit);
  (new Image).src = ('./images/furniture/sofa.png?ver=' + P.version.commit);
  (new Image).src = ('./images/furniture/table.png?ver=' + P.version.commit);
}, 6000);
}