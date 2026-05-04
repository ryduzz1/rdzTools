var rdzTools = (function () {
  function getActiveComp() {
    var item = app.project ? app.project.activeItem : null;
    if (!item || !(item instanceof CompItem)) {
      return null;
    }
    return item;
  }

  function parsePayload(raw) {
    if (!raw) {
      return {};
    }

    try {
      if (typeof JSON !== "undefined" && JSON.parse) {
        return JSON.parse(raw);
      }
    } catch (error) {}

    try {
      return eval("(" + raw + ")");
    } catch (fallbackError) {
      return {};
    }
  }

  function parseStartTime(comp, value) {
    if (typeof value === "number" && !isNaN(value)) {
      return value;
    }

    if (typeof value === "string") {
      var normalized = value.toLowerCase().replace(/^\s+|\s+$/g, "");
      if (normalized !== "" && normalized !== "cursor" && normalized !== "playhead" && normalized !== "current") {
        var parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return comp.time;
  }

  function getSelectedLayers(comp) {
    return comp && comp.selectedLayers ? comp.selectedLayers : [];
  }

  function requireSelectedLayers(comp) {
    var layers = getSelectedLayers(comp);
    if (!layers.length) {
      throw new Error("Select at least one layer.");
    }
    return layers;
  }

  function getTextLayer(comp) {
    var selected = getSelectedLayers(comp);
    for (var i = 0; i < selected.length; i += 1) {
      if (selected[i].matchName === "ADBE Text Layer") {
        return selected[i];
      }
    }

    for (var index = 1; index <= comp.numLayers; index += 1) {
      if (comp.layer(index).matchName === "ADBE Text Layer") {
        return comp.layer(index);
      }
    }

    return null;
  }

  function removeOldTextAnimators(layer) {
    var effects = layer.property("ADBE Effect Parade");
    if (effects) {
      for (var effectIndex = effects.numProperties; effectIndex >= 1; effectIndex -= 1) {
        var effect = effects.property(effectIndex);
        if (effect.name === "AW_Blur" || effect.matchName === "ADBE Fast Box Blur") {
          effect.remove();
        }
      }
    }

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    for (var animatorIndex = animators.numProperties; animatorIndex >= 1; animatorIndex -= 1) {
      var name = animators.property(animatorIndex).name;
      if (name === "AW_Animator" || name.indexOf("TA_Word_") === 0 || name.indexOf("TA_") === 0) {
        animators.property(animatorIndex).remove();
      }
    }
  }

  function addAnimatorProperty(animProps, matchName, fallbackName) {
    try {
      return animProps.addProperty(matchName);
    } catch (primaryError) {}

    try {
      return animProps.addProperty(fallbackName);
    } catch (fallbackError) {}

    return null;
  }

  function setWordEase(prop) {
    if (!prop || prop.numKeys < 2) {
      return;
    }

    for (var keyIndex = 1; keyIndex <= prop.numKeys; keyIndex += 1) {
      try {
        prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      } catch (interpolationError) {}
    }

    try {
      var fastStart = new KeyframeEase(0, 22);
      var softEnd = new KeyframeEase(0, 88);
      prop.setTemporalEaseAtKey(1, [fastStart], [fastStart]);
      prop.setTemporalEaseAtKey(2, [softEnd], [softEnd]);
    } catch (easeError) {}
  }

  function setLayerEase(prop) {
    if (!prop || prop.numKeys < 2) {
      return;
    }

    for (var keyIndex = 1; keyIndex <= prop.numKeys; keyIndex += 1) {
      try {
        prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      } catch (interpolationError) {}
    }

    try {
      var easeIn = new KeyframeEase(0, 45);
      var easeOut = new KeyframeEase(0, 80);
      prop.setTemporalEaseAtKey(1, [easeIn], [easeIn]);
      prop.setTemporalEaseAtKey(2, [easeOut], [easeOut]);
    } catch (easeError) {}
  }

  function key2(prop, t0, v0, t1, v1, easeSetter) {
    if (!prop) {
      return;
    }

    while (prop.numKeys > 0) {
      try {
        prop.removeKey(1);
      } catch (removeError) {
        break;
      }
    }

    prop.setValueAtTime(t0, v0);
    prop.setValueAtTime(t1, v1);
    (easeSetter || setWordEase)(prop);
  }

  function setSelectorToWord(rangeSelector, wordIndex, totalWords) {
    var start = rangeSelector.property(1);
    var end = rangeSelector.property(2);
    var offset = rangeSelector.property(3);
    var advanced = rangeSelector.property(7);
    var sliceStart = (wordIndex / totalWords) * 100;
    var sliceEnd = ((wordIndex + 1) / totalWords) * 100;

    if (start) {
      start.setValue(sliceStart);
    }
    if (end) {
      end.setValue(sliceEnd);
    }
    if (offset) {
      offset.setValue(0);
    }

    if (advanced) {
      try { advanced.property(1).setValue(1); } catch (unitsError) {}
      try { advanced.property(2).setValue(3); } catch (basedOnError) {}
      try { advanced.property(3).setValue(1); } catch (modeError) {}
      try { advanced.property(4).setValue(100); } catch (amountError) {}
      try { advanced.property(5).setValue(1); } catch (shapeError) {}
      try { advanced.property(6).setValue(0); } catch (smoothnessError) {}
    }
  }

  function configureTextAnimatorWordGrouping(layer) {
    try {
      var textProps = layer.property("ADBE Text Properties");
      if (!textProps) {
        return;
      }
      var moreOptions = textProps.property("ADBE Text More Options");
      if (!moreOptions) {
        return;
      }

      try {
        moreOptions.property(1).setValue(2);
      } catch (anchorGroupingError) {}

      try {
        moreOptions.property(2).setValue([50, 50, 0]);
      } catch (groupingAlignmentError) {}
    } catch (groupingError) {}
  }

  function normalizeWordSettings(comp, payload) {
    return {
      wordDur: Math.max(0.05, Math.min(2.0, isNaN(payload.wordDur) ? 0.5 : Number(payload.wordDur))),
      stagger: Math.max(0.0, Math.min(5.0, isNaN(payload.stagger) ? 0.2 : Number(payload.stagger))),
      startSec: parseStartTime(comp, payload.startSec),
      distance: isNaN(payload.distance) ? 40 : Number(payload.distance),
      blurAmt: isNaN(payload.blurAmt) ? 8 : Number(payload.blurAmt),
      blurEnabled: payload.blurEnabled !== false,
      scaleStart: isNaN(payload.scaleStart) ? 100 : Number(payload.scaleStart),
      scaleOvershoot: isNaN(payload.scaleOvershoot) ? 112 : Number(payload.scaleOvershoot),
      rotationStart: isNaN(payload.rotationStart) ? 0 : Number(payload.rotationStart)
    };
  }


  function applyWordAnimation(layer, comp, settings, options) {
    removeOldTextAnimators(layer);
    configureTextAnimatorWordGrouping(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var words = srcText.match(/\S+/g);
    var numWords = words ? words.length : 1;
    var startX = options.offsetX || 0;
    var startY = options.offsetY || 0;

    for (var i = 0; i < numWords; i += 1) {
      var animator = animators.addProperty("ADBE Text Animator");
      animator.name = "TA_Word_" + (i + 1);

      var animProps = animator.property("ADBE Text Animator Properties");
      var posProp = addAnimatorProperty(animProps, "ADBE Text Position 3D", "Position");
      if (!posProp) {
        posProp = addAnimatorProperty(animProps, "ADBE Text Position", "Position");
      }
      var opacityProp = addAnimatorProperty(animProps, "ADBE Text Opacity", "Opacity");
      var blurProp = settings.blurEnabled ? addAnimatorProperty(animProps, "ADBE Text Blur", "Blur") : null;
      var scaleProp = settings.scaleStart !== 100 ? addAnimatorProperty(animProps, "ADBE Text Scale 3D", "Scale") : null;
      var rotationProp = settings.rotationStart !== 0 ? addAnimatorProperty(animProps, "ADBE Text Rotation", "Rotation") : null;

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Word " + (i + 1);
      setSelectorToWord(rangeSelector, i, numWords);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + settings.wordDur;

      if (posProp && (startX !== 0 || startY !== 0)) {
        try {
          key2(posProp, t0, [startX, startY, 0], t1, [0, 0, 0], setWordEase);
        } catch (position3dError) {
          key2(posProp, t0, [startX, startY], t1, [0, 0], setWordEase);
        }
      }
      if (opacityProp) {
        key2(opacityProp, t0, 0, t1, 100, setWordEase);
      }
      if (settings.blurEnabled && blurProp) {
        try {
          key2(blurProp, t0, [settings.blurAmt, settings.blurAmt], t1, [0, 0], setWordEase);
        } catch (blur2dError) {
          try { key2(blurProp, t0, settings.blurAmt, t1, 0, setWordEase); } catch (blur1dError) {}
        }
      }
      if (scaleProp) {
        if (options.scaleBounce) {
          while (scaleProp.numKeys > 0) {
            try {
              scaleProp.removeKey(1);
            } catch (removeScaleError) {
              break;
            }
          }

          var bounceMidA = t0 + (settings.wordDur * 0.48);
          var bounceMidB = t0 + (settings.wordDur * 0.76);
          try {
            scaleProp.setValueAtTime(t0, [settings.scaleStart, settings.scaleStart, 100]);
            scaleProp.setValueAtTime(bounceMidA, [settings.scaleOvershoot, settings.scaleOvershoot, 100]);
            scaleProp.setValueAtTime(bounceMidB, [94, 94, 100]);
            scaleProp.setValueAtTime(t1, [100, 100, 100]);
          } catch (scale3dError) {
            scaleProp.setValueAtTime(t0, [settings.scaleStart, settings.scaleStart]);
            scaleProp.setValueAtTime(bounceMidA, [settings.scaleOvershoot, settings.scaleOvershoot]);
            scaleProp.setValueAtTime(bounceMidB, [94, 94]);
            scaleProp.setValueAtTime(t1, [100, 100]);
          }
          for (var scaleKeyIndex = 1; scaleKeyIndex <= scaleProp.numKeys; scaleKeyIndex += 1) {
            try {
              scaleProp.setInterpolationTypeAtKey(scaleKeyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
            } catch (scaleInterpolationError) {}
          }
          try {
            scaleProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 20)], [new KeyframeEase(0, 82)]);
            scaleProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 80)], [new KeyframeEase(0, 55)]);
            scaleProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 55)], [new KeyframeEase(0, 70)]);
            scaleProp.setTemporalEaseAtKey(4, [new KeyframeEase(0, 70)], [new KeyframeEase(0, 35)]);
          } catch (scaleEaseError) {}
        } else {
          try {
            key2(scaleProp, t0, [settings.scaleStart, settings.scaleStart, 100], t1, [100, 100, 100], setWordEase);
          } catch (plainScale3dError) {
            key2(scaleProp, t0, [settings.scaleStart, settings.scaleStart], t1, [100, 100], setWordEase);
          }
        }
      }
      if (rotationProp) {
        key2(rotationProp, t0, settings.rotationStart, t1, 0, setWordEase);
      }
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
  }

  function getTransformProp(layer, targetName) {
    var transform = layer.property("ADBE Transform Group");
    if (!transform) {
      return null;
    }
    if (targetName === "Position") {
      return transform.property("ADBE Position");
    }
    if (targetName === "Scale") {
      return transform.property("ADBE Scale");
    }
    if (targetName === "Opacity") {
      return transform.property("ADBE Opacity");
    }
    if (targetName === "Rotation") {
      var zRot = transform.property("ADBE Rotate Z");
      if (zRot) {
        return zRot;
      }
      return transform.property("ADBE Rotation");
    }
    if (targetName === "Anchor Point") {
      return transform.property("ADBE Anchor Point");
    }
    return null;
  }

  function normalizeLayerSettings(comp, payload) {
    return {
      startSec: parseStartTime(comp, payload.startSec),
      duration: Math.max(0.05, Math.min(3.0, isNaN(payload.duration) ? 0.45 : Number(payload.duration))),
      distance: isNaN(payload.distance) ? 80 : Number(payload.distance),
      blurAmt: isNaN(payload.blurAmt) ? 18 : Number(payload.blurAmt),
      scaleStart: isNaN(payload.scaleStart) ? 82 : Number(payload.scaleStart),
      rotationStart: isNaN(payload.rotationStart) ? -12 : Number(payload.rotationStart)
    };
  }

  function applyLayerEntrance(layer, comp, settings, options) {
    var positionProp = getTransformProp(layer, "Position");
    var opacityProp = getTransformProp(layer, "Opacity");
    var scaleProp = getTransformProp(layer, "Scale");
    var rotationProp = getTransformProp(layer, "Rotation");
    var t0 = settings.startSec;
    var t1 = t0 + settings.duration;

    if (opacityProp) {
      opacityProp.setValueAtTime(t0, 0);
      opacityProp.setValueAtTime(t1, 100);
      setLayerEase(opacityProp);
    }

    if (positionProp && (options.offsetX || options.offsetY)) {
      var currentPosition = positionProp.value;
      var startPosition = [currentPosition[0] + (options.offsetX || 0), currentPosition[1] + (options.offsetY || 0)];
      if (currentPosition.length > 2) {
        startPosition.push(currentPosition[2]);
      }
      positionProp.setValueAtTime(t0, startPosition);
      positionProp.setValueAtTime(t1, currentPosition);
      setLayerEase(positionProp);
    }

    if (scaleProp && options.scaleStart !== null && options.scaleStart !== undefined) {
      var endScale = scaleProp.value;
      var startScale = endScale.length > 2 ? [options.scaleStart, options.scaleStart, endScale[2]] : [options.scaleStart, options.scaleStart];
      scaleProp.setValueAtTime(t0, startScale);
      scaleProp.setValueAtTime(t1, endScale);
      setLayerEase(scaleProp);
    }

    if (rotationProp && options.rotationStart) {
      rotationProp.setValueAtTime(t0, options.rotationStart);
      rotationProp.setValueAtTime(t1, 0);
      setLayerEase(rotationProp);
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
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

  function addOrGetEffectFlexible(layer, matchName, fallbackName) {
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) {
      throw new Error("Layer does not support effects.");
    }

    for (var i = 1; i <= effects.numProperties; i += 1) {
      var effect = effects.property(i);
      if (effect.matchName === matchName || (fallbackName && effect.name === fallbackName)) {
        return effect;
      }
    }

    try {
      return effects.addProperty(matchName);
    } catch (matchNameError) {}

    if (fallbackName) {
      try {
        return effects.addProperty(fallbackName);
      } catch (fallbackError) {}
    }

    throw new Error("Could not add effect: " + (fallbackName || matchName));
  }

  function setEffectValue(effect, ids, value) {
    if (!effect) {
      return false;
    }

    for (var i = 0; i < ids.length; i += 1) {
      try {
        var prop = effect.property(ids[i]);
        if (prop) {
          prop.setValue(value);
          return true;
        }
      } catch (propertyError) {}
    }

    return false;
  }

  function normalizeLookSettings(payload) {
    return {
      opacity: isNaN(payload.opacity) ? 42 : Number(payload.opacity),
      distance: isNaN(payload.distance) ? 18 : Number(payload.distance),
      softness: isNaN(payload.softness) ? 28 : Number(payload.softness),
      angle: isNaN(payload.angle) ? 135 : Number(payload.angle),
      thickness: isNaN(payload.thickness) ? 4 : Number(payload.thickness),
      lightAngle: isNaN(payload.lightAngle) ? 135 : Number(payload.lightAngle),
      lightIntensity: isNaN(payload.lightIntensity) ? 0.7 : Number(payload.lightIntensity),
      blurAmt: isNaN(payload.blurAmt) ? 3 : Number(payload.blurAmt),
      bevelThickness: isNaN(payload.bevelThickness) ? 7 : Number(payload.bevelThickness),
      glowRadius: isNaN(payload.glowRadius) ? 22 : Number(payload.glowRadius),
      glowIntensity: isNaN(payload.glowIntensity) ? 0.45 : Number(payload.glowIntensity),
      shadowOpacity: isNaN(payload.shadowOpacity) ? 24 : Number(payload.shadowOpacity),
      shadowDistance: isNaN(payload.shadowDistance) ? 10 : Number(payload.shadowDistance),
      shadowSoftness: isNaN(payload.shadowSoftness) ? 24 : Number(payload.shadowSoftness)
    };
  }

  function applyDropShadowLook(layer, settings) {
    var shadow = addOrGetEffectFlexible(layer, "ADBE Drop Shadow", "Drop Shadow");
    setEffectValue(shadow, [2, "Opacity"], Math.max(0, Math.min(100, settings.opacity)));
    setEffectValue(shadow, [3, "Direction"], settings.angle);
    setEffectValue(shadow, [4, "Distance"], Math.max(0, settings.distance));
    setEffectValue(shadow, [5, "Softness"], Math.max(0, settings.softness));
    setEffectValue(shadow, [6, "Shadow Only"], 0);
  }

  function applyBevelLiteLook(layer, settings) {
    var bevel = addOrGetEffectFlexible(layer, "ADBE Bevel Alpha", "Bevel Alpha");
    setEffectValue(bevel, [1, "Edge Thickness"], Math.max(0, settings.thickness));
    setEffectValue(bevel, [2, "Light Angle"], settings.lightAngle);
    setEffectValue(bevel, [3, "Light Intensity"], Math.max(0, settings.lightIntensity));
  }

  function applyGlowLook(layer, settings) {
    var glow = addOrGetEffectFlexible(layer, "ADBE Glow", "Glow");
    setEffectValue(glow, [2, "Glow Threshold"], 60);
    setEffectValue(glow, [3, "Glow Radius"], Math.max(0, settings.glowRadius));
    setEffectValue(glow, [4, "Glow Intensity"], Math.max(0, settings.glowIntensity));
  }

  function applyLiquidGlassLook(layer, settings) {
    var blur = addOrGetEffect(layer, "ADBE Gaussian Blur 2");
    setEffectValue(blur, [1], Math.max(0, settings.blurAmt));
    setEffectValue(blur, [2], 1);

    applyBevelLiteLook(layer, {
      thickness: settings.bevelThickness,
      lightAngle: 125,
      lightIntensity: 0.85
    });

    applyDropShadowLook(layer, {
      opacity: settings.shadowOpacity,
      distance: settings.shadowDistance,
      softness: settings.shadowSoftness,
      angle: 120
    });

    applyGlowLook(layer, {
      glowRadius: settings.glowRadius,
      glowIntensity: settings.glowIntensity
    });
  }

  function applyLayerBlurFadeIn(layer, comp, settings) {
    var opacityProp = getTransformProp(layer, "Opacity");
    if (!opacityProp) {
      throw new Error("Could not find Opacity property.");
    }

    var blur = addOrGetEffect(layer, "ADBE Gaussian Blur 2");
    var t0 = settings.startSec;
    var t1 = t0 + settings.duration;

    opacityProp.setValueAtTime(t0, 0);
    opacityProp.setValueAtTime(t1, 100);
    setLayerEase(opacityProp);

    blur.property(1).setValueAtTime(t0, settings.blurAmt);
    blur.property(1).setValueAtTime(t1, 0);
    try {
      blur.property(2).setValue(1);
    } catch (dimensionsError) {}
    setLayerEase(blur.property(1));

    layer.motionBlur = true;
    comp.motionBlur = true;
  }

  function applyLayerScalePop(layer, comp, settings) {
    var scaleProp = getTransformProp(layer, "Scale");
    var opacityProp = getTransformProp(layer, "Opacity");
    if (!scaleProp || !opacityProp) {
      throw new Error("Selected layer is missing Scale or Opacity.");
    }

    var originalScale = scaleProp.value;
    var x = originalScale[0];
    var y = originalScale[1];
    var z = originalScale.length > 2 ? originalScale[2] : null;
    var tallScale = z === null ? [x, y * 5] : [x, y * 5, z];
    var wideScale = z === null ? [x * 1.5, y * 0.5] : [x * 1.5, y * 0.5, z];
    var frame = comp.frameDuration;
    var opacityT0 = settings.startSec;
    var t0 = opacityT0 + frame;
    var t1 = t0 + frame;
    var t2 = t1 + frame;

    opacityProp.setValueAtTime(opacityT0, 0);
    opacityProp.setValueAtTime(t0, 100);
    scaleProp.setValueAtTime(t0, tallScale);
    scaleProp.setValueAtTime(t1, wideScale);
    scaleProp.setValueAtTime(t2, originalScale);

    for (var scaleKey = Math.max(1, scaleProp.numKeys - 2); scaleKey <= scaleProp.numKeys; scaleKey += 1) {
      try { scaleProp.setInterpolationTypeAtKey(scaleKey, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (scaleInterpolationError) {}
    }
    for (var opacityKey = Math.max(1, opacityProp.numKeys - 1); opacityKey <= opacityProp.numKeys; opacityKey += 1) {
      try { opacityProp.setInterpolationTypeAtKey(opacityKey, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD); } catch (opacityInterpolationError) {}
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
  }

  function centerAnchorPoint(layer) {
    if (!layer.sourceRectAtTime) {
      throw new Error("Layer does not support sourceRectAtTime.");
    }

    var rect = layer.sourceRectAtTime(layer.containingComp.time, false);
    var anchor = getTransformProp(layer, "Anchor Point");
    var position = getTransformProp(layer, "Position");
    var currentAnchor = anchor.value;
    var newAnchor = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    var delta = [newAnchor[0] - currentAnchor[0], newAnchor[1] - currentAnchor[1]];
    var currentPosition = position.value;

    anchor.setValue(newAnchor);
    position.setValue([currentPosition[0] + delta[0], currentPosition[1] + delta[1]]);
  }

  function createControlNull(comp) {
    var nullLayer = comp.layers.addNull();
    nullLayer.name = "rdz_CTRL";
    nullLayer.label = 10;
    nullLayer.selected = true;
  }

  function enableMotionBlur(comp, layers) {
    for (var i = 0; i < layers.length; i += 1) {
      layers[i].motionBlur = true;
    }
    comp.motionBlur = true;
  }

  function normalizeBouceSettings(payload) {
    var amount = isNaN(payload.amount) ? 10 : Number(payload.amount);
    var duration = isNaN(payload.duration) ? 1 : Number(payload.duration);
    var chaos = isNaN(payload.chaos) ? 0 : Number(payload.chaos);
    var target = payload.target || "Position";

    return {
      target: target,
      amount: Math.max(0, Math.min(100, amount)),
      duration: Math.max(0.05, Math.min(2.0, duration)),
      chaos: Math.max(0, Math.min(100, chaos))
    };
  }

  function buildBouceExpression(settings) {
    var amount = (settings.amount / 100).toFixed(4);
    var duration = settings.duration.toFixed(4);
    var chaos = (settings.chaos / 100).toFixed(4);

    return "// rdzTools Bouce\n" +
      "var amount = " + amount + ";\n" +
      "var duration = " + duration + ";\n" +
      "var chaos = " + chaos + ";\n" +
      "var n = 0;\n" +
      "if (numKeys > 0) {\n" +
      "  n = nearestKey(time).index;\n" +
      "  if (key(n).time > time) n--;\n" +
      "}\n" +
      "if (n > 1) {\n" +
      "  var t = time - key(n).time;\n" +
      "  if (t < duration) {\n" +
      "    seedRandom(index * 1000 + n, true);\n" +
      "    var freq = 2.8 + random(-1.2, 1.2) * chaos;\n" +
      "    var decay = 5.0 / Math.max(duration, 0.001);\n" +
      "    var v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);\n" +
      "    var bounce = v * amount * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
      "    value + bounce;\n" +
      "  } else {\n" +
      "    value;\n" +
      "  }\n" +
      "} else {\n" +
      "  value;\n" +
      "}\n";
  }

  function applyBouce(comp, settings) {
    var selectedLayers = getSelectedLayers(comp);
    if (!selectedLayers.length) {
      return "Error: Select at least one layer with keyframes.";
    }

    var applied = 0;
    var skipped = 0;
    var expression = buildBouceExpression(settings);

    for (var i = 0; i < selectedLayers.length; i += 1) {
      var layer = selectedLayers[i];
      var prop = getTransformProp(layer, settings.target);
      if (!prop || prop.numKeys < 2) {
        skipped += 1;
        continue;
      }

      try {
        prop.expression = expression;
        prop.expressionEnabled = true;
        applied += 1;
      } catch (expressionError) {
        skipped += 1;
      }
    }

    if (applied === 0) {
      return "Error: No selected layers had 2+ " + settings.target + " keyframes.";
    }

    var message = "OK: Bouce applied to " + applied + " layer" + (applied === 1 ? "" : "s") + " on " + settings.target + ".";
    if (skipped > 0) {
      message += " Skipped " + skipped + ".";
    }
    return message;
  }

  function applyToSelectedLayers(comp, fn) {
    var layers = requireSelectedLayers(comp);
    for (var i = 0; i < layers.length; i += 1) {
      fn(layers[i]);
    }
    return layers;
  }

  function applyTool(toolId, rawPayload) {
    var comp = getActiveComp();
    if (!comp) {
      return "Error: No active comp.";
    }

    var payload = parsePayload(rawPayload);
    app.beginUndoGroup("rdzTools " + toolId);

    try {
      if (toolId === "wordBlurRight" || toolId === "wordBlurLeft" || toolId === "wordBlurUp" || toolId === "wordBlurDown" || toolId === "wordRotateIn") {
        var textLayer = getTextLayer(comp);
        if (!textLayer) {
          throw new Error("No text layer found in comp.");
        }

        var wordSettings = normalizeWordSettings(comp, payload);
        var options = {};

        if (toolId === "wordBlurRight") { options = { offsetX: wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurLeft") { options = { offsetX: -wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurUp") { options = { offsetX: 0, offsetY: wordSettings.distance }; }
        if (toolId === "wordBlurDown") { options = { offsetX: 0, offsetY: -wordSettings.distance }; }
        if (toolId === "wordPopIn") {
          options = { offsetX: 0, offsetY: 0, scaleBounce: true };
          wordSettings.scaleStart = isNaN(payload.scaleStart) ? 25 : Number(payload.scaleStart);
          wordSettings.scaleOvershoot = isNaN(payload.scaleOvershoot) ? 138 : Number(payload.scaleOvershoot);
        }
        if (toolId === "wordRotateIn") {
          options = { offsetX: wordSettings.distance, offsetY: 0 };
          wordSettings.rotationStart = isNaN(payload.rotationStart) ? -18 : Number(payload.rotationStart);
        }

        applyWordAnimation(textLayer, comp, wordSettings, options);
        return "OK: Applied " + toolId + " to " + textLayer.name + ".";
      }

      if (toolId === "layerScalePop") {
        var glitchLayers = requireSelectedLayers(comp);
        var glitchSettings = normalizeLayerSettings(comp, payload);
        for (var g = 0; g < glitchLayers.length; g += 1) {
          applyLayerScalePop(glitchLayers[g], comp, glitchSettings);
        }
        return "OK: Applied layer glitch scale to " + glitchLayers.length + " layer(s).";
      }

      if (toolId === "layerFadeUp" || toolId === "layerSlideRight" || toolId === "layerSlideLeft" || toolId === "layerRotatePop") {
        var motionLayers = requireSelectedLayers(comp);
        var layerSettings = normalizeLayerSettings(comp, payload);

        for (var m = 0; m < motionLayers.length; m += 1) {
          if (toolId === "layerFadeUp") {
            applyLayerEntrance(motionLayers[m], comp, layerSettings, { offsetX: 0, offsetY: layerSettings.distance });
          } else if (toolId === "layerSlideRight") {
            applyLayerEntrance(motionLayers[m], comp, layerSettings, { offsetX: layerSettings.distance, offsetY: 0 });
          } else if (toolId === "layerSlideLeft") {
            applyLayerEntrance(motionLayers[m], comp, layerSettings, { offsetX: -layerSettings.distance, offsetY: 0 });
          } else if (toolId === "layerRotatePop") {
            applyLayerEntrance(motionLayers[m], comp, layerSettings, {
              offsetX: 0,
              offsetY: 0,
              scaleStart: layerSettings.scaleStart,
              rotationStart: layerSettings.rotationStart
            });
          }
        }
        return "OK: Applied " + toolId + " to " + motionLayers.length + " layer(s).";
      }

      if (toolId === "layerBlurFadeIn") {
        var blurLayers = requireSelectedLayers(comp);
        var blurSettings = normalizeLayerSettings(comp, payload);
        for (var b = 0; b < blurLayers.length; b += 1) {
          applyLayerBlurFadeIn(blurLayers[b], comp, blurSettings);
        }
        return "OK: Applied layer blur fade in to " + blurLayers.length + " layer(s).";
      }

      if (toolId === "lookSoftShadow" || toolId === "lookLongShadow" || toolId === "lookBevelLite" || toolId === "lookLiquidGlass") {
        var lookLayers = requireSelectedLayers(comp);
        var lookSettings = normalizeLookSettings(payload);

        for (var l = 0; l < lookLayers.length; l += 1) {
          if (toolId === "lookSoftShadow") {
            applyDropShadowLook(lookLayers[l], lookSettings);
          } else if (toolId === "lookLongShadow") {
            applyDropShadowLook(lookLayers[l], {
              opacity: lookSettings.opacity,
              distance: lookSettings.distance,
              softness: lookSettings.softness,
              angle: lookSettings.angle
            });
          } else if (toolId === "lookBevelLite") {
            applyBevelLiteLook(lookLayers[l], lookSettings);
          } else if (toolId === "lookLiquidGlass") {
            applyLiquidGlassLook(lookLayers[l], lookSettings);
          }
        }

        return "OK: Applied " + toolId + " to " + lookLayers.length + " layer(s).";
      }

      if (toolId === "bouce") {
        return applyBouce(comp, normalizeBouceSettings(payload));
      }

      if (toolId === "centerAnchor") {
        var anchorLayers = applyToSelectedLayers(comp, centerAnchorPoint);
        return "OK: Centered anchors on " + anchorLayers.length + " layer(s).";
      }

      if (toolId === "createControlNull") {
        createControlNull(comp);
        return "OK: Created control null.";
      }

      if (toolId === "enableMotionBlur") {
        var motionBlurLayers = requireSelectedLayers(comp);
        enableMotionBlur(comp, motionBlurLayers);
        return "OK: Enabled motion blur on " + motionBlurLayers.length + " layer(s).";
      }

      throw new Error("Unknown tool: " + toolId);
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
    return 'Active comp "' + comp.name + '".';
  }

  function ping() {
    return "pong";
  }

  return {
    applyTool: applyTool,
    getSelectionSummary: getSelectionSummary,
    ping: ping
  };
}());
