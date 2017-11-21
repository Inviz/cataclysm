
// desktop browsers have cheap compositing by using window scrollbars 
if (!( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) || window.innerWidth > 1400) {
  document.body.parentNode.setAttribute('id', 'wrapper')
  container.classList.add('fixed')

// mobiles need div with overflow-touch
} else {
  document.documentElement.classList.add('mobile')
  dummy.parentNode.setAttribute('id', 'wrapper')
}

  wrapper.style.width = window.innerWidth + 'px';
  wrapper.style.height = window.innerHeight + 'px';
  container.style.width = window.innerWidth + 'px';
  container.style.height = window.innerHeight + 'px';

  document.body.addEventListener('wheel', onMouseWheel, false); // Chrome/Safari
var stats;

var camera, controls, renderer, scene;

// remove when using next line for animation loop (requestAnimationFrame)
//animate();

//else
//  P.animate.preference = 0;
function init() {

  renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
  renderer.clear()
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.setClearColor( P.styles.backgroundColor);
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );;
  
  // instanced meshes need not to be sorted, they are in the correct order
  renderer.sortObjects = false

  //renderer.shadowMap.enabled = true;
  //renderer.shadowMap.renderReverseSided = false
  //renderer.shadowMap.renderSingleSided = false;
  //renderer.shadowMap.height = 4096
  //renderer.shadowMap.width = 4096

  // shut safari/firefox up
  var ctx = renderer.context;
  var old = ctx.getShaderInfoLog;
  ctx.getShaderInfoLog = function () { 
    var info = old.apply(ctx, arguments);
    if (info.indexOf('GL_ARB_gpu_shader5') > -1)
      return ''
    return info };

  var container = document.getElementById( 'container' );
  container.appendChild( renderer.domElement );
  
  renderer.domElement.setAttribute('id', 'mainCanvas')
  P.gestures(clickable)


  P.Scene.setCamera()
  
  console.log('animations', P.animate.progress ? 'disabled' : 'enabled')
  var scene = P.Scene.build();

  controls = new THREE.OrbitControls( camera, wrapper );
  controls.rotateSpeed = 0.5;
  controls.enablePan = false;
  if (location.search.indexOf('controls') == -1) {
    controls.enableZoom = false;
    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    controls.minPolarAngle = - Math.PI / 2; // radians
    controls.maxPolarAngle = Math.PI / 2 * 0.75; // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
    controls.minAzimuthAngle = Math.PI / 4; // radians
    controls.maxAzimuthAngle = Math.PI / 2 * 1.5; // radians

  }

  controls.addEventListener( 'change', function() {

    P.Scene.measureCamera()
    P.Panel.close()
    P.Scene.onCameraMove(true)
    if (!P.animate.scheduled)
      P.animate.start()
  } );

  var rotated = null;


  if (!controls.originalUpdate)
    controls.originalUpdate = controls.update;

  controls.update = function(type) {
    controls.target.x -= 0.00000001
    P.animate.cancel(camera.position, 'x');
    P.animate.cancel(camera.position, 'y');
    P.animate.cancel(camera.position, 'z');
    P.animate.cancel(camera.rotation, 'x');
    P.animate.cancel(camera.rotation, 'y');
    P.animate.cancel(camera.rotation, 'z');
    if (type == 'rotate' && !rotated) {
      rotated = controls.target.clone();
    }
    var result = controls.originalUpdate.apply(controls, arguments);
    controls.target.x += 0.00000001
    return result;
  }

  controls.finish = function() {
    if (rotated) {
      P.Scene.rotatedPoint = camera.position.clone().sub(rotated);
      P.Scene.rotationAngle = camera.rotation.clone();
      P.Scene.current.onInitialize();
      rotated = false;
    }
  }
  // generate instanced models
  
  P.areas = []
  P.instances();

  P.Atlas.getIframe(function(iframe) {
    
    P.Label.instances.material.map = new P.Atlas(P.Label.instances, 512, 128, iframe, 2048, 2048);
    P.Label.instances.material.map.fetchBufferSize = 2;
    P.Label.instances.material.defines.ATLAS_WIDTH = '2048.';
    P.Label.instances.material.defines.ATLAS_HEIGHT = '2048.';
    P.Label.instances.material.defines.GRID_WIDTH = '512.';
    P.Label.instances.material.defines.GRID_HEIGHT = '128.';
    P.Label.instances.material.defines.ATLAS_OFFSET = '1.';

    P.Label.instances.front.material.map = P.Label.instances.material.map
    P.Label.instances.front.material.defines.ATLAS_WIDTH = '2048.';
    P.Label.instances.front.material.defines.ATLAS_HEIGHT = '2048.';
    P.Label.instances.front.material.defines.GRID_WIDTH = '512.';
    P.Label.instances.front.material.defines.GRID_HEIGHT = '128.';
    P.Label.instances.front.material.defines.ATLAS_OFFSET = '1.';

    P.Panel.instances.material.map = new P.Atlas(P.Panel.instances, 1024, 256, iframe, 1024, 2048);
    P.Panel.instances.material.map.fetchBufferSize = 2;
    P.Panel.instances.material.defines.ATLAS_WIDTH = '1024.';
    P.Panel.instances.material.defines.ATLAS_HEIGHT = '2048.';
    P.Panel.instances.material.defines.GRID_WIDTH = '1024.';
    P.Panel.instances.material.defines.GRID_HEIGHT = '256.';
    P.Panel.instances.material.defines.ATLAS_OFFSET = '1.';


    render(true)
    READY()

  })

  P.Sprite.instances.material.map = new P.Atlas(P.Sprite.instances, 256, 256, null, 2048, 2048);
  P.Sprite.instances.material.defines.ATLAS_WIDTH = '2048.';
  P.Sprite.instances.material.defines.ATLAS_HEIGHT = '2048.';
  P.Sprite.instances.material.defines.GRID_WIDTH = '256.';
  P.Sprite.instances.material.defines.GRID_HEIGHT = '256.';
  P.Sprite.instances.material.defines.ATLAS_OFFSET = '1.';

  P.Sprite.instances.front.material.map = P.Sprite.instances.material.map;
  P.Sprite.instances.front.material.defines.ATLAS_WIDTH = '2048.';
  P.Sprite.instances.front.material.defines.ATLAS_HEIGHT = '2048.';
  P.Sprite.instances.front.material.defines.GRID_WIDTH = '256.';
  P.Sprite.instances.front.material.defines.GRID_HEIGHT = '256.';
  P.Sprite.instances.front.material.defines.ATLAS_OFFSET = '1.';

  P.Icon.instances.material.map = P.Sprite.instances.material.map
  P.Icon.instances.material.defines.ATLAS_WIDTH = '2048.';
  P.Icon.instances.material.defines.ATLAS_HEIGHT = '2048.';
  P.Icon.instances.material.defines.GRID_WIDTH = '256.';
  P.Icon.instances.material.defines.GRID_HEIGHT = '256.';
  P.Icon.instances.material.defines.ATLAS_OFFSET = '1.';

  P.Icon.instances.front.material.map = P.Sprite.instances.material.map
  P.Icon.instances.front.material.defines.ATLAS_WIDTH = '2048.';
  P.Icon.instances.front.material.defines.ATLAS_HEIGHT = '2048.';
  P.Icon.instances.front.material.defines.GRID_WIDTH = '256.';
  P.Icon.instances.front.material.defines.GRID_HEIGHT = '256.';
  P.Icon.instances.front.material.defines.ATLAS_OFFSET = '1.';

  P.Background.instances.material.map = P.Sprite.instances.material.map
  P.Background.instances.material.defines.ATLAS_WIDTH = '2048.';
  P.Background.instances.material.defines.ATLAS_HEIGHT = '2048.';
  P.Background.instances.material.defines.GRID_WIDTH = '256.';
  P.Background.instances.material.defines.GRID_HEIGHT = '256.';
  P.Background.instances.material.defines.ATLAS_OFFSET = '1.';

  P.Background.instances.front.material.map = P.Sprite.instances.material.map
  P.Background.instances.front.material.defines.ATLAS_WIDTH = '2048.';
  P.Background.instances.front.material.defines.ATLAS_HEIGHT = '2048.';
  P.Background.instances.front.material.defines.GRID_WIDTH = '256.';
  P.Background.instances.front.material.defines.GRID_HEIGHT = '256.';
  P.Background.instances.front.material.defines.ATLAS_OFFSET = '1.';



