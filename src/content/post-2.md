---
title: "React Hooks and NamedEffect (Custom wrapper around useEffect)"
date: "2020-07-18"
draft: false
path: "/blog/react-hooks-and-named-effect"
---

A few months ago we had to create a new client project at work, and even though I was not a fan of React's Hooks API when it was first introduced, I thought it was a good opportunity to test it out in practice.

When first introduced I was a bit concerned with hooks as they seemed to make pure function act like stateful ones, maybe making the debugging of the code harder to follow, and making it easier for unexpected side effects to creep in. Overall it was not clear to me what problems the new Hooks API were trying to tackle on in the first place.
Then after using them for a while, I realized hooks are introducing a way to encopsulate resuable functionality and logic, that was actually much needed in React.

The strongest point of using Hooks API is custom hooks. If utilized correctly, you can abstract away repeated logic under a variety of custom hooks services.
Instead of the arbitrary separation of stateful/stateless or container/representational components, which requires the developer to create a mental picture of different types of components and their purposes, with React hooks you can now combine related logic under custom hooks and use them only where they are needed.
Those mental separations seem redundant when using hooks. The components themselves are always responsible for just rendering the UI elements, while custom hooks are responsible for managing data changes and processing, and forcing the component to update them when the hook decides on it.

One thing that I noticed about using hooks is that the useEffect hook seems to have too much responsibilities.
A complex component can often have multiple useEffect lined-up one after another and this can really compromise the readability of the code, because there is no easy way to know how a particular useEffect affects the code without going over what variables the dependency array contains, and what is the combination of values of those variables that intrigues a change (the if condition that is usually found inside the body of a useEffect).

## Named Effects

This is a small wrapper around useEffect that I created so it can be easier to understand what a particular effect is trying to achieve.
It is available to use under 'named-effect':

> npm install named-effect

A typical useEffect hook usage might look like this:
```js
const [currentLayout, setLayout] = useState(0);

useEffect(() => {
    if (currentLayout === 3) {
        // Do something when the current layout is 3
    }
}, [currentLayout]);
```

Most of the time we don't want our code to run whenever every value in the dependency array changes, we just want to run the effect when the right combination of those values are present. With named-effect the same useEffect can be written like this:

```js
const [currentLayout, setLayout] = useState(0);
const onLayoutThree = namedEffect([currentLayout], () => currentLayout === 3).bind(useEffect);

onLayoutThree(() => {
    // Do something when the current layout is 3
});
```

This way the code is much more readable (more so when the dependency array is larger than one) and it is very clear what your effect does. It also forces the developer to define and understand what he is using the useEffect hook for.

The namedEffect function is pretty simple to implement. This is what it looks like:

```js
const useNamedEffect = (dependecies = [], evaluator, cleanup) => {
  const namedEffect = function (cb) {
    try {
      this(() => {
        if (!evaluator && cb) {
          cb(...dependecies); return;
        }
        if (evaluator && evaluator()) {
          cb(...dependecies);
        }

        if (cleanup) return cleanup
      }, dependecies)
    } catch (e) {
      throw new Error('Make sure to bind useEffect in-order to use namedEffect.');
    }
  };
  return namedEffect;
}

export default useNamedEffect;
```

That aside, I think React's Hooks API are a step in the right direction and I personally prefer not using classes at all in my projects (except for an error boundary).