P.Data = function() {

}

P.Scene.setLocation = function(location) {
  var areas = location.areas;
  if (areas) {
    if (!P.locations)
      P.locations = [];
    if (!P.areas)
      P.areas = [];
    P.locations.push(location)
    location.areas = location.areas.map(function(properties) {
      var area = new P.Area({
        location: location
      }).import(properties)
      area.zones.forEach(function(zone) {
        zone.updatePolygon()
      })
      return area;
    })

    P.areas.push.apply(P.areas, location.areas)
  }

  return location;
}

P.Scene.setUser = function(user, position) {
  P.areas.forEach(function(area) {
    area.people.forEach(function(person) {
      if (user.id === person.id) {
        person.merge(user)
        if (position)
          person.setPosition(position)
        if (person.area && person.area_id)
          if (location.search.indexOf('anonymous') == -1)
            P.Scene.setMe(person);
        console.log('user is set again')
      }
    })
  })
  this.user = user;
  console.log('user is set') 
}

P.Scene.setPins = function(events, pins) {
  var allPins = events.concat(pins);
  P.areas.forEach(function(area) {
    allPins.forEach(function(properties) {
      if (properties.area_id !== area.id)
        return;

      var props = Object.create(properties)
      props.area = area;

      if (events.indexOf(properties) > -1)
        props.type = 'event'
      else
        props.type = 'pin'

      var isVirtualPin = props.pin_type == 'locus' || props.pin_type == 'blackhole'
      if (properties.zone_id != null) {
        area.zones.forEach(function(zone) {
          if (zone.id == props.zone_id) {

            props.zone = zone;
            if (props.pin_type == 'locus') {
              zone.locus = {x: props.point.coordinates[0], y: props.point.coordinates[1]}
              area.pins.forEach(function(pin) {
                if (pin.zone != zone || !pin.isEvent()) return;
                  pin.coordinates.x = zone.locus.x
                  pin.coordinates.y = zone.locus.y
                  pin.offset.x = zone.locus.y
                  pin.offset.z = -zone.locus.y
              })
            } else if (props.pin_type == 'blackhole') {
              area.blackholeZone = zone;
              area.blackhole = {x: props.point.coordinates[0], y: props.point.coordinates[1]}
            } else if (!props.coordinates)
              zone.hasEvent = true;
          }
        })
      }
      if (props.point)
        props.coordinates = {x: props.point.coordinates[0], y: props.point.coordinates[1]}
      if (!isVirtualPin)
        area.pins.push(new P.Pin(props))
    })
  })
}

P.Scene.setPeople = function(people, connections, companies) {

  var peopleById = {};
  people = people.filter(function(person) {
    if (peopleById[person.id])
      return;
    peopleById[person.id] = person
    return person
  })
    
  var companiesById = {};
  companies = companies.filter(function(company) {
    if (companiesById[company.id])
      return;
    companiesById[company.id] = company
    return company
  })

  P.areas.forEach(function(area) {
    area.people = [];

    people.forEach(function(person) {
      if (person.area_id === area.id) {
        person.area = area;
        area.people.push(person)
      }
    })
    area.people.sort(function(a, b) {
      return (a.coordinates.y - b.coordinates.y) || (b.coordinates.x - a.coordinates.x)
    })
    area.setPeople(area.people, people)
  })

  P.graph = new P.Graph(people, connections, companies)
  console.log('graph generated') 


}

P.Scene.setTarget = function(object, ping) {
  if (P.Scene.target == object && !ping) return;
  P.Sprite.instances.changes   |= P.Sprite.instances.UPDATE_RESET

  if (P.Scene.target)
    P.Scene.target.getInstances().changes |= P.Sprite.instances.UPDATE_OFFSET
  if (object)
    object.getInstances().changes |= P.Sprite.instances.UPDATE_OFFSET
  P.Scene.target = object
   
  if (!ping && object && object.onTarget) {
    var pingTarget = object.onTarget();
    if (pingTarget)
      ping = true;
  } else {
    var pingTarget = object;
  }
  if (pingTarget && ping) {
    pingTarget.indication = 1;
    if (pingTarget === P.currently.draggingPerson)
      var delay = 0
    else if (pingTarget.area === P.currently.showingArea)
      var delay = 600
    else
      var delay = 1500
    P.animate.cancel(pingTarget, 'indication');
    P.animate.property(pingTarget, null, 'indication', 0, 12, 27, delay);
    P.Sprite.instances.changes |= P.Sprite.instances.UPDATE_RESET
  }
}
P.Scene.setMe = function(object, lock) {
  //P.Scene.newTarget = object;
  P.Scene.me = object
  if (P.Scene.user) {
    for (var property in P.Scene.user)
      P.Scene.me[property] = P.Scene.user[property]
  }
}