//  renderer.compile(scene, camera)
 // for ( var l = 0; l < P.areas.length; l ++ ) {
 ////   P.scene.add( P.areas[l] );
 // }

 // EACH FRAME: Find out which areas are visible, prepare instances
 Object.defineProperty(P.Floor.instances, 'frustumCulled', {
   get: function() {
     if (!renderer.culled) {
       P.Scene.onBeforeCull(renderer)
       renderer.cullingChanged = P.cull(renderer._frustum)
       P.cull.areas(P.areas)
       renderer.culled = true;

     } else {
       renderer.cullingChanged = null;
     }
     return false;
   }
 })


  var axisHelper = new THREE.AxisHelper( 500 );
  if (location.search.indexOf('axis') > -1) 
    scene.add( axisHelper );

  stats = new Stats();
  if (location.search.indexOf('stats') > -1)
    document.body.appendChild( stats.dom );
 
  if (wrapper.tagName == 'DIV')
    window.onscroll = function(e) {
      if (e.target.tagName != 'DIV' && e.target.tagName != 'SECTION'){
        window.scrollTo(0, 0)
        e.preventDefault()
      }
    }

  window.addEventListener( 'orientationchange', onWindowResize, false );
  window.addEventListener( 'resize', onWindowResize, false );
  if (!('ontouchstart' in document)) {
    document.addEventListener( 'mousemove', onMouseMove, false );
    document.addEventListener( 'mouseup', function(e) {
      P.Scene.onDragEnd(e)
    });
  }

 //else
 //  P.Import.load(P.backend + '/api/users/me_v2/', P.Import.startup)

}

