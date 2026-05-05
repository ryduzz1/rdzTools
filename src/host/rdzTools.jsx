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

      return [
        Math.max(0, Math.min(1, outInfluence / 100)),
        0,
        Math.max(0, Math.min(1, 1 - (inInfluence / 100))),
        1
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

  function applyBounce(comp, settings) {
    var selectedLayers = getSelectedLayers(comp);
    if (!selectedLayers.length) {
      return "Error: Select at least one layer with keyframes.";
    }

    var applied = 0;
    var skipped = 0;
    var expression = buildBounceExpression();
    var targets = ["Position", "Scale", "Rotation"];

    for (var i = 0; i < selectedLayers.length; i += 1) {
      var layer = selectedLayers[i];

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
      if (toolId === "wordBlurRight" || toolId === "wordBlurLeft" || toolId === "wordBlurUp" || toolId === "wordBlurDown" || toolId === "wordRotateIn" || toolId === "charBounceIn") {
        var textLayer = getTextLayer(comp);
        if (!textLayer) {
          throw new Error("No text layer found in comp.");
        }

        var wordSettings = normalizeWordSettings(comp, payload);
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

      if (toolId === "bounce") {
        return applyBounce(comp, normalizeBounceSettings(payload));
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
    getSelectionSummary: getSelectionSummary,
    ping: ping,
    readGraphPreset: readGraphPreset
  };
}());
