export default steinerMinimalTree = (fullGraph, requiredVertices) => {

  /* symmetric closure of original graph */
  //for (var [from, to, weight] of fullGraph.edges()) {
  //  fullGraph.spanEdge(to, from, weight);
  //}

  /* bookkeeping */
  var searches       = [];
  var vertexToSearch = {};
  // var steinerTree    = new Graph(requiredVertices.map(v=>[v]));
  var steinerTree    = {points: requiredVertices, edges: []}
  for (var v of requiredVertices) {
    var search = {
      s: searches.length,
      graph: new Graph([[v]]),
      frontier: [v]
    };
    searches.push(search);
    vertexToSearch[v] = search;
  }

  /* bookkeeping manipulation functions */
  function addEdgeToSearch(from, to, search) {
    search.graph.createEdge(from, to);
    search.frontier.push(to);
    vertexToSearch[to] = search;
  }
  function mergeSearches(search1, search2) {
    search1.graph.mergeIn(search2.graph);
    var newFrontier = [];
    for (var i = 0; i < Math.min(search1.frontier.length, search2.frontier.length); ++i) {
      newFrontier.push(search1.shift());
      newFrontier.push(search2.shift());
    }
    newFrontier.push(...search1, ...search2);
    search1.frontier = newFrontier;
    search2.finished = true;
  }
  function recordConnection(v, search1, search2) {
    var v1 = v;
    do {
      steinerTree.createEdge(v1, search1.verticesTo(v1).next().value);
      v1 = search1.verticesTo(v1)[0];
    } while (!steinerTree.hasVertex(v1));
    var v2 = v;
    do {
      steinerTree.createEdge(v2, search2.verticesTo(v2).next().value);
      v2 = search1.verticesTo(v2)[0];
    } while (!steinerTree.hasVertex(v2));
  }

  /* the structure of the main loop */
  function* mainLoop() {
    while (searches.length > 1) {
      for (var search of searches) {
        if (!search.finished) {
          yield search;
        }
      }
      searches = searches.filter(s => !s.finished);
    }
  }

  /* the main loop */
  for (var search of mainLoop()) {
    var v = search.frontier.shift();
    for (var [vNext/*,,weight*/] of search.graph.verticesFrom(v)) {
      /* Did this search already reach this vertex? */
      if (search.graph.hasVertex(vNext)) { continue }

      /* Add this vertex to this search. */
      addEdgeToSearch(v, vNext, search);

      /* Did this search reach the frontier of another search? */
      for (var otherSearch of searches) {
        if (search === otherSearch) { continue }
        if (otherSearch.graph.hasVertex(vNext)) {
          mergeSearches(search, otherSearch);
          recordConnection(vNext, search, otherSearch);
        }
      }
    }
  }

  /* the steiner tree is finished */
  return steinerTree;
};