function onMouseMove( event, doNotRender) {
  if (!P.Scene.state) return;
  var old = P.pointer;
  if (P.Scene.current.onMouseMove && P.Scene.current.onMouseMove)
    if (P.Scene.current.onMouseMove(event) === false)
      return

  P.pointer = new P.Pointer(event ? event.clientX : null, event ? event.clientY : null, camera, P.areas, event && event.type == 'touch');
  if (P.pointer.person 
    || P.pointer.label 
    || P.pointer.icon 
    || P.pointer.workplace 
    || P.pointer.company 
    || (P.pointer.zone && P.Scene.state == 'search')) {
    document.documentElement.classList.add('hover');
  }
  else
    document.documentElement.classList.remove('hover');

  if (P.currently.draggingPerson && !('ontouchstart' in document)) {
    P.Scene.onDragMove(event)
  }

  if (P.pointer.shouldRender(old) && !doNotRender) {
    P.Sprite.instances.changes = P.Person.instances.UPDATE_RESET;
//    console.log(' rendering')
    P.animate.start()
  }
  else {
 //   console.log('not rendering')
  }
}
var wWidth = window.innerWidth;
var wHeight = window.innerHeight
function onWindowResize(force) {
  clearTimeout(P.Scene.resizingWindow);
  if (force !== false) {
    var i = 0;
    var checkIfWindowSizeChanged = function() {
      i++;
      if (i < 100) {
        onWindowResize(false);
        cancelAnimationFrame(P.Scene.resizingWindow)
        P.Scene.resizingWindow = requestAnimationFrame(checkIfWindowSizeChanged)
      }
    }
    cancelAnimationFrame(P.Scene.resizingWindow)
    P.Scene.resizingWindow = requestAnimationFrame(checkIfWindowSizeChanged)
  }
  if (wrapper.tagName == 'DIV' && (window.scrollY || window.scrollX))
    window.scrollTo(0, 0)
  if (force || wWidth !== window.innerWidth || wHeight !== window.innerHeight) {
    P.Scene.resizing = null;
    P.Scene.onDragEnd();
    wWidth = window.innerWidth;
    wHeight = window.innerHeight
    wrapper.style.width = window.innerWidth + 'px';
    wrapper.style.height = window.innerHeight + 'px';
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
    renderer.setSize( window.innerWidth, window.innerHeight );
    P.animate.lock()
    if (P.Scene.current && P.Scene.current.onInitialize) {
      var expanded = P.Panel.expanded
      P.Panel.expanded = null
      if (expanded)
        P.Scene.current.onScroll()
      P.Scene.current.onInitialize()
      P.Panel.expanded = expanded
    }

    P.animate.unlock()
    P.animate.start(true)
  }
}


var rendered = 0;

  var _v3 = new THREE.Vector3();
  var tracing = location.search.indexOf('tracing') > -1;
