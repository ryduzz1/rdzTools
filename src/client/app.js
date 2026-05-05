const SETTINGS_KEY = "rdzTools.toolSettings.v1";
const FAVORITES_KEY = "rdzTools.favorites.v1";
const FAVORITES_HINT_KEY = "rdzTools.favoritesHintDismissed.v1";
const tabDefinitions = [
  { id: "graphs", label: "Graphs" },
  { id: "presets", label: "Presets" },
  { id: "tools", label: "Tools" }
];

const tools = [
  {
    id: "wordBlurRight",
    group: "Text In",
    title: "Word Blur In From Right",
    blurb: "Each word slides in from the right with opacity and blur.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each word moves and how far apart the words fire.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.2" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Dial in the slide distance and whether the per-word blur is active.",
        fields: [
          { id: "distance", label: "Slide distance px (positive = from right)", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: true },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordBlurLeft",
    group: "Text In",
    title: "Word Blur In From Left",
    blurb: "Each word slides in from the left with opacity and blur.",
    sections: [
      {
        title: "Timing",
        description: "Control how long each word moves and how far apart the words fire.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.2" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Dial in the slide distance and whether the per-word blur is active.",
        fields: [
          { id: "distance", label: "Slide distance px (positive = from left)", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: true },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordBlurUp",
    group: "Text In",
    title: "Word Blur Up From Bottom",
    blurb: "Each word rises from below with opacity and blur.",
    sections: [
      {
        title: "Timing",
        description: "Same timing model as the rightward version, but tuned for vertical motion.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.2" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Set how far the words travel from below and how much blur leads them in.",
        fields: [
          { id: "distance", label: "Slide distance px (positive = from bottom)", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: true },
          { id: "blurAmt", label: "Start blur amount (px)", type: "number", defaultValue: "8", dependsOn: "blurEnabled" }
        ]
      }
    ]
  },
  {
    id: "wordBlurDown",
    group: "Text In",
    title: "Word Blur Down From Top",
    blurb: "Each word drops in from above with opacity and blur.",
    sections: [
      {
        title: "Timing",
        description: "Use this when the text should feel like it settles down into place.",
        fields: [
          { id: "wordDur", label: "Word duration (sec)", type: "number", defaultValue: "0.5", hint: "Snappy around 0.2, smoother around 0.5." },
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.2" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
      },
      {
        title: "Motion And Style",
        description: "Set the travel amount and blur for a softer downward settle.",
        fields: [
          { id: "distance", label: "Slide distance px (positive = from top)", type: "number", defaultValue: "40" },
          { id: "blurEnabled", label: "Enable word blur", type: "checkbox", defaultValue: true },
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
          { id: "stagger", label: "Stagger between words (sec)", type: "number", defaultValue: "0.16" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
          { id: "stagger", label: "Stagger between characters (sec)", type: "number", defaultValue: "0.035" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
    id: "layerScalePop",
    group: "Layer In",
    title: "Layer glitch scale",
    blurb: "Whole-layer pop with a hidden frame and frame-tight squash.",
    sections: [
      {
        title: "Timing",
        description: "Set the first frame of the pop. The rest is built on consecutive frames.",
        fields: [
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
      }
    ]
  },
  {
    id: "layerFadeUp",
    group: "Layer In",
    title: "Layer fade up",
    blurb: "Moves selected layers up into place with opacity.",
    sections: [
      {
        title: "Timing",
        description: "A straightforward layer entrance for solids, shapes, text, and comps.",
        fields: [
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.45" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
        ]
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
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.32" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
          { id: "duration", label: "Duration (sec)", type: "number", defaultValue: "0.4" },
          { id: "startSec", label: "Animation start (sec or Cursor)", type: "text", defaultValue: "Cursor" }
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
    id: "lookBevelLite",
    group: "Looks",
    title: "Bevel lite",
    blurb: "Adds a restrained alpha bevel that works well on clean graphic layers.",
    sections: [
      {
        title: "Bevel",
        description: "Use lightly. This is for polished edge definition, not chunky faux-3D.",
        fields: [
          { id: "thickness", label: "Edge thickness", type: "number", defaultValue: "4" },
          { id: "lightAngle", label: "Light angle (deg)", type: "number", defaultValue: "135" },
          { id: "lightIntensity", label: "Light intensity", type: "number", defaultValue: "0.7" }
        ]
      }
    ]
  },
  {
    id: "lookLiquidGlass",
    group: "Looks",
    title: "Liquid glass",
    blurb: "Builds a soft glassy stack with bevel, blur, glow, and shadow.",
    sections: [
      {
        title: "Glass Stack",
        description: "This is a first-pass native-AE glass treatment for glossy panels and soft UI chips.",
        fields: [
          { id: "blurAmt", label: "Surface blur (px)", type: "number", defaultValue: "3" },
          { id: "bevelThickness", label: "Bevel thickness", type: "number", defaultValue: "7" },
          { id: "glowRadius", label: "Glow radius", type: "number", defaultValue: "22" },
          { id: "glowIntensity", label: "Glow intensity", type: "number", defaultValue: "0.45" },
          { id: "shadowOpacity", label: "Shadow opacity (%)", type: "number", defaultValue: "24" },
          { id: "shadowDistance", label: "Shadow distance (px)", type: "number", defaultValue: "10" },
          { id: "shadowSoftness", label: "Shadow softness (px)", type: "number", defaultValue: "24" }
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
    blurb: "Saves the current comp frame to the desktop as a PNG.",
    sections: [{ title: "Action", description: "No settings.", fields: [] }]
  },
  {
    id: "bouce",
    group: "Rigging",
    title: "Bouce",
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
const compactToolButtons = [
  { id: "freezeFrame", label: "FRZ" },
  { id: "fitToComp", label: "FIT" },
  { id: "lookSoftShadow", label: "DSH" },
  { id: "centerAnchor", label: "ADJ" },
  { id: "enableMotionBlur", label: "MIR" },
  { id: "sequenceLayers", label: "SOL" },
  { id: "lookLongShadow", label: "SHA" },
  { id: "createControlNull", label: "NUL" },
  { id: "bouce", label: "BNC" },
  { id: "charBounceIn", label: "TXT" },
  { id: "lookLiquidGlass", label: "GLS" },
  { id: "lookBevelLite", label: "BVL" },
  { id: "layerBlurFadeIn", label: "BLR" },
  { id: "centerInComp", label: "CTR" },
  { id: "saveFrame", label: "PNG" }
];
const bridge = getBridge();

let activeToolId = tools[0].id;
let editingToolId = null;
let savedSettings = loadSavedSettings();
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

const toolList = document.getElementById("toolList");
const fieldMount = document.getElementById("fieldMount");
const sheetGroup = document.getElementById("sheetGroup");
const sheetTitle = document.getElementById("sheetTitle");
const sheetDescription = document.getElementById("sheetDescription");
const settingsOverlay = document.getElementById("settingsOverlay");
const tabBar = document.getElementById("tabBar");
const applyButton = document.getElementById("applyTool");
const actionbar = document.getElementById("actionbar");

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
      return "Mock mode.";
    }
  };
}

function loadSavedSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function persistSettings() {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
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
    return tool.group === "Text In" || tool.group === "Layer In" || tool.group === "Looks";
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

  for (const field of tool.sections.flatMap((section) => section.fields)) {
    defaults[field.id] = field.defaultValue;
  }

  return {
    ...defaults,
    ...(savedSettings[toolId] || {})
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
    <button class="compact-command" data-run-tool="${entry.id}" title="${tool.title}" aria-label="${tool.title}">
      ${entry.label}
    </button>
  `;
}

function renderToolsPanel() {
  return `
    <section class="tools-panel">
      <div class="tools-hero">
        <div class="anchor-pad" aria-label="Anchor point tools">
          ${anchorTools
            .map(([toolId, position]) => `<button class="anchor-button anchor-${position}" data-run-tool="${toolId}" title="${toolMap[toolId].title}" aria-label="${toolMap[toolId].title}"><span></span></button>`)
            .join("")}
        </div>
        <div class="prime-command-stack">
          ${primaryToolButtons.map(primaryCommandMarkup).join("")}
        </div>
      </div>
      <div class="tools-divider"></div>
      <div class="compact-command-grid">
        ${compactToolButtons.map(compactCommandMarkup).join("")}
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
    toolList.innerHTML = `
      <section class="empty-panel">
        <div class="empty-kicker">Graphs</div>
        <h2>Graph tools are coming next.</h2>
        <p>This tab is reserved for curve helpers, graph shaping, and timing tools.</p>
      </section>
    `;
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

async function applyActiveTool() {
  if (!activeToolId) {
    return;
  }
  const payload = getToolSettings(activeToolId);
  const payloadString = escapeString(JSON.stringify(payload));

  setStatus(`Applying ${toolMap[activeToolId].title}...`);
  const result = await bridge.eval(`rdzTools.applyTool("${escapeString(activeToolId)}","${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
}

async function applyToolById(toolId) {
  const payload = getToolSettings(toolId);
  const payloadString = escapeString(JSON.stringify(payload));
  const result = await bridge.eval(`rdzTools.applyTool("${escapeString(toolId)}","${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
}

document.getElementById("refreshSelection").addEventListener("click", refreshSelection);
applyButton.addEventListener("click", applyActiveTool);
document.getElementById("closeSettings").addEventListener("click", closeSettings);
document.getElementById("saveSettings").addEventListener("click", saveSettingsForEditingTool);
document.getElementById("resetSettings").addEventListener("click", resetSettingsForEditingTool);
document.querySelector(".overlay-backdrop").addEventListener("click", closeSettings);
tabBar.addEventListener("click", (event) => {
  const tabButton = event.target.closest("[data-tab-id]");
  if (!tabButton || tabButton.dataset.tabId === activeTabId) {
    return;
  }
  setActiveTab(tabButton.dataset.tabId);
});

toolList.addEventListener("click", (event) => {
  if (suppressNextClick) {
    suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
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
