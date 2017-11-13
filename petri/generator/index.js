Game.Generator = {};

Game.Distributions = {};
Game.Distributions.Rooms = {
  residence: {
    living_room: 1,
    kitchen: 1,
    pantry: 1
  }
}
Game.Distributions.Furniture = {
  living_room: {
    INSIDE_CENTER: {
      table: 0.8,
      sofa: 0.7
    },
    INSIDE_CORNER: {
      lamp: 0.5
    },
    ALONG_INWARDS: {
      shelf: 0.15
    }
  }
}
Game.Distributions.Objects = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      magazine: 0.2
    },
    OUTSIDE_INWARDS: {
      chair: 0.8
    }
  },

  chair: {
    INSIDE_TOP: {
      magazine: 0.2
    }
  }
}

Game.MASK = {
  INSIDE: 1,
  OUTSIDE: 2,
  ALONG: 4,
  AROUND: 8,

  INWARDS: 16,
  OUTWARDS: 32,
  OPPOSITE: 64,
  CORNER: 128,
  TOP: 256,
  CENTER: 512,

}
Game.ANCHORS = {};
for (var p1 in Game.MASK) {
  Game.ANCHORS[p1] = Game.MASK[p1]
  for (var p2 in Game.MASK)
    Game.ANCHORS[p1 + '_' + p2] = Game.MASK[p1] | Game.MASK[p2]
}
