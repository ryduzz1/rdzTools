var rdzTools = (function () {
  var PHYSICS_MARKER_PREFIX = "rdzTools Physics ";
  var SPLIT_CHAR_PREFIX = "rdzTools Split Character ";

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

  function stringifyPayload(value) {
    try {
      if (typeof JSON !== "undefined" && JSON.stringify) {
        return JSON.stringify(value);
      }
    } catch (jsonError) {}
    return String(value);
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

  function setSnappyEase(prop) {
    if (!prop || prop.numKeys < 2) {
      return;
    }

    for (var keyIndex = 1; keyIndex <= prop.numKeys; keyIndex += 1) {
      try {
        prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      } catch (interpolationError) {}
    }

    try {
      prop.setTemporalEaseAtKey(1, [new KeyframeEase(0, 28)], [new KeyframeEase(0, 92)]);
      prop.setTemporalEaseAtKey(2, [new KeyframeEase(0, 88)], [new KeyframeEase(0, 42)]);
    } catch (easeError) {}
  }

  function setFourKeyBounceEase(prop) {
    if (!prop || prop.numKeys < 4) {
      return;
    }

    for (var keyIndex = 1; keyIndex <= prop.numKeys; keyIndex += 1) {
      try {
        prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      } catch (interpolationError) {}
    }

    try {
      prop.setTemporalEaseAtKey(1, [new KeyframeEase(0, 26)], [new KeyframeEase(0, 92)]);
      prop.setTemporalEaseAtKey(2, [new KeyframeEase(0, 90)], [new KeyframeEase(0, 48)]);
      prop.setTemporalEaseAtKey(3, [new KeyframeEase(0, 52)], [new KeyframeEase(0, 82)]);
      prop.setTemporalEaseAtKey(4, [new KeyframeEase(0, 86)], [new KeyframeEase(0, 34)]);
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

  function getKeyIndexAtTime(prop, time) {
    if (!prop || !prop.numKeys) {
      return 0;
    }

    for (var keyIndex = 1; keyIndex <= prop.numKeys; keyIndex += 1) {
      try {
        if (Math.abs(prop.keyTime(keyIndex) - time) < 0.0001) {
          return keyIndex;
        }
      } catch (keyError) {}
    }

    return 0;
  }

  function setLinearKeyAtTime(prop, time) {
    var keyIndex = getKeyIndexAtTime(prop, time);
    if (!keyIndex) {
      return;
    }

    try {
      prop.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    } catch (interpolationError) {}
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

  function setSelectorToCharacter(rangeSelector, charIndex, totalChars) {
    var start = rangeSelector.property(1);
    var end = rangeSelector.property(2);
    var offset = rangeSelector.property(3);
    var advanced = rangeSelector.property(7);
    var sliceStart = (charIndex / totalChars) * 100;
    var sliceEnd = ((charIndex + 1) / totalChars) * 100;

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
      try { advanced.property(2).setValue(1); } catch (basedOnError) {}
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

  function configureTextAnimatorCharacterGrouping(layer) {
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

  function applyCharacterBounceAnimation(layer, comp, settings) {
    removeOldTextAnimators(layer);
    configureTextAnimatorCharacterGrouping(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var totalChars = Math.max(1, srcText.length);

    for (var i = 0; i < totalChars; i += 1) {
      var animator = animators.addProperty("ADBE Text Animator");
      animator.name = "TA_Char_" + (i + 1);

      var animProps = animator.property("ADBE Text Animator Properties");
      var scaleProp = addAnimatorProperty(animProps, "ADBE Text Scale 3D", "Scale");
      var opacityProp = addAnimatorProperty(animProps, "ADBE Text Opacity", "Opacity");

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Char " + (i + 1);
      setSelectorToCharacter(rangeSelector, i, totalChars);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + (settings.wordDur * 0.38);
      var t2 = t0 + (settings.wordDur * 0.68);
      var t3 = t0 + settings.wordDur;

      if (opacityProp) {
        key2(opacityProp, t0, 0, t3, 100, setWordEase);
      }

      if (scaleProp) {
        while (scaleProp.numKeys > 0) {
          try {
            scaleProp.removeKey(1);
          } catch (removeScaleError) {
            break;
          }
        }

        try {
          scaleProp.setValueAtTime(t0, [settings.scaleStart, settings.scaleStart, 100]);
          scaleProp.setValueAtTime(t1, [settings.scaleOvershoot, settings.scaleOvershoot, 100]);
          scaleProp.setValueAtTime(t2, [93, 93, 100]);
          scaleProp.setValueAtTime(t3, [100, 100, 100]);
        } catch (scale3dError) {
          scaleProp.setValueAtTime(t0, [settings.scaleStart, settings.scaleStart]);
          scaleProp.setValueAtTime(t1, [settings.scaleOvershoot, settings.scaleOvershoot]);
          scaleProp.setValueAtTime(t2, [93, 93]);
          scaleProp.setValueAtTime(t3, [100, 100]);
        }

        setFourKeyBounceEase(scaleProp);
      }
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
  }

  function applyWordRotateBounceAnimation(layer, comp, settings) {
    removeOldTextAnimators(layer);
    configureTextAnimatorWordGrouping(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var words = srcText.match(/\S+/g);
    var numWords = words ? words.length : 1;
    var offsetX = settings.distance;

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
      var scaleProp = addAnimatorProperty(animProps, "ADBE Text Scale 3D", "Scale");
      var rotationProp = addAnimatorProperty(animProps, "ADBE Text Rotation", "Rotation");

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Word " + (i + 1);
      setSelectorToWord(rangeSelector, i, numWords);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + (settings.wordDur * 0.42);
      var t2 = t0 + (settings.wordDur * 0.76);
      var t3 = t0 + settings.wordDur;

      if (posProp) {
        try {
          posProp.setValueAtTime(t0, [offsetX, 0, 0]);
          posProp.setValueAtTime(t1, [-6, 0, 0]);
          posProp.setValueAtTime(t3, [0, 0, 0]);
        } catch (position3dError) {
          posProp.setValueAtTime(t0, [offsetX, 0]);
          posProp.setValueAtTime(t1, [-6, 0]);
          posProp.setValueAtTime(t3, [0, 0]);
        }
        try {
          posProp.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          posProp.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          posProp.setInterpolationTypeAtKey(3, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          posProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 24)], [new KeyframeEase(0, 86)]);
          posProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 82)], [new KeyframeEase(0, 48)]);
          posProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 90)], [new KeyframeEase(0, 30)]);
        } catch (positionEaseError) {}
      }

      if (opacityProp) {
        key2(opacityProp, t0, 0, t3, 100, setSnappyEase);
      }

      if (settings.blurEnabled && blurProp) {
        try {
          blurProp.setValueAtTime(t0, [settings.blurAmt, settings.blurAmt]);
          blurProp.setValueAtTime(t1, [2, 2]);
          blurProp.setValueAtTime(t3, [0, 0]);
        } catch (blur2dError) {
          try {
            blurProp.setValueAtTime(t0, settings.blurAmt);
            blurProp.setValueAtTime(t1, 2);
            blurProp.setValueAtTime(t3, 0);
          } catch (blur1dError) {}
        }
        try {
          blurProp.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          blurProp.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          blurProp.setInterpolationTypeAtKey(3, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
          blurProp.setTemporalEaseAtKey(1, [new KeyframeEase(0, 20)], [new KeyframeEase(0, 90)]);
          blurProp.setTemporalEaseAtKey(2, [new KeyframeEase(0, 88)], [new KeyframeEase(0, 34)]);
          blurProp.setTemporalEaseAtKey(3, [new KeyframeEase(0, 92)], [new KeyframeEase(0, 26)]);
        } catch (blurEaseError) {}
      }

      if (scaleProp) {
        try {
          scaleProp.setValueAtTime(t0, [86, 86, 100]);
          scaleProp.setValueAtTime(t1, [108, 108, 100]);
          scaleProp.setValueAtTime(t2, [97, 97, 100]);
          scaleProp.setValueAtTime(t3, [100, 100, 100]);
        } catch (scale3dError) {
          scaleProp.setValueAtTime(t0, [86, 86]);
          scaleProp.setValueAtTime(t1, [108, 108]);
          scaleProp.setValueAtTime(t2, [97, 97]);
          scaleProp.setValueAtTime(t3, [100, 100]);
        }
        setFourKeyBounceEase(scaleProp);
      }

      if (rotationProp) {
        rotationProp.setValueAtTime(t0, settings.rotationStart);
        rotationProp.setValueAtTime(t1, 7);
        rotationProp.setValueAtTime(t2, -2);
        rotationProp.setValueAtTime(t3, 0);
        setFourKeyBounceEase(rotationProp);
      }
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
  }

  function applyWordOutAnimation(layer, comp, settings, options) {
    removeOldTextAnimators(layer);
    configureTextAnimatorWordGrouping(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var words = srcText.match(/\S+/g);
    var numWords = words ? words.length : 1;
    var endX = options.offsetX || 0;
    var endY = options.offsetY || 0;

    for (var i = 0; i < numWords; i += 1) {
      var animator = animators.addProperty("ADBE Text Animator");
      animator.name = "TA_Word_Out_" + (i + 1);

      var animProps = animator.property("ADBE Text Animator Properties");
      var posProp = addAnimatorProperty(animProps, "ADBE Text Position 3D", "Position");
      if (!posProp) {
        posProp = addAnimatorProperty(animProps, "ADBE Text Position", "Position");
      }
      var opacityProp = addAnimatorProperty(animProps, "ADBE Text Opacity", "Opacity");
      var blurProp = settings.blurEnabled ? addAnimatorProperty(animProps, "ADBE Text Blur", "Blur") : null;
      var scaleProp = options.scaleEnd !== null && options.scaleEnd !== undefined ? addAnimatorProperty(animProps, "ADBE Text Scale 3D", "Scale") : null;
      var rotationProp = options.rotationEnd ? addAnimatorProperty(animProps, "ADBE Text Rotation", "Rotation") : null;

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Word " + (i + 1);
      setSelectorToWord(rangeSelector, i, numWords);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + settings.wordDur;

      if (posProp && (endX !== 0 || endY !== 0)) {
        try {
          key2(posProp, t0, [0, 0, 0], t1, [endX, endY, 0], setSnappyEase);
        } catch (position3dError) {
          key2(posProp, t0, [0, 0], t1, [endX, endY], setSnappyEase);
        }
      }
      if (opacityProp) {
        key2(opacityProp, t0, 100, t1, 0, setSnappyEase);
      }
      if (settings.blurEnabled && blurProp) {
        try {
          key2(blurProp, t0, [0, 0], t1, [settings.blurAmt, settings.blurAmt], setSnappyEase);
        } catch (blur2dError) {
          try { key2(blurProp, t0, 0, t1, settings.blurAmt, setSnappyEase); } catch (blur1dError) {}
        }
      }
      if (scaleProp) {
        try {
          key2(scaleProp, t0, [100, 100, 100], t1, [options.scaleEnd, options.scaleEnd, 100], setSnappyEase);
        } catch (scale3dError) {
          key2(scaleProp, t0, [100, 100], t1, [options.scaleEnd, options.scaleEnd], setSnappyEase);
        }
      }
      if (rotationProp) {
        key2(rotationProp, t0, 0, t1, options.rotationEnd, setSnappyEase);
      }
    }

    layer.motionBlur = true;
    comp.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
  }

  function applyCharacterOutAnimation(layer, comp, settings, options) {
    removeOldTextAnimators(layer);
    configureTextAnimatorCharacterGrouping(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var totalChars = Math.max(1, srcText.length);

    for (var i = 0; i < totalChars; i += 1) {
      var animator = animators.addProperty("ADBE Text Animator");
      animator.name = "TA_Char_Out_" + (i + 1);

      var animProps = animator.property("ADBE Text Animator Properties");
      var opacityProp = addAnimatorProperty(animProps, "ADBE Text Opacity", "Opacity");
      var scaleProp = options.scaleEnd !== null && options.scaleEnd !== undefined ? addAnimatorProperty(animProps, "ADBE Text Scale 3D", "Scale") : null;
      var posProp = options.scatter ? addAnimatorProperty(animProps, "ADBE Text Position 3D", "Position") : null;
      if (options.scatter && !posProp) {
        posProp = addAnimatorProperty(animProps, "ADBE Text Position", "Position");
      }
      var rotationProp = options.rotationEnd ? addAnimatorProperty(animProps, "ADBE Text Rotation", "Rotation") : null;
      var blurProp = settings.blurEnabled ? addAnimatorProperty(animProps, "ADBE Text Blur", "Blur") : null;

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Char " + (i + 1);
      setSelectorToCharacter(rangeSelector, i, totalChars);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + settings.wordDur;
      var direction = i % 2 === 0 ? 1 : -1;
      var vertical = i % 3 === 0 ? -0.65 : 0.65;
      var endX = direction * settings.distance;
      var endY = vertical * settings.distance;
      var endRotation = direction * (options.rotationEnd || 0);

      if (opacityProp) {
        key2(opacityProp, t0, 100, t1, 0, setSnappyEase);
      }
      if (scaleProp) {
        try {
          key2(scaleProp, t0, [100, 100, 100], t1, [options.scaleEnd, options.scaleEnd, 100], setSnappyEase);
        } catch (scale3dError) {
          key2(scaleProp, t0, [100, 100], t1, [options.scaleEnd, options.scaleEnd], setSnappyEase);
        }
      }
      if (posProp) {
        try {
          key2(posProp, t0, [0, 0, 0], t1, [endX, endY, 0], setSnappyEase);
        } catch (position3dError) {
          key2(posProp, t0, [0, 0], t1, [endX, endY], setSnappyEase);
        }
      }
      if (rotationProp) {
        key2(rotationProp, t0, 0, t1, endRotation, setSnappyEase);
      }
      if (settings.blurEnabled && blurProp) {
        try {
          key2(blurProp, t0, [0, 0], t1, [settings.blurAmt, settings.blurAmt], setSnappyEase);
        } catch (blur2dError) {
          try { key2(blurProp, t0, 0, t1, settings.blurAmt, setSnappyEase); } catch (blur1dError) {}
        }
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

  function getEaseDimensions(prop, keyIndex) {
    try {
      var outEase = prop.keyOutTemporalEase(keyIndex);
      if (outEase && outEase.length) {
        return outEase.length;
      }
    } catch (outEaseError) {}

    try {
      var inEase = prop.keyInTemporalEase(keyIndex);
      if (inEase && inEase.length) {
        return inEase.length;
      }
    } catch (inEaseError) {}

    try {
      var value = prop.value;
      if (value instanceof Array) {
        return Math.max(1, value.length);
      }
    } catch (valueError) {}
    return 1;
  }

  function makeEaseArray(dimensions, influence, speeds) {
    var eases = [];
    for (var i = 0; i < dimensions; i += 1) {
      var speed = speeds && speeds.length ? speeds[Math.min(i, speeds.length - 1)] : 0;
      eases.push(new KeyframeEase(speed, influence));
    }
    return eases;
  }

  function valueToArray(value, dimensions) {
    var values = [];
    if (value instanceof Array) {
      for (var i = 0; i < dimensions; i += 1) {
        values.push(Number(value[Math.min(i, value.length - 1)]));
      }
      return values;
    }

    for (var index = 0; index < dimensions; index += 1) {
      values.push(Number(value));
    }
    return values;
  }

  function getPairSpeeds(prop, firstKey, secondKey, dimensions, coords) {
    var duration = Math.max(0.001, prop.keyTime(secondKey) - prop.keyTime(firstKey));
    var firstValue = valueToArray(prop.keyValue(firstKey), dimensions);
    var secondValue = valueToArray(prop.keyValue(secondKey), dimensions);
    var outSpeeds = [];
    var inSpeeds = [];
    var outTime = Math.max(0.001, coords[0]);
    var inTime = Math.max(0.001, 1 - coords[2]);
    var outMultiplier = Math.max(0.001, coords[1] / outTime);
    var inMultiplier = Math.max(0.001, (1 - coords[3]) / inTime);

    if (dimensions === 1) {
      var firstRaw = prop.keyValue(firstKey);
      var secondRaw = prop.keyValue(secondKey);
      var magnitude = 0;

      if (firstRaw instanceof Array && secondRaw instanceof Array) {
        for (var m = 0; m < Math.min(firstRaw.length, secondRaw.length); m += 1) {
          var axisDelta = Number(secondRaw[m]) - Number(firstRaw[m]);
          magnitude += axisDelta * axisDelta;
        }
        magnitude = Math.sqrt(magnitude);
      } else {
        magnitude = Number(secondRaw) - Number(firstRaw);
      }

      var speed = magnitude / duration;
      return {
        inSpeeds: [speed * inMultiplier],
        outSpeeds: [speed * outMultiplier]
      };
    }

    for (var i = 0; i < dimensions; i += 1) {
      var delta = secondValue[i] - firstValue[i];
      var baseSpeed = Math.abs(delta / duration);
      outSpeeds.push(baseSpeed * outMultiplier);
      inSpeeds.push(baseSpeed * inMultiplier);
    }

    return {
      inSpeeds: inSpeeds,
      outSpeeds: outSpeeds
    };
  }

  function getGraphTargetKeys(prop) {
    var keys = [];
    try {
      if (prop.selectedKeys && prop.selectedKeys.length > 0) {
        for (var s = 0; s < prop.selectedKeys.length; s += 1) {
          keys.push(prop.selectedKeys[s]);
        }
      }
    } catch (selectedError) {}

    keys.sort(function (a, b) { return a - b; });
    return keys;
  }

  function normalizeGraphCoords(payload) {
    var source = payload.coords && payload.coords.length === 4 ? payload.coords : [0, 0, 1, 1];
    var coords = [];
    for (var i = 0; i < 4; i += 1) {
      var value = Number(source[i]);
      if (isNaN(value)) {
        value = i < 2 ? 0 : 1;
      }
      coords.push(Math.max(0, Math.min(1, value)));
    }
    return coords;
  }

  function isLinearGraph(coords) {
    return Math.abs(coords[0]) < 0.001 &&
      Math.abs(coords[1]) < 0.001 &&
      Math.abs(coords[2] - 1) < 0.001 &&
      Math.abs(coords[3] - 1) < 0.001;
  }

  function clampUnit(value) {
    if (isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(1, value));
  }

  function applyGraphEaseToProperty(prop, coords) {
    if (!prop || !prop.numKeys || prop.numKeys < 2) {
      return 0;
    }

    var keys = getGraphTargetKeys(prop);
    if (keys.length < 2) {
      return 0;
    }

    var appliedPairs = 0;
    var outInfluence = Math.max(0.1, Math.min(99.9, coords[0] * 100));
    var inInfluence = Math.max(0.1, Math.min(99.9, (1 - coords[2]) * 100));
    var linear = isLinearGraph(coords);

    for (var index = 0; index < keys.length - 1; index += 1) {
      var firstKey = keys[index];
      var secondKey = keys[index + 1];

      try {
        if (linear) {
          prop.setInterpolationTypeAtKey(firstKey, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
          prop.setInterpolationTypeAtKey(secondKey, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
          appliedPairs += 1;
          continue;
        }
        prop.setInterpolationTypeAtKey(firstKey, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
        prop.setInterpolationTypeAtKey(secondKey, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      } catch (interpolationError) {}

      try {
        var dimensions = Math.max(getEaseDimensions(prop, firstKey), getEaseDimensions(prop, secondKey));
        var speeds = getPairSpeeds(prop, firstKey, secondKey, dimensions, coords);
        prop.setTemporalEaseAtKey(
          firstKey,
          makeEaseArray(dimensions, 33, speeds.outSpeeds),
          makeEaseArray(dimensions, outInfluence, speeds.outSpeeds)
        );
        prop.setTemporalEaseAtKey(
          secondKey,
          makeEaseArray(dimensions, inInfluence, speeds.inSpeeds),
          makeEaseArray(dimensions, 33, speeds.inSpeeds)
        );
        appliedPairs += 1;
      } catch (easeError) {}
    }

    return appliedPairs;
  }

  function graphCoordsFromProperty(prop, firstKey, secondKey) {
    try {
      var outEase = prop.keyOutTemporalEase(firstKey);
      var inEase = prop.keyInTemporalEase(secondKey);
      var outInfluence = outEase && outEase.length ? outEase[0].influence : 0;
      var inInfluence = inEase && inEase.length ? inEase[0].influence : 0;
      var firstOutType = prop.keyOutInterpolationType(firstKey);
      var secondInType = prop.keyInInterpolationType(secondKey);

      if (firstOutType === KeyframeInterpolationType.LINEAR && secondInType === KeyframeInterpolationType.LINEAR) {
        return [0, 0, 1, 1];
      }

      var dimensions = Math.max(getEaseDimensions(prop, firstKey), getEaseDimensions(prop, secondKey));
      var duration = Math.max(0.001, prop.keyTime(secondKey) - prop.keyTime(firstKey));
      var firstValue = valueToArray(prop.keyValue(firstKey), dimensions);
      var secondValue = valueToArray(prop.keyValue(secondKey), dimensions);
      var outSpeedRatioTotal = 0;
      var inSpeedRatioTotal = 0;
      var outSpeedRatioCount = 0;
      var inSpeedRatioCount = 0;

      if (dimensions === 1) {
        var firstRaw = prop.keyValue(firstKey);
        var secondRaw = prop.keyValue(secondKey);
        var magnitude = 0;

        if (firstRaw instanceof Array && secondRaw instanceof Array) {
          for (var m = 0; m < Math.min(firstRaw.length, secondRaw.length); m += 1) {
            var axisDelta = Number(secondRaw[m]) - Number(firstRaw[m]);
            magnitude += axisDelta * axisDelta;
          }
          magnitude = Math.sqrt(magnitude);
        } else {
          magnitude = Math.abs(Number(secondRaw) - Number(firstRaw));
        }

        var scalarBaseSpeed = Math.abs(magnitude / duration);
        if (scalarBaseSpeed >= 0.001) {
          if (outEase && outEase.length) {
            var scalarOutRatio = Math.abs(Number(outEase[0].speed)) / scalarBaseSpeed;
            if (!isNaN(scalarOutRatio)) {
              outSpeedRatioTotal = scalarOutRatio;
              outSpeedRatioCount = 1;
            }
          }
          if (inEase && inEase.length) {
            var scalarInRatio = Math.abs(Number(inEase[0].speed)) / scalarBaseSpeed;
            if (!isNaN(scalarInRatio)) {
              inSpeedRatioTotal = scalarInRatio;
              inSpeedRatioCount = 1;
            }
          }
        }
      } else {
        for (var i = 0; i < dimensions; i += 1) {
          var delta = Number(secondValue[i]) - Number(firstValue[i]);
          var baseSpeed = Math.abs(delta / duration);

          if (baseSpeed < 0.001) {
            continue;
          }

          if (outEase && outEase.length) {
            var outRatio = Math.abs(Number(outEase[Math.min(i, outEase.length - 1)].speed)) / baseSpeed;
            if (!isNaN(outRatio)) {
              outSpeedRatioTotal += outRatio;
              outSpeedRatioCount += 1;
            }
          }

          if (inEase && inEase.length) {
            var inRatio = Math.abs(Number(inEase[Math.min(i, inEase.length - 1)].speed)) / baseSpeed;
            if (!isNaN(inRatio)) {
              inSpeedRatioTotal += inRatio;
              inSpeedRatioCount += 1;
            }
          }
        }
      }

      var outX = clampUnit(outInfluence / 100);
      var inX = clampUnit(1 - (inInfluence / 100));
      var outSpeedRatio = outSpeedRatioCount > 0 ? outSpeedRatioTotal / outSpeedRatioCount : 0;
      var inSpeedRatio = inSpeedRatioCount > 0 ? inSpeedRatioTotal / inSpeedRatioCount : 0;

      return [
        outX,
        clampUnit(outSpeedRatio * Math.max(0.001, outX)),
        inX,
        clampUnit(1 - (inSpeedRatio * Math.max(0.001, 1 - inX)))
      ];
    } catch (error) {
      return null;
    }
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

  function applyLayerBounceUp(layer, comp, settings) {
    var positionProp = getTransformProp(layer, "Position");
    var opacityProp = getTransformProp(layer, "Opacity");
    if (!positionProp) {
      throw new Error("Selected layer is missing Position.");
    }

    var t0 = settings.startSec;
    var t1 = t0 + Math.max(comp.frameDuration * 5, 0.001);
    var currentPosition = positionProp.value;
    var startPosition = [currentPosition[0], currentPosition[1] + settings.distance];
    if (currentPosition.length > 2) {
      startPosition.push(currentPosition[2]);
    }

    positionProp.setValueAtTime(t0, startPosition);
    positionProp.setValueAtTime(t1, currentPosition);
    setLinearKeyAtTime(positionProp, t0);
    setLinearKeyAtTime(positionProp, t1);

    if (opacityProp) {
      opacityProp.setValueAtTime(t0, 0);
      opacityProp.setValueAtTime(t1, 100);
      setLinearKeyAtTime(opacityProp, t0);
      setLinearKeyAtTime(opacityProp, t1);
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

  function removeEffectsByMatchName(layer, matchName) {
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) {
      return 0;
    }

    var removed = 0;
    for (var i = effects.numProperties; i >= 1; i -= 1) {
      var effect = effects.property(i);
      if (effect && effect.matchName === matchName) {
        effect.remove();
        removed += 1;
      }
    }
    return removed;
  }

  function removeEffectsByMatchNameOrName(layer, matchName, effectName) {
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) {
      return 0;
    }

    var removed = 0;
    for (var i = effects.numProperties; i >= 1; i -= 1) {
      var effect = effects.property(i);
      if (effect && (effect.matchName === matchName || effect.name === effectName)) {
        effect.remove();
        removed += 1;
      }
    }
    return removed;
  }

  function sanitizeLayerName(value) {
    return String(value || "Layer").replace(/[\\\/:\*\?\"\<\>\|]/g, "_");
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
      blurAmt: isNaN(payload.blurAmt) ? 25 : Number(payload.blurAmt),
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

  function setVectorStrokeValues(stroke, settings) {
    if (!stroke) {
      return;
    }

    setEffectValue(stroke, ["ADBE Vector Stroke Color", "Color", 2], [1, 1, 1, 1]);
    setEffectValue(stroke, ["ADBE Vector Stroke Opacity", "Opacity", 4], 65);
    setEffectValue(stroke, ["ADBE Vector Stroke Width", "Stroke Width", 5], Math.max(0.5, Math.min(4, settings.strokeWidth || 1.5)));
    setEffectValue(stroke, ["ADBE Vector Stroke Line Cap", "Line Cap", 7], 2);
    setEffectValue(stroke, ["ADBE Vector Stroke Line Join", "Line Join", 8], 2);
  }

  function removeVectorFills(contents) {
    if (!contents) {
      return 0;
    }

    var removed = 0;
    for (var i = contents.numProperties; i >= 1; i -= 1) {
      var item = contents.property(i);
      if (!item) {
        continue;
      }

      if (item.matchName === "ADBE Vector Graphic - Fill" || item.matchName === "ADBE Vector Graphic - G-Fill") {
        item.remove();
        removed += 1;
      } else if (item.matchName === "ADBE Vector Group") {
        removed += removeVectorFills(item.property("ADBE Vectors Group"));
      }
    }
    return removed;
  }

  function setVectorStrokesWhite(contents, settings) {
    if (!contents) {
      return 0;
    }

    var updated = 0;
    for (var i = 1; i <= contents.numProperties; i += 1) {
      var item = contents.property(i);
      if (!item) {
        continue;
      }

      if (item.matchName === "ADBE Vector Graphic - Stroke") {
        setVectorStrokeValues(item, settings);
        updated += 1;
      } else if (item.matchName === "ADBE Vector Group") {
        updated += setVectorStrokesWhite(item.property("ADBE Vectors Group"), settings);
      }
    }
    return updated;
  }

  function vectorContentsHasShape(contents) {
    if (!contents) {
      return false;
    }

    for (var i = 1; i <= contents.numProperties; i += 1) {
      var item = contents.property(i);
      if (item && item.matchName && item.matchName.indexOf("ADBE Vector Shape") === 0) {
        return true;
      }
    }
    return false;
  }

  function addOverlayStrokeToContents(contents, settings) {
    if (!contents) {
      return 0;
    }

    var added = 0;
    if (vectorContentsHasShape(contents)) {
      try {
        setVectorStrokeValues(contents.addProperty("ADBE Vector Graphic - Stroke"), settings);
        added += 1;
      } catch (strokeError) {}
    }

    for (var i = 1; i <= contents.numProperties; i += 1) {
      var item = contents.property(i);
      if (item && item.matchName === "ADBE Vector Group") {
        added += addOverlayStrokeToContents(item.property("ADBE Vectors Group"), settings);
      }
    }
    return added;
  }

  function addOverlayStroke(layer, settings) {
    var contents = layer.property("ADBE Root Vectors Group");
    if (!contents) {
      throw new Error("Liquid glass stroke requires a shape layer.");
    }

    removeVectorFills(contents);
    if (addOverlayStrokeToContents(contents, settings) === 0) {
      setVectorStrokeValues(contents.addProperty("ADBE Vector Graphic - Stroke"), settings);
    }
    setVectorStrokesWhite(contents, settings);
  }

  function createLiquidGlassControlNull(comp, name, layers) {
    var control = comp.layers.addNull();
    control.name = name + "_LG_CTRL";
    control.label = 10;

    var position = getTransformProp(layers[0], "Position");
    var controlPosition = getTransformProp(control, "Position");
    if (position && controlPosition) {
      try {
        controlPosition.setValue(position.value);
      } catch (positionError) {}
    }

    var inPoint = layers[0].inPoint;
    var outPoint = layers[0].outPoint;
    for (var i = 1; i < layers.length; i += 1) {
      inPoint = Math.min(inPoint, layers[i].inPoint);
      outPoint = Math.max(outPoint, layers[i].outPoint);
    }
    control.inPoint = inPoint;
    control.outPoint = outPoint;

    for (var l = 0; l < layers.length; l += 1) {
      try {
        layers[l].parent = control;
      } catch (parentError) {}
    }

    return control;
  }

  function applyLiquidGlassLook(layer, settings) {
    var comp = layer.containingComp;
    var sourceName = sanitizeLayerName(layer.name);
    var blurAmount = Math.max(1, settings.blurAmt || 25);

    layer.adjustmentLayer = true;
    layer.name = sourceName + "_LG_Blur";

    removeEffectsByMatchName(layer, "ADBE Gaussian Blur 2");
    removeEffectsByMatchName(layer, "ADBE Fast Box Blur");
    var blur = addOrGetEffectFlexible(layer, "ADBE Fast Box Blur", "Fast Box Blur");
    setEffectValue(blur, [1, "Blur Radius"], blurAmount);
    setEffectValue(blur, [2, "Iterations"], 2);
    setEffectValue(blur, [3, "Repeat Edge Pixels"], 1);

    var strokeLayer = layer.duplicate();
    strokeLayer.name = sourceName + "_LG_Stroke";
    strokeLayer.adjustmentLayer = false;
    removeEffectsByMatchNameOrName(strokeLayer, "ADBE Fast Box Blur", "Fast Box Blur");
    addOverlayStroke(strokeLayer, { strokeWidth: 1.5 });
    try {
      strokeLayer.blendingMode = BlendingMode.OVERLAY;
    } catch (blendError) {}

    var controlLayer = createLiquidGlassControlNull(comp, sourceName, [layer, strokeLayer]);
    layer.selected = true;
    strokeLayer.selected = true;
    controlLayer.selected = true;
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

  function moveAnchorPoint(layer, xFactor, yFactor) {
    if (!layer.sourceRectAtTime) {
      throw new Error("Layer does not support sourceRectAtTime.");
    }

    var rect = layer.sourceRectAtTime(layer.containingComp.time, false);
    var anchor = getTransformProp(layer, "Anchor Point");
    var position = getTransformProp(layer, "Position");
    var currentAnchor = anchor.value;
    var newAnchor = [rect.left + rect.width * xFactor, rect.top + rect.height * yFactor];
    if (currentAnchor.length > 2) {
      newAnchor.push(currentAnchor[2]);
    }
    var delta = [newAnchor[0] - currentAnchor[0], newAnchor[1] - currentAnchor[1]];
    var currentPosition = position.value;
    var nextPosition = [currentPosition[0] + delta[0], currentPosition[1] + delta[1]];

    anchor.setValue(newAnchor);
    if (currentPosition.length > 2) {
      nextPosition.push(currentPosition[2]);
    }
    position.setValue(nextPosition);
  }

  function centerAnchorPoint(layer) {
    moveAnchorPoint(layer, 0.5, 0.5);
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

  function centerLayerInComp(layer, comp) {
    var position = getTransformProp(layer, "Position");
    if (!position) {
      throw new Error("Layer is missing Position.");
    }
    var currentPosition = position.value;
    var nextPosition = [comp.width / 2, comp.height / 2];
    if (currentPosition.length > 2) {
      nextPosition.push(currentPosition[2]);
    }
    position.setValue(nextPosition);
  }

  function precomposeSelectedLayers(comp) {
    var selectedLayers = requireSelectedLayers(comp);
    var indices = [];
    for (var i = 0; i < selectedLayers.length; i += 1) {
      indices.push(selectedLayers[i].index);
    }
    indices.sort(function (a, b) { return a - b; });
    var name = "rdz_Precomp_" + Math.round(new Date().getTime() / 1000);
    comp.layers.precompose(indices, name, true);
    return selectedLayers.length;
  }

  function saveCurrentFrame(comp) {
    var folder = Folder.desktop || Folder.myDocuments;
    var defaultName = "rdzTools_" + comp.name.replace(/[\\\/:\*\?\"\<\>\|]/g, "_") + "_" + Math.round(comp.time * comp.frameRate) + ".png";
    var defaultFile = new File(folder.fsName + "/" + defaultName);
    var file = defaultFile.saveDlg("Save current frame as PNG", "PNG:*.png");
    if (!file) {
      return null;
    }
    if (!/\.png$/i.test(file.fsName)) {
      file = new File(file.fsName + ".png");
    }
    if (!comp.saveFrameToPng) {
      throw new Error("saveFrameToPng is not available in this After Effects version.");
    }
    comp.saveFrameToPng(comp.time, file);
    return file.fsName;
  }

  function fitLayerToComp(layer, comp) {
    var scale = getTransformProp(layer, "Scale");
    if (!scale || !layer.sourceRectAtTime) {
      throw new Error("Layer cannot be fit to comp.");
    }
    var rect = layer.sourceRectAtTime(comp.time, false);
    var width = rect.width || layer.width || 1;
    var height = rect.height || layer.height || 1;
    var fitScale = Math.min(comp.width / width, comp.height / height) * 100;
    var currentScale = scale.value;
    var nextScale = currentScale.length > 2 ? [fitScale, fitScale, currentScale[2]] : [fitScale, fitScale];
    scale.setValue(nextScale);
  }

  function freezeLayerAtCurrentFrame(layer, comp) {
    if (layer.canSetTimeRemapEnabled === false) {
      throw new Error("Layer cannot enable time remapping.");
    }
    layer.timeRemapEnabled = true;
    var timeRemap = layer.property("ADBE Time Remapping");
    if (!timeRemap) {
      throw new Error("Could not find Time Remap.");
    }
    var sourceTime = timeRemap.valueAtTime(comp.time, false);
    timeRemap.expression = sourceTime.toFixed(5);
    timeRemap.expressionEnabled = true;
  }

  function setTextDocumentText(sourceTextProp, textValue) {
    var documentValue = sourceTextProp.value;
    try {
      documentValue.text = textValue;
      sourceTextProp.setValue(documentValue);
    } catch (documentError) {
      try {
        sourceTextProp.setValue(textValue);
      } catch (fallbackError) {}
    }
  }

  function normalizeSplitText(value) {
    return String(value || "").replace(/ /g, "\u00A0");
  }

  function measureTextWidth(measureLayer, textValue, time) {
    if (!textValue || !textValue.length) {
      return 0;
    }

    var measureTextProps = measureLayer.property("ADBE Text Properties");
    var measureSourceText = measureTextProps.property("ADBE Text Document");
    setTextDocumentText(measureSourceText, normalizeSplitText(textValue));
    try {
      return measureLayer.sourceRectAtTime(time, false).width;
    } catch (rectError) {}
    return 0;
  }

  function measureTextRight(measureLayer, textValue, time) {
    if (!textValue || !textValue.length) {
      return 0;
    }

    var measureTextProps = measureLayer.property("ADBE Text Properties");
    var measureSourceText = measureTextProps.property("ADBE Text Document");
    setTextDocumentText(measureSourceText, normalizeSplitText(textValue));
    try {
      var rect = measureLayer.sourceRectAtTime(time, false);
      return rect.left + rect.width;
    } catch (rectError) {}
    return measureTextWidth(measureLayer, textValue, time);
  }

  function measureTextAdvance(measureLayer, textValue, time) {
    if (!textValue || !textValue.length) {
      return 0;
    }
    var sentinel = "|";
    var sentinelRight = measureTextRight(measureLayer, sentinel, time);
    var measured = measureTextRight(measureLayer, textValue + sentinel, time) - sentinelRight;
    if (measured > 0) {
      return measured;
    }
    return measureTextWidth(measureLayer, textValue, time);
  }

  function getTextPhysicsRect(layer, sourceRect, time) {
    if (!layer || layer.matchName !== "ADBE Text Layer") {
      return sourceRect;
    }

    var text = getLayerTextValue(layer);
    if (!text || text.length <= 1) {
      return sourceRect;
    }

    var measureLayer = null;
    try {
      measureLayer = layer.duplicate();
      var opacity = getTransformProp(measureLayer, "Opacity");
      if (opacity) {
        try {
          opacity.setValue(0);
        } catch (opacityError) {}
      }
      var measuredWidth = measureTextAdvance(measureLayer, text, time);
      if (measuredWidth > 0) {
        return {
          left: sourceRect.left,
          top: sourceRect.top,
          width: Math.min(sourceRect.width, measuredWidth),
          height: sourceRect.height
        };
      }
    } catch (measureError) {
    } finally {
      if (measureLayer) {
        try {
          measureLayer.remove();
        } catch (removeMeasureError) {}
      }
    }
    return sourceRect;
  }

  function setTransformValueAtCurrentState(prop, value, time) {
    if (!prop) {
      return;
    }
    try {
      if (prop.numKeys && prop.numKeys > 0) {
        prop.setValueAtTime(time, value);
        return;
      }
    } catch (keyedError) {}
    try {
      prop.setValue(value);
    } catch (setError) {}
  }

  function layerPointToCompPoint(localX, localY, position, anchor, scale, rotation) {
    var sx = Math.max(0.001, Math.abs(Number(scale[0]) || 100) / 100);
    var sy = Math.max(0.001, Math.abs(Number(scale[1]) || 100) / 100);
    var offset = rotatePoint((localX - anchor[0]) * sx, (localY - anchor[1]) * sy, rotation);
    return {
      x: Number(position[0]) + offset.x,
      y: Number(position[1]) + offset.y
    };
  }

  function setSplitCharacterData(layer, data) {
    try {
      layer.comment = SPLIT_CHAR_PREFIX + stringifyPayload(data);
    } catch (commentError) {}
  }

  function getSplitCharacterData(layer) {
    try {
      if (layer.comment && layer.comment.indexOf(SPLIT_CHAR_PREFIX) === 0) {
        return parsePayload(layer.comment.substring(SPLIT_CHAR_PREFIX.length));
      }
    } catch (commentError) {}

    var physicsData = getPhysicsMarkerData(layer);
    if (physicsData && physicsData.splitData) {
      return physicsData.splitData;
    }

    return null;
  }

  function getCharacterPhysicsPadding(size) {
    return Math.max(0.75, Math.min(3, size * 0.05));
  }

  function splitTextLayerCharacters(comp) {
    var layer = getTextLayer(comp);
    if (!layer) {
      throw new Error("Select a text layer.");
    }

    var textProps = layer.property("ADBE Text Properties");
    var sourceText = textProps.property("ADBE Text Document");
    var baseDocument = sourceText.value;
    var text = baseDocument.text || "";
    if (!text.length) {
      throw new Error("Selected text layer is empty.");
    }

    var time = comp.time;
    var fullRect = layer.sourceRectAtTime(time, false);
    var sourcePositionProp = getTransformProp(layer, "Position");
    var sourceAnchorProp = getTransformProp(layer, "Anchor Point");
    var sourceScaleProp = getTransformProp(layer, "Scale");
    var sourceRotationProp = getTransformProp(layer, "Rotation");
    if (!sourcePositionProp || !sourceAnchorProp || !sourceScaleProp) {
      throw new Error("Text layer is missing transform properties.");
    }
    var sourcePosition = getPropertyValueAtTime(sourcePositionProp, time);
    var sourceAnchor = getPropertyValueAtTime(sourceAnchorProp, time);
    var sourceScale = getPropertyValueAtTime(sourceScaleProp, time);
    var sourceRotation = sourceRotationProp ? Number(getPropertyValueAtTime(sourceRotationProp, time)) || 0 : 0;
    var measureLayer = layer.duplicate();
    measureLayer.name = layer.name + "_Char_Measure";
    var measureOpacity = getTransformProp(measureLayer, "Opacity");
    if (measureOpacity) {
      try {
        measureOpacity.setValue(0);
      } catch (measureOpacityError) {}
    }
    var created = 0;
    var createdLayers = [];

    try {
      for (var i = 0; i < text.length; i += 1) {
        var character = text.charAt(i);
        if (character === "\r" || character === "\n") {
          continue;
        }
        if (character === " " || character === "\t") {
          continue;
        }

        var beforeWidth = measureTextAdvance(measureLayer, text.substring(0, i), time);
        var afterWidth = measureTextAdvance(measureLayer, text.substring(0, i + 1), time);
        var charAdvance = Math.max(3, afterWidth - beforeWidth);
        var charWidth = Math.max(4, charAdvance);

        var newLayer = layer.duplicate();
        newLayer.name = layer.name + "_Char_" + (i + 1);
        var newTextProps = newLayer.property("ADBE Text Properties");
        var newSourceText = newTextProps.property("ADBE Text Document");
        setTextDocumentText(newSourceText, character);
        removeOldTextAnimators(newLayer);
        var newRect = newLayer.sourceRectAtTime(time, false);
        var newAnchorProp = getTransformProp(newLayer, "Anchor Point");
        var newPositionProp = getTransformProp(newLayer, "Position");
        var newAnchor = [newRect.left + newRect.width / 2, newRect.top + newRect.height / 2];
        var localCenterX = beforeWidth + newRect.left + newRect.width / 2;
        var localCenterY = newRect.top + newRect.height / 2;
        var compCenter = layerPointToCompPoint(localCenterX, localCenterY, sourcePosition, sourceAnchor, sourceScale, sourceRotation);
        var newPosition = [compCenter.x, compCenter.y];
        if (sourceAnchor.length > 2) {
          newAnchor.push(sourceAnchor[2]);
        }
        if (sourcePosition.length > 2) {
          newPosition.push(sourcePosition[2]);
        }
        setTransformValueAtCurrentState(newAnchorProp, newAnchor, time);
        setTransformValueAtCurrentState(newPositionProp, newPosition, time);
        var visualWidth = Math.max(3, newRect.width || charWidth);
        var visualHeight = Math.max(6, newRect.height || fullRect.height);
        var hitboxWidth = Math.max(3, Math.min(charWidth * 0.9, visualWidth * 0.95) - getCharacterPhysicsPadding(visualWidth));
        var hitboxHeight = Math.max(6, visualHeight * 0.82 - getCharacterPhysicsPadding(visualHeight));
        setSplitCharacterData(newLayer, {
          left: -hitboxWidth / 2,
          top: -hitboxHeight / 2,
          width: hitboxWidth,
          height: hitboxHeight,
          character: true,
          sourceIndex: i
        });
        createdLayers.push(newLayer);
        created += 1;
      }
    } finally {
      try {
        measureLayer.remove();
      } catch (removeMeasureError) {}
    }

    if (created > 0) {
      for (var layerIndex = 1; layerIndex <= comp.numLayers; layerIndex += 1) {
        try {
          comp.layer(layerIndex).selected = false;
        } catch (deselectError) {}
      }
      try {
        layer.remove();
      } catch (removeSourceError) {}
      for (var selectIndex = 0; selectIndex < createdLayers.length; selectIndex += 1) {
        try {
          createdLayers[selectIndex].selected = true;
        } catch (selectError) {}
      }
    }
    return created;
  }

  function sequenceSelectedLayers(comp) {
    var layers = requireSelectedLayers(comp);
    layers.sort(function (a, b) { return b.index - a.index; });
    var cursor = comp.time;
    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      var duration = Math.max(comp.frameDuration, layer.outPoint - layer.inPoint);
      layer.startTime += cursor - layer.inPoint;
      cursor += duration;
    }
    return layers.length;
  }

  function duplicateSelectedLayers(comp) {
    var layers = requireSelectedLayers(comp);
    var duplicated = 0;
    for (var i = layers.length - 1; i >= 0; i -= 1) {
      layers[i].duplicate();
      duplicated += 1;
    }
    return duplicated;
  }

  function splitSelectedLayers(comp) {
    var layers = requireSelectedLayers(comp);
    var split = 0;
    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];
      if (comp.time <= layer.inPoint || comp.time >= layer.outPoint) {
        continue;
      }
      var duplicate = layer.duplicate();
      duplicate.inPoint = comp.time;
      layer.outPoint = comp.time;
      split += 1;
    }
    return split;
  }

  function reverseSelectedLayers(comp) {
    var layers = requireSelectedLayers(comp);
    for (var i = 0; i < layers.length; i += 1) {
      layers[i].timeReversed = !layers[i].timeReversed;
    }
    return layers.length;
  }

  function clearTransformExpressions(comp) {
    var layers = requireSelectedLayers(comp);
    var targets = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
    var cleared = 0;
    for (var i = 0; i < layers.length; i += 1) {
      for (var targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
        var prop = getTransformProp(layers[i], targets[targetIndex]);
        if (!prop || !prop.canSetExpression || !prop.expressionEnabled) {
          continue;
        }
        prop.expressionEnabled = false;
        prop.expression = "";
        cleared += 1;
      }
    }
    return cleared;
  }

  function normalizeRigidBodySettings(comp, payload) {
    var durationValue = payload.safetyLimit;
    if (isNaN(durationValue)) {
      durationValue = payload.duration;
    }
    return {
      startSec: parseStartTime(comp, payload.startSec),
      duration: Math.max(comp.frameDuration, Math.min(15, isNaN(durationValue) ? 15 : Number(durationValue))),
      gravity: Math.max(0, Math.min(6000, isNaN(payload.gravity) ? 1800 : Number(payload.gravity))),
      bounce: Math.max(0, Math.min(1, isNaN(payload.bounce) ? 0.18 : Number(payload.bounce))),
      friction: Math.max(0, Math.min(1, isNaN(payload.friction) ? 0.62 : Number(payload.friction))),
      characterScatter: Math.max(0, Math.min(2400, isNaN(payload.characterScatter) ? 160 : Number(payload.characterScatter))),
      keyEvery: Math.max(1, Math.min(12, Math.round(isNaN(payload.keyEvery) ? 2 : Number(payload.keyEvery)))),
      boundedByComp: payload.boundedByComp !== false,
      interactWithEachOther: payload.interactWithEachOther !== false,
      explodeOutward: payload.explodeOutward === true,
      collisionScale: Math.max(1, Math.min(2, isNaN(payload.collisionScale) ? 1 : Number(payload.collisionScale))),
      adaptiveDuration: payload.adaptiveDuration !== false
    };
  }

  function removeAllKeys(prop) {
    if (!prop || !prop.numKeys) {
      return;
    }
    while (prop.numKeys > 0) {
      try {
        prop.removeKey(1);
      } catch (removeError) {
        break;
      }
    }
  }

  function getLayerRect(layer, time) {
    var splitData = getSplitCharacterData(layer);
    if (splitData && splitData.width > 0 && splitData.height > 0) {
      var minSize = splitData.character ? 2 : 4;
      return {
        left: Number(splitData.left) || 0,
        top: Number(splitData.top) || 0,
        width: Math.max(minSize, Number(splitData.width) || minSize),
        height: Math.max(minSize, Number(splitData.height) || minSize),
        character: splitData.character === true,
        sourceIndex: isNaN(splitData.sourceIndex) ? null : Number(splitData.sourceIndex)
      };
    }

    try {
      if (layer.sourceRectAtTime) {
        var sourceRect = layer.sourceRectAtTime(time, false);
        if (sourceRect && sourceRect.width > 0 && sourceRect.height > 0) {
          return getTextPhysicsRect(layer, sourceRect, time);
        }
      }
    } catch (sourceRectError) {}

    var width = layer.width || 64;
    var height = layer.height || 64;
    var anchor = getTransformProp(layer, "Anchor Point");
    var anchorValue = anchor ? anchor.value : [width / 2, height / 2];
    return {
      left: -anchorValue[0],
      top: -anchorValue[1],
      width: width,
      height: height
    };
  }

  function rotatePoint(x, y, degrees) {
    var radians = (degrees || 0) * Math.PI / 180;
    var cos = Math.cos(radians);
    var sin = Math.sin(radians);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  function vectorContentsHasEllipse(contents) {
    if (!contents) {
      return false;
    }

    for (var i = 1; i <= contents.numProperties; i += 1) {
      var item = contents.property(i);
      if (!item) {
        continue;
      }
      if (item.matchName === "ADBE Vector Shape - Ellipse") {
        return true;
      }
      if (item.matchName === "ADBE Vector Group" && vectorContentsHasEllipse(item.property("ADBE Vectors Group"))) {
        return true;
      }
    }

    return false;
  }

  function getRigidBodyShape(layer, width, height) {
    try {
      if (layer.matchName === "ADBE Vector Layer" && vectorContentsHasEllipse(layer.property("ADBE Root Vectors Group"))) {
        return "circle";
      }
    } catch (shapeError) {}

    return "box";
  }

  function getPropertyValueAtTime(prop, time) {
    try {
      return prop.valueAtTime(time, false);
    } catch (valueAtTimeError) {}
    return prop.value;
  }

  function getLayerTextValue(layer) {
    try {
      var textProps = layer.property("ADBE Text Properties");
      var sourceText = textProps.property("ADBE Text Document");
      var value = sourceText.value;
      return String(value && value.text ? value.text : "");
    } catch (textError) {}
    return "";
  }

  function isLikelySplitCharacterLayer(layer, rect) {
    if (rect && rect.character === true) {
      return true;
    }
    try {
      if (layer.name && layer.name.indexOf("_Char_") >= 0) {
        return true;
      }
    } catch (nameError) {}
    var text = getLayerTextValue(layer);
    return text.length === 1 && text !== " " && text !== "\t" && text !== "\r" && text !== "\n";
  }

  function getRigidBodyFromLayer(layer, comp, settings, index) {
    var positionProp = getTransformProp(layer, "Position");
    var scaleProp = getTransformProp(layer, "Scale");
    var rotationProp = getTransformProp(layer, "Rotation");
    if (!positionProp || !scaleProp) {
      return null;
    }

    var rect = getLayerRect(layer, settings.startSec);
    var position = getPropertyValueAtTime(positionProp, settings.startSec);
    var scale = scaleProp.value;
    var sx = Math.max(0.001, Math.abs(Number(scale[0]) || 100) / 100);
    var sy = Math.max(0.001, Math.abs(Number(scale[1]) || 100) / 100);
    var isCharacterBody = isLikelySplitCharacterLayer(layer, rect);
    var collisionScale = settings.explodeOutward && isCharacterBody ? settings.collisionScale : 1;
    var width = Math.max(4, rect.width * sx * collisionScale);
    var height = Math.max(4, rect.height * sy * collisionScale);
    var localOffsetX = (rect.left + rect.width / 2) * sx;
    var localOffsetY = (rect.top + rect.height / 2) * sy;
    var zValue = position.length > 2 ? position[2] : null;
    var initialRotation = rotationProp ? Number(getPropertyValueAtTime(rotationProp, settings.startSec)) || 0 : 0;
    var rotatedOffset = rotatePoint(localOffsetX, localOffsetY, initialRotation);
    var shape = getRigidBodyShape(layer, width, height);
    var radius = Math.max(width, height) / 2;
    var mass = Math.max(1, width * height);
    var inertia = shape === "circle" ? (0.5 * mass * radius * radius) : (mass * (width * width + height * height) / 12);
    var isTextBody = layer.matchName === "ADBE Text Layer" && !isCharacterBody;
    var sourceIndex = rect.sourceIndex;
    if (sourceIndex === null || isNaN(sourceIndex)) {
      sourceIndex = index;
    }

    var body = {
      layer: layer,
      positionProp: positionProp,
      rotationProp: rotationProp,
      localCenterOffsetX: localOffsetX,
      localCenterOffsetY: localOffsetY,
      zValue: zValue,
      x: Number(position[0]) + rotatedOffset.x,
      y: Number(position[1]) + rotatedOffset.y,
      vx: 0,
      vy: 0,
      width: width,
      height: height,
      radius: radius,
      shape: shape,
      isCharacterBody: isCharacterBody,
      isTextBody: isTextBody,
      sourceIndex: sourceIndex,
      startX: Number(position[0]) + rotatedOffset.x,
      startY: Number(position[1]) + rotatedOffset.y,
      rotation: initialRotation,
      angularVelocity: 0,
      age: 0,
      mass: mass,
      invMass: 1 / mass,
      inertia: Math.max(1, inertia),
      invInertia: 1 / Math.max(1, inertia),
      sleeping: false,
      sleepFrames: 0,
      samples: []
    };

    var initialAabb = getBodyAabb(body);
    body.initialMinX = initialAabb.minX;
    body.initialMaxX = initialAabb.maxX;
    return body;
  }

  function clampValue(value, min, max) {
    if (min > max) {
      return (min + max) / 2;
    }
    return Math.max(min, Math.min(max, value));
  }

  function getBodyHalfExtents(body) {
    if (body.shape === "circle") {
      return {
        x: body.radius,
        y: body.radius
      };
    }

    var radians = (body.rotation || 0) * Math.PI / 180;
    var cos = Math.abs(Math.cos(radians));
    var sin = Math.abs(Math.sin(radians));
    var halfW = body.width / 2;
    var halfH = body.height / 2;
    return {
      x: halfW * cos + halfH * sin,
      y: halfW * sin + halfH * cos
    };
  }

  function getBodyAabb(body) {
    if (body.shape === "circle") {
      return {
        minX: body.x - body.radius,
        maxX: body.x + body.radius,
        minY: body.y - body.radius,
        maxY: body.y + body.radius
      };
    }

    var vertices = getBoxVertices(body);
    var minX = vertices[0].x;
    var maxX = vertices[0].x;
    var minY = vertices[0].y;
    var maxY = vertices[0].y;
    for (var i = 1; i < vertices.length; i += 1) {
      minX = Math.min(minX, vertices[i].x);
      maxX = Math.max(maxX, vertices[i].x);
      minY = Math.min(minY, vertices[i].y);
      maxY = Math.max(maxY, vertices[i].y);
    }
    return {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY
    };
  }

  function bodyAabbsOverlap(a, b) {
    var aBox = getBodyAabb(a);
    var bBox = getBodyAabb(b);
    return aBox.minX <= bBox.maxX &&
      aBox.maxX >= bBox.minX &&
      aBox.minY <= bBox.maxY &&
      aBox.maxY >= bBox.minY;
  }

  function getBroadphasePairs(bodies) {
    var entries = [];
    for (var i = 0; i < bodies.length; i += 1) {
      entries.push({
        body: bodies[i],
        aabb: getBodyAabb(bodies[i])
      });
    }

    entries.sort(function (a, b) {
      return a.aabb.minX - b.aabb.minX;
    });

    var pairs = [];
    for (var aIndex = 0; aIndex < entries.length - 1; aIndex += 1) {
      var aEntry = entries[aIndex];
      for (var bIndex = aIndex + 1; bIndex < entries.length; bIndex += 1) {
        var bEntry = entries[bIndex];
        if (bEntry.aabb.minX > aEntry.aabb.maxX) {
          break;
        }
        if (aEntry.body.sleeping && bEntry.body.sleeping) {
          continue;
        }
        if (aEntry.aabb.minY <= bEntry.aabb.maxY && aEntry.aabb.maxY >= bEntry.aabb.minY) {
          pairs.push([aEntry.body, bEntry.body]);
        }
      }
    }
    return pairs;
  }

  function getBodyCompLimits(body, comp) {
    var extents = getBodyHalfExtents(body);
    var halfW = Math.min(extents.x, comp.width / 2);
    var halfH = Math.min(extents.y, comp.height / 2);
    var leftLimit = body.isTextBody && body.initialMinX < 0 ? body.initialMinX : 0;
    var rightLimit = body.isTextBody && body.initialMaxX > comp.width ? body.initialMaxX : comp.width;
    return {
      leftLimit: leftLimit,
      rightLimit: rightLimit,
      minX: leftLimit + halfW,
      maxX: rightLimit - halfW,
      minY: halfH,
      maxY: comp.height - halfH,
      floorY: comp.height - halfH
    };
  }

  function clampBodyToComp(body, comp) {
    var limits = getBodyCompLimits(body, comp);
    if (limits.minX <= limits.maxX) {
      body.x = clampValue(body.x, limits.minX, limits.maxX);
    }
    if (limits.minY <= limits.maxY) {
      body.y = clampValue(body.y, limits.minY, limits.maxY);
    }
  }

  function clampAllBodiesToComp(bodies, comp) {
    for (var i = 0; i < bodies.length; i += 1) {
      clampBodyToComp(bodies[i], comp);
    }
  }

  function resolveCompBounds(body, comp, settings) {
    var limits = getBodyCompLimits(body, comp);
    var points = body.shape === "circle" ? [
      { x: body.x - body.radius, y: body.y },
      { x: body.x + body.radius, y: body.y },
      { x: body.x, y: body.y - body.radius },
      { x: body.x, y: body.y + body.radius }
    ] : getBoxVertices(body);
    var leftContact = null;
    var rightContact = null;
    var topContact = null;
    var bottomContact = null;

    for (var i = 0; i < points.length; i += 1) {
      var point = points[i];
      if (point.x < limits.leftLimit) {
        leftContact = collectStaticContact(leftContact, limits.leftLimit - point.x, point.x, point.y);
      } else if (point.x > limits.rightLimit) {
        rightContact = collectStaticContact(rightContact, point.x - limits.rightLimit, point.x, point.y);
      }
      if (point.y < 0) {
        topContact = collectStaticContact(topContact, -point.y, point.x, point.y);
      } else if (point.y > comp.height) {
        bottomContact = collectStaticContact(bottomContact, point.y - comp.height, point.x, point.y);
      }
    }

    if (leftContact) {
      resolveStaticCollision(body, 1, 0, leftContact.overlap, leftContact.x, leftContact.y, settings);
    }
    if (rightContact) {
      resolveStaticCollision(body, -1, 0, rightContact.overlap, rightContact.x, rightContact.y, settings);
    }
    if (topContact) {
      resolveStaticCollision(body, 0, 1, topContact.overlap, topContact.x, topContact.y, settings);
    }
    if (bottomContact) {
      resolveStaticCollision(body, 0, -1, bottomContact.overlap, bottomContact.x, bottomContact.y, settings);
    }

    if (Math.abs(body.vy) < Math.max(24, settings.gravity * 0.035) && isBodyStablySupportedByFloor(body, comp)) {
      body.vy = 0;
      body.vx *= 1 - settings.friction * 0.35;
      body.angularVelocity *= 1 - settings.friction * 0.35;
      correctFloorPenetration(body, comp);
    } else if (isBodyNearFloor(body, comp)) {
      correctFloorPenetration(body, comp);
    }
    clampBodyToComp(body, comp);
  }

  function collectStaticContact(contact, overlap, x, y) {
    if (!contact) {
      return {
        overlap: overlap,
        x: x,
        y: y,
        count: 1
      };
    }

    if (overlap > contact.overlap) {
      contact.overlap = overlap;
    }
    contact.x = (contact.x * contact.count + x) / (contact.count + 1);
    contact.y = (contact.y * contact.count + y) / (contact.count + 1);
    contact.count += 1;
    return contact;
  }

  function normalizeAxis(axis) {
    var length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    if (length < 0.0001) {
      return { x: 1, y: 0 };
    }
    return {
      x: axis.x / length,
      y: axis.y / length
    };
  }

  function getBoxVertices(body) {
    if (
      body._cachedVertices &&
      body._cachedVertexX === body.x &&
      body._cachedVertexY === body.y &&
      body._cachedVertexRotation === body.rotation
    ) {
      return body._cachedVertices;
    }

    var halfW = body.width / 2;
    var halfH = body.height / 2;
    var corners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH }
    ];
    var vertices = [];
    for (var i = 0; i < corners.length; i += 1) {
      var rotated = rotatePoint(corners[i].x, corners[i].y, body.rotation);
      vertices.push({
        x: body.x + rotated.x,
        y: body.y + rotated.y
      });
    }
    body._cachedVertices = vertices;
    body._cachedVertexX = body.x;
    body._cachedVertexY = body.y;
    body._cachedVertexRotation = body.rotation;
    body._cachedAxes = null;
    return vertices;
  }

  function getPolygonAxes(vertices) {
    var axes = [];
    for (var i = 0; i < vertices.length; i += 1) {
      var next = vertices[(i + 1) % vertices.length];
      var edgeX = next.x - vertices[i].x;
      var edgeY = next.y - vertices[i].y;
      axes.push(normalizeAxis({ x: -edgeY, y: edgeX }));
    }
    return axes;
  }

  function getBodyAxes(body) {
    if (
      body._cachedAxes &&
      body._cachedAxisX === body.x &&
      body._cachedAxisY === body.y &&
      body._cachedAxisRotation === body.rotation
    ) {
      return body._cachedAxes;
    }

    var axes = getPolygonAxes(getBoxVertices(body));
    body._cachedAxes = axes;
    body._cachedAxisX = body.x;
    body._cachedAxisY = body.y;
    body._cachedAxisRotation = body.rotation;
    return axes;
  }

  function projectVertices(vertices, axis) {
    var min = vertices[0].x * axis.x + vertices[0].y * axis.y;
    var max = min;
    for (var i = 1; i < vertices.length; i += 1) {
      var projection = vertices[i].x * axis.x + vertices[i].y * axis.y;
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
    return { min: min, max: max };
  }

  function projectCircle(body, axis) {
    var center = body.x * axis.x + body.y * axis.y;
    return {
      min: center - body.radius,
      max: center + body.radius
    };
  }

  function getProjectionOverlap(aProjection, bProjection) {
    return Math.min(aProjection.max, bProjection.max) - Math.max(aProjection.min, bProjection.min);
  }

  function orientAxisFromAToB(axis, a, b) {
    var centerDot = (b.x - a.x) * axis.x + (b.y - a.y) * axis.y;
    if (centerDot < 0) {
      return { x: -axis.x, y: -axis.y };
    }
    return axis;
  }

  function cross2(ax, ay, bx, by) {
    return ax * by - ay * bx;
  }

  function getPointVelocity(body, pointX, pointY) {
    var rx = pointX - body.x;
    var ry = pointY - body.y;
    var omega = (body.angularVelocity || 0) * Math.PI / 180;
    return {
      x: body.vx - omega * ry,
      y: body.vy + omega * rx
    };
  }

  function applyAngularImpulse(body, rx, ry, impulseX, impulseY, direction) {
    var torque = cross2(rx, ry, impulseX, impulseY) * direction;
    body.angularVelocity += torque * body.invInertia * 180 / Math.PI;
  }

  function getRestingBounce(settings, velocityAlongNormal) {
    var closingSpeed = Math.abs(velocityAlongNormal || 0);
    var restingThreshold = Math.max(90, settings.gravity * 0.055);
    return closingSpeed < restingThreshold ? 0 : settings.bounce;
  }

  function getBodyBounce(body, settings, velocityAlongNormal) {
    var bounce = getRestingBounce(settings, velocityAlongNormal);
    if (body.isTextBody) {
      return bounce * 0.35;
    }
    return bounce;
  }

  function dampBodyMotion(body, settings, stepDt) {
    var characterDamping = body.isCharacterBody ? 0.28 : 0;
    var linearDamping = Math.max(0.82, 1 - (0.34 + characterDamping + settings.friction * 0.38) * stepDt);
    var angularDamping = Math.max(0.72, 1 - (0.62 + characterDamping * 2 + settings.friction * 0.72) * stepDt);
    body.vx *= linearDamping;
    body.vy *= linearDamping;
    body.angularVelocity *= angularDamping;

    var maxSpeed = Math.max(900, settings.gravity * 1.15);
    body.vx = clampValue(body.vx, -maxSpeed, maxSpeed);
    body.vy = clampValue(body.vy, -maxSpeed, maxSpeed);
    body.angularVelocity = clampValue(body.angularVelocity, body.isCharacterBody ? -420 : -720, body.isCharacterBody ? 420 : 720);
  }

  function getSupportPoint(body, dirX, dirY) {
    if (body.shape === "circle") {
      var normalized = normalizeAxis({ x: dirX, y: dirY });
      return {
        x: body.x + normalized.x * body.radius,
        y: body.y + normalized.y * body.radius
      };
    }

    var vertices = getBoxVertices(body);
    var best = vertices[0];
    var bestDot = best.x * dirX + best.y * dirY;
    for (var i = 1; i < vertices.length; i += 1) {
      var dot = vertices[i].x * dirX + vertices[i].y * dirY;
      if (dot > bestDot) {
        bestDot = dot;
        best = vertices[i];
      }
    }
    return best;
  }

  function getCollisionContactPoint(a, b, normalX, normalY) {
    var aPoint = getSupportPoint(a, normalX, normalY);
    var bPoint = getSupportPoint(b, -normalX, -normalY);
    return {
      x: (aPoint.x + bPoint.x) / 2,
      y: (aPoint.y + bPoint.y) / 2
    };
  }

  function applyBodyImpulse(a, b, normalX, normalY, contactX, contactY, settings) {
    var raX = contactX - a.x;
    var raY = contactY - a.y;
    var rbX = contactX - b.x;
    var rbY = contactY - b.y;
    var velocityA = getPointVelocity(a, contactX, contactY);
    var velocityB = getPointVelocity(b, contactX, contactY);
    var rvx = velocityB.x - velocityA.x;
    var rvy = velocityB.y - velocityA.y;
    var velocityAlongNormal = rvx * normalX + rvy * normalY;
    if (velocityAlongNormal > 0) {
      return;
    }

    var raCrossN = cross2(raX, raY, normalX, normalY);
    var rbCrossN = cross2(rbX, rbY, normalX, normalY);
    var denominator = a.invMass + b.invMass + (raCrossN * raCrossN) * a.invInertia + (rbCrossN * rbCrossN) * b.invInertia;
    if (denominator <= 0) {
      return;
    }

    var bounce = getRestingBounce(settings, velocityAlongNormal);
    if (a.isCharacterBody && b.isCharacterBody) {
      bounce *= 0.35;
    }
    var impulse = -(1 + bounce) * velocityAlongNormal / denominator;
    if (a.isCharacterBody && b.isCharacterBody) {
      impulse = Math.min(impulse, Math.max(a.mass, b.mass) * 2.2);
    }
    var impulseX = impulse * normalX;
    var impulseY = impulse * normalY;
    a.vx -= impulseX * a.invMass;
    a.vy -= impulseY * a.invMass;
    b.vx += impulseX * b.invMass;
    b.vy += impulseY * b.invMass;
    applyAngularImpulse(a, raX, raY, impulseX, impulseY, -1);
    applyAngularImpulse(b, rbX, rbY, impulseX, impulseY, 1);

    var afterA = getPointVelocity(a, contactX, contactY);
    var afterB = getPointVelocity(b, contactX, contactY);
    var tangentX = normalY;
    var tangentY = -normalX;
    var tangentVelocity = (afterB.x - afterA.x) * tangentX + (afterB.y - afterA.y) * tangentY;
    var raCrossT = cross2(raX, raY, tangentX, tangentY);
    var rbCrossT = cross2(rbX, rbY, tangentX, tangentY);
    var tangentDenominator = a.invMass + b.invMass + (raCrossT * raCrossT) * a.invInertia + (rbCrossT * rbCrossT) * b.invInertia;
    if (tangentDenominator > 0) {
      var frictionImpulse = -tangentVelocity / tangentDenominator;
      var maxFriction = Math.abs(impulse) * Math.min(0.95, settings.friction);
      frictionImpulse = clampValue(frictionImpulse, -maxFriction, maxFriction);
      var frictionX = frictionImpulse * tangentX;
      var frictionY = frictionImpulse * tangentY;
      a.vx -= frictionX * a.invMass;
      a.vy -= frictionY * a.invMass;
      b.vx += frictionX * b.invMass;
      b.vy += frictionY * b.invMass;
      applyAngularImpulse(a, raX, raY, frictionX, frictionY, -1);
      applyAngularImpulse(b, rbX, rbY, frictionX, frictionY, 1);
    }
  }

  function resolveStaticCollision(body, normalX, normalY, overlap, contactX, contactY, settings) {
    if (overlap <= 0) {
      return;
    }

    body.x += normalX * overlap;
    body.y += normalY * overlap;

    var rx = contactX - body.x;
    var ry = contactY - body.y;
    var velocity = getPointVelocity(body, contactX, contactY);
    var velocityAlongNormal = velocity.x * normalX + velocity.y * normalY;
    if (velocityAlongNormal < 0) {
      var rCrossN = cross2(rx, ry, normalX, normalY);
      var denominator = body.invMass + (rCrossN * rCrossN) * body.invInertia;
      if (denominator > 0) {
        var impulse = -(1 + getBodyBounce(body, settings, velocityAlongNormal)) * velocityAlongNormal / denominator;
        var impulseX = impulse * normalX;
        var impulseY = impulse * normalY;
        body.vx += impulseX * body.invMass;
        body.vy += impulseY * body.invMass;
        applyAngularImpulse(body, rx, ry, impulseX, impulseY, body.isTextBody ? 0.35 : 1);
      }
    }

    var afterVelocity = getPointVelocity(body, contactX, contactY);
    var tangentX = normalY;
    var tangentY = -normalX;
    var tangentVelocity = afterVelocity.x * tangentX + afterVelocity.y * tangentY;
    var rCrossT = cross2(rx, ry, tangentX, tangentY);
    var tangentDenominator = body.invMass + (rCrossT * rCrossT) * body.invInertia;
    if (tangentDenominator > 0) {
      var frictionImpulse = -tangentVelocity / tangentDenominator;
      var maxFriction = Math.abs(velocityAlongNormal) * Math.min(0.95, settings.friction);
      frictionImpulse = clampValue(frictionImpulse, -maxFriction, maxFriction);
      var frictionX = frictionImpulse * tangentX;
      var frictionY = frictionImpulse * tangentY;
      body.vx += frictionX * body.invMass;
      body.vy += frictionY * body.invMass;
      applyAngularImpulse(body, rx, ry, frictionX, frictionY, body.isTextBody ? 0.35 : 1);
    }
  }

  function isBodyNearFloor(body, comp) {
    var points = body.shape === "circle" ? [{ x: body.x, y: body.y + body.radius }] : getBoxVertices(body);
    for (var i = 0; i < points.length; i += 1) {
      if (Math.abs(points[i].y - comp.height) < 0.75) {
        return true;
      }
    }
    return false;
  }

  function getLowestBodyPointY(body) {
    if (body.shape === "circle") {
      return body.y + body.radius;
    }

    var vertices = getBoxVertices(body);
    var lowest = vertices[0].y;
    for (var i = 1; i < vertices.length; i += 1) {
      lowest = Math.max(lowest, vertices[i].y);
    }
    return lowest;
  }

  function correctFloorPenetration(body, comp) {
    var lowest = getLowestBodyPointY(body);
    if (lowest > comp.height) {
      body.y -= lowest - comp.height;
    }
  }

  function testCollisionAxis(axis, aProjection, bProjection, a, b, manifold) {
    var orientedAxis = orientAxisFromAToB(axis, a, b);
    var overlap = getProjectionOverlap(aProjection, bProjection);
    if (overlap <= 0) {
      return false;
    }
    if (overlap < manifold.overlap) {
      manifold.overlap = overlap;
      manifold.normalX = orientedAxis.x;
      manifold.normalY = orientedAxis.y;
    }
    return true;
  }

  function getPolygonPolygonManifold(a, b) {
    var aVertices = getBoxVertices(a);
    var bVertices = getBoxVertices(b);
    var axes = getBodyAxes(a).concat(getBodyAxes(b));
    var manifold = { overlap: 999999, normalX: 1, normalY: 0 };

    for (var i = 0; i < axes.length; i += 1) {
      var axis = axes[i];
      if (!testCollisionAxis(axis, projectVertices(aVertices, axis), projectVertices(bVertices, axis), a, b, manifold)) {
        return null;
      }
    }

    return manifold;
  }

  function getCircleCircleManifold(a, b) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var distanceSq = dx * dx + dy * dy;
    var minDistance = a.radius + b.radius;
    if (distanceSq >= minDistance * minDistance) {
      return null;
    }

    var distance = Math.sqrt(distanceSq);
    return {
      normalX: distance > 0.001 ? dx / distance : 1,
      normalY: distance > 0.001 ? dy / distance : 0,
      overlap: minDistance - distance
    };
  }

  function getClosestVertexAxis(circle, vertices) {
    var closest = vertices[0];
    var closestDistanceSq = 999999999;
    for (var i = 0; i < vertices.length; i += 1) {
      var dx = vertices[i].x - circle.x;
      var dy = vertices[i].y - circle.y;
      var distanceSq = dx * dx + dy * dy;
      if (distanceSq < closestDistanceSq) {
        closestDistanceSq = distanceSq;
        closest = vertices[i];
      }
    }
    return normalizeAxis({ x: closest.x - circle.x, y: closest.y - circle.y });
  }

  function getCirclePolygonManifold(circle, polygon, flipNormal) {
    var vertices = getBoxVertices(polygon);
    var axes = getBodyAxes(polygon).slice(0);
    axes.push(getClosestVertexAxis(circle, vertices));

    var manifold = { overlap: 999999, normalX: 1, normalY: 0 };
    for (var i = 0; i < axes.length; i += 1) {
      var axis = axes[i];
      if (!testCollisionAxis(axis, projectCircle(circle, axis), projectVertices(vertices, axis), circle, polygon, manifold)) {
        return null;
      }
    }

    if (flipNormal) {
      manifold.normalX *= -1;
      manifold.normalY *= -1;
    }
    return manifold;
  }

  function getCollisionManifold(a, b) {
    if (a.shape === "circle" && b.shape === "circle") {
      return getCircleCircleManifold(a, b);
    }
    if (a.shape === "circle") {
      return getCirclePolygonManifold(a, b, false);
    }
    if (b.shape === "circle") {
      return getCirclePolygonManifold(b, a, true);
    }
    return getPolygonPolygonManifold(a, b);
  }

  function seededUnitValue(seed) {
    var x = Math.sin((seed + 1) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function primeCharacterBodies(bodies, settings, comp) {
    if (!settings.explodeOutward) {
      return;
    }

    var characterCount = 0;
    var centerX = comp ? comp.width / 2 : 0;
    var centerY = comp ? comp.height / 2 : 0;
    var characterCenterX = 0;
    var characterCenterY = 0;
    for (var i = 0; i < bodies.length; i += 1) {
      if (bodies[i].isCharacterBody) {
        characterCount += 1;
        characterCenterX += bodies[i].x;
        characterCenterY += bodies[i].y;
      }
    }
    if (characterCount < 2) {
      return;
    }
    centerX = characterCenterX / characterCount;
    centerY = characterCenterY / characterCount;

    for (var b = 0; b < bodies.length; b += 1) {
      var body = bodies[b];
      if (!body.isCharacterBody) {
        continue;
      }
      var seed = body.sourceIndex !== null ? body.sourceIndex : b;
      var scatter = settings.characterScatter;
      var angle = seededUnitValue(seed + 71) * Math.PI * 2;
      var dx = body.x - centerX;
      var dy = body.y - centerY;
      if (Math.abs(dx) + Math.abs(dy) > 0.001) {
        var outwardLength = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        var randomAngle = seededUnitValue(seed + 71) * Math.PI * 2;
        var randomWeight = 0.3 + seededUnitValue(seed + 191) * 0.22;
        var vectorX = dx / outwardLength + Math.cos(randomAngle) * randomWeight;
        var vectorY = dy / outwardLength + Math.sin(randomAngle) * randomWeight;
        angle = Math.atan2(vectorY, vectorX);
      }
      var speed = scatter * (0.68 + seededUnitValue(seed + 113) * 0.32);
      body.startX = body.x;
      body.startY = body.y;
      body.vx = Math.cos(angle) * speed;
      body.vy = Math.sin(angle) * speed;
      body.angularVelocity = (seededUnitValue(seed + 151) - 0.5) * Math.min(520, scatter * 0.48);
    }
  }

  function resolveBodyCollision(a, b, settings) {
    if (a.sleeping && b.sleeping) {
      return false;
    }
    if (!bodyAabbsOverlap(a, b)) {
      return false;
    }

    var manifold = getCollisionManifold(a, b);
    if (!manifold) {
      return false;
    }

    var normalX = manifold.normalX;
    var normalY = manifold.normalY;
    var overlap = Math.max(0, manifold.overlap - 0.35) * 0.86;
    if (overlap <= 0) {
      return false;
    }

    a.sleeping = false;
    b.sleeping = false;
    a.sleepFrames = 0;
    b.sleepFrames = 0;

    var totalMass = a.mass + b.mass;
    var aShare = b.mass / totalMass;
    var bShare = a.mass / totalMass;

    a.x -= normalX * overlap * aShare;
    a.y -= normalY * overlap * aShare;
    b.x += normalX * overlap * bShare;
    b.y += normalY * overlap * bShare;

    var contact = getCollisionContactPoint(a, b, normalX, normalY);
    applyBodyImpulse(a, b, normalX, normalY, contact.x, contact.y, settings);

    return true;
  }

  function isBodyStablySupportedByFloor(body, comp) {
    if (body.shape === "circle") {
      return Math.abs((body.y + body.radius) - comp.height) < 1.5;
    }

    var vertices = getBoxVertices(body);
    var nearFloorCount = 0;
    for (var i = 0; i < vertices.length; i += 1) {
      if (Math.abs(vertices[i].y - comp.height) < 1.75) {
        nearFloorCount += 1;
      }
    }
    return nearFloorCount >= 2;
  }

  function updateBodySleepState(body, comp, settings) {
    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    var angularSpeed = Math.abs(body.angularVelocity || 0);
    var speedThreshold = settings.adaptiveDuration ? (body.isCharacterBody ? 7.5 : 5) : (body.isCharacterBody ? 2.5 : 1.5);
    var angularThreshold = settings.adaptiveDuration ? (body.isCharacterBody ? 8 : 5) : (body.isCharacterBody ? 2 : 1);
    var requiredSleepFrames = settings.adaptiveDuration ? (body.isCharacterBody ? 12 : 16) : (body.isCharacterBody ? 24 : 30);
    var stablySupported = isBodyStablySupportedByFloor(body, comp);
    var motionSettled = settings.adaptiveDuration && body.age > 0.25;
    if (speed < speedThreshold && angularSpeed < angularThreshold && (stablySupported || motionSettled)) {
      body.sleepFrames += 1;
      if (body.sleepFrames > requiredSleepFrames) {
        body.sleeping = true;
        body.vx = 0;
        body.vy = 0;
        body.angularVelocity = 0;
      }
    } else {
      body.sleepFrames = 0;
      body.sleeping = false;
    }
  }

  function areAllBodiesSleeping(bodies) {
    if (!bodies.length) {
      return false;
    }
    for (var i = 0; i < bodies.length; i += 1) {
      if (!bodies[i].sleeping) {
        return false;
      }
    }
    return true;
  }

  function sampleRigidBodies(bodies, time, comp, settings, clampToBounds) {
    if (clampToBounds !== false && settings && settings.boundedByComp) {
      clampAllBodiesToComp(bodies, comp);
    }

    for (var i = 0; i < bodies.length; i += 1) {
      bodies[i].samples.push({
        time: time,
        x: bodies[i].x,
        y: bodies[i].y,
        rotation: bodies[i].rotation
      });
    }
  }

  function bakeRigidBodySamples(body) {
    removeAllKeys(body.positionProp);
    removeAllKeys(body.rotationProp);

    var lastSampleTime = null;
    for (var i = 0; i < body.samples.length; i += 1) {
      var sample = body.samples[i];
      lastSampleTime = sample.time;
      var rotatedOffset = rotatePoint(body.localCenterOffsetX, body.localCenterOffsetY, sample.rotation);
      var positionValue = [sample.x - rotatedOffset.x, sample.y - rotatedOffset.y];
      if (body.zValue !== null) {
        positionValue.push(body.zValue);
      }
      body.positionProp.setValueAtTime(sample.time, positionValue);
      if (body.rotationProp) {
        body.rotationProp.setValueAtTime(sample.time, sample.rotation);
      }
    }

    if (lastSampleTime !== null) {
      try {
        body.layer.outPoint = Math.max(body.layer.outPoint, lastSampleTime + 0.001);
      } catch (outPointError) {}
    }
  }

  function getLayerMarkerProp(layer) {
    try {
      return layer.property("ADBE Marker");
    } catch (markerError) {}
    try {
      return layer.property("Marker");
    } catch (fallbackError) {}
    return null;
  }

  function getPhysicsMarkerData(layer) {
    var markerProp = getLayerMarkerProp(layer);
    if (!markerProp || !markerProp.numKeys) {
      return null;
    }

    for (var i = 1; i <= markerProp.numKeys; i += 1) {
      try {
        var marker = markerProp.keyValue(i);
        if (marker && marker.comment && marker.comment.indexOf(PHYSICS_MARKER_PREFIX) === 0) {
          return parsePayload(marker.comment.substring(PHYSICS_MARKER_PREFIX.length));
        }
      } catch (markerReadError) {}
    }

    return null;
  }

  function markLayerAsPhysics(layer, settings) {
    var markerProp = getLayerMarkerProp(layer);
    if (!markerProp || typeof MarkerValue === "undefined") {
      return;
    }

    var splitData = getSplitCharacterData(layer);
    var marker = new MarkerValue(PHYSICS_MARKER_PREFIX + stringifyPayload({
      settings: settings,
      startSignature: getPhysicsLayerStartSignature(layer, settings),
      splitData: splitData
    }));

    for (var i = markerProp.numKeys; i >= 1; i -= 1) {
      try {
        var existing = markerProp.keyValue(i);
        if (existing && existing.comment && existing.comment.indexOf(PHYSICS_MARKER_PREFIX) === 0) {
          markerProp.removeKey(i);
        }
      } catch (removeMarkerError) {}
    }

    try {
      markerProp.setValueAtTime(settings.startSec, marker);
    } catch (setMarkerError) {}
  }

  function getPhysicsLayers(comp) {
    var layers = [];
    var settings = null;
    for (var i = 1; i <= comp.numLayers; i += 1) {
      var layer = comp.layer(i);
      var data = getPhysicsMarkerData(layer);
      if (data && data.settings) {
        layers.push(layer);
        if (!settings) {
          settings = normalizeRigidBodySettings(comp, data.settings);
        }
      }
    }
    return {
      layers: layers,
      settings: settings
    };
  }

  function getSelectedPhysicsLayers(comp) {
    var selected = getSelectedLayers(comp);
    var layers = [];
    var settings = null;
    var allSelectedArePhysics = selected.length > 0;

    for (var i = 0; i < selected.length; i += 1) {
      var data = getPhysicsMarkerData(selected[i]);
      if (!data || !data.settings) {
        allSelectedArePhysics = false;
        continue;
      }
      layers.push(selected[i]);
      if (!settings) {
        settings = normalizeRigidBodySettings(comp, data.settings);
      }
    }

    return {
      allSelectedArePhysics: allSelectedArePhysics && layers.length === selected.length,
      layers: layers,
      selectedCount: selected.length,
      settings: settings
    };
  }

  function getSelectedPhysicsState() {
    var comp = getActiveComp();
    if (!comp) {
      return stringifyPayload({ ok: false, allSelectedArePhysics: false, selectedCount: 0 });
    }

    var selectedPhysics = getSelectedPhysicsLayers(comp);
    return stringifyPayload({
      ok: true,
      allSelectedArePhysics: selectedPhysics.allSelectedArePhysics,
      selectedCount: selectedPhysics.selectedCount
    });
  }

  function getStartKeyValueSignature(prop, startSec) {
    if (!prop) {
      return "none";
    }

    var keyIndex = 0;
    try {
      if (prop.numKeys > 0) {
        keyIndex = prop.nearestKeyIndex(startSec);
        if (Math.abs(prop.keyTime(keyIndex) - startSec) > 0.001) {
          keyIndex = 1;
        }
      }
    } catch (nearestError) {}

    try {
      if (keyIndex > 0) {
        return prop.keyTime(keyIndex).toFixed(4) + ":" + stringifyPayload(prop.keyValue(keyIndex));
      }
    } catch (keyValueError) {}

    try {
      return "value:" + stringifyPayload(prop.valueAtTime(startSec, false));
    } catch (valueError) {}
    return "unknown";
  }

  function getPhysicsLayerStartSignature(layer, settings) {
    var positionProp = getTransformProp(layer, "Position");
    var rotationProp = getTransformProp(layer, "Rotation");
    return [
      layer.index,
      layer.name,
      settings.startSec.toFixed(4),
      getStartKeyValueSignature(positionProp, settings.startSec),
      getStartKeyValueSignature(rotationProp, settings.startSec)
    ].join("|");
  }

  function getPhysicsSignature() {
    var comp = getActiveComp();
    if (!comp) {
      return stringifyPayload({ ok: false, signature: "" });
    }

    var parts = [];
    var changed = false;
    for (var i = 1; i <= comp.numLayers; i += 1) {
      var layer = comp.layer(i);
      var data = getPhysicsMarkerData(layer);
      if (!data || !data.settings) {
        continue;
      }
      var settings = normalizeRigidBodySettings(comp, data.settings);
      var layerSignature = getPhysicsLayerStartSignature(layer, settings);
      parts.push(layerSignature);
      if (data.startSignature && data.startSignature !== layerSignature) {
        changed = true;
      }
    }

    return stringifyPayload({
      ok: true,
      changed: changed,
      signature: parts.join("||")
    });
  }

  function applyRigidBodySimulationToLayers(comp, layers, settings, markLayers) {
    var bodies = [];
    for (var i = 0; i < layers.length; i += 1) {
      var body = getRigidBodyFromLayer(layers[i], comp, settings, i);
      if (body) {
        bodies.push(body);
      }
    }

    if (!bodies.length) {
      return "Error: Selected layers need Position and Scale properties.";
    }

    var dt = comp.frameDuration;
    var totalFrames = Math.max(1, Math.round(settings.duration / dt));
    var startTime = settings.startSec;
    if (settings.explodeOutward) {
      sampleRigidBodies(bodies, startTime, comp, settings, false);
      primeCharacterBodies(bodies, settings, comp);
    } else {
      primeCharacterBodies(bodies, settings, comp);
      sampleRigidBodies(bodies, startTime, comp, settings, false);
    }

    for (var frame = 1; frame <= totalFrames; frame += 1) {
      var time = startTime + frame * dt;
      var substeps = settings.interactWithEachOther ? 6 : 2;
      var stepDt = dt / substeps;

      for (var step = 0; step < substeps; step += 1) {
        for (var b = 0; b < bodies.length; b += 1) {
          var current = bodies[b];
          if (current.sleeping) {
            continue;
          }
          current.vy += settings.gravity * stepDt;
          current.x += current.vx * stepDt;
          current.y += current.vy * stepDt;
          current.rotation += current.angularVelocity * stepDt;
          current.age += stepDt;
        }

        if (settings.boundedByComp) {
          for (var preBoundIndex = 0; preBoundIndex < bodies.length; preBoundIndex += 1) {
            resolveCompBounds(bodies[preBoundIndex], comp, settings);
          }
        }

        if (settings.interactWithEachOther) {
          var passes = Math.min(8, Math.max(2, bodies.length));
          for (var pass = 0; pass < passes; pass += 1) {
            var collisionCount = 0;
            var broadphasePairs = getBroadphasePairs(bodies);
            for (var pairIndex = 0; pairIndex < broadphasePairs.length; pairIndex += 1) {
              if (resolveBodyCollision(broadphasePairs[pairIndex][0], broadphasePairs[pairIndex][1], settings)) {
                collisionCount += 1;
              }
            }
            if (settings.boundedByComp) {
              for (var passBoundIndex = 0; passBoundIndex < bodies.length; passBoundIndex += 1) {
                resolveCompBounds(bodies[passBoundIndex], comp, settings);
              }
            }
            if (collisionCount === 0) {
              break;
            }
          }
        }

        if (settings.boundedByComp) {
          for (var boundIndex = 0; boundIndex < bodies.length; boundIndex += 1) {
            resolveCompBounds(bodies[boundIndex], comp, settings);
          }
        }

        for (var sleepIndex = 0; sleepIndex < bodies.length; sleepIndex += 1) {
          dampBodyMotion(bodies[sleepIndex], settings, stepDt);
          updateBodySleepState(bodies[sleepIndex], comp, settings);
        }
      }

      var settled = areAllBodiesSleeping(bodies);
      if (settled || frame === totalFrames || frame % settings.keyEvery === 0) {
        sampleRigidBodies(bodies, time, comp, settings);
      }
      if (settled) {
        break;
      }
    }

    var lastBakeTime = startTime;
    for (var bakeIndex = 0; bakeIndex < bodies.length; bakeIndex += 1) {
      var bakedBody = bodies[bakeIndex];
      if (bakedBody.samples.length > 0) {
        lastBakeTime = Math.max(lastBakeTime, bakedBody.samples[bakedBody.samples.length - 1].time);
      }
      bakeRigidBodySamples(bakedBody);
      try {
        bakedBody.layer.outPoint = Math.max(bakedBody.layer.outPoint, lastBakeTime + comp.frameDuration);
      } catch (bodyOutPointError) {}
      bakedBody.layer.motionBlur = true;
      if (markLayers !== false) {
        markLayerAsPhysics(bakedBody.layer, settings);
      }
    }
    try {
      comp.duration = Math.max(comp.duration, lastBakeTime + comp.frameDuration);
    } catch (compDurationError) {}
    comp.motionBlur = true;

    return "OK: Baked rigid body simulation to " + bodies.length + " layer(s).";
  }

  function applyRigidBodySimulation(comp, settings) {
    return applyRigidBodySimulationToLayers(comp, requireSelectedLayers(comp), settings, true);
  }

  function applyTextExplodeOut(comp, payload) {
    var textLayer = getTextLayer(comp);
    if (!textLayer) {
      throw new Error("No text layer found in comp.");
    }

    var characterCount = splitTextLayerCharacters(comp);
    var characterLayers = getSelectedLayers(comp);
    if (!characterLayers.length) {
      throw new Error("Could not create character layers.");
    }

    var settings = normalizeRigidBodySettings(comp, {
      startSec: payload.startSec,
      duration: isNaN(payload.duration) ? 1.8 : Number(payload.duration),
      gravity: isNaN(payload.gravity) ? 1800 : Number(payload.gravity),
      bounce: isNaN(payload.bounce) ? 0.2 : Number(payload.bounce),
      friction: isNaN(payload.friction) ? 0.58 : Number(payload.friction),
      characterScatter: isNaN(payload.characterScatter) ? 1050 : Number(payload.characterScatter),
      keyEvery: isNaN(payload.keyEvery) ? 1 : Number(payload.keyEvery),
      boundedByComp: payload.boundedByComp === true,
      interactWithEachOther: payload.interactWithEachOther !== false,
      explodeOutward: true,
      collisionScale: 1.38,
      adaptiveDuration: false
    });

    var result = applyRigidBodySimulationToLayers(comp, characterLayers, settings, true);
    if (result.indexOf("OK:") !== 0) {
      return result;
    }
    return "OK: Split text into " + characterCount + " character layer(s) and baked outward explosion.";
  }

  function rerenderPhysics() {
    var comp = getActiveComp();
    if (!comp) {
      return stringifyPayload({ ok: false, message: "Error: No active comp.", signature: "" });
    }

    var physics = getPhysicsLayers(comp);
    if (!physics.layers.length || !physics.settings) {
      return stringifyPayload({ ok: false, message: "Error: No physics-marked layers found.", signature: "" });
    }

    try {
      app.beginUndoGroup("rdzTools Physics Auto Refresh");
      var message = applyRigidBodySimulationToLayers(comp, physics.layers, physics.settings, true);
      return stringifyPayload({
        ok: message.indexOf("OK:") === 0,
        message: message,
        signature: parsePayload(getPhysicsSignature()).signature || ""
      });
    } catch (error) {
      return stringifyPayload({ ok: false, message: "Error: " + error.message, signature: "" });
    } finally {
      try { app.endUndoGroup(); } catch (endError) {}
    }
  }

  function rerenderSelectedPhysics() {
    var comp = getActiveComp();
    if (!comp) {
      return stringifyPayload({ ok: false, message: "Error: No active comp." });
    }

    var selectedPhysics = getSelectedPhysicsLayers(comp);
    if (!selectedPhysics.allSelectedArePhysics || !selectedPhysics.layers.length || !selectedPhysics.settings) {
      return stringifyPayload({ ok: false, message: "Error: Select only physics-tagged layers." });
    }

    try {
      app.beginUndoGroup("rdzTools Physics Re-render");
      var message = applyRigidBodySimulationToLayers(comp, selectedPhysics.layers, selectedPhysics.settings, true);
      return stringifyPayload({
        ok: message.indexOf("OK:") === 0,
        message: message
      });
    } catch (error) {
      return stringifyPayload({ ok: false, message: "Error: " + error.message });
    } finally {
      try { app.endUndoGroup(); } catch (endError) {}
    }
  }

  function normalizeBounceSettings(payload) {
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

  function addOrGetNamedEffect(layer, matchName, effectName) {
    var effects = layer.property("ADBE Effect Parade");
    if (!effects) {
      throw new Error("Layer does not support effects.");
    }

    for (var i = 1; i <= effects.numProperties; i += 1) {
      if (effects.property(i).name === effectName) {
        return effects.property(i);
      }
    }

    var effect = effects.addProperty(matchName);
    effect.name = effectName;
    return effect;
  }

  function setSliderControl(layer, name, value) {
    var slider = addOrGetNamedEffect(layer, "ADBE Slider Control", name);
    try {
      slider.property(1).setValue(value);
    } catch (sliderError) {}
    return slider;
  }

  function ensureBounceControls(layer, settings) {
    setSliderControl(layer, "rdzBounce", settings.amount);
    setSliderControl(layer, "rdzBounce Duration", settings.duration);
    setSliderControl(layer, "rdzBounce Chaos", settings.chaos);
  }

  function buildBounceExpression() {
    return "// rdzTools Bounce\n" +
      "var amount = effect(\"rdzBounce\")(\"Slider\") / 100;\n" +
      "var duration = Math.max(0.001, effect(\"rdzBounce Duration\")(\"Slider\"));\n" +
      "var chaos = effect(\"rdzBounce Chaos\")(\"Slider\") / 100;\n" +
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
      "    var progress = Math.min(1, Math.max(0, t / duration));\n" +
      "    var tail = 1 - progress;\n" +
      "    var envelope = tail * tail * (3 - 2 * tail);\n" +
      "    var bounce = v * amount * envelope * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n" +
      "    value + bounce;\n" +
      "  } else {\n" +
      "    value;\n" +
      "  }\n" +
      "} else {\n" +
      "  value;\n" +
      "}\n";
  }

  function applyBounceToLayers(layers, settings) {
    var applied = 0;
    var skipped = 0;
    var expression = buildBounceExpression();
    var targets = ["Position", "Scale", "Rotation"];

    for (var i = 0; i < layers.length; i += 1) {
      var layer = layers[i];

      try {
        ensureBounceControls(layer, settings);
      } catch (controlsError) {
        skipped += 1;
        continue;
      }

      var appliedToLayer = false;
      for (var targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
        var prop = getTransformProp(layer, targets[targetIndex]);
        if (!prop || prop.numKeys < 2) {
          continue;
        }

        try {
          prop.expression = expression;
          prop.expressionEnabled = true;
          applied += 1;
          appliedToLayer = true;
        } catch (expressionError) {}
      }

      if (!appliedToLayer) {
        skipped += 1;
      }
    }

    if (applied === 0) {
      return "Error: No selected layers had 2+ Position, Scale, or Rotation keyframes.";
    }

    var message = "OK: rdzBounce controls added and expression applied to " + applied + " propert" + (applied === 1 ? "y" : "ies") + ".";
    if (skipped > 0) {
      message += " Skipped " + skipped + ".";
    }
    return message;
  }

  function applyBounce(comp, settings) {
    var selectedLayers = getSelectedLayers(comp);
    if (!selectedLayers.length) {
      return "Error: Select at least one layer with keyframes.";
    }

    return applyBounceToLayers(selectedLayers, settings);
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
      if (toolId === "textExplodeOut") {
        return applyTextExplodeOut(comp, payload);
      }

      if (toolId === "wordBlurRight" || toolId === "wordBlurLeft" || toolId === "wordBlurUp" || toolId === "wordBlurDown" || toolId === "wordRotateIn" || toolId === "charBounceIn" || toolId === "wordBlurOutRight" || toolId === "wordBlurOutLeft" || toolId === "wordBlurOutUp" || toolId === "wordBlurOutDown" || toolId === "wordRotateOut" || toolId === "charShrinkOut" || toolId === "charScatterOut") {
        var textLayer = getTextLayer(comp);
        if (!textLayer) {
          throw new Error("No text layer found in comp.");
        }

        var wordSettings = normalizeWordSettings(comp, payload);
        if (toolId === "charShrinkOut") {
          wordSettings.scaleStart = isNaN(payload.scaleStart) ? 8 : Number(payload.scaleStart);
          applyCharacterOutAnimation(textLayer, comp, wordSettings, { scaleEnd: wordSettings.scaleStart, scatter: false });
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
        }

        if (toolId === "charScatterOut") {
          wordSettings.rotationStart = isNaN(payload.rotationStart) ? 35 : Number(payload.rotationStart);
          applyCharacterOutAnimation(textLayer, comp, wordSettings, { scaleEnd: null, scatter: true, rotationEnd: wordSettings.rotationStart });
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
        }

        if (toolId === "charBounceIn") {
          wordSettings.scaleStart = isNaN(payload.scaleStart) ? 18 : Number(payload.scaleStart);
          wordSettings.scaleOvershoot = isNaN(payload.scaleOvershoot) ? 148 : Number(payload.scaleOvershoot);
          applyCharacterBounceAnimation(textLayer, comp, wordSettings);
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
        }

        var options = {};

        if (toolId === "wordBlurRight") { options = { offsetX: wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurLeft") { options = { offsetX: -wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurUp") { options = { offsetX: 0, offsetY: wordSettings.distance }; }
        if (toolId === "wordBlurDown") { options = { offsetX: 0, offsetY: -wordSettings.distance }; }
        if (toolId === "wordRotateIn") {
          wordSettings.rotationStart = isNaN(payload.rotationStart) ? -26 : Number(payload.rotationStart);
          applyWordRotateBounceAnimation(textLayer, comp, wordSettings);
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
        }

        if (toolId === "wordBlurOutRight") { options = { offsetX: wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurOutLeft") { options = { offsetX: -wordSettings.distance, offsetY: 0 }; }
        if (toolId === "wordBlurOutUp") { options = { offsetX: 0, offsetY: -wordSettings.distance }; }
        if (toolId === "wordBlurOutDown") { options = { offsetX: 0, offsetY: wordSettings.distance }; }
        if (toolId === "wordRotateOut") {
          wordSettings.rotationStart = isNaN(payload.rotationStart) ? 24 : Number(payload.rotationStart);
          applyWordOutAnimation(textLayer, comp, wordSettings, { offsetX: wordSettings.distance, offsetY: 0, rotationEnd: wordSettings.rotationStart });
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
        }
        if (toolId === "wordBlurOutRight" || toolId === "wordBlurOutLeft" || toolId === "wordBlurOutUp" || toolId === "wordBlurOutDown") {
          applyWordOutAnimation(textLayer, comp, wordSettings, options);
          return "OK: Applied " + toolId + " to " + textLayer.name + ".";
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

      if (toolId === "layerFadeUp" || toolId === "layerBounceUp" || toolId === "layerSlideRight" || toolId === "layerSlideLeft" || toolId === "layerRotatePop") {
        var motionLayers = requireSelectedLayers(comp);
        var layerSettings = normalizeLayerSettings(comp, payload);

        for (var m = 0; m < motionLayers.length; m += 1) {
          if (toolId === "layerFadeUp") {
            applyLayerEntrance(motionLayers[m], comp, layerSettings, { offsetX: 0, offsetY: layerSettings.distance });
          } else if (toolId === "layerBounceUp") {
            applyLayerBounceUp(motionLayers[m], comp, layerSettings);
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

        if (toolId === "layerBounceUp") {
          var bounceMessage = applyBounceToLayers(motionLayers, normalizeBounceSettings({}));
          if (bounceMessage.indexOf("OK:") !== 0) {
            return bounceMessage;
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

      if (toolId === "bounce") {
        return applyBounce(comp, normalizeBounceSettings(payload));
      }

      if (toolId === "rigidBodySim") {
        return applyRigidBodySimulation(comp, normalizeRigidBodySettings(comp, payload));
      }

      if (toolId === "anchorTopLeft" || toolId === "anchorTop" || toolId === "anchorTopRight" || toolId === "anchorLeft" || toolId === "anchorRight" || toolId === "anchorBottomLeft" || toolId === "anchorBottom" || toolId === "anchorBottomRight") {
        var anchorTargets = {
          anchorTopLeft: [0, 0],
          anchorTop: [0.5, 0],
          anchorTopRight: [1, 0],
          anchorLeft: [0, 0.5],
          anchorRight: [1, 0.5],
          anchorBottomLeft: [0, 1],
          anchorBottom: [0.5, 1],
          anchorBottomRight: [1, 1]
        };
        var target = anchorTargets[toolId];
        var targetAnchorLayers = applyToSelectedLayers(comp, function (layer) {
          moveAnchorPoint(layer, target[0], target[1]);
        });
        return "OK: Moved anchors on " + targetAnchorLayers.length + " layer(s).";
      }

      if (toolId === "precomposeSelected") {
        var precomposedCount = precomposeSelectedLayers(comp);
        return "OK: Precomposed " + precomposedCount + " selected layer(s).";
      }

      if (toolId === "centerInComp") {
        var centeredLayers = applyToSelectedLayers(comp, function (layer) {
          centerLayerInComp(layer, comp);
        });
        return "OK: Centered " + centeredLayers.length + " layer(s) in comp.";
      }

      if (toolId === "saveFrame") {
        var savedPath = saveCurrentFrame(comp);
        if (!savedPath) {
          return "OK: Save frame canceled.";
        }
        return "OK: Saved frame to " + savedPath + ".";
      }

      if (toolId === "centerAnchor") {
        var anchorLayers = applyToSelectedLayers(comp, centerAnchorPoint);
        return "OK: Centered anchors on " + anchorLayers.length + " layer(s).";
      }

      if (toolId === "createControlNull") {
        createControlNull(comp);
        return "OK: Created control null.";
      }

      if (toolId === "fitToComp") {
        var fitLayers = applyToSelectedLayers(comp, function (layer) {
          fitLayerToComp(layer, comp);
        });
        return "OK: Fit " + fitLayers.length + " layer(s) to comp.";
      }

      if (toolId === "freezeFrame") {
        var freezeLayers = applyToSelectedLayers(comp, function (layer) {
          freezeLayerAtCurrentFrame(layer, comp);
        });
        return "OK: Froze " + freezeLayers.length + " layer(s) at current frame.";
      }

      if (toolId === "sequenceLayers") {
        var sequencedCount = sequenceSelectedLayers(comp);
        return "OK: Sequenced " + sequencedCount + " layer(s).";
      }

      if (toolId === "duplicateLayers") {
        var duplicateCount = duplicateSelectedLayers(comp);
        return "OK: Duplicated " + duplicateCount + " layer(s).";
      }

      if (toolId === "splitLayers") {
        var splitCount = splitSelectedLayers(comp);
        return "OK: Split " + splitCount + " layer(s).";
      }

      if (toolId === "splitTextCharacters") {
        var charCount = splitTextLayerCharacters(comp);
        return "OK: Split text into " + charCount + " character layer(s).";
      }

      if (toolId === "reverseLayers") {
        var reversedCount = reverseSelectedLayers(comp);
        return "OK: Toggled time reverse on " + reversedCount + " layer(s).";
      }

      if (toolId === "clearExpressions") {
        var clearedCount = clearTransformExpressions(comp);
        return "OK: Cleared " + clearedCount + " transform expression(s).";
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

  function applyGraphPreset(rawPayload) {
    var comp = getActiveComp();
    if (!comp) {
      return "Error: No active comp.";
    }

    var coords = normalizeGraphCoords(parsePayload(rawPayload));
    var selectedProperties = comp.selectedProperties || [];
    var propertyCount = 0;
    var pairCount = 0;

    app.beginUndoGroup("rdzTools Graph");

    try {
      for (var i = 0; i < selectedProperties.length; i += 1) {
        var prop = selectedProperties[i];
        if (!prop || !prop.numKeys || prop.numKeys < 2 || !prop.setTemporalEaseAtKey) {
          continue;
        }

        var appliedPairs = applyGraphEaseToProperty(prop, coords);
        if (appliedPairs > 0) {
          propertyCount += 1;
          pairCount += appliedPairs;
        }
      }

      if (propertyCount === 0) {
        return "Error: Select at least two keyframes on one animated property.";
      }

      return "OK: Applied graph to " + propertyCount + " propert" + (propertyCount === 1 ? "y" : "ies") + " across " + pairCount + " keyframe pair" + (pairCount === 1 ? "" : "s") + ".";
    } catch (error) {
      return "Error: " + error.message;
    } finally {
      app.endUndoGroup();
    }
  }

  function readGraphPreset() {
    var comp = getActiveComp();
    if (!comp) {
      return '{"ok":false,"message":"Error: No active comp."}';
    }

    var selectedProperties = comp.selectedProperties || [];

    for (var i = 0; i < selectedProperties.length; i += 1) {
      var prop = selectedProperties[i];
      if (!prop || !prop.numKeys || prop.numKeys < 2) {
        continue;
      }

      var keys = getGraphTargetKeys(prop);
      if (keys.length < 2) {
        continue;
      }

      var coords = graphCoordsFromProperty(prop, keys[0], keys[1]);
      if (coords) {
        return '{"ok":true,"coords":[' + coords.join(",") + '],"message":"OK: Read graph from selected keyframes."}';
      }
    }

    return '{"ok":false,"message":"Error: Select exactly two or more keyframes on an animated property."}';
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
    applyGraphPreset: applyGraphPreset,
    applyTool: applyTool,
    getPhysicsSignature: getPhysicsSignature,
    getSelectedPhysicsState: getSelectedPhysicsState,
    getSelectionSummary: getSelectionSummary,
    ping: ping,
    readGraphPreset: readGraphPreset,
    rerenderPhysics: rerenderPhysics,
    rerenderSelectedPhysics: rerenderSelectedPhysics
  };
}());
