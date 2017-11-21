// Render HTML into a texture with multiple channels
P.Atlas = function(mesh, gridX, gridY, iframe, width, height) {
  this.width = width || 1024;
  this.height = height || 1024
  THREE.DataTexture.call(this, null, this.width, this.height, THREE.RGBAFormat,
    undefined, undefined, undefined, undefined,  THREE.LinearFilter, THREE.LinearFilter);
  this.flipY = true;
  //this.anisotropy = 8;
  if (iframe) {
    this.iframe = iframe;
    var that = this;
    this.canvas = document.createElement('canvas');
    document.body.appendChild(this.canvas);
  }

  this.mesh = mesh;
  this.current = [];
  this.stamps = [];
  this.contents = [];
  this.queue = []
  this.released = [];
  this.stamp = 0;
  this.pool = {}
  this.gridX = gridX;
  this.gridY = gridY;
  this.countX = Math.floor(this.width / this.gridX)
  this.countY = Math.floor(this.height / this.gridY)
  this.limit = this.countX * this.countY;
  this.renderBufferSize = 6;
  this.renderBuffer = this.renderBufferSize;
  this.fetchBufferSize = 16;
  this.fetchBuffer = this.fetchBufferSize;
  this.fetching = 0;
  this.needsUpdate = true;
}

P.Atlas.getIframe = function(callback) {
  if (this.frame) {
    this.iframe.callbacks.push(callback)
    return this.iframe;
  }

  this.iframe = document.createElement('iframe');
  this.iframe.callbacks = [callback];
  var iframeWrapper = document.createElement('div')
  iframeWrapper.style.width = '0px'
  iframeWrapper.style.height = '0px'
  iframeWrapper.style.overflow = 'hidden'

  iframeWrapper.appendChild(this.iframe)
  document.body.appendChild(iframeWrapper)
  this.iframe.style.display = 'block'
  this.iframe.style.visibility = 'hidden'
  this.iframe.style.position = 'absolute'
  this.iframe.style.top = '-1024px'
  this.iframe.style.left = '-1024px'
  this.iframe.width = 1024//gridX - 1;
  this.iframe.height = 1024//gridY - 1;

  this.iframe.contentWindow.document.open();
  this.iframe.contentWindow.document.write('<body></body>');

  this.iframe.contentWindow.document.close();

  var doc = this.iframe.contentWindow.document;
  var link = doc.createElement('link');
  link.href = "engine/styles/content.css?ver=" + P.version.commit
  link.rel = 'stylesheet'
  link.onload = function() {
    setTimeout(function() {

      this.iframe.callbacks.forEach(function(callback) {
        callback(this.iframe);
      }, this)
    }.bind(this), 100)
  }.bind(this)
  doc.body.appendChild(link)

  return this.iframe;
}

P.Atlas.prototype = Object.create(THREE.DataTexture.prototype)

P.Atlas.prototype.onRender = function() {
  this.buffer = this.renderBufferSize;
  this.nextRender = null;

  if (this.queue.length) {
    var count = this.fetchBufferSize - this.fetching;
    for (var i = 0; i < count; i++)
      if (this.queue.length)
        this.renderHTML.apply(this, this.queue.splice(0, 3).concat(true))
  }
}

P.Atlas.prototype.nextFrame = function(callback) {
  var that = this;
  cancelAnimationFrame(this.nextRender)
  return that.nextRender = window.requestAnimationFrame(function() {
    //that.nextRender = window.requestAnimationFrame(function() {
      //that.nextRender = window.requestAnimationFrame(function() {
        that.nextRender = null;
        callback()
      //})
    //})
  })
}
P.Atlas.prototype.cancelFrame = function(callback) {
  return (window.cancelAnimationFrame)(callback || this.nextRender)
}
P.Atlas.prototype.allocateShared = function(label, url) {
  var image = this.pool[url] || (this.pool[url] = {
    imageSRC: url,
    dependencies: []
  });
  var index = image.dependencies.indexOf(this);
  if (index == -1) {
    image.dependencies.push(this)
    if (image.dependencies.length === 1) {
      return image.atlasIndex = this.allocate(image)
    }
  }
  label.instances.changes |= label.instances.UPDATE_UV 
  
  return image.atlasIndex

}

