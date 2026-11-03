import * as T from './vendor/three.module.js';
import { createSeasonalEffects } from './effects.js?v=companions-2';
import { createSeasonalTree } from './tree.js?v=companions-2';
import { createMeadowGarden } from './meadow.js';
import { installWallpaper } from './wallpaper.js?v=companions-2';
import { animateCatPair } from './cat-motion.js';

const canvas=document.querySelector('#scene');
let renderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});}
catch(e){const el=document.querySelector('#error');el.style.display='block';el.textContent='Live 3D needs WebGL. You can still view the Artwork using the control below.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x020508);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100);
new T.TextureLoader().load('./starfield-bg.jpg',texture=>{texture.colorSpace=T.SRGBColorSpace;scene.background=texture;scene.backgroundIntensity=.55;nebula.visible=false;fitBackground();});
const world=new T.Group();scene.add(world);
scene.add(new T.HemisphereLight(0xc8d8ed,0x242219,2));
const sun=new T.DirectionalLight(0xffecc3,3.1);sun.position.set(-4,8,-2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});sun.shadow.bias=-.0005;scene.add(sun);
const rim=new T.DirectionalLight(0x829fc8,1.4);rim.position.set(3,3,5);scene.add(rim);
let seed=24841;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
const TAU=Math.PI*2,R=5;
const uniforms={uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uCycle:{value:.12},uCatA:{value:new T.Vector2()},uCatB:{value:new T.Vector2()}};
const seasonsGLSL=`
const float TAU=6.28318530718;
float state(vec2 p){float a=mod(atan(p.y,p.x)+TAU,TAU)/TAU;return mod(floor(uCycle-a)+4.,4.);}
vec3 palette(float s){if(s<.5)return vec3(.29,.48,.115);if(s<1.5)return vec3(.15,.43,.075);if(s<2.5)return vec3(.86,.53,.16);return vec3(.68,.74,.86);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float snowHeight(vec2 p){return .025+noise(p*2.1)*.055+noise(p*8.)*.012;}

`;
const diskMat=new T.ShaderMaterial({uniforms,vertexShader:`uniform float uCycle;varying vec2 vP;${seasonsGLSL}void main(){vP=position.xz;vec3 p=position;if(state(p.xz)>2.5)p.y+=snowHeight(p.xz);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uCycle;varying vec2 vP;${seasonsGLSL}void main(){if(length(vP)>5.)discard;float s=state(vP);vec3 c=palette(s);if(s<2.5)c*=.26+noise(vP*45.)*.10;else {float h=snowHeight(vP);vec2 slope=vec2(snowHeight(vP+vec2(.025,0))-h,snowHeight(vP+vec2(0,.025))-h)/.025;float lit=dot(normalize(vec3(-slope.x,1.,-slope.y)),normalize(vec3(-.5,1.,-.3)));c=mix(vec3(.43,.53,.69),vec3(.86,.90,1.),lit*.75+noise(vP*30.)*.08);c+=pow(hash(floor(vP*200.)),40.)*.11;}gl_FragColor=vec4(c,1.);}`});
const disk=new T.Mesh(new T.CylinderGeometry(R,R,.20,160),new T.MeshStandardMaterial({color:0x080b0d,metalness:.5,roughness:.48}));disk.position.y=-.13;world.add(disk);
const surfaceGeo=new T.PlaneGeometry(10,10,140,140);surfaceGeo.rotateX(-Math.PI/2);const surface=new T.Mesh(surfaceGeo,diskMat);surface.position.y=-.021;world.add(surface);
function ring(radius,tube,color,y){const m=new T.Mesh(new T.TorusGeometry(radius,tube,8,160),new T.MeshStandardMaterial({color,metalness:.7,roughness:.35}));m.rotation.x=Math.PI/2;m.position.y=y;world.add(m);return m;}
ring(5,.025,0x252b27,-.03);ring(4.99,.012,0x8f9272,-.012);
const marks=new T.InstancedMesh(new T.BoxGeometry(.018,.034,.085),new T.MeshStandardMaterial({color:0xc8c9b4,emissive:0x3a3b30}),100);
const dummy=new T.Object3D();for(let i=0;i<100;i++){let a=i/100*TAU;dummy.position.set(Math.cos(a)*4.99,-.02,Math.sin(a)*4.99);dummy.rotation.y=-a+Math.PI/2;dummy.updateMatrix();marks.setMatrixAt(i,dummy.matrix);}world.add(marks);
const pearls=new T.InstancedMesh(new T.SphereGeometry(.040,10,8),new T.MeshStandardMaterial({color:0xf4f5ed,roughness:.32,metalness:.12,emissive:0xc1d6df,emissiveIntensity:.12}),128);
for(let i=0;i<128;i++){const a=i/128*TAU;dummy.position.set(Math.cos(a)*5.025,.012,Math.sin(a)*5.025);dummy.rotation.set(0,0,0);dummy.scale.setScalar(i%8===0?1.18:1);dummy.updateMatrix();pearls.setMatrixAt(i,dummy.matrix);}world.add(pearls);

