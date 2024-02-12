import * as cannonEs from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/+esm';

globalThis.cannonEsEs = cannonEs;

const world = new cannonEs.World({
    gravity: new cannonEs.Vec3(0, -9.82, 0), // m/s²
})

// Create a sphere body
const radius = 1 // m
const sphereBody = new cannonEs.Body({
    mass: 5, // kg
    shape: new cannonEs.Sphere(radius),
})
sphereBody.position.set(0, 10, 0) // m
world.addBody(sphereBody)

// Create a static plane for the ground
const groundBody = new cannonEs.Body({
    type: cannonEs.Body.STATIC, // can also be achieved by setting the mass to 0
    shape: new cannonEs.Plane(),
})
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0) // make it face up
world.addBody(groundBody)