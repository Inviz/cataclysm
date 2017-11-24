P.Import = function() {

};


P.Import.load = function(path, callback, method, data) {
  var xhr = new XMLHttpRequest;
  var url = path + (path.indexOf('?') > -1 ? '&' : '?') + 'token=' + POSIT_AUTH_TOKEN + '&format=json'
  if (url.indexOf(P.backend) > -1) {
    if (method && method !== 'GET') {
      url += '&method=' + method;
      method = 'POST'
    }
  }
  xhr.open(method || 'GET', url)
  //xhr.setRequestHeader('Content-Type', 'application/json')
  //if (POSIT_AUTH_TOKEN)
  //  xhr.setRequestHeader('Authorization', 'Token ' + POSIT_AUTH_TOKEN);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      try {

        var json = JSON.parse(xhr.response)
      } catch(e) {

      }
      var doc =callback(json || xhr.response, xhr.status >= 200 && xhr.status < 300)
      //console.log(doc.innerHTML)
    }
  }
  xhr.send(JSON.stringify(data));
}

P.Import.walls = function(walls) {
  if (!walls.coordinates)
    return walls;
  return (walls.coordinates || walls).map(function(line) {
    var wall = [0];
    for (var i = 0; i < line.length; i++)
      wall.push(line[i][0], line[i][1])
    return wall;
  })
}


P.Import.polygon = function(polygon) {

  var coordinates = polygon.coordinates ? polygon.coordinates[0] : polygon;
  if (coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
      coordinates[0][1] === coordinates[coordinates.length - 1][1]) {
    return coordinates.slice(0, coordinates.length - 1)
  }
  return coordinates;
}
P.Import.area = function(props) {
  var area = Object.create(props)
  if (props.polygon)
    area.polygon = P.Import.polygon(props.polygon)
  if (props.point)
    area.coordinates = {x: props.point.coordinates[0], y: props.point.coordinates[1], z: props.point.coordinates[2]}

  if (area.walls_editor)
    area.walls = area.walls_editor
  else
    area.walls = P.Import.walls(area.walls || [])

  if (area.furniture_editor)
    area.furniture = area.furniture_editor || []
  else
    area.furniture = [];
  //else
  //  area.walls = P.Import.walls(area.walls)
  if (!area.coordinates) {
    if (area.polygon) {
      area.coordinates = {x: Infinity, y: Infinity};
      area.polygon.forEach(function(p) {
        area.coordinates.x = Math.min(p[0], area.coordinates.x)
        area.coordinates.y = Math.min(p[1], area.coordinates.y)
      })
    } else {
      area.coordinates = {x: 0, y: 0, z: 0}
    }
  }


  area.zones = area.zones.map(P.Import.zone)

  area.zones.sort(function(a, b) {
    return (a.coordinates.y - b.coordinates.y)
  })

  if (area.workplaces)
    area.workplaces = area.workplaces.map(P.Import.workplace)

  return area;
}

P.Import.workplace = function(workplace) {
  var props = Object.create(workplace)
  props.coordinates = {
    x: workplace.point.coordinates[0],
    y: workplace.point.coordinates[1],
    z: workplace.point.coordinates[2]
  }
  return  props
}

P.Import.zone = function(props) {
  var area = Object.create(props)
  if (props.point)
    area.coordinates = {x: props.point.coordinates[0], y: props.point.coordinates[1], z: props.point.coordinates[2]}

  if (props.polygon) {
    area.polygon = P.Import.polygon(props.polygon)

    if (!props.coordinates) {
      area.coordinates = {x: Infinity, y: Infinity};
      area.polygon.forEach(function(p) {
        area.coordinates.x = Math.min(p[0], area.coordinates.x)
        area.coordinates.y = Math.min(p[1], area.coordinates.y)
      })
    }
  }
  return area;
}

P.Import.location = function(props) {
  var location = new P.Location(props);
  location.areas = props.areas.map(function(p, i) {
    var area = P.Import.area(p)
    area.coordinates.z = i;
    area.location = location
    return area;
  })
  return location
}

P.Import.people = function(people) {
  return people.map(function(props) {
    var person = Object.create(props.profile);
    person.name = person.display_name || props.username
    person.id = props.id || person.id
    person.title = person.job_title
    if (props.position) {
      if (props.position.point) {
        person.point = person.coordinates = {
          x: props.position.point.coordinates[0], 
          y: props.position.point.coordinates[1]
        }
      }
      person.position_id = props.position.id
      person.area_id = props.position.area_id
      person.zone_id = props.position.zone_id
      person.imageSRC = person.avatar_thumbnail && person.avatar_thumbnail
      person.status = props.position.current_status_display
      person.isGhost = props.position.is_ghost
      person.workplace_id = props.position.workplace_id
      if (person.isGhost)
        person.targetOpacity = 0.6
    }
    return new P.Person(person);
  })
}

