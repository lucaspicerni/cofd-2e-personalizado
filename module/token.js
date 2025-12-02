
/* Hooks.on('createActiveEffect ', (activeEffect, ) => {
  if(activeEffect._statusId === CONFIG.specialStatusEffects.TWILLIGHT)
  canvas.perception.update({refreshVision: true, refreshLighting: true}, true);
  this.mesh.refresh();
  break;
}); */

export class TokenMTA extends Token {
  
  /**
   * Draw the active effects and overlay effect icons which are present upon the Token
   * @Override Also draws conditions and tilts
   */
  /* _onApplyStatusEffect(statusId, active) {
    super(statusId, active);
    return;
    if(statusId === CONFIG.specialStatusEffects.TWILLIGHT) {
      canvas.perception.update({refreshVision: true, refreshLighting: true}, true);
      this.mesh.refresh();
    }
  } */


   /**
   * Draw the effect icons for ActiveEffect documents which apply to the Token's Actor.
   * Called by {@link Token#drawEffects}.
   * @Override Also draws conditions and tilts
   */
  async _drawEffects() {
    await super._drawEffects();

    this.effects.renderable = false;

    const actorTilts = (this.actor?.items.filter(item => {
      if (item.type === "tilt" || item.type === "condition") {
        if (item.system.statusVisibility === "All" || (item.system.statusVisibility === "Owner" && this.actor.isOwner)) {
          if (item.type === "condition" && !game.settings.get("mta", "showConditionsOnTokens")) return false;
          return true;
        }
      }
    })) || [];
    const tiltEffects = actorTilts.map(item => item.img);

    const promises = [];
    for (const effect of tiltEffects) {
      if (!effect) continue;
      else promises.push(this._drawEffect(effect));
    }
    await Promise.allSettled(promises);

    this.effects.renderable = true;
    this.renderFlags.set({ refreshEffects: true });
  }
  
  /**
   * Draw a single resource bar, given provided data
   * @Override Draws a custom bar for health, otherwise uses the default function.
   */
  _drawBar( number, bar, data ) {
    if ( data.attribute === 'health' ) {
      let health = this.actor?.system?.health;
      if ( health && health.lethal !== undefined && health.aggravated !== undefined ) {
        // Handle health rendering
        const aggravated = Math.clamp( data.max - health.aggravated, 0, data.max ) / data.max;
        const lethal = Math.clamp( data.max - health.lethal, 0, data.max ) / data.max;
        const bashing = Math.clamp( data.max - data.value, 0, data.max ) / data.max;
        // Determine sizing
        let h = Math.max( ( canvas.dimensions.size / 12 ), 8 );
        const w = this.w;
        const bs = Math.clamp( h / 8, 1, 2 );
        if ( this.height >= 2 ) h *= 1.6;  // Enlarge the bar for large tokens
        // Determine the color to use
        const blk = 0x000000;
        let color_health = parseInt( game.settings.get( "mta", "tokenHealthColorHealthy" ).replace( '#', '0x' ), 16 );
        let color_aggr = parseInt( game.settings.get( "mta", "tokenHealthColorAggravated" ).replace( '#', '0x' ), 16 );
        let color_lethal = parseInt( game.settings.get( "mta", "tokenHealthColorLethal" ).replace( '#', '0x' ), 16 );
        let color_bashing = parseInt( game.settings.get( "mta", "tokenHealthColorBashing" ).replace( '#', '0x' ), 16 );
        // Draw the bar
        bar.clear()
        bar.beginFill( color_health, 0.5 ).lineStyle( bs, blk, 1.0 ).drawRoundedRect( 0, 0, this.w, h, 3 )
        //bar.beginFill(color, 1.0).lineStyle(bs, blk, 1.0).drawRoundedRect(0, 0, pct*w, h, 2)
        bar.beginFill( color_bashing, 1.0 ).lineStyle( bs, blk, 1.0 ).drawRoundedRect( 0, 0, bashing * w, h, 2 );
        bar.beginFill( color_lethal, 1.0 ).lineStyle( bs, blk, 1.0 ).drawRoundedRect( 0, 0, lethal * w, h, 2 );
        bar.beginFill( color_aggr, 1.0 ).lineStyle( bs, blk, 1.0 ).drawRoundedRect( 0, 0, aggravated * w, h, 2 );
        // Set position
        let posY = number === 0 ? this.h - h : 0;
        bar.position.set( 0, posY );
        return;
      }
    }
    // Default
    return super._drawBar( number, bar, data );
  }

  _getTextStyle() {
    const style = super._getTextStyle();
    if(game.settings.get('mta','angelCiphers')) {
      if(this.document?.actor?.system?.ephemeralType === "Angel") style.fontFamily = "PigpenCipher";
    }
    return style;
  }
}
