P.styles.pastelColors = [];
'{2,63,165},{125,135,185},{190,193,212},{214,188,192},{187,119,132},{142,6,59},{74,111,227},{133,149,225},{181,187,227},{230,175,185},{224,123,145},{211,63,106},{17,198,56},{141,213,147},{198,222,199},{234,211,198},{240,185,141},{239,151,8},{15,207,192},{156,222,214},{213,234,231},{243,225,235},{246,196,225},{247,156,212}'
  .replace(/\{(\d+),(\d+),(\d+)\}/g, function(a, r, g, b) {
    if (parseInt(r) < 30 || parseInt(g) < 30 || parseInt(b) < 30)
      return 
    P.styles.pastelColors.push(new THREE.Color(parseInt(r) / 255, parseInt(g) / 255, parseInt(b) / 255))
  });


P.styles.backgroundColor = new THREE.Color(233 / 255,233 / 255,233 / 255);
P.styles.targetColor = new THREE.Color(183 / 255, 210 / 255, 218 / 255);
P.styles.currentBackgroundColor = new THREE.Color(233 / 255,233 / 255,233 / 255);

P.styles.floorColor = new THREE.Color(0.6,0.6,0.6);
P.styles.floorPrivateColor = new THREE.Color(0.8,0.8,0.8);
P.styles.floorInactiveColor = new THREE.Color(0.82,0.82,0.82);
P.styles.solidWallColor = new THREE.Color(0.7,0.7,0.7)
P.styles.labelPrivateColor = new THREE.Color(0.7,0.7,0.7);
P.styles.highlightColor = new THREE.Color(120 / 255,130 / 255,120 / 255);
P.styles.glassColor = new THREE.Color(149 / 255,200 / 255,220 / 255);
P.styles.glassColor2 = new THREE.Color(194 / 255,228 / 255,244 / 255);


P.styles.currentGlassColor = new THREE.Color(141 / 255,191 / 255,212 / 255);