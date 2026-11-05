import * as T from './vendor/three.module.js';
import { createSeasonalEffects } from './effects.js?v=winter-still-1';
import { createSeasonalTree } from './tree.js?v=winter-still-1';
import { createMeadowGarden } from './meadow.js?v=winter-gifts-4';
import { installWallpaper } from './wallpaper.js?v=seated-cats-1';

const sceneOptions = new URLSearchParams(location.search);
const granularSnow = sceneOptions.get('snow') !== 'classic';
const springStill = sceneOptions.get('season') === 'spring';
const catStyle = springStill ? sceneOptions.get('cats') : null;
const summerStill = sceneOptions.get('season') === 'summer';
const winterStill = sceneOptions.get('season') === 'winter';
const fixedCycle = springStill ? 1 : summerStill ? 2 : winterStill ? 4 : null;
const seasonStill = fixedCycle !== null;
const wideCameraFov = springStill ? 41 : 36;
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
const uniforms={uTime:{value:0},uPixelRatio:{value:renderer.getPixelRatio()},uCycle:{value:.12},uHandDirection:{value:new T.Vector2(1,0)},uCatA:{value:new T.Vector2()},uCatB:{value:new T.Vector2()}};
const seasonsGLSL=`
const float TAU=6.28318530718;
float seasonPhase(vec2 p){
  return uCycle-mod(atan(p.y,p.x)+TAU,TAU)/TAU;
}
vec3 palette(float s){if(s<.5)return vec3(.39,.57,.105);if(s<1.5)return vec3(.075,.34,.14);if(s<2.5)return vec3(.86,.53,.16);return vec3(.68,.74,.86);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float snowHeight(vec2 p){return .025+noise(p*2.1)*.055+noise(p*8.)*.012;}
// Return the seasons on either side of the nearest boundary and their blend.
vec3 seasonMix(vec2 p){
  float phase=seasonPhase(p);
  ${seasonStill ? 'return vec3(vec2(mod(floor(phase),4.)),0.);' : `
  float boundary=floor(phase+.5);
  float distance=(phase-boundary)*TAU*max(length(p),.9);
  float ripple=(noise(p*6.)-.5)*.11;
  return vec3(mod(boundary-1.,4.),mod(boundary,4.),smoothstep(-.10,.38,distance+ripple));
  `}
}
float snowCover(vec3 season){
  return mix(step(2.5,season.x),step(2.5,season.y),season.z);
}
`;
const handGLSL=`
uniform vec2 uHandDirection;
vec2 handLocal(vec2 p){
  vec2 across=vec2(-uHandDirection.y,uHandDirection.x);
  return vec2(dot(p,uHandDirection),dot(p,across));
}
float handShade(vec2 p,float groundHeight){
  ${seasonStill ? 'return 1.;' : `
  // Project the elevated hand along the key light onto the local ground.
  float clearance=.22-groundHeight;
  vec2 local=handLocal(p-vec2(.5,.25)*clearance);
  float tip=smoothstep(4.12,4.27,local.x);
  float width=mix(.018,.082,tip);
  float feather=.025+clearance*.30;
  float along=smoothstep(.79,.95,local.x)*(1.-smoothstep(4.64,4.84,local.x));
  float shade=along*(1.-smoothstep(width*.30,width+feather,abs(local.y)));
  return 1.-shade*.40;
  `}
}
`;
const diskMat=new T.ShaderMaterial({uniforms,vertexShader:`
uniform float uCycle;
varying vec2 vP;
${seasonsGLSL}
void main(){
  vP=position.xz;
  vec3 p=position;
  p.y+=snowHeight(vP)*snowCover(seasonMix(vP));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`,fragmentShader:`
uniform float uCycle;
varying vec2 vP;
${seasonsGLSL}
${handGLSL}
vec3 snowColor(vec2 p,float h){
  vec2 slope=vec2(snowHeight(p+vec2(.025,0))-h,snowHeight(p+vec2(0,.025))-h)/.025;
  float lit=dot(normalize(vec3(-slope.x,1.,-slope.y)),normalize(vec3(-.5,1.,-.3)));
  vec3 c=mix(vec3(.43,.53,.69),vec3(.86,.90,1.),lit*.75+noise(p*30.)*.08);
  ${granularSnow ? `
  float footprint=length(fwidth(p));
  float powder=(noise(p*55.)-.5)*(1.-smoothstep(.45,1.4,footprint*55.));
  float grains=(noise(p*105.+vec2(3.2,8.1))-.5)*(1.-smoothstep(.45,1.4,footprint*105.));
  return clamp(c+vec3(.090*powder+.081*grains),0.,1.);
  ` : 'return c+pow(hash(floor(p*200.)),40.)*.11;'}
}
void main(){
  vec3 season=seasonMix(vP);
  float snow=snowCover(season);
  float h=snowHeight(vP);
  vec3 ground=mix(palette(season.x),palette(season.y),season.z)*(.26+noise(vP*45.)*.10);
  vec3 c=mix(ground,snowColor(vP,h),snow);
  if(length(vP)>5.)discard;
  gl_FragColor=vec4(c*handShade(vP,h*snow-.021),1.);
}`});
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
uniform float uTime,uCycle;
attribute vec3 root,spec;
varying float vH,vN,vWinter,vShade;
varying vec3 vGrassColor;
varying vec2 vRoot;
${seasonsGLSL}
${handGLSL}
void main(){
  vec3 season=seasonMix(root.xz);
  float winter=snowCover(season);
  vH=position.y;vN=spec.z;vRoot=root.xz;vWinter=winter;
  // Keep the grass hue consistent as the blades recede into the snow.
  vec3 before=palette(season.x>2.5?season.y:season.x);
  vec3 after=palette(season.y>2.5?season.x:season.y);
  vGrassColor=mix(before,after,season.z);
  float height=mix(spec.x,.003+spec.z*.006,winter);
  float base=winter*(snowHeight(root.xz)-.02);
  float bend=sin(uTime*1.5+root.x*1.6+root.z*.7)*.020+sin(uTime*.8+root.z*2.)*.012;
  vec3 p=root+vec3(position.x*.014*cos(spec.y),position.y*height+base,position.x*.014*sin(spec.y));
  float tip=position.y*position.y;
  p.xz+=vec2(cos(spec.y)*.045+bend,sin(spec.y)*.032+bend*.7)*tip*(1.-winter);
  ${seasonStill ? '' : `
  vec2 local=handLocal(root.xz);
  float across=abs(local.y);
  float reach=smoothstep(.85,1.05,local.x)*(1.-smoothstep(4.65,4.95,local.x));
  float parting=reach*(1.-smoothstep(.035,.32,across));
  vec2 sideways=vec2(-uHandDirection.y,uHandDirection.x)*(2.*smoothstep(-.045,.045,local.y)-1.);
  p.xz+=sideways*.13*parting*tip*(1.-winter);
  p.y-=height*.46*parting*tip*(1.-winter);
  `}
  vShade=handShade(p.xz,min(p.y,.21));
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`,fragmentShader:`
uniform float uCycle;
uniform vec2 uCatA,uCatB;
varying float vH,vN,vWinter,vShade;
varying vec3 vGrassColor;
varying vec2 vRoot;
${seasonsGLSL}
void main(){
  vec3 grass=vGrassColor*mix(.25,1.50,pow(vH,.70))*(.62+vN*.72)*(.8+noise(vRoot*2.)*.32);
  vec3 snow=vec3(.76,.82,.94)*(.88+vH*.12+vN*.10);
  vec3 c=mix(grass,snow,vWinter);
  float d=min(length(vRoot-uCatA),length(vRoot-uCatB));
  c*=mix(.38,1.,smoothstep(.08,.42,d))*vShade;
  gl_FragColor=vec4(c,1.);
}` }));grass.frustumCulled=false;world.add(grass);

const hub=new T.Mesh(new T.CylinderGeometry(.88,.88,.065,96),new T.MeshStandardMaterial({color:0x030508,roughness:.54,metalness:.55}));hub.position.y=.045;hub.receiveShadow=true;world.add(hub);ring(.87,.015,0xafa475,.085);ring(.63,.009,0x5c6150,.083);
const hand=new T.Group();hand.position.y=.22;world.add(hand);hand.visible=!(summerStill||winterStill);
const gold=new T.MeshStandardMaterial({color:0xe7d290,metalness:.65,roughness:.4});
const stem=new T.Mesh(new T.CylinderGeometry(.016,.016,3.82,8),gold);stem.rotation.z=-Math.PI/2;stem.position.x=2.73;hand.add(stem);
const wheat=new T.Group();wheat.position.x=4.38;hand.add(wheat);
for(let i=0;i<9;i++){for(const side of [-1,1]){const grain=new T.Mesh(new T.SphereGeometry(1,8,6),gold);grain.scale.set(.115,.022,.045);grain.position.set((i-4)*.055,0,side*.042);grain.rotation.y=side*-.65;wheat.add(grain);}}
for(let i=0;i<5;i++){const hair=new T.Mesh(new T.CylinderGeometry(.002,.002,.28,4),gold);hair.rotation.z=-Math.PI/2;hair.rotation.y=(i-2)*.08;hair.position.set(.28,0,(i-2)*.018);wheat.add(hair);}
hand.traverse(o=>{if(o.isMesh)o.castShadow=true;});

function herringboneTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=128;
  const context=canvas.getContext('2d');
  const pixels=context.createImageData(canvas.width,canvas.height);
  for(let y=0;y<canvas.height;y++){
    for(let x=0;x<canvas.width;x++){
      const column=x%64;
      const stagger=(Math.floor(x/64)%2)*8;
      const slope=column<32 ? column : 63-column;
      const yarn=.5+.5*Math.cos((y+slope*.75+stagger)*TAU/16);
      const fiber=.5+.5*Math.sin(x*2.1+y*.7);
      const shade=145+91*yarn**.7+12*fiber;
      const i=(y*canvas.width+x)*4;
      pixels.data.set([shade,shade,shade,255],i);
    }
  }
  context.putImageData(pixels,0,0);
  const texture=new T.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const scarfWeave=herringboneTexture();

function winterScarf(dark, outside){
  const group=new T.Group();
  group.name=dark?'White winter scarf':'Red winter scarf';
  group.visible=false;
  const color=dark?0xfff1dc:0xc3283d;
  const wool=new T.MeshStandardMaterial({
    color,map:scarfWeave,bumpMap:scarfWeave,bumpScale:.0035,
    roughness:.95,transparent:true,side:T.DoubleSide,
  });
  const trim=new T.MeshStandardMaterial({
    color:new T.Color(color).multiplyScalar(.82),roughness:.92,transparent:true,
  });

  // A single padded band with turned edges follows the neck.
  const bandGeometry=new T.TorusGeometry(.112,.013,20,80);
  const bandUV=bandGeometry.attributes.uv;
  const bandPoints=bandGeometry.attributes.position;
  // Fill out the inside of the wrap so the back rests against the coat.
  for(let i=0;i<bandUV.count;i++){
    bandUV.setX(i,bandUV.getX(i)*10);
    const x=bandPoints.getX(i), y=bandPoints.getY(i);
    const radius=Math.hypot(x,y);
    const innerFill=Math.max(0,.112-radius)*2;
    const fit=1-innerFill/radius;
    bandPoints.setXYZ(i,x*fit,y*fit,bandPoints.getZ(i));
  }
  bandGeometry.computeVertexNormals();
  const band=new T.Mesh(bandGeometry,wool);
  band.rotation.x=Math.PI/2;
  band.scale.set(.90,1.14,2.35);
  band.position.set(0,.418,.025);
  group.add(band);
  const edgeGeometry=new T.TorusGeometry(.116,.0045,8,72);
  for(const offset of [-.023,.023]){
    const edge=new T.Mesh(edgeGeometry,trim);
    edge.rotation.x=Math.PI/2;
    edge.scale.set(.90,1.14,1);
    edge.position.copy(band.position);
    edge.position.y+=offset;
    group.add(edge);
  }

  // The woven end widens as it drapes and finishes with a rolled hem.
  const end=new T.Group();
  end.position.set(outside*.043,.426,-.087);
  function drape(across,down){
    const width=T.MathUtils.lerp(.021,.039,T.MathUtils.smoothstep(down,0,.65));
    return new T.Vector3(
      outside*.035*down+across*width,
      -.111*down+.011*across*outside*down,
      -.089*down+.009*across**2+.006*Math.sin(Math.PI*down),
    );
  }
  const clothGeometry=new T.PlaneGeometry(1,1,12,20);
  const clothPoints=clothGeometry.attributes.position;
  clothPoints.setUsage(T.DynamicDrawUsage);
  const clothUV=clothGeometry.attributes.uv;
  for(let i=0;i<clothPoints.count;i++){
    const across=clothUV.getX(i)*2-1;
    const down=1-clothUV.getY(i);
    const point=drape(across,down);
    clothPoints.setXYZ(i,point.x,point.y,point.z);
    clothUV.setY(i,clothUV.getY(i)*2);
  }
  clothGeometry.computeVertexNormals();
  const cloth=new T.Mesh(clothGeometry,wool);
  cloth.frustumCulled=false;
  end.add(cloth);
  const hemCurve=new T.CatmullRomCurve3([-1,-.5,0,.5,1].map(across=>drape(across,1)));
  const hem=new T.Mesh(new T.TubeGeometry(hemCurve,16,.0045,8,false),trim);
  end.add(hem);
  group.add(end);
  return {group,wool,trim,clothGeometry,restPoints:clothPoints.clone(),hem};
}

function summerHat(){
  const hat=new T.Group();
  hat.visible=false;
  hat.position.set(0,.087,-.009);
  hat.rotation.set(.035,0,-.035);
  const straw=new T.MeshStandardMaterial({color:0xe5ba78,roughness:.95,transparent:true,side:T.DoubleSide});
  const ribbon=new T.MeshStandardMaterial({color:0x69836b,roughness:.88,transparent:true});
  const profile=[
    [0,.005],[.126,.004],[.154,0],[.170,.004],[.173,.010],
    [.168,.016],[.134,.018],[.132,.030],[.128,.104],
    [.122,.124],[.107,.136],[.083,.140],[0,.140],
  ].map(([radius,height])=>new T.Vector2(radius,height));
  hat.add(new T.Mesh(new T.LatheGeometry(profile,48),straw));
  const band=new T.Mesh(new T.CylinderGeometry(.132,.134,.020,48,1,true),ribbon);
  band.position.y=.030;
  hat.add(band);
  return hat;
}

function updateWinterScarves(time,cycle){
  // Shift the cycle so the autumn–winter midpoint starts at zero.
  const progress=T.MathUtils.euclideanModulo(cycle-3.5,4);
  const opacity=T.MathUtils.smoothstep(progress,0,.12)*
    (1-T.MathUtils.smoothstep(progress,.87,1));
  cats.forEach(({scarf},index)=>{
    scarf.group.visible=opacity>0;
    if(!scarf.group.visible)return;
    scarf.wool.opacity=scarf.trim.opacity=opacity;

    const {clothGeometry,restPoints,hem}=scarf;
    const {position,uv}=clothGeometry.attributes;
    for(let i=0;i<position.count;i++){
      const down=1-uv.getY(i)/2;
      const phase=time*4.2-down*4.8+index*.9;
      const bend=down**2;
      const sway=.021*bend*Math.sin(phase*.78);
      const lift=.024*bend*(.5+.5*Math.sin(phase));
      const billow=-.022*bend*(.55+.45*Math.cos(phase));
      position.setXYZ(i,restPoints.getX(i)+sway,restPoints.getY(i)+lift,restPoints.getZ(i)+billow);
      if(i===position.count-1)hem.position.set(sway,lift,billow);
    }
    position.needsUpdate=true;
    clothGeometry.computeVertexNormals();
  });
}

function cat(dark){
  const group=new T.Group(),body=new T.Group();
  group.add(body);
  const glow=new T.Color(dark?0x86aaff:0x81fff0);
  const isFur=catStyle==='fur';
  const isGlass=catStyle==='glass';
  const coat=new T.MeshStandardMaterial({
    color:isFur ? (dark?0x343b67:0xe2ddd2) : isGlass ? (dark?0x333c83:0xc4d7e8) : (dark?0x404660:0xc6d5cb),
    emissive:dark?0x45428f:0x449f91,
    emissiveIntensity:isFur?.07:.22,
    roughness:isFur?.88:isGlass?.26:.64,
    transparent:isGlass,
    depthWrite:!isGlass,
  });
  coat.onBeforeCompile=shader=>{
    shader.uniforms.spiritGlow={value:glow};
    if(isFur||isGlass){
      shader.vertexShader='varying vec3 vCoatPoint;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvCoatPoint=(modelMatrix * vec4(position,1.0)).xyz;');
    }
    shader.fragmentShader='uniform vec3 spiritGlow;\n'+
      (isFur||isGlass ? 'varying vec3 vCoatPoint;\n' : '')+shader.fragmentShader;
    const finish=isFur ? `
      vec3 p=vCoatPoint;
      float fiber=sin(p.x*960.0 + p.z*710.0 + sin(p.y*39.0+p.z*20.0)*2.4);
      float strands=.5+.5*fiber;
      outgoingLight *= .86+.19*strands+.06*sin(p.y*43.0+p.x*52.0);
      outgoingLight+=spiritGlow*spiritRim*(.12+.14*strands);
    ` : isGlass ? `
      vec3 p=vCoatPoint;
      vec3 cell=floor(p*70.0);
      float seed=fract(sin(dot(cell,vec3(17.13,71.31,13.17)))*43758.5453);
      float star=step(.963,seed)*(1.0-smoothstep(.08,.37,length(fract(p*70.0)-.5)));
      float flow=abs(sin(p.y*34.0+p.x*23.0+p.z*11.0+sin(p.y*16.0+p.z*6.0)*1.3));
      float vein=1.0-smoothstep(.035,.13,flow);
      vec3 warm=vec3(1.0,.71,.38);
      outgoingLight+=spiritGlow*(.14+spiritRim*.81)+warm*(vein*.24+star*1.6);
      diffuseColor.a=.53+.39*spiritRim+.08*max(vein,star);
    ` : 'outgoingLight+=spiritGlow*(.04+spiritRim*.27);';
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float spiritRim=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),2.4);
      ${finish}
      #include <opaque_fragment>
    `);
  };
  const innerEar=new T.MeshStandardMaterial({color:dark?0x5a5286:0x579b98,roughness:.8});
  const eyeLight=new T.MeshStandardMaterial({color:dark?0xa7b7a8:0x526e63,roughness:.7});
  const nose=new T.MeshStandardMaterial({color:dark?0x252039:0x345b63,roughness:.8});
  const sphere=new T.SphereGeometry(1,20,14);
  function ellipsoid(parent,x,y,z,sx,sy,sz,material=coat){
    const mesh=new T.Mesh(sphere,material);
    mesh.position.set(x,y,z);
    mesh.scale.set(sx,sy,sz);
    mesh.castShadow=material===coat;
    parent.add(mesh);
    return mesh;
  }

  // The shoulder, waist and haunch share one smooth surface.
  const profile=[
    [-.246,.149,.005,.006],[-.203,.155,.102,.110],[-.139,.180,.127,.151],
    [-.076,.248,.116,.211],[.002,.267,.106,.218],[.077,.289,.101,.186],
    [.130,.307,.085,.131],[.179,.318,.047,.075],[.202,.327,.004,.005],
  ];
  const widthCurve=new T.CatmullRomCurve3(profile.map(([z,y,w])=>new T.Vector3(w,y,z)),false,'catmullrom');
  const heightCurve=new T.CatmullRomCurve3(profile.map(([z,y,w,h])=>new T.Vector3(h,y,z)),false,'catmullrom');
  const torsoGeometry=new T.BufferGeometry();
  const torsoVertices=[],torsoIndices=[];
  const rings=40,sides=20;
  for(let ring=0;ring<=rings;ring++){
    const {x:width,y,z}=widthCurve.getPoint(ring/rings);
    const height=heightCurve.getPoint(ring/rings).x;
    for(let side=0;side<sides;side++){
      const angle=side/sides*Math.PI*2;
      torsoVertices.push(width*(isFur?1.07:isGlass?.96:1)*Math.cos(angle),y+height*Math.sin(angle),z);
      if(ring<rings){
        const a=ring*sides+side,b=ring*sides+(side+1)%sides;
        torsoIndices.push(a,b,a+sides,b,b+sides,a+sides);
      }
    }
  }
  torsoGeometry.setAttribute('position',new T.Float32BufferAttribute(torsoVertices,3));
  torsoGeometry.setIndex(torsoIndices);
  torsoGeometry.computeVertexNormals();
  const torso=new T.Mesh(torsoGeometry,coat);
  torso.castShadow=true;
  body.add(torso);

  const head=new T.Group();
  head.position.set(0,.480,.095);
  head.rotation.x=-.095;
  body.add(head);
  ellipsoid(head,0,0,0,.127,.112,.113);
  ellipsoid(head,0,-.039,.060,.105,.071,.064);
  // The muzzle stays short, with a small nose set between the cheeks.
  ellipsoid(head,0,-.040,.112,.030,.015,.014,nose);
  const earShape=new T.Shape();
  earShape.moveTo(-.053,0);
  earShape.quadraticCurveTo(-.057,.065,-.006,.127);
  earShape.quadraticCurveTo(.002,.137,.010,.126);
  earShape.quadraticCurveTo(.041,.083,.051,.004);
  earShape.quadraticCurveTo(0,-.014,-.053,0);
  const earGeometry=new T.ExtrudeGeometry(earShape,{
    depth:.030,steps:1,curveSegments:8,bevelEnabled:true,
    bevelSegments:2,bevelSize:.008,bevelThickness:.008,
  });
  const insetGeometry=new T.ShapeGeometry(earShape,8);
  for(const side of [-1,1]){
    const ear=new T.Group();
    ear.position.set(side*.080,.065,-.016);
    ear.rotation.z=-side*.20;
    if(isGlass)ear.scale.set(.94,1.07,.94);
    head.add(ear);
    const shell=new T.Mesh(earGeometry,coat);
    shell.castShadow=true;
    ear.add(shell);
    const inset=new T.Mesh(insetGeometry,innerEar);
    inset.position.set(0,.015,.039);
    inset.scale.set(.67,.73,1);
    ear.add(inset);
    const eye=new T.Group();
    eye.position.set(side*.071,.019,.086);
    eye.rotation.set(0,side*.45,side*.25);
    head.add(eye);
    ellipsoid(eye,0,0,0,.033,.015,.010,eyeLight);
    ellipsoid(eye,0,0,.009,.005,.012,.003,nose);
    eye.scale.y=.72;
  }

  // Seated haunches and two straight forelegs carry the pose.
  for(const side of [-1,1]){
    ellipsoid(body,side*.085,.116,-.092,.082,.115,.125).rotation.x=.30;
    ellipsoid(body,side*.102,.037,.044,.049,.037,.079);
    ellipsoid(body,side*.063,.147,.133,.035,.137,.041).rotation.x=.08;
    ellipsoid(body,side*.063,.030,.159,.042,.030,.060);
  }
  const outside=dark?1:-1;
  const curl=new T.CatmullRomCurve3([
    new T.Vector3(0,.099,-.207),
    new T.Vector3(outside*.121,.045,-.255),
    new T.Vector3(outside*.239,.033,-.188),
    new T.Vector3(outside*.259,.031,-.071),
    new T.Vector3(outside*.219,.031,.034),
    new T.Vector3(outside*.174,.035,.068),
  ]);
  const tailGeometry=new T.TubeGeometry(curl,28,isFur?.035:.028,9,false);
  const positions=tailGeometry.attributes.position;
  const point=new T.Vector3();
  for(let ring=0;ring<=28;ring++){
    const fraction=ring/28;
    const center=curl.getPointAt(fraction);
    const taper=1-.94*fraction**1.3;
    for(let side=0;side<=9;side++){
      const vertex=ring*10+side;
      point.fromBufferAttribute(positions,vertex).sub(center).multiplyScalar(taper).add(center);
      positions.setXYZ(vertex,point.x,point.y,point.z);
    }
  }
  tailGeometry.computeVertexNormals();
  const tail=new T.Mesh(tailGeometry,coat);
  tail.castShadow=true;
  body.add(tail);

  group.scale.setScalar(.84);
  group.position.set(dark?.84:.52,.040,2.4);
  group.rotation.y=Math.PI-.24;
  head.rotation.y=dark?-.11:.08;
  world.add(group);
  const scarf=winterScarf(dark,outside);
  body.add(scarf.group);
  return {group,head,scarf,restYaw:head.rotation.y};
}
function createBench(){
  const bench=new T.Group();
  bench.name='Walnut garden bench';
  bench.position.set(-2.80,.005,-2.25);
  bench.rotation.y=Math.atan2(bench.position.x,bench.position.z);
  world.add(bench);

  const walnut=new T.MeshStandardMaterial({color:0x54301e,roughness:.79});
  const warmEdge=new T.MeshStandardMaterial({color:0x9f6238,roughness:.76});
  const iron=new T.MeshStandardMaterial({color:0x2e3534,metalness:.55,roughness:.61});
  const snow=new T.MeshStandardMaterial({
    color:0xe5efff,roughness:.95,transparent:true,depthWrite:false,
  });
  const snowCaps=new T.Group();
  snowCaps.visible=false;
  bench.add(snowCaps);

  function plank(parent,material,x,y,z,width,height,depth){
    const mesh=new T.Mesh(new T.BoxGeometry(width,height,depth),material);
    mesh.position.set(x,y,z);
    mesh.castShadow=material!==snow;
    parent.add(mesh);
    return mesh;
  }

  for(const z of [-.129,-.043,.043,.129]){
    plank(bench,walnut,0,.255,z,1.16,.038,.075);
    plank(bench,warmEdge,0,.270,z+.034,1.15,.008,.008);
    plank(snowCaps,snow,0,.276,z,1.12,.009,.066);
  }
  for(const y of [.389,.481]){
    plank(bench,walnut,0,y,-.174,1.16,.077,.039);
    plank(bench,warmEdge,0,y+.035,-.153,1.15,.008,.006);
  }
  plank(snowCaps,snow,0,.524,-.174,1.12,.010,.033);
  for(const x of [-.46,.46]){
    plank(bench,iron,x,.110,.117,.049,.271,.049);
    plank(bench,iron,x,.239,-.147,.049,.528,.049).rotation.x=-.10;
    plank(bench,iron,x,.224,0,.056,.034,.349);
  }
  return {bench,snowCaps,snow};
}