P.Atlas.prototype.releaseShared = function(label, url) {
  var image = this.pool[url]
  if (!image) return;
  var index = image.dependencies.indexOf(this);
  if (index > -1)
    image.dependencies.splice(index, 1)
  if (image.dependencies.length === 0) {
    this.release(image)
  }
  label.instances.changes |= label.instances.UPDATE_UV 
}


P.Atlas.prototype.allocate = function(label, html, forceUpdate) {
  this.stamp++;

  if (!html && label.getKey) {
    var key = label.getKey()
    for (var i = 0; i < this.current.length; i++) {
      if (this.current[i].getKey() == key) {
        var current = i;
        break;
      }
    }
  }
  if (current == null)
    var current = this.current.indexOf(html || label);
  // bump version
  if (current > -1) {
    pos = current;
    var reuse = !forceUpdate && (html || !label.unrendered);
  // update oldest texture
  } else if (this.current.length === this.limit) {
    var min = Infinity;
    var pos;

    // check if there's anything released
    if (this.released.length) {
      var index = this.released.indexOf(label);
      if (index > -1) {
        this.released.splice(index, 1)
        label.repurposed = null;
      } else {
        var first = this.released.shift()
        var pos = first.atlasIndex;
        first.appeared = null;
        first.atlasIndex = null;
        //first.repurposed = true;
        first.unrendered = true;
        //label.repurposed = true;

        var index = this.queue.indexOf(first);
        if (index > -1) {
          this.queue.splice(index, 3)
        }
      }
    } else if (label.isImportant()) {

      // replace the oldest thing
      for (var i = 0, j = this.limit; i < j; i++) {
        if (!this.current[i].isImportant()) {
          min = this.stamps[i];
          pos = i;
          break;
        }
      }
      if (pos == null) {
        label.unrendered = true;
        return null;
      }
      var first = this.current[pos];
      first.appeared = null;
      first.unrendered = true;
      label.repurposed = first;
      var index = this.queue.indexOf(first);
      if (index > -1) {
        this.queue.splice(index, 3)
      }

    } else {
      label.unrendered = true;
      return null;
    }
  } else {
    var pos = this.current.length;
  }
  this.released = this.released.filter(function(other) {
    return (other.atlasIndex !== pos && other !== label) 
  })

  this.stamps[pos] = this.stamp;
  var old = this.current[pos]
  this.current[pos] = html || label;
  if (label && label.getInstances) {
    var instances = label.getInstances();
    instances.changes |= instances.UPDATE_UV;
  }

  if (!reuse) {
    this.scheduleHTML(label, html, pos)
  } else {
    if (old.offsetWidth) {
      label.onTextureReuse(old)
    }

  }
    return pos
}

P.Atlas.prototype.release = function(label, html) {
  if (label.atlasIndex != null && this.released.indexOf(label) == -1) {
    this.released.push(label)
  }
  // push a the end of the queue
  if (html != null) {
    var index = this.queue.indexOf(html);
    if (index > -1)
      this.queue.splice(index - 1, 3);
  } else {
    var index = this.queue.indexOf(label);
    if (index > -1)
      this.queue.splice(index, 3);
  }
  if (index > -1)
    this.queue.push(label, html, label.atlasIndex);
}


P.Atlas.prototype.scheduleHTML = function(label, html, atlasIndex) {
  if (label) {
    if (label.imageSRC)
      label.loaded = false;
    else
      label.unrendered = true
  }
  if (this.fetching == this.fetchBufferSize) {
    if (atlasIndex != null) {
      var index = this.queue.indexOf(atlasIndex);
      if (index > -1)
        this.queue.splice(index - 2, 3);
    } else {
      var index = this.queue.indexOf(label);
      if (index > -1)
        this.queue.splice(index, 3);
    }
    this.queue.push(label, html, atlasIndex);
  } else {
    this.renderHTML(label, html, atlasIndex)
  }
}

