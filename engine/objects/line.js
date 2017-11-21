P.Line = function(properties) {
  if (properties != null)
    P.Object.call(this, properties)
}

P.Line.prototype = new P.Object;

P.Line.prototype.compute = function(changes) {
  return changes
};



P.Line.instanced = function() {
  var line = new THREE.BoxBufferGeometry( 1, 1, 1, 1);
  var _v3 = new THREE.Vector3();
  var _q = new THREE.Quaternion();

  var Lines = new THREE.InstancedMesh( 
    line,                                                   //this is the same 
    P.materials.lines, 
    0,                                                      //instance count
    false,                                                     //is it dynamic
    true,                                                      //does it have color
    true,                                                      //uniform scale, if you know that the placement function will not do a non-uniform scale, this will optimize the shader,
    false,   // Does it use instance matrix?
    false,  // Does it use instance UVs?
    true   // Does it use instance opacity?
  );
  Lines.updateAt = function(index, link, needsUpdate) {


    if (needsUpdate & 2/*this.UPDATE_OFFSET*/ ||
        needsUpdate & 16/*this.UPDATE_SCALE*/ ||
        needsUpdate & 32/*this.UPDATE_ROTATION*/) {
      var pos = link;
      var distance = Math.sqrt(Math.pow(pos.to.x - pos.from.x, 2) + Math.pow(pos.to.y - pos.from.y, 2) )
      var angle = Math.atan2((pos.to.y - pos.from.y), (pos.to.x - pos.from.x) );
      if (angle < 0.0)
          angle += Math.PI * 2;
      _q.setFromAxisAngle(_v3.set(0,-1, 0),angle);
      Lines.setQuaternionAt( index , _q );

      var x = pos.from.x + (pos.to.x - pos.from.x) / 2;
      var y = (pos.from.y + (pos.to.y - pos.from.y) / 2);
      var scale = (link.zoom || 1);
      _v3.set(y,  0, - x)
      if (link.area)
        _v3.add(link.getParent())

      Lines.setPositionAt( index , _v3);


      Lines.setScaleAt( index , _v3.set(scale,0.0001,distance + scale * 0.8) );
    }
    if (needsUpdate & 64/*this.UPDATE_COLOR*/)
      Lines.setColorAt( index , link.color );

    if (needsUpdate & 512/*this.UPDATE_OPACITY*/)
      Lines.geometry.attributes.instanceOpacity.setX(index, link.opacity != null ? link.opacity : 1)
  }
  Lines.renderForAreas = true;
  Lines.name = 'lines'



  return Lines
};