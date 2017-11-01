P.views.location = new P.Scene.Surface({

  getData: function() {
    return P.currently.showingArea || (P.Scene.me && P.Scene.me.area) || P.areas[0]
  },

  getTarget: function() {
    var area = P.currently.showingArea
    if (area) {
      return area.getCenter(false);
    }
    var target = this._getTarget.apply(this, arguments).clone();
    if (!P.Scene.target)
      target.y += 1500
    return target
  },

  underlays: {
    material: {
      opacity: 1
    },
    y: 1
  },
  floors: {
    material: {
      opacity: 0
    },
    y: 1
  },
  overlays: {
    y: 3
  },

  area: {
    onlyShowDoors: 1
  },

  isZoomEnabled: function() {
    return false
  },

  camera: {
    zoom: 0.25
  },

  getCameraTiltY: function() {
    return Math.PI / 3
  },

  getPerspectiveType: function() {
    return 'flat'
  },

  closeFloater: function() {
    P.Panel.close()
    P.Scene.setTarget(null)
  },

  isFurnitureVisible: function(furniture) {
    return false;
  },

  isPinVisible: function(event) {
    if (P.Scene.showPanels)
      return false;
    return !!(event.start_datetime || (!event.point))
  },

  isPersonVisible: function(person) {
    if (P.Scene.showPanels)
      return false;
    if (person === P.Scene.me || (P.Scene.me && !person.workplace && P.Scene.me.favorites.indexOf(person) > -1))
      return true;
          
    return false
  },

  isCompanyVisible: function(person) {
    return false
  },

  isWorkplaceVisible: function(workplace) {
    if (P.Scene.showPanels)
      return false;
    if (P.Scene.me && P.Scene.me.workplace === workplace 
    || (workplace.person && workplace.person.workplace == workplace && P.Scene.me && P.Scene.me.favorites.indexOf(workplace.person) > -1))
      return true
          
    return false
  },

  isPanelVisible: function(panel) {
    return panel.shouldBeRendered();
  },

  scenes: function() {
    P.Scene.rotateLabels = true
    P.Scene.rotatePanels = true
    P.currently.showingArea = null;
    P.cull.level = P.Area
    
    P.areas.forEach(function(area) {
      area.floorColor = new THREE.Color(0.8,0.8,0.8);
      P.animate.property(area, null, 'wallHeight', 0.1)
      P.animate.property(area.label, null, 'opacity', 1)
      //area.zoneFloorOpacity = 1;
    })
  }
});