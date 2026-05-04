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

  function getTextLayer(comp) {
    var selected = comp.selectedLayers || [];
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

  function key2(prop, t0, v0, t1, v1) {
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
    setWordEase(prop);
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
      try {
        advanced.property(1).setValue(1);
      } catch (unitsError) {}
      try {
        advanced.property(2).setValue(3);
      } catch (basedOnError) {}
      try {
        advanced.property(3).setValue(1);
      } catch (modeError) {}
      try {
        advanced.property(4).setValue(100);
      } catch (amountError) {}
      try {
        advanced.property(5).setValue(1);
      } catch (shapeError) {}
      try {
        advanced.property(6).setValue(0);
      } catch (smoothnessError) {}
    }
  }

  function normalizeAnimationSettings(comp, payload) {
    var wordDur = isNaN(payload.wordDur) ? 0.5 : Number(payload.wordDur);
    var stagger = isNaN(payload.stagger) ? 0.2 : Number(payload.stagger);
    var distance = isNaN(payload.distance) ? 40 : Number(payload.distance);
    var blurAmt = isNaN(payload.blurAmt) ? 8 : Number(payload.blurAmt);
    var startRaw = payload.startSec;
    var startSec = comp.time;

    if (typeof startRaw === "number") {
      startSec = startRaw;
    } else if (typeof startRaw === "string") {
      var normalized = startRaw.toLowerCase().replace(/^\s+|\s+$/g, "");
      if (normalized !== "" && normalized !== "cursor" && normalized !== "playhead" && normalized !== "current") {
        var parsed = parseFloat(startRaw);
        if (!isNaN(parsed)) {
          startSec = parsed;
        }
      }
    }

    return {
      wordDur: Math.max(0.05, Math.min(2.0, wordDur)),
      stagger: Math.max(0.0, Math.min(5.0, stagger)),
      startSec: startSec,
      distance: distance,
      blurAmt: blurAmt,
      blurEnabled: payload.blurEnabled !== false
    };
  }

  function applyWordAnimation(layer, comp, settings, direction) {
    removeOldTextAnimators(layer);

    var textProps = layer.property("ADBE Text Properties");
    var animators = textProps.property("ADBE Text Animators");
    var srcText = textProps.property("ADBE Text Document").value.text;
    var words = srcText.match(/\S+/g);
    var numWords = words ? words.length : 1;

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

      var selectors = animator.property("ADBE Text Selectors");
      var rangeSelector = selectors.addProperty("ADBE Text Selector");
      if (!rangeSelector) {
        rangeSelector = selectors.addProperty("Range Selector");
      }
      rangeSelector.name = "Word " + (i + 1);
      setSelectorToWord(rangeSelector, i, numWords);

      var t0 = settings.startSec + (i * settings.stagger);
      var t1 = t0 + settings.wordDur;
      var startPos = direction === "up" ? [0, settings.distance, 0] : [settings.distance, 0, 0];

      if (posProp) {
        try {
          key2(posProp, t0, startPos, t1, [0, 0, 0]);
        } catch (position3dError) {
          key2(posProp, t0, [startPos[0], startPos[1]], t1, [0, 0]);
        }
      }
      if (opacityProp) {
        key2(opacityProp, t0, 0, t1, 100);
      }
      if (settings.blurEnabled && blurProp) {
        try {
          key2(blurProp, t0, [settings.blurAmt, settings.blurAmt], t1, [0, 0]);
        } catch (blur2dError) {
          try {
            key2(blurProp, t0, settings.blurAmt, t1, 0);
          } catch (blur1dError) {}
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
    return null;
  }

  function normalizeScalePopSettings(comp, payload) {
    var startRaw = payload.startSec;
    if (typeof startRaw === "number" && !isNaN(startRaw)) {
      return { startSec: startRaw };
    }

    if (typeof startRaw === "string") {
      var normalized = startRaw.toLowerCase().replace(/^\s+|\s+$/g, "");
      if (normalized !== "" && normalized !== "cursor" && normalized !== "playhead" && normalized !== "current") {
        var parsed = parseFloat(startRaw);
        if (!isNaN(parsed)) {
          return { startSec: parsed };
        }
      }
    }

    return { startSec: comp.time };
  }

  function applyLayerScalePop(layer, comp, settings) {
    var scaleProp = getTransformProp(layer, "Scale");
    var opacityProp = getTransformProp(layer, "Opacity");
    if (!scaleProp) {
      throw new Error("Could not find Scale property.");
    }
    if (!opacityProp) {
      throw new Error("Could not find Opacity property.");
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
      try {
        scaleProp.setInterpolationTypeAtKey(scaleKey, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
      } catch (scaleInterpolationError) {}
    }

    for (var opacityKey = Math.max(1, opacityProp.numKeys - 1); opacityKey <= opacityProp.numKeys; opacityKey += 1) {
      try {
        opacityProp.setInterpolationTypeAtKey(opacityKey, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
      } catch (opacityInterpolationError) {}
    }

    layer.motionBlur = true;
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
    if (!comp.selectedLayers || comp.selectedLayers.length === 0) {
      return "Error: Select at least one layer with keyframes.";
    }

    var applied = 0;
    var skipped = 0;
    var expression = buildBouceExpression(settings);

    for (var i = 0; i < comp.selectedLayers.length; i += 1) {
      var layer = comp.selectedLayers[i];
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

  function applyTool(toolId, rawPayload) {
    var comp = getActiveComp();
    if (!comp) {
      return "Error: No active comp.";
    }

    var payload = parsePayload(rawPayload);
    app.beginUndoGroup("rdzTools " + toolId);

    try {
      if (toolId === "wordBlurRight") {
        var rightLayer = getTextLayer(comp);
        if (!rightLayer) {
          throw new Error("No text layer found in comp.");
        }
        applyWordAnimation(rightLayer, comp, normalizeAnimationSettings(comp, payload), "right");
        return "OK: Applied Word Blur In From Right to " + rightLayer.name + ".";
      }

      if (toolId === "wordBlurUp") {
        var upLayer = getTextLayer(comp);
        if (!upLayer) {
          throw new Error("No text layer found in comp.");
        }
        applyWordAnimation(upLayer, comp, normalizeAnimationSettings(comp, payload), "up");
        return "OK: Applied Word Blur Up From Bottom to " + upLayer.name + ".";
      }

      if (toolId === "layerScalePop") {
        var scaleLayer = getTextLayer(comp);
        if (!scaleLayer) {
          throw new Error("No text layer found in comp.");
        }
        applyLayerScalePop(scaleLayer, comp, normalizeScalePopSettings(comp, payload));
        return "OK: Applied Layer Scale Pop to " + scaleLayer.name + ".";
      }

      if (toolId === "bouce") {
        return applyBouce(comp, normalizeBouceSettings(payload));
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

    var selection = comp.selectedLayers || [];
    var textLayer = getTextLayer(comp);

    if (!selection.length) {
      return textLayer
        ? 'Active comp "' + comp.name + '" with no selected layers. First text layer: "' + textLayer.name + '".'
        : 'Active comp "' + comp.name + '" with no selected layers.';
    }

    var summary = 'Active comp "' + comp.name + '" with ' + selection.length + " selected layer(s).";
    if (textLayer) {
      summary += ' Text target: "' + textLayer.name + '".';
    }
    return summary;
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
