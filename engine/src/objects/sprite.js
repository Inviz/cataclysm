P.Sprite = function(properties) {
  if (properties != null)
    P.Object.call(this, properties)
}
P.Sprite.prototype = new P.Object
P.Sprite.prototype.constructor = P.Sprite


P.Sprite.prototype.computeUV = function() {
  if (this.atlasIndex == null)
    this.atlasIndex = this.instances.material.map.allocate(null, P.sprites[this.name])
  return this._computeUV()
}
P.Sprite.prototype.onAppear = function(force) {
  if (force === true)
    return this._onAppear()
  this.computeUV()
  return this.atlasIndex != null
}

P.Sprite.prototype.computeQuaternion = function() {

  this._computeQuaternion()

  if (this.rotateX)
    return this.quaternion.setFromAxisAngle(_v3.set(1,0,0), this.rotateX)
  return this.quaternion
  /*
  var target = this.target;
  if (target === P.Scene.meVisible) {

    var screen1 = P.Scene.getScreenXY(
      _v3.set(P.Scene.me.getTotalX(true), P.Scene.me.getTotalY(true), P.Scene.me.getTotalZ(true))
    );
    var screen2 = P.Scene.getScreenXY(P.Person.instances.getPositionAt(P.Scene.meVisible.index, _v3));
    var rad = Math.atan2(screen2.y - screen1.y + 25, screen2.x - screen1.x + 25)

    _q.setFromAxisAngle(_v3.set(0, 0, -1), rad - Math.PI / 4)
    _qq.setFromRotationMatrix( camera.matrix )
    this.setQuaternionAt(index, _qq.multiply(_q))
  } else {

    var north = target.area.north != null ? target.area.north : target.area.location && target.area.location.north || 0
    _q.setFromAxisAngle(_v3.set(0, 0, -1), camera.rotation.z + THREE.Math.degToRad(north + (P.Scene.compassHeading || 0)))
    _qq.setFromRotationMatrix( camera.matrix )
    this.setQuaternionAt(index, _qq.multiply(_q))
  }*/
}
/*

P.Sprite.prototype.computeColor = function() {
  ((object === P.pointer.person || object === P.pointer.workplace) && sprite.highlightingColor) ||
  (target && (
    object  === target 
  || object === target.workplace
  || object === target.clone) && sprite.targetColor) || sprite.color
}

P.Sprite.prototype.computeOpacity = function() {

  if (sprite == P.sprites.shadow && (object === P.Scene.target || object === P.Scene.meVisible || P.Scene.state === 'graph'))
    var opacity = 0;
}

*/


//if (type === 'indication') {
//  var magnify = 3 - object.indication * 2;
//  var opacity = object.indication * object.indication
//  var zShift = 0;
//}
P.Sprite.instanced = function() {
  var Sprites = THREE.InstancedMesh.create(
    new THREE.PlaneBufferGeometry( 1, 1, 1, 1),
    P.materials.sprites,
    P.UPDATE_POSITION | P.UPDATE_SCALE | P.UPDATE_ROTATION | P.UPDATE_UV | P.UPDATE_OPACITY | P.UPDATE_COLOR,
    {
      name: 'sprites',
      defines: {
        USE_CHANNEL_PACKING: ''
      },
      sort: function(a, b) {
        return a.renderIndex - b.renderIndex
      },
      buildList: function() {
        return this.collectFromInstances('sprites', 
//          P.Workplace.instances.lastVisible, 
          P.Person.instances.lastVisible)
      }
    },
    {
      buildList: function() {
        return this.collectFromInstances('indication', 
//          P.Workplace.instances.lastVisible, 
          P.Person.instances.lastVisible)
      },
      defines: {
        USE_CHANNEL_PACKING: '',
        IGNORE_GREEN: ''
      }
    }
  );
  return Sprites;

};