const gardenBench=createBench();
const benchAngle=T.MathUtils.euclideanModulo(
  Math.atan2(gardenBench.bench.position.z,gardenBench.bench.position.x)/TAU,1,
);
function createBenchFigures(){
  const scarecrow=new T.Group(), snowman=new T.Group();
  const sphere=new T.SphereGeometry(1,20,14);
  const paint=color=>new T.MeshStandardMaterial({color,roughness:.94,transparent:true});
  const twig=paint(0x533b2d), straw=paint(0xbf9b5e), coat=paint(0x796955);
  const blue=paint(0x415d79), rust=paint(0xa45232);
  const snow=paint(0xe1ecf3), charcoal=paint(0x373a42), carrot=paint(0xa97142);
  function part(parent,geometry,material,x,y,z){
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(x,y,z);
    parent.add(mesh);
    return mesh;
  }
  function ball(parent,material,x,y,z,sx,sy,sz){
    const mesh=part(parent,sphere,material,x,y,z);
    mesh.scale.set(sx,sy,sz);
    return mesh;
  }
  function stick(parent,material,from,to,radius){
    const start=new T.Vector3(...from), finish=new T.Vector3(...to);
    const direction=finish.clone().sub(start);
    const center=start.lerp(finish,.5);
    const mesh=part(parent,new T.CylinderGeometry(radius*.65,radius,direction.length(),7),
      material,center.x,center.y,center.z);
    mesh.quaternion.setFromUnitVectors(T.Object3D.DEFAULT_UP,direction.normalize());
  }

  // Autumn: a linen smock, exposed straw cuffs, and a weathered blue hat.
  stick(scarecrow,twig,[0,-.035,0],[0,.51,0],.014);
  part(scarecrow,new T.CylinderGeometry(.067,.102,.204,12),coat,0,.337,0);
  for(const side of [-1,1]){
    stick(scarecrow,coat,[side*.047,.413,0],[side*.185,.386,0],.038);
    for(let i=0;i<4;i++){
      stick(scarecrow,straw,[side*.174,.386,0],
        [side*(.213+i*.007),.370+i*.012,.007],.0036);
    }
  }
  ball(scarecrow,straw,0,.487,0,.071,.080,.064);
  part(scarecrow,new T.CylinderGeometry(.078,.074,.030,18),rust,0,.431,0);
  const scarfTail=part(scarecrow,new T.BoxGeometry(.041,.093,.014),rust,.052,.389,.065);
  scarfTail.rotation.z=.24;
  part(scarecrow,new T.CylinderGeometry(.105,.110,.018,24),blue,0,.549,0).rotation.z=.08;
  part(scarecrow,new T.CylinderGeometry(.054,.071,.047,20),blue,-.004,.576,0).rotation.z=.08;

  // Winter: two small snowballs, pebble features, and a soft charcoal cap.
  ball(snowman,snow,0,.137,0,.151,.151,.144);
  ball(snowman,snow,0,.335,0,.109,.111,.104);
  ball(snowman,charcoal,-.012,.438,0,.089,.047,.083).rotation.z=.14;
  for(const side of [-1,1]){
    ball(snowman,charcoal,side*.035,.356,.095,.009,.009,.007);
    stick(snowman,twig,[side*.11,.198,0],[side*.207,.309,.004],.008);
    stick(snowman,twig,[side*.171,.271,.003],[side*.175,.325,.019],.004);
  }
  const nose=part(snowman,new T.ConeGeometry(.012,.036,9),carrot,0,.332,.111);
  nose.rotation.x=Math.PI/2;
  for(const y of [.138,.202])ball(snowman,charcoal,0,y,.136,.010,.010,.008);

  const scarfColors=[paint(0xa92e48),paint(0xe6aa42),paint(0x307b86)];
  const scarfRow=new T.TorusGeometry(.097,.016,10,36);
  scarfColors.forEach((color,index)=>{
    const wrap=part(snowman,scarfRow,color,0,.272+index*.016,0);
    wrap.rotation.x=Math.PI/2;
  });
  const scarfTailGeometry=new T.BoxGeometry(.067,.041,.018);
  scarfColors.forEach((color,index)=>{
    const tail=part(snowman,scarfTailGeometry,color,.062+index*.010,.255-index*.037,.109+index*.006);
    tail.rotation.z=.26;
  });

  const bench=gardenBench.bench;
  // The bench's positive local X axis points toward screen left.
  const leftEnd=bench.localToWorld(new T.Vector3(.98,0,0));
  scarecrow.position.set(leftEnd.x,.015,leftEnd.z);
  scarecrow.scale.setScalar(1.30);
  snowman.position.set(leftEnd.x,.054,leftEnd.z);
  snowman.scale.setScalar(1.38);
  scarecrow.rotation.y=snowman.rotation.y=.28;
  scarecrow.visible=snowman.visible=false;
  world.add(scarecrow,snowman);
  return {scarecrow,snowman};
}

