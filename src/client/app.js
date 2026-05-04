const presetGroups = [
  {
    id: "text",
    title: "Text Motion",
    description: "Quick motion moves for title layers and kinetic typography.",
    items: [
      {
        id: "fadeUp",
        label: "Fade Up",
        blurb: "Offsets position and opacity for a clean editorial entrance.",
        tags: ["text", "intro", "clean"]
      },
      {
        id: "popIn",
        label: "Pop In",
        blurb: "Scales up from a tighter starting pose with eased opacity.",
        tags: ["text", "impact", "snappy"]
      },
      {
        id: "slideLeft",
        label: "Slide Left",
        blurb: "Horizontal motion with a short settle for lower-thirds and callouts.",
        tags: ["text", "ui", "lower-third"]
      }
    ]
  },
  {
    id: "looks",
    title: "Looks",
    description: "Fast layer styling passes for shapes, solids, and design elements.",
    items: [
      {
        id: "softShadow",
        label: "Soft Shadow",
        blurb: "Adds a gentle drop shadow effect for depth without mud.",
        tags: ["look", "shadow", "depth"]
      },
      {
        id: "bevelLite",
        label: "Bevel Lite",
        blurb: "Adds a restrained bevel pass to push flat shapes forward.",
        tags: ["look", "bevel", "shape"]
      },
      {
        id: "liquidGlass",
        label: "Liquid Glass",
        blurb: "Builds a glassy treatment stack you can tune into a signature finish.",
        tags: ["look", "glass", "stylized"]
      }
    ]
  },
  {
    id: "utilities",
    title: "Utilities",
    description: "Repeatable setup steps that speed up comp prep.",
    items: [
      {
        id: "centerAnchorPoint",
        label: "Center Anchor",
        blurb: "Moves the anchor point to the visual center of selected layers.",
        tags: ["utility", "anchor", "layout"]
      },
      {
        id: "createControlNull",
        label: "Create Control Null",
        blurb: "Drops a control null into the active comp and selects it.",
        tags: ["utility", "rig", "null"]
      }
    ]
  }
];

function getBridge() {
  if (typeof window.__adobe_cep__ !== "undefined") {
    return {
      eval(script) {
        return new Promise((resolve) => {
          window.__adobe_cep__.evalScript(script, resolve);
        });
      },
      available: true
    };
  }

  return {
    async eval(script) {
      if (script.includes("getSelectionSummary")) {
        return "Mock mode: no AE host connected.";
      }
      if (script.includes("ping")) {
        return "pong";
      }
      return "Mock mode: preset call skipped.";
    },
    available: false
  };
}

const bridge = getBridge();

const hostBadge = document.getElementById("hostBadge");
const statusText = document.getElementById("statusText");
const selectionSummary = document.getElementById("selectionSummary");
const presetMount = document.getElementById("presetMount");
const searchInput = document.getElementById("searchInput");

function setStatus(message, tone = "normal") {
  statusText.textContent = message;
  statusText.style.color = tone === "error" ? "var(--danger)" : tone === "success" ? "var(--success)" : "var(--muted)";
}

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderGroups(filterText = "") {
  const query = filterText.trim().toLowerCase();
  const groups = presetGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!query) {
          return true;
        }

        const haystack = [item.label, item.blurb, ...item.tags].join(" ").toLowerCase();
        return haystack.includes(query);
      })
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    presetMount.innerHTML = '<div class="empty-state">No presets match that search.</div>';
    return;
  }

  presetMount.innerHTML = groups
    .map(
      (group) => `
        <section class="preset-group">
          <div class="preset-head">
            <div>
              <h2>${group.title}</h2>
              <p>${group.description}</p>
            </div>
            <span class="muted-action">${group.items.length} preset${group.items.length === 1 ? "" : "s"}</span>
          </div>
          <div class="preset-grid">
            ${group.items
              .map(
                (item) => `
                  <article class="preset-card">
                    <h3>${item.label}</h3>
                    <p>${item.blurb}</p>
                    <div class="tag-row">
                      ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
                    </div>
                    <div class="preset-actions">
                      <span class="muted-action">${group.id}</span>
                      <button class="apply" data-group="${group.id}" data-preset="${item.id}">Apply</button>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("");
}

async function refreshSelection() {
  const summary = await bridge.eval("rdzTools.getSelectionSummary()");
  selectionSummary.textContent = summary;
}

async function pingHost() {
  const response = await bridge.eval("rdzTools.ping()");
  setStatus(`Host response: ${response}`, response === "pong" ? "success" : "normal");
}

async function applyPreset(groupId, presetId) {
  setStatus(`Applying ${presetId}...`);
  const script = `rdzTools.applyPreset("${escapeString(groupId)}","${escapeString(presetId)}")`;
  const result = await bridge.eval(script);
  const ok = typeof result === "string" && result.indexOf("OK:") === 0;
  setStatus(result, ok ? "success" : "error");
  await refreshSelection();
}

document.getElementById("refreshSelection").addEventListener("click", refreshSelection);
document.getElementById("pingHost").addEventListener("click", pingHost);
searchInput.addEventListener("input", (event) => {
  renderGroups(event.target.value);
});

presetMount.addEventListener("click", (event) => {
  const button = event.target.closest("button.apply");
  if (!button) {
    return;
  }

  applyPreset(button.dataset.group, button.dataset.preset);
});

hostBadge.textContent = bridge.available ? "AE Connected" : "Mock Mode";
renderGroups();
refreshSelection();
