/**
 * 温度场：WebGL1 片元着色器绘制的熔金流体，鼠标是热源。
 * - 半分辨率渲染 + CSS 放大；帧耗时过高自动再降分辨率
 * - 离屏 / 页面隐藏时停帧；减少动态效果只画一帧静态图
 * - 不支持 WebGL 时给容器加 .no-webgl，由 CSS 渐变兜底
 */
import { reducedMotion } from './env';

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHeat; uniform float uMobile;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*asp,uv.y)*1.6; float t=uTime*.045;
  vec2 m=vec2(uMouse.x*asp,uMouse.y)*1.6;
  float d=length(p-m);
  float warm=exp(-d*d*2.2)*(.55+uHeat*.9);
  vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t*.8));
  vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.6),fbm(p+3.*q+vec2(8.3,2.8)-t*.5));
  r+=(p-m)*warm*.18;
  float f=fbm(p+3.4*r);
  vec3 c0=vec3(.051,.035,.02),c1=vec3(.16,.09,.035),c2=vec3(.83,.58,.23),c3=vec3(.94,.42,.37),c4=vec3(1.,.86,.62);
  vec3 col=mix(c0,c1,smoothstep(.1,.55,f));
  col=mix(col,c2,smoothstep(.5,.85,f)*(.5+.5*length(q)));
  col=mix(col,c3,smoothstep(.6,1.,r.x)*.35);
  col+=c4*pow(smoothstep(.62,.95,f),3.)*.55;
  col+=c2*warm*.32+c4*warm*warm*.12;
  float lean=mix(smoothstep(.0,.62,uv.x),.55,uMobile);
  col*=mix(.42,1.,lean);
  col*=smoothstep(-.05,.35,uv.y)*.75+.25;
  col+=(hash(gl_FragCoord.xy+uTime)-.5)*.025;
  gl_FragColor=vec4(col,1.);
}`;

export function createHeatfield(canvas: HTMLCanvasElement, host: HTMLElement) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { host.classList.add('no-webgl'); return null; }

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
  } catch {
    host.classList.add('no-webgl');
    return null;
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uMouse = u('uMouse'), uHeat = u('uHeat'), uMobile = u('uMobile');

  let scale = 0.5;
  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr * scale));
    canvas.height = Math.max(1, Math.round(r.height * dpr * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uMobile, r.width < 1024 ? 1 : 0);
  };
  new ResizeObserver(resize).observe(host);
  resize();

  const mouse = { x: 0.72, y: 0.55, tx: 0.72, ty: 0.55 };
  let heat = 0;
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = 1 - (e.clientY - r.top) / r.height;
    heat = Math.min(1, heat + Math.hypot(nx - mouse.tx, ny - mouse.ty) * 4);
    mouse.tx = nx; mouse.ty = ny;
  }, { passive: true });

  let running = false, raf = 0, t0 = performance.now(), last = t0, slow = 0;
  const frame = (now: number) => {
    raf = 0;
    const dt = now - last; last = now;
    if (dt > 24) slow++; else slow = Math.max(0, slow - 1);
    if (slow > 40 && scale > 0.34) { scale = 0.34; slow = 0; resize(); }
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    heat *= 0.96;
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uHeat, heat);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    host.classList.add('is-lit');
    if (running) raf = requestAnimationFrame(frame);
  };

  const api = {
    start() {
      if (running || document.hidden) return;
      if (reducedMotion) { requestAnimationFrame(frame); return; }
      running = true; last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? api.stop() : api.start()));
  return api;
}
