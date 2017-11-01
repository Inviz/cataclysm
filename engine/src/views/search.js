P.views.search = new P.Scene.Stack({
  controls: {
    enableRotate: false
  },
  camera: {
    //far: 4000,
    //near: 1000
    zoom: 0.8
  },
  floors: {
    material: {
      opacity: 0
    },
    x: -  4000
  },
  furniture: {
    material: {
      opacity: 1
    }
  },


  light: {
    x: 120,
    y: 150,
    z: 0
  },
  target: {
    x: 0, 
    y: 0,
    z: 0
  },

  //fog: {
  //  density: 2
 //},

  area: {
    showAllZones: 1
  },

  underlays: {
    material: {
      opacity: 1
    }
  },

  controls: {
    dontPickArea: true
  },

  isPinVisible: function(pin) {
    return
  },

  
  after: function() {
    
    P.Panel.close()
    var area = this.getData()
    P.cull.chosenArea = area
    P.Scene.rotateLabels = true;
    P.Wall.instances.renderClones = true;
    P.animate.property(area, null, 'onlyShowDoors', 0)
  },

  getZones: function() {

    function shuffle(array) {
      var currentIndex = array.length, temporaryValue, randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }

    var searchTerm = searchInput.value;
    if (!P.currently.showingZones || P.Scene.currentSearch !== searchTerm) {
      P.Scene.currentSearch = searchTerm;
      var scrollHeight = 0;

      P.Scene.currentSearchChanged = true;
      setTimeout(function() {
        P.Scene.currentSearchChanged = false
      }, 150)

      var area = this.getData()
      var zones = area.zones;
      var q = searchTerm.toLowerCase().trim()
      var current = zones.filter(function(zone) {
        if (zone.structural/* || zone.show_label === false*/)
          return;
        if ( (zone.title.toLowerCase().indexOf(q) > -1)) {
          zone.label.highlighted = P.styles.glassColor2;
          var result = true
        } else {
          zone.label.highlighted = null;
        }

        if (zone.people)
          for (var p = 0; p < zone.people.length; p++)
            if (zone.people[p].matchesKeyword(q)) {
              zone.people[p].highlighted = true
              var result = true
            } else {
              zone.people[p].highlighted = false
            }


        for (var p = 0; p < area.workplaces.length; p++)
          if (area.workplaces[p].zone == zone)
            if (area.workplaces[p].person && area.workplaces[p].person.matchesKeyword(q)) {
              area.workplaces[p].highlighted = true
              if (area.workplaces[p].person.area != P.currently.showingArea)
                var result = true
            } else {
              area.workplaces[p].highlighted = false
            }
        return result
      })
      if (current) {
        zones = zones.filter(function(zone) {
          return current.indexOf(zone) == -1
        })
      }
      P.currently.showingZones = zones = current
    } else {
      return P.currently.showingZones
    }

    return zones;
  },

  onInitialize: function() {
    var zones = this.getZones()
    var area = this.getData() 

    area.zones.forEach(function(zone) {
      if (zones.indexOf(zone) == -1) {
        P.animate.property(zone, 'shift', 'x', -4000)
      } else {
        P.animate.property(zone.label, 'shift', 'z',- zone.width / 2 + (zone.corner.x - zone.coordinates.x))
        P.animate.property(zone.label, null, 'alignX', 0)
        P.animate.property(zone.label, null, 'opacity', 1)
      }
    })


    this._onInitialize()


  },

  onUnload: function() {
    searchInput.value = '';
    P.currently.showingZones = null;
    P.people.forEach(function(person) {
      person.highlighted = false
    })
    P.areas.forEach(function(area) {
      area.zones.forEach(function(zone) {
        zone.label.highlighted = null;
      })

      area.workplaces.forEach(function(workplace) {
        workplace.highlighted = null;
      })
    })
  },

  getTarget: function() {
    if (!P.Scene.currentSearchChanged)
      return this._getTarget();;
    var area = this.getData();
    var pos = area.offset.clone()
    var box = area.areaBox;
    //pos.y += 550
    //pos.z -= 10000
    return new THREE.Vector3().set(
      box.center.y, 
      (area.getY(false) || 0), 
      - box.center.x
     )
  },

  getCameraTiltY: function() {
    return P.Scene.cameraPreference == 'flat' ? 0 : Math.PI / 8
  },

  getPerspectiveType: function() {
    return 'flat'
  },

  getData: function(onlyAreas) {
    return P.currently.showingArea || P.currently.editingArea || (P.Scene.me && P.Scene.me.area) || P.areas[0]
  }
});