
THREE.ShaderChunk[ 'fog_fragment' ] = "#ifdef USE_FOG\
\n #ifdef USE_LOGDEPTHBUF_EXT\
\n    float depth = gl_FragDepthEXT / gl_FragCoord.w;\
\n #else\
\n   float depth = gl_FragCoord.z / gl_FragCoord.w ;\
\n  #endif\
\n  #ifdef FOG_EXP2\
\n   float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 )) ;\
\n  #else\
\n   float fogFactor = smoothstep( fogNear, fogFar, depth );\
\n #endif\
\n  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\
\n#endif\
\n";

THREE.ShaderChunk.uv_vertex = '\n\
#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\
  vUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\
#endif\n\
#ifdef INSTANCE_UV\n\
  vInstanceUv = instanceUV;\n\
  vOriginalUv = uv;\n\
#endif\n\
#ifdef INSTANCE_OPACITY\n\
  vInstanceOpacity = instanceOpacity;\n\
#endif\n\
'
THREE.ShaderChunk.alphamap_fragment = '\n\
#ifdef USE_ALPHAMAP\n\
  #ifdef INSTANCE_UV\n\
    diffuseColor.a *= texture2D( alphaMap, vOriginalUv.xy ).g;\n\
  #else\n\
    diffuseColor.a *= texture2D( alphaMap, vUv.xy ).g;\n\
  #endif\n\
#endif\n\
'
THREE.ShaderChunk.map_fragment = '#ifdef USE_MAP\n\
#ifdef INSTANCE_UV\n\
   \tvec2 uv = vUv;\n\
   vec2 count = vec2(floor(ATLAS_WIDTH / GRID_WIDTH), floor(ATLAS_HEIGHT / GRID_HEIGHT));\n\
   vec2 uvAtlas = vec2(mod(vInstanceUv.x, count.x) * GRID_WIDTH / ATLAS_WIDTH,\n\
                       floor(vInstanceUv.x / count.x) * GRID_HEIGHT / ATLAS_HEIGHT ); \n\
   uv.x *= floor(vInstanceUv.y) / GRID_WIDTH;\n\
   uv.y = (GRID_HEIGHT - fract(vInstanceUv.y) * 10000.) / ATLAS_HEIGHT + uv.y * fract(vInstanceUv.y) * 10000. / GRID_HEIGHT;\n\
   float n = 0.25;\n\
   float x = vOriginalUv.x * vInstanceUv.z;\n\
   float xx = vOriginalUv.x - (1. - n / vInstanceUv.z); \n\
   float y = vOriginalUv.y * vInstanceUv.w;\n\
   float yy = vOriginalUv.y - (1. - n / vInstanceUv.w); \n\
   float z = float(vInstanceUv.z > 0.0);\n\
   float zn = float(vInstanceUv.z < 0.0);\n\
   float u = 1. - zn * 0.5;\n\
  uv.x = (1. - z) * uv.x + \n\
    z * (\n\
   float(x <= n) * x / count.x +\n\
   float(x > n && xx < 0.) * ((1. / 4. / count.x) + mod(x - n - mod(vInstanceUv.z, 1.0) / 2., 0.5) / count.x) +\n\
   float(xx >= 0.) * (3. / 4. / count.x + ((xx) / count.x * vInstanceUv.z)));\n\
  uv.y = (1. - z) * uv.y + z * (\n\
   float(y <= n) * y / count.y +\n\
   float(y > n && yy < 0.) *((1. / 4. / count.y) + mod(y - n - mod(vInstanceUv.w, 1.0) / 2., 0.5) / count.y) +\n\
   float(yy >= 0.) * (3. / 4. / count.y + ((yy)  / count.y * vInstanceUv.w)));\n\
  float inbound = float(uv.x > ATLAS_OFFSET / ATLAS_WIDTH && uv.x < (GRID_WIDTH - ATLAS_OFFSET) / ATLAS_WIDTH && uv.y > ATLAS_OFFSET / ATLAS_HEIGHT && uv.y <  (GRID_HEIGHT - ATLAS_OFFSET) / ATLAS_HEIGHT);\n\
  \tvec4 texelColor = inbound * texture2D( map, (uv * u - zn * (vInstanceUv.zw + 1.) * 2. / 4. / count) + uvAtlas  );\n\
\ttexelColor = mapTexelToLinear( texelColor );\n\
#ifdef USE_CHANNEL_PACKING\n\
  #ifdef INSTANCE_COLOR\n\
    diffuseColor.rgb = mix(diffuseColor.rgb, vInstanceColor, texelColor.b);\n\
  #endif\n\
  #ifdef IGNORE_GREEN\n\
    texelColor.g = 0.0; \n\
  #endif\n\
  // stroke color\n\
  //float maxn = max(max(texelColor.b, texelColor.r), texelColor.g); \n\
  float maxn = texelColor.b + texelColor.r + texelColor.g; \n\
  \n\
  if (texelColor.a == 1.0) {\n\
    \tdiffuseColor.rgb = mix(mix(diffuseColor.rgb, vec3(0,0,0), texelColor.r), vec3(1,1,1), texelColor.g); \n\
    \tdiffuseColor.a *= maxn;\n\
    \tdiffuseColor.a *= float(maxn > 0.1);\n\
  } else {\n\
    diffuseColor *= texelColor;\n\
  }\n\
#else\n\
  \tdiffuseColor *= texelColor;\n\
#endif\n\
#else\n\
  \tvec4 texelColor = texture2D( map, vUv );\n\
  \ttexelColor = mapTexelToLinear( texelColor );\n\
  \tdiffuseColor *= texelColor;\n\
#endif\n\
#endif\n\
'
THREE.ShaderChunk.uv_pars_fragment = '\n\
#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )\n\
  varying vec2 vUv;\n\
#endif\n\
#ifdef INSTANCE_UV\n\
  varying vec4 vInstanceUv;\n\
  varying vec2 vOriginalUv;\n\
#endif\n\
#ifdef INSTANCE_OPACITY\n\
  varying float vInstanceOpacity;\n\
#endif\n\
'

THREE.ShaderChunk.fog_pars_vertex = '\n\
#ifdef USE_FOG\n\
  varying float fogDepth;\n\
#endif\n\
#ifdef INSTANCE_UV\n\
  varying vec4 vInstanceUv;\n\
  varying vec2 vOriginalUv;\n\
#endif\n\
#ifdef INSTANCE_OPACITY\n\
  varying float vInstanceOpacity;\n\
#endif\n\
';

