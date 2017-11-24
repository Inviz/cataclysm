P.Snapshot = function() {
  var area = P.currently.editingArea || P.currently.showingArea;
  return area.export();
}

P.Snapshot.apply = function(areas, people) {
  if (!areas.push)
    areas = [areas];
  var data = areas[0];

  var area = P.currently.editingArea || P.currently.showingArea;
  area.import(P.Import.area(data));

  area.zones.forEach(function(zone) {
    zone.updatePolygon()
  })
  return area
}

P.Snapshot.limit = 200;
P.Snapshot.list = [];
P.Snapshot.cursor = 0;

P.Snapshot.push = function(snapshot, dontAutoSave) {

  // when doing new action after undo, erase undone snapshots
  if (P.Snapshot.cursor)
    P.Snapshot.list.splice(P.Snapshot.cursor)
  P.Snapshot.cursor = 0;

  // shift history over limit
  if (P.Snapshot.list.length === P.Snapshot.limit)
    P.Snapshot.list.shift()

  if (snapshot)
    P.Snapshot.apply(snapshot);
  else
    snapshot = new P.Snapshot

  // add new snapshot on top
  P.Snapshot.list.push(snapshot);

  if (!dontAutoSave) {
    var area = P.currently.editingArea || P.currently.showingArea;
    if (area)
      localStorage['autosave:' + area.title] = JSON.stringify(snapshot);
  }
};

P.Snapshot.undo = function() {
  // move history cursor backward
  if (P.Snapshot.list.length + P.Snapshot.cursor > 1) {
    P.Snapshot.cursor--;
    P.Snapshot.apply(P.Snapshot.list[P.Snapshot.list.length - 1 + P.Snapshot.cursor])
  }
}

P.Snapshot.redo = function() {
  if (P.Snapshot.cursor < 0) {
    P.Snapshot.cursor++;
    P.Snapshot.apply(P.Snapshot.list[P.Snapshot.list.length - 1 + P.Snapshot.cursor])
  }
};