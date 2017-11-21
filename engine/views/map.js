P.views.map = new P.Scene.Canvas({
  camera: {
    zoom: 0.02
  },

  getPerspectiveType: function() {
    return 'isometric'
  }
});