import * as T from './vendor/three.module.js';

// All four falling materials share the dial's radial season calculation.
// Instanced quads keep the transparent image assets inexpensive on phones.
export function createSeasonalEffects({ world, scene, camera, uniforms, random }) {
  const loader = new T.TextureLoader();
  const resources = { loaded: 0, expected: 4, failed: [] };
  const weather = new T.Group();
  weather.name = 'Seasonal falling petals, leaves and snow';
  world.add(weather);
  const definitions = [
    { name: 'petal', season: 0, count: 40, size: .14, fall: .18 },
    { name: 'summer-leaf', season: 1, count: 26, size: .17, fall: .24 },
    { name: 'maple-leaf', season: 2, count: 32, size: .18, fall: .22 },
    { name: 'snowflake', season: 3, count: 62, size: .10, fall: .15 },
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

  // Small winter flurries and ice dust complement the readable crystal sprites.
  const dustCount = 250;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPositions.set([(random() - .5) * 10.8, random() * 3, (random() - .5) * 10.8], i * 3);
    dustSeed[i] = random();
  }
  const dustGeometry = new T.BufferGeometry();
  dustGeometry.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute('aSeed', new T.BufferAttribute(dustSeed, 1));
  const dust = new T.Points(dustGeometry, new T.ShaderMaterial({
    uniforms,
    transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime, uCycle;
      attribute float aSeed;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.y = mod(p.y - uTime * (.15 + aSeed * .24) + 1000., 3.);
        p.x += sin(uTime * .6 + aSeed * 100.) * .4;
        p.z += cos(uTime * .4 + aSeed * 30.) * .3;
        float a = mod(atan(p.z, p.x) + 6.28318530718, 6.28318530718) / 6.28318530718;
        float s = mod(floor(uCycle - a) + 4., 4.);
        vFade = step(2.5, s) * (1. - smoothstep(4.8, 5.4, length(p.xz))) * smoothstep(0., .3, p.y);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = clamp((12. + aSeed * 16.) / -mv.z, .8, 3.);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `varying float vFade;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(.83,.91,1.,vFade*(1.-d*d)*.36);}`,
  }));
  dust.frustumCulled = false;
  dust.name = 'Winter snow dust';
  weather.add(dust);

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
  const starCount = 230;
  const starPositions = new Float32Array(starCount * 3);
  const starSeeds = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions.set([(random() - .5) * 2.2, (random() - .5) * 2.2, 24 + random() * 12], i * 3);
    starSeeds.set([random() * 100, .7 + random() * 1.6, random()], i * 3);
  }
  const starGeometry = new T.BufferGeometry();
  starGeometry.setAttribute('position', new T.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('aSeed', new T.BufferAttribute(starSeeds, 3));
  const stars = new T.Points(starGeometry, new T.ShaderMaterial({
    uniforms: skyUniforms, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `${skyProjection}
      attribute vec3 aSeed;varying float vAlpha;varying vec3 vColor;
      void main(){vec2 p=position.xy;p.x=mod(p.x+uTime*(.0007+aSeed.z*.0005)+1.1,2.2)-1.1;
      p.y+=sin(uTime*.025+aSeed.x)*.006;
      float twinkle=pow(.5+.5*sin(uTime*(.55+aSeed.z)+aSeed.x),3.);
      vAlpha=.07+twinkle*.32;vColor=mix(vec3(.60,.77,1.),vec3(1.,.87,.66),aSeed.z);
      gl_PointSize=aSeed.y*(.8+twinkle*.35);gl_Position=skyPosition(p,position.z);}`,
    fragmentShader: `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vColor,pow(1.-d,1.5)*vAlpha);}`,
  }));
  stars.frustumCulled = false;
  sky.add(stars);

  const meteorGeometry = new T.InstancedBufferGeometry().copy(new T.PlaneGeometry(1, 1));
  const meteorSpecs = new Float32Array([
    -.25, .92, 6.0, 29.0,
    .80, .85, 19.0, 41.0,
  ]);
  meteorGeometry.setAttribute('aMeteor', new T.InstancedBufferAttribute(meteorSpecs, 4));
  meteorGeometry.instanceCount = 2;
  const meteors = new T.Mesh(meteorGeometry, new T.ShaderMaterial({
    uniforms: skyUniforms, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    vertexShader: `${skyProjection}
      attribute vec4 aMeteor;varying vec2 vUv;varying float vFade;
      void main(){float age=mod(uTime+aMeteor.z,aMeteor.w);float progress=age/1.55;
      vFade=step(age,1.55)*sin(clamp(progress,0.,1.)*3.14159265);
      vec2 direction=normalize(vec2(-1.,-.55));
      vec2 head=aMeteor.xy+direction*age*.64;
      float trail=(position.x+.5)*.40*min(age/.16,1.);
      vec2 p=head-direction*trail+vec2(-direction.y,direction.x)*position.y*.008;
      vUv=vec2(position.x+.5,position.y*2.);gl_Position=skyPosition(p,23.);}`,
    fragmentShader: `varying vec2 vUv;varying float vFade;void main(){float core=exp(-vUv.y*vUv.y*8.);float tail=pow(1.-vUv.x,1.8);vec3 color=mix(vec3(.28,.52,1.),vec3(1.,.96,.80),pow(1.-vUv.x,8.));gl_FragColor=vec4(color,core*tail*vFade*.55);}`,
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
    update(time) {
      skyUniforms.uAspect.value = camera.aspect;
      skyUniforms.uTanFov.value = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
      const texture = scene.background;
      if (texture?.isTexture) {
        texture.offset.x = (1 - texture.repeat.x) / 2 + Math.sin(time * .015) * .009;
        texture.offset.y = (1 - texture.repeat.y) / 2 + Math.cos(time * .011) * .006;
      }
    },
  };
}
