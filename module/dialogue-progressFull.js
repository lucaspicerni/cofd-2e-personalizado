import { createShortActionMessage } from "./chat.js";

export class FullProgressDialogue extends Application {
  constructor(actor, progressDialogue, ...args) {
    super(...args);
    this._actor = actor;
    this._progressDialogue = progressDialogue;
    this.options.title = "Experiência completa - " + this._actor.name;
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "dialogue", "mta-sheet"],
      template: "systems/mta/templates/dialogues/dialogue-progressFull.html"
    });
  }

  getData() {
    const data = super.getData();
    data.actorData = this._actor.system;
    data.progress = data.actorData.progress ?? [];

    const beatsKey = CONFIG.MTA.EXTRA_BEAT_CONFIG[data.actorData.characterType];

    data.extraBeatsName = beatsKey ? game.i18n.localize(beatsKey) : undefined;
    data.showExtraBeats = !!beatsKey;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item-edit').click(ev => this.onEditProgress(ev));
    html.find('.item-delete').click(ev => this.onDeleteProgress(ev));
  }

  onEditProgress(ev) {
    ev.preventDefault();

    const index = Number(ev.currentTarget.dataset.index);
    const progress = this._actor.system.progress?.[index];

    if (!progress) return;

    const row = ev.currentTarget.closest("tr");
    const nameCell = row.querySelector(".progress-name-cell");
    const beatsCell = row.querySelector(".progress-beats-cell");
    const arcaneBeatsCell = row.querySelector(".progress-arcaneBeats-cell");
    const actionCell = row.querySelector(".edit-delete");

    const originalName = String(progress.name ?? "");
    const originalBeats = Number(progress.beats ?? 0);
    const originalArcaneBeats = Number(progress.arcaneBeats ?? 0);

    const nameInput = $('<input type="text" class="progress-edit-input">');
    nameInput.val(originalName);
    nameInput.css("width", "100%");

    const beatsInput = $('<input type="number" step="1" class="progress-edit-number">');
    beatsInput.val(originalBeats);
    beatsInput.css("width", "100%");

    let arcaneBeatsInput = null;

    if (arcaneBeatsCell) {
      arcaneBeatsInput = $('<input type="number" step="1" class="progress-edit-number">');
      arcaneBeatsInput.val(originalArcaneBeats);
      arcaneBeatsInput.css("width", "100%");
    }

    const confirmButton = $(
      '<span class="button stoneButton progress-edit-confirm progress-inline-action" title="Confirmar"><i class="fas fa-check fa-fw"></i></span>'
    );

    const cancelButton = $(
      '<span class="button stoneButton progress-edit-cancel progress-inline-action" title="Cancelar"><i class="fas fa-times fa-fw"></i></span>'
    );

    let saving = false;

    const save = async () => {
      if (saving) return;

      const name = String(nameInput.val() ?? "").trim();
      const beats = Number(beatsInput.val() ?? 0);
      const arcaneBeats = arcaneBeatsInput ? Number(arcaneBeatsInput.val() ?? 0) : undefined;

      if (!name) {
        ui.notifications.warn("Informe um motivo para a Experiência.");
        return;
      }

      if (!Number.isFinite(beats)) {
        ui.notifications.warn("Informe um valor válido para os Beats.");
        return;
      }

      if (arcaneBeatsInput && !Number.isFinite(arcaneBeats)) {
        ui.notifications.warn("Informe um valor válido para os Beats Arcanos.");
        return;
      }

      saving = true;

      const changes = {
        name,
        beats
      };

      if (arcaneBeatsInput) {
        changes.arcaneBeats = arcaneBeats;
      }

      await this._actor.updateProgressEntry(index, changes);

      this._progressDialogue?.render();
      this.render();
    };

    const cancel = () => {
      this.render();
    };

    const onKeyDown = ev => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        save();
      }
    };

    nameInput.on("keydown", onKeyDown);
    beatsInput.on("keydown", onKeyDown);

    if (arcaneBeatsInput) {
      arcaneBeatsInput.on("keydown", onKeyDown);
    }

    confirmButton.click(save);
    cancelButton.click(cancel);

    $(nameCell).empty().append(nameInput);
    $(beatsCell).empty().append(beatsInput);

    if (arcaneBeatsCell && arcaneBeatsInput) {
      $(arcaneBeatsCell).empty().append(arcaneBeatsInput);
    }

    $(actionCell).empty().append(confirmButton).append(cancelButton);

    nameInput.trigger("focus");
    nameInput.trigger("select");
  }

  async onDeleteProgress(ev) {
    let index = Number(ev.currentTarget.dataset.index);

    await this._actor.removeProgress(index);

    this._progressDialogue?.render();
    this.render();
  }
}