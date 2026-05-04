var rdzTools = (function () {
  function getActiveComp() {
    var item = app.project ? app.project.activeItem : null;
    if (!item || !(item instanceof CompItem)) {
      return null;
    }
    return item;
  }

  function getSelectedLayers() {
    var comp = getActiveComp();
    if (!comp) {
      return [];
    }
    return comp.selectedLayers || [];
  }

  function ensureSelection() {
    var layers = getSelectedLayers();
    if (!layers.length) {
      throw new Error("Select at least one layer in an active composition.");
    }
    return layers;
  }

  function currentTime(comp) {
    return comp.time;
  }

  function addOrGetEffect(layer, matchName) {
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) {
      throw new Error("Layer does not support effects.");
    }

    for (var i = 1; i <= effects.numProperties; i += 1) {
      if (effects.property(i).matchName === matchName) {
        return effects.property(i);
      }
    }

    return effects.addProperty(matchName);
  }

  function setEase(prop, index) {
    var easeIn = new KeyframeEase(0, 70);
    var easeOut = new KeyframeEase(0, 70);
    prop.setTemporalEaseAtKey(index, [easeIn], [easeOut]);
  }

  function applyTextFadeUp(layer, comp) {
    var position = layer.property("ADBE Transform Group").property("ADBE Position");
    var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
    var t0 = currentTime(comp);
    var t1 = t0 + 0.45;
    var value = position.value;
    var start = [value[0], value[1] + 60];

    position.setValueAtTime(t0, start);
    position.setValueAtTime(t1, value);
    opacity.setValueAtTime(t0, 0);
    opacity.setValueAtTime(t1, 100);
    setEase(position, position.nearestKeyIndex(t0));
    setEase(position, position.nearestKeyIndex(t1));
    setEase(opacity, opacity.nearestKeyIndex(t0));
    setEase(opacity, opacity.nearestKeyIndex(t1));
  }

  function applyTextPopIn(layer, comp) {
    var scale = layer.property("ADBE Transform Group").property("ADBE Scale");
    var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
    var t0 = currentTime(comp);
    var t1 = t0 + 0.35;
    var startScale = [82, 82];
    var endScale = scale.value;

    scale.setValueAtTime(t0, startScale);
    scale.setValueAtTime(t1, endScale);
    opacity.setValueAtTime(t0, 0);
    opacity.setValueAtTime(t1, 100);
    setEase(scale, scale.nearestKeyIndex(t0));
    setEase(scale, scale.nearestKeyIndex(t1));
  }

  function applyTextSlideLeft(layer, comp) {
    var position = layer.property("ADBE Transform Group").property("ADBE Position");
    var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
    var t0 = currentTime(comp);
    var t1 = t0 + 0.4;
    var value = position.value;
    var start = [value[0] + 90, value[1]];

    position.setValueAtTime(t0, start);
    position.setValueAtTime(t1, value);
    opacity.setValueAtTime(t0, 0);
    opacity.setValueAtTime(t1, 100);
    setEase(position, position.nearestKeyIndex(t0));
    setEase(position, position.nearestKeyIndex(t1));
  }

  function applySoftShadow(layer) {
    var shadow = addOrGetEffect(layer, "ADBE Drop Shadow");
    shadow.property(1).setValue([0, 0, 0]);
    shadow.property(2).setValue(110);
    shadow.property(3).setValue(135);
    shadow.property(4).setValue(18);
    shadow.property(5).setValue(22);
    shadow.property(6).setValue(65);
  }

  function applyBevelLite(layer) {
    var bevel = addOrGetEffect(layer, "ADBE Bevel Alpha");
    bevel.property(1).setValue(3.2);
    bevel.property(2).setValue(0.65);
    bevel.property(3).setValue(135);
    bevel.property(4).setValue(35);
    bevel.property(5).setValue([1, 1, 1]);
    bevel.property(6).setValue([0.08, 0.08, 0.08]);
  }

  function applyLiquidGlass(layer) {
    var blur = addOrGetEffect(layer, "ADBE Gaussian Blur 2");
    var fill = addOrGetEffect(layer, "ADBE Fill");
    var glow = addOrGetEffect(layer, "ADBE Glow");

    fill.property(2).setValue([0.85, 0.93, 1.0]);
    blur.property(1).setValue(12);
    blur.property(2).setValue(1);
    glow.property(1).setValue(0.55);
    glow.property(4).setValue(35);
    glow.property(5).setValue(0.45);
  }

  function centerAnchorPoint(layer) {
    var rect = layer.sourceRectAtTime(layer.containingComp.time, false);
    var anchor = layer.property("ADBE Transform Group").property("ADBE Anchor Point");
    var position = layer.property("ADBE Transform Group").property("ADBE Position");
    var currentAnchor = anchor.value;
    var newAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    var delta = [newAnchor[0] - currentAnchor[0], newAnchor[1] - currentAnchor[1]];
    var currentPosition = position.value;

    anchor.setValue(newAnchor);
    position.setValue([currentPosition[0] + delta[0], currentPosition[1] + delta[1]]);
  }

  function createControlNull() {
    var comp = getActiveComp();
    if (!comp) {
      throw new Error("Open a composition before creating a control null.");
    }

    var nullLayer = comp.layers.addNull();
    nullLayer.name = "rdz_CTRL";
    nullLayer.label = 10;
    nullLayer.selected = true;
  }

  function applyTextPreset(id) {
    var comp = getActiveComp();
    var layers = ensureSelection();

    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      if (!layer.property("Source Text")) {
        continue;
      }

      if (id === "fadeUp") {
        applyTextFadeUp(layer, comp);
      } else if (id === "popIn") {
        applyTextPopIn(layer, comp);
      } else if (id === "slideLeft") {
        applyTextSlideLeft(layer, comp);
      } else {
        throw new Error("Unknown text preset: " + id);
      }
    }
  }

  function applyLookPreset(id) {
    var layers = ensureSelection();

    for (var i = 0; i < layers.length; i += 1) {
      if (id === "softShadow") {
        applySoftShadow(layers[i]);
      } else if (id === "bevelLite") {
        applyBevelLite(layers[i]);
      } else if (id === "liquidGlass") {
        applyLiquidGlass(layers[i]);
      } else {
        throw new Error("Unknown look preset: " + id);
      }
    }
  }

  function applyUtility(id) {
    var layers = getSelectedLayers();

    if (id === "centerAnchorPoint") {
      if (!layers.length) {
        throw new Error("Select at least one layer before centering anchor points.");
      }
      for (var i = 0; i < layers.length; i += 1) {
        centerAnchorPoint(layers[i]);
      }
      return;
    }

    if (id === "createControlNull") {
      createControlNull();
      return;
    }

    throw new Error("Unknown utility: " + id);
  }

  function applyPreset(groupId, presetId) {
    app.beginUndoGroup("rdzTools " + groupId + ":" + presetId);
    try {
      if (groupId === "text") {
        applyTextPreset(presetId);
      } else if (groupId === "looks") {
        applyLookPreset(presetId);
      } else if (groupId === "utilities") {
        applyUtility(presetId);
      } else {
        throw new Error("Unknown preset group: " + groupId);
      }

      return "OK: Applied " + presetId;
    } catch (error) {
      return "Error: " + error.message;
    } finally {
      app.endUndoGroup();
    }
  }

  function getSelectionSummary() {
    var comp = getActiveComp();
    if (!comp) {
      return "No active composition.";
    }

    var layers = getSelectedLayers();
    if (!layers.length) {
      return 'Active comp "' + comp.name + '" with no selected layers.';
    }

    return 'Active comp "' + comp.name + '" with ' + layers.length + " selected layer(s).";
  }

  function ping() {
    return "pong";
  }

  return {
    applyPreset: applyPreset,
    getSelectionSummary: getSelectionSummary,
    ping: ping
  };
}());
