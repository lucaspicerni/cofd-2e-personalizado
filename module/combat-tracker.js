export class MTACombatTracker extends CombatTracker {
  async getData(options={}) {
    const data = await super.getData(options);
    if(data.combat?.turns) {
      for ( let [i, combatant] of data.combat.turns.entries() ) {
        if ( combatant.actor && combatant.actor.type === "ephemeral" && combatant.actor.system.ephemeralType === "Angel") {
          data.turns[i].css += " cipherText"; 
        }
      }
    }

    return data;
  }

/*   activateListeners(html) {
    super.activateListeners(html);

    const randomInt = max => Math.floor(Math.random() * max)
    const randomFromArray = array => array[randomInt(array.length)]
    const scrambleText = text => {
      const chars = 'abcdefghijklmnopqrstuvw'.split('')
      return text
        .split('')
        .map(x => randomInt(3) > 1 ? randomFromArray(chars) : x)
        .join('')
    }
    const tracker = this;
    const textEles = html.find(".cipherText .token-name h4");
    textEles.each(function() {
      const originalText = $( this ).text();
      
      const timer = setInterval(() => {
        $( this ).text(scrambleText(originalText));
        if(!tracker.viewed) clearInterval(timer);
      }
      , 100)

    });
  } */
}