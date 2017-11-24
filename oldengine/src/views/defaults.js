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
    x: 220,
    y: 150,
    z: 0
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
      opacity: 0
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

  dontRenderClones: function() {
    P.Wall.instances.renderClones = false;
  },

  makeOverlaysTestDepth: function() {
    P.Overlay.instances.material.depthTest = 0;
    P.Overlay.instances.material.depthWrite = 0;
  },

  dontRotateLabels: function() {
    P.Scene.rotateLabels = false;
    P.Scene.rotatePanels = false;
  },

  makePeopleTestDepth: function() {
    P.Person.instances.material.depthTest = 1;
    P.Sprite.instances.material.depthTest = 1;
  },

  makeOverlaysTestDepth: function() {
    P.Overlay.instances.material.depthTest = 1;
    P.Overlay.instances.material.depthWrite = 1;
  },

  makePeopleWriteDepth: function() {
    P.Person.instances.material.depthWrite = 1;
    P.Sprite.instances.material.depthWrite = 1;
    P.Icon.instances.material.depthWrite = 1;
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

  hideSearch: function() {
    if (P.Scene.state == 'search') {
      P.Scene.showSearch(true)
      document.activeElement.blur()
    }
    else
      if (P.Scene.state != 'search') {
        P.Scene.hideSearch(!P.Scene.isSearchVisible());
      }
  },

  scenes: function() {
    P.cull.chosenArea = null;
    P.areas.forEach(function(area) {
      area.zoneFloorColor = null
      //area.floorColor = null
      area.floorColor = new THREE.Color(0.9,0.9,0.9);

      //P.animate.property(area.label, null, 'opacity', 0)
      //area.zoneFloorOpacity = 1;
    })
  },

  resetKeyBindings: function() {
    document.body.onkeydown = null;
    document.body.onkeyup = null;
  },

  toggleAnalytics: function() {
    switch (P.currently.selectedMetric) {
      case 'overall-utilization':
        var slug = 'utilization';
        break;
      default:
        var slug = 'satisfaction';
        break;
    } 
    P.areas.forEach(function(area) {
      var min = Infinity
      var max = -Infinity
      if (area.panels.stats)
        area.panels.stats.invalidate()
      area.zones.forEach(function(zone) {
        if (!zone.observed || zone.show_label === false) return

        if (zone.stats && zone.stats[slug]) {
          if (max < zone.stats[slug].value.v)
            max = zone.stats[slug].value.v
          if (min > zone.stats[slug].value.v)
            min = zone.stats[slug].value.v
        }
      });
      area.zones.forEach(function(zone) {
        if (!zone.observed || zone.show_label === false) {

          if (zone.show_label === false) {
            if (P.Scene.showPanels && P.Scene.state !== 'editor')
              P.Area.highlightZone(zone, P.styles.floorInactiveColor)
            else
              P.Area.highlightZone(zone, null)
          }

          return
        }


        if (zone.stats && zone.stats[slug]) {
          var v = zone.stats[slug].value.v;
          var r = (v - min) / (max - min);

          zone.extrusionHeight = Math.floor(4 - r * 4) * 28 
          zone.value = Math.floor(v)

        } else {

          //if (zone.extrusionHeight == null) 
            zone.extrusionHeight = //Math.floor(Math.random() * 5) * 28;;
          zone.value = 0//Math.floor(height * 20 + Math.random() * 20 + 1)

        }

          var height = (zone.extrusionHeight) / 28;
        zone.temporaryColor = new THREE.Color((height / 4),0.5,0.5)
        if (P.Scene.showPanels && P.Scene.state !== 'editor')
          P.Area.highlightZone(zone, zone.temporaryColor, P.Scene.state === 'location')
        else
          P.Area.highlightZone(zone, null)
      })
    })

    return
  },

  showSearchIcon: function() {
    P.Icon.show('search');
  },


  getTargetArea: function() {
    if (P.Scene.state !== 'location')
      return this.getData()
  },

  closeFloater: function() {

  },



  focusOnFloor: function() {
    var area = this.getTargetArea()
    if (!area) return;
    P.Scene.setCurrentArea(area);
    var floor = area.floorBox;
    area.label.fade(1, 200)
    if (area.label.simplified)
      area.label.invalidate()
    if (!area.panels.stats.simplified)
      area.panels.stats.invalidate()
    P.areas.forEach(function(other) {
      //if (other.floorBox === floor)
      //  P.animate.property(other, null, 'onlyShowDoors', 0)
      //else
      //  P.animate.property(other, null, 'onlyShowDoors', 1)
      if (other != area) {
        P.animate.property(other, null, 'onlyShowDoors', 1)
        if (other.coordinates.z > area.coordinates.z) {
          P.animate.property(other, 'shift', 'x', -3000)
          P.animate.property(other, 'shift', 'y', 3000)
        }
        if (other.coordinates.z < area.coordinates.z) {
          P.animate.property(other, 'shift', 'y', -3000)
          P.animate.property(other, 'shift', 'x', 3000)
        }
        if (other.coordinates.z == area.coordinates.z) {
          if (other.coordinates.x > area.coordinates.x)
            P.animate.property(other, 'shift', 'z', -2000)
          else
            P.animate.property(other, 'shift', 'z', 2000)
        }
        P.animate.property(other, null, 'wallHeight', 0.1)
        other.floorColor = new THREE.Color(0.8,0.8,0.8)
      } else {
          P.animate.property(other, 'shift', 'y', 0)
          P.animate.property(other, 'shift', 'x', 0)
        P.animate.property(other, null, 'wallHeight', 28)
        P.animate.property(other, null, 'onlyShowDoors', 0)
      }
    })

      area.zones.forEach(function(zone) {
        //if (Math.random())
        if (zone.company && zone.company.zone == zone)
          return
        var companies = P.companies.filter(function(company) {
          return company.logo_thumbnail && company.id == zone.company_owner_id
        })
        zone.company = companies[0]
        if (!zone.company)
          return
        zone.company.setZone(zone);
      })
  },



  isWorkplaceVisible: function(workplace) {
    if ((P.Scene.me && P.Scene.me.workplace === workplace)
       || (workplace === P.Scene.target)
       || workplace.highlighted)
      return;
    if (P.Scene.me && workplace.person && P.Scene.me.favorites.indexOf(workplace.person) > -1 && workplace.person.workplace === workplace)
      return;
    
    if (this.getTargetZoom() < 0.7 && P.Scene.state !== 'location')
      return false

    if (this.getTargetZoom() < 0.8)
      return false
    if (workplace.user_owner_id != null && (this.getTargetZoom() > 0.9 || (workplace.person && workplace.person.workplace === workplace)))
      return
    return false;
  },

  toggleWorkplaces: function() {
    var area = this.getTargetArea()
    var zones = this.getZones(area);
    P.areas.forEach(function(other) {
      if (other.workplaces)
      other.workplaces.forEach(function(workplace) {
        workplace.fade(this.isObjectVisible(workplace, this.isWorkplaceVisible))
      }, this)
    }, this)
  },

  isPersonVisible: function(person) {
    if (person === P.Scene.me || (person === P.Scene.target) || person.highlighted)
      return;

    if (P.Scene.me && P.Scene.me.favorites.indexOf(person) > -1 && !person.workplace)
      return

    if (this.getTargetZoom() < 0.8 )
      return false
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

  togglePeople: function() {
    P.areas.forEach(function(other) {
      other.people.forEach(function(person) {
        person.fade(this.isObjectVisible(person, this.isPersonVisible))
      }, this)
    }, this)
  },


  getPanels: function() {
    if (P.Scene.state == 'graph' || P.Scene.showCompanies || P.Company.instances.lastVisible.length)
      return P.companyPanels
  },

  isPanelVisible: function(panel) {
    return
  },

  togglePanels: function() {
    P.areas.forEach(function(area) {
      area.panels.forEach(function(panel) {
        return panel.fade(this.isObjectVisible(panel, this.isPanelVisible))
      }, this)
    }, this)
  },

  isLabelVisible: function(label) {
    return (this.getTargetZoom() > 1.1 || P.Scene.state == 'search' || P.Scene.state == 'chart') 
           && this.getTargetArea() == label.area ? null : false
  },

  toggleLabels: function() {
    var area = this.getTargetArea()
    var delay = null//P.Scene.previousState ? 800 : null
    P.areas.forEach(function(other) {
      other.zones.forEach(function(zone) {
        zone.label.fade(this.isObjectVisible(zone.label, this.isLabelVisible), delay)
      }, this)
    }, this)
  },

  getZones: function(area) {
    return null;
  },

  isFurnitureVisible: function() {
    if (this.getTargetZoom() < 1) {
      return false;
    }
  },

  toggleFurniture: function() {
    var area = this.getTargetArea();
    var zones = this.getZones(area);
    P.areas.forEach(function(other) {
      other.furniture.forEach(function(furniture) {
        furniture.fade(this.isObjectVisible(furniture, this.isFurnitureVisible))
      }, this)
    }, this);
  },

  isPinVisible: function(event) {
    return this.getTargetZoom() < 0.7 && 
      (!event.isEvent()) ? false : null
  },

  togglePins: function() {
    var area = this.getTargetArea()
    var zones = this.getZones(area);

    P.areas.forEach(function(other) {
      if (other.pins)
        other.pins.forEach(function(pin) {
          if (pin.label)
            pin.label.fade(this.isObjectVisible(pin, this.isPinVisible))
          else
            pin.icon.fade(this.isObjectVisible(pin, this.isPinVisible))
        }, this)
    }, this)
  },

  getLabels: function() {
    if (P.Scene.showCompanies)
      return P.companyLabels
  },

  getCompanies: function() {
    if (P.Scene.showCompanies)
      return P.companiesWithLogo
  },

  isCompanyVisible: function(event) {
    return this.getTargetZoom() < 0.6 ? null : false
  },

  isIconVisible: function(icon) {
    if (icon.isHidden)
      return false;
    return true;
  },

  toggleCompanies: function() {
    P.companies.forEach(function(company) {
      if (company.imageSRC) {
        company.fade(this.isObjectVisible(company, this.isCompanyVisible))
      } else {
        company.label.fade(this.isObjectVisible(company, this.isCompanyVisible))
      }
    }, this)
  },


};