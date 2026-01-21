import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './LiquidChrome.css';

interface LiquidChromeProps {
  baseColor?: [number, number, number];
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  logoUrl?: string;
}

export const LiquidChrome = ({
  baseColor = [0.35, 0.25, 0.15], // Dark coffee brown
  speed = 0.15,
  amplitude = 0.4,
  frequencyX = 2.5,
  frequencyY = 3.5,
  interactive = true,
  className = '',
  style,
  logoUrl = '/Sideeye-logo-nobg.png',
}: LiquidChromeProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    // Wave animation for each letter
    const letters = textRef.current.querySelectorAll('.wave-letter');
    letters.forEach((letter, index) => {
      const element = letter as HTMLElement;
      element.style.animationDelay = `${index * 0.1}s`;
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new Renderer({ antialias: true, alpha: true });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uBaseColor;
      uniform float uAmplitude;
      uniform float uFrequencyX;
      uniform float uFrequencyY;
      uniform vec2 uMouse;
      varying vec2 vUv;

      // Coffee-inspired color palette
      vec3 coffeePalette(float t) {
        vec3 lightBrown = vec3(0.76, 0.58, 0.42);
        vec3 mediumBrown = vec3(0.55, 0.38, 0.22);
        vec3 darkBrown = vec3(0.35, 0.25, 0.15);
        vec3 cream = vec3(0.94, 0.88, 0.76);
        
        float blend = sin(t * 0.5) * 0.5 + 0.5;
        
        if (t < 0.33) {
          return mix(darkBrown, mediumBrown, t * 3.0);
        } else if (t < 0.66) {
          return mix(mediumBrown, lightBrown, (t - 0.33) * 3.0);
        } else {
          return mix(lightBrown, cream, (t - 0.66) * 3.0);
        }
      }

      vec4 renderImage(vec2 uvCoord) {
          vec2 fragCoord = uvCoord * uResolution.xy;
          vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

          for (float i = 1.0; i < 8.0; i++){
              uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
              uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
          }

          vec2 diff = (uvCoord - uMouse);
          float dist = length(diff);
          float falloff = exp(-dist * 15.0);
          float ripple = sin(8.0 * dist - uTime * 3.0) * 0.02;
          uv += (diff / (dist + 0.0001)) * ripple * falloff;

          float pattern = sin(uv.x * 5.0 + uTime) * sin(uv.y * 3.0 + uTime) * 0.5 + 0.5;
          vec3 color = coffeePalette(pattern * 0.5 + uTime * 0.05) * 0.8 + uBaseColor * 0.2;
          
          return vec4(color, 0.9);
      }

      void main() {
          vec4 col = vec4(0.0);
          int samples = 0;
          for (int i = -1; i <= 1; i++){
              for (int j = -1; j <= 1; j++){
                  vec2 offset = vec2(float(i), float(j)) * (1.5 / min(uResolution.x, uResolution.y));
                  col += renderImage(vUv + offset);
                  samples++;
              }
          }
          gl_FragColor = col / float(samples);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height])
        },
        uBaseColor: { value: new Float32Array(baseColor) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: new Float32Array([0, 0]) }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const scale = window.devicePixelRatio || 1;
      renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
      const resUniform = program.uniforms.uResolution.value as Float32Array;
      resUniform[0] = gl.canvas.width;
      resUniform[1] = gl.canvas.height;
      resUniform[2] = gl.canvas.width / gl.canvas.height;
    }
    window.addEventListener('resize', resize);
    resize();

    function handleMouseMove(event: MouseEvent) {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      mouseUniform[0] = x;
      mouseUniform[1] = y;
    }

    function handleTouchMove(event: TouchEvent) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        if (touch) {
          const rect = container.getBoundingClientRect();
          const x = (touch.clientX - rect.left) / rect.width;
          const y = 1 - (touch.clientY - rect.top) / rect.height;
          const mouseUniform = program.uniforms.uMouse.value as Float32Array;
          mouseUniform[0] = x;
          mouseUniform[1] = y;
        }
      }
    }

    if (interactive) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchmove', handleTouchMove);
    }

    let animationId: number;
    function update(t: number) {
      animationId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001 * speed;
      renderer.render({ scene: mesh });
    }
    animationId = requestAnimationFrame(update);

    container.appendChild(gl.canvas);
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchmove', handleTouchMove);
      }
      if (gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
      const loseContext = gl.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    };
  }, [baseColor, speed, amplitude, frequencyX, frequencyY, interactive]);

  const comingSoonText = "COMING SOON";

  return (
    <div 
      ref={containerRef} 
      className={`liquidChrome-container ${className}`}
      style={{
        ...style,
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        // Consistent coffee brown background (no gradient)
        backgroundColor: '#2c1810',
      }}
    >
      {/* Logo Container */}
      <div 
        className="logo-container"
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <div 
          className="logo-wrapper"
          style={{
            position: 'relative',
            width: '300px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 0 40px rgba(139, 69, 19, 0.8))',
          }}
        >
          <img 
            src={logoUrl} 
            alt="Shop Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'brightness(1.1) contrast(1.1)',
            }}
          />
        </div>
      </div>

      {/* Text Container */}
      <div 
        className="text-container"
        style={{
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Coming Soon Text */}
        <div 
          ref={textRef}
          className="coming-soon-wave"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.8rem',
            marginBottom: '2rem',
          }}
        >
          {comingSoonText.split('').map((letter, index) => (
            <span
              key={index}
              className="wave-letter"
              style={{
                color: '#D4B096',
                fontSize: '3.5rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                fontFamily: "'Montserrat', 'Arial Black', sans-serif",
                display: 'inline-block',
                textShadow: `
                  0 1px 0 #8B4513,
                  0 2px 0 #8B4513,
                  0 3px 0 #8B4513,
                  0 4px 0 #8B4513,
                  0 5px 0 rgba(139, 69, 19, 0.5),
                  0 6px 1px rgba(0, 0, 0, 0.2),
                  0 0 15px rgba(212, 176, 150, 0.6),
                  0 0 25px rgba(212, 176, 150, 0.4),
                  0 0 35px rgba(212, 176, 150, 0.2)
                `,
                WebkitTextStroke: '1.5px #8B4513',
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>

        {/* Subtitle - SIMPLIFIED with just black font color */}
        <div 
          className="subtitle"
          style={{
            color: '#000000', // Changed to black
            fontSize: '1.6rem',
            textAlign: 'center',
            maxWidth: '650px',
            lineHeight: '1.7',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            letterSpacing: '0.03em',
            padding: '0 2rem',
            animation: 'fadeIn 3s ease-out',
          }}
        >
          Brewing something special. The aroma of excellence is in the air.
        </div>
      </div>
    </div>
  );
};

export default LiquidChrome;