function render(force) {
  if (!P.initialized && !force) return;
  renderer.culled = false;
  rendered++;

  renderer.setClearColor(0xeaeaea);
  renderer.clear()
  renderer.setScissor( 0,0, window.innerWidth * devicePixelRatio, window.innerHeight * devicePixelRatio);
  renderer.setScissorTest( true );


  //if (P.Person.instances.material.map)
  //  P.Person.instances.material.map.onRender();
  //P.Sprite.instances.material.map.onRender();
  //if (P.Label.instances.material.map)
  //  P.Label.instances.material.map.onRender();
  //if (P.Panel.instances.material.map)
  //  P.Panel.instances.material.map.onRender();

  if (P.Area.onRender)
    P.Area.onRender()

  // fixme, clones not updated when going to search
  if (tracing)
    console.time('frame ' + rendered)
  renderer.render(scene, camera);
  if (tracing)
    console.timeEnd('frame ' + rendered)
  stats.update();
  if (P.Panel.iframe)
    P.Scene.updateFloater()

}

init()

function saveAs (name, content) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, 2, 2));
  var dlAnchorElem = document.getElementById('downloadAnchorElem');
  dlAnchorElem.setAttribute("href",     dataStr     );
  dlAnchorElem.setAttribute("download", name || "scene.json");
  dlAnchorElem.click();
}
  function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    var reader = new FileReader();  
    reader.onload = function(event) {            
      var content = event.target.result;
      if (files[0].type == 'application/json') {
        var json = JSON.parse(content);
        json.maxWidth = null;
        json.minWidth = null;
        json.people = [];
        
        var area = P.currently.showingArea || P.currently.editingArea;
        delete json.id;
        P.Snapshot.push(json, true)
        area.label.onAppear(true)
        if (P.Scene.backgroundImage && P.Scene.backgroundImage.material.map.image.width) {
          area.minWidth = P.Wall.atGrid(P.Scene.backgroundImage.material.map.image.width)
          area.minHeight = P.Wall.atGrid(P.Scene.backgroundImage.material.map.image.height)
        }
        //area.computeBox(null, true)
        //area.computeAreaBox()
        if (P.Scene.current.backgroundImage)
          P.Scene.current.backgroundImage()
        P.Scene.current.onInitialize()
      } else {

        localStorage.draggedFile = content;
        location.reload()
      }
    }
    if (files[0].type.indexOf('image/') > -1 || files[0].type.indexOf('svg') > -1) {
      var url = window.URL.createObjectURL(files[0]);;
      var texloader = new THREE.TextureLoader();

      texloader.load(url, function(tex) {
        tex.anisotropy = 8
        if (P.Scene.backgroundImage)
          scene.remove(P.Scene.backgroundImage)
        P.Scene.backgroundImage = new THREE.Mesh(new THREE.PlaneBufferGeometry(tex.image.width, tex.image.height),
          new THREE.MeshLambertMaterial({
            map: tex
          }));
        var area = P.currently.showingArea || P.currently.editingArea;

        P.Scene.backgroundImage.rotation.x = -Math.PI / 2;
        P.Scene.backgroundImage.rotation.z = Math.PI / 2;
        area.minWidth = P.Wall.atGrid(tex.image.width);
        area.minHeight = P.Wall.atGrid(tex.image.height);
        //area.computeBox(null, true)
        //area.computeAreaBox()
        scene.add(P.Scene.backgroundImage);
        if (P.Scene.state !== 'editor')
          P.Scene.navigate('editor')
        else {
          P.Scene.current.onInitialize()
          P.Scene.current.backgroundImage()
        }


        render()
      })

    } else {
      reader.readAsText(files[0],"UTF-8");

    }
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  searchForm.addEventListener('submit', function(e) {
   
    if (searchInput.value.trim()) {
      P.Scene.navigate('search');
    } else {
      P.Scene.navigate('floor');
    }

    e.preventDefault()
  })
  searchInput.addEventListener('change', function(e) {
    if (searchInput.value.trim()) {
      P.Scene.navigate('search');
    } else {
      P.Scene.navigate('floor');
    }

  })
  searchInput.addEventListener('keydown', function(e) {
    if (e.keyCode != 13)
      return;
    if (searchInput.value.trim()) {
      P.Scene.navigate('search');
    } else {
      P.Scene.navigate('floor');
    }

    e.preventDefault()
  })
  // Setup the dnd listeners.
  var dropZone = document.body;
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
