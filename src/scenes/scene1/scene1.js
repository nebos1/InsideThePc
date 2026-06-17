import * as THREE from 'three';
import { GLTFLoader as GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const pcConfigURL = new URL('../../assets/3Dmodels/PCConfig.glb', import.meta.url).href;

export function buildScene1(group) {
    // light + shadow
    const hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.5);
    const dirLight = new THREE.DirectionalLight(0xcccccc, 1);
    dirLight.position.set(-2, 4, -10);
    dirLight.castShadow = false;
    group.add(hemiLight);
    group.add(dirLight);

    // model
    const pcConfig = new THREE.Object3D();
    const loader = new GLTFLoader();

    loader.load(pcConfigURL, (gltf) => {
        pcConfig.add(gltf.scene);
        group.add(pcConfig);

        pcConfig.scale.set(1.1, 1.1, 1.1);
        pcConfig.rotateY(5.01);
        pcConfig.rotateZ(-0.08);
        pcConfig.position.set(0, 0, 0);

        pcConfig.traverse((object) => {
            if (object.isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
    });

    return { pcConfig };
}
