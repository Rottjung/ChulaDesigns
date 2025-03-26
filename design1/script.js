const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.z = 50;

const articles = [
    { title: "Article 1", year: 2020, id: 1 },
    { title: "Article 2", year: 2021, id: 2 },
    { title: "Article 3", year: 2022, id: 3 },
    { title: "Article 4", year: 2023, id: 4 },
];

const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });

articles.forEach((article) => {
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
    );
    sphere.userData = { article };
    scene.add(sphere);
});

// Raycaster for clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject.userData.article) {
            alert(`Article: ${clickedObject.userData.article.title}`);
        }
    }
});

// Filter by year
document.getElementById('yearFilter').addEventListener('change', (e) => {
    const year = e.target.value;
    scene.children.forEach((obj) => {
        if (obj.userData.article) {
            obj.visible = year === 'all' || obj.userData.article.year == year;
        }
    });
});

function animate() {
    requestAnimationFrame(animate);
    scene.children.forEach((obj) => {
        obj.rotation.x += 0.001;
        obj.rotation.y += 0.001;
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();
