P.views.defaults = {

  camera: {
    far: 14000,
    near: -10000,
    zoom: 1,
    
    r: 234 / 255,
    g: 234 / 255,
    b: 234 / 255
  },

  fog: {
    density: 0
  },

  light: {
    x: 4200,
    y: 3500,
    z: 2500
  },

  target: {
    x: -140, 
    y: -125,
    z: 0
  },

  area: {
    label: {
      rotateZ: 0,
      shiftX: 0,
      shiftY: 0,
      shiftZ: 0,
      alignX: 0.5,
      alignY: 0.5
    },
    zone: {
      label: {
        rotateZ: 0,
        shiftX: 0,
        shiftY: 0,
        shiftZ: 0,
        alignX: 0.5,
        alignY: 0.5
      },
      shiftX: 0,
      shiftY: 0,
      shiftZ: 0
    },

    person: {
      zoom: 1
    },
    shiftX: 0,
    shiftY: 0,
    shiftZ: 0,

    showAllZones: 0,
    showExtrusions: 0,
    //onlyShowDoors: 0
  },

  walls: {
    scaleY: 1,
    material: {
      opacity: 1
    }
  },
  
  floors: {
    material: {
      opacity: 1
    },
    x: 0,
    y: 0,
    z: 0
  },
  
  labels: {
    material: {
      opacity: 1
    },
    x: 0,
    y: 0,
    z: 0
  },
  
  people: {
    material: {
      opacity: 1
    }
  },

  
  workplaces: {
    material: {
      opacity: 1
    }
  },

  furniture: {
    y: 1,
    material: {
      opacity: 1
    }
  },

  sprites: {
    material: {
      opacity: 1
    }
  },

  lines: {
    material: {
      opacity: 1
    }  },

  overlays: {
    material: {
      opacity: 1
    },
    y: 0
  },

  underlays: {
    material: {
      opacity: 1
    },
    y: 0.25
  },

  settings: function() {
    return;
  },

  isZoomEnabled: function() {
    return true
  },

  restrictRotation: function() {
    controls.minPolarAngle = - Math.PI / 2; // radians
    controls.maxPolarAngle = Math.PI / 2 * 0.75; // radians
    controls.minAzimuthAngle = Math.PI / 4; // radians
    controls.maxAzimuthAngle = Math.PI / 2 * 1.5; // radians
  },

  defaultCullLevel: function() {
    P.cull.level = P.Zone;
  },


  getTargetArea: function() {
    if (P.Scene.state !== 'location')
      return this.getData()
  },

  isObjectCulled: function(object) {
    if (P.cull.level === null)
      return true;
    var area = this.getTargetArea()
    if (area && object.area != area)
      return true
    var zones = this.getZones(area);
    if (zones && (!object.zone || zones.indexOf(object.zone) == -1))
      return true;
  },

  isObjectVisible: function(object, callback) {
    if (callback)
      var visible = callback.call(this, object)
    if (visible != null)
      return visible;
    return !this.isObjectCulled(object)
  },

  getRoads: function() {
    return P.city.roads;
  }
};