P.Scene.deleteWorkplace = function(workplace) {

  P.Import.load(P.backend + '/api/workplaces/' + workplace.id + '/', function(data) {
    console.log('OK DELETE', data)
  }, 'DELETE');
  P.Panel.close()
  workplace.destroy();
  P.animate.start()
}

P.Scene.updateWorkplace = function(person, attributes) {
  var area = P.currently.showingArea;
  for (var i = 0; i < area.workplaces.length; i++) {
    if (area.workplaces[i].user_owner_id == person.id) {
      var workplace = area.workplaces[i];
      break;
    }
  }
  if (workplace) {
    workplace.merge(attributes)
    P.Import.load(P.backend + '/api/workplaces/' + workplace.id + '/', function(data) {
      console.log('OK PUT', data)
    }, 'PUT', attributes);
  } else {
    var workplace = new P.Workplace(attributes)
    P.currently.showingArea.workplaces.push(
      workplace
    );
    P.Import.load(P.backend + '/api/workplaces/', function(data) {
      workplace.id = data.id;
      console.log('OK POST', data)
    }, 'POST', attributes);
  }
  workplace.moveToCoordinates(attributes.coordinates.x, attributes.coordinates.y)
  P.Workplace.instances.changes |= P.Workplace.instances.UPDATE_RESET

  return workplace
}

P.Scene.positionPerson = function(person, coordinates, zone, workplace_id) {
  var data = {
    area_id: person.area.id,
    user_id: person.id,
    zone_id: zone ? zone.id : null,  
    current_status_display: person.status,
    is_ghost: zone ? !zone.observed : false,
    workplace_id: workplace_id,
    point: {
      type: 'Point',
      coordinates: coordinates
    }
  }

  P.Import.load(P.backend + '/api/positioning/' + person.position_id + '/', function(data) {
    console.log('OK', data)
  }, 'PUT', data);

  return {
    type: 'position',
    data: data
  };
}


P.Scene.publishArea = function(area) {
  if (!area)
    area = P.currently.editingArea || P.currently.showingArea;

  var data = area.export();
    if (!data.location_id)
      data.location_id = area.location && area.location.id || P.locations[0].id

  if (P.Icon.loaded.publish)
    P.animate.property(P.Icon.loaded.publish, null, 'opacity', 0.5);
  P.animate.start()
  if (data.id) {
    P.Import.load(P.backend + '/api/areas/' + data.id + '/', P.Scene.onAreaPublished, 'PUT', data)
  } else {
    P.Import.load(P.backend + '/api/areas/', P.Scene.onAreaPublished, 'POST', data)
  }
}

P.Scene.deleteArea = function(area) {
  if (area.id) {
    P.currently.deletingArea = area;
    P.animate.property(P.Icon.loaded.delete, null, 'opacity', 0.5);
    P.animate.start()
    P.Import.load(P.backend + '/api/areas/' + area.id + '/', P.Scene.onAreaDeleted, 'DELETE')
  }
}

P.Scene.onAreaDeleted = function(response, success) {
  if (success) {
    P.Icon.loaded.delete.color = new THREE.Color(0.7,0.7,0.7)
    P.Icon.instances.changes |= P.Icon.instances.UPDATE_COLOR
    var area = P.currently.deletingArea;
    var index = P.areas.indexOf(area);
    if (index > -1)
      P.areas.splice(index, 1);
    var index = area.location.areas.indexOf(area);
    if (index > -1)
      area.location.areas.splice(index, 1);
    P.animate.property(P.Icon.loaded.delete, null, 'opacity', 1);
    P.Scene.navigate('location')
  } else {
    P.Icon.loaded.delete.color = new THREE.Color(1,0,0)
    P.Icon.instances.changes |= P.Icon.instances.UPDATE_COLOR

    alert(JSON.stringify(response))
    P.animate.property(P.Icon.loaded.delete, null, 'opacity', 1);
    P.animate.start()
    console.error(response)
  }
  P.currently.deletingArea = null;
}

P.Scene.onAreaPublished = function(response, success) {
  if (success) {
    P.Icon.loaded.publish.color = new THREE.Color(0.7,0.7,0.7)
    P.Icon.instances.changes |= P.Icon.instances.UPDATE_COLOR
    var area = P.currently.editingArea || P.currently.showingArea;
    area.import(P.Import.area(response))
    P.animate.property(P.Icon.loaded.publish, null, 'opacity', 1);
    P.animate.start()
    P.Scene.current.toggleLabels()
  } else {
    P.Icon.loaded.publish.color = new THREE.Color(1,0,0)
    P.Icon.instances.changes |= P.Icon.instances.UPDATE_COLOR
    P.animate.property(P.Icon.loaded.publish, null, 'opacity', 1);
    alert(JSON.stringify(response))
    console.error(response)
    P.animate.start()
  }
};
