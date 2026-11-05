import * as T from './vendor/three.module.js';

const winterFlightStart = 1 / 3;

function createParkedSleigh(world, secondsPerSeason) {
  const sleigh = new T.Group();
  sleigh.name = 'Parked Christmas sleigh';
  sleigh.position.set(-2.72, .077, 2.65);
  sleigh.rotation.y = .55;
  sleigh.scale.setScalar(1.36);
  sleigh.visible = false;
  world.add(sleigh);

  const lacquer = new T.MeshStandardMaterial({color:0xce2438, roughness:.46, transparent:true});
  const brass = new T.MeshStandardMaterial({color:0xffcd70, metalness:.48, roughness:.28, transparent:true});
  const velvet = new T.MeshStandardMaterial({color:0xa42b46, roughness:.94, transparent:true});
  const emerald = new T.MeshStandardMaterial({color:0x188963, roughness:.58, transparent:true});
  const ivory = new T.MeshStandardMaterial({color:0xffe3a1, roughness:.60, transparent:true});
  const lanternGlass = new T.MeshStandardMaterial({
    color:0xffcf82, emissive:0xffad52, emissiveIntensity:1.5, roughness:.38, transparent:true,
  });
  const paints=[lacquer,brass,velvet,emerald,ivory,lanternGlass];
  function add(geometry, material, x=0, y=0, z=0) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x,y,z);
    sleigh.add(mesh);
    return mesh;
  }
  function rail(points, z, radius) {
    const curve = new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,z)));
    add(new T.TubeGeometry(curve,24,radius,6,false),brass);
  }
  const shell = new T.Shape();
  shell.moveTo(-.39,.40);
  shell.bezierCurveTo(-.24,.42,-.21,.25,.04,.24);
  shell.quadraticCurveTo(.24,.23,.37,.29);
  shell.quadraticCurveTo(.36,.13,.23,.115);
  shell.lineTo(-.23,.115);
  shell.quadraticCurveTo(-.36,.13,-.39,.40);
  const panel = new T.ExtrudeGeometry(shell,{
    depth:.023,bevelEnabled:true,bevelSize:.012,bevelThickness:.010,bevelSegments:2,curveSegments:10,
  });
  const leaf = new T.SphereGeometry(1,10,6);
  for(const side of [-1,1]){
    const z=side*.166;
    add(panel,lacquer,0,0,z-.0115);
    const outside=side*.190;
    rail([[-.39,.40],[-.26,.37],[-.10,.25],[.13,.24],[.37,.29]],z,.013);
    rail([[-.36,.27],[-.27,.169],[-.07,.134],[.19,.137],[.29,.16]],outside,.006);
    rail([[-.42,.026],[-.27,.014],[.20,.014],[.39,.039],[.48,.13],
      [.46,.23],[.39,.24],[.36,.19],[.40,.16],[.426,.185]],z,.014);
    rail([[.30,.045],[.375,.080],[.387,.119],[.35,.132],[.324,.107]],z,.009);
    rail([[-.25,.027],[-.20,.119]],z,.012);
    rail([[.20,.025],[.16,.118]],z,.012);
    rail([[-.29,.245],[-.19,.191],[-.05,.173],[.10,.177],[.23,.217]],outside,.007);
    rail([[-.30,.365],[-.30,.318]],outside,.004);
    add(new T.SphereGeometry(.020,10,8),emerald,-.30,.302,outside);
    rail([[.242,.260],[.242,.231]],outside,.004);
    add(new T.SphereGeometry(.014,10,8),ivory,.242,.222,outside);
    for(let i=0;i<7;i++){
      const x=-.25+i*.068;
      const y=.174+.052*((i-3.6)/3.6)**2;
      for(const direction of [-1,1]){
        const gilding=add(leaf,brass,x-.012,y+direction*.015,outside);
        gilding.scale.set(.029,.009,.004);
        gilding.rotation.z=-direction*.62;
      }
    }
  }
  add(new T.BoxGeometry(.49,.038,.31),lacquer,-.014,.139);
  const seat=add(new T.SphereGeometry(1,20,10),velvet,-.05,.172);
  seat.scale.set(.244,.038,.148);
  const back=add(new T.SphereGeometry(1,20,10),velvet,-.277,.265);
  back.scale.set(.040,.141,.150);
  back.rotation.z=.27;
  for(const [x,z,width,height,wrap,ribbon] of [
    [-.154,-.056,.139,.171,emerald,brass],
    [-.022,.052,.124,.118,ivory,lacquer],
    [.105,-.053,.105,.100,lacquer,ivory],
  ]){
    const base=.184;
    const depth=width*.87;
    add(new T.BoxGeometry(width,height,depth),wrap,x,base+height/2,z);
    add(new T.BoxGeometry(.019,height+.005,depth+.004),ribbon,x,base+height/2,z);
    add(new T.BoxGeometry(width+.004,height+.005,.017),ribbon,x,base+height/2,z);
    for(const side of [-1,1]){
      const loop=add(new T.TorusGeometry(.014,.0035,6,12),ribbon,x+side*.014,base+height+.012,z);
      loop.rotation.z=side*.33;
    }
  }
  const lanternX=.31,lanternZ=.124;
  add(new T.CylinderGeometry(.010,.013,.094,10),brass,lanternX,.319,lanternZ);
  add(new T.CylinderGeometry(.029,.024,.061,6),lanternGlass,lanternX,.388,lanternZ);
  add(new T.CylinderGeometry(.032,.029,.009,6),brass,lanternX,.353,lanternZ);
  add(new T.ConeGeometry(.039,.033,6),brass,lanternX,.433,lanternZ);
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3;
    add(new T.CylinderGeometry(.003,.003,.067,6),brass,
      lanternX+Math.sin(angle)*.027,.388,lanternZ+Math.cos(angle)*.027);
  }

  const angle = T.MathUtils.euclideanModulo(Math.atan2(sleigh.position.z,sleigh.position.x)/(2*Math.PI),1);
  const winterArrival = angle-1;
  return {
    update(season, fixedWinter) {
      const sinceWinter = T.MathUtils.euclideanModulo(season+1,4)-1;
      const departure = winterFlightStart-1/secondsPerSeason;
      // Keep the parked sleigh through the thaw until just before the sky flight.
      const opacity = fixedWinter ? 1
        : T.MathUtils.smoothstep(sinceWinter,winterArrival,winterArrival+.035)
          * (1-T.MathUtils.smoothstep(sinceWinter,departure-.025,departure));
      sleigh.visible = opacity>0;
      for(const paint of paints){
        paint.opacity=opacity;
        paint.depthWrite=opacity>.95;
      }
    },
  };
}

// Miniature ornaments in camera space, with normal depth testing against the dial.
function createWinterSleigh(sky) {
  const team = new T.Group();
  team.name = 'Winter sleigh and reindeer';
  sky.add(team);

  const materials = [];
  function material(color) {
    const result = new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    materials.push(result);
    return result;
  }
  const gold = material(0xffd188), cream = material(0xffedcb);
  function crystal(color, rimColor) {
    const result = new T.MeshStandardMaterial({
      color, roughness: .25, transparent: true, depthWrite: false,
      emissive: color, emissiveIntensity: .24,
    });
    result.onBeforeCompile = shader => {
      shader.uniforms.crystalRim = { value: new T.Color(rimColor) };
      shader.fragmentShader = 'uniform vec3 crystalRim;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
        float facet = .5 + .5 * sin(dot(normal, vec3(8.0, 15.0, 12.0)));
        outgoingLight += crystalRim * (.16 + .72 * rim + .12 * facet);
        diffuseColor.a *= .35 + .52 * rim + .13 * facet;
        #include <opaque_fragment>
      `);
    };
    materials.push(result);
    return result;
  }
  const deer = crystal(0x90bccc, 0xffe2aa);
  const scarlet = crystal(0xb6172d, 0xff594d);
  const glass = crystal(0x96b7cf, 0xf9d19b);
  const ivory = crystal(0xffe7cb, 0xffe5bd);
  const sphere = new T.SphereGeometry(1, 12, 8);
  function oval(parent, paint, x, y, sx, sy, z = 0) {
    const mesh = new T.Mesh(sphere, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, .075);
    parent.add(mesh);
    return mesh;
  }
  function stroke(parent, paint, points, width, z = .06) {
    const curve = new T.CatmullRomCurve3(points.map(([x,y]) => new T.Vector3(x,y,z)));
    parent.add(new T.Mesh(new T.TubeGeometry(curve, 12, width, 5, false), paint));
  }

  const sleigh = new T.Group();
  team.add(sleigh);
  const shell = new T.Shape();
  shell.moveTo(-1.24,.20);
  shell.bezierCurveTo(-1.09,.22,-1.16,-.015,-.98,-.045);
  shell.bezierCurveTo(-.76,-.085,-.52,-.04,-.39,.085);
  shell.bezierCurveTo(-.38,-.09,-.53,-.16,-.74,-.17);
  shell.lineTo(-1.02,-.17);
  shell.bezierCurveTo(-1.18,-.16,-1.20,-.03,-1.24,.20);
  const carriage = new T.Mesh(new T.ExtrudeGeometry(shell,{
    depth:.12,bevelEnabled:true,bevelThickness:.011,bevelSize:.011,
    bevelSegments:2,curveSegments:14,
  }),glass);
  carriage.position.z=-.09;
  sleigh.add(carriage);

  // A seated silhouette with a tapered cap, pale beard and forward-reaching arm.
  oval(sleigh, scarlet, -.85,.105,.117,.145,-.04).rotation.z=-.19;
  oval(sleigh, ivory, -.759,.252,.054,.063,.005);
  stroke(sleigh, ivory, [[-.79,.247],[-.751,.202],[-.691,.194]], .027,.045);
  stroke(sleigh, scarlet, [[-.707,.288],[-.754,.340],[-.816,.345],[-.843,.316]], .034,.018);
  stroke(sleigh, ivory, [[-.803,.289],[-.747,.292],[-.708,.280]], .014,.038);
  oval(sleigh, ivory, -.846,.306,.024,.024,.025);
  stroke(sleigh, scarlet, [[-.836,.174],[-.760,.120],[-.650,.144]], .033,.043);
  oval(sleigh, ivory, -.641,.148,.022,.022,.052);

  for (const depth of [-.12,.115]) {
    stroke(sleigh, gold, [[-1.27,-.223],[-1.11,-.26],[-.65,-.26],[-.43,-.21],[-.35,-.123],[-.38,-.083]], .013,depth);
    stroke(sleigh, gold, [[-1.06,-.249],[-1.00,-.158]], .010,depth);
    stroke(sleigh, gold, [[-.68,-.254],[-.63,-.160]], .010,depth);
  }
  stroke(sleigh, gold, [[-1.24,.20],[-1.11,.024],[-.93,-.051],[-.64,-.050],[-.39,.085]], .011,.052);
  stroke(sleigh, gold, [[-.63,.145],[-.29,.09],[.28,.16],[1.04,.22]], .006,.066);

  const reindeer = [.22, 1.03].map((x, index) => {
    const body = new T.Group();
    body.position.set(x, .11 + index * .07, 0);
    team.add(body);
    oval(body, deer, 0, 0, .238, .074);
    oval(body, deer, -.142, -.017, .084, .072);
    oval(body, deer, -.24, .053, .066, .026).rotation.z = -.55;
    const neck = new T.Group();
    neck.position.set(.147,.021,0);
    body.add(neck);
    oval(neck, deer, .029,.068,.052,.127).rotation.z = -.40;
    const head = new T.Group();
    head.position.set(.077,.152,0);
    neck.add(head);
    oval(head, deer, .019,0,.093,.050);
    oval(head, glass, .074,-.021,.061,.029);
    oval(head, cream, .118,-.021,.019,.017);
    oval(head, glass, -.044,.043,.051,.018).rotation.z = -.5;
    for (const depth of [-.04,.05]) {
      stroke(head, gold, [[-.04,.03],[-.09,.125],[-.143,.235]], .008, depth);
      stroke(head, gold, [[-.10,.113],[-.17,.148],[-.19,.198]], .008, depth);
      stroke(head, gold, [[-.12,.17],[-.071,.205],[-.059,.25]], .008, depth);
    }
    const legs = [];
    for (const depth of [-.055,.065]) for (const front of [false,true]) {
      const leg = new T.Group();
      leg.position.set(front ? .143 : -.155, -.045, depth);
      body.add(leg);
      const kneeX = front ? .043 : -.054;
      stroke(leg, deer, [[0,0],[kneeX*.5,-.058],[kneeX,-.106]], .021, 0);
      const knee = new T.Group();
      knee.position.set(kneeX,-.106,0);
      leg.add(knee);
      stroke(knee, gold, [[0,0],[.032,-.042],[.063,-.082]], .012, 0);
      legs.push({leg,knee,front,far:depth<0});
    }
    return { body, neck, head, legs, y: body.position.y };
  });

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 64;
  const context = glowCanvas.getContext('2d');
  const halo = context.createRadialGradient(32,32,0,32,32,32);
  halo.addColorStop(0, 'rgba(255,204,127,.7)');
  halo.addColorStop(.43, 'rgba(255,180,99,.21)');
  halo.addColorStop(1, 'rgba(255,164,86,0)');
  context.fillStyle = halo;
  context.fillRect(0,0,64,64);
  const glow = new T.Sprite(new T.SpriteMaterial({
    map: new T.CanvasTexture(glowCanvas), transparent: true,
    depthWrite: false, blending: T.AdditiveBlending,
  }));
  glow.position.set(-.72,.11,-.21);
  glow.scale.set(1.62,1.02,1);
  team.add(glow);

  const glints = Array.from({ length: 12 }, (_, i) => {
    const mesh = oval(team, i % 3 === 0 ? cream : gold, 0, 0, .022, .022, -.02);
    return mesh;
  });
  return {
    update(time, progress, center, camera) {
      team.visible = progress > 0 && progress < 1;
      if (!team.visible) return;
      const depth = 38;
      const halfHeight = depth * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = halfHeight * camera.aspect;
      const scale = halfHeight * .079;
      const margin = 1.85 * scale;
      const arc = progress * 2 - 1;
      team.scale.setScalar(scale);
      team.position.set(
        T.MathUtils.lerp(-halfWidth-margin, halfWidth+margin, progress),
        halfHeight * (center.y - .22 + .34 * arc * arc - .055 * arc),
        -depth,
      );
      // Face along the tangent of the same arc that drives the translation.
      const flightPitch = Math.atan2(halfHeight * (1.36 * arc - .11), 2 * (halfWidth + margin));
      team.rotation.z = flightPitch;
      const fade = T.MathUtils.smoothstep(progress, 0, .08)
        * (1 - T.MathUtils.smoothstep(progress, .92, 1));
      for (const paint of materials) paint.opacity = fade * .91;
      glow.material.opacity = fade * .34;
      sleigh.rotation.z = Math.sin(time * 4.4) * .018;
      reindeer.forEach(({body, neck, head, legs, y}, i) => {
        const beat = time * 6.8 + i * 1.05;
        body.position.y = y + Math.sin(beat) * .026;
        body.rotation.z = Math.sin(beat) * .044;
        neck.rotation.z = flightPitch * .22 + Math.cos(beat) * .018;
        head.rotation.z = flightPitch * .14;
        for (const {leg,knee,front,far} of legs) {
          const step = beat + (front ? .7 : 2.2) + (far ? .88 : 0);
          leg.rotation.z = Math.sin(step) * .48 + (front ? .16 : -.19);
          knee.rotation.z = .17 + (.5 + .5 * Math.cos(step)) * .57;
        }
      });
      glints.forEach((glint, i) => {
        const age = (time * .67 + i * .271) % 1;
        glint.position.x = -1.24 - age * 1.08;
        glint.position.y = -.02 - age * .24 + Math.sin(i * 9) * .11;
        glint.scale.setScalar(.024 * Math.sin(Math.PI * age));
      });
    },
  };
}

// All four falling materials share the dial's radial season calculation.
// Instanced quads keep the transparent image assets inexpensive on phones.
export function createSeasonalEffects({ world, scene, camera, uniforms, random, springStill = false, summerStill = false, winterStill = false, secondsPerSeason }) {
  const loader = new T.TextureLoader();
  const resources = { loaded: 0, expected: 3, failed: [] };
  const weather = new T.Group();
  weather.name = 'Seasonal falling petals, leaves and snow';
  world.add(weather);
  const definitions = [
    { name: 'petal', season: 0, count: 40, size: .14, fall: .18 },
    { name: 'summer-leaf', season: 1, count: 26, size: .17, fall: .24 },
    { name: 'maple-leaf', season: 2, count: 32, size: .18, fall: .22 },
  ];
  const weatherVertex = `
    attribute vec4 aRoot, aMotion;
    uniform float uTime, uCycle, uKind;
    varying vec2 vUv;
    varying float vFade, vLight;
    const float TAU = 6.28318530718;
    void main() {
      float t = uTime;
      float phase = aRoot.w;
      vec3 center = aRoot.xyz;
      center.y = mod(aRoot.y - t * aMotion.y + 1000., 3.0);
      center.x += sin(t * .42 + phase) * .50 + sin(t * .17 + phase * 3.) * .25;
      center.z += cos(t * .34 + phase * 2.) * .40;
      float angle = mod(atan(center.z, center.x) + TAU, TAU) / TAU;
      float season = mod(floor(uCycle - angle) + 4., 4.);
      float matchSeason = 1. - step(.1, abs(season - uKind));
      vFade = matchSeason * smoothstep(.06, .38, center.y)
        * (1. - smoothstep(2.3, 3.0, center.y))
        * (1. - smoothstep(4.65, 5.35, length(center.xz)));
      vec4 mv = modelViewMatrix * vec4(center, 1.);
      float spin = phase + t * aMotion.z;
      float tumble = .36 + .64 * abs(cos(t * aMotion.w + phase));
      vec2 q = position.xy * aMotion.x;
      q.x *= tumble;
      q = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * q;
      mv.xy += q;
      gl_Position = projectionMatrix * mv;
      vUv = uv;
      vLight = .68 + .32 * tumble;
    }
  `;
  const weatherFragment = `
    uniform sampler2D uMap;
    uniform float uReady;
    varying vec2 vUv;
    varying float vFade, vLight;
    void main() {
      vec4 texel = texture2D(uMap, vUv);
      float alpha = texel.a * vFade * uReady;
      if (alpha < .018) discard;
      gl_FragColor = vec4(texel.rgb * vLight, alpha * .58);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
  for (const def of definitions) {
    const geometry = new T.InstancedBufferGeometry().copy(new T.PlaneGeometry(1, 1));
    const roots = new Float32Array(def.count * 4);
    const motion = new Float32Array(def.count * 4);
    for (let i = 0; i < def.count; i++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 5.0;
      roots.set([Math.cos(angle) * radius, random() * 3.0, Math.sin(angle) * radius, random() * 50], i * 4);
      motion.set([def.size * (.65 + random() * .85), def.fall * (.65 + random() * .7), (random() - .5) * 1.8, .5 + random()], i * 4);
    }
    geometry.setAttribute('aRoot', new T.InstancedBufferAttribute(roots, 4));
    geometry.setAttribute('aMotion', new T.InstancedBufferAttribute(motion, 4));
    geometry.instanceCount = def.count;
    const localUniforms = { ...uniforms, uKind: { value: def.season }, uReady: { value: 0 }, uMap: { value: null } };
    const texture = loader.load(`./assets/${def.name}.png`, () => {
      localUniforms.uReady.value = 1;
      resources.loaded++;
    }, undefined, () => resources.failed.push(def.name));
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 2;
    localUniforms.uMap.value = texture;
    const material = new T.ShaderMaterial({ uniforms: localUniforms, vertexShader: weatherVertex, fragmentShader: weatherFragment, transparent: true, depthWrite: false, side: T.DoubleSide });
    const mesh = new T.Mesh(geometry, material);
    mesh.name = `${def.name} particle field`;
    mesh.frustumCulled = false;
    weather.add(mesh);
  }

  // Winter uses only round snow grains, never decorative crystal sprites.
  const dustCount = 2250;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPositions.set([(random() - .5) * 10.8, random() * 4, (random() - .5) * 10.8], i * 3);
    dustSeed[i] = random();
  }
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('aSeed', new T.BufferAttribute(dustSeed, 1));
  const dust = new T.Points(dustGeometry, new T.ShaderMaterial({
    uniforms,
    transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime, uCycle, uPixelRatio;
      attribute float aSeed;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * (.22 + aSeed * .30) + 1000., 4.);
        p.x += sin(uTime * .6 + aSeed * 100.) * .4;
        p.z += cos(uTime * .4 + aSeed * 30.) * .3;
        float a = mod(atan(p.z, p.x) + 6.28318530718, 6.28318530718) / 6.28318530718;
        float s = mod(floor(uCycle - a) + 4., 4.);
        vFade = step(2.5, s) * (1. - smoothstep(4.8, 5.4, length(p.xz))) * smoothstep(0., .3, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = clamp((16. + aSeed * 17.) / -mv.z, 1.0, 3.0)*uPixelRatio;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `varying float vFade;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.83,.91,1.,vFade*(1.-d*d)*.65);}`,
  }));
  dust.frustumCulled = false;
  dust.name = 'Winter snow dust';
  weather.add(dust);

  // A narrow crest and a few droplets peel away from the moving season boundary.
  const splashSeeds = [];
  for (let i = 0; i < 184; i++) {
    // Independent of the landscape seed, so the other weather keeps its layout.
    const seed = i * 0.61803398875 % 1;
    splashSeeds.push(1.02 + (i / 184) * 3.88, seed, (i * .75487766625) % 1);
  }
  const splashGeometry = new T.BufferGeometry();
  splashGeometry.setAttribute('position', new T.Float32BufferAttribute(splashSeeds, 3));
  const sweepDirection = { value: 1 };
  const splash = new T.Points(splashGeometry, new T.ShaderMaterial({
    uniforms: { ...uniforms, uSweepDirection: sweepDirection },
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uCycle, uPixelRatio, uSweepDirection;
      uniform vec2 uHandDirection;
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float radius = position.x;
        float seed = position.y;
        float age = fract(uTime * (.85 + position.z * .65) + seed);
        float season = mod(floor(uCycle + (uSweepDirection > 0. ? 0. : -1.)), 4.);
        vec3 spring = vec3(.84, .93, .37);
        vec3 summer = vec3(.29, .86, .54);
        vec3 autumn = vec3(1., .58, .21);
        vec3 winter = vec3(.64, .84, 1.);
        vColor = season < .5 ? spring : season < 1.5 ? summer : season < 2.5 ? autumn : winter;
        float crest = .5 + .5 * sin(radius * 8. - uTime * 4.);
        float lift = sin(age * 3.14159265) * (.11 + .24 * crest * position.z);
        float angle = atan(uHandDirection.y,uHandDirection.x) - uSweepDirection * (.008 + age * (.055 + seed * .052));
        vec3 point = vec3(cos(angle) * radius, .17 + lift, sin(angle) * radius);
        vec4 viewPoint = modelViewMatrix * vec4(point, 1.);
        gl_Position = projectionMatrix * viewPoint;
        gl_PointSize = clamp((20. + 34. * seed) / -viewPoint.z, 1.25, 4.) * uPixelRatio;
        vAlpha = smoothstep(0., .12, age) * (1. - smoothstep(.35, 1., age))
          * (.30 + .38 * crest) * (1. - smoothstep(4.55, 4.92, radius));
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.;
        float foam = 1. - smoothstep(.15, 1., r);
        gl_FragColor = vec4(mix(vColor, vec3(1.), foam * .30), foam * vAlpha);
      }
    `,
  }));
  splash.name = 'Season sweep droplets';
  splash.frustumCulled = false;
  const seasonStill = springStill || summerStill || winterStill;
  splash.visible = !seasonStill;
  world.add(splash);

  const rainPositions = [], rainSeeds = [];
  for (let i = 0; i < 180; i++) {
    const angle = i * 2.399963;
    const radius = 4.85 * Math.sqrt((i + .5) / 180);
    const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    rainPositions.push(x, 0, z, x, 1, z);
    const seed = (i * .618034) % 1;
    rainSeeds.push(seed, seed);
  }
  const rainGeometry = new T.BufferGeometry();
  rainGeometry.setAttribute('position', new T.Float32BufferAttribute(rainPositions, 3));
  rainGeometry.setAttribute('aSeed', new T.Float32BufferAttribute(rainSeeds, 1));
  const rainStrength = { value: 0 };
  const rain = new T.LineSegments(rainGeometry, new T.ShaderMaterial({
    uniforms: { ...uniforms, uRainStrength: rainStrength },
    transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime, uCycle, uRainStrength;
      attribute float aSeed;
      varying float vAlpha;
      void main() {
        float angle = mod(atan(position.z, position.x) + 6.2831853, 6.2831853) / 6.2831853;
        float summer = 1. - step(.5, abs(mod(floor(uCycle-angle),4.) - 1.));
        float height = fract(aSeed - uTime * (.75 + .40*aSeed)) * 2.8;
        vec3 p = vec3(position.x - .035*height, height + .022, position.z);
        p += vec3(-.010, .075 + .045*aSeed, .005) * position.y;
        vAlpha = summer * uRainStrength * smoothstep(0., .12, height)
          * (1. - smoothstep(2.3, 2.8, height)) * (.28 - .17*position.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.);
      }`,
    fragmentShader: `varying float vAlpha;
      void main() { gl_FragColor = vec4(.66,.82,.96,vAlpha); }`,
  }));
  rain.frustumCulled = false;
  world.add(rain);

  // A camera-relative deep sky stays behind the meadow at every orbit angle.
  const sky = new T.Group();
  sky.name = 'Living sky';
  camera.add(sky);
  scene.add(camera);
  const skyUniforms = { uTime: uniforms.uTime, uAspect: { value: 1 }, uTanFov: { value: 1 } };
  const skyProjection = `
    uniform float uTime, uAspect, uTanFov;
    vec4 skyPosition(vec2 p, float depth) {
      return projectionMatrix * vec4(p.x * depth * uTanFov * uAspect, p.y * depth * uTanFov, -depth, 1.);
    }
  `;
  const starCount = springStill ? 480 : 230;
  const starPositions = new Float32Array(starCount * 3);
  const starSeeds = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions.set([(random() - .5) * 2.2, (random() - .5) * 2.2, 24 + random() * 12], i * 3);
    const phase = random() * 100, size = .7 + random() * 1.6, tint = random();
    starSeeds.set([phase, !springStill && i < 12 ? size + 2.4 : size, tint], i * 3);
  }
  const starGeometry = new T.BufferGeometry();
  starGeometry.setAttribute('position', new T.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('aSeed', new T.BufferAttribute(starSeeds, 3));
  const stars = new T.Points(starGeometry, new T.ShaderMaterial({
    uniforms: skyUniforms, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `${skyProjection}
      attribute vec3 aSeed;varying float vAlpha;varying vec3 vColor;
      void main(){vec2 p=position.xy;
      ${seasonStill ? '' : 'p.x=mod(p.x+uTime*(.0007+aSeed.z*.0005)+1.1,2.2)-1.1; p.y+=sin(uTime*.025+aSeed.x)*.006;'}
      float twinkle=pow(.5+.5*sin(uTime*(.55+aSeed.z)+aSeed.x),3.);
      vAlpha=${springStill ? ".12+twinkle*.64" : "mix(.08+twinkle*.16,.12+twinkle*.83,step(3.,aSeed.y))"};vColor=mix(vec3(.60,.77,1.),vec3(1.,.87,.66),aSeed.z);
      gl_PointSize=aSeed.y*(.8+twinkle*.35);gl_Position=skyPosition(p,position.z);}`,
    fragmentShader: `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,pow(1.-d,1.5)*vAlpha);}`,
  }));
  stars.frustumCulled = false;
  sky.add(stars);

  const meteorGeometry = new T.InstancedBufferGeometry().copy(new T.PlaneGeometry(1, 1));
  const meteorSpecs = new Float32Array(springStill ? [1.32, .18, 4., 5.] : summerStill ? [1.42, .26, 0., 2.4] : [
    1.50, .32, 1.1, 3.,
  ]);
  meteorGeometry.setAttribute('aMeteor', new T.InstancedBufferAttribute(meteorSpecs, 4));
  meteorGeometry.instanceCount = meteorSpecs.length / 4;
  const meteorCenter = new T.Vector3();
  const winterSleigh = createWinterSleigh(sky);
  const parkedSleigh = createParkedSleigh(world,secondsPerSeason);
  const meteors = new T.Mesh(meteorGeometry, new T.ShaderMaterial({
    uniforms: { ...skyUniforms, uMeteorCenter: { value: meteorCenter } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    vertexShader: `${skyProjection}
      uniform vec3 uMeteorCenter;attribute vec4 aMeteor;varying vec2 vUv;varying float vFade;
      void main(){float age=mod(uTime+aMeteor.z,aMeteor.w);float duration=${summerStill ? "1.95" : "2.65"};float progress=age/duration;
      vFade=step(age,duration)*sin(clamp(progress,0.,1.)*3.14159265);
      vec2 travel=-2.*aMeteor.xy;
      vec2 direction=normalize(travel);
      vec2 head=uMeteorCenter.xy+aMeteor.xy+travel*progress;
      float trail=(position.x+.5)*.68*min(age/.16,1.);
      vec2 p=head-direction*trail+vec2(-direction.y,direction.x)*position.y*.010;
      vUv=vec2(position.x+.5,position.y*2.);gl_Position=skyPosition(p,38.);}`,
    fragmentShader: `varying vec2 vUv;varying float vFade;void main(){float core=exp(-vUv.y*vUv.y*8.);float tail=pow(1.-vUv.x,1.8);vec3 color=mix(vec3(.28,.52,1.),vec3(1.,.96,.80),pow(1.-vUv.x,8.));gl_FragColor=vec4(color,core*tail*vFade*.82);}`,
  }));
  meteors.frustumCulled = false;
  meteors.name = 'Intermittent shooting stars';
  sky.add(meteors);

  // Artistic star formations: thin links reveal gradually, then dissolve.
  const formations = [
    { nodes: [[-.85,.65],[-.69,.70],[-.54,.58],[-.38,.62],[-.24,.46],[-.40,.32],[-.54,.43]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]], offset: 8 },
    { nodes: [[.28,.79],[.41,.54],[.56,.69],[.71,.49],[.86,.75]], edges: [[0,1],[1,2],[2,3],[3,4]], offset: 29 },
    { nodes: [[-.81,-.08],[-.71,.08],[-.61,.02],[-.47,.17],[-.36,.04],[-.27,.13]], edges: [[0,1],[1,2],[2,3],[3,4],[4,5]], offset: 50 },
  ];
  const constellationVertex = `${skyProjection}
    uniform float uOffset;attribute float aOrder;
    varying float vFade;
    void main(){float age=mod(uTime+uOffset,64.);
    float envelope=smoothstep(0.,5.,age)*(1.-smoothstep(9.,15.,age));
    float reveal=smoothstep(aOrder*3.,aOrder*3.+2.,age);
    vFade=envelope*reveal;gl_Position=skyPosition(position.xy,26.);}`;
  for (const formation of formations) {
    const lineVertices = [], orders = [];
    formation.edges.forEach(([a, b], i) => {
      lineVertices.push(...formation.nodes[a], 0, ...formation.nodes[b], 0);
      orders.push(i / formation.edges.length, (i + .8) / formation.edges.length);
    });
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(lineVertices, 3));
    geometry.setAttribute('aOrder', new T.Float32BufferAttribute(orders, 1));
    const localUniforms = { ...skyUniforms, uOffset: { value: formation.offset } };
    const lines = new T.LineSegments(geometry, new T.ShaderMaterial({
      uniforms: localUniforms, vertexShader: constellationVertex,
      fragmentShader: `varying float vFade;void main(){gl_FragColor=vec4(.61,.77,1.,vFade*.13);}`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    }));
    lines.frustumCulled = false;
    sky.add(lines);
    const nodes = new T.BufferGeometry();
    nodes.setAttribute('position', new T.Float32BufferAttribute(formation.nodes.flatMap(p => [...p, 0]), 3));
    nodes.setAttribute('aOrder', new T.Float32BufferAttribute(formation.nodes.map((_, i) => i / formation.nodes.length), 1));
    const points = new T.Points(nodes, new T.ShaderMaterial({
      uniforms: localUniforms,
      vertexShader: constellationVertex.replace('gl_Position=skyPosition', 'gl_PointSize=3.;gl_Position=skyPosition'),
      fragmentShader: `varying float vFade;void main(){vec2 p=gl_PointCoord-.5;float d=length(p)*2.;if(d>1.)discard;gl_FragColor=vec4(.83,.9,1.,vFade*pow(1.-d,1.3)*.60);}`,
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    }));
    points.frustumCulled = false;
    sky.add(points);
  }
  return {
    resources,
    update(time, direction = 1) {
      sweepDirection.value = direction;
      camera.updateMatrixWorld();
      meteorCenter.set(0, .24, 0).project(camera);
      if (seasonStill) meteorCenter.y += .57;
      const season = T.MathUtils.euclideanModulo(uniforms.uCycle.value, 4);
      const shower = time % 54;
      rainStrength.value = summerStill
        ? .52 * T.MathUtils.smoothstep(shower, 12, 14) * (1 - T.MathUtils.smoothstep(shower, 20, 23))
        : springStill ? 0 : T.MathUtils.smoothstep(season, 1, 1.16)
          * (1 - T.MathUtils.smoothstep(season, 1.5, 2));
      rain.visible = rainStrength.value > 0;
      // Cross as spring grows from one third to two thirds of the dial.
      const flightProgress = springStill ? -1 : 3 * (season-winterFlightStart);
      winterSleigh.update(time, flightProgress, meteorCenter, camera);
      parkedSleigh.update(season,winterStill);
      skyUniforms.uAspect.value = camera.aspect;
      skyUniforms.uTanFov.value = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const texture = scene.background;
      if (texture?.isTexture && !seasonStill) {
        texture.offset.x = (1 - texture.repeat.x) / 2 + Math.sin(time * .015) * .009;
        texture.offset.y = (1 - texture.repeat.y) / 2 + Math.cos(time * .011) * .006;
      }
    },
  };
}
