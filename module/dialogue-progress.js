import { createShortActionMessage } from "./chat.js";
import {
  FullProgressDialogue
} from "./dialogue-progressFull.js";

export class ProgressDialogue extends Application {
  constructor(actor, ...args) {
    super(...args);
    this._actor = actor;
    this.options.title = "Experiência - " + this._actor.name;

    Hooks.on("closeFullProgressDialogue", (app, ele) => {
      if (app === this._fullProgressDialogue) this._fullProgressDialogue = null;
    });
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "dialogue", "mta-sheet"],
      template: "systems/mta/templates/dialogues/dialogue-progress.html"
    });
  }

  getData() {
    const data = super.getData();
    data.actorData = this._actor.system;

    const progress = data.actorData.progress ?? [];

    const baseBeats =
      Number(data.actorData.beats ?? 0) +
      5 * Number(data.actorData.experience ?? 0);

    const baseArcaneBeats =
      Number(data.actorData.arcaneBeats ?? 0) +
      5 * Number(data.actorData.arcaneExperience ?? 0);

    data.beats_total = progress.reduce((acc, cur) => {
      return Number(cur.beats ?? 0) > 0 ? acc + Number(cur.beats ?? 0) : acc;
    }, Math.max(0, baseBeats));

    data.arcaneBeats_total = progress.reduce((acc, cur) => {
      return Number(cur.arcaneBeats ?? 0) > 0 ? acc + Number(cur.arcaneBeats ?? 0) : acc;
    }, Math.max(0, baseArcaneBeats));

    data.beats = progress.reduce((acc, cur) => {
      return acc + Number(cur.beats ?? 0);
    }, baseBeats);

    data.arcaneBeats = progress.reduce((acc, cur) => {
      return acc + Number(cur.arcaneBeats ?? 0);
    }, baseArcaneBeats);

    const beatsKey = CONFIG.MTA.EXTRA_BEAT_CONFIG[data.actorData.characterType];

    data.extraBeatsName = beatsKey ? game.i18n.localize(beatsKey) : undefined;
    data.showExtraBeats = !!beatsKey;
    data.progress = progress.slice(-5);
    while (data.progress.length < 5) data.progress.push({ name: "" });
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.addButton').click(ev => this.onAddProgress(ev));
    html.find('.spendButton').click(ev => this.onSpendXP(ev));
    html.find('.attribute-value').keyup(ev => {
      if (ev.keyCode === 13) this.onAddProgress(ev)
    });
    html.find('.item-delete').click(ev => this.onDeleteProgress(ev));
    html.find('.showAll').click(ev => this.onShowAll(ev));
    html.find(".attribute-value[name='input.name']").focus()
  }

  async onDeleteProgress(ev) {
    let index = Number(ev.currentTarget.dataset.index);
    index = Math.max(0, this._actor.system.progress.length - 5) + index;

    await this._actor.removeProgress(index);

    if (this._fullProgressDialogue) this._fullProgressDialogue.render();
    this.render();
  }

  async onAddProgress(ev) {
    let name = $('input[name ="input.name"]').val() ? $('input[name ="input.name"]').val() : "Motivo";
    let beats = $('input[name ="input.beats"]').val() ? $('input[name ="input.beats"]').val() : 0;
    let arcaneBeats = $('input[name ="input.arcaneBeats"]').val() ? $('input[name ="input.arcaneBeats"]').val() : 0;
    await this._actor.addProgress(name, beats, arcaneBeats);
    if (this._fullProgressDialogue) this._fullProgressDialogue.render();
    this.render();
  }

  async onSpendXP(ev) {
    let name = $('input[name ="input.name"]').val() ? $('input[name ="input.name"]').val() : "Motivo";
    let beats = $('input[name ="input.beats"]').val() ? $('input[name ="input.beats"]').val() : 0;
    let arcaneBeats = $('input[name ="input.arcaneBeats"]').val() ? $('input[name ="input.arcaneBeats"]').val() : 0;

    const xp = Math.abs(parseInt(beats, 10)) || 0;
    const arcaneXp = Math.abs(parseInt(arcaneBeats, 10)) || 0;

    const beatsToRemove = -5 * xp;
    const arcaneBeatsToRemove = -5 * arcaneXp;

    await this._actor.addProgress(name, beatsToRemove, arcaneBeatsToRemove);
    if (this._fullProgressDialogue) this._fullProgressDialogue.render();
    this.render();
  }

  async onShowAll(ev) {
    ev.preventDefault();
    if (this._fullProgressDialogue) this._fullProgressDialogue.bringToTop();
    else this._fullProgressDialogue = await new FullProgressDialogue(this._actor, this).render(true);
  }

  /** @override */
  async close(options) {
    if (this._fullProgressDialogue) this._fullProgressDialogue.close();
    await super.close(options);
  }


}