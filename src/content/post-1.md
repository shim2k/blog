---
title: "Three.js, Web Workers and OffscreenCanvas in React"
date: "2019-08-12"
draft: false
path: "/blog/offscreen-canvas-react-three-js-web-workers"
---


Three.js gives us the ability to create and display animated 3D graphics inside the browser.
It uses WebGL, Canvas and SVG in order to render the graphics.

Unfortunately, complex scenes can take time to render into the screen and while doing so, the main thread is too busy to handle events and process other logic, which will freeze your application amd make it unresponsive while Three.js rendering is in process.

In order to solve this problem, we are going to use to use two Web APIs interfaces:

### Web Workers

Web Workers are a way for web applications to run scripts in background threads. 
A worker thread can perform heavy tasks without interfering directly with the main thread, and thus user experience is not undermined.

Workers can only interact with the main thread by listening to the `onmessage` event and by sending a message with the `postMessage` method.

They also have various limitation including not being able to access the DOM and therefore cannot create or update DOM elements

### OffscreenCanvas

The OffscreenCanvas interface for canvas is available as of Chrome 69 and Firefox 46 versions 
and it provides us with the capability to render canvas off screen, as the name suggests. it is available in both the window (the main thread) and worker contexts.


Because Three.js uses canvas in order to render its 3D elements, we should be able to offload the Three.js rendering into OffscreenCanvas under a Web Worker.
This can boost the performance and responsiveness of web applications significantly.

# Integrating into React

This tutorial assumes a Create-React-App 2.0 project or a Webpack-based build process (can be an ejected CRA)

First of all, we would like to add Web Workers into our build system.
Fortunately, CRA 2.0 already comes with Web Workers support opt-in, with the convention that files ending with .worker.js will be Workers

For ejected CRA projects you need to install the `worker-loader` and `thread-loader` packages add the following module in your webpack config:

```js
{
  test: /\.worker\.(js|jsx|mjs)$/,
  include: paths.appSrc,
  use: [
    require.resolve("worker-loader"),
    // This loader parallelizes code compilation, it is optional but
    // improves compile time on larger projects
    require.resolve("thread-loader"),
    {
      loader: require.resolve("babel-loader"),
      options: {
        // @remove-on-eject-begin
        babelrc: false,
        presets: [require.resolve("babel-preset-react-app")],
        // @remove-on-eject-end
        // This is a feature of `babel-loader` for webpack (not Babel itself).
        // It enables caching results in ./node_modules/.cache/babel-loader/
        // directory for faster rebuilds.
        cacheDirectory: true,
        highlightCode: true,
      },
    },
  ],
}
```

For more information on how to integrate this webpack loader refer to [worker-loader](https://github.com/webpack-contrib/worker-loader).

So now that we have Web Workers enabled, lets start by creating a component to display our Three.js scenes:

```js
// component.jsx

import React, {Component} from 'react';

// importing a file ending with .worker.js to be the worker:
import Worker from './scene.worker';

class SceneView extends Component {

    constructor(props) {
        super(props);
        
        // Instantiating the worker
        this.worker = new Worker()
        this.state = {
            isLoaded: false
        }
    }

    componentDidMount = () => {
        let {canvas} = this;
        let {clientHeight, clientWidth} = canvas;

        // Creating an OffscreenCanvas element. 
        // Rendering changes in this object will be reflected
        // and displayed on the original canvas.
        const offscreenCanvas = canvas.transferControlToOffscreen();

        // worker.postMessage is a method 
        // which sends a message to the worker's inner scope.
        this.worker.postMessage({
            type: 'run',
            canvas: offscreenCanvas,
            sizes: {width: clientWidth, height: clientHeight}
        }, [offscreenCanvas]);

        // worker.onmessage event will be invoked by the worker
        // whenever the rendering process is done.
        this.worker.onmessage = (event) => {
            if (event.data.type === 'resolved')
                this.setState(({isLoaded: true}))
        };
    };

    componentWillUnmount() {
      
        // Sending a message to the worker 
        // so it can stop the Three.js animation process
        this.worker.postMessage({type: 'stop'});
    }

    render() {
        return (
            <div>
                <canvas
                    style={{width: '100%', height: '100%'}}
                    ref={(view) => {
                        this.canvas = view
                    }}>
                </canvas>
                {
                    this.state.isLoaded ? null : <div>Loading...</div>
                }
            </div>
        )
    }
}
```
The component will instantiate a worker in its constructor, 
then after it is mounted we handle the the communication with the worker.

This is the object that we are sending to the worker:
```js
{
  type: 'run', // indicates which function in the worker's scope we would like to execute.
  canvas: offscreenCanvas, canvas, // contains the OffscreenCanvas element that the worker will use for rendering
  sizes: {width: clientWidth, height: clientHeight} // contains the canvas sizes which are not available under the OffscreenObject
}    

```


Let's create the worker file:
```js
// scene.worker.js

import * as THREE from 'three';

// We define the handlers for the various message types
const handlers = {
    run,
};

self.onmessage = function (e) {
    
    // We check whether we have a handler for this message type.
    // If so, we call it.
    const fn = handlers[e.data.type];
    if (!fn) throw new Error(`no handler for type: ${e.data.type}`);

    fn(e.data);
};

function createCylider () {
    const geometry = new THREE.CylinderGeometry(5, 5, 5, 32);
    const material = new THREE.MeshBasicMaterial({color: 'red'});
    return new THREE.Mesh(geometry, material);
}

function run (message) {
  
  let { canvas } = message;
  let cylider = self.createCylider()
  
  let scene = new THREE.Scene();
  scene.add(cylider);
  
  let renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, preserveDrawingBuffer});
  
  ...
  
  self.postMessage({type: 'resolved'});
}
```

The onmessage event handler is implemented and routes the message to the right function.

As you can see, the `run` function is creating a Three.js cylinder element, a scene and a renderer.
Once rendered

It is also emits an event once the rendering is completed to let the React component know about it.

# Conclusion
If you are using Three.js heavily inside your React application you might want to consider using OffscreenCanvas 
and Web Workers to improve the responsiveness and performance of your appm and make better use of multi-core systems. 
Of course this code this very minimal but its purpose is to encourage more use of background rendering for Three.js.