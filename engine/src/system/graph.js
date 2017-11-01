P.Graph = function(people, connections, companies) {
  //the instance group
  var counter = 0;
  var connected = 0;
  var lines = [];
  var links = [];
  var groups = [];
  var employments = [];
  var important = [];

  people = people.filter(function(person) {
    if (person.area && person.point) {
      return person
    }
  })

  var type = 0;
  var addLink = function(person, other, chance, color, type) {
    if (other.graphIndex == null)
      return
    if (!person.links[other.graphIndex] && !other.links[person.graphIndex]) {
      var link =  new P.Line({
        color: color,
        source: person.graphIndex,
        target: other.graphIndex,
        from: person.placement,
        to: other.placement
      });
      if (type == 'employment')
        employments.push(link)
      else
        links.push(link)


      link.index = lines.length
      other.links[person.graphIndex] = link
      person.links[other.graphIndex] = link
      lines.push(link)
    }
  }
  var peopleById = {};
  var allPeople = [];
  for (var i = 0; i < people.length; i++) {
    var person = people[i]
    peopleById[person.id] = person
    person.graphIndex = counter;
    person.placement = {
      index: person.graphIndex, 
      x: 0,
      y: 0
    };
    allPeople.push(person)

    person.links = {};
    //if (person.area)
    //  for (var z = 0; z < person.area.people.length; z++)
    //    addLink(person, person.area.people[z], 0, null, true)
    counter++;
  }
  var colors = {
    others: new THREE.Color(0.7,0.7,0.7),
    company: new THREE.Color(0.3,0.3,0.3),
    does_business_with: new THREE.Color(95 / 255,172 / 255,37 / 255),
    had_beer_with: new THREE.Color(0.3,0.6,0.6),
  }
  if (companies) {
    companies = companies.filter(function(company) {
      company.people = people.filter(function(person) {
        return person.company_id == company.id
      })
      return company
    })
    var companyById = {};
    for (var i = 0; i < companies.length; i++) {
      var company = companies[i];
      company.graphIndex = counter;
      company.placement = {
        index: company.graphIndex,
        x: 0,
        y: 0,
        company: company
      };
      company.links = {};
      companyById[company.id] = company
      counter++;
      company.people.forEach(function(person) {
        addLink(person,  company, null, colors['company'] || colors.others, 'employment')
      })
      
    }
  }

  if (connections)
    connections.forEach(function(connection) {
      var from = peopleById[connection.from_user_id];
      var to = peopleById[connection.to_user_id];
      if (from && to) {
        addLink(from, to, null, colors[connection.verb] || colors.others)

        if (connection.verb == 'favorite') {
          if (from.favorites.indexOf(to) == -1)
            from.favorites.push(to);
        }

        if (from.related.indexOf(to) == -1)
          from.related.push(to);
        if (to.related.indexOf(from) == -1)
          to.related.push(from);

      }
    })

  P.people = allPeople;
  P.companies = companies || []

  P.companiesWithoutLogo = P.companies.filter(function(company) {
    return !company.imageSRC
  })
  P.companiesWithLogo = P.companies.filter(function(company) {
    return company.imageSRC
  }).filter(function(company) {
    return !company.zone
  })
  P.companyLabels = P.companiesWithoutLogo.map(function(company) {
    return company.label
  })
  P.companyPanels = P.companies.map(function(company) {
    return company.panel
  })
  var graph = lines
  var nodes = P.people.concat(P.companies)

  return graph
}


P.Graph.layout = function(nodes, links, employments, groups) {
  var layout = d3force.forceSimulation(nodes)
    .force("charge", d3force.forceManyBody().strength(0.2))
    .force("company", d3force.forceLink(employments).distance(60).strength(0.7))
    .force("links", d3force.forceLink(links).distance(120).strength(0.8))
    .force("collision", d3force.forceCollide(function(node, i, nodes) {
      if (node.company)
        return 30
      return 120
    }).strength(0.5) )
    .force("collision2", d3force.forceCollide(120).strength(0.1) )
    .force("center", d3force.forceCenter());


  return layout
};
