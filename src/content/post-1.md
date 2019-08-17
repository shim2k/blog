---
title: "Three.js, Web Workers and OffscreenCanvas in React"
date: "2019-08-12"
draft: false
path: "/blog/offscreen-canvas-react-three-js-web-workers"
---


Three.js gives us the ability to create and display animated 2D and 3D graphics inside the browser.
It uses WebGL to render graphics inside an HTML `<canvas>` element.

Unfortunately, complex scenes can take time to render into the screen. While doing so, the main thread is too busy to handle events and to process other logic, which will freeze your application, and make it unresponsive while Three.js rendering is in process.

In order to solve this problem, we are going to use two Web APIs interfaces: Web Workers and OffscreenCanvas.

---
## Web Workers

Web Workers are a way for web applications to run scripts in background threads. 
A worker thread can perform heavy tasks without interfering directly with the main thread, and thus user experience is not undermined while executing those tasks.

- Web Workers have various limitation including not being able to access the DOM and therefore they cannot create or update DOM elements directly.

Both `window` and `worker` interfaces implement the following properties in order to communicate with each other:  
- `postMessage`: A method which allows us to broadcast an object to other `window` and `worker` contexts. 
- `onmessage`: An event handler which is called each time a message is sent via `postMessage`.

Let's start by creating our three.js worker. Here is how a worker might use those properties:
```js
// threejs.worker.js

const handlers = {
    run
};


// self is provided to us by the `worker-loader`
self.onmessage = function (e) {
  
    let message = e.data;
    
    // We check whether we have a handler for this message type.
    const handler = handlers[message.type];
    if (!handler) throw new Error(`no handler for type: ${message.type}`);

    // If so, we call it.
    handler(message);
};

function run () {
    ...
    self.postMessage({type: 'run', data: results})
}
```

> Every time `window` is sending the worker a message, it will determine which corresponding handler needs to be executed. 
That handler might invoke worker.postMessage if it has results to send back to the window.

This worker can used like this:
```js
// main.js
import Worker from './threejs.worker';

let worker = new Worker();

worker.postMessage(
  {type: 'run'}
);

```
> This will trigger the `run` function inside the worker's scope.
-----
## OffscreenCanvas

The canvas OffscreenCanvas interface is available as of Chrome 69 and Firefox 46 versions, 
and it provides us with the capability to control and render elements inside a canvas off-screen. 
it is available in both window and worker contexts.

Because Three.js uses canvas in order to render its 3D elements, we should be able to offload the rendering into a Web Worker.
This can boost the performance and responsiveness of web applications significantly.

Here is how the `OffscreenCanvas` interface is utilized:

```js
let canvas = document.getElementById('canvas');

let offscreen = canvas.transferControlToOffscreen()
```
> We invoke the transferControlToOffscreen method on `canvas` which returns an `OffscreenCanvas` object and assigns it to `offscreen`.
After we do that, the original `canvas` that is displayed on the page cannot be used to render elements. It will just display whatever you render with `offscreen`.

---
# Integrating it into React

Since most React applications use a build tool to process source code into a bundled file. 
This makes it tricky it we want to use web workers in your code, since a web worker needs a separate file 
in order to work (even though this can be overcome using blobs, but is not recommended).

This section assumes you are using `Webpack` as your build tool.

#### Adding support for Web Workers
Create-React-App 2.0 already comes with Web Workers support opt-in. It uses the convention that files ending with .worker.js can be utilized as web workers.

For ejected CRA projects we want to install the `worker-loader` and `thread-loader` packages ourselves, 
and add this code to our `webpack.config.dev.js` file, near the babel loader for js files:

```js
...
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
...
```
>> Full config is available in this [commit](https://github.com/facebook/create-react-app/pull/3934/commits/2ec7eaa00702d0a4823b7c9078c10bfc00e73a40).
>> For more information on how to integrate this webpack loader refer to [worker-loader](https://github.com/webpack-contrib/worker-loader).

So now that we have web workers enabled within our build system, let's start by creating a component to display our Three.js scenes:

Let's combine these concepts and create a React component and a Worker:
```js
// component.jsx

import React, {Component} from 'react';

// importing a file ending with .worker.js to be the worker:
import Worker from './scene.worker';

class ThreeJSView extends Component {

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

        // Creating an OffscreenCanvas element. 
        // Rendering changes in this object will be reflected
        // and displayed on the original canvas.
        const offscreenCanvas = canvas.transferControlToOffscreen();

        // worker.postMessage is a method which 
        // sends a message to the worker's inner scope.
        this.worker.postMessage({
            type: 'run',
            canvas: offscreenCanvas,
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
> The component will instantiate a worker in its constructor, then after it is mounted we handle the the communication with the worker.

Let's create the worker file:
```js
// threejs.worker.js

import * as THREE from 'three';

// We define the handlers for the various message types
const handlers = {
    run
};

self.onmessage = function (e) {
  
    let message = e.data;
    
    // We check whether we have a handler for this message type.
    const handler = handlers[message.type];
    if (!handler) throw new Error(`no handler for type: ${message.type}`);

    // If so, we call it.
    handler(message);
};

function create3DCylider () {
    const geometry = new THREE.CylinderGeometry(5, 5, 5, 32);
    const material = new THREE.MeshBasicMaterial({color: 'red'});
    return new THREE.Mesh(geometry, material);
}

function run (message) {
  
  let { canvas } = self;
  
  let cylider = self.create3DCylider()
  let scene = new THREE.Scene();
  scene.add(cylider);
  
  let renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, preserveDrawingBuffer});
  
  ...
  
  // After we done rendering we can tell the main thread we are done.
  self.postMessage({type: 'resolved'});
}
```

> As you can see, the `run` function is creating a Three.js cylinder element, a scene and a renderer.
It is also emitting an event once the rendering is completed, to let the React component know about it.

# Conclusion
If you are using Three.js heavily inside your React application you might want to consider using OffscreenCanvas 
and Web Workers to improve the responsiveness and performance of your application and make better use of multi-core systems. 
This code this very minimal but its purpose is to encourage more use of background rendering for Three.js.