/* Visual Template Builder: local, dependency-free Home Assistant custom panel. */
const DOMAIN = "visual_template_builder";
const TEXT = {
  it: {
    mapping: "Stato → testo", advanced: "Editor avanzato", mappingHelp: "Scegli l’entità e scrivi il testo da mostrare per ogni stato.",
    mappingSource: "Quale entità vuoi descrivere?", mappingState: "Quando lo stato è", mappingText: "Mostra questo testo",
    otherStates: "Per gli altri stati", addState: "Aggiungi stato", customState: "Altro stato…", rawState: "Stato personalizzato",
    chooseSourceFirst: "Scegli un’entità per iniziare. Gli stati comuni vengono proposti automaticamente.",
    mappingLimit: "Puoi associare fino a 10 stati. Per regole più complesse usa l’editor avanzato.",
    mappingDuplicate: "Ogni stato può comparire una sola volta. Rimuovi o modifica le righe duplicate.",
    mappingEmpty: "Seleziona un’entità e completa gli stati della tabella.",
    complexRule: "Questa regola usa una logica più complessa e si modifica nell’editor avanzato.",
    sourceMissingHelp: "Se l’entità non è disponibile, si applica il comportamento scelto in Proprietà e disponibilità.",
    otherDefault: "Altro stato", state_on: "Acceso", state_off: "Spento", state_open: "Aperto", state_closed: "Chiuso", state_opening: "In apertura", state_closing: "In chiusura",
    valueType: "Tipo di valore", title: "Sensori visuali", intro: "Trasforma le tue entità in calcoli, condizioni e testi. Senza codice.",
    new: "Crea sensore", empty: "Il tuo primo sensore visuale", emptyText: "Scegli un tipo di risultato e componi la regola con le entità di Home Assistant.",
    number: "Numero", text: "Testo", binary: "Binario · acceso/spento", name: "Nome", kind: "Risultato",
    formula: "Componi la regola", preview: "Anteprima dal vivo", save: "Salva sensore", cancel: "Annulla",
    edit: "Modifica", duplicate: "Duplica", delete: "Elimina", confirm: "Eliminare definitivamente questo sensore?",
    unsaved: "Abbandonare le modifiche non salvate?", unit: "Unità di misura", icon: "Icona", device: "Classe dispositivo",
    state: "Classe di stato", none: "Nessuna", missing: "Se il calcolo non è disponibile", unavailable: "Rendi indisponibile",
    keep: "Mantieni l’ultimo valore valido", fallback: "Usa un valore sostitutivo", fallbackValue: "Valore sostitutivo",
    keepHelp: "Il valore conservato avrà l’attributo stale=true. Prima del primo valore valido il sensore resta indisponibile.",
    source: "Entità", attribute: "Attributo (vuoto = stato)", constant: "Valore fisso", add: "Aggiungi elemento", remove: "Rimuovi",
    then: "Allora", otherwise: "Altrimenti", condition: "Se", tolerance: "Tolleranza", digits: "Decimali",
    settings: "Proprietà e disponibilità", sources: "Sorgenti", live: "Valore attuale", refresh: "Aggiorna elenco", copy: "copia",
    retained: "In esecuzione verrà mantenuto l’ultimo valore valido, se presente.", saved: "Sensore salvato", error: "Errore",
    export: "Esporta configurazione", search: "Cerca un sensore…", typeFixed: "Il tipo non è modificabile dopo la creazione.",
    choose: "Seleziona un’entità…", operation: "Operazione", noSources: "Nessuna sorgente: valore costante", pending: "Calcolo…",
  },
  en: {
    mapping: "State → text", advanced: "Advanced editor", mappingHelp: "Choose the entity and enter the text to display for each state.",
    mappingSource: "Which entity do you want to describe?", mappingState: "When the state is", mappingText: "Display this text",
    otherStates: "For other states", addState: "Add state", customState: "Other state…", rawState: "Custom state",
    chooseSourceFirst: "Choose an entity to start. Common states are suggested automatically.",
    mappingLimit: "Map up to 10 states. Use the advanced editor for more complex rules.",
    mappingDuplicate: "Each state can appear only once. Remove or change duplicate rows.",
    mappingEmpty: "Choose an entity and complete the states in the table.",
    complexRule: "This rule uses more complex logic and can be edited in the advanced editor.",
    sourceMissingHelp: "When the entity is unavailable, the behavior in Properties and availability applies.",
    otherDefault: "Other state", state_on: "On", state_off: "Off", state_open: "Open", state_closed: "Closed", state_opening: "Opening", state_closing: "Closing",
    valueType: "Value type", title: "Visual sensors", intro: "Turn your entities into calculations, conditions and text. No code needed.",
    new: "Create sensor", empty: "Your first visual sensor", emptyText: "Choose a result type and compose a rule using Home Assistant entities.",
    number: "Number", text: "Text", binary: "Binary · on/off", name: "Name", kind: "Result",
    formula: "Build the rule", preview: "Live preview", save: "Save sensor", cancel: "Cancel",
    edit: "Edit", duplicate: "Duplicate", delete: "Delete", confirm: "Permanently delete this sensor?",
    unsaved: "Discard unsaved changes?", unit: "Unit of measurement", icon: "Icon", device: "Device class",
    state: "State class", none: "None", missing: "When evaluation is unavailable", unavailable: "Mark unavailable",
    keep: "Keep last valid value", fallback: "Use a fallback value", fallbackValue: "Fallback value",
    keepHelp: "Retained values have stale=true. Until the first valid value, the sensor stays unavailable.",
    source: "Entity", attribute: "Attribute (empty = state)", constant: "Constant", add: "Add operand", remove: "Remove",
    then: "Then", otherwise: "Otherwise", condition: "If", tolerance: "Tolerance", digits: "Decimals",
    settings: "Properties and availability", sources: "Sources", live: "Current value", refresh: "Refresh list", copy: "copy",
    retained: "At runtime the last valid value will be retained, if one exists.", saved: "Sensor saved", error: "Error",
    export: "Export configuration", search: "Search sensors…", typeFixed: "The result type cannot change after creation.",
    choose: "Select an entity…", operation: "Operation", noSources: "No sources: constant value", pending: "Calculating…",
  },
};
const OPS = {
  entity: ["Entità / attributo", "Entity / attribute", 0, 0], value: ["Valore fisso", "Constant", 0, 0],
  add: ["Somma", "Sum", 2, 30], subtract: ["Sottrazione", "Subtract", 2, 2],
  multiply: ["Moltiplicazione", "Multiply", 2, 30], divide: ["Divisione", "Divide", 2, 2],
  mean: ["Media", "Average", 1, 30], min: ["Minimo", "Minimum", 1, 30], max: ["Massimo", "Maximum", 1, 30],
  round: ["Arrotonda", "Round", 2, 2], abs: ["Valore assoluto", "Absolute value", 1, 1],
  eq: ["Uguale a", "Equals", 2, 2], ne: ["Diverso da", "Not equal", 2, 2],
  gt: ["Maggiore di", "Greater than", 2, 2], gte: ["Maggiore o uguale", "Greater or equal", 2, 2],
  lt: ["Minore di", "Less than", 2, 2], lte: ["Minore o uguale", "Less or equal", 2, 2],
  near: ["Uguali entro tolleranza", "Equal within tolerance", 3, 3],
  and: ["Tutte vere (E)", "All true (AND)", 1, 30], or: ["Almeno una vera (O)", "Any true (OR)", 1, 30],
  not: ["Inverti (NON)", "Invert (NOT)", 1, 1], if: ["Se / allora / altrimenti", "If / then / else", 3, 3],
  concat: ["Unisci testi e valori", "Join text and values", 1, 30], count: ["Conta condizioni vere", "Count true conditions", 1, 30],
};
const constant = (value = 0) => ({op: "value", value});
function expression(op) {
  if (op === "entity") return {op, entity_id: "", attribute: ""};
  if (op === "value") return constant();
  if (op === "if") return {op, args: [constant(true), constant(""), constant("")]};
  return {op, args: Array.from({length: OPS[op][2]}, () => constant(["and", "or", "not", "count"].includes(op) ? true : op === "concat" ? "" : 0))};
}
// Recognize existing 0.1.0 rules without changing their ordering or fallback.
function readStateMapping(tree) {
  const rows = [];
  let entityId = null;
  let cursor = tree;
  while (cursor?.op === "if") {
    const [condition, output, next] = cursor.args || [];
    if (condition?.op !== "eq" || output?.op !== "value" || typeof output.value !== "string") return null;
    let [source, state] = condition.args || [];
    if (source?.op === "value") [source, state] = [state, source];
    if (source?.op !== "entity" || source.attribute || state?.op !== "value" || typeof state.value !== "string") return null;
    if (entityId !== null && entityId !== source.entity_id) return null;
    entityId = source.entity_id;
    rows.push({state: state.value, text: output.value});
    cursor = next;
    if (rows.length > 10) return null;
  }
  if (!rows.length || cursor?.op !== "value" || typeof cursor.value !== "string") return null;
  if (new Set(rows.map(row => row.state)).size !== rows.length) return null;
  return {entityId, rows, otherwise: cursor.value};
}
function mappingExpression(mapping) {
  return mapping.rows.reduceRight((next, row) => ({
    op: "if", args: [
      {op: "eq", args: [{op: "entity", entity_id: mapping.entityId}, constant(row.state)]},
      constant(row.text), next,
    ],
  }), constant(mapping.otherwise));
}
function element(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "class") node.className = value;
    else if (value !== null && value !== undefined) node.setAttribute(key, value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) node.append(child);
  return node;
}
const CSS = `
.mode-choice{display:flex;gap:8px;margin:12px 0 18px;flex-wrap:wrap}.mode-choice button[aria-pressed="true"]{background:var(--accent);color:white;border-color:var(--accent)}
.mapping-intro{margin-top:0}.mapping-current{display:block;margin:12px 0 20px;color:var(--secondary-text-color,#64748b)}
.mapping-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:12px;align-items:end;padding:14px 0;border-top:1px solid var(--divider-color,#dde3eb)}
.mapping-row label{min-width:0}.mapping-row.active{border-left:3px solid var(--accent);padding-left:10px}.mapping-row .custom-state{margin-top:8px}.mapping-other{margin-top:20px;padding-top:18px;border-top:1px solid var(--divider-color,#dde3eb)}
@media(max-width:600px){.mapping-row{grid-template-columns:minmax(0,1fr) auto;gap:10px}.mapping-row .mapping-state{grid-column:1;grid-row:1}.mapping-row .mapping-text{grid-column:1;grid-row:2}.mapping-row .mapping-remove{grid-column:2;grid-row:1 / 3;align-self:center}.mapping-row input,.mapping-row select{font-size:16px}.mapping-current{overflow-wrap:anywhere}}

:host{display:block;height:100%;overflow:auto;background:var(--primary-background-color,#f5f7fa);color:var(--primary-text-color,#18283b);font-family:var(--paper-font-body1_-_font-family,system-ui);--accent:var(--primary-color,#039be5)}
*{box-sizing:border-box}header{display:flex;align-items:center;gap:12px;padding:16px 24px;background:var(--card-background-color,white);border-bottom:1px solid var(--divider-color,#dde3eb);position:sticky;top:0;z-index:2}header strong{font-size:18px}header small{margin-left:auto;color:var(--secondary-text-color,#64748b)}
main{max-width:1180px;margin:auto;padding:28px 24px 60px}h1{font-size:30px;margin:0 0 8px}h2{font-size:19px;margin:0 0 18px}p{color:var(--secondary-text-color,#64748b);line-height:1.55}.toolbar,.row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.toolbar{justify-content:space-between;margin:24px 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}.card,.section{background:var(--card-background-color,white);border:1px solid var(--divider-color,#dde3eb);border-radius:16px;padding:22px}.card h2{margin:12px 0 6px}.card small{overflow-wrap:anywhere}.card .value{font-size:26px;margin:22px 0}.badge{display:inline-block;padding:5px 9px;border-radius:7px;background:var(--secondary-background-color,#edf5fb);font-size:12px;color:var(--accent)}button{font:inherit;cursor:pointer;border-radius:9px;min-height:40px;border:1px solid var(--divider-color,#d7e0e9);padding:9px 14px;background:var(--card-background-color,white);color:var(--primary-text-color,#18283b)}button:hover{filter:brightness(.96)}button.primary{background:var(--accent);color:white;border-color:var(--accent)}button.danger{color:var(--error-color,#db4437)}button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus,select:focus{outline:2px solid var(--accent);outline-offset:2px}input,select{width:100%;min-width:0;background:var(--card-background-color,white);color:var(--primary-text-color,#18283b);border:1px solid var(--divider-color,#cbd5e1);border-radius:8px;padding:11px;font:inherit;min-height:44px}label{display:block;min-width:0}label>span{display:block;font-size:13px;font-weight:600;margin:0 0 7px}.fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}.editor{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:20px;align-items:start}.section{margin-bottom:16px}.preview{position:sticky;top:88px;border-top:4px solid var(--accent)}.preview .result{font-size:28px;overflow-wrap:anywhere;margin:14px 0}.preview small{display:block;overflow-wrap:anywhere}.node{border-left:3px solid var(--accent);border-radius:6px;background:var(--secondary-background-color,#f2f6fa);padding:12px;margin-top:10px;min-width:0}.node .node{background:var(--card-background-color,white)}.node-head{display:flex;gap:8px;align-items:center}.node-head select{flex:1}.operands{padding-left:10px}.operand-title{font-size:12px;font-weight:600;display:block;margin-top:14px}.source-live{display:block;color:var(--secondary-text-color,#64748b);font-size:12px;margin-top:7px;overflow-wrap:anywhere}.node .fields{margin-top:10px}.empty{text-align:center;padding:64px 24px}.empty .symbol{font-size:50px;color:var(--accent)}.error{color:var(--error-color,#db4437);overflow-wrap:anywhere}.notice{padding:12px 16px;background:var(--card-background-color,white);border-left:4px solid var(--accent);margin-bottom:16px;border-radius:6px}.actions{display:flex;gap:10px;margin-top:20px}.muted,small{color:var(--secondary-text-color,#64748b)}summary{cursor:pointer;font-weight:600;margin-bottom:18px}.source-list{margin-top:20px;border-top:1px solid var(--divider-color,#ddd);padding-top:14px}.search{max-width:320px}.menu{padding:8px;border:0;font-size:22px}.more{margin-top:10px} @media(max-width:850px){.editor{grid-template-columns:1fr}.preview{position:static}.fields{grid-template-columns:1fr}main{padding:20px 14px 40px}header{padding:12px 14px}.operands{padding-left:3px}.node{padding:9px}.section{padding:16px}h1{font-size:25px}.toolbar>div{width:100%}.search{max-width:none}.node-head select{max-width:100%}}
`;
class VisualTemplateBuilderPanel extends HTMLElement {
  constructor() {
    super(); this.attachShadow({mode: "open"}); this.sensors = []; this.revision = 0; this.metadata = {};
    this.draft = null; this.dirty = false; this.busy = false; this.loaded = false; this.sequence = 0;
  }
  t(key) { return (TEXT[this.lang] || TEXT.en)[key] || key; }
  set hass(value) {
    const previous = this._hass; this._hass = value; this.lang = value.language?.startsWith("it") ? "it" : "en";
    if (!this.loaded && this.isConnected) { this.loaded = true; this.load(); }
    else if (this.draft && previous?.states !== value.states) {
      const deps = this.dependencies(this.draft.expression);
      if ([...deps].some(id => previous?.states[id] !== value.states[id])) { this.queuePreview(); this.updateSourceLabels(); this.updateMappingLive(); }
    } else if (!this.draft) {
      this.updateValues();
      if (this.sensors.some(sensor => !sensor.entity_id) && !this.refreshingIds) {
        this.refreshingIds = true;
        this.api("list").then(snapshot => {
          if (!this.draft && this.isConnected) { Object.assign(this, snapshot); this.render(); }
        }).catch(() => {}).finally(() => { this.refreshingIds = false; });
      }
    }
  }
  get hass() { return this._hass; }
  connectedCallback() { if (this._hass && !this.loaded) { this.loaded = true; this.load(); } }
  disconnectedCallback() { clearTimeout(this.timer); this.sequence++; }
  async api(action, extra = {}) { return this._hass.callWS({type: `${DOMAIN}/command`, action, ...extra}); }
  async load() {
    try { const [snapshot, metadata] = await Promise.all([this.api("list"), this.api("metadata")]); Object.assign(this, snapshot); this.metadata = metadata; this.render(); }
    catch (error) { this.notice = error.message || String(error); this.render(); }
  }
  button(label, onclick, cls = "") { return element("button", {type: "button", class: cls, onclick}, label); }
  field(label, input, accessibleLabel = label) { input.setAttribute("aria-label", accessibleLabel); return element("label", {}, element("span", {}, label), input); }
  input(value, change, attrs = {}) { const input = element("input", {...attrs, oninput: event => change(event.target.value)}); input.value = value ?? ""; return input; }
  select(value, options, change) {
    const select = element("select", {onchange: event => change(event.target.value)});
    for (const [id, label] of options) select.append(element("option", {value: id}, label));
    select.value = value; return select;
  }
  touch() { this.dirty = true; this.queuePreview(); }
  dependencies(node, result = new Set()) { if (node.op === "entity") result.add(node.entity_id); for (const arg of node.args || []) this.dependencies(arg, result); return result; }
  start(item, duplicate = false) {
    if (this.dirty && !confirm(this.t("unsaved"))) return;
    this.draft = item ? structuredClone(item) : {name: "", kind: "number", expression: expression("add"), missing: "unavailable", unit: "", device_class: "", state_class: "", icon: ""};
    delete this.draft.entity_id;
    if (duplicate) { delete this.draft.id; this.draft.name += ` (${this.t("copy")})`; }
    this.mapping = this.draft.kind === "text" ? readStateMapping(this.draft.expression) : null;
    this.editorMode = this.mapping ? "mapping" : "advanced";
    this.dirty = duplicate; this.notice = ""; this.render(); this.queuePreview();
  }
  cancel() { if (this.dirty && !confirm(this.t("unsaved"))) return; this.draft = null; this.dirty = false; this.sequence++; clearTimeout(this.timer); this.render(); }
  render() {
    this.shadowRoot.replaceChildren(element("style", {}, CSS));
    this.shadowRoot.append(element("header", {}, this.button("☰", () => this.dispatchEvent(new CustomEvent("hass-toggle-menu", {bubbles: true, composed: true})), "menu"), element("strong", {}, "Visual Template Builder"), element("small", {}, "v0.2.0")));
    const main = element("main"); this.shadowRoot.append(main);
    if (this.notice) main.append(element("div", {class: "notice", role: "status"}, this.notice));
    if (this.draft) this.renderEditor(main); else this.renderList(main);
  }
  renderList(main) {
    main.append(element("h1", {}, this.t("title")), element("p", {}, this.t("intro")));
    const search = this.input(this.search || "", value => { this.search = value; this.filterList(); }, {placeholder: this.t("search"), "aria-label": this.t("search"), class: "search"});
    main.append(element("div", {class: "toolbar"}, search, element("div", {class: "row"},
      this.button(this.t("refresh"), () => this.load()), this.button(this.t("export"), () => this.export()), this.button("+ " + this.t("new"), () => this.start(), "primary"))));
    if (!this.sensors.length) main.append(element("div", {class: "section empty"}, element("div", {class: "symbol"}, "ƒ"), element("h2", {}, this.t("empty")), element("p", {}, this.t("emptyText")), this.button(this.t("new"), () => this.start(), "primary")));
    const grid = element("div", {class: "grid"}); main.append(grid);
    for (const sensor of this.sensors) {
      const card = element("article", {class: "card", "data-name": sensor.name.toLowerCase()}, element("span", {class: "badge"}, this.t(sensor.kind)), element("h2", {}, sensor.name), element("small", {}, sensor.entity_id || "…"), element("div", {class: "value", "data-entity": sensor.entity_id || ""}, "…"), element("div", {class: "row"},
        this.button(this.t("edit"), () => this.start(sensor)), this.button(this.t("duplicate"), () => this.start(sensor, true)), this.button(this.t("delete"), () => this.remove(sensor), "danger")));
      grid.append(card);
    }
    this.filterList(); this.updateValues();
  }
  filterList() { for (const card of this.shadowRoot.querySelectorAll("[data-name]")) card.hidden = !card.dataset.name.includes((this.search || "").toLowerCase()); }
  updateValues() {
    for (const node of this.shadowRoot.querySelectorAll("[data-entity]")) {
      const state = this._hass?.states[node.dataset.entity]; node.textContent = state ? `${state.state} ${state.attributes.unit_of_measurement || ""}${state.attributes.stale ? " ⚠" : ""}` : "…";
    }
  }
  renderEditor(main) {
    const d = this.draft;
    main.append(element("h1", {}, d.id ? this.t("edit") : this.t("new")));
    const layout = element("div", {class: "editor"}); const form = element("div"); layout.append(form); main.append(layout);
    const kind = this.select(d.kind, ["number", "text", "binary"].map(x => [x, this.t(x)]), value => {
      d.kind = value; d.unit = ""; d.device_class = ""; d.state_class = ""; d.fallback = value === "binary" ? false : value === "number" ? 0 : "";
      d.expression = expression(value === "number" ? "add" : value === "binary" ? "gt" : "if");
      this.mapping = value === "text" ? {entityId: "", rows: [{state: "", text: ""}], otherwise: this.t("otherDefault")} : null;
      this.editorMode = this.mapping ? "mapping" : "advanced";
      if (this.mapping) this.syncMapping();
      this.touch(); this.render();
    }); if (d.id) { kind.disabled = true; kind.title = this.t("typeFixed"); }
    form.append(element("div", {class: "section fields"}, this.field(this.t("name"), this.input(d.name, value => {d.name = value; this.touch();}, {maxlength: "100"})), this.field(this.t("kind"), kind)));
    const formula = element("section", {class: "section"}, element("h2", {}, this.t("formula")));
    if (d.kind === "text") {
      const modes = element("div", {class: "mode-choice", role: "group", "aria-label": this.t("formula")});
      for (const mode of ["mapping", "advanced"]) {
        const button = this.button(this.t(mode), () => {
          if (mode === this.editorMode) return;
          if (mode === "mapping") {
            const mapping = readStateMapping(d.expression);
            if (!mapping) return;
            this.mapping = mapping;
          }
          this.editorMode = mode; this.render();
        });
        button.setAttribute("aria-pressed", String(this.editorMode === mode));
        if (mode === "mapping" && this.editorMode !== mode && !readStateMapping(d.expression)) {
          button.disabled = true; button.title = this.t("complexRule");
        }
        modes.append(button);
      }
      formula.append(modes);
      if (this.editorMode !== "mapping" && !readStateMapping(d.expression)) formula.append(element("small", {}, this.t("complexRule")));
    }
    if (this.editorMode === "mapping" && d.kind === "text") this.renderMapping(formula);
    else formula.append(this.renderNode(d.expression, value => { d.expression = value; }));
    form.append(formula);
    const settings = element("details", {class: "section"}, element("summary", {}, this.t("settings")));
    const fields = element("div", {class: "fields"}); settings.append(fields);
    for (const key of ["unit", "icon"]) if (key !== "unit" || d.kind === "number") fields.append(this.field(this.t(key), this.input(d[key], value => { d[key] = value; this.touch(); }, {placeholder: key === "icon" ? "mdi:function-variant" : "kW"})));
    if (d.kind !== "text") fields.append(this.field(this.t("device"), this.select(d.device_class || "", [["", this.t("none")], ...(this.metadata[d.kind] || []).map(x => [x, x])], value => { d.device_class = value; this.touch(); })));
    if (d.kind === "number") fields.append(this.field(this.t("state"), this.select(d.state_class || "", ["", "measurement", "total", "total_increasing"].map(x => [x, x || this.t("none")]), value => {d.state_class = value; this.touch();})));
    const policy = this.select(d.missing, ["unavailable", "keep", "fallback"].map(x => [x, this.t(x)]), value => {d.missing = value; if (d.fallback === undefined) d.fallback = d.kind === "binary" ? false : d.kind === "number" ? 0 : ""; this.touch(); this.render(); this.shadowRoot.querySelector("details").open = true;});
    fields.append(this.field(this.t("missing"), policy));
    if (d.missing === "fallback") fields.append(this.field(this.t("fallbackValue"), d.kind === "binary" ? this.select(String(d.fallback), [["true", "ON"], ["false", "OFF"]], v => {d.fallback = v === "true"; this.touch();}) : this.input(d.fallback, v => {d.fallback = d.kind === "number" ? (v === "" ? "" : Number(v)) : v; this.touch();}, {type: d.kind === "number" ? "number" : "text", step: "any"})));
    if (d.missing === "keep") settings.append(element("p", {}, this.t("keepHelp")));
    form.append(settings);
    this.saveButton = this.button(this.t("save"), () => this.save(), "primary"); this.saveButton.disabled = this.busy;
    form.append(element("div", {class: "actions"}, this.saveButton, this.button(this.t("cancel"), () => this.cancel())));
    this.previewBox = element("aside", {class: "section preview", "aria-live": "polite"}, element("h2", {}, this.t("preview")), element("p", {}, this.t("pending"))); layout.append(this.previewBox);
    const datalist = element("datalist", {id: "vtb-entities"});
    for (const [id, state] of Object.entries(this._hass.states).sort((a,b) => (a[1].attributes.friendly_name || a[0]).localeCompare(b[1].attributes.friendly_name || b[0]))) datalist.append(element("option", {value: id}, `${state.attributes.friendly_name || id} · ${state.state}`));
    main.append(datalist); this.updateMappingLive(); this.queuePreview();
  }
  stateLabel(state) {
    const key = `state_${state}`;
    return (TEXT[this.lang] || TEXT.en)[key] || state;
  }
  suggestedStates(entityId) {
    const entity = this._hass.states[entityId];
    const domain = entityId.split(".")[0];
    const common = domain === "cover" ? ["closed", "open", "opening", "closing"] : ["switch", "input_boolean", "binary_sensor"].includes(domain) ? ["on", "off"] : [];
    const options = Array.isArray(entity?.attributes.options) ? entity.attributes.options.filter(value => typeof value === "string") : [];
    const current = entity && !["unknown", "unavailable"].includes(entity.state) ? [entity.state] : [];
    return [...new Set([...common, ...options, ...current])];
  }
  syncMapping() { this.draft.expression = mappingExpression(this.mapping); }
  mappingError() {
    if (this.editorMode !== "mapping" || this.draft?.kind !== "text") return null;
    if (!this.mapping.entityId || this.mapping.rows.some(row => !row.state.trim())) return this.t("mappingEmpty");
    if (new Set(this.mapping.rows.map(row => row.state)).size !== this.mapping.rows.length) return this.t("mappingDuplicate");
    return null;
  }
  renderMapping(container) {
    const mapping = this.mapping;
    container.append(element("p", {class: "mapping-intro"}, this.t("mappingHelp")));
    const source = this.input(mapping.entityId, value => {
      mapping.entityId = value; this.syncMapping(); this.touch(); this.updateMappingLive();
    }, {list: "vtb-entities", placeholder: this.t("choose")});
    source.addEventListener("change", () => {
      // Only seed an untouched table; changing source never discards user text.
      if (mapping.rows.length === 1 && !mapping.rows[0].state && !mapping.rows[0].text) {
        const states = this.suggestedStates(mapping.entityId).slice(0, 10);
        if (states.length) mapping.rows = states.map(state => ({state, text: this.stateLabel(state)}));
      }
      this.syncMapping(); this.touch(); this.render();
    });
    container.append(this.field(this.t("mappingSource"), source), element("span", {class: "mapping-current"}));
    const suggestions = this.suggestedStates(mapping.entityId);
    mapping.rows.forEach((row, index) => {
      const custom = row.custom || !suggestions.includes(row.state);
      const chooser = this.select(custom ? "__custom__" : row.state, [...suggestions.map(state => [state, `${this.stateLabel(state)} (${state})`]), ["__custom__", this.t("customState")]], value => {
        row.custom = value === "__custom__";
        row.state = row.custom ? "" : value;
        this.syncMapping(); this.touch(); this.render();
      });
      const stateField = element("div", {class: "mapping-state"}, this.field(this.t("mappingState"), chooser, `${this.t("mappingState")} ${index + 1}`));
      if (custom) stateField.append(this.field(`${this.t("rawState")} ${index + 1}`, this.input(row.state, value => {row.state = value; this.syncMapping(); this.touch(); this.updateMappingLive();}, {class: "custom-state", maxlength: "255"})));
      const remove = this.button("×", () => {mapping.rows.splice(index, 1); this.syncMapping(); this.touch(); this.render();}, "mapping-remove");
      remove.setAttribute("aria-label", `${this.t("remove")} ${index + 1}`); remove.title = this.t("remove"); remove.disabled = mapping.rows.length === 1;
      const textField = this.field(this.t("mappingText"), this.input(row.text, value => {row.text = value; this.syncMapping(); this.touch();}, {maxlength: "255"}), `${this.t("mappingText")} ${index + 1}`);
      textField.className = "mapping-text";
      container.append(element("div", {class: "mapping-row", "data-mapping-index": index}, stateField, textField, remove));
    });
    const add = this.button("+ " + this.t("addState"), () => {
      const state = suggestions.find(state => !mapping.rows.some(row => row.state === state)) || "";
      mapping.rows.push({state, text: state ? this.stateLabel(state) : ""}); this.syncMapping(); this.touch(); this.render();
    }, "more"); add.disabled = mapping.rows.length >= 10;
    container.append(add);
    if (mapping.rows.length >= 10) container.append(element("p", {}, this.t("mappingLimit")));
    container.append(element("div", {class: "mapping-other"}, this.field(this.t("otherStates"), this.input(mapping.otherwise, value => {mapping.otherwise = value; this.syncMapping(); this.touch();}, {maxlength: "255"})), element("p", {}, this.t("sourceMissingHelp"))));
    this.updateMappingLive();
  }
  updateMappingLive() {
    if (!this.mapping || this.editorMode !== "mapping") return;
    const state = this._hass.states[this.mapping.entityId];
    const label = this.shadowRoot.querySelector(".mapping-current");
    if (label) label.textContent = state ? `${state.attributes.friendly_name || this.mapping.entityId} · ${this.t("live")}: ${this.stateLabel(state.state)} (${state.state})` : this.t("chooseSourceFirst");
    for (const row of this.shadowRoot.querySelectorAll(".mapping-row")) row.classList.toggle("active", this.mapping.rows[Number(row.dataset.mappingIndex)]?.state === state?.state);
  }
  renderNode(node, replace, depth = 0) {
    const box = element("div", {class: "node"});
    const choices = Object.entries(OPS).filter(([key]) => depth < 12 || ["value", "entity"].includes(key)).map(([key, meta]) => [key, meta[this.lang === "it" ? 0 : 1]]);
    const op = this.select(node.op, choices, value => { replace(expression(value)); this.touch(); this.render(); }); op.setAttribute("aria-label", this.t("operation"));
    box.append(element("div", {class: "node-head"}, op));
    if (node.op === "value") {
      const type = typeof node.value;
      const selector = this.select(type, [["number", this.t("number")], ["string", this.t("text")], ["boolean", "ON / OFF"]], value => {node.value = value === "boolean" ? true : value === "number" ? 0 : ""; this.touch(); this.render();});
      const input = type === "boolean" ? this.select(String(node.value), [["true", "ON"], ["false", "OFF"]], value => {node.value = value === "true"; this.touch();}) : this.input(node.value, value => {node.value = type === "number" ? (value === "" ? "" : Number(value)) : value; this.touch();}, {type: type === "number" ? "number" : "text", step: "any", maxlength: "255"});
      box.append(element("div", {class: "fields"}, this.field(this.t("valueType"), selector), this.field(this.t("constant"), input)));
    } else if (node.op === "entity") {
      box.append(element("div", {class: "fields"}, this.field(this.t("source"), this.input(node.entity_id, value => { node.entity_id = value; this.touch(); this.updateSourceLabels(); this.updateMappingLive(); }, {list: "vtb-entities", placeholder: this.t("choose")})), this.field(this.t("attribute"), this.input(node.attribute, value => {node.attribute = value; this.touch();}))));
      const live = element("span", {class: "source-live"}); live._expression = node; box.append(live);
      const state = this._hass.states[node.entity_id]; live.textContent = state ? `${state.attributes.friendly_name || node.entity_id}: ${state.state}` : "—";
    } else {
      const children = element("div", {class: "operands"});
      node.args.forEach((arg, index) => {
        const row = element("div");
        let label = String(index + 1);
        if (node.op === "if") label = this.t(["condition", "then", "otherwise"][index]);
        if (node.op === "near" && index === 2) label = this.t("tolerance");
        if (node.op === "round" && index === 1) label = this.t("digits");
        row.append(element("span", {class: "operand-title"}, label));
        row.append(this.renderNode(arg, value => {node.args[index] = value;}, depth + 1));
        if (node.args.length > OPS[node.op][2]) row.append(this.button(this.t("remove"), () => {node.args.splice(index, 1); this.touch(); this.render();}, "more"));
        children.append(row);
      });
      box.append(children);
      if (node.args.length < OPS[node.op][3]) box.append(this.button("+ " + this.t("add"), () => {node.args.push(constant(["and", "or", "count"].includes(node.op) ? true : node.op === "concat" ? "" : 0)); this.touch(); this.render();}, "more"));
    }
    return box;
  }
  updateSourceLabels() { for (const label of this.shadowRoot.querySelectorAll(".source-live")) { const node = label._expression; const state = this._hass.states[node.entity_id]; label.textContent = state ? `${state.attributes.friendly_name || node.entity_id}: ${node.attribute ? JSON.stringify(state.attributes[node.attribute]) : state.state}` : "—"; } }
  queuePreview() { clearTimeout(this.timer); const sequence = ++this.sequence; this.timer = setTimeout(() => this.preview(sequence), 300); }
  async preview(sequence) {
    if (!this.draft) return;
    try {
      const error = this.mappingError();
      if (error) {
        if (sequence === this.sequence) this.previewBox.replaceChildren(element("h2", {}, this.t("preview")), element("p", {}, error));
        return;
      }
      const result = await this.api("preview", {definition: {...this.draft, name: this.draft.name || "Preview"}});
      if (sequence !== this.sequence || !this.draft) return;
      this.previewBox.replaceChildren(element("h2", {}, this.t("preview")), element("div", {class: "result"}, result.value === null ? "—" : typeof result.value === "boolean" ? result.value ? "ON" : "OFF" : String(result.value)), element("small", {}, this.draft.unit || ""));
      if (result.error) this.previewBox.append(element("p", {class: "error"}, result.error));
      if (result.error && this.draft.missing === "keep") this.previewBox.append(element("p", {}, this.t("retained")));
      this.previewBox.append(element("div", {class: "source-list"}, element("strong", {}, this.t("sources")), ...(result.sources.length ? result.sources.map(id => element("p", {}, element("small", {}, this._hass.states[id]?.attributes.friendly_name || id), element("small", {}, id))) : [element("p", {}, this.t("noSources"))])));
    } catch (error) { if (sequence === this.sequence && this.previewBox) this.previewBox.replaceChildren(element("h2", {}, this.t("preview")), element("p", {class: "error"}, error.message || String(error))); }
  }
  async save() {
    if (this.busy) return;
    const error = this.mappingError();
    if (error) { this.notice = error; this.render(); return; }
    this.busy = true; this.saveButton.disabled = true;
    try { const result = await this.api("save", {definition: this.draft, revision: this.revision}); Object.assign(this, result); this.draft = null; this.dirty = false; this.sequence++; this.notice = this.t("saved"); }
    catch (error) { this.notice = error.message || String(error); }
    finally { this.busy = false; this.render(); }
  }
  async remove(sensor) {
    if (this.busy || !confirm(`${this.t("confirm")}\n${sensor.name}`)) return;
    this.busy = true;
    try { Object.assign(this, await this.api("delete", {sensor_id: sensor.id, revision: this.revision})); this.notice = ""; }
    catch (error) { this.notice = error.message || String(error); }
    finally { this.busy = false; this.render(); }
  }
  export() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, sensors: this.sensors.map(({entity_id, ...item}) => item)}, null, 2)], {type: "application/json"}));
    const link = element("a", {href: url, download: "visual-template-builder.json"}); link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
if (!customElements.get("visual-template-builder-panel")) customElements.define("visual-template-builder-panel", VisualTemplateBuilderPanel);
