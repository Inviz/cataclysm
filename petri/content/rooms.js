Game.Distributions.Rooms = {

  living_room: {
    table: {
      CENTER: 80,

      chair: {
        min: 1,
        max: 6,
        OUTSIDE_INWARDS: 70
      }
    },
    tv: {
      max: 1
    },
    sofa: {
      max: 1,
      CENTER: 70,
      INSIDE_INWARDS: 50,

      tv: {
        ACROSS_INWARDS: 50
      },

      armchair: {
        ALONG_SIDE: 30
      }
    },
    bar_stand: {
      INSIDE_IWARDS: 50,
      CENTER: 60,
      price: 70,

      stool: {
        min: 2,
        OUTSIDE_INWARDS: 70
      }
    },
    small_table: {
      CORNER: 70,
      CENTER: 80,

      armchair: {
        OUTSIDE_INWARDS: 70
      }
    },
    lamp: {
      max: 3,
      CORNER: 30//,
//      INSIDE_INWARDS: 10
    },
    shelf: {
      INSIDE_INWARDS: 20
    }
  },

  bathroom: {
    toilet: {
      ALONG_INWARDS: 100,
      min: 1,
      max: 1
    },
    sink: {
      ALONG_INWARDS: 80,
      min: 1,
      max: 1
    },
    shower: {
      ALONG_INWARDS: 70,
      CORNER: 70,
      max: 1
    },
    bathtub: {
      ALONG_INWARDS: 60,
      max: 1
    }
  }
}
