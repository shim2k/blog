---
title: "OffscreenCanvas with React, Three.js and Web Workers"
date: "2019-08-12"
draft: false
path: "/blog/offscreen-canvas-react-three-js-web-workers"
---

Three.js gives us the ability to draw complex WebGL scenes relatively easily.
Unfortunately, rendering your scenes may take a few moments and to make things worse, it blocks the UI thread which will freeze your page and make it unresponsive while doing so.

There are multiple ways to integrate Three.js into our React app but we will choose the straightforward approach for this demonstration.



# Web Workers

Web Workers are a way for web applications to run scripts in background threads. 
The worker thread can perform tasks without interfering with the user interface.

We can move the rendering process of Three.js to Web Workers, thus keeping the UI thread clean and responsive.

```js
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```