P.materials.text = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  alphaTest: 0.1,
  transparent: true
});

P.materials.panels = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  alphaTest: 0.15,
  transparent: true
});


P.materials.walls = new THREE.MeshLambertMaterial({
  alphaTest: 0.02,
  transparent: true
});

P.materials.cursor = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  opacity: 1,
  transparent: true
});


P.materials.invisible = new THREE.MeshLambertMaterial({
  visible: false
});

P.materials.floor = new THREE.MeshLambertMaterial({
  color: 0xf9f9f9,
  alphaTest: 0.02,
  transparent: true
});
P.materials.underlay = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  depthWrite: 1,
  transparent: true
});
P.materials.overlay = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  depthWrite: 0,
  depthTest: 0,
  transparent: true
});
P.materials.people = new THREE.MeshLambertMaterial({
  //color: 0xff0000,
  alphaTest: 0.1,
  transparent: true
});
P.materials.companies = new THREE.MeshLambertMaterial({
  //color: 0xff0000,
  alphaTest: 0.02,
  depthWrite: false,
  transparent: true
});
P.materials.people.alphaMap = new THREE.TextureLoader().load('images/masks/circle.png?ver=' + P.version.commit);
P.materials.people.alphaMap.magFilter = THREE.NearestFilter;
P.materials.people.alphaMap.minFilter = THREE.LinearFilter;
P.materials.people.alphaMap.wrapT = THREE.RepeatWrapping;
P.materials.people.alphaMap.repeat.y = 1;
P.materials.people.alphaMap.repeat.x = 1;
P.materials.people.alphaMap.offset.y = 0;
P.materials.people.alphaMap.offset.x = 0;


P.materials.backgrounds = new THREE.MeshLambertMaterial({
  alphaTest: 0.02,
  transparent: true
});
P.materials.overgrounds = new THREE.MeshLambertMaterial({
  alphaTest: 0.02,
  depthWrite: false,
  transparent: true
});

P.materials.sprites = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  depthWrite: false,
  transparent: true
});

P.materials.icons = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  transparent: true
});

P.materials.furniture = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  transparent: true
});

P.materials.lines = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  alphaTest: 0.02,
  depthTest: false,
  depthWrite: false,
  transparent: true
});