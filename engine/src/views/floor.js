P.views.floor = new P.Scene.Canvas({

  furniture: {
    material: {
      opacity: 1
    },
  },

  getPerspectiveType: function() {
    return P.Scene.cameraPreference || 'isometric'
  },
  getCameraTiltY: function() {
    return 0
  },

  getTarget: function() {
    if (P.Scene.previousState === 'chart') 
      return controls.target.clone();

    if (P.Scene.previousState === 'location' && (!P.Scene.target || (P.Scene.target.area != P.pointer.area && P.pointer.area))) 
      return P.pointer.getPoint()
        
    var target = P.Scene.target
    if (target && this.getData() === target.area) {
      var layout = target.zoneLayoutResult;
      return new THREE.Vector3(
        target.getTotalX(false) - target.area.shift.x - (target.zone ? target.zone.shift.x : 0) + (layout ? (layout[1] - target.coordinates.y) : 0),
        target.getTotalY(false) - target.area.shift.y - (target.zone ? target.zone.shift.y : 0),
        target.getTotalZ(false) - target.area.shift.z - (target.zone ? target.zone.shift.z : 0) - (layout ? (layout[0] - target.coordinates.x) : 0)
      )
    }
    return controls.target.clone()
  }

});