const SETTINGS_KEY = "rdzTools.toolSettings.v1";

const tools = [
  {
    id: "wordBlurRight",
    group: "Text Animation",
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
    id: "wordBlurUp",
    group: "Text Animation",
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
    id: "layerScalePop",
    group: "Layer Animation",
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
    id: "bouce",
    group: "Utility",
    title: "Bouce",
    blurb: "Adds an overshoot expression to existing transform keys.",
    sections: [
      {
        title: "Expression Setup",
        description: "Choose which transform property gets the bounce expression and shape the feel.",
        fields: [
          { id: "target", label: "Apply bounce to", type: "select", defaultValue: "Position", options: ["Position", "Scale", "Rotation"] },
          { id: "amount", label: "Amount", type: "range", defaultValue: 10, min: 0, max: 100, step: 1, suffix: "%" },
          { id: "duration", label: "Duration", type: "range", defaultValue: 1, min: 0.05, max: 2, step: 0.05, suffix: "s" },
          { id: "chaos", label: "Chaos", type: "range", defaultValue: 0, min: 0, max: 100, step: 1, suffix: "%" }
        ]
      }
    ]
  }
];

const toolMap = Object.fromEntries(tools.map((tool) => [tool.id, tool]));
const bridge = getBridge();

let activeToolId = tools[0].id;
let editingToolId = null;
let savedSettings = loadSavedSettings();

const toolList = document.getElementById("toolList");
const fieldMount = document.getElementById("fieldMount");
const sheetGroup = document.getElementById("sheetGroup");
const sheetTitle = document.getElementById("sheetTitle");
const sheetDescription = document.getElementById("sheetDescription");
const settingsOverlay = document.getElementById("settingsOverlay");

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

function setStatus(message, tone = "normal") {
  return { message: message, tone: tone };
}

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderToolList() {
  const groups = new Map();
  for (const tool of tools) {
    if (!groups.has(tool.group)) {
      groups.set(tool.group, []);
    }
    groups.get(tool.group).push(tool);
  }

  toolList.innerHTML = Array.from(groups.entries())
    .map(
      ([group, groupTools]) => `
        <section class="group-block">
          <div class="group-head">${group}</div>
          ${groupTools
            .map(
              (tool) => `
                <div class="tool-row row-enter ${tool.id === activeToolId ? "active" : ""}" style="animation-delay:${Math.min(220, indexOfTool(tool.id) * 26)}ms">
                  <button class="tool-main" data-select-tool="${tool.id}">
                    <strong>${tool.title}</strong>
                  </button>
                  <button class="icon-button" data-edit-tool="${tool.id}" aria-label="Edit settings">...</button>
                </div>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");
}

function syncActiveToolRow() {
  document.querySelectorAll(".tool-row").forEach((row) => {
    const button = row.querySelector("[data-select-tool]");
    if (!button) {
      return;
    }
    row.classList.toggle("active", button.dataset.selectTool === activeToolId);
  });
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
  setStatus(`Saved settings for ${toolMap[editingToolId].title}.`, "success");
  closeSettings();
}

async function refreshSelection() {
  await bridge.eval("rdzTools.getSelectionSummary()");
}

async function applyActiveTool() {
  const payload = getToolSettings(activeToolId);
  const payloadString = escapeString(JSON.stringify(payload));

  setStatus(`Applying ${toolMap[activeToolId].title}...`);
  const result = await bridge.eval(`rdzTools.applyTool("${escapeString(activeToolId)}","${payloadString}")`);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
}

document.getElementById("refreshSelection").addEventListener("click", refreshSelection);
document.getElementById("applyTool").addEventListener("click", applyActiveTool);
document.getElementById("closeSettings").addEventListener("click", closeSettings);
document.getElementById("saveSettings").addEventListener("click", saveSettingsForEditingTool);
document.getElementById("resetSettings").addEventListener("click", resetSettingsForEditingTool);
document.querySelector(".overlay-backdrop").addEventListener("click", closeSettings);

toolList.addEventListener("click", (event) => {
  const selectButton = event.target.closest("[data-select-tool]");
  if (selectButton) {
    activeToolId = selectButton.dataset.selectTool;
    syncActiveToolRow();
    return;
  }

  const editButton = event.target.closest("[data-edit-tool]");
  if (editButton) {
    openSettings(editButton.dataset.editTool);
  }
});

toolList.addEventListener("pointerdown", (event) => {
  const row = event.target.closest(".tool-row");
  if (row) {
    row.classList.add("pressed");
  }
});

function clearPressedRows() {
  document.querySelectorAll(".tool-row.pressed").forEach((row) => row.classList.remove("pressed"));
}

toolList.addEventListener("pointerup", clearPressedRows);
toolList.addEventListener("pointerleave", clearPressedRows);

fieldMount.addEventListener("input", (event) => {
  const fieldId = event.target.dataset.fieldId;
  if (!fieldId) {
    return;
  }

  syncRangeValue(fieldId);
  syncDependentFields();
});

renderToolList();
syncActiveToolRow();
refreshSelection();
