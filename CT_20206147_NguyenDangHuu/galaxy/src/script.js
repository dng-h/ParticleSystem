import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, PerspectiveCamera, Points, RawShaderMaterial, Scene, WebGLRenderer } from "https://cdn.skypack.dev/three@0.136.0"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls"
import GUI from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/lil-gui.module.min.js"

const galaxyVertexShader = `
precision highp float;

attribute vec3 position;
attribute float size;
attribute vec3 seed;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float galTime;
uniform float galSize;
uniform float galBranches;
uniform float galRadius;
uniform float galSpin;
uniform float galRandomness;

varying float vDistance;

#define PI  3.14159265359
#define PI2 6.28318530718


float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 scatter (vec3 seed) {
  float u = random(seed.xy);
  float v = random(seed.yz);
  float theta = u * 6.28318530718;
  float phi = acos(2.0 * v - 1.0);

  float x = sin(phi) * cos(theta);
  float y = sin(phi) * sin(theta);
  float z = cos(phi);

  return vec3(x, y, z);
}


void main() {
  vec3 p = position;
  float st = sqrt(p.x);
  float qt = p.x * p.x;
  float mt = mix(st, qt, p.x);

  float angle = qt * galSpin * (2.0 - sqrt(1.0 - qt));
  float branchOffset = (PI2 / galBranches) * floor(seed.x * galBranches);
  p.x = position.x * cos(angle + branchOffset) * galRadius;
  p.z = position.x * sin(angle + branchOffset) * galRadius;

  p += scatter(seed) * random(seed.zx) * galRandomness * mt;
  p.y *= 0.5 + qt * 0.5;


  vec3 temp = p;
  float ac = cos(-galTime * (2.0 - st) * 0.5);
  float as = sin(-galTime * (2.0 - st) * 0.5);
  p.x = temp.x * ac - temp.z * as;
  p.z = temp.x * as + temp.z * ac;



  vDistance = mt;

  vec4 mvp = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvp;
  gl_PointSize = (10.0 * size * galSize) / -mvp.z;
}
`;

const galaxyFragmentShader = `
precision highp float;

uniform vec3 galColorIn;
uniform vec3 galColorOut;
uniform sampler2D galAlphaMap;

varying float vDistance;

#define PI  3.14159265359



void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a = texture2D(galAlphaMap, uv).g;
  if (a < 0.1) discard;

  vec3 color = mix(galColorIn, galColorOut, vDistance);
  float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
  color = max(color, vec3(c));

  gl_FragColor = vec4(color, a);
}
`;


const universeVertexShader = `
precision highp float;

attribute vec3 seed;
attribute float size;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform float uniTime;
uniform float uniSize;
uniform float uniRadius;

#define PI  3.14159265359
#define PI2 6.28318530718



float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 scatter (vec3 seed) {
  float u = random(seed.xy);
  float v = random(seed.yz);
  float theta = u * 6.28318530718;
  float phi = acos(2.0 * v - 1.0);

  float x = sin(phi) * cos(theta);
  float y = sin(phi) * sin(theta);
  float z = cos(phi);

  return vec3(x, y, z);
}



const float r = 3.0;
const vec3 s = vec3(15, 15, 15);



void main() {

  vec3 p = scatter(seed) * r * s;

  float q = random(seed.zx);
  for (int i = 0; i < 3; i++) q *= q;
  p *= q;

  float l = length(p) / (s.x * r);
  p = l < 0.001 ? (p / l) : p;

  vec3 temp = p;
  float ql = 1.0 - l;
  for (int i = 0; i < 3; i++) ql *= ql;
  float ac = cos(-uniTime * ql);
  float as = sin(-uniTime * ql);
  p.x = temp.x * ac - temp.z * as;
  p.z = temp.x * as + temp.z * ac;



  vec4 mvp = modelViewMatrix * vec4(p * uniRadius, 1.0);
  gl_Position = projectionMatrix * mvp;

  l = (2.0 - l) * (2.0 - l);

  gl_PointSize = (r * size * uniSize * l) / -mvp.z;
}
`;

const universeFragmentShader = `
precision highp float;

uniform sampler2D uniAlphaMap;

#define PI 3.14159265359



void main() {
  vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a = texture2D(uniAlphaMap, uv).g;
  if (a < 0.1) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;



const _VSAttr = `
uniform float pointMultiplier;

