import {vec3, mat3, mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import RoadMap from './RoadMap';
import Square from './geometry/Square';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Terrain: true,
  Population: true,
  Land_Water: false,
  Population_Density: 2,
  Highway_Branches: 2,
};

let screenQuad: ScreenQuad;
let square: Square;
let time: number = 0.0;
let roads: RoadMap;
let prevDensity: number;
let branches: number;

function loadScene(road: RoadMap) {
  square = new Square();
  square.create();
  let transforms: mat4[] = road.getTransforms();
  let n: number = transforms.length;
  console.log("n: " + n);
  let col1Arr = [];
  let col2Arr = [];
  let col3Arr = [];
  let col4Arr = [];
  let colorsArr = [];

  for (var i = 0; i < n; i++) {
    let transform: mat4 = transforms[i];
    // console.log(transform);
    
    col1Arr.push(transform[0]);
    col1Arr.push(transform[1]);
    col1Arr.push(transform[2]);
    col1Arr.push(transform[3]);

    col2Arr.push(transform[4]);
    col2Arr.push(transform[5]);
    col2Arr.push(transform[6]);
    col2Arr.push(transform[7]);

    col3Arr.push(transform[8]);
    col3Arr.push(transform[9]);
    col3Arr.push(transform[10]);
    col3Arr.push(transform[11]);

    col4Arr.push(transform[12]);
    col4Arr.push(transform[13]);
    col4Arr.push(transform[14]);
    col4Arr.push(transform[15]);

    colorsArr.push(0);
    colorsArr.push(0);
    colorsArr.push(0);
    colorsArr.push(1);
  }

  let colOne: Float32Array = new Float32Array(col1Arr);
  let colTwo: Float32Array = new Float32Array(col2Arr);
  let colThree: Float32Array = new Float32Array(col3Arr);  
  let colFour: Float32Array = new Float32Array(col4Arr);
  let colors: Float32Array = new Float32Array(colorsArr);

  square.setInstanceVBOs(colOne, colTwo, colThree, colFour, colors);
  square.setNumInstances(n);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Terrain');
  gui.add(controls, 'Population');
  gui.add(controls, 'Population_Density', 1, 5).step(1);
  gui.add(controls, 'Highway_Branches', 2, 3).step(1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  // loadScene();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/texture-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/texture-frag.glsl')),
  ]);

  // Texture! Rendering!
  // From CIS460 HW4
  // http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-14-render-to-texture/
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
  var frameBuffer = gl.createFramebuffer();
  var texture = gl.createTexture();
  var renderBuffer = gl.createRenderbuffer();

  // Bind framebuffer to the context
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  // Bind so that following texture commands will be connected 
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Generate a blank texture/image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
  // Set the render settings for the texture we've just created.
  // Essentially zero filtering on the "texture" so it appears exactly as rendered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  // Clamp the colors at the edge of our texture
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  
  // Initialize depth buffer
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
  
  // Sets the color output of the fragment shader to be stored in GL_COLOR_ATTACHMENT0, which we previously set to m_renderedTextures[i]
  gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
  
  // Attach texture to framebuffer as color attachment
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      console.log("Error with Framebuffer- not initialized correctly");
  }

  // Rendering to the framebuffer rather than the viewport
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Render on the whole framebuffer, complete from the lower left corner to the upper right
  gl.viewport(0, 0, window.innerWidth, window.innerHeight);
  // Clear the screen so that we only see newly drawn images
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderer.render(camera, flat, [screenQuad]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  var data = new Uint8Array(window.innerWidth * window.innerHeight * 4);
  gl.readPixels(0, 0, window.innerWidth, window.innerHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
  console.log(data[0] / 255 + ", " + data[1] / 255 + "," + data[2] / 255 + "," + data[3] / 255);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);  
  // gl.viewport(0, 0, window.innerWidth, window.innerHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  console.log("width " + window.innerWidth);
  roads = new RoadMap(data);
  loadScene(roads);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if (controls['Terrain'] == true) {
      textureShader.setTerrain(1.0);
    } else {
      textureShader.setTerrain(0.0);
    }

    if (controls['Population'] == true) {
      textureShader.setPopulation(1.0);
    } else {
      textureShader.setPopulation(0.0);
    }

    if (controls.Population_Density != prevDensity) {
      prevDensity = controls.Population_Density;
      textureShader.setPopDensity(prevDensity);
    }

    if (controls.Highway_Branches != branches) {
      branches = controls.Highway_Branches;
      roads.reset();
      roads.setBranches(branches);
      loadScene(roads);
    }

    renderer.render(camera, textureShader, [screenQuad]);
    renderer.render(camera, instancedShader, [square]);
    // renderer.render(camera, instancedShader, []);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