const benchFigures=createBenchFigures();
const seasonalBenchFigures=[[benchFigures.scarecrow,2],[benchFigures.snowman,3]].map(([figure,start])=>{
  const {x,z}=figure.position;
  const angle=T.MathUtils.euclideanModulo(Math.atan2(z,x)/TAU,1);
  return {figure,start,angle};
});

const cats=[cat(false),cat(true)];
const whiteCatHat=summerHat();
cats[0].head.add(whiteCatHat);
uniforms.uCatA.value.set(cats[0].group.position.x,cats[0].group.position.z);
uniforms.uCatB.value.set(cats[1].group.position.x,cats[1].group.position.z);
const secondsPerSeason=15;
const nuzzleInterval=12;
function updateNuzzle(time){
  // A single small rub, with a long rest between greetings.
  const phase=((time-4)%nuzzleInterval+nuzzleInterval)%nuzzleInterval;
  const lean=T.MathUtils.smoothstep(phase,0,.85)*(1-T.MathUtils.smoothstep(phase,1.55,2.55));
  const brush=Math.sin(T.MathUtils.clamp((phase-.8)/.85,0,1)*Math.PI)*lean;
  cats.forEach(({head,restYaw},index)=>{
    const inward=index===0?-1:1;
    head.position.x=inward*(springStill ? .041 : .037)*lean;
    head.position.y=.480+(index===0?.018:-.010)*brush;
    head.rotation.y=restYaw+inward*.11*lean;
    head.rotation.z=-inward*.065*lean;
  });
}
const seasonalTree=createSeasonalTree(world,rnd);
const meadowGarden=createMeadowGarden(world,rnd,springStill ? uniforms.uTime : null,benchFigures.snowman);

