P.views.chart = new P.Scene.Canvas({
  
  closeFloater: function() {
    P.Panel.close()
  },

  isPersonVisible: function() {
    return false;
  },
  isPinVisible: function() {
    return false;
  },
  isFurnitureVisible: function() {
    return false;
  },
  isWorkplaceVisible: function(workplace) {
    return false
  },
  isLabelVisible: function(workplace) {
    return false
  },
  isLabelVisible: function(label) {
    if (!label.zone.observed || this.getTargetZoom() < 0.6 || !label.zone.value)
      return false;
  },

  makeOverlaysTestDepth: function() {
    P.Overlay.instances.material.depthTest = 0;
    P.Overlay.instances.material.depthWrite = 0;
  },

  makePeopleWriteDepth: function() {
    P.Person.instances.material.depthWrite = 0;
    P.Sprite.instances.material.depthWrite = 0;
    P.Icon.instances.material.depthWrite = 0;
  },

  extrusion: function(area) {
    var area = this.getData();
    //var interval = function () {
    P.Wall.instances.changes |= P.Overlay.instances.UPDATE_COLOR
    console.log('interval', P.currently.showingArea)
    for (var i = 0; i < P.areas.length; i++) {
      if (P.areas[i] === area) {
        clearTimeout(P.areas[i].decolorize)
        for (var j = 0; j < P.areas[i].zones.length; j++) {
          var zone = P.areas[i].zones[j];
          zone.colorized = true;
          if (zone.structural) {
            P.animate.property(area.zones[j], null, 'extrudeY', 0);
            if (area.zones[j].targetExtrusionOpacity)
              P.animate.property(area.zones[j], null, 'extrusionOpacity', 0);
            continue
          }
          if (!zone.observed || !zone.value) continue;

          var height = (zone.extrusionHeight) / 28;
          var extrusion = {
            extrudeY: zone.extrusionHeight + 28,
            extrusionOpacity: 0.6
          };
          P.animate.scene(extrusion, zone)

          P.animate.property(zone.label, 'shift', 'x', 28 * 2)
          P.animate.property(zone.label, 'shift', 'y', 5)
          var offsetX = zone.corner.x - zone.coordinates.x + 5
          P.animate.property(zone.label, 'shift', 'z', - Math.max(0, zone.width / 2) + offsetX)

          P.animate.property(zone.label, undefined, 'alignX', 0)

          zone.label.invalidate()

        }
      }
    }
  },

  onUnload: function(mode) {
    var area = P.currently.showingArea
    for (var j = 0; j < area.zones.length; j++) {
      if (area.zones[j].structural) {
        P.animate.property(area.zones[j], null, 'extrudeY', area.zones[j].targetExtrudeY || 0);
        if (area.zones[j].targetExtrusionOpacity)
          P.animate.property(area.zones[j], null, 'extrusionOpacity', area.zones[j].targetExtrusionOpacity);
      }
      if (!area.zones[j].observed)
        continue;
      if (area.zones[j].value) {
        area.zones[j].label.invalidate();
        P.animate.property(area.zones[j], null, 'extrusionOpacity', 0);
        P.animate.property(area.zones[j], null, 'extrudeY', 0);
      }
      area.zones[j].value = 0;
    }
  },


  getPerspectiveType: function() {
    return P.Scene.cameraPreference || 'isometric'
  },

  getTarget: function() {
    if (P.Scene.previousState === 'location') 
      return P.pointer.getPoint()

    return controls.target.clone()
  }
});