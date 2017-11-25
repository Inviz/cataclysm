Game.Distributions.Furniture = {
  table: {
    INSIDE_TOP: {
      electronics: 0.2,
      food: 0.7,
      objects: 0.3,
      information: 0.2
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

Game.Boxes = {
  long_plate: {
    width: 10,
    length: 20,
    depth: 2
  },
  short_plate: {
    width: 10,
    length: 10,
    depth: 2
  },
  short_bar: {
    width: 2,
    length: 10,
    depth: 2
  }
}

Game.Furniture = {
  table: {
    width: 30,
    length: 20,
    depth: 12,

    children: [
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-14, -1, -9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(14, -1, -9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-14, -1, 9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(14, -1, 9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(-10, 5, 0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 5, 0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(10, 5, 0)
      }
    ]
  },
  bed: {
    width: 30,
    length: 20,
    depth: 15,

    children: [
      // bed legs
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-14, -2.5, -9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(14, -2.5, -9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-14, -2.5, 9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(14, -2.5, 9),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      // bed head 
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(-14, 2.5, 0),
        euler: new THREE.Euler(0,0,Math.PI / 2)
      },

      // bed surface
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(-10, 0, 0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 0, 0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(10, 0, 0)
      }
    ]
  },

  single_bed: {
    width: 28,
    length: 14,
    depth: 15,

    children: [
      // bed legs
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(13, -2.5, -6),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(13, -2.5, 6),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      // bed head 
      {
        type: 'short_plate', 
        length: 14,
        placement: new THREE.Vector3(-13,-2.5, 0),
        euler: new THREE.Euler(0,0,Math.PI / 2)
      },

      // bed surface
      {
        type: 'long_plate', 
        width: 14,
        length: 20,
        placement: new THREE.Vector3(4, 0, 0),
        euler: new THREE.Euler(0,Math.PI / 2, 0)
      },
      {
        type: 'short_plate', 
        width: 14,
        length: 6,
        placement: new THREE.Vector3(-9, 0, 0),
        euler: new THREE.Euler(0,Math.PI / 2, 0)
      }
    ]
  },

  small_table: {
    width: 10,
    length: 10,
    depth: 12,

    children: [
      // top
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(0, -1, 0),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 5, 0),
        euler: new THREE.Euler(0,Math.PI / 2,0)
      }
    ]
  },

  medium_table: {
    width: 20,
    length: 10,
    depth: 12,

    children: [
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-9, -1, -4),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(9, -1, -4),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-9, -1, 4),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(9, -1, 4),
        euler: new THREE.Euler(Math.PI / 2,0,0)
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 5, 0),
        euler: new THREE.Euler(0,Math.PI / 2,0)
      }
    ]
  },

  chair: {
    width: 8,
    length: 8,
    depth: 16,
    children: [
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-3.25, -4, -3.25),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        depth: 1.5,
        width: 1.5,
        length: 8
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(3.25, -4, -3.25),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        depth: 1.5,
        width: 1.5,
        length: 8
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(-3.25, -4, 3.25),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        depth: 1.5,
        width: 1.5,
        length: 8
      },
      {
        type: 'short_bar', 
        placement: new THREE.Vector3(3.25, -4, 3.25),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        depth: 1.5,
        width: 1.5,
        length: 8
      },
      // surface
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 0, 0),
        width: 8,
        length: 8,
        depth: 2
      },
      // back
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 4, -4),
        euler: new THREE.Euler(-Math.PI / 20 + Math.PI / 2,0,0),
        width: 8,
        length: 8,
        depth: 1
      }
    ]
  },
  armchair: {
    width: 12,
    length: 12,
    depth: 14,
    children: [
      // back
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 1, -5),
        euler: new THREE.Euler(-Math.PI / 30 + Math.PI / 2,0,0),
        width: 12,
        length: 12,
        depth: 2
      },
      // arms
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-5, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(5, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      // surface
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, -1.5, 0),
        euler: new THREE.Euler(0, 0, 0),
        width: 9,
        length: 10,
        depth: 2
      }
    ]
  },
  lamp: {
    width: 5,
    length: 5
  },

  stool: {
    width: 5,
    length: 5,

    children: [
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 1, -5),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        width: 8,
        length: 8,
        depth: 2
      },
    ]
  },

  shelf: {
    width: 6,
    length: 4
  },

  sofa: {
    width: 24,
    length: 12,
    depth: 14,
    children: [
      // back
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 1, -5),
        euler: new THREE.Euler(-Math.PI / 30 + Math.PI / 2,0,0),
        width: 20,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-11, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(11, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, -1.5, 0),
        euler: new THREE.Euler(0, 0, 0),
        width: 20,
        length: 10,
        depth: 2
      }
    ]
  },
  long_sofa: {
    width: 34,
    length: 12,
    depth: 14,
    children: [

      // back
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-10, 1, -5),
        euler: new THREE.Euler(-Math.PI / 30 + Math.PI / 2,0,0),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 1, -5),
        euler: new THREE.Euler(-Math.PI / 30 + Math.PI / 2,0,0),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(10, 1, -5),
        euler: new THREE.Euler(-Math.PI / 30 + Math.PI / 2,0,0),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-16, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(16, -2, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 12,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, -1.5, 0),
        euler: new THREE.Euler(0, 0, 0),
        width: 30,
        length: 10,
        depth: 2
      }
    ]
  },

  tv: {
    width: 12,
    length: 2
  },

  box: {
    width: 12,
    length: 10,
    depth: 14,

    children: [
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 0, -4.5),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        width: 10,
        length: 10,
        depth: 1
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 0, 5),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        width: 10,
        length: 10,
        depth: 1
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-5, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(5, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, -6, 0),
        euler: new THREE.Euler(0, 0, 0),
        width: 12,
        length: 10,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(0, 6, 0),
        euler: new THREE.Euler(0, 0, 0),
        width: 12,
        length: 10,
        depth: 2
      }
    ]
  },

  bar_stand: {
    width: 22,
    length: 10,
    depth: 14,

    children: [
      // two doors
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-5, 0, 6.5),
        euler: new THREE.Euler(Math.PI / 2,0,Math.PI / 8),
        width: 10,
        length: 10,
        depth: 1
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(5, 0, 5),
        euler: new THREE.Euler(Math.PI / 2,0,0),
        width: 10,
        length: 10,
        depth: 1
      },
      // back
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 0, -4.5),
        euler: new THREE.Euler(Math.PI / 2,Math.PI / 2,0),
        width: 10,
        length: 20,
        depth: 1
      },
      // top and bottom
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, -6, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 6, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      // sides
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-10, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(10, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      }
    ]
  },


  shelf: {
    width: 22,
    length: 10,
    depth: 14,

    children: [
      // back
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 0, -4.5),
        euler: new THREE.Euler(Math.PI / 2,Math.PI / 2,0),
        width: 10,
        length: 20,
        depth: 1
      },
      // top and bottom
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, -6, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 6, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      // sides
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(-10, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      },
      {
        type: 'short_plate', 
        placement: new THREE.Vector3(10, 0, 0),
        euler: new THREE.Euler(0, 0, -Math.PI / 2),
        width: 10,
        length: 10,
        depth: 2
      }
    ]
  },


  high_shelf: {
    width: 22,
    length: 10,
    depth: 26,

    children: [
      // surfaces
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, -12, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 0, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 18,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(0, 12, 0),
        euler: new THREE.Euler(0, Math.PI / 2, 0),
        width: 10,
        length: 22,
        depth: 2
      },
      // sides
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(-10, 0, 0),
        euler: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
        width: 10,
        length: 22,
        depth: 2
      },
      {
        type: 'long_plate', 
        placement: new THREE.Vector3(10, 0, 0),
        euler: new THREE.Euler(Math.PI / 2, 0, -Math.PI / 2),
        width: 10,
        length: 22,
        depth: 2
      }
    ]
  }
}