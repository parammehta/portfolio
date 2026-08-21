const fs = require('fs-extra');

// Copy draco decoder from three.js into the public directory
fs.copy('node_modules/three/examples/jsm/libs/draco/gltf/', 'public/draco', err => {
  if (err) return console.error(err);
});

// Copy device .glb models into the public directory, matching the default
// basePath refract-ui's deviceModels resolves against.
fs.copy('node_modules/refract-ui/dist/assets/iphone-11.glb', 'public/models/iphone-11.glb', err => {
  if (err) return console.error(err);
});
fs.copy('node_modules/refract-ui/dist/assets/macbook-pro.glb', 'public/models/macbook-pro.glb', err => {
  if (err) return console.error(err);
});
