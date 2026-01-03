export class TokenTwillightFilter extends AbstractBaseFilter {

  /** @override */
  static fragmentShader = `
    precision ${PIXI.settings.PRECISION_FRAGMENT} float;
    uniform vec3 color;
    uniform sampler2D uSampler;
    varying vec2 vTextureCoord;
    
    ${this.CONSTANTS}
    ${this.PERCEIVED_BRIGHTNESS}
          
    void main() {
      vec4 baseColor = texture2D(uSampler, vTextureCoord);
      
      // Unmultiply rgb with alpha channel
      if ( baseColor.a > 0.0 ) baseColor.rgb /= baseColor.a;
        
      // Computing halo
      float lum = perceivedBrightness(baseColor.rgb);
      vec3 haloColor = vec3(lum) * color;
  
      // Construct final image
      gl_FragColor = vec4(haloColor, 0.7) * baseColor.a;
    }
    `;

  /** @override */
  static defaultUniforms = {
    uSampler: null,
    color: [0.55, 0.58, 0.60]
  };
}