P.Import.companies = function(people) {
  return people.map(function(props) {
    return new P.Company(props);
  })
}

P.Import.setConnection = function() {

  P.Import.connection = new PositAWS();
  P.Import.connection.connectWebSocket({
    reconnect: true,
    connected: function() {
      P.Import.connection.ready = true;
      if (P.Import.connection.channel) {
        P.Import.connection.subscribe(P.Import.connection.channel);
        P.Import.connection.sendMessage({text: 'hi', from: navigator.userAgent}, P.Import.connection.channel);

      }
      console.log('[ws:join]', P.Import.connection.channel)
    },
    message_arrived: function(data) {
      if (data.text === 'hi') return;
      console.info('[ws:' + P.Import.connection.channel + ']', data);
      P.Import.message(data)
    },
  });
}

P.Import.message = function(message) {
  switch (message.type) {
    // iframe card events
    case 'closePanel':
      P.Scene.closeFloater();
      if (P.Panel.current[0])
        P.Panel.open(P.Panel.current[0].parent)
      P.animate.start()
      P.Scene.current.onInitialize()

      break;

    case 'iframe':
      if (P.Panel.expanded && P.Panel.iframe.loading) {
        P.Panel.expanded.contentWidth = message.width;
        P.Panel.expanded.contentHeight = message.height;
        P.Panel.expanded.onLoad()
        P.animate.start()
      }
      break; 

    case 'energy_saving':
      if (message.enabled === true) {
        P.Scene.savingEnergy = true;
        P.animate.progress = 1;
      } else if (message.enabled === false) {
        P.Scene.savingEnergy = false;
        P.animate.progress = 0;
      } else {
        if (P.Scene.savingEnergy || location.search.indexOf('no-motion') > -1 || window.matchMedia && matchMedia('(prefers-reduced-motion)').matches)
          P.animate.progress = 1;
        else
          P.animate.progress = 0;
      };

      break;
  }
}

P.Import.setCurrentArea = function(area) {
  if (location.search.indexOf('scope=area') > -1 && area.location)
    var channel = 'area/' + area.id;
  else
    var channel = 'location/' + area.location.id;


  if (channel != P.Import.connection.channel) {
    P.Import.connection.area = area;
    if (P.Import.connection.channel
    && P.Import.connection.unsubscribe
    && P.Import.connection.ready) {
      try {
        P.Import.connection.unsubscribe(channel);
      } catch(e) {
        console.error(e);
      }
      console.log('[ws:leave]', P.Import.connection.channel)
    }

    P.Import.connection.channel = channel;
    if (P.Import.connection.ready && P.Import.connection.channel) {
      try {
        P.Import.connection.subscribe(channel);
      } catch(e) {
        console.error(e);
      }
      console.log('[ws:join]', P.Import.connection.channel)
    }
  }
}

P.Import.place = function(data) {
  if (data.location) {
    var location = P.Scene.setLocation(P.Import.location(data.location))
  }
  if (data.events || data.pins)
    P.Scene.setPins((data.events || []), (data.pins || []));

}
P.Import.startup = function(data) {
  P.animate.lock()


  var people = [];
  var connections = [];
  var companies = [];
  if (data.locations) {
    data.locations.forEach(function(place) {
      P.Import.place(place)
      people.push.apply(people, P.Import.people(place.people, location) || [])
      connections.push.apply(connections, place.connections || [])
      companies.push.apply(companies, P.Import.companies(place.companies) || [])
    })
  } else {
    P.Import.place(data)
    people.push.apply(people, P.Import.people(data.people, location) || [])
    connections.push.apply(connections, data.connections || [])
    companies.push.apply(companies, P.Import.companies(data.companies) || [])
  }

  P.Scene.setPeople(people, connections, companies)
  
  if (data.user)
    P.Scene.setUser(data.user, data.position)

  if (window.PositQueue)
    P.Queue.push.apply(P.Queue, window.PositQueue)

  P.areas.forEach(function(area) {
    area.computeAreaBox()
  })
  P.Scene.Surface.prototype.computeLayout()
  P.Scene.Surface.prototype.measureLayout()
  P.Scene.Surface.prototype.applyLayout(null, null, 0.25)
  P.areas.forEach(function(area) {
    area.computeAreaBox()
  })
  window.PositQueue = P.Queue

  //area.computeAreaBox();
  if (P.Scene.me) {
    P.Scene.setTarget(P.Scene.me)
    P.Scene.navigate('floor')
  }
  else
    P.Scene.navigate('location')

  //area.computeAreaBox();
  P.Scene.current.onScroll()
  onWindowResize()
  P.animate.unlock();


};