const effects=createSeasonalEffects({world,scene,camera,uniforms,random:rnd,springStill,summerStill,winterStill});

const starsPos=new Float32Array(2600*3),starsColor=new Float32Array(2600*3);for(let i=0;i<2600;i++){let a=rnd()*TAU,y=rnd()*2-1,r=32;starsPos.set([Math.cos(a)*Math.sqrt(1-y*y)*r,y*r,Math.sin(a)*Math.sqrt(1-y*y)*r],i*3);const b=.15+rnd()*.6;starsColor.set([b*.8,b*.9,b],i*3);}const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(starsPos,3));sg.setAttribute('color',new T.BufferAttribute(starsColor,3));scene.add(new T.Points(sg,new T.PointsMaterial({size:.025,vertexColors:true,transparent:true,opacity:.75,depthWrite:false})));
const nebulaCanvas=document.createElement('canvas');nebulaCanvas.width=1024;nebulaCanvas.height=512;const ctx=nebulaCanvas.getContext('2d');
for(let i=0;i<130;i++){const x=rnd()*1024,y=260+Math.sin(x/170)*35+(rnd()-.5)*95,r=25+rnd()*100;let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(75,94,126,${.025+rnd()*.045})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
const nebula=new T.Mesh(new T.PlaneGeometry(60,30),new T.MeshBasicMaterial({map:new T.CanvasTexture(nebulaCanvas),transparent:true,opacity:1.1,depthWrite:false,blending:T.AdditiveBlending}));nebula.position.set(0,2,-17);nebula.rotation.z=.14;scene.add(nebula);

let capturing=false;
const springCycle=1;
const springOpeningSeconds=1.5;
let azimuth=0,elevation=.63,distance=14.5,playing=true,speed=1,cycle=fixedCycle ?? springCycle,elapsed=0,last=performance.now(),pointer=null;
function view(){camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(0,-.65,0);}
function fitBackground(){const texture=scene.background;if(!texture?.image)return;const aspect=camera.aspect;const imageAspect=texture.image.width/texture.image.height;texture.repeat.set(Math.min(1,aspect/imageAspect),Math.min(1,imageAspect/aspect));texture.offset.set((1-texture.repeat.x)/2,(1-texture.repeat.y)/2);texture.needsUpdate=true;}
function resize(){if(capturing)return;renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1.2?T.MathUtils.radToDeg(2*Math.atan(5.8/(distance*camera.aspect))):wideCameraFov;camera.updateProjectionMatrix();view();fitBackground();}addEventListener('resize',resize);resize();
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!pointer)return;azimuth-=(e.clientX-pointer.x)*.006;elevation=T.MathUtils.clamp(elevation+(e.clientY-pointer.y)*.004,.18,1.45);pointer={x:e.clientX,y:e.clientY};view();});canvas.addEventListener('pointerup',()=>pointer=null);canvas.addEventListener('pointercancel',()=>pointer=null);canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.015,11,28);view();},{passive:false});
const play=document.querySelector('#play'),timeline=document.querySelector('#timeline'),names=['Spring','Summer','Autumn','Winter'];
document.querySelector('#reference').onclick=()=>document.querySelector('#reference-dialog').showModal();document.querySelector('#close-reference').onclick=()=>document.querySelector('#reference-dialog').close();
function toggle(){playing=!playing;play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Pause':'Play');}play.onclick=toggle;
let seasonTransition=null;
function selectSeason(target){
  if(seasonStill)return;
  const offset=((target-cycle+2)%4+4)%4-2;
  seasonTransition={from:cycle,to:cycle+offset,start:performance.now()};
}
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>selectSeason(Number(b.dataset.season)+1));
timeline.disabled=seasonStill;
if(seasonStill)document.querySelectorAll('[data-season]').forEach(button=>{button.disabled=true;});
timeline.oninput=()=>{seasonTransition=null;cycle=+timeline.value;};document.querySelector('#speed').onclick=e=>{speed=speed===1?2:speed===2?.5:1;e.target.textContent=speed+'×';};
document.querySelector('#reset').onclick=()=>{azimuth=0;elevation=.63;distance=14.5;view();};document.querySelector('#full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='Space'){e.preventDefault();toggle();}if(e.key.toLowerCase()==='h')document.body.classList.toggle('clean');if('1234'.includes(e.key)&&e.key.length===1)selectSeason(Number(e.key));});
if(new URLSearchParams(location.search).has('clean'))document.body.classList.add('clean');
function renderFrame(time,seasonCycle){
  if(seasonStill)seasonCycle=fixedCycle;
  uniforms.uTime.value=time;uniforms.uCycle.value=seasonCycle;uniforms.uPixelRatio.value=renderer.getPixelRatio();
  updateNuzzle(springStill ? 5.22 : time);
  updateWinterScarves(time,seasonCycle);
  const benchSeason=T.MathUtils.euclideanModulo(seasonCycle-benchAngle,4);
  const benchSnow=T.MathUtils.smoothstep(benchSeason,3,3.12)*
    (1-T.MathUtils.smoothstep(benchSeason,3.88,4));
  gardenBench.snowCaps.visible=benchSnow>0;
  gardenBench.snow.opacity=benchSnow;
  for(const {figure,start,angle} of seasonalBenchFigures){
    const figureSeason=T.MathUtils.euclideanModulo(seasonCycle-angle,4);
    const opacity=T.MathUtils.smoothstep(figureSeason,start,start+.10)*
      (1-T.MathUtils.smoothstep(figureSeason,start+.90,start+1));
    figure.visible=opacity>0;
    if(figure.visible){
      for(const mesh of figure.children)mesh.material.opacity=opacity;
    }
  }
  const summerProgress=T.MathUtils.euclideanModulo(seasonCycle-1.5,4);
  const hatOpacity=T.MathUtils.smoothstep(summerProgress,0,.12)*
    (1-T.MathUtils.smoothstep(summerProgress,.88,1));
  whiteCatHat.visible=hatOpacity>0;
  whiteCatHat.children.forEach(mesh=>{mesh.material.opacity=hatOpacity;});
  const handAngle=(seasonCycle%1)*TAU;
  hand.rotation.y=-handAngle;
  uniforms.uHandDirection.value.set(Math.cos(handAngle),Math.sin(handAngle));
  const weights=seasonalTree.update(time,seasonCycle);meadowGarden.update(time,weights,seasonCycle);effects.update(time, seasonTransition && seasonTransition.to < seasonTransition.from ? -1 : 1);
  renderer.render(scene,camera);
}
function animate(now){
  requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
  if(capturing||document.body.classList.contains('art-mode')||document.hidden)return;
  if(playing)elapsed+=dt*speed;
  if(seasonTransition){
    const {from,to,start}=seasonTransition;
    const progress=T.MathUtils.smoothstep(now-start,0,1500);
    cycle=((T.MathUtils.lerp(from,to,progress)%4)+4)%4;
    if(progress===1)seasonTransition=null;
  }else if(playing && !seasonStill && (cycle!==springCycle || elapsed>=springOpeningSeconds)){
    cycle+=dt*speed/secondsPerSeason;
  }
  renderFrame(elapsed,cycle);
  timeline.value=((cycle%4)+4)%4;
  const current=((Math.floor(cycle)-(cycle%1>.5?0:1))%4+4)%4;
  document.querySelector('#time').textContent=names[current];
  document.querySelectorAll('[data-season]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
}
const api={scene,camera,renderer,effects,
  get cycle(){return cycle},set cycle(value){seasonTransition=null;cycle=fixedCycle ?? value},
  get playing(){return playing},set playing(value){if(playing!==value)toggle();},
  async prepareCapture(width,height){
    capturing=true;renderer.setPixelRatio(1);renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.fov=camera.aspect<1.2?T.MathUtils.radToDeg(2*Math.atan(5.8/(distance*camera.aspect))):wideCameraFov;
    camera.updateProjectionMatrix();view();fitBackground();
    await Promise.all([new Promise((resolve,reject)=>{const started=performance.now();const check=()=>{if(effects.resources.loaded===effects.resources.expected)return resolve();if(effects.resources.failed.length||performance.now()-started>15000)return reject(new Error('The scene textures could not load. Please try again.'));setTimeout(check,100);};check();}),new Promise(resolve=>setTimeout(resolve,300))]);
  },
  renderAt:renderFrame,
  endCapture(){capturing=false;renderer.setPixelRatio(Math.min(devicePixelRatio,2));resize();last=performance.now();},
};
window.seasonDial=api;
installWallpaper(api);
requestAnimationFrame(animate);
