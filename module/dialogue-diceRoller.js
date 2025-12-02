export class DiceRollerDialogue extends Application {
  constructor({ dicePool = 0, targetNumber = 8, extended = false, target_successes = 0, penalty = 0, flavor = "Teste de habilidade", title = "Teste de habilidade", blindGMRoll = false, actorOverride, damageRoll = false, weaponDamage = 0, armorPiercing = 0, itemName = "", itemImg = "", itemRef = undefined, itemDescr = "", spendAmmo = false, advancedAction = false, macro, actor, comment = "", target, ignoreArmor = false, ignoreBallistic = true, noSuccessesToDamage = false, defense = 0, applyDefense = false, ballistic = 0, armor = 0, exceptionalTarget = 5, specialties=[]}, ...args){
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
    data.advancedAction =this. advancedAction;
    data.ignoreArmor = this.ignoreArmor;
    data.ignoreBallistic = this.ignoreBallistic;
    data.noSuccessesToDamage = this.noSuccessesToDamage;
    data.damageRoll = this.damageRoll;
    data.applyDefense = this.applyDefense;
    data.defense = this.defense;
    data.armor = this.armor;
    data.ballistic = this.ballistic;
    data.exceptionalTarget = this.exceptionalTarget;
    // data.specialties = this.specialties.length ? this.specialties : null;
    
    if(game.settings.get("mta", "showRollDifficulty")) data.enableDifficulty = true;

    // CÓDIGO CGT
    const a = this.actor ?? this.actorOverride ?? null;

    const isCharacter = a?.type === "character";
    data.specialties = (isCharacter && this.specialties.length) ? this.specialties : null;
    
    data.canSpendWillpower = Number(a?.system?.willpower?.value ?? 0) > 0;
    data.spendWillpower = false;

    return data;
  }
  
  _fetchInputs(html){
    const dicePool_userMod_input = html.find('[name="dicePoolBonus"]');
    const dicePool_difficulty_input = html.find('[name="dicePoolDifficulty"]');
    const ammoPerShot_input = html.find('[name="ammoPerShot"]');
    
    let dicePool_userMod = dicePool_userMod_input.length ? +dicePool_userMod_input[0].value : 0;
    let explode_threshold = Math.max(0,+($('input[name=explodeThreshold]:checked').val()));
    let rote_action = $('input[name=rote_action]').prop("checked");
    let advancedAction = $('input[name=advancedAction]').prop("checked");
    let extended = $('input[name=extended]').prop("checked");

    // CÓDIGO GPT
    const spendWillpower = html.find('input[name="spendWillpower"]')[0]?.checked ?? false;
    
    let dicePool_difficulty 
    if(game.settings.get("mta", "showRollDifficulty")) dicePool_difficulty = dicePool_difficulty_input.length ? +dicePool_difficulty_input[0].value : 0;
    else dicePool_difficulty = 8;

    let ammoPerShot = ammoPerShot_input.length ? +ammoPerShot_input[0].value : 0;
    let ignoreArmor = $('input[name=ignoreArmor]').prop("checked");
    let ignoreBallistic = $('input[name=ignoreBallistic]').prop("checked");
    let noSuccessesToDamage = $('input[name=noSuccessesToDamage]').prop("checked");
    let applyDefense = $('input[name=applyDefense]').prop("checked");

    // Fetch all specialties
    let specialties = [];
    html.find('input[name^="specialty_"]').each(function() {
        if ($(this).prop("checked")) {
            specialties.push(this.name.replace('specialty_', ''));
        }
    });
    
    return {dicePool_userMod, explode_threshold, rote_action, dicePool_difficulty, ammoPerShot, advancedAction, extended, ignoreArmor, ignoreBallistic, noSuccessesToDamage, applyDefense, specialties, spendWillpower}
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('.niceNumber').click(function(event) {
      let v = $(event.target).text();
      let inputs = $(this).find('input');
      let i;

      if (inputs.length === 2) {
        i = $(this).find('.theNumber input');
      } else {
        // fallback: single input
        i = inputs.first();
      }
      
      if (v === '+') {
        i.val(parseInt(i.val()) + 1);
      } else if (v === '−') {
        i.val(parseInt(i.val()) - 1);
      }
      
      i.trigger('change');
    });

    html.find('.niceNumberDouble').click(function(event) {
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
  
  async _executeRoll(html, ev) {
    const modifiers = this._fetchInputs(html);

    // CÓDIGO GPT
    const a = this.actor ?? this.actorOverride ?? null;
    const isCharacter = a?.type === "character";

    //const specBonus = modifiers.specialties.length;

    const userModNoSpecs = modifiers.dicePool_userMod; // não mutar o original

    const specBonus = isCharacter ? modifiers.specialties.length : 0;

    let dicePool = this.dicePool + specBonus + userModNoSpecs;

    const roteAction = modifiers.rote_action;
    let flavor = (this.flavor || "Teste de habilidade") + (modifiers.dicePool_userMod>0 ? " + " + modifiers.dicePool_userMod : modifiers.dicePool_userMod<0 ? " - " + -modifiers.dicePool_userMod : "");
    if (isCharacter) {
    for(const specialty of modifiers.specialties) {
      flavor += ` (+${specialty})`;
    }
    }
        
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

/*     if (dicePool < 1) flavor += " (Teste de sorte)";
    if (explodeThreshold === 8) flavor += " (Explosão de 8+)";
    else if (explodeThreshold === 9) flavor += " (Explosão de 9+)";
    else if (explodeThreshold === 10) flavor += " (Explosão de 10)"; */

    if (isChanceDie) flavor += " (Teste de sorte)";
    else {
      if (explodeThreshold === 8) flavor += " (Explosão de 8+)";
      else if (explodeThreshold === 9) flavor += " (Explosão de 9+)";
      else if (explodeThreshold === 10) flavor += " (Explosão de 10)";
    }

    if (modifiers.rote_action) flavor += " (Ação de rotina)";
    if (modifiers.spendWillpower) flavor += " (Força de vontade)";    

    const targetNumber = Math.clamp(modifiers.dicePool_difficulty, 1, 10);
    const rollReturn = {};
    if (this.damageRoll) await DiceRollerDialogue.rollWithDamage({ dicePool: dicePool, targetNumber: targetNumber, rollReturn: rollReturn, tenAgain: explodeThreshold === 10, nineAgain: explodeThreshold === 9, eightAgain: explodeThreshold === 8, roteAction: roteAction, flavor: flavor, blindGMRoll: this.blindGMRoll, actorOverride: this.actorOverride, weaponDamage: this.weaponDamage, armorPiercing: this.armorPiercing, itemImg: this.itemImg, itemName: this.itemName, itemRef: this.itemRef, itemDescr: this.itemDescr, spendAmmo: this.spendAmmo, ammoPerShot: modifiers.ammoPerShot, advancedAction: modifiers.advancedAction, comment: this.comment, target: this.target, ignoreArmor: modifiers.ignoreArmor, ignoreBallistic: modifiers.ignoreBallistic, noSuccessesToDamage: modifiers.noSuccessesToDamage, applyDefense: modifiers.applyDefense, defense: this.defense, ballistic: this.ballistic, armor: this.armor, exceptionalTarget: this.exceptionalTarget });
    else await DiceRollerDialogue.rollToChat({  dicePool: dicePool, targetNumber: targetNumber, extended: modifiers.extended, extended_accumulatedSuccesses: this.accumulatedSuccesses, extended_rolls: this.extendedRolls, extended_rollsMax: this.dicePool, rollReturn: rollReturn, tenAgain: explodeThreshold === 10, nineAgain: explodeThreshold === 9, eightAgain: explodeThreshold === 8, roteAction: roteAction, flavor: flavor, blindGMRoll: this.blindGMRoll, actorOverride: this.actorOverride, advancedAction: modifiers.advancedAction, comment: this.comment, exceptionalTarget: this.exceptionalTarget });
  
    if(modifiers.extended) {
      let successes = rollReturn.roll.total;
      if(successes > 0) this.accumulatedSuccesses += successes;
      this.extendedRolls++;
    }

    if (this.actor) await this.actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if (this.macro && this.actor) {
      this.macro.execute({actor: this.actor, token: this.actor.token ?? this.actor.getActiveTokens[0], item: this.itemRef});
    }
  }
  
  static async _roll({dicePool=1, targetNumber=8, tenAgain=true, nineAgain=false, eightAgain=false, roteAction=false, chanceDie=false, exceptionalTarget=5, advancedAction=false}){
    //Create dice pool qualities
    const roteActionString = roteAction ? "r<8" : "";
    const explodeString = eightAgain ? "x>=8" : nineAgain ? "x>=9" : tenAgain ? "x>=10" : "" ;
    const targetNumString = chanceDie ? "cs>=10" : "cs>=" + targetNumber;
    
    let roll = new Roll(dicePool + "d10" + roteActionString + explodeString + targetNumString);
    roll = await roll.roll();
    
    if(chanceDie && roteAction && roll.terms[0].results[0].result === 1){
      //Chance dice don't reroll 1s with Rote quality
      roll.terms[0].results.splice(1);
    }
    if(game.settings.get("mta", "easierDramaticFailures") && roll.total <= 0 && roll.terms[0].results[0].result === 1) roll.dramaticFailure = true;
    else if(chanceDie && roll.terms[0].results[0].result === 1) roll.dramaticFailure = true;
    if(roll.total >= exceptionalTarget) roll.exceptionalSuccess = true;
    else roll.exceptionalSuccess = false;

    if(advancedAction) {
      const roll2 = await DiceRollerDialogue._roll({dicePool: dicePool, targetNumber: targetNumber, tenAgain: tenAgain, nineAgain: nineAgain, eightAgain: eightAgain, roteAction: roteAction, chanceDie: chanceDie, exceptionalTarget: exceptionalTarget, advancedAction: false});
      if(roll2.total > roll.total) {
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
  
  
  static async rollToHtml({dicePool=1, targetNumber=8, extended=false, extended_accumulatedSuccesses=0, extended_rolls=0, extended_rollsMax=0, tenAgain=true, nineAgain=false, eightAgain=false, roteAction=false, flavor="Teste de habilidade", showFlavor=true, exceptionalTarget=5, blindGMRoll=false, rollReturn, advancedAction=false, comment=""}){   
    //Is the roll a chance die?
    let chanceDie = false;
    if(dicePool < 1) {
      tenAgain = false;
      nineAgain = false;
      eightAgain = false;
      chanceDie = true;
      dicePool = 1;
    }
    
    let roll = await DiceRollerDialogue._roll({dicePool: dicePool, targetNumber: targetNumber, tenAgain: tenAgain, nineAgain: nineAgain, eightAgain: eightAgain, roteAction: roteAction, chanceDie: chanceDie, exceptionalTarget: exceptionalTarget, advancedAction});
    if(rollReturn) rollReturn.roll = roll;
    //Create Roll Message
    let speaker = ChatMessage.getSpeaker();
    
    if(chanceDie) flavor += " (Teste de sorte)";
    if(eightAgain) flavor += " (Explosão de 8+)";
    else if(nineAgain) flavor += " (Explosão de 9+)";
    else if(tenAgain) flavor += " (Explosão de 10)";
    if(roteAction) flavor += " (Ação de rotina)";
    if(!showFlavor) flavor = undefined;

    let chatData = {
      user: game.user.id,
      speaker: speaker,
      flavor: flavor
    };
    let rollMode = blindGMRoll ? "blindroll" : game.settings.get("core", "rollMode");
    chatData = ChatMessage.applyRollMode(chatData, rollMode);

    extended_accumulatedSuccesses += Math.max(0,roll.total);
    extended_rolls++;

    
    let html = await roll.render(chatData);
    if(roll.dramaticFailure) html = html.replace('class="dice-total"', 'class="dice-total dramaticFailure"');
    else if(roll.exceptionalSuccess) html = html.replace('class="dice-total"', 'class="dice-total exceptionalSuccess"');
    if(roll.advancedRoll) {
      let advHtml = await roll.advancedRoll.render(chatData);
      advHtml = advHtml.replace('class="dice-roll"', 'class="dice-roll advancedRoll"');
      console.log("ASD", advHtml);
      html += advHtml;
    }

    if(extended) html += `<div class="roll-extended">
      <div class="roll-extended-header">Rolagem estendida</div>
      <div>${extended_accumulatedSuccesses} sucessos</div>
      <div>${extended_rolls} / ${extended_rollsMax} rolagens</div>
    </div>`;

    if(comment) html += `<div class="comment">${comment.replaceAll('\n', '<br>')}</div>`;

    return html;
  }

  
  static async rollToChat({
    dicePool=1, 
    targetNumber=8, 
    extended=false, 
    extended_accumulatedSuccesses=0, 
    extended_rolls=0, 
    extended_rollsMax=0, 
    tenAgain=true, 
    nineAgain=false, 
    eightAgain=false, 
    roteAction=false, 
    exceptionalTarget=5, 
    flavor="Teste de habilidade", 
    blindGMRoll=false, 
    actorOverride, 
    rollReturn={}, 
    advancedAction=false, 
    comment="",
    macro,
    actor
  }){
    
    const templateData = {
      roll: await DiceRollerDialogue.rollToHtml({
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
      })
    };
    
    //Create Roll Message
    let rollMode = blindGMRoll ? "blindroll" : game.settings.get("core", "rollMode");
    let speaker = actorOverride ? ChatMessage.getSpeaker({actor: actorOverride}) : ChatMessage.getSpeaker();
    
    // Render the chat card template
    const template = `systems/mta/templates/chat/roll-template.html`;
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
    if(actor) await actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if(macro && actor) {
      macro.execute({actor, token: actor.token ?? actor.getActiveTokens[0], item: this.itemRef});
    }

    // Create the chat message
    return msg;
  }

  // CÓDIGO GPT
  static _normalizeChanceFlavorExact(flavor) {
    let out = flavor || "";
    const targets = [" (Explosão de 10)", " (Explosão de 9+)", " (Explosão de 8+)"];
    for (const t of targets) {
      while (out.includes(t)) out = out.replace(t, "");
    }

    if (!out.includes(" (Teste de sorte)")) out += " (Teste de sorte)";
    return out;
  }


  static async rollWithDamage({
    dicePool=1, 
    targetNumber=8, 
    tenAgain=true, 
    nineAgain=false, 
    eightAgain=false, 
    roteAction=false, 
    exceptionalTarget=5, 
    flavor="Ataque", 
    blindGMRoll=false, 
    actorOverride,
    itemImg = "",
    itemName = "",
    itemDescr = "",
    weaponDamage = 0,
    armorPiercing = 0,
    itemRef=undefined, // for reloading of firearms
    spendAmmo=false,
    ammoPerShot=0, 
    advancedAction=false,
    rollReturn={},
    comment="",
    target,
    ignoreArmor=false,
    ignoreBallistic=true,
    noSuccessesToDamage=false,
    ballistic=0,
    armor=0,
    applyDefense=false,
    defense=0,
    macro,
    actor
  }) {

    if(applyDefense) dicePool -= defense;

    //CÓDIGO GPT
    if (dicePool < 1) {
      flavor = DiceRollerDialogue._normalizeChanceFlavorExact(flavor);
    }

    const templateData = {
      data: {
        description: itemDescr,
        rolls: [ {
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
        img: itemImg,
        name: itemName
      }
    };

    // Calculate damage
    let damageInflicted = noSuccessesToDamage ? weaponDamage : rollReturn.roll.total + weaponDamage;
    if(rollReturn.roll.total <= 0) damageInflicted = 0; // Miss

    let bashingDamageInflicted = 0;

    // Calculate armor-piercing (subtracted from ballistic first)
    const ballisticAdj = Math.max(0, ballistic - armorPiercing);
    const armorAdj = ignoreBallistic ? Math.max(0, armor - armorPiercing)
      : (armorPiercing > ballistic ? 
      Math.max(0, armor - (armorPiercing - ballistic)) :
      armor);

    if(!ignoreArmor) {
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

    if(!ignoreBallistic) {
      bashingDamageInflicted = Math.min(ballisticAdj, damageInflicted);
      if(bashingDamageInflicted) damageInflicted = Math.max(0, damageInflicted - bashingDamageInflicted);
    }

    // minimum damage
    if(damageInflicted <= 0) bashingDamageInflicted = Math.max(1, bashingDamageInflicted);
    
    templateData.data.summary = rollReturn.roll.total ? 
      (damageInflicted ? damageInflicted + ` ${game.i18n.localize('MTA.Lethal')} ` : "")
      + (bashingDamageInflicted ? bashingDamageInflicted + ` ${game.i18n.localize('MTA.Bashing')}` : "")
      : game.i18n.localize('MTA.AttackMissed')

      //game.i18n.localize('MTA.DamageInflicted') 

    if(armorPiercing && rollReturn.roll.total) templateData.data.summary += " (" + armorPiercing + " PA)";
    if(spendAmmo) templateData.data.summaryAddendum = ammoPerShot + " " + game.i18n.localize('MTA.AmmoSpent');
    if(rollReturn.roll.total) {
      templateData.data.showDamageButton = true;
      templateData.data.damageInflicted = damageInflicted;
      templateData.data.bashingDamageInflicted = bashingDamageInflicted;
      const tokenObj = target?.object ? target?.object : target;

      templateData.data.damageTargetId = target?.actor?.id;

      templateData.data.damageTokenId = tokenObj ? (tokenObj.scene ? `${tokenObj.scene.id}.${tokenObj.id}` : `${tokenObj.id}`) : null;
    }

    if(spendAmmo && ammoPerShot) {
      if(itemRef) {
        if(!itemRef.system.magazine) {
          ui.notifications.error(`A arma está sem munição!`);
          return;
        }
        let ammo = itemRef.system.magazine.system.quantity;
        ammo -= ammoPerShot;
        if(ammo < 0) {
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
    let speaker = actorOverride ? ChatMessage.getSpeaker({actor: actorOverride}) : ChatMessage.getSpeaker();

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

    chatData = ChatMessage.applyRollMode(chatData,rollMode);
    const msg = await ChatMessage.create(chatData);

    if (actor) await actor.setFlag('mta', 'rollReturn', rollReturn.roll);

    if(macro && actor) {
      macro.execute({actor, token: actor.token ?? actor.getActiveTokens[0], item: this.itemRef});
    }
    // Create the chat message
    return msg;
  }
}