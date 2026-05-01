export class DiceRollerDialogue extends Application {
  constructor({ dicePool = 0, targetNumber = 8, extended = false, target_successes = 0, penalty = 0, flavor = "Teste de habilidade", title = "Teste de habilidade", blindGMRoll = false, actorOverride, damageRoll = false, weaponDamage = 0, armorPiercing = 0, itemName = "", itemImg = "", itemRef = undefined, itemDescr = "", spendAmmo = false, advancedAction = false, macro, actor, comment = "", target, ignoreArmor = false, ignoreBallistic = true, noSuccessesToDamage = false, defense = 0, applyDefense = false, ballistic = 0, armor = 0, exceptionalTarget = 5, specialties = [] }, ...args) {
    super(...args);
    this.targetNumber = +targetNumber;
    this.dicePool = +dicePool;
    this.penalty = penalty;
    this.flavor = flavor;
    this.blindGMRoll = blindGMRoll;
    this.options.title = title;
    this.actorOverride = actorOverride;
    this.damageRoll = damageRoll;
    this.weaponDamage = weaponDamage;
    this.armorPiercing = armorPiercing;
    this.itemName = itemName;
    this.itemImg = itemImg;
    this.itemRef = itemRef;
    this.itemDescr = itemDescr;
    this.spendAmmo = spendAmmo;
    this.accumulatedSuccesses = 0;
    this.extendedRolls = 0;
    this.extended = extended;
    this.advancedAction = advancedAction;
    this.macro = macro;
    this.actor = actor;
    this.comment = comment;
    this.target = target;
    this.ignoreArmor = ignoreArmor;
    this.ignoreBallistic = ignoreBallistic;
    this.noSuccessesToDamage = noSuccessesToDamage;
    this.defense = defense;
    this.applyDefense = applyDefense;
    this.ballistic = ballistic;
    this.armor = armor;
    this.exceptionalTarget = exceptionalTarget;
    this.specialties = specialties;

    console.log("Specialties", this.specialties)
  }

  /* -------------------------------------------- */

  /**
   * Extend and override the default options used by the 5e Actor Sheet
   * @returns {Object}
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["worldbuilding", "dialogue", "mta-sheet"],
      template: "systems/mta/templates/dialogues/dialogue-diceRoller.html",
      resizable: true
    });
  }

  getData() {
    const data = super.getData();
    data.targetNumber = this.targetNumber;
    data.dicePool = this.dicePool;
    data.bonusDice = 0;
    data.spendAmmo = this.spendAmmo;
    data.ammoPerShot = 1;
    data.penalty = this.penalty;
    data.extended = this.extended;
    data.advancedAction = this.advancedAction;
    data.applyArmor = !this.ignoreArmor;
    data.applyBallistic = !this.ignoreBallistic;
    data.noSuccessesToDamage = this.noSuccessesToDamage;
    data.damageRoll = this.damageRoll;
    data.applyDefense = this.applyDefense;
    data.defense = this.defense;
    data.armor = this.armor;
    data.ballistic = this.ballistic;
    data.exceptionalTarget = this.exceptionalTarget;
    // data.specialties = this.specialties.length ? this.specialties : null;

    if (game.settings.get("mta", "showRollDifficulty")) data.enableDifficulty = true;

    // CÓDIGO CGT
    const a = this.actor ?? this.actorOverride ?? null;

    const isCharacter = a?.type === "character";
    data.specialties = (isCharacter && this.specialties.length) ? this.specialties : null;

    data.canSpendWillpower = Number(a?.system?.willpower?.value ?? 0) > 0;
    data.spendWillpower = false;

    return data;
  }

  _fetchInputs(html) {
    const dicePool_userMod_input = html.find('[name="dicePoolBonus"]');
    const dicePool_difficulty_input = html.find('[name="dicePoolDifficulty"]');
    const ammoPerShot_input = html.find('[name="ammoPerShot"]');

    let dicePool_userMod = dicePool_userMod_input.length ? +dicePool_userMod_input[0].value : 0;
    let explode_threshold = Math.max(0, +($('input[name=explodeThreshold]:checked').val()));
    let rote_action = $('input[name=rote_action]').prop("checked");
    let advancedAction = $('input[name=advancedAction]').prop("checked");
    let extended = $('input[name=extended]').prop("checked");

    // CÓDIGO GPT
    const spendWillpower = html.find('input[name="spendWillpower"]')[0]?.checked ?? false;

    let dicePool_difficulty
    if (game.settings.get("mta", "showRollDifficulty")) dicePool_difficulty = dicePool_difficulty_input.length ? +dicePool_difficulty_input[0].value : 0;
    else dicePool_difficulty = 8;

    let ammoPerShot = ammoPerShot_input.length ? +ammoPerShot_input[0].value : 0;
    const automaticFireInput = html.find("input.automatic-fire-mode:checked").first();

    const automaticFireBonus = automaticFireInput.length
      ? Number(automaticFireInput.data("bonus") ?? 0)
      : 0;

    const automaticFireLabel = automaticFireInput.length
      ? String(automaticFireInput.data("label") ?? "")
      : "";
    let applyArmor = $('input[name=applyArmor]').prop("checked");
    let applyBallistic = $('input[name=applyBallistic]').prop("checked");
    let ignoreArmor = !applyArmor;
    let ignoreBallistic = !applyBallistic;
    let noSuccessesToDamage = $('input[name=noSuccessesToDamage]').prop("checked");
    let applyDefense = $('input[name=applyDefense]').prop("checked");

    // Fetch all specialties
    let specialties = [];
    html.find('input[name^="specialty_"]').each(function () {
      if ($(this).prop("checked")) {
        specialties.push(this.name.replace('specialty_', ''));
      }
    });

    return { dicePool_userMod, explode_threshold, rote_action, dicePool_difficulty, ammoPerShot, automaticFireBonus, automaticFireLabel, advancedAction, extended, applyArmor, applyBallistic, ignoreArmor, ignoreBallistic, noSuccessesToDamage, applyDefense, specialties, spendWillpower }
  }

  activateListeners(html) {
    super.activateListeners(html);

    const syncAutomaticFire = () => {
      const ammoInput = html.find('[name="ammoPerShot"]');
      const ammoControl = html.find(".ammo-per-shot-control");
      const selected = html.find("input.automatic-fire-mode:checked").first();

      if (!ammoInput.length) return;

      if (selected.length) {
        if (!ammoInput.prop("disabled")) {
          ammoInput.data("manualValue", ammoInput.val());
        }

        ammoInput.val(Number(selected.data("ammo") ?? 1));
        ammoInput.prop("disabled", true);
        ammoControl.addClass("automatic-fire-ammo-locked");
      } else {
        ammoInput.prop("disabled", false);
        ammoInput.val(ammoInput.data("manualValue") ?? 1);
        ammoControl.removeClass("automatic-fire-ammo-locked");
      }
    };

    html.find("input.automatic-fire-mode").change(function () {
      if (this.checked) {
        html.find("input.automatic-fire-mode").not(this).prop("checked", false);
      }

      syncAutomaticFire();
    });

    html.find('[name="ammoPerShot"]').change(function () {
      if (!$(this).prop("disabled")) {
        $(this).data("manualValue", this.value);
      }
    });

    syncAutomaticFire();

    html.find('.niceNumber').click(function (event) {
      let v = $(event.target).text();
      let inputs = $(this).find('input');
      let i;

      if (inputs.length === 2) {
        i = $(this).find('.theNumber input');
      } else {
        // fallback: single input
        i = inputs.first();
      }

      if (i.prop("disabled")) return;

      if (v === '+') {
        i.val(parseInt(i.val()) + 1);
      } else if (v === '−') {
        i.val(parseInt(i.val()) - 1);
      }

      i.trigger('change');
    });

    html.find('.niceNumberDouble').click(function (event) {
      let v = $(event.target).text();
      let i = $(this).find('.theNumber input');

      if (v === '+') {
        i.val(parseInt(i.val()) + 1);
      } else if (v === '−') {
        i.val(parseInt(i.val()) - 1);
      }

      i.trigger('change');
    });
    html.find('.roll-execute').click(ev => this._executeRoll(html, ev));
  }

  static _formatSignedNumber(value) {
    const number = Number(value ?? 0);
    return number >= 0 ? `+${number}` : `${number}`;
  }

  static _escapeFlavor(value) {
    const string = String(value ?? "");

    if (foundry.utils.escapeHTML) {
      return foundry.utils.escapeHTML(string);
    }

    return string
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  static _isChecked(value) {
    return value === true || value === "true" || value === "on" || value === 1 || value === "1";
  }

  static _parseBaseRollFlavor(baseFlavor = "") {
    let base = String(baseFlavor ?? "").trim();

    const parsed = {
      composition: base,
      unskilled: false,
      equipmentBonus: 0,
      woundPenalty: 0,
      genericModifiers: [],
      targetName: ""
    };

    // Alvo marcado: "contra Nome"
    const targetMatch = base.match(/\s+contra\s+(.+)$/i);
    if (targetMatch) {
      parsed.targetName = targetMatch[1].trim();
      base = base.slice(0, targetMatch.index).trim();
    }

    // Inexperiência.
    if (base.includes("(inexperiente)")) {
      parsed.unskilled = true;
      base = base.replaceAll(" (inexperiente)", "").replaceAll("(inexperiente)", "");
    }

    // Bônus de equipamento: "(+1 bônus do equipamento)".
    base = base.replace(/\s*\(([+-]?\d+)\s+bônus do equipamento\)/gi, (_match, value) => {
      parsed.equipmentBonus += Number(value);
      return "";
    });

    // Bônus genérico de assembleDicePool: "(+1 bonus)".
    base = base.replace(/\s*\(([+-]?\d+)\s+bonus\)/gi, (_match, value) => {
      parsed.equipmentBonus += Number(value);
      return "";
    });

    // Ferimentos: "(Ferimentos: -1)".
    base = base.replace(/\s*\(Ferimentos:\s*([+-]?\d+)\)/gi, (_match, value) => {
      parsed.woundPenalty = Math.abs(Number(value));
      return "";
    });

    // Modificadores genéricos.
    base = base.replace(/\s*\(([+-]?\d+)\s+em tudo\)/gi, (_match, value) => {
      parsed.genericModifiers.push({
        label: "Todas as paradas",
        value: Number(value)
      });
      return "";
    });

    base = base.replace(/\s*\(([+-]?\d+)\s+físico\)/gi, (_match, value) => {
      parsed.genericModifiers.push({
        label: "Paradas físicas",
        value: Number(value)
      });
      return "";
    });

    base = base.replace(/\s*\(([+-]?\d+)\s+social\)/gi, (_match, value) => {
      parsed.genericModifiers.push({
        label: "Paradas sociais",
        value: Number(value)
      });
      return "";
    });

    base = base.replace(/\s*\(([+-]?\d+)\s+mental\)/gi, (_match, value) => {
      parsed.genericModifiers.push({
        label: "Paradas mentais",
        value: Number(value)
      });
      return "";
    });

    parsed.composition = base.trim();

    return parsed;
  }

  static _buildStructuredRollFlavor({
    baseFlavor = "Teste de habilidade",
    userMod = 0,
    specialties = [],
    uiExplode = 10,
    isChanceDie = false,
    roteAction = false,
    advancedAction = false,
    extended = false,
    spendWillpower = false,
    damageRoll = false,
    applyDefense = false,
    defense = 0,
    applyArmor = false,
    applyBallistic = false,
    armor = 0,
    ballistic = 0,
    noSuccessesToDamage = false,
    automaticFireLabel = "",
    automaticFireBonus = 0
  } = {}) {
    const parsed = DiceRollerDialogue._parseBaseRollFlavor(baseFlavor);

    const hasRoteAction = DiceRollerDialogue._isChecked(roteAction);
    const hasAdvancedAction = DiceRollerDialogue._isChecked(advancedAction);
    const hasExtended = DiceRollerDialogue._isChecked(extended);
    const hasSpendWillpower = DiceRollerDialogue._isChecked(spendWillpower);
    const hasApplyDefense = DiceRollerDialogue._isChecked(applyDefense);
    const hasApplyArmor = DiceRollerDialogue._isChecked(applyArmor);
    const hasApplyBallistic = DiceRollerDialogue._isChecked(applyBallistic);
    const hasNoSuccessesToDamage = DiceRollerDialogue._isChecked(noSuccessesToDamage);

    let header = DiceRollerDialogue._escapeFlavor(parsed.composition);

    if (parsed.unskilled) {
      header += " (<b>inexperiente</b>)";
    }

    if (parsed.equipmentBonus) {
      header += ` ${DiceRollerDialogue._formatSignedNumber(parsed.equipmentBonus)} de equipamento`;
    }

    header += ":";

    const lines = [];

    if (!isChanceDie) {
      if (uiExplode === 8) lines.push("Permutação: Explosão de 8");
      else if (uiExplode === 9) lines.push("Permutação: Explosão de 9");
      else if (uiExplode === 10) lines.push("Permutação: Explosão de 10");
    }

    if (hasRoteAction) {
      lines.push("Ação de Rotina");
    }

    if (isChanceDie) {
      lines.push("Teste de Sorte");
    }

    if (hasAdvancedAction) {
      lines.push("Ação Avançada");
    }

    if (hasExtended) {
      lines.push("Ação Estendida");
    }

    if (parsed.woundPenalty) {
      lines.push(`Ferimentos: -${parsed.woundPenalty}`);
    }

    for (const modifier of parsed.genericModifiers) {
      lines.push(`${modifier.label}: ${DiceRollerDialogue._formatSignedNumber(modifier.value)}`);
    }

    if (Number(userMod ?? 0) !== 0) {
      lines.push(`Modificador situacional: ${DiceRollerDialogue._formatSignedNumber(userMod)}`);
    }

    if (specialties.length) {
      const specialtyText = specialties
        .map(s => DiceRollerDialogue._escapeFlavor(s))
        .join(", ");

      lines.push(`Especialização: ${specialtyText}`);
    }

    if (hasSpendWillpower) {
      lines.push("<b>Força de Vontade</b>");
    }


    if (parsed.targetName) {
      lines.push(`Alvo: <b>${DiceRollerDialogue._escapeFlavor(parsed.targetName)}</b>`);
    }

    if (damageRoll && applyDefense) {
      lines.push(`Defesa: ${Number(defense ?? 0)}`);
    }

    if (damageRoll && (hasApplyArmor || hasApplyBallistic)) {
      const armorValue = hasApplyArmor ? Number(armor ?? 0) : 0;
      const ballisticValue = hasApplyBallistic ? Number(ballistic ?? 0) : 0;

      if (armorValue !== 0 || ballisticValue !== 0) {
        lines.push(`Armadura: ${armorValue}/${ballisticValue}`);
      }
    }

    if (damageRoll && hasNoSuccessesToDamage) {
      lines.push("Sem sucesso como dano");
    }

    if (automaticFireBonus) {
      const label = DiceRollerDialogue._escapeFlavor(automaticFireLabel || "Rajada");
      lines.push(`${label}: ${DiceRollerDialogue._formatSignedNumber(automaticFireBonus)}`);
    }

    if (!lines.length) return header;

    return `${header}<br>${lines.map(line => `• ${line}`).join("<br>")}`;
  }

  async _executeRoll(html, ev) {
    const modifiers = this._fetchInputs(html);

    // CÓDIGO GPT
    const a = this.actor ?? this.actorOverride ?? null;
    const isCharacter = a?.type === "character";

    //const specBonus = modifiers.specialties.length;

    const userModNoSpecs = modifiers.dicePool_userMod; // não mutar o original

    const specBonus = isCharacter ? modifiers.specialties.length : 0;

    const automaticFireBonus = Number(modifiers.automaticFireBonus ?? 0);

    let dicePool =
      this.dicePool +
      specBonus +
      userModNoSpecs +
      automaticFireBonus;

    const extendedRollsMax = this.dicePool + specBonus;

    const roteAction = modifiers.rote_action;

    // CÓDIGO GPT
    if (modifiers.spendWillpower) {
      const a = this.actor ?? this.actorOverride ?? null;
      const cur = Number(a?.system?.willpower?.value ?? 0);
      if (a && cur > 0) {
        dicePool += 3;
        await a.update({ "system.willpower.value": cur - 1 });
        ui.notifications?.warn("Você gastou Força de Vontade! O valor será reduzido automaticamente.");
      } else {
        ui.notifications?.warn("Sem Força de Vontade para gastar!");
      }
    }

    //const explodeThreshold = modifiers.explode_threshold;

    // CÓDIGO GPT
    const isChanceDie = dicePool < 1;
    const uiExplode = modifiers.explode_threshold;              // 8, 9, 10, 11(=None)
    const explodeThreshold = isChanceDie ? 11 : uiExplode;

    const flavor = DiceRollerDialogue._buildStructuredRollFlavor({
      baseFlavor: this.flavor || "Teste de habilidade",
      userMod: userModNoSpecs,
      specialties: isCharacter ? modifiers.specialties : [],
      uiExplode,
      isChanceDie,
      roteAction,
      advancedAction: modifiers.advancedAction,
      extended: modifiers.extended,
      spendWillpower: modifiers.spendWillpower,
      damageRoll: this.damageRoll,
      applyDefense: modifiers.applyDefense,
      defense: this.defense,
      applyArmor: modifiers.applyArmor,
      applyBallistic: modifiers.applyBallistic,
      armor: this.armor,
      ballistic: this.ballistic,
      noSuccessesToDamage: modifiers.noSuccessesToDamage,
      automaticFireLabel: modifiers.automaticFireLabel,
      automaticFireBonus
    });

    const targetNumber = Math.clamp(modifiers.dicePool_difficulty, 1, 10);
    const rollReturn = {};
    if (this.damageRoll) await DiceRollerDialogue.rollWithDamage({ dicePool: dicePool, targetNumber: targetNumber, rollReturn: rollReturn, tenAgain: explodeThreshold === 10, nineAgain: explodeThreshold === 9, eightAgain: explodeThreshold === 8, roteAction: roteAction, flavor: flavor, blindGMRoll: this.blindGMRoll, actorOverride: this.actorOverride, weaponDamage: this.weaponDamage, armorPiercing: this.armorPiercing, itemImg: this.itemImg, itemName: this.itemName, itemRef: this.itemRef, itemDescr: this.itemDescr, spendAmmo: this.spendAmmo, ammoPerShot: modifiers.ammoPerShot, advancedAction: modifiers.advancedAction, comment: this.comment, target: this.target, ignoreArmor: modifiers.ignoreArmor, ignoreBallistic: modifiers.ignoreBallistic, noSuccessesToDamage: modifiers.noSuccessesToDamage, applyDefense: modifiers.applyDefense, defense: this.defense, ballistic: this.ballistic, armor: this.armor, exceptionalTarget: this.exceptionalTarget });
    else await DiceRollerDialogue.rollToChat({ dicePool: dicePool, targetNumber: targetNumber, extended: modifiers.extended, extended_accumulatedSuccesses: this.accumulatedSuccesses, extended_rolls: this.extendedRolls, extended_rollsMax: extendedRollsMax, rollReturn: rollReturn, tenAgain: explodeThreshold === 10, nineAgain: explodeThreshold === 9, eightAgain: explodeThreshold === 8, roteAction: roteAction, flavor: flavor, blindGMRoll: this.blindGMRoll, actorOverride: this.actorOverride, actor: this.actor, itemRef: this.itemRef, itemName: this.itemName, itemImg: this.itemImg, itemDescr: this.itemDescr, advancedAction: modifiers.advancedAction, comment: this.comment, exceptionalTarget: this.exceptionalTarget });

    if (modifiers.extended) {
      let successes = rollReturn.roll.total;
      if (successes > 0) this.accumulatedSuccesses += successes;
      this.extendedRolls++;
    }

    if (this.actor) await this.actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if (this.macro && this.actor) {
      this.macro.execute({ actor: this.actor, token: this.actor.token ?? this.actor.getActiveTokens()[0], item: this.itemRef });
    }
  }

  static async _roll({ dicePool = 1, targetNumber = 8, tenAgain = true, nineAgain = false, eightAgain = false, roteAction = false, chanceDie = false, exceptionalTarget = 5, advancedAction = false }) {
    //Create dice pool qualities
    const roteActionString = roteAction ? "r<8" : "";
    const explodeString = eightAgain ? "x>=8" : nineAgain ? "x>=9" : tenAgain ? "x>=10" : "";
    const targetNumString = chanceDie ? "cs>=10" : "cs>=" + targetNumber;

    let roll = new Roll(dicePool + "d10" + roteActionString + explodeString + targetNumString);
    roll = await roll.roll();

    if (chanceDie && roteAction && roll.terms[0].results[0].result === 1) {
      //Chance dice don't reroll 1s with Rote quality
      roll.terms[0].results.splice(1);
    }
    if (game.settings.get("mta", "easierDramaticFailures") && roll.total <= 0 && roll.terms[0].results[0].result === 1) roll.dramaticFailure = true;
    else if (chanceDie && roll.terms[0].results[0].result === 1) roll.dramaticFailure = true;
    if (roll.total >= exceptionalTarget) roll.exceptionalSuccess = true;
    else roll.exceptionalSuccess = false;

    if (advancedAction) {
      const roll2 = await DiceRollerDialogue._roll({ dicePool: dicePool, targetNumber: targetNumber, tenAgain: tenAgain, nineAgain: nineAgain, eightAgain: eightAgain, roteAction: roteAction, chanceDie: chanceDie, exceptionalTarget: exceptionalTarget, advancedAction: false });
      if (roll2.total > roll.total) {
        roll2.advancedRoll = roll;
        roll = roll2;
      }
      else {
        roll.advancedRoll = roll2;
      }
    }
    console.log(roll);
    return roll;
  }


  static async rollToHtml({ dicePool = 1, targetNumber = 8, extended = false, extended_accumulatedSuccesses = 0, extended_rolls = 0, extended_rollsMax = 0, tenAgain = true, nineAgain = false, eightAgain = false, roteAction = false, flavor = "Teste de habilidade", showFlavor = true, exceptionalTarget = 5, blindGMRoll = false, rollReturn, advancedAction = false, comment = "" }) {
    //Is the roll a chance die?
    let chanceDie = false;
    if (dicePool < 1) {
      tenAgain = false;
      nineAgain = false;
      eightAgain = false;
      chanceDie = true;
      dicePool = 1;
    }

    let roll = await DiceRollerDialogue._roll({ dicePool: dicePool, targetNumber: targetNumber, tenAgain: tenAgain, nineAgain: nineAgain, eightAgain: eightAgain, roteAction: roteAction, chanceDie: chanceDie, exceptionalTarget: exceptionalTarget, advancedAction });

    const formulaLabel = `${dicePool}d10`;

    if (rollReturn) rollReturn.roll = roll;
    //Create Roll Message
    let speaker = ChatMessage.getSpeaker();

    if (chanceDie) flavor += " (Teste de Sorte)";
    if (eightAgain) flavor += " (Explosão de 8)";
    else if (nineAgain) flavor += " (Explosão de 9)";
    else if (tenAgain) flavor += " (Explosão de 10)";
    if (roteAction) flavor += " (Ação de Rotina)";
    if (!showFlavor) flavor = undefined;

    let chatData = {
      user: game.user.id,
      speaker: speaker,
      flavor: flavor
    };
    let rollMode = blindGMRoll ? "blindroll" : game.settings.get("core", "rollMode");
    chatData = ChatMessage.applyRollMode(chatData, rollMode);

    extended_accumulatedSuccesses += Math.max(0, roll.total);
    extended_rolls++;


    let html = await roll.render(chatData);
    html = DiceRollerDialogue._shortenRollFormulaHtml(html, formulaLabel);

    if (roll.dramaticFailure) html = html.replace('class="dice-total"', 'class="dice-total dramaticFailure"');
    else if (roll.exceptionalSuccess) html = html.replace('class="dice-total"', 'class="dice-total exceptionalSuccess"');
    if (roll.advancedRoll) {
      let advHtml = await roll.advancedRoll.render(chatData);
      advHtml = DiceRollerDialogue._shortenRollFormulaHtml(advHtml, formulaLabel);
      advHtml = advHtml.replace('class="dice-roll"', 'class="dice-roll advancedRoll"');
      console.log("ASD", advHtml);
      html += advHtml;
    }

    if (extended) html += `<div class="roll-extended">
      <div class="roll-extended-header">Ação estendida</div>
      <div>${extended_accumulatedSuccesses} sucessos acumulados</div>
      <div>${extended_rolls} / ${extended_rollsMax} rolagens</div>
    </div>`;

    if (comment) html += `<div class="comment">${comment.replaceAll('\n', '<br>')}</div>`;

    return html;
  }

  static _getTokenId(actor) {
    const token =
      actor?.token?.object ??
      actor?.token ??
      actor?.getActiveTokens?.()[0] ??
      null;

    if (!token?.id) return null;

    const sceneId =
      token.scene?.id ??
      token.object?.scene?.id ??
      token.parent?.id ??
      canvas?.scene?.id;

    return sceneId ? `${sceneId}.${token.id}` : token.id;
  }

  static async rollToChat({
    dicePool = 1,
    targetNumber = 8,
    extended = false,
    extended_accumulatedSuccesses = 0,
    extended_rolls = 0,
    extended_rollsMax = 0,
    tenAgain = true,
    nineAgain = false,
    eightAgain = false,
    roteAction = false,
    exceptionalTarget = 5,
    flavor = "Teste de habilidade",
    blindGMRoll = false,
    actorOverride,
    rollReturn = {},
    advancedAction = false,
    comment = "",
    macro,
    actor,
    itemRef,
    itemName = "",
    itemImg = "",
    itemDescr = ""
  }) {

    const rollHtml = await DiceRollerDialogue.rollToHtml({
      dicePool: dicePool,
      targetNumber: targetNumber,
      tenAgain: tenAgain,
      nineAgain: nineAgain,
      eightAgain: eightAgain,
      roteAction: roteAction,
      exceptionalTarget: exceptionalTarget,
      showFlavor: false,
      blindGMRoll: blindGMRoll,
      rollReturn: rollReturn,
      extended: extended,
      extended_accumulatedSuccesses: extended_accumulatedSuccesses,
      extended_rolls: extended_rolls,
      extended_rollsMax: extended_rollsMax,
      advancedAction,
      comment
    });

    const cardActor = actorOverride ?? actor ?? itemRef?.actor ?? null;
    const isItemRoll = !!itemRef;

    const templateData = isItemRoll
      ? {
        actor: cardActor,
        tokenId: DiceRollerDialogue._getTokenId(cardActor),
        item: itemRef ?? {
          id: null,
          img: itemImg,
          name: itemName
        },
        data: {
          description: itemDescr ?? itemRef?.system?.description ?? "",
          rolls: [{
            html: rollHtml
          }]
        }
      }
      : {
        roll: rollHtml
      };

    //Create Roll Message
    let rollMode = blindGMRoll ? "blindroll" : game.settings.get("core", "rollMode");
    let speaker = actorOverride ? ChatMessage.getSpeaker({ actor: actorOverride }) : ChatMessage.getSpeaker();

    // Render the chat card template
    const template = isItemRoll
      ? `systems/mta/templates/chat/item-card.html`
      : `systems/mta/templates/chat/roll-template.html`;

    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    let chatData = {
      user: game.user.id,
      //type: CONST.CHAT_MESSAGE_STYLES.ROLL,
      content: html,
      speaker: speaker,
      flavor: flavor,
      sound: CONFIG.sounds.dice,
      roll: rollReturn.roll,
      rolls: [rollReturn.roll],
      rollMode: rollMode
    };

    // Toggle default roll mode
    /* if ( ["gmroll", "blindroll"].includes(rollMode) ) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");*/
    //if ( rollMode === "blindroll" ) chatData["blind"] = true; 
    chatData = ChatMessage.applyRollMode(chatData, rollMode);

    const msg = await ChatMessage.create(chatData);
    if (actor) await actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if (macro && actor) {
      macro.execute({
        actor,
        token: actor.token ?? actor.getActiveTokens?.()[0],
        item: itemRef
      });
    }

    // Create the chat message
    return msg;
  }

  // CÓDIGO GPT
  static _normalizeChanceFlavorExact(flavor) {
    let out = flavor || "";
    const targets = [" (Explosão de 10)", " (Explosão de 9)", " (Explosão de 8)"];
    for (const t of targets) {
      while (out.includes(t)) out = out.replace(t, "");
    }

    if (!out.includes(" (Teste de Sorte)")) out += " (Teste de Sorte)";
    return out;
  }

  static _shortenRollFormulaHtml(html, formulaLabel) {
    const wrapper = $("<div>").html(html);

    wrapper.find(".dice-formula").text(formulaLabel);

    return wrapper.html();
  }

  static async rollWithDamage({
    dicePool = 1,
    targetNumber = 8,
    tenAgain = true,
    nineAgain = false,
    eightAgain = false,
    roteAction = false,
    exceptionalTarget = 5,
    flavor = "Ataque",
    blindGMRoll = false,
    actorOverride,
    itemImg = "",
    itemName = "",
    itemDescr = "",
    weaponDamage = 0,
    armorPiercing = 0,
    itemRef = undefined, // for reloading of firearms
    spendAmmo = false,
    ammoPerShot = 0,
    advancedAction = false,
    rollReturn = {},
    comment = "",
    target,
    ignoreArmor = false,
    ignoreBallistic = true,
    noSuccessesToDamage = false,
    ballistic = 0,
    armor = 0,
    applyDefense = false,
    defense = 0,
    macro,
    actor
  }) {

    if (applyDefense) dicePool -= defense;

    if (dicePool < 1 && !String(flavor).includes("<br>•")) {
      flavor = DiceRollerDialogue._normalizeChanceFlavorExact(flavor);
    }

    const cardActor = actorOverride ?? actor ?? itemRef?.actor ?? null;

    const templateData = {
      actor: cardActor,
      tokenId: DiceRollerDialogue._getTokenId?.(cardActor),
      data: {
        description: itemDescr,
        rolls: [{
          title: game.i18n.localize('MTA.HitRoll'),
          html: await DiceRollerDialogue.rollToHtml({
            dicePool: dicePool,
            targetNumber: targetNumber,
            tenAgain: tenAgain,
            nineAgain: nineAgain,
            eightAgain: eightAgain,
            roteAction: roteAction,
            exceptionalTarget: exceptionalTarget,
            showFlavor: false,
            blindGMRoll: blindGMRoll,
            rollReturn: rollReturn,
            advancedAction,
            comment
          })
        }],
      },
      item: {
        id: itemRef?.id,
        uuid: itemRef?.uuid,
        img: itemImg || itemRef?.img,
        name: itemName || itemRef?.name
      }
    };

    // Calculate damage
    let damageInflicted = noSuccessesToDamage ? weaponDamage : rollReturn.roll.total + weaponDamage;
    if (rollReturn.roll.total <= 0) damageInflicted = 0; // Miss

    let bashingDamageInflicted = 0;

    // Calculate armor-piercing (subtracted from ballistic first)
    const ballisticAdj = Math.max(0, ballistic - armorPiercing);
    const armorAdj = ignoreBallistic ? Math.max(0, armor - armorPiercing)
      : (armorPiercing > ballistic ?
        Math.max(0, armor - (armorPiercing - ballistic)) :
        armor);

    if (!ignoreArmor) {
      damageInflicted = Math.max(0, damageInflicted - armorAdj);
    }

    // --- Unarmed = Bashing (não letal) ---
    const isUnarmed =
      itemRef?.type === "melee" &&
      itemRef?.system?.weaponType === "Unarmed";

    if (isUnarmed) {
      bashingDamageInflicted += damageInflicted; // joga tudo pro bashing
      damageInflicted = 0;                       // zera o letal
    }

    if (!ignoreBallistic) {
      bashingDamageInflicted = Math.min(ballisticAdj, damageInflicted);
      if (bashingDamageInflicted) damageInflicted = Math.max(0, damageInflicted - bashingDamageInflicted);
    }

    // minimum damage
    if (damageInflicted <= 0) bashingDamageInflicted = Math.max(1, bashingDamageInflicted);

    templateData.data.summary = rollReturn.roll.total ?
      (damageInflicted ? damageInflicted + ` ${game.i18n.localize('MTA.Lethal')} ` : "")
      + (bashingDamageInflicted ? bashingDamageInflicted + ` ${game.i18n.localize('MTA.Bashing')}` : "")
      : game.i18n.localize('MTA.AttackMissed')

    //game.i18n.localize('MTA.DamageInflicted') 

    if (armorPiercing && rollReturn.roll.total) templateData.data.summary += " (" + armorPiercing + " PA)";
    if (spendAmmo) templateData.data.summaryAddendum = game.i18n.localize('MTA.AmmoSpent') + " " + ammoPerShot;
    if (rollReturn.roll.total) {
      templateData.data.showDamageButton = true;
      templateData.data.damageInflicted = damageInflicted;
      templateData.data.bashingDamageInflicted = bashingDamageInflicted;
      const tokenObj = target?.object ? target?.object : target;

      templateData.data.damageTargetId = target?.actor?.id;

      templateData.data.damageTokenId = tokenObj ? (tokenObj.scene ? `${tokenObj.scene.id}.${tokenObj.id}` : `${tokenObj.id}`) : null;
    }

    if (spendAmmo && ammoPerShot) {
      if (itemRef) {
        if (!itemRef.system.magazine) {
          ui.notifications.error(`A arma está sem munição!`);
          return;
        }
        let ammo = itemRef.system.magazine.system.quantity;
        ammo -= ammoPerShot;
        if (ammo < 0) {
          ui.notifications.error(`A arma não tem munição suficiente!`);
          return;
        } else {
          itemRef.update({
            _id: itemRef.id,
            'system.magazine.system.quantity': ammo
          });
        }
      } else {
        ui.notifications.warn(`No weapon reference was given (no ammo subtracted).`);
      }
    }

    //Create Roll Message
    let rollMode = blindGMRoll ? "blindroll" : game.settings.get("core", "rollMode");
    let speaker = actorOverride ? ChatMessage.getSpeaker({ actor: actorOverride }) : ChatMessage.getSpeaker();

    // Render the chat card template
    const template = `systems/mta/templates/chat/item-card.html`;
    const html = await renderTemplate(template, templateData);

    // Basic chat message data
    let chatData = {
      user: game.user.id,
      //type: CONST.CHAT_MESSAGE_STYLES.ROLL,
      content: html,
      speaker: speaker,
      flavor: flavor,
      sound: CONFIG.sounds.dice,
      roll: rollReturn.roll,
      rolls: [rollReturn.roll],
      rollMode: rollMode,
      /*       system: {
              targetId: templateData.data.damageTokenId,
              isAttack: true,
              actor: actor?.id
            } */
    };

    chatData = ChatMessage.applyRollMode(chatData, rollMode);
    const msg = await ChatMessage.create(chatData);

    if (actor) await actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if (macro && actor) {
      macro.execute({
        actor,
        token: actor.token ?? actor.getActiveTokens?.()[0],
        item: itemRef
      });
    }
    // Create the chat message
    return msg;
  }
}