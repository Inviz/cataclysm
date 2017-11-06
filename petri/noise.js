function Noise(vx, vy) {
  var Cx =   0.211324865405187;  // (3.0-sqrt(3.0))/6.0
  var Cy =   0.366025403784439;  // 0.5*(sqrt(3.0)-1.0)
  var Cz =  -0.577350269189626;  // -1.0 + 2.0 * C.x
  var Cw =   0.024390243902439; // 1.0 / 41.0

// First corner

  var idot = (vx * Cy) + (vy * Cy)
  var ix = Math.floor(vx + idot)
  var iy = Math.floor(vy + idot)

  var x0dot = (ix * Cx) + (iy * Cx)
  var x0x = vx - ix + x0dot
  var x0y = vy - iy + x0dot

// Other corners
  var i1x = x0x > x0y ? 1 : 0;
  var i1y = x0x > x0y ? 0 : 1;

  var x12x = x0x + Cx;
  var x12y = x0y + Cx;
  var x12z = x0x + Cz;
  var x12w = x0y + Cz;

  x12x -= i1x
  x12y -= i1y

// Permutations
  // Avoid truncation effects in permutation
  ix %= 289;
  iy %= 289;

  var tx = iy
  var ty = iy + i1y
  var tz = iy + 1

  tx = ((tx * 34 + 1) * tx) % 289;
  ty = ((ty * 34 + 1) * ty) % 289;
  tz = ((tz * 34 + 1) * tz) % 289;

  tx = tx + ix
  ty = ty + ix + i1x
  tz = tz + ix + 1

  var px = ((tx * 34 + 1) * tx) % 289;
  var py = ((ty * 34 + 1) * ty) % 289;
  var pz = ((tz * 34 + 1) * tz) % 289;

  var mx = Math.max(0, 0.5 - ((x0x * x0x) + (x0y * x0y)))
  var my = Math.max(0, 0.5 - ((x12x * x12x) + (x12y * x12y)))
  var mz = Math.max(0, 0.5 - ((x12z * x12z) + (x12w * x12w)))

  mx = Math.pow(mx, 4);
  my = Math.pow(my, 4);
  mz = Math.pow(mz, 4);

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  var xx = 2 * ((px * Cw) % 1) - 1
  var xy = 2 * ((py * Cw) % 1) - 1
  var xz = 2 * ((pz * Cw) % 1) - 1

  var hx = Math.abs(xx) - 0.5
  var hy = Math.abs(xy) - 0.5
  var hz = Math.abs(xz) - 0.5

  var oxx = Math.floor(xx + 0.5)
  var oxy = Math.floor(xy + 0.5)
  var oxz = Math.floor(xz + 0.5)

  var a0x = xx - oxx
  var a0y = xy - oxy
  var a0z = xz - oxz

  mx *= 1.79284291400159 - 0.85373472095314 * (a0x * a0x + hx * hx)
  my *= 1.79284291400159 - 0.85373472095314 * (a0y * a0y + hy * hy)
  mz *= 1.79284291400159 - 0.85373472095314 * (a0z * a0z + hz * hz)

  var gx = a0x * x0x + hx * x0y;
  var gy = a0y * x12x + hy * x12y;
  var gz = a0z * x12z + hz * x12w;

  return 130 * ((gx * mx) + (gy * my) + (gz * mz));
}

function polygonFromRotatedRectangle (x, y, width, height, angle) {
  var polygon = [];
  for (var i = 0; i < 4; i++) {
    var Ox = width * ((i > 1) ? .5 : -.5)
    var Oy = height * ((i == 0 || i == 3) ? -.5 : .5)   
    polygon.push({
      x: x + (Ox  * Math.cos(angle)) - (Oy * Math.sin(angle)),
      y: y + (Ox  * Math.sin(angle)) + (Oy * Math.cos(angle))
    });
  }
  return polygon;

  //The rotated position of this corner in world coordinates 
}

shuffleIndex.RAND_MASKS = [
  0x00000001, 0x00000003, 0x00000006, 0x0000000C, 0x00000014, 0x00000030,
  0x00000060, 0x000000B8, 0x00000110, 0x00000240, 0x00000500, 0x00000CA0,
  0x00001B00, 0x00003500, 0x00006000, 0x0000B400, 0x00012000, 0x00020400,
  0x00072000, 0x00090000, 0x00140000, 0x00300000, 0x00400000, 0x00D80000,
  0x01200000, 0x03880000, 0x07200000, 0x09000000, 0x14000000, 0x32800000,
  0x48000000, 0xA3000000
]
function shuffleIndex(length, previous) {
  if (previous == null) {
    var width = 0
    var n = length;
    while (n > 0) {
      n >>= 1
      ++width
    }
    var mask = shuffleIndex.RAND_MASKS[width - 1]
    value = 1;
  } else {
    var value = previous[0];
    var mask = previous[1]
  }
  while (true) {
    value = ((value & 1) != 0) ? ((value >> 1) ^ mask) : (value >> 1);
    if (value <= length) {
      if (!previous) return [value, mask];
      if (previous) {
        previous[0] = value
        return previous
      };
    }
    if (value === 1)
      break;
  }
  return;
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}



function doPolygonsIntersect (a, b) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        var polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            var i2 = (i1 + 1) % polygon.length;
            var p1 = polygon[i1];
            var p2 = polygon[i2];

            // find the line perpendicular to this edge
            var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if ((minA === undefined) || projected < minA) {
                    minA = projected;
                }
                if ((maxA === undefined) || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if ((minB === undefined) || projected < minB) {
                    minB = projected;
                }
                if ((maxB === undefined) || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
};