// Each blade has its own root, width, height and bend; all seasonal sweeps run on the GPU.
const count=115000,roots=new Float32Array(count*3),specs=new Float32Array(count*3);
for(let i=0;i<count;i++){const a=rnd()*TAU,r=Math.sqrt(.98*.98+rnd()*(R*R-.98*.98));roots.set([Math.cos(a)*r,0,Math.sin(a)*r],i*3);specs.set([.09+rnd()*.16,rnd()*TAU,rnd()],i*3);}
const grassGeo=new T.InstancedBufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute([-.5,0,0,.5,0,0,-.32,.5,0,.32,.5,0,0,1,0],3));grassGeo.setIndex([0,1,2,1,3,2,2,3,4]);grassGeo.setAttribute('root',new T.InstancedBufferAttribute(roots,3));grassGeo.setAttribute('spec',new T.InstancedBufferAttribute(specs,3));grassGeo.instanceCount=count;
const grass=new T.Mesh(grassGeo,new T.ShaderMaterial({side:T.DoubleSide,uniforms,vertexShader:`
uniform float uTime,uCycle;attribute vec3 root,spec;varying float vH,vS,vN;varying vec2 vRoot;
${seasonsGLSL}
void main(){float s=state(root.xz);vS=s;vH=position.y;vN=spec.z;vRoot=root.xz;
float winter=step(2.5,s);float height=mix(spec.x,.003+spec.z*.006,winter);
float bend=sin(uTime*1.5+root.x*1.6+root.z*.7)*.018+sin(uTime*.8+root.z*2.)*.012;
vec3 p=root+vec3(position.x*.014*cos(spec.y),position.y*height+winter*(snowHeight(root.xz)-.02),position.x*.014*sin(spec.y));
p.xz+=vec2(cos(spec.y)*.045+bend,sin(spec.y)*.032+bend*.7)*position.y*position.y*(1.-winter);
gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`
uniform float uCycle;uniform vec2 uCatA,uCatB;varying float vH,vS,vN;varying vec2 vRoot;
${seasonsGLSL}
void main(){vec3 c=palette(vS);c*=mix(.25,1.50,pow(vH,.70))*(.62+vN*.72)*(.8+noise(vRoot*2.)*.32);if(vS>2.5)c=vec3(.76,.82,.94)*(.88+vH*.12+vN*.10);
float d=min(length(vRoot-uCatA),length(vRoot-uCatB));c*=mix(.38,1.,smoothstep(.08,.42,d));gl_FragColor=vec4(c,1.);}` }));grass.frustumCulled=false;world.add(grass);

const hub=new T.Mesh(new T.CylinderGeometry(.88,.88,.065,96),new T.MeshStandardMaterial({color:0x030508,roughness:.54,metalness:.55}));hub.position.y=.045;hub.receiveShadow=true;world.add(hub);ring(.87,.015,0xafa475,.085);ring(.63,.009,0x5c6150,.083);
const hand=new T.Group();hand.position.y=.22;world.add(hand);
const gold=new T.MeshStandardMaterial({color:0xe7d290,metalness:.65,roughness:.4});
const stem=new T.Mesh(new T.CylinderGeometry(.016,.016,3.82,8),gold);stem.rotation.z=-Math.PI/2;stem.position.x=2.73;hand.add(stem);
const wheat=new T.Group();wheat.position.x=4.38;hand.add(wheat);
for(let i=0;i<9;i++){for(const side of [-1,1]){const grain=new T.Mesh(new T.SphereGeometry(1,8,6),gold);grain.scale.set(.115,.022,.045);grain.position.set((i-4)*.055,0,side*.042);grain.rotation.y=side*-.65;wheat.add(grain);}}
for(let i=0;i<5;i++){const hair=new T.Mesh(new T.CylinderGeometry(.002,.002,.28,4),gold);hair.rotation.z=-Math.PI/2;hair.rotation.y=(i-2)*.08;hair.position.set(.28,0,(i-2)*.018);wheat.add(hair);}
hand.traverse(o=>{if(o.isMesh)o.castShadow=true;});

function cat(color){const group=new T.Group(),body=new T.Group();group.add(body);const mat=new T.MeshStandardMaterial({color,roughness:.84,emissive:color===0x161a20?0x3c668a:0xffdca4,emissiveIntensity:color===0x161a20?.18:.18}),earMat=new T.MeshStandardMaterial({color:color===0x161a20?0x342c32:0xd0b29f,roughness:1});
function ell(parent,pos,scale,material=mat){const m=new T.Mesh(new T.SphereGeometry(1,16,12),material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
ell(body,[0,.24,0],[.14,.15,.29]);ell(body,[0,.27,.19],[.125,.15,.14]);
const eyes=[],ears=[];
const head=new T.Group();head.position.set(0,.39,.27);body.add(head);ell(head,[0,0,0],[.13,.12,.12]);ell(head,[0,-.035,.09],[.08,.055,.055]);
for(const x of [-.082,.082]){const ear=new T.Mesh(new T.ConeGeometry(.062,.15,3),mat);ear.position.set(x,.105,-.015);ear.rotation.z=-Math.sign(x)*.15;head.add(ear);ears.push(ear);const inner=new T.Mesh(new T.ConeGeometry(.035,.09,3),earMat);inner.position.set(x,.115,.006);head.add(inner);const eye=ell(head,[x*.68,.015,.103],[.012,.018,.009],new T.MeshStandardMaterial({color:color===0x161a20?0xb0bd78:0x5e7863}));eyes.push(eye);}
const legs=[];for(const x of [-.09,.09])for(const z of [-.18,.18]){let leg=new T.Group();leg.position.set(x,.23,z);body.add(leg);ell(leg,[0,-.08,0],[.044,.11,.045]);ell(leg,[0,-.17,.015],[.05,.035,.068]);legs.push(leg);}
const tail=new T.Group();tail.position.set(0,.30,-.22);body.add(tail);const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.03,.08,-.18),new T.Vector3(.06,.21,-.34),new T.Vector3(.02,.29,-.38)]);const tm=new T.Mesh(new T.TubeGeometry(curve,20,.024,7,false),mat);tm.castShadow=true;tail.add(tm);
const glowMaterial=new T.ShaderMaterial({uniforms:{uColor:{value:new T.Color(color===0x161a20?0x85b6e0:0xffe6ba)}},side:T.BackSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform vec3 uColor;varying vec3 vN,vV;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.);gl_FragColor=vec4(uColor,rim*.32);}`});
const meshes=[];body.traverse(o=>{if(o.isMesh)meshes.push(o);});for(const m of meshes){const halo=new T.Mesh(m.geometry,glowMaterial);halo.position.copy(m.position);halo.rotation.copy(m.rotation);halo.scale.copy(m.scale).multiplyScalar(1.065);m.parent.add(halo);}
const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const glowContext=glowCanvas.getContext('2d');const gradient=glowContext.createRadialGradient(32,32,1,32,32,32);gradient.addColorStop(0,color===0x161a20?'rgba(130,190,255,.34)':'rgba(255,225,170,.34)');gradient.addColorStop(.45,color===0x161a20?'rgba(110,170,255,.09)':'rgba(255,210,140,.09)');gradient.addColorStop(1,'rgba(0,0,0,0)');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,64,64);const aura=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending}));aura.position.y=.27;aura.scale.set(.95,.95,1);group.add(aura);
const light=new T.PointLight(color===0x161a20?0x86b8ec:0xffd89a,.15,1.0,2);light.position.y=.22;group.add(light);
for(const child of body.children)child.position.y-=.24;body.position.y=.24;
world.add(group);return {group,body,head,legs,tail,eyes,ears,tailGeometry:tm.geometry,tailRest:new Float32Array(tm.geometry.attributes.position.array)};}
const cats=[cat(0xf1e4bb),cat(0x161a20)];cats.forEach(c=>c.group.scale.setScalar(.84));
function moveCats(t){animateCatPair(cats,t,uniforms);}
const seasonalTree=createSeasonalTree(world,rnd);
const meadowGarden=createMeadowGarden(world,rnd);

const effects=createSeasonalEffects({world,scene,camera,uniforms,random:rnd});

const starsPos=new Float32Array(2600*3),starsColor=new Float32Array(2600*3);for(let i=0;i<2600;i++){let a=rnd()*TAU,y=rnd()*2-1,r=32;starsPos.set([Math.cos(a)*Math.sqrt(1-y*y)*r,y*r,Math.sin(a)*Math.sqrt(1-y*y)*r],i*3);const b=.15+rnd()*.6;starsColor.set([b*.8,b*.9,b],i*3);}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(starsPos,3));sg.setAttribute('color',new T.BufferAttribute(starsColor,3));scene.add(new T.Points(sg,new T.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.75,depthWrite:false})));
const nebulaCanvas=document.createElement('canvas');nebulaCanvas.width=1024;nebulaCanvas.height=512;const ctx=nebulaCanvas.getContext('2d');
for(let i=0;i<130;i++){const x=rnd()*1024,y=260+Math.sin(x/170)*35+(rnd()-.5)*95,r=25+rnd()*100;let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(75,94,126,${.025+rnd()*.045})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
const nebula=new T.Mesh(new T.PlaneGeometry(60,30),new T.MeshBasicMaterial({map:new T.CanvasTexture(nebulaCanvas),transparent:true,opacity:1.1,depthWrite:false,blending:T.AdditiveBlending}));nebula.position.set(0,2,-17);nebula.rotation.z=.14;scene.add(nebula);

let capturing=false;
let azimuth=0,elevation=.63,distance=14.5,playing=true,speed=1,cycle=4,elapsed=0,last=performance.now(),pointer=null;
function view(){camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(0,-.65,0);}
function fitBackground(){const texture=scene.background;if(!texture?.image)return;const aspect=camera.aspect;const imageAspect=texture.image.width/texture.image.height;texture.repeat.set(Math.min(1,aspect/imageAspect),Math.min(1,imageAspect/aspect));texture.offset.set((1-texture.repeat.x)/2,(1-texture.repeat.y)/2);texture.needsUpdate=true;}
function resize(){if(capturing)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1.2?T.MathUtils.radToDeg(2*Math.atan(5.8/(distance*camera.aspect))):36;camera.updateProjectionMatrix();view();fitBackground();}addEventListener('resize',resize);resize();
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!pointer)return;azimuth-=(e.clientX-pointer.x)*.006;elevation=T.MathUtils.clamp(elevation+(e.clientY-pointer.y)*.004,.18,1.45);pointer={x:e.clientX,y:e.clientY};view();});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.015,11,28);view();},{passive:false});
const play=document.querySelector('#play'),timeline=document.querySelector('#timeline'),names=['Spring','Summer','Autumn','Winter'];
document.querySelector('#reference').onclick=()=>document.querySelector('#reference-dialog').showModal();document.querySelector('#close-reference').onclick=()=>document.querySelector('#reference-dialog').close();
function toggle(){playing=!playing;play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Pause':'Play');}play.onclick=toggle;
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{cycle=+b.dataset.season+1;});
timeline.oninput=()=>{cycle=+timeline.value;};document.querySelector('#speed').onclick=e=>{speed=speed===1?2:speed===2?.5:1;e.target.textContent=speed+'×';};
document.querySelector('#reset').onclick=()=>{azimuth=0;elevation=.63;distance=14.5;view();};document.querySelector('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean');if('1234'.includes(e.key)&&e.key.length===1)cycle=Number(e.key);});
if(new URLSearchParams(location.search).has('clean'))document.body.classList.add('clean');
function renderFrame(time,seasonCycle){
  uniforms.uTime.value=time;uniforms.uCycle.value=seasonCycle;uniforms.uPixelRatio.value=renderer.getPixelRatio();
  hand.rotation.y=-(seasonCycle%1)*TAU;
  moveCats(time);const weights=seasonalTree.update(time,seasonCycle);meadowGarden.update(time,weights);effects.update(time);
  renderer.render(scene,camera);
}
function animate(now){
  requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
  if(capturing||document.body.classList.contains('art-mode')||document.hidden)return;
  if(playing){elapsed+=dt*speed;cycle+=dt*speed/15;}
  renderFrame(elapsed,cycle);
  timeline.value=((cycle%4)+4)%4;
  const current=((Math.floor(cycle)-(cycle%1>.5?0:1))%4+4)%4;
  document.querySelector('#time').textContent=names[current];
  document.querySelectorAll('[data-season]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
}
const api={scene,camera,renderer,effects,
  get cycle(){return cycle},set cycle(value){cycle=value},
  get playing(){return playing},set playing(value){if(playing!==value)toggle();},
  async prepareCapture(width,height){
    capturing=true;renderer.setPixelRatio(1);renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.fov=camera.aspect<1.2?T.MathUtils.radToDeg(2*Math.atan(5.8/(distance*camera.aspect))):36;
    camera.updateProjectionMatrix();view();fitBackground();
    await Promise.all([new Promise((resolve,reject)=>{const started=performance.now();const check=()=>{if(effects.resources.loaded===effects.resources.expected)return resolve();if(effects.resources.failed.length||performance.now()-started>15000)return reject(new Error('The scene textures could not load. Please try again.'));setTimeout(check,100);};check();}),new Promise(resolve=>setTimeout(resolve,300))]);
  },
  renderAt:renderFrame,
  previewAction(name){const times={wander:0,nuzzle:8.5,hug:13,roll:19,stretch:24,play:28,hop:32.9,curl:39};elapsed=times[name]??0;if(!playing)toggle();last=performance.now();renderFrame(elapsed,cycle);},
  endCapture(){capturing=false;renderer.setPixelRatio(Math.min(devicePixelRatio,2));resize();last=performance.now();},
};
window.seasonDial=api;
installWallpaper(api);
requestAnimationFrame(animate);
