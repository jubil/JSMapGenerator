import * as THREE from "../libs/three/three.module.js";
import { OrbitControls } from "../libs/three/addons/controls/OrbitControls.js";
import { FBXLoader } from "../libs/three/addons/loaders/FBXLoader.js";

let FOV = 80;
let VIEW_DISTANCE = 1000;

const manager = new THREE.LoadingManager();
let loader = new FBXLoader(manager);

const scene = new THREE.Scene();
//scene.background = new THREE.Color(0x82c8e5);
//scene.fog = new THREE.Fog(0xcccccc, 50, 900);

const camera = new THREE.PerspectiveCamera(
  FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  VIEW_DISTANCE
);

camera.position.x = 1500
camera.position.y = 500
camera.position.z = 1500

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.5));
//scene.add(new THREE.AmbientLight( 0xff0000 ))

const dirLight = new THREE.DirectionalLight(0xffffff, .5);
dirLight.position.set(0, 10, 10);
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xffffff, .5);
dirLight2.position.set(-10, 10, 0);
scene.add(dirLight2);


// Load Map
drawMap(scene, generateMapJson());

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 3;
orbitControls.maxDistance = 150;
orbitControls.enablePan = true;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// UPDATE METHODE
//const clock = new THREE.Clock();
function animate() {
  //let mixerUpdateDelta = clock.getDelta();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// Création du rendu de la Map
function drawMap(scene, json) {
  console.log("drawMap()", json);

  //TODO WIP
  console.log(json.centre);
  for (let x = 0; x < json.width; x++) {
    for (let z = 0; z < json.height; z++) {
      if (json.centre[z][x]) {
        loadFbx("SalleVide", 13 + x * 24, 13 + z * 24);
      }
    }
  }

  for (let x = 0; x < json.width + 1; x++) {
    for (let z = 0; z < json.height + 1; z++) {
      if (json.coins[z][x]) {
        loadFbx("Coin", 1 + x * 24, 1 + z * 24);
      }
    }
  }

  for (let x = 0; x < json.width; x++) {
    for (let z = 0; z < json.height + 1; z++) {
      if (json.murHorizontaux[z][x]) {
        loadFbx("Mur" + json.murHorizontaux[z][x], 13 + x * 24, 1 + z * 24);
      }
    }
  }

  for (let x = 0; x < json.width + 1; x++) {
    for (let z = 0; z < json.height; z++) {
      if (json.murVerticaux[z][x]) {
        loadFbx("Mur" + json.murVerticaux[z][x], 1 + x * 24, 13 + z * 24, true);
      }
    }
  }
  //

  //loadFbx("Porte", 11, 1);
}

// TODO Remplacer bouchon. Mettre dans un autre fichier
function generateMapJson() {
  //return JSON.parse(new MapGenerator().generate());
  let map = {
    width: 14,
    height: 13,
    centre: [
      [0,0,0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,1,1,0,1,1,1,1,0,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
    ],
    coins: [
      [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],
    ],
    murHorizontaux: [
      [0,0,0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,1,1,0,1,2,1,1,0,1,1,0,0],
      [0,1,2,1,1,1,3,2,2,1,1,2,1,0],
      [0,1,3,1,2,1,3,2,2,1,1,3,1,0],
      [1,2,3,2,2,1,2,1,1,2,2,3,1,1],
      [1,2,3,2,1,3,1,2,3,2,2,3,1,1],
      [0,1,2,1,1,3,1,1,3,1,1,3,1,0],
      [0,1,3,1,1,3,1,1,3,1,1,3,1,0],
      [0,1,3,1,1,2,3,2,2,1,1,2,1,0],
      [0,1,1,3,1,1,3,1,1,1,3,1,1,0],
      [0,0,1,2,1,1,2,1,2,1,3,1,0,0],
      [0,0,1,1,2,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,3,3,3,3,3,3,1,0,0,0],
      [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
    ],
    murVerticaux: [
      [0,0,0,0,0,0,1,2,1,0,0,0,0,0,0],
      [0,0,1,3,1,1,2,2,1,1,1,3,1,0,0],
      [0,1,2,2,1,1,2,3,3,2,1,2,2,1,0],
      [0,1,1,1,1,1,2,1,1,1,1,1,2,1,0],
      [2,2,3,3,3,2,3,3,3,2,3,3,3,2,1],
      [0,1,1,1,2,1,2,1,1,1,1,1,2,1,0],
      [0,1,2,2,1,2,2,1,2,2,1,2,2,1,0],
      [0,1,2,2,1,2,3,3,3,2,1,2,2,1,0],
      [0,1,2,3,2,1,1,1,1,1,2,3,2,1,0],
      [0,0,1,2,2,1,2,2,1,1,2,2,1,0,0],
      [0,0,1,2,3,3,3,3,3,3,3,2,1,0,0],
      [0,0,0,1,2,3,1,3,1,3,1,1,0,0,0],
      [0,0,0,0,1,3,1,3,2,3,1,0,0,0,0],
    ],
  };
  return map;
}

// TODO A REFACTO
function loadFbx(asset, x, z, rotation) {
  loader.load("assets/map/" + asset + ".fbx", function (object) {
    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.morphTargetDictionary) {
          Object.keys(child.morphTargetDictionary).forEach((key) => {
            meshFolder.add(
              child.morphTargetInfluences,
              child.morphTargetDictionary[key],
              0,
              1,
              0.01
            );
          });
        }
        //console.log(child)
        //child.material.wireframe = true;
      }
    });

    //console.log(object);
    object.scale.x = 0.05;
    object.scale.y = 0.05;
    object.scale.z = 0.05;

    object.position.x = x;
    object.position.y = -1;
    object.position.z = z;

    if (rotation) {
      object.rotation.y = Math.PI / 2;
    }
    scene.add(object);
    //return object;
  });
}

// TODO A SUPPR
document.addEventListener("keypress", (event) => {
  if (event.key == "z") {
    camera.position.z -= 1;
  }
  if (event.key == "q") {
    camera.position.x -= 1;
  }
  if (event.key == "s") {
    camera.position.z += 1;
  }
  if (event.key == "d") {
    camera.position.x += 1;
  }
  if (event.key == "e") {
    camera.rotation.y -= Math.PI / 64;
  }
  if (event.key == "a") {
    camera.rotation.y += Math.PI / 64;
  }
});
