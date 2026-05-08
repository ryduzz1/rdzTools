const SETTINGS_KEY = "rdzTools.toolSettings.v1";
const GLOBAL_SETTINGS_KEY = "rdzTools.globalSettings.v1";
const FAVORITES_KEY = "rdzTools.favorites.v1";
const FAVORITES_HINT_KEY = "rdzTools.favoritesHintDismissed.v1";
const GRAPH_KEY = "rdzTools.graph.v1";
const tabDefinitions = [
  { id: "graphs", label: "Graphs" },
  { id: "presets", label: "Presets" },
  { id: "tools", label: "Tools" }
];

const tools = [
  {
    id: "wordIn",
    group: "Text In",
    title: "Word In",
    blurb: "Each word slides in from an editable direction with opacity.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each word moves and how far apart the words fire.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.2" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Choose where the words come from, then dial in distance and optional blur.",
        fields: [
          { id: "direction", label: "Direction", type: "select", options: ["Right", "Left", "Bottom", "Top"], defaultValue: "Right" },
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordRotateIn",
    group: "Text In",
    title: "Word Rotate In",
    blurb: "Each word swings into place with rotation, offset, and opacity.",
    sections: [
      {
        title: "Timing",
        description: "Useful when you want a slightly more characterful title entrance.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.4" },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.16" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Offset, rotate, and optionally blur each word into place.",
        fields: [
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "30" },
          { id: "rotationStart", label: "Starting rotation (deg)", type: "number", defaultValue: "-26" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "5", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "charIn",
    group: "Text In",
    title: "Character In",
    blurb: "Each character slides in from an editable direction with opacity.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each character moves and how far apart the characters fire.",
        fields: [
          { id: "wordDur", label: "Character duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between characters (sec)", type: "number", defaultValue: "0.04" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Choose where the characters come from, then dial in distance and optional blur.",
        fields: [
          { id: "direction", label: "Direction", type: "select", options: ["Right", "Left", "Bottom", "Top"], defaultValue: "Right" },
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable character blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordBounceIn",
    group: "Text In",
    title: "Word Bounce In",
    blurb: "Each word slides in from an editable direction, overshoots, and settles.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each word bounces in and how far apart the words fire.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.58", hint: "Longer values give the bounce more room to settle." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.16" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Same directional controls as Word In, with a bouncy settle.",
        fields: [
          { id: "direction", label: "Direction", type: "select", options: ["Right", "Left", "Bottom", "Top"], defaultValue: "Right" },
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "48" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "6", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "charBounceIn",
    group: "Text In",
    title: "Character Bounce In",
    blurb: "Each character pops in with a quick scale bounce and ease-out settle.",
    sections: [
      {
        title: "Timing",
        description: "Use this for punchier type where you want each character to arrive with a little spring.",
        fields: [
          { id: "wordDur", label: "Character duration (sec)", type: "number", defaultValue: "0.32" },
          { id: "stagger", label: "Stagger between characters (sec)", type: "number", defaultValue: "0.035" }
        ]
      },
      {
        title: "Bounce",
        description: "Smaller start scale, bigger overshoot, then a fast ease-out into the final size.",
        fields: [
          { id: "scaleStart", label: "Starting scale (%)", type: "number", defaultValue: "18" },
          { id: "scaleOvershoot", label: "Overshoot scale (%)", type: "number", defaultValue: "148" }
        ]
      }
    ]
  },
  {
    id: "wordOut",
    group: "Text Out",
    title: "Word Out",
    blurb: "Each word slides out in an editable direction and fades away.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each word exits and how far apart the words fire.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.42", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.12" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Choose where the words go, then dial in distance and optional blur.",
        fields: [
          { id: "direction", label: "Direction", type: "select", options: ["Right", "Left", "Up", "Down"], defaultValue: "Right" },
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "46" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "End blur amount (px)", type: "number", defaultValue: "10", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordRotateOut",
    group: "Text Out",
    title: "Word Rotate Out",
    blurb: "Each word rotates and slides away while fading out.",
    sections: [
      {
        title: "Timing",
        description: "A more stylized word exit with rotation and offset.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.38" },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.1" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Set exit offset, rotation, and optional blur.",
        fields: [
          { id: "distance", label: "Slide distance px", type: "number", defaultValue: "34" },
          { id: "rotationStart", label: "Ending rotation (deg)", type: "number", defaultValue: "24" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "End blur amount (px)", type: "number", defaultValue: "6", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "charShrinkOut",
    group: "Text Out",
    title: "Character Shrink Out",
    blurb: "Each character fades and scales down in sequence.",
    sections: [
      {
        title: "Timing",
        description: "Control the per-character exit speed.",
        fields: [
          { id: "wordDur", label: "Character duration (sec)", type: "number", defaultValue: "0.28" },
          { id: "stagger", label: "Stagger between characters (sec)", type: "number", defaultValue: "0.025" }
        ]
      },
      {
        title: "Scale",
        description: "Set the final character scale.",
        fields: [
          { id: "scaleStart", label: "Ending scale (%)", type: "number", defaultValue: "8" }
        ]
      }
    ]
  },
  {
    id: "charScatterOut",
    group: "Text Out",
    title: "Character Scatter Out",
    blurb: "Characters scatter in alternating directions with fade and rotation.",
    sections: [
      {
        title: "Timing",
        description: "A punchier character exit for energetic type.",
        fields: [
          { id: "wordDur", label: "Character duration (sec)", type: "number", defaultValue: "0.34" },
          { id: "stagger", label: "Stagger between characters (sec)", type: "number", defaultValue: "0.02" }
        ]
      },
      {
        title: "Scatter",
        description: "Control the spread, spin, and optional blur.",
        fields: [
          { id: "distance", label: "Scatter distance px", type: "number", defaultValue: "55" },
          { id: "rotationStart", label: "Rotation amount (deg)", type: "number", defaultValue: "35" },
          { id: "blurEnabled", label: "Enable character blur", type: "checkbox", defaultValue: false },
          { id: "blurAmt", label: "End blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "textExplodeOut",
    group: "Text Out",
    title: "Text Explode Out",
    blurb: "Splits text into character layers, then launches them outward with rigid body physics.",
    sections: [
      {
        title: "Explosion",
        description: "Bakes the character split and outward rigid body motion from the current time.",
        fields: [
          { id: "duration", label: "Max duration (sec)", type: "number", defaultValue: "1.8" },
          { id: "characterScatter", label: "Outward momentum (px/sec)", type: "number", defaultValue: "1050" },
          { id: "gravity", label: "Gravity (px/sec/sec)", type: "number", defaultValue: "1800" },
          { id: "bounce", label: "Bounce (0-1)", type: "number", defaultValue: "0.2" },
          { id: "friction", label: "Friction (0-1)", type: "number", defaultValue: "0.58" },
          { id: "keyEvery", label: "Key every N frames", type: "number", defaultValue: "1" }
        ]
      },
      {
        title: "Bounds And Collisions",
        description: "Keep comp-edge bounds off by default so letters can leave frame.",
        fields: [
          { id: "boundedByComp", label: "Bound by comp edges", type: "checkbox", defaultValue: false },
          { id: "interactWithEachOther", label: "Characters interact with each other", type: "checkbox", defaultValue: true }
        ]
      }
    ]
  },
  {
    id: "layerScalePop",
    group: "Layer In",
    title: "Layer glitch scale",
    blurb: "Whole-layer pop with a hidden frame and frame-tight squash.",
    sections: [
      {
        title: "Timing",
        description: "The pop starts from the global animation start. The rest is built on consecutive frames.",
        fields: []
      }
    ]
  },
  {
    id: "layerFadeUp",
    group: "Layer In",
    title: "Layer fade",
    blurb: "Moves selected layers in from an editable direction with opacity.",
    sections: [
      {
        title: "Timing",
        description: "A straightforward layer entrance for solids, shapes, text, and comps.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.45" }
        ]
      },
      {
        title: "Motion",
        description: "Choose where the layer starts, then control how far it moves into place.",
        fields: [
          { id: "direction", label: "Direction", type: "select", options: ["Bottom", "Top", "Right", "Left"], defaultValue: "Bottom" },
          { id: "distance", label: "Offset (px)", type: "number", defaultValue: "40" }
        ]
      }
    ]
  },
  {
    id: "layerBounceUp",
    group: "Layer In",
    title: "Layer bounce up",
    blurb: "Adds a tight upward position move, then applies the shared rdzBounce effect.",
    sections: [
      {
        title: "Timing",
        description: "Creates two close linear keyframes from the global animation start.",
        fields: []
      },
      {
        title: "Motion",
        description: "Control how far the layer starts below its final position.",
        fields: [
          { id: "distance", label: "Vertical offset (px)", type: "number", defaultValue: "70" }
        ]
      }
    ]
  },
  {
    id: "layerSlideRight",
    group: "Layer In",
    title: "Layer slide in from right",
    blurb: "Moves selected layers in horizontally from the right with opacity.",
    sections: [
      {
        title: "Timing",
        description: "A fast horizontal entrance for UI, lower thirds, or cards.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" }
        ]
      },
      {
        title: "Motion",
        description: "Control how far the layer starts to the right.",
        fields: [
          { id: "distance", label: "Horizontal offset (px)", type: "number", defaultValue: "110" }
        ]
      }
    ]
  },
  {
    id: "layerSlideLeft",
    group: "Layer In",
    title: "Layer slide in from left",
    blurb: "Moves selected layers in horizontally from the left with opacity.",
    sections: [
      {
        title: "Timing",
        description: "Pairs well with the right-side version for alternating layouts.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" }
        ]
      },
      {
        title: "Motion",
        description: "Control how far the layer starts to the left.",
        fields: [
          { id: "distance", label: "Horizontal offset (px)", type: "number", defaultValue: "110" }
        ]
      }
    ]
  },
  {
    id: "layerRotatePop",
    group: "Layer In",
    title: "Layer rotate pop",
    blurb: "Adds a slight scale and rotation pop to selected layers.",
    sections: [
      {
        title: "Timing",
        description: "Useful for stickers, icons, and punchier graphic reveals.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.32" }
        ]
      },
      {
        title: "Shape",
        description: "Set how small and how rotated the layer starts.",
        fields: [
          { id: "scaleStart", label: "Starting scale (%)", type: "number", defaultValue: "82" },
          { id: "rotationStart", label: "Starting rotation (deg)", type: "number", defaultValue: "-12" }
        ]
      }
    ]
  },
  {
    id: "layerBlurFadeIn",
    group: "Layer In",
    title: "Layer blur fade in",
    blurb: "Adds a quick blur-and-opacity entrance to selected layers.",
    sections: [
      {
        title: "Timing",
        description: "A softer reveal for comps, graphics, and atmospheric elements.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" }
        ]
      },
      {
        title: "Style",
        description: "Set the starting blur intensity.",
        fields: [
          { id: "blurAmt", label: "Starting blur (px)", type: "number", defaultValue: "18" }
        ]
      }
    ]
  },
  {
    id: "lookSoftShadow",
    group: "Looks",
    title: "Soft shadow",
    blurb: "Adds a clean, modern shadow for shapes, type, and cards.",
    sections: [
      {
        title: "Shadow",
        description: "A balanced default shadow that gives flat layers more depth without getting muddy.",
        fields: [
          { id: "opacity", label: "Shadow opacity (%)", type: "number", defaultValue: "42" },
          { id: "distance", label: "Distance (px)", type: "number", defaultValue: "18" },
          { id: "softness", label: "Softness (px)", type: "number", defaultValue: "28" },
          { id: "angle", label: "Light angle (deg)", type: "number", defaultValue: "135" }
        ]
      }
    ]
  },
  {
    id: "lookLongShadow",
    group: "Looks",
    title: "Long shadow",
    blurb: "Pushes layers into a more graphic, directional shadow treatment.",
    sections: [
      {
        title: "Shadow",
        description: "Useful for bolder layouts, type treatments, and punchier graphic panels.",
        fields: [
          { id: "opacity", label: "Shadow opacity (%)", type: "number", defaultValue: "58" },
          { id: "distance", label: "Distance (px)", type: "number", defaultValue: "52" },
          { id: "softness", label: "Softness (px)", type: "number", defaultValue: "16" },
          { id: "angle", label: "Light angle (deg)", type: "number", defaultValue: "135" }
        ]
      }
    ]
  },
  {
    id: "lookLiquidGlass",
    group: "Looks",
    title: "Liquid glass",
    blurb: "Builds a blur adjustment layer plus a white overlay stroke duplicate.",
    sections: [
      {
        title: "Glass Stack",
        description: "Turns the selected shape into a blur adjustment, then duplicates it as a fill-free white overlay stroke.",
        fields: [
          { id: "blurAmt", label: "Fast box blur (px)", type: "number", defaultValue: "25" }
        ]
      }
    ]
  },
  {
    id: "anchorTopLeft",
    group: "Rigging",
    title: "Anchor Top Left",
    blurb: "Moves selected layer anchor points to the upper-left visual corner.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorTop",
    group: "Rigging",
    title: "Anchor Top",
    blurb: "Moves selected layer anchor points to the top-center edge.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorTopRight",
    group: "Rigging",
    title: "Anchor Top Right",
    blurb: "Moves selected layer anchor points to the upper-right visual corner.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorLeft",
    group: "Rigging",
    title: "Anchor Left",
    blurb: "Moves selected layer anchor points to the left-center edge.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorRight",
    group: "Rigging",
    title: "Anchor Right",
    blurb: "Moves selected layer anchor points to the right-center edge.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorBottomLeft",
    group: "Rigging",
    title: "Anchor Bottom Left",
    blurb: "Moves selected layer anchor points to the lower-left visual corner.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorBottom",
    group: "Rigging",
    title: "Anchor Bottom",
    blurb: "Moves selected layer anchor points to the bottom-center edge.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "anchorBottomRight",
    group: "Rigging",
    title: "Anchor Bottom Right",
    blurb: "Moves selected layer anchor points to the lower-right visual corner.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "precomposeSelected",
    group: "Rigging",
    title: "Pre-Comp",
    blurb: "Moves all selected layers into a new precomp.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "centerInComp",
    group: "Rigging",
    title: "Center In Comp",
    blurb: "Moves selected layers to the center of the active composition.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "saveFrame",
    group: "Rigging",
    title: "Save Frame",
    blurb: "Prompts for a file path, then saves the current comp frame as a PNG.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "bounce",
    group: "Rigging",
    title: "Bounce",
    blurb: "Adds editable rdzBounce controls to keyed transform properties.",
    sections: [
      {
        title: "Action",
        description: "No panel settings. This creates editable controls on the selected layer.",
        fields: []
      }
    ]
  },
  {
    id: "rigidBodySim",
    group: "Rigging",
    title: "Rigid Body Simulation",
    blurb: "Bakes selected layers as simple falling rigid bodies with optional comp bounds and layer collisions.",
    sections: [
      {
        title: "Simulation",
        description: "Bakes Position and Rotation keyframes from the current time.",
        fields: [
          { id: "safetyLimit", label: "Safety limit (sec)", type: "number", defaultValue: "15" },
          { id: "gravity", label: "Gravity (px/sec/sec)", type: "number", defaultValue: "1800" },
          { id: "bounce", label: "Bounce (0-1)", type: "number", defaultValue: "0.18" },
          { id: "friction", label: "Friction (0-1)", type: "number", defaultValue: "0.62" },
          { id: "keyEvery", label: "Key every N frames", type: "number", defaultValue: "2" }
        ]
      },
      {
        title: "Bounds And Collisions",
        description: "Use comp edges as walls and optionally collide selected layers with each other.",
        fields: [
          { id: "boundedByComp", label: "Bound by comp edges", type: "checkbox", defaultValue: true },
          { id: "interactWithEachOther", label: "Selected layers interact with each other", type: "checkbox", defaultValue: true }
        ]
      }
    ]
  },
  {
    id: "centerAnchor",
    group: "Rigging",
    title: "Center anchor",
    blurb: "Moves the anchor point to the visual center of selected layers.",
    sections: [
      {
        title: "Action",
        description: "No settings. This uses the current selected layers.",
        fields: []
      }
    ]
  },
  {
    id: "createControlNull",
    group: "Rigging",
    title: "Create control null",
    blurb: "Creates a centered control null in the active composition.",
    sections: [
      {
        title: "Action",
        description: "No settings. A new null is created immediately.",
        fields: []
      }
    ]
  },
  {
    id: "fitToComp",
    group: "Rigging",
    title: "Fit to comp",
    blurb: "Scales selected layers to fit inside the active comp.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "freezeFrame",
    group: "Rigging",
    title: "Freeze frame",
    blurb: "Holds the selected layers on the current frame.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "sequenceLayers",
    group: "Rigging",
    title: "Sequence layers",
    blurb: "Offsets selected layers one after another from the playhead.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "enableMotionBlur",
    group: "Rigging",
    title: "Enable motion blur",
    blurb: "Turns on motion blur for selected layers and the active composition.",
    sections: [
      {
        title: "Action",
        description: "No settings. Applies to the current selected layers.",
        fields: []
      }
    ]
  },
  {
    id: "duplicateLayers",
    group: "Rigging",
    title: "Duplicate layers",
    blurb: "Duplicates the selected layers in place.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "splitLayers",
    group: "Rigging",
    title: "Split layers",
    blurb: "Splits selected layers at the current playhead time.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "splitTextCharacters",
    group: "Rigging",
    title: "Split characters",
    blurb: "Converts a selected text layer into one positioned text layer per character.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "reverseLayers",
    group: "Rigging",
    title: "Reverse layers",
    blurb: "Enables time reverse on selected layers.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "clearExpressions",
    group: "Rigging",
    title: "Clear expressions",
    blurb: "Disables expressions on common transform properties for selected layers.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  }
];

const toolMap = Object.fromEntries(tools.map((tool) => [tool.id, tool]));
const anchorTools = [
  ["anchorTopLeft", "tl"],
  ["anchorTop", "tc"],
  ["anchorTopRight", "tr"],
  ["anchorLeft", "ml"],
  ["centerAnchor", "mc"],
  ["anchorRight", "mr"],
  ["anchorBottomLeft", "bl"],
  ["anchorBottom", "bc"],
  ["anchorBottomRight", "br"]
];
const primaryToolButtons = [
  { id: "precomposeSelected", icon: "precomp" },
  { id: "centerInComp", icon: "center" },
  { id: "saveFrame", icon: "save" }
];
const wideToolButtons = [
  { id: "rigidBodySim" }
];
const compactToolButtons = [
  { id: "reverseLayers", label: "REV" },
  { id: "fitToComp", label: "FIT" },
  { id: "bounce", label: "BNC" },
  { id: "createControlNull", label: "NUL" },
  { id: "enableMotionBlur", label: "MBL" },
  { id: "sequenceLayers", label: "SEQ" },
  { id: "duplicateLayers", label: "DUP" },
  { id: "splitLayers", label: "SPL" },
  { id: "splitTextCharacters", label: "CHR" },
  { id: "clearExpressions", label: "CLR" }
];
const graphBounds = { x: 14, y: 10, width: 340, height: 276 };
const bridge = getBridge();

let activeToolId = tools[0].id;
let graphCoords = loadGraphCoords();
let draggedGraphHandle = null;
let editingToolId = null;
let savedSettings = loadSavedSettings();
let globalSettings = loadGlobalSettings();
let favoriteToolIds = loadFavoriteToolIds();
let draggedToolId = null;
let draggedFromFavorites = false;
let dragGesture = null;
let dragGhost = null;
let dragGhostOffset = { x: 0, y: 0 };
let suppressNextClick = false;
let hasRenderedListOnce = false;
let favoritesHintDismissed = loadFavoritesHintDismissed();
let activeTabId = "presets";
let toolHelpCloseTimer = null;
let selectedPhysicsState = { allSelectedArePhysics: false, selectedCount: 0 };
let physicsSelectionPollInFlight = false;

const toolList = document.getElementById("toolList");
const fieldMount = document.getElementById("fieldMount");
const sheetGroup = document.getElementById("sheetGroup");
const sheetTitle = document.getElementById("sheetTitle");
const sheetDescription = document.getElementById("sheetDescription");
const settingsOverlay = document.getElementById("settingsOverlay");
const globalSettingsOverlay = document.getElementById("globalSettingsOverlay");
const globalStartSecInput = document.getElementById("globalStartSec");
const globalStartColorEnabledInput = document.getElementById("globalStartColorEnabled");
const globalStartColorInput = document.getElementById("globalStartColor");
const globalStartColorWrap = document.getElementById("globalStartColorWrap");
const globalColorSquare = document.getElementById("globalColorSquare");
const globalHueBar = document.getElementById("globalHueBar");
const tabBar = document.getElementById("tabBar");
const applyButton = document.getElementById("applyTool");
const openGlobalSettingsButton = document.getElementById("openGlobalSettings");
const actionbar = document.getElementById("actionbar");
const toolHelpPopup = document.getElementById("toolHelpPopup");
const toolHelpTitle = document.getElementById("toolHelpTitle");
const toolHelpCopy = document.getElementById("toolHelpCopy");

function getBridge() {
  if (typeof window.__adobe_cep__ !== "undefined") {
    return {
      eval(script) {
        return new Promise((resolve) => {
          window.__adobe_cep__.evalScript(script, resolve);
        });
      }
    };
  }

  return {
    async eval(script) {
      if (script.includes("getSelectionSummary")) {
        return "Mock mode: no AE host connected.";
      }
      if (script.includes("applyTool")) {
        return "OK: Mock mode applied tool.";
      }
      if (script.includes("applyGraphPreset")) {
        return "OK: Mock mode applied graph.";
      }
      if (script.includes("readGraphPreset")) {
        return JSON.stringify({ ok: true, coords: [0, 0, 1, 1], message: "OK: Mock mode read graph." });
      }
      return "Mock mode.";
    }
  };
}

function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const sanitized = {};
    let changed = false;
    for (const [toolId, payload] of Object.entries(parsed)) {
      const tool = toolMap[toolId];
      if (!tool || !payload || typeof payload !== "object" || Array.isArray(payload)) {
        changed = true;
        continue;
      }

      const allowedFields = new Set(tool.sections.flatMap((section) => section.fields).map((field) => field.id));
      const currentPayload = {};
      for (const [key, value] of Object.entries(payload)) {
        if (allowedFields.has(key)) {
          currentPayload[key] = value;
        } else {
          changed = true;
        }
      }
      sanitized[toolId] = currentPayload;
    }

    if (changed) {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (error) {
    return {};
  }
}

function persistSettings() {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
}

function normalizeGlobalSettings(payload) {
  return {
    startSec: payload && payload.startSec !== undefined ? String(payload.startSec) : "Cursor",
    startColorEnabled: payload && payload.startColorEnabled === true,
    startColor: payload && /^#[0-9a-f]{6}$/i.test(String(payload.startColor)) ? String(payload.startColor) : "#2d8cff"
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const normalized = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  const value = normalized ? normalized[1] : "2d8cff";
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsv({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * (((bn - rn) / delta) + 2);
    } else {
      h = 60 * (((rn - gn) / delta) + 4);
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : delta / max,
    v: max
  };
}

function hsvToRgb({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c; g = x;
  } else if (h < 120) {
    r = x; g = c;
  } else if (h < 180) {
    g = c; b = x;
  } else if (h < 240) {
    g = x; b = c;
  } else if (h < 300) {
    r = x; b = c;
  } else {
    r = c; b = x;
  }

  return {
    r: (r + m) * 255,
    g: (g + m) * 255,
    b: (b + m) * 255
  };
}

function setGlobalColorPickerFromHex(hex) {
  const hsv = rgbToHsv(hexToRgb(hex));
  globalColorSquare.style.setProperty("--picker-hue", String(Math.round(hsv.h)));
  globalColorSquare.style.setProperty("--picker-saturation-pos", `${hsv.s * 100}%`);
  globalColorSquare.style.setProperty("--picker-value-pos", `${(1 - hsv.v) * 100}%`);
  globalHueBar.style.setProperty("--picker-hue", String(Math.round(hsv.h)));
  globalHueBar.style.setProperty("--picker-hue-pos", `${(hsv.h / 360) * 100}%`);
}

function updateGlobalColorFromHsv(hsv) {
  const next = {
    h: clamp(hsv.h, 0, 359.999),
    s: clamp(hsv.s, 0, 1),
    v: clamp(hsv.v, 0, 1)
  };
  globalStartColorInput.value = rgbToHex(hsvToRgb(next));
  setGlobalColorPickerFromHex(globalStartColorInput.value);
}

function loadGlobalSettings() {
  try {
    const raw = window.localStorage.getItem(GLOBAL_SETTINGS_KEY);
    return normalizeGlobalSettings(raw ? JSON.parse(raw) : {});
  } catch (error) {
    return normalizeGlobalSettings({});
  }
}

function persistGlobalSettings() {
  window.localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(globalSettings));
}

function loadFavoriteToolIds() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((toolId) => !!toolMap[toolId]);
  } catch (error) {
    return [];
  }
}

function persistFavoriteToolIds() {
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteToolIds));
}

function loadGraphCoords() {
  try {
    const raw = window.localStorage.getItem(GRAPH_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed.map((coord, index) => {
        const fallback = index < 2 ? 0 : 1;
        const value = Number(coord);
        return isNaN(value) ? fallback : Math.max(0, Math.min(1, value));
      });
    }
  } catch (error) {}
  return [0, 0, 1, 1];
}

function persistGraphCoords() {
  window.localStorage.setItem(GRAPH_KEY, JSON.stringify(graphCoords));
}

function loadFavoritesHintDismissed() {
  try {
    return window.localStorage.getItem(FAVORITES_HINT_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function persistFavoritesHintDismissed() {
  window.localStorage.setItem(FAVORITES_HINT_KEY, favoritesHintDismissed ? "true" : "false");
}

function toolBelongsToTab(tool, tabId) {
  if (tabId === "presets") {
    return tool.group === "Text In" || tool.group === "Text Out" || tool.group === "Layer In" || tool.group === "Looks";
  }
  if (tabId === "tools") {
    return tool.group === "Rigging";
  }
  return false;
}

function getVisibleToolsForTab(tabId) {
  return tools.filter((tool) => toolBelongsToTab(tool, tabId));
}

function getFirstVisibleToolId(tabId) {
  const visible = getVisibleToolsForTab(tabId);
  return visible.length ? visible[0].id : null;
}

function syncTabBar() {
  tabBar.querySelectorAll("[data-tab-id]").forEach((button) => {
    const isActive = button.dataset.tabId === activeTabId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function syncActionState() {
  const showActions = activeTabId === "presets";
  actionbar.hidden = !showActions;
  applyButton.disabled = !activeToolId || !showActions;
}

function ensureActiveToolIsVisible() {
  if (activeTabId !== "presets") {
    activeToolId = null;
    return;
  }
  if (activeToolId && toolBelongsToTab(toolMap[activeToolId], activeTabId)) {
    return;
  }
  activeToolId = getFirstVisibleToolId(activeTabId);
}

function setActiveTab(tabId) {
  activeTabId = tabId;
  ensureActiveToolIsVisible();
  syncTabBar();
  renderToolList();
  syncActiveToolRow();
  syncActionState();
}

function getToolSettings(toolId) {
  const tool = toolMap[toolId];
  const defaults = {};
  const allowedFields = new Set();

  for (const field of tool.sections.flatMap((section) => section.fields)) {
    allowedFields.add(field.id);
    defaults[field.id] = field.defaultValue;
  }

  const saved = savedSettings[toolId] || {};
  const currentSaved = {};
  for (const [key, value] of Object.entries(saved)) {
    if (allowedFields.has(key)) {
      currentSaved[key] = value;
    }
  }

  return {
    ...defaults,
    ...currentSaved
  };
}

function getToolPayload(toolId) {
  return {
    ...getToolSettings(toolId),
    startSec: globalSettings.startSec,
    startColorEnabled: globalSettings.startColorEnabled,
    startColor: globalSettings.startColor
  };
}

function hasCustomSettings(toolId) {
  const tool = toolMap[toolId];
  const saved = savedSettings[toolId];
  return hasCustomSettingsFromPayload(toolId, saved);
}

function normalizeFieldValueForCompare(field, value) {
  if (value === undefined) {
    return value;
  }

  if (field.type === "number" || field.type === "range") {
    return Number(value);
  }

  if (field.type === "checkbox") {
    return value === true;
  }

  return String(value);
}

function hasCustomSettingsFromPayload(toolId, payload) {
  const tool = toolMap[toolId];
  if (!payload || !tool) {
    return false;
  }

  for (const field of tool.sections.flatMap((section) => section.fields)) {
    if (
      payload[field.id] !== undefined &&
      normalizeFieldValueForCompare(field, payload[field.id]) !== normalizeFieldValueForCompare(field, field.defaultValue)
    ) {
      return true;
    }
  }

  return false;
}

function isFavorite(toolId) {
  return favoriteToolIds.indexOf(toolId) !== -1;
}

function addFavorite(toolId, index) {
  const existingIndex = favoriteToolIds.indexOf(toolId);
  if (existingIndex !== -1) {
    favoriteToolIds.splice(existingIndex, 1);
  }

  if (index === undefined || index < 0 || index > favoriteToolIds.length) {
    favoriteToolIds.push(toolId);
  } else {
    favoriteToolIds.splice(index, 0, toolId);
  }

  persistFavoriteToolIds();
}

function moveFavorite(toolId, index) {
  const existingIndex = favoriteToolIds.indexOf(toolId);
  if (existingIndex === -1) {
    return;
  }

  favoriteToolIds.splice(existingIndex, 1);

  let nextIndex = index;
  if (existingIndex < index) {
    nextIndex -= 1;
  }

  if (nextIndex < 0) {
    nextIndex = 0;
  }
  if (nextIndex > favoriteToolIds.length) {
    nextIndex = favoriteToolIds.length;
  }

  favoriteToolIds.splice(nextIndex, 0, toolId);
  persistFavoriteToolIds();
}

function removeFavorite(toolId) {
  const existingIndex = favoriteToolIds.indexOf(toolId);
  if (existingIndex === -1) {
    return;
  }
  favoriteToolIds.splice(existingIndex, 1);
  persistFavoriteToolIds();
}

function favoriteHeaderMarkup() {
  return `
    <div class="group-head favorite-head">
      <svg class="star-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.6l1.85 3.76 4.15.6-3 2.92.7 4.12L8 11.05 4.3 13l.7-4.12L2 5.96l4.15-.6z"></path>
      </svg>
      Favorites
    </div>
  `;
}

function rowAnimationClass() {
  return hasRenderedListOnce ? "" : "row-enter";
}

function toolRowMarkup(tool, options) {
  const isActive = tool.id === activeToolId;
  const isEdited = hasCustomSettings(tool.id);
  const isFavoriteRow = !!(options && options.favoriteRow);
  const animationDelay = hasRenderedListOnce ? "" : `animation-delay:${Math.min(220, indexOfTool(tool.id) * 26)}ms`;

  return `
    <div class="tool-row ${rowAnimationClass()} ${isActive ? "active" : ""} ${isEdited ? "has-custom-settings" : ""}" data-tool-id="${tool.id}" ${isFavoriteRow ? 'data-favorite-row="true"' : ""} style="${animationDelay}">
      <div class="tool-main" data-select-tool="${tool.id}" role="presentation">
        <span class="tool-title-wrap">
          <strong>${tool.title}</strong>
        </span>
      </div>
      <div class="tool-actions">
        ${isEdited ? '<span class="tool-indicator" aria-hidden="true"></span>' : ""}
        <button class="icon-button" data-edit-tool="${tool.id}" aria-label="Edit settings">
          <svg class="edit-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 11.5L11.8 2.7a1.4 1.4 0 0 1 2 2L5 13.5 2.5 14z"></path>
            <path d="M10.8 3.7l1.5 1.5"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function toolTileMarkup(tool) {
  const animationDelay = hasRenderedListOnce ? "" : `animation-delay:${Math.min(180, indexOfTool(tool.id) * 22)}ms`;

  return `
    <button class="tool-tile ${rowAnimationClass()}" data-run-tool="${tool.id}" style="${animationDelay}">
      <span class="tool-tile-title">${tool.title}</span>
      <span class="tool-tile-copy">${tool.blurb}</span>
    </button>
  `;
}

function primaryCommandMarkup(entry) {
  const tool = toolMap[entry.id];
  return `
    <button class="prime-command" data-run-tool="${entry.id}" aria-label="${tool.title}">
      <span class="prime-icon prime-icon-${entry.icon}" aria-hidden="true"></span>
      <span>${tool.title}</span>
    </button>
  `;
}

function compactCommandMarkup(entry) {
  const tool = toolMap[entry.id];
  return `
    <button class="compact-command" data-run-tool="${entry.id}" aria-label="${tool.title}">
      ${entry.label}
    </button>
  `;
}

function wideCommandMarkup(entry) {
  const tool = toolMap[entry.id];
  const isEdited = hasCustomSettings(entry.id);
  const isPhysicsRerender = entry.id === "rigidBodySim" && selectedPhysicsState.allSelectedArePhysics;
  const buttonLabel = isPhysicsRerender ? "Re-render Simulation" : tool.title;
  const runAttribute = isPhysicsRerender ? 'data-rerender-physics="true"' : `data-run-tool="${entry.id}"`;
  return `
    <div class="wide-command-row ${isEdited ? "has-custom-settings" : ""}">
      <button class="wide-edit-hotspot" data-edit-tool="${entry.id}" aria-label="Edit ${tool.title} settings">
        <svg class="edit-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 11.5L11.8 2.7a1.4 1.4 0 0 1 2 2L5 13.5 2.5 14z"></path>
          <path d="M10.8 3.7l1.5 1.5"></path>
        </svg>
      </button>
      <button class="wide-command" ${runAttribute} aria-label="${buttonLabel}">
        <span class="wide-icon wide-icon-physics" aria-hidden="true"></span>
        <span>${buttonLabel}</span>
        <span class="wide-edit-slot" aria-hidden="true">
          <svg class="edit-icon" viewBox="0 0 16 16">
            <path d="M3 11.5L11.8 2.7a1.4 1.4 0 0 1 2 2L5 13.5 2.5 14z"></path>
            <path d="M10.8 3.7l1.5 1.5"></path>
          </svg>
        </span>
      </button>
    </div>
  `;
}

function renderToolsPanel() {
  return `
    <section class="tools-panel">
      <div class="tools-hero">
        <div class="anchor-pad" aria-label="Anchor point tools">
          ${anchorTools
            .map(([toolId, position]) => `<button class="anchor-button anchor-${position}" data-run-tool="${toolId}" aria-label="${toolMap[toolId].title}"><span></span></button>`)
            .join("")}
        </div>
        <div class="prime-command-stack">
          ${primaryToolButtons.map(primaryCommandMarkup).join("")}
        </div>
      </div>
      <div class="wide-command-stack">
        ${wideToolButtons.map(wideCommandMarkup).join("")}
      </div>
      <div class="tools-divider"></div>
      <div class="compact-command-grid">
        ${compactToolButtons.map(compactCommandMarkup).join("")}
      </div>
    </section>
  `;
}

function clampGraphCoord(value) {
  if (isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function formatGraphCoord(value) {
  return clampGraphCoord(value).toFixed(2);
}

function getGraphPoint(handleIndex) {
  const pointIndex = handleIndex === 1 ? 0 : 2;
  return {
    x: graphBounds.x + graphCoords[pointIndex] * graphBounds.width,
    y: graphBounds.y + (1 - graphCoords[pointIndex + 1]) * graphBounds.height
  };
}

function getGraphAnchor(anchorIndex) {
  if (anchorIndex === 0) {
    return { x: graphBounds.x, y: graphBounds.y + graphBounds.height };
  }
  return { x: graphBounds.x + graphBounds.width, y: graphBounds.y };
}

function graphPathData() {
  const start = getGraphAnchor(0);
  const end = getGraphAnchor(1);
  const first = getGraphPoint(1);
  const second = getGraphPoint(2);
  return `M ${start.x} ${start.y} C ${first.x} ${first.y} ${second.x} ${second.y} ${end.x} ${end.y}`;
}

function graphCoordString() {
  return graphCoords.map(formatGraphCoord).join(", ");
}

function syncGraphUi() {
  const first = getGraphPoint(1);
  const second = getGraphPoint(2);
  const start = getGraphAnchor(0);
  const end = getGraphAnchor(1);
  const curve = toolList.querySelector("[data-graph-curve]");
  const firstLine = toolList.querySelector('[data-graph-handle-line="1"]');
  const secondLine = toolList.querySelector('[data-graph-handle-line="2"]');
  const firstDot = toolList.querySelector('[data-graph-handle="1"]');
  const secondDot = toolList.querySelector('[data-graph-handle="2"]');

  if (curve) {
    curve.setAttribute("d", graphPathData());
  }
  if (firstLine) {
    firstLine.setAttribute("x1", start.x);
    firstLine.setAttribute("y1", start.y);
    firstLine.setAttribute("x2", first.x);
    firstLine.setAttribute("y2", first.y);
  }
  if (secondLine) {
    secondLine.setAttribute("x1", end.x);
    secondLine.setAttribute("y1", end.y);
    secondLine.setAttribute("x2", second.x);
    secondLine.setAttribute("y2", second.y);
  }
  if (firstDot) {
    firstDot.setAttribute("cx", first.x);
    firstDot.setAttribute("cy", first.y);
  }
  if (secondDot) {
    secondDot.setAttribute("cx", second.x);
    secondDot.setAttribute("cy", second.y);
  }
  toolList.querySelectorAll("[data-graph-coordinate]").forEach((input) => {
    input.value = formatGraphCoord(graphCoords[Number(input.dataset.graphCoordinate)]);
  });
  persistGraphCoords();
}

function renderGraphPanel() {
  const first = getGraphPoint(1);
  const second = getGraphPoint(2);
  const start = getGraphAnchor(0);
  const end = getGraphAnchor(1);
  return `
    <section class="graphs-panel">
      <div class="graph-stage" aria-label="Editable graph">
        <svg class="graph-canvas" viewBox="0 0 368 300" role="img" aria-label="Editable cubic bezier curve">
          <defs>
            <filter id="graphGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g class="graph-grid">
            <line x1="14" y1="78" x2="354" y2="78" />
            <line x1="14" y1="142" x2="354" y2="142" />
            <line x1="14" y1="206" x2="354" y2="206" />
            <line x1="82" y1="10" x2="82" y2="286" />
            <line x1="150" y1="10" x2="150" y2="286" />
            <line x1="218" y1="10" x2="218" y2="286" />
            <line x1="286" y1="10" x2="286" y2="286" />
          </g>
          <path class="graph-axis graph-axis-left" d="M 14 10 L 14 286" />
          <path class="graph-axis graph-axis-bottom" d="M 14 286 L 354 286" />
          <line class="graph-handle-line" data-graph-handle-line="1" x1="${start.x}" y1="${start.y}" x2="${first.x}" y2="${first.y}" />
          <line class="graph-handle-line" data-graph-handle-line="2" x1="${end.x}" y1="${end.y}" x2="${second.x}" y2="${second.y}" />
          <path class="graph-curve" data-graph-curve="true" d="${graphPathData()}" />
          <circle class="graph-anchor-dot" cx="${start.x}" cy="${start.y}" r="4" />
          <circle class="graph-anchor-dot" cx="${end.x}" cy="${end.y}" r="4" />
          <circle class="graph-handle-dot" data-graph-handle="1" cx="${first.x}" cy="${first.y}" r="7" />
          <circle class="graph-handle-dot" data-graph-handle="2" cx="${second.x}" cy="${second.y}" r="7" />
        </svg>
      </div>
      <div class="graph-coordinate-panel">
        <div class="graph-coordinate-grid" aria-label="Graph coordinates">
          ${graphCoords
            .map((coord, index) => `<input class="graph-coordinate-input" data-graph-coordinate="${index}" aria-label="Coordinate ${index + 1}" value="${formatGraphCoord(coord)}" inputmode="decimal" />`)
            .join("")}
        </div>
      </div>
      <div class="graph-action-row">
        <button class="graph-secondary-button" data-graph-read="true">Read</button>
        <button class="graph-secondary-button" data-graph-reset="true">Reset</button>
        <button class="graph-apply-button" data-graph-apply="true">APPLY</button>
      </div>
    </section>
  `;
}

function setStatus(message, tone = "normal") {
  return { message: message, tone: tone };
}

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderToolList() {
  const visibleTools = getVisibleToolsForTab(activeTabId);
  if (activeTabId === "graphs") {
    toolList.innerHTML = renderGraphPanel();
    hasRenderedListOnce = true;
    return;
  }

  if (activeTabId === "tools") {
    toolList.innerHTML = renderToolsPanel();
    hasRenderedListOnce = true;
    return;
  }

  const groups = new Map();
  for (const tool of visibleTools) {
    if (isFavorite(tool.id)) {
      continue;
    }
    if (!groups.has(tool.group)) {
      groups.set(tool.group, []);
    }
    groups.get(tool.group).push(tool);
  }

  const favoriteTools = favoriteToolIds.map((toolId) => toolMap[toolId]).filter((tool) => tool && toolBelongsToTab(tool, activeTabId));

  const favoritesMarkup = `
    <section class="group-block favorites-block" data-favorites-block="true">
      ${favoriteHeaderMarkup()}
      <div class="favorite-dropzone ${favoriteTools.length ? "" : "is-empty"}" data-favorite-dropzone="true">
        ${
          favoriteTools.length
            ? favoriteTools
                .map((tool) => toolRowMarkup(tool, { favoriteRow: true }))
                .join("")
            : favoritesHintDismissed
              ? '<div class="favorite-blank"></div>'
              : `
                <div class="favorite-empty">
                  <span class="favorite-empty-copy">Drag tools here to pin them as favorites.</span>
                  <button class="hint-close" data-dismiss-favorites-hint="true" aria-label="Dismiss favorites hint">×</button>
                </div>
              `
        }
      </div>
    </section>
  `;

  toolList.innerHTML = favoritesMarkup + Array.from(groups.entries())
    .map(
      ([group, groupTools]) => `
        <section class="group-block category-block" data-category-group="${group}">
          <div class="group-head">${group}</div>
          ${groupTools
            .map((tool) => toolRowMarkup(tool))
            .join("")}
        </section>
      `
    )
    .join("");

  hasRenderedListOnce = true;
}

function syncActiveToolRow() {
  document.querySelectorAll(".tool-row").forEach((row) => {
    row.classList.toggle("active", row.dataset.toolId === activeToolId);
  });
}

function clearDropMarkers() {
  document.querySelectorAll(".tool-row.drop-before, .tool-row.drop-after").forEach((row) => {
    row.classList.remove("drop-before", "drop-after");
  });
  toolList.querySelectorAll("[data-favorite-dropzone]").forEach((zone) => zone.classList.remove("active"));
  toolList.querySelectorAll("[data-favorites-block].drop-target").forEach((block) => block.classList.remove("drop-target"));
  document.querySelectorAll(".category-block.drop-target").forEach((block) => {
    block.classList.remove("drop-target");
  });
}

function syncToolEditedState(toolId, isEdited) {
  document.querySelectorAll(`.tool-row[data-tool-id="${toolId}"]`).forEach((row) => {
    row.classList.toggle("has-custom-settings", isEdited);
    const actions = row.querySelector(".tool-actions");
    if (!actions) {
      return;
    }

    let indicator = actions.querySelector(".tool-indicator");
    if (isEdited && !indicator) {
      indicator = document.createElement("span");
      indicator.className = "tool-indicator";
      indicator.setAttribute("aria-hidden", "true");
      actions.insertBefore(indicator, actions.firstChild);
    } else if (!isEdited && indicator) {
      indicator.remove();
    }
  });
}

function endDragState() {
  document.querySelectorAll(".tool-row.dragging").forEach((row) => row.classList.remove("dragging"));
  clearDropMarkers();
  if (dragGhost && dragGhost.parentNode) {
    dragGhost.parentNode.removeChild(dragGhost);
  }
  dragGhost = null;
  dragGhostOffset = { x: 0, y: 0 };
  draggedToolId = null;
  draggedFromFavorites = false;
  dragGesture = null;
  toolList.classList.remove("drag-active");
  toolList.classList.remove("drag-primed");
}

function createDragGhost(toolId, row) {
  const tool = toolMap[toolId];
  if (!tool) {
    return null;
  }

  const rect = row ? row.getBoundingClientRect() : null;
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  if (rect) {
    ghost.style.width = `${Math.round(rect.width)}px`;
    ghost.style.height = `${Math.round(rect.height)}px`;
  }
  ghost.innerHTML = `
    <div class="drag-ghost-stack">
      <div class="drag-ghost-card back-a"></div>
      <div class="drag-ghost-card back-b"></div>
      <div class="drag-ghost-card front">
        <span class="drag-ghost-title">${tool.title}</span>
        <span class="tool-indicator" aria-hidden="true"></span>
      </div>
    </div>
  `;
  document.body.appendChild(ghost);
  return ghost;
}

function updateDragGhostPosition(clientX, clientY) {
  if (!dragGhost) {
    return;
  }
  dragGhost.style.left = `${clientX - dragGhostOffset.x}px`;
  dragGhost.style.top = `${clientY - dragGhostOffset.y}px`;
}

function getDropContext(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  if (!target) {
    return null;
  }

  const favoriteRow = target.closest('[data-favorite-row="true"]');
  if (favoriteRow && favoriteRow.dataset.toolId !== draggedToolId) {
    const rect = favoriteRow.getBoundingClientRect();
    return {
      type: "favorite-row",
      row: favoriteRow,
      before: clientY < rect.top + rect.height / 2
    };
  }

  const favoriteZone = target.closest("[data-favorite-dropzone]");
  const favoritesBlock = target.closest("[data-favorites-block]");
  if (favoriteZone || favoritesBlock) {
    return {
      type: "favorites-block",
      zone: favoriteZone || (favoritesBlock ? favoritesBlock.querySelector("[data-favorite-dropzone]") : null),
      block: favoritesBlock
    };
  }

  const categoryBlock = target.closest("[data-category-group]");
  if (categoryBlock && draggedFromFavorites) {
    return {
      type: "category-block",
      block: categoryBlock
    };
  }

  return null;
}

function applyDropMarkers(context) {
  clearDropMarkers();
  if (!context) {
    return;
  }

  if (context.type === "favorite-row") {
    context.row.classList.add(context.before ? "drop-before" : "drop-after");
    return;
  }

  if (context.type === "favorites-block") {
    if (context.zone) {
      context.zone.classList.add("active");
    }
    if (context.block) {
      context.block.classList.add("drop-target");
    }
    return;
  }

  if (context.type === "category-block") {
    context.block.classList.add("drop-target");
  }
}

function commitDrop(context) {
  if (!context || !draggedToolId) {
    return false;
  }

  if (context.type === "favorite-row") {
    const targetToolId = context.row.dataset.toolId;
    const targetIndex = favoriteToolIds.indexOf(targetToolId);
    const insertIndex = context.before ? targetIndex : targetIndex + 1;

    if (draggedFromFavorites) {
      moveFavorite(draggedToolId, insertIndex);
    } else {
      addFavorite(draggedToolId, insertIndex);
    }
    return true;
  }

  if (context.type === "favorites-block") {
    if (draggedFromFavorites) {
      moveFavorite(draggedToolId, favoriteToolIds.length);
    } else {
      addFavorite(draggedToolId);
    }
    return true;
  }

  if (context.type === "category-block" && draggedFromFavorites) {
    removeFavorite(draggedToolId);
    return true;
  }

  return false;
}

function indexOfTool(toolId) {
  for (let i = 0; i < tools.length; i += 1) {
    if (tools[i].id === toolId) {
      return i;
    }
  }
  return 0;
}

function renderField(field, toolSettings) {
  const value = toolSettings[field.id];

  if (field.type === "checkbox") {
    return `
      <label class="checkbox-field">
        <input type="checkbox" data-field-id="${field.id}" ${value ? "checked" : ""}>
        <span>${field.label}</span>
      </label>
    `;
  }

  if (field.type === "select") {
    return `
      <div class="field">
        <label for="field-${field.id}">${field.label}</label>
        <select id="field-${field.id}" class="select-input" data-field-id="${field.id}">
          ${field.options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </div>
    `;
  }

  if (field.type === "range") {
    return `
      <div class="field slider-wrap">
        <div class="slider-head">
          <label for="field-${field.id}">${field.label}</label>
          <span class="slider-value" id="value-${field.id}">${formatRangeValue(field, value)}</span>
        </div>
        <input
          id="field-${field.id}"
          class="slider-input"
          type="range"
          min="${field.min}"
          max="${field.max}"
          step="${field.step}"
          value="${value}"
          data-field-id="${field.id}"
        >
      </div>
    `;
  }

  return `
    <div class="field" data-field-wrap="${field.id}">
      <label for="field-${field.id}">${field.label}</label>
      <input
        id="field-${field.id}"
        class="text-input"
        type="${field.type === "number" ? "number" : "text"}"
        value="${value}"
        data-field-id="${field.id}"
        ${field.type === "number" ? 'step="any"' : ""}
      >
      ${field.hint ? `<div class="hint">${field.hint}</div>` : ""}
    </div>
  `;
}

function openSettings(toolId) {
  editingToolId = toolId;
  const tool = toolMap[toolId];
  const toolSettings = getToolSettings(toolId);

  sheetGroup.textContent = tool.group;
  sheetTitle.textContent = tool.title;
  sheetDescription.textContent = tool.blurb;

  fieldMount.innerHTML = tool.sections
    .map(
      (section) => `
        <section class="field-section">
          <div>
            <h3>${section.title}</h3>
            <p>${section.description}</p>
          </div>
          <div class="field-grid">
            ${section.fields.map((field) => renderField(field, toolSettings)).join("")}
          </div>
        </section>
      `
    )
    .join("");

  syncDependentFields();
  settingsOverlay.classList.remove("hidden");
  settingsOverlay.classList.remove("closing");
}

function closeSettings() {
  settingsOverlay.classList.add("closing");
  window.setTimeout(() => {
    settingsOverlay.classList.add("hidden");
    settingsOverlay.classList.remove("closing");
    editingToolId = null;
  }, 280);
}

function openGlobalSettings() {
  globalStartSecInput.value = globalSettings.startSec;
  globalStartColorEnabledInput.checked = globalSettings.startColorEnabled;
  globalStartColorInput.value = globalSettings.startColor;
  setGlobalColorPickerFromHex(globalStartColorInput.value);
  syncGlobalStartColorField();
  globalSettingsOverlay.classList.remove("hidden");
  globalSettingsOverlay.classList.remove("closing");
}

function closeGlobalSettings() {
  globalSettingsOverlay.classList.add("closing");
  window.setTimeout(() => {
    globalSettingsOverlay.classList.add("hidden");
    globalSettingsOverlay.classList.remove("closing");
  }, 280);
}

function resetGlobalSettings() {
  globalSettings = normalizeGlobalSettings({});
  persistGlobalSettings();
  globalStartSecInput.value = globalSettings.startSec;
  globalStartColorEnabledInput.checked = globalSettings.startColorEnabled;
  globalStartColorInput.value = globalSettings.startColor;
  setGlobalColorPickerFromHex(globalStartColorInput.value);
  syncGlobalStartColorField();
  setStatus("Reset global settings.", "success");
}

function saveGlobalSettings() {
  globalSettings = normalizeGlobalSettings({
    startSec: globalStartSecInput.value,
    startColorEnabled: globalStartColorEnabledInput.checked,
    startColor: globalStartColorInput.value
  });
  persistGlobalSettings();
  setStatus("Saved global settings.", "success");
  closeGlobalSettings();
}

function syncGlobalStartColorField() {
  globalStartColorWrap.style.opacity = globalStartColorEnabledInput.checked ? "1" : "0.45";
  globalColorSquare.style.pointerEvents = globalStartColorEnabledInput.checked ? "auto" : "none";
  globalHueBar.style.pointerEvents = globalStartColorEnabledInput.checked ? "auto" : "none";
}

function getGlobalPickerHsv() {
  return rgbToHsv(hexToRgb(globalStartColorInput.value));
}

function updateGlobalColorFromSquareEvent(event) {
  const rect = globalColorSquare.getBoundingClientRect();
  const hsv = getGlobalPickerHsv();
  updateGlobalColorFromHsv({
    h: hsv.h,
    s: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    v: clamp(1 - ((event.clientY - rect.top) / rect.height), 0, 1)
  });
}

function updateGlobalColorFromHueEvent(event) {
  const rect = globalHueBar.getBoundingClientRect();
  const hsv = getGlobalPickerHsv();
  updateGlobalColorFromHsv({
    h: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360,
    s: hsv.s,
    v: hsv.v
  });
}

function startGlobalColorDrag(event, updateFn) {
  if (!globalStartColorEnabledInput.checked || event.button !== 0) {
    return;
  }

  event.preventDefault();
  updateFn(event);

  const onMove = (moveEvent) => updateFn(moveEvent);
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}

function hideToolHelp() {
  if (toolHelpPopup.classList.contains("hidden") || toolHelpPopup.classList.contains("closing")) {
    return;
  }

  toolHelpPopup.classList.add("closing");
  window.clearTimeout(toolHelpCloseTimer);
  toolHelpCloseTimer = window.setTimeout(() => {
    toolHelpPopup.classList.add("hidden");
    toolHelpPopup.classList.remove("closing");
  }, 170);
}

function showToolHelp(toolId, clientX, clientY) {
  const tool = toolMap[toolId];
  if (!tool) {
    return;
  }

  toolHelpTitle.textContent = tool.title;
  toolHelpCopy.textContent = tool.blurb || "Runs this rdzTools command.";
  window.clearTimeout(toolHelpCloseTimer);
  toolHelpPopup.classList.remove("closing");
  toolHelpPopup.classList.remove("hidden");

  const margin = 8;
  const rect = toolHelpPopup.getBoundingClientRect();
  const left = Math.min(window.innerWidth - rect.width - margin, Math.max(margin, clientX + 10));
  const top = Math.min(window.innerHeight - rect.height - margin, Math.max(margin, clientY + 10));
  toolHelpPopup.style.left = `${left}px`;
  toolHelpPopup.style.top = `${top}px`;
}

function formatRangeValue(field, value) {
  const numeric = Number(value);
  if (field.step && field.step < 1) {
    return `${numeric.toFixed(2)}${field.suffix || ""}`;
  }
  return `${Math.round(numeric)}${field.suffix || ""}`;
}

function syncRangeValue(fieldId) {
  const tool = toolMap[editingToolId];
  const field = tool.sections.flatMap((section) => section.fields).find((entry) => entry.id === fieldId);
  if (!field || field.type !== "range") {
    return;
  }

  const input = fieldMount.querySelector(`[data-field-id="${fieldId}"]`);
  const valueNode = document.getElementById(`value-${fieldId}`);
  if (input && valueNode) {
    valueNode.textContent = formatRangeValue(field, input.value);
  }
}

function syncDependentFields() {
  if (!editingToolId) {
    return;
  }

  const tool = toolMap[editingToolId];
  const allFields = tool.sections.flatMap((section) => section.fields);

  for (const field of allFields) {
    if (!field.dependsOn) {
      continue;
    }

    const dependency = fieldMount.querySelector(`[data-field-id="${field.dependsOn}"]`);
    const target = fieldMount.querySelector(`[data-field-wrap="${field.id}"]`);
    if (!dependency || !target) {
      continue;
    }

    target.style.opacity = dependency.checked ? "1" : "0.45";
    target.querySelector("input").disabled = !dependency.checked;
  }
}

function collectSettingsFromSheet() {
  const tool = toolMap[editingToolId];
  const payload = {};

  for (const field of tool.sections.flatMap((section) => section.fields)) {
    const input = fieldMount.querySelector(`[data-field-id="${field.id}"]`);
    if (!input) {
      continue;
    }

    if (field.type === "checkbox") {
      payload[field.id] = input.checked;
    } else if (field.type === "range" || field.type === "number") {
      payload[field.id] = Number(input.value);
    } else {
      payload[field.id] = input.value;
    }
  }

  return payload;
}

function resetSettingsForEditingTool() {
  if (!editingToolId) {
    return;
  }

  syncToolEditedState(editingToolId, false);
  delete savedSettings[editingToolId];
  persistSettings();
  openSettings(editingToolId);
}

function saveSettingsForEditingTool() {
  if (!editingToolId) {
    return;
  }

  savedSettings[editingToolId] = collectSettingsFromSheet();
  persistSettings();
  syncToolEditedState(editingToolId, hasCustomSettings(editingToolId));
  setStatus(`Saved settings for ${toolMap[editingToolId].title}.`, "success");
  closeSettings();
}

async function refreshSelection() {
  await bridge.eval("rdzTools.getSelectionSummary()");
}

async function refreshPhysicsSelectionState() {
  if (physicsSelectionPollInFlight) {
    return;
  }

  physicsSelectionPollInFlight = true;
  try {
    const result = await bridge.eval("rdzTools.getSelectedPhysicsState()");
    const parsed = JSON.parse(result);
    const nextState = {
      allSelectedArePhysics: !!parsed.allSelectedArePhysics,
      selectedCount: Number(parsed.selectedCount) || 0
    };
    if (
      nextState.allSelectedArePhysics !== selectedPhysicsState.allSelectedArePhysics ||
      nextState.selectedCount !== selectedPhysicsState.selectedCount
    ) {
      selectedPhysicsState = nextState;
      if (activeTabId === "tools") {
        renderToolList();
      }
    }
  } catch (error) {
    selectedPhysicsState = { allSelectedArePhysics: false, selectedCount: 0 };
  } finally {
    physicsSelectionPollInFlight = false;
  }
}

function startPhysicsSelectionRefresh() {
  refreshPhysicsSelectionState();
  window.setInterval(refreshPhysicsSelectionState, 1200);
}

async function rerenderPhysicsBySelection() {
  setStatus("Re-rendering physics simulation...");
  const rerenderResult = await bridge.eval("rdzTools.rerenderSelectedPhysics()");
  try {
    const rerendered = JSON.parse(rerenderResult);
    setStatus(rerendered.message || "OK: Re-rendered physics.", rerendered.ok ? "success" : "error");
  } catch (error) {
    setStatus(rerenderResult || "Error: Could not re-render physics.", "error");
  }
  await refreshSelection();
  await refreshPhysicsSelectionState();
}

async function applyActiveTool() {
  if (!activeToolId) {
    return;
  }
  const payload = getToolPayload(activeToolId);
  const payloadString = escapeString(JSON.stringify(payload));

  setStatus(`Applying ${toolMap[activeToolId].title}...`);
  const result = await bridge.eval(`rdzTools.applyTool("${escapeString(activeToolId)}","${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
  await refreshPhysicsSelectionState();
}

async function applyToolById(toolId) {
  const payload = getToolPayload(toolId);
  const payloadString = escapeString(JSON.stringify(payload));
  const result = await bridge.eval(`rdzTools.applyTool("${escapeString(toolId)}","${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
  await refreshPhysicsSelectionState();
}

async function applyActiveGraph() {
  const payload = { coords: graphCoords };
  const payloadString = escapeString(JSON.stringify(payload));
  const result = await bridge.eval(`rdzTools.applyGraphPreset("${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
}

async function readActiveGraph() {
  const result = await bridge.eval("rdzTools.readGraphPreset()");
  try {
    const parsed = JSON.parse(result);
    if (parsed.ok && Array.isArray(parsed.coords) && parsed.coords.length === 4) {
      graphCoords = parsed.coords.map((coord) => clampGraphCoord(Number(coord)));
      syncGraphUi();
      setStatus(parsed.message || "OK: Read selected keyframe graph.", "success");
      return;
    }
    setStatus(parsed.message || "Error: Could not read selected keyframes.", "error");
  } catch (error) {
    setStatus(result || "Error: Could not read selected keyframes.", "error");
  }
}

function resetGraph() {
  graphCoords = [0, 0, 1, 1];
  persistGraphCoords();
  renderToolList();
}

function getGraphSvgPoint(event) {
  const svg = toolList.querySelector(".graph-canvas");
  const rect = svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 368,
    y: ((event.clientY - rect.top) / rect.height) * 300
  };
}

function updateGraphHandleFromEvent(event) {
  if (!draggedGraphHandle) {
    return;
  }

  const point = getGraphSvgPoint(event);
  const coordIndex = draggedGraphHandle === 1 ? 0 : 2;
  graphCoords[coordIndex] = clampGraphCoord((point.x - graphBounds.x) / graphBounds.width);
  graphCoords[coordIndex + 1] = clampGraphCoord(1 - ((point.y - graphBounds.y) / graphBounds.height));
  syncGraphUi();
}

applyButton.addEventListener("click", applyActiveTool);
openGlobalSettingsButton.addEventListener("click", openGlobalSettings);
document.getElementById("closeSettings").addEventListener("click", closeSettings);
document.getElementById("saveSettings").addEventListener("click", saveSettingsForEditingTool);
document.getElementById("resetSettings").addEventListener("click", resetSettingsForEditingTool);
document.getElementById("settingsBackdrop").addEventListener("click", closeSettings);
document.getElementById("closeGlobalSettings").addEventListener("click", closeGlobalSettings);
document.getElementById("saveGlobalSettings").addEventListener("click", saveGlobalSettings);
document.getElementById("resetGlobalSettings").addEventListener("click", resetGlobalSettings);
document.getElementById("globalSettingsBackdrop").addEventListener("click", closeGlobalSettings);
globalStartColorEnabledInput.addEventListener("input", syncGlobalStartColorField);
globalColorSquare.addEventListener("mousedown", (event) => startGlobalColorDrag(event, updateGlobalColorFromSquareEvent));
globalHueBar.addEventListener("mousedown", (event) => startGlobalColorDrag(event, updateGlobalColorFromHueEvent));
tabBar.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab-id]");
  if (!tabButton || tabButton.dataset.tabId === activeTabId) {
    return;
  }
  setActiveTab(tabButton.dataset.tabId);
});

toolList.addEventListener("contextmenu", (event) => {
  const presetRow = event.target.closest(".tool-row[data-tool-id]");
  if (presetRow) {
    event.preventDefault();
    event.stopPropagation();
    openSettings(presetRow.dataset.toolId);
    return;
  }

  const commandButton = event.target.closest("[data-run-tool]");
  if (!commandButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  showToolHelp(commandButton.dataset.runTool, event.clientX, event.clientY);
});

toolList.addEventListener("mouseleave", (event) => {
  if (event.target.closest && event.target.closest("[data-run-tool]")) {
    hideToolHelp();
  }
}, true);

toolList.addEventListener("mousedown", (event) => {
  const handle = event.target.closest("[data-graph-handle]");
  if (!handle) {
    return;
  }

  draggedGraphHandle = Number(handle.dataset.graphHandle);
  toolList.classList.add("graph-dragging");
  event.preventDefault();
  updateGraphHandleFromEvent(event);
});

document.addEventListener("mousemove", (event) => {
  if (!draggedGraphHandle) {
    return;
  }
  event.preventDefault();
  updateGraphHandleFromEvent(event);
});

document.addEventListener("mouseup", () => {
  if (!draggedGraphHandle) {
    return;
  }
  draggedGraphHandle = null;
  toolList.classList.remove("graph-dragging");
});

toolList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-graph-coordinate]");
  if (!input) {
    return;
  }

  const index = Number(input.dataset.graphCoordinate);
  graphCoords[index] = clampGraphCoord(Number(input.value));
  syncGraphUi();
});

toolList.addEventListener("click", (event) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  hideToolHelp();

  if (event.target.closest("[data-graph-read]")) {
    readActiveGraph();
    return;
  }

  if (event.target.closest("[data-graph-reset]")) {
    resetGraph();
    return;
  }

  if (event.target.closest("[data-graph-apply]")) {
    applyActiveGraph();
    return;
  }

  if (event.target.closest("[data-rerender-physics]")) {
    rerenderPhysicsBySelection();
    return;
  }

  const dismissHintButton = event.target.closest("[data-dismiss-favorites-hint]");
  if (dismissHintButton) {
    favoritesHintDismissed = true;
    persistFavoritesHintDismissed();
    renderToolList();
    syncActiveToolRow();
    return;
  }

  const editButton = event.target.closest("[data-edit-tool]");
  if (editButton) {
    openSettings(editButton.dataset.editTool);
    return;
  }

  const runToolButton = event.target.closest("[data-run-tool]");
  if (runToolButton) {
    applyToolById(runToolButton.dataset.runTool);
    return;
  }

  const row = event.target.closest(".tool-row");
  if (row) {
    activeToolId = row.dataset.toolId;
    syncActiveToolRow();
    return;
  }
});

document.addEventListener("click", hideToolHelp);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideToolHelp();
    if (!settingsOverlay.classList.contains("hidden")) {
      closeSettings();
    }
    if (!globalSettingsOverlay.classList.contains("hidden")) {
      closeGlobalSettings();
    }
  }
});
toolList.addEventListener("scroll", hideToolHelp);

function clearPressedRows() {
  document.querySelectorAll(".tool-row.pressed").forEach((row) => row.classList.remove("pressed"));
}

function pressRowState(event) {
  if (event.button !== 0) {
    return;
  }

  const row = event.target.closest(".tool-row");
  if (!row) {
    return;
  }

  row.classList.add("pressed");
  if (event.target.closest("[data-edit-tool]") || event.target.closest("[data-dismiss-favorites-hint]")) {
    dragGesture = null;
    toolList.classList.remove("drag-primed");
    return;
  }

  dragGesture = {
    toolId: row.dataset.toolId,
    fromFavorites: row.dataset.favoriteRow === "true",
    row,
    startX: event.clientX || 0,
    startY: event.clientY || 0,
    active: false
  };
}

toolList.addEventListener("mousedown", pressRowState);

function maybePrimeDrag(event) {
  if (draggedToolId) {
    updateDragGhostPosition(event.clientX || 0, event.clientY || 0);
    applyDropMarkers(getDropContext(event.clientX || 0, event.clientY || 0));
    return;
  }

  if (!dragGesture) {
    return;
  }

  const dx = (event.clientX || 0) - dragGesture.startX;
  const dy = (event.clientY || 0) - dragGesture.startY;
  if ((dx * dx) + (dy * dy) >= 36) {
    if (!dragGesture.active) {
      dragGesture.active = true;
      draggedToolId = dragGesture.toolId;
      draggedFromFavorites = dragGesture.fromFavorites;
      dragGesture.row.classList.add("dragging");
      dragGhost = createDragGhost(draggedToolId, dragGesture.row);
      const rowRect = dragGesture.row.getBoundingClientRect();
      dragGhostOffset = {
        x: Math.max(0, Math.min(rowRect.width, (event.clientX || 0) - rowRect.left)),
        y: Math.max(0, Math.min(rowRect.height, (event.clientY || 0) - rowRect.top))
      };
      updateDragGhostPosition(event.clientX || 0, event.clientY || 0);
      toolList.classList.remove("drag-primed");
      toolList.classList.add("drag-active");
      suppressNextClick = true;
    }

    updateDragGhostPosition(event.clientX || 0, event.clientY || 0);
    applyDropMarkers(getDropContext(event.clientX || 0, event.clientY || 0));
  } else {
    toolList.classList.add("drag-primed");
  }
}

document.addEventListener("mousemove", (event) => {
  maybePrimeDrag(event);
});
window.addEventListener("mousemove", maybePrimeDrag);

document.addEventListener("mouseup", (event) => {
  clearPressedRows();

  if (!draggedToolId) {
    dragGesture = null;
    toolList.classList.remove("drag-primed");
    return;
  }

  const committed = commitDrop(getDropContext(event.clientX || 0, event.clientY || 0));
  endDragState();

  if (committed) {
    renderToolList();
    syncActiveToolRow();
  }
});

window.addEventListener("blur", () => {
  clearPressedRows();
  endDragState();
});

fieldMount.addEventListener("input", (event) => {
  const fieldId = event.target.dataset.fieldId;
  if (!fieldId) {
    return;
  }

  syncRangeValue(fieldId);
  syncDependentFields();
  if (editingToolId) {
    syncToolEditedState(editingToolId, hasCustomSettingsFromPayload(editingToolId, collectSettingsFromSheet()));
  }
});

renderToolList();
syncTabBar();
syncActiveToolRow();
syncActionState();
refreshSelection();
startPhysicsSelectionRefresh();