P.Atlas.prototype.renderHTML = function(label, html, atlasIndex, dontRender) {
  var that = this;
  if (this.iframe && (!label.imageSRC || label.imageFailed)) {
    var metabox = label.render(this.iframe.contentWindow.document.body)
      
    if (P.Atlas.lastElement && P.Atlas.lastElement !== metabox) 
      P.Atlas.lastElement.parentNode.style.display = 'none'
    metabox.parentNode.style.display = 'block';
    P.Atlas.lastElement = metabox
    var canvas = this.canvas
    if (label.onTexturePrepare)
      label.onTexturePrepare(metabox);
    label.atlasIndex = atlasIndex
    this.fetching++;
    var time = new Date
    html2canvas(metabox.parentNode, {
      background: undefined,
      canvas: canvas,
      taintTest: false,
      width: this.gridX,
      height: this.gridY,
      onrendered: function(canvas) {
        that.fetching--;
        label.rendering = null;
        label.loaded = true
        if (label.atlasIndex != null) {
          label.unrendered = null;
          label.repurposed = null;
          if (label.onTextureReady)
            label.onTextureReady(metabox);
          var image = that.upload(canvas, atlasIndex, 0, 0)
          that.flush(that.partials.pop())
        }
        that.fetchBuffer++;
        //if (that.renderBuffer) {
        //  that.renderBuffer--;
        //  if (that.queue.length)
        //    that.renderHTML.apply(that, that.queue.splice(0, 3))
        //}
        //}, 200)
      }
    })

  } else {
    var image = new Image;
    this.fetching++;
    image.onerror = function() {
      label.imageFailed = true
      if (that.iframe)
        that.renderHTML(label, html, atlasIndex, dontRender)
      else
        this.onload()
    }
    image.crossOrigin = 'anonymous'
    image.onload = function() {
      //setTimeout(function() {
      that.fetching--;
      that.fetchBuffer++;
      that.rendering = null;
      var image = this;
      if ((!label || label.atlasIndex != null) && this.complete) {
        image = that.upload(image, atlasIndex, 0, 0)

        if (label) {
          label.loaded = true
          label.unrendered = null;
          label.repurposed = null;
          if (label.onTextureReady)
            label.onTextureReady(image);
        }
        that.flush(that.partials.pop())
      }
      else if (label) {
        label.loaded = true
        label.unrendered = true
      }

      image = null;
      
      //}.bind(this), 1000)
    }
    //image.onerror = function() {
    //  image.src = label.imageSRC;
    //}
    var src = (html && html.src || label.imageSRC);
    if (src.indexOf('?') > -1)
      src += '&'
    else
      src += '?'
    if (src.indexOf('://') == -1)
      image.src = src + 'ver=' + P.version.commit;
    else
      image.src = src + 'ver=' + P.version.commit;
    if (image.src.indexOf('svg') > -1) {
      image.width = this.gridX;
      image.height = this.gridY;
    }

  }
}

// use internal apis to push image partial without rendering frame
// this frees up canvas for next job
P.Atlas.prototype.flush = function(image) {

  var _gl = renderer.context
  var textureProperties = renderer.properties.get(this)
  renderer.state.activeTexture( _gl.TEXTURE0 + 0 );
  renderer.state.bindTexture( _gl.TEXTURE_2D, textureProperties.__webglTexture );

  _gl.pixelStorei( _gl.UNPACK_FLIP_Y_WEBGL, this.flipY );
  _gl.pixelStorei( _gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha );
  _gl.pixelStorei( _gl.UNPACK_ALIGNMENT, this.unpackAlignment );

  renderer.state.texSubImage2D(
     0, image.offsetX, image.offsetY, this.format, this.type, image 
  )

  this.nextFrame(function() {
    P.animate.start()
  })
}

P.Atlas.prototype.upload = function(image, atlasIndex, offsetX, offsetY) {
  if (!this.partials)
    this.partials = [];
  var gridX = this.gridX;
  var gridY = this.gridY;
  image.offsetX = Math.floor(atlasIndex % this.countX) * gridX + ((offsetX || 0));
  image.offsetY = Math.floor(atlasIndex / this.countX) * gridY + ((offsetY || 0));
  this.repeat.set(gridX / this.width, gridY / (this.height));
  this.offset.set(0,0);
  this.partials.push(image)
  //this.needsUpdate = true;
  return image
};