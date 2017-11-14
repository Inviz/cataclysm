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

doPolygonsIntersect = (function() {
  var normal = {};
return function doPolygonsIntersect (a, b, X, Y) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;
    if (X == null)
      X = 'x'
    if (Y == null)
      Y = 'y'

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
            normal.x = p2[Y] - p1[Y]
            normal.y = p1[X] - p2[X]

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < a.length; j++) {
                projected = normal.x * a[j][X] + normal.y * a[j][Y];
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
                projected = normal.x * b[j][X] + normal.y * b[j][Y];
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
})();










(function(global){
    var module = global.noise = {};

    function Grad(x, y, z) {
      this.x = x; this.y = y; this.z = z;
    }
    
    Grad.prototype.dot2 = function(x, y) {
      return this.x*x + this.y*y;
    };

    Grad.prototype.dot3 = function(x, y, z) {
      return this.x*x + this.y*y + this.z*z;
    };

    var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
                 new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
                 new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

    var p = [151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    // To remove the need for index wrapping, double the permutation table length
    var perm = new Array(512);
    var gradP = new Array(512);

    // This isn't a very good seeding function, but it works ok. It supports 2^16
    // different seed values. Write something better if you need more seeds.
    module.seed = function(seed) {
      if(seed > 0 && seed < 1) {
        // Scale the seed out
        seed *= 65536;
      }

      seed = Math.floor(seed);
      if(seed < 256) {
        seed |= seed << 8;
      }

      for(var i = 0; i < 256; i++) {
        var v;
        if (i & 1) {
          v = p[i] ^ (seed & 255);
        } else {
          v = p[i] ^ ((seed>>8) & 255);
        }

        perm[i] = perm[i + 256] = v;
        gradP[i] = gradP[i + 256] = grad3[v % 12];
      }
    };

    module.seed(0);

    /*
    for(var i=0; i<256; i++) {
      perm[i] = perm[i + 256] = p[i];
      gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
    }*/

    // Skewing and unskewing factors for 2, 3, and 4 dimensions
    var F2 = 0.5*(Math.sqrt(3)-1);
    var G2 = (3-Math.sqrt(3))/6;

    var F3 = 1/3;
    var G3 = 1/6;

    // 2D simplex noise
    module.simplex2 = function(xin, yin) {
      var n0, n1, n2; // Noise contributions from the three corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin+yin)*F2; // Hairy factor for 2D
      var i = Math.floor(xin+s);
      var j = Math.floor(yin+s);
      var t = (i+j)*G2;
      var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
      var y0 = yin-j+t;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        i1=1; j1=0;
      } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        i1=0; j1=1;
      }
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1 + 2 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      i &= 255;
      j &= 255;
      var gi0 = gradP[i+perm[j]];
      var gi1 = gradP[i+i1+perm[j+j1]];
      var gi2 = gradP[i+1+perm[j+1]];
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0*x0-y0*y0;
      if(t0<0) {
        n0 = 0;
      } else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1*x1-y1*y1;
      if(t1<0) {
        n1 = 0;
      } else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot2(x1, y1);
      }
      var t2 = 0.5 - x2*x2-y2*y2;
      if(t2<0) {
        n2 = 0;
      } else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot2(x2, y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70 * (n0 + n1 + n2);
    };

    // 3D simplex noise
    module.simplex3 = function(xin, yin, zin) {
      var n0, n1, n2, n3; // Noise contributions from the four corners

      // Skew the input space to determine which simplex cell we're in
      var s = (xin+yin+zin)*F3; // Hairy factor for 2D
      var i = Math.floor(xin+s);
      var j = Math.floor(yin+s);
      var k = Math.floor(zin+s);

      var t = (i+j+k)*G3;
      var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
      var y0 = yin-j+t;
      var z0 = zin-k+t;

      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if(x0 >= y0) {
        if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
        else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
        else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
      } else {
        if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
        else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
        else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;

      var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
      var y2 = y0 - j2 + 2 * G3;
      var z2 = z0 - k2 + 2 * G3;

      var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
      var y3 = y0 - 1 + 3 * G3;
      var z3 = z0 - 1 + 3 * G3;

      // Work out the hashed gradient indices of the four simplex corners
      i &= 255;
      j &= 255;
      k &= 255;
      var gi0 = gradP[i+   perm[j+   perm[k   ]]];
      var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
      var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
      var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
      if(t0<0) {
        n0 = 0;
      } else {
        t0 *= t0;
        n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
      if(t1<0) {
        n1 = 0;
      } else {
        t1 *= t1;
        n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
      }
      var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
      if(t2<0) {
        n2 = 0;
      } else {
        t2 *= t2;
        n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
      }
      var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
      if(t3<0) {
        n3 = 0;
      } else {
        t3 *= t3;
        n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 32 * (n0 + n1 + n2 + n3);

    };

    // ##### Perlin noise stuff

    function fade(t) {
      return t*t*t*(t*(t*6-15)+10);
    }

    function lerp(a, b, t) {
      return (1-t)*a + t*b;
    }

    // 2D Perlin Noise
    module.perlin2 = function(x, y) {
      // Find unit grid cell containing point
      var X = Math.floor(x), Y = Math.floor(y);
      // Get relative xy coordinates of point within that cell
      x = x - X; y = y - Y;
      // Wrap the integer cells at 255 (smaller integer period can be introduced here)
      X = X & 255; Y = Y & 255;

      // Calculate noise contributions from each of the four corners
      var n00 = gradP[X+perm[Y]].dot2(x, y);
      var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
      var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
      var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

      // Compute the fade curve value for x
      var u = fade(x);

      // Interpolate the four results
      return lerp(
          lerp(n00, n10, u),
          lerp(n01, n11, u),
         fade(y));
    };

    // 3D Perlin Noise
    module.perlin3 = function(x, y, z) {
      // Find unit grid cell containing point
      var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
      // Get relative xyz coordinates of point within that cell
      x = x - X; y = y - Y; z = z - Z;
      // Wrap the integer cells at 255 (smaller integer period can be introduced here)
      X = X & 255; Y = Y & 255; Z = Z & 255;

      // Calculate noise contributions from each of the eight corners
      var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
      var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
      var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
      var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
      var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
      var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
      var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
      var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

      // Compute the fade curve value for x, y, z
      var u = fade(x);
      var v = fade(y);
      var w = fade(z);

      // Interpolate
      return lerp(
          lerp(
            lerp(n000, n100, u),
            lerp(n001, n101, u), w),
          lerp(
            lerp(n010, n110, u),
            lerp(n011, n111, u), w),
         v);
    };

  })(this);