attribute float size;
attribute float angle;
attribute vec4 colour;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = size * pointMultiplier / gl_Position.w;

  vAngle = vec2(cos(angle), sin(angle));
  vColour = colour;
}`;

const _FSAttr = `

uniform sampler2D diffuseTexture;

varying vec4 vColour;
varying vec2 vAngle;

void main() {
  vec2 coords = (gl_PointCoord - 0.5) * mat2(vAngle.x, vAngle.y, -vAngle.y, vAngle.x) + 0.5;
  gl_FragColor = texture2D(diffuseTexture, coords) * vColour;
}`;


const count = 128 ** 2

const scene = new Scene()

const camera = new PerspectiveCamera(
  60, innerWidth / innerHeight, 0.1, 100
)
camera.position.set(0, 0, 15)

const initialCameraPosition = camera.position.clone();
const initialCameraRotation = camera.rotation.clone();

const renderer = new WebGLRenderer({ canvas })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const orbit = new OrbitControls(camera, canvas)




const ctx = document.createElement("canvas").getContext("2d")
ctx.canvas.width = ctx.canvas.height = 32

ctx.fillStyle = "#222"
ctx.fillRect(0, 0, 32, 32)

let grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
grd.addColorStop(0.0, "#fff")
grd.addColorStop(1.0, "#000")
ctx.fillStyle = grd
ctx.beginPath(); ctx.rect(15, 0, 2, 32); ctx.fill()
ctx.beginPath(); ctx.rect(0, 15, 32, 2); ctx.fill()

grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
grd.addColorStop(0.1, "#ffff")
grd.addColorStop(0.6, "#0000")
ctx.fillStyle = grd
ctx.fillRect(0, 0, 32, 32)

const alphaMap = new CanvasTexture(ctx.canvas)





var options = {
  play: false,
  duration: 20000,
  number: 100,
  restart: false
};
var galaxies = [];
var universe = new Points(new BufferGeometry(), new THREE.PointsMaterial({color: 0xffffff}));
var _blingPoints = new Points(new BufferGeometry(), new THREE.PointsMaterial({color: 0xffffff}));

var bling = {
  position: new THREE.Vector3(0,0,0),
  size: 1000,
  colour: new THREE.Color(1,1,1),
  alpha: 1.0
};




function _UpdateBling(particle, geometry) {
  if(particle.size > 0) particle.size -= 1;
  const pPositions = [];
  const pSizes = [];
  const pColours = [];
  pPositions.push(particle.position.x, particle.position.y, particle.position.z);
  pSizes.push(particle.size);
  pColours.push(particle.colour.r, particle.colour.g, particle.colour.b, particle.alpha);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(pSizes, 1));
  geometry.setAttribute('colour', new THREE.Float32BufferAttribute(pColours, 4));
  
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
  geometry.attributes.colour.needsUpdate = true;
}




function create()
{
  bling = {
    position: new THREE.Vector3(0,0,0),
    size: 30,
    colour: new THREE.Color(1,1,1),
    alpha: 1.0
  };

  const uniforms = {
    diffuseTexture: {
        value: new THREE.TextureLoader().load('./blingg.png')
    },
    pointMultiplier: {
        value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
    }
};
const _material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: _VSAttr,
  fragmentShader: _FSAttr,
  blending: THREE.AdditiveBlending,
  depthTest: true,
  depthWrite: false,
  transparent: true,
  vertexColors: true
});

 const _blingGeom = new THREE.BufferGeometry();

_blingGeom.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
_blingGeom.setAttribute('size', new THREE.Float32BufferAttribute([], 1));

_blingPoints = new THREE.Points(_blingGeom, _material);
_blingPoints.name = "bling";
scene.add(_blingPoints);

_UpdateBling(bling, _blingPoints.geometry);





const galaxyGeometry = new BufferGeometry()

const galaxyPosition = new Float32Array(count * 3)
const galaxySeed = new Float32Array(count * 3)
const galaxySize = new Float32Array(count)

for (let i = 0; i < count; i++) {
  galaxyPosition[i * 3] = i / count
  galaxySeed[i * 3 + 0] = Math.random()
  galaxySeed[i * 3 + 1] = Math.random()
  galaxySeed[i * 3 + 2] = Math.random()
  galaxySize[i] = Math.random() * 2 + 0.5
}

galaxyGeometry.setAttribute(
  "position", new BufferAttribute(galaxyPosition, 3)
)
galaxyGeometry.setAttribute(
  "size", new BufferAttribute(galaxySize, 1)
)
galaxyGeometry.setAttribute(
  "seed", new BufferAttribute(galaxySeed, 3)
)

const inColor = []
const outColor = []
const branches = []

for(var i = 0; i < options.number; i++)
{
  inColor.push('#' + (Math.random() * 0x404040 + 0xaaaaaa | 0).toString(16));
  outColor.push('#' + (Math.random() * 0x404040 + 0xaaaaaa | 0).toString(16));
  branches.push(Math.round(Math.random()*5+5));
}

const galaxyMaterials = []

for(var i = 0; i < options.number; i++)
{
  var g = new RawShaderMaterial({

    uniforms: {
      galTime: { value: 0 },
      galSize: { value: renderer.getPixelRatio() },
      galBranches: { value: branches[i] },
      galRadius: { value: 0 },
      galSpin: { value: Math.PI * 0.25 },
      galRandomness: { value: 0 },
      galAlphaMap: { value: alphaMap },
      galColorIn: { value: new Color(inColor[i]) },
      galColorOut: { value: new Color(outColor[i]) },
    },
  
    vertexShader: galaxyVertexShader,
  
    fragmentShader: galaxyFragmentShader,
  
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  galaxyMaterials.push(g);
}


for(let m of galaxyMaterials)
{
  galaxies.push(new Points(galaxyGeometry, m));
}

for(let g of galaxies)
{  scene.add(g);
  g.rotation.set((Math.random() - 0.5)*Math.PI, 0, (Math.random() - 0.5)*Math.PI);
  g.position.set(0,0,-100);
  var sc = Math.random()*1;
  g.scale.set(sc,sc,sc);
}





const universeGeometry = new BufferGeometry()

const universePosition = new Float32Array(count * 15)
const universeSeed = new Float32Array(count * 15)
const universeSize = new Float32Array(count*5)

for (let i = 0; i < count*5; i++) {
  universeSeed[i * 3 + 0] = Math.random()*10
  universeSeed[i * 3 + 1] = Math.random()*10
  universeSeed[i * 3 + 2] = Math.random()*10
  universeSize[i] = Math.random() * 2 + 0.5
}

universeGeometry.setAttribute(
  "position", new BufferAttribute(universePosition, 3)
)
universeGeometry.setAttribute(
  "seed", new BufferAttribute(universeSeed, 3)
)
universeGeometry.setAttribute(
  "size", new BufferAttribute(universeSize, 1)
)

const universeMaterial = new RawShaderMaterial({

  uniforms: {
    uniTime: { value: 0 },
    uniSize: { value: renderer.getPixelRatio() },
    uniRadius: { value: 0 },
    uniAlphaMap: { value: alphaMap },
  },

  vertexShader: universeVertexShader,

  fragmentShader: universeFragmentShader,

  transparent: true,
  depthTest: false,
  depthWrite: false,
  blending: AdditiveBlending,
})

universe = new Points(universeGeometry, universeMaterial)
scene.add(universe)

}


var startTime = performance.now();

var startValues = {
  radius: 0,
  spin: 0,
  randomness: 0
};

var spins = []
for(var i = 0; i < options.number; i++)
  {
    var tmp = Math.random()-0.5;
    if(tmp > 0)
      spins.push(Math.PI * (Math.random()*1 + 1));
    else
      spins.push(-Math.PI * (Math.random()*1 + 1));
}

var endValue = []
for(let s of spins)
{
  endValue.push(
    {
      radius: 1.618,
      spin: s,
      randomness: 0.5
    }
  )
}


function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

var t = 0;
var currentTime = performance.now();

function _updateUniverse(endVal, material)
{
  const elapsedTime = currentTime - startTime;
  t = Math.min(elapsedTime / options.duration, 1);
  const easedT = easeInOutCubic(t);

  const radius = startValues.radius + (endVal.radius - startValues.radius) * easedT;

  material.uniforms.uniRadius.value = radius;
}

function _updateGalaxy(endVal, material)
{
  const elapsedTime = currentTime - startTime;
  const tt = Math.min(elapsedTime / options.duration, 1);
  const easedT = easeInOutCubic(tt);

  const radius = startValues.radius + (endVal.radius - startValues.radius) * easedT;
  const spin = startValues.spin + (endVal.spin - startValues.spin) * easedT;
  const randomness = startValues.randomness + (endVal.randomness - startValues.randomness) * easedT;

  material.uniforms.galRadius.value = radius;
  material.uniforms.galSpin.value = spin;
  material.uniforms.galRandomness.value = randomness;
}

const gui = new GUI().open();

gui.add(options, 'duration', 5000, 50000, 100).name('Duration (ms)')
.onChange(() => {options.play = false; playy.updateDisplay(); reset();});
gui.add(options, 'number', 50, 200, 1).name('Number of galaxies')
.onChange(() => {options.play = false; playy.updateDisplay(); reset();});
var playy = gui.add(options, 'play').name('Play');
gui.add(options, 'restart').name('Restart')
.onChange(() => {options.play = true; playy.updateDisplay(); reset(); start(); options.restart = !playy.getValue();});

playy.onChange(() => {
  options.play = playy.getValue();
  if(options.play)
  {
    reset();
    start();
  }
});

function reset()
{
  universe.geometry.dispose();
  universe.material.dispose();
  for(let g of galaxies)
  {
    g.geometry.dispose();
    g.material.dispose();
    scene.remove(g);
  }
  galaxies = [];
  scene.remove(universe);
  _blingPoints.geometry.dispose();
  _blingPoints.material.dispose();
  scene.remove(_blingPoints);
  spins = [];
  endValue = [];
  gPosition = [];
  camera.position.copy(initialCameraPosition);
  camera.rotation.copy(initialCameraRotation);
}

var gPosition = [];

function start()
{
  create();
  for(var i = 0; i < options.number; i++)
    {
      var tmp = Math.random()-0.5;
      if(tmp > 0)
        spins.push(Math.PI * (Math.random()*1 + 1));
      else
        spins.push(-Math.PI * (Math.random()*1 + 1));
  }
  for(let s of spins)
    {
      endValue.push(
        {
          radius: 1.618,
          spin: s,
          randomness: 0.5
        }
      )
    }
    for(var i = 0; i < options.number; i++)
      {
        var x,y,z;
        if(i == 0)
        {
          x = 0; y = 0; z = 0;
        }
        else
        {
          x = Math.random()*30 -15;
          y = Math.random()*30 -15;
          z = Math.random()*50 - 25;
        }
        gPosition.push({x:x, y:y, z:z});
    }
  startTime = performance.now();
  animate();
renderer.setAnimationLoop(() => {
  if(options.play)
  {
  var cur = performance.now();
  var i = 0;
  if(cur-startTime>(3000*options.duration/20000))
  for(let g of galaxies)
  {
    if(g.position.z < gPosition[i].z) g.position.add({x: gPosition[i].x/(100.0*options.duration/20000), y: gPosition[i].y/(100.0*options.duration/20000), z: (gPosition[i].z +100)/(200.0*options.duration/20000)});
    i++;
  }
  i=0;
  if(cur-startTime >= (19000*options.duration/20000))
  for(let g of galaxies)
  {
    if(spins[i] < 0)
      g.material.uniforms.galTime.value += Math.random()*0.002 + 0.001;
    else
      g.material.uniforms.galTime.value -= Math.random()*0.002 + 0.001;
  }
  universe.material.uniforms.uniTime.value += 0.001;
  if(cur-startTime > 100000000) startTime = cur-(20010*options.duration/20000);
  renderer.render(scene, camera);
  }
});
}

function animate() {
  if(options.play)
  {
    _UpdateBling(bling, _blingPoints.geometry);
    currentTime = performance.now();
    _updateUniverse(endValue[0], universe.material);
  
    for(var i = 0; i < options.number; i++)
    {
      _updateGalaxy(endValue[i], galaxies[i].material);
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    }
  }
}
