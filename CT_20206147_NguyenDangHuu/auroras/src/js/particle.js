import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import {Vector, Curve} from "./vector.js";
import  {ParticleSystem} from "./aurora.js";
import GUI from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/libs/lil-gui.module.min.js"


var scene = new THREE.Scene();
scene.background = new THREE.Color(0.3,0.3,0.3);

var camera = new THREE.PerspectiveCamera( 20, window.innerWidth/window.innerHeight, 0.1, 10000 );
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = -1000;
const initialCameraPosition = camera.position.clone();
const initialCameraRotation = camera.rotation.clone();

var canvas = document.getElementById("canvas");
var renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize(window.innerWidth, window.innerHeight); 
document.body.appendChild(renderer.domElement);

var controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 1.0;
controls.enablePan=true;
controls.maxPolarAngle= Math.PI/2;
controls.screenSpacePanning = true;
controls.minPolarAngle = Math.PI/2;
controls.maxPolarAngle = Math.PI/2;

/***************Define light and shadows************************************************************************************************************** */


var ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
scene.add(ambientLight);


var pointLight = new THREE.PointLight(0xffffff);
pointLight.intensity = 0.9;
scene.add(pointLight);

renderer.shadowMap.enabled = true; 
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 500;
pointLight.shadow.radius = 5.0;




let materialArray = [];
let texture_ft = new THREE.TextureLoader().load("./textures/px.png");
let texture_bk = new THREE.TextureLoader().load("./textures/nx.png");
let texture_up = new THREE.TextureLoader().load("./textures/py.png");
let texture_dn = new THREE.TextureLoader().load("./textures/ny.png");
let texture_rt = new THREE.TextureLoader().load("./textures/pz.png");
let texture_lf = new THREE.TextureLoader().load("./textures/nz.png");

materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));

for (let i = 0; i < 6; i++) materialArray[i].side = THREE.BackSide;
let skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
let skybox = new THREE.Mesh(skyboxGeo, materialArray);
scene.add(skybox);
skybox.position.set(0,-700,-200);


var aurora = {
    numberOfAuroras: 1,
    upColor: new THREE.Color(1,0,0),
    downColor: new THREE.Color(0,1,0)
}

var number = 0;

const gui = new GUI().open();
gui.add(aurora, "numberOfAuroras", 1, 3, 1).name("Number of auroras")
.onChange(() => {
    reset();
    createAuroras();
})
gui.addColor({ color: aurora.upColor.getHexString()}, "color")
.name("Color 1")
.onChange((hex) => {
  const { r, g, b } = new THREE.Color(hex)
  aurora.upColor.r = r
  aurora.upColor.g = g
  aurora.upColor.b = b
})
gui.addColor({ color: aurora.downColor.getHexString()}, "color")
.name("Color 2")
.onChange((hex) => {
  const { r, g, b } = new THREE.Color(hex)
  aurora.downColor.r = r
  aurora.downColor.g = g
  aurora.downColor.b = b
})

var n = 150;
var b = 1;
var phi_i = 0;
var phi_f = Math.PI/3;
var w = 0.05;
var wl = 90;
var B = new Vector(0,0,3e5-1);



var auroras = [];

createAuroras();

function createAuroras()
{
    console.clear();
    number = aurora.numberOfAuroras;
    var Pi = [];
    var Pf = [];
    if(aurora.numberOfAuroras == 1)
    {
        Pi.push(new Vector(-1000,1000,0));
        Pf.push(new Vector(1000,0,0));
    }
    if(aurora.numberOfAuroras == 2)
    {
        Pi.push(new Vector(-100,1000,0));
        Pf.push(new Vector(-1000,500,0));
        Pi.push(new Vector(-90,1000,0));
        Pf.push(new Vector(1000,500,0));
    }
    if(aurora.numberOfAuroras == 3)
    {
        Pi.push(new Vector(300,1000,0));
        Pf.push(new Vector(-1000,500,0));
        Pi.push(new Vector(325,1000,0));
        Pf.push(new Vector(1000,500,0));
        Pi.push(new Vector(300,1000,0));
        Pf.push(new Vector(-1000,1000,0));
    }
    for(var i = 0; i < aurora.numberOfAuroras; i++)
    {
        var seedx = Math.random()*1000;
        var seedy = Math.random()*1000;
        var aaa = new Curve();
        var {x:X1, y:Y1} = aaa.generate_curve(Pi[i], Pf[i], n, phi_i, wl, B, seedx, seedy);
        auroras.push(new ParticleSystem({
            parent: scene,
            camera: camera,
        }, X1, Y1));
    }
    
    if(aurora.numberOfAuroras == 1)
    {
        auroras[0]._CreateParticles(20,100);
    }
    if(aurora.numberOfAuroras == 2)
    {
        auroras[0]._CreateParticles(5,100);
        auroras[1]._CreateParticles(3,100);
    }
    if(aurora.numberOfAuroras == 3)
    {
        auroras[0]._CreateParticles(3.5,100);
        auroras[1]._CreateParticles(1.7,100);
        auroras[2]._CreateParticles(20,100);
    }

    animate();
}

function reset()
{
    for(var i = 0; i < number; i++)
    {
        auroras[i]._auroraPoints.geometry.dispose();
        auroras[i]._auroraPoints.material.dispose();
        auroras[i]._particlesList = [];
        auroras[i].pos = [];
        scene.remove(auroras[i]._auroraPoints);
    }
    auroras = [];
    camera.position.copy(initialCameraPosition);
    camera.rotation.copy(initialCameraRotation);
}


function animate() 
{
    requestAnimationFrame(animate);

    for(var i = 0; i < aurora.numberOfAuroras; i++)
        auroras[i].LightOn(aurora.upColor, aurora.downColor);

    controls.update();
    renderer.render(scene, camera);
}