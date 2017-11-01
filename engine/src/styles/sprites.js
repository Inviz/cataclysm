P.sprites.shadow = {
  src: 'images/shadow.png',
  opacity: 0.5,
  rotateX: - Math.PI / 2,
  offsetY: -30,
  color: new THREE.Color(0,0,0),
  width: 55,
  height: 55,
  zIndex: -5,
  renderIndex: -1
}

P.sprites.border = {
  src: 'images/border.png',
  opacity: 1,
  highlightingColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  targetColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  color: new THREE.Color(86 / 255, 182 / 255, 198 / 255),
  zIndex: -2,
  width: 55,
  height: 55
}
P.sprites.borderRectangle = {
  src: 'images/border_rectangle.png',
  opacity: 1,
  highlightingColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  targetColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  color: new THREE.Color(86 / 255, 182 / 255, 198 / 255),
  zIndex: -1,
  width: 55,
  height: 55
}

P.sprites.button = {
  src: 'images/button.png',
  opacity: 1,
  color: new THREE.Color(1,1,1),
  padding: 10,
  zIndex: -1
}

P.sprites.background = {
  src: 'images/background.png',
  opacity: 1,
  color: new THREE.Color(1,1,1),
  padding: 10,
  zIndex: -1
}

P.sprites.button_dark = {
  src: 'images/button_dark.png',
  opacity: 0.8,
  color: new THREE.Color(1,1,1),
  padding: 10,
  zIndex: -1
}

P.sprites.label = {
  src: 'images/label.png',
  opacity: 1,
  color: new THREE.Color(1,1,1),
  padding: 10,
  zIndex: -1
}

P.sprites.direction = {
  src: 'images/direction.png',
  opacity: 1,
  highlightingColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  targetColor: new THREE.Color(233 / 255,85 / 255,164 / 255),
  color: new THREE.Color(86 / 255, 182 / 255, 198 / 255),
  isCompass: true,
  width: 55,
  height: 55,
  zIndex: -1
};