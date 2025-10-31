# Codes for integrating the Lorenz and Chua systems.

This repository contains small C source codes to integrate the Lorenz and Chua systems using the fourth order Runge-Kutta method. The aim of these codes is to split the numerical tasks and the visualisation-interactivy parts completely. Numerical methods in C/C++, Python, Julia and some other languages are often coded for already, but need to be runned locally. On the other hand JS and web-development frameworks in general offer a lot of great libraries and support to carry out amazing visualisations and animations. Thus, this project is aimed to explore the possibilities of dealing with those two aspects independently.

By far my favorite JS library to display results of simulations is [three.js](https://threejs.org/) and WebGL. There are of course many others. Here I provide codes to test how to add your C code results into a website by compiling it using the [emscripten](https://emscripten.org/) compiler.

Four files are provided two codes for standalone compilation and two used to compile using emcc for usage in on-line live demos.

The results of these experiments can be live played with here:

[Lorenz live demo](https://calugo.github.io/Lorenz-Chua-WASM/Lorenz.html)


[Chua live demo](https://calugo.github.io/Lorenz-Chua-WASM/Chua.html)

A legacy jupyter notebook, is also in the repository, it has some code to make pretty figures. All these code was originally inspired by the Open Plant initiative. 


## Standalone codes.

### Lorenz equations:

$$
\begin {array}{ccl}
\dot{x}& = & \sigma(y-x)\\
\dot{y}& = & x(\rho-z)-y\\
\dot{z}& = & xy-\beta z
\end {array}
$$


* `lorenz.cc` can be compiled with `g++ -o lorenz lorenz.cc` It should be excecuted  as `./lorenz xo yo zo sigma rho beta Tf` where `xo yo zo` should be the values of the initial condition. And `sigma rho beta` represent the parameters of the equations. `Tf` is the final time of integration. Example `./lorenz 1.0  .0 0.0 10 18 0.8 100`.

* `rklorenz.cc` contains the same functions and the code in the file above, but encapsulated to be compiled and exposed as a javascript file. The compilation is with `emcc` is carried out as: 
` emcc rklorenz.cc -o rklorenz.js -sEXPORTED_RUNTIME_METHODS=ccall,cwrap -sEXPORT_ES6 -sMODULARIZE -sMALLOC=dlmalloc -sALLOW_MEMORY_GROWTH=1 -sEXPORTED_FUNCTIONS=_malloc,_free,_integrals,_rk,_Xn,_Yn,_Zn`. This will generate the files `rklorenz.js` and `rklorenz.wasm`. 

#### JS usage.

The code returns an array with the values of $x,$ $y$ and $z$ arranged in blocks of three consecutive values. To invoke the function this needs to be imported in a js file. This can be done as follows:

* Import the module `import Module from './rklorenz.js';`
* Setup the heap buffer array to store the results:

```
const Np = 2*5001;  //Number of points to be used. 
                    //This should match the points returned in the c code 
const NL = 3*Np;    //Array size
const mymod = await Module();

//This is the function which is invoked, the arguments are:
//`integrals` the name of the method carrying out the integration.
//`number` the return value type.
//`['number','number','number', //The initial conditions
//  'number','number','number', //Sigma,Rho,Beta
//  'number', //The buffer array
//  'number'  //The array size
//  ]

var rklorenz = mymod.cwrap('integrals', 'number', ['number','number','number',
						    'number','number','number',
						    'number','number','number']);

let rn = new Float64Array( Array(NL).fill(1.0) );

//Heap Memory allocation sizes and array
let nDataBytes = rn.length * rn.BYTES_PER_ELEMENT;
let dataPtr = mymod._malloc(nDataBytes);
let dataHeap = new Float64Array(mymod.HEAPF64.buffer, dataPtr, nDataBytes);
```

Once this is done, we can call the method anywhere we want as follows:

```
//Executes the code and copy the result to a JS array we can use.

let qn = rklorenz(Xo,Yo,Zo,Sig,Rho,Beta, 100, dataHeap.byteOffset,rn.length)
var result = new Float64Array(dataHeap.buffer, dataHeap.byteOffset, rn.length);				

```

### Chua's Equations.

$$
\begin {array}{ccl}
\dot{x}& = & \alpha(y-x-\phi(x))\\
\dot{y}& = & x-y+z\\
\dot{z}& = & -\beta y
\end {array}
$$

Where $\phi(x)=m_1x+(0.5)(m_0-m_1)( |x+1| - |x-1| )$. For this case we now have and extra parameter.

The standalone compilations and usage lines are  `g++ -o chua chua.cc`, and `./chua xo yo zo a m0 m1 b Tf`. For instance: `./chua 0.7 0.0 0.0 15.6 -1.14 -0.71 28 50`.

To compile the functions exposed in `rkchua.cc` I use the line: 

`emcc rkchua.cc -o rkchua.js -sEXPORTED_RUNTIME_METHODS=ccall,cwrap -sEXPORT_ES6 -sMODULARIZE -sMALLOC=dlmalloc -sALLOW_MEMORY_GROWTH=1 -sEXPORTED_FUNCTIONS=_malloc,_free,_integrals,_rk,_Xn,_Yn,_Zn,_g1 ` 

Which exposes the functions required to generate the js module `rkchua.js`.

The way to use this is the same as the one described for the Lorenz code. The only difference is to declare the prototype with the right number of parameters.

```
var rkchua = mymod.cwrap('integrals', 'number', ['number','number','number',
						'number','number','number',
						'number','number','number','number']);

let rn = new Float64Array( Array(NL).fill(1.0) );
let nDataBytes = rn.length * rn.BYTES_PER_ELEMENT;
let dataPtr = mymod._malloc(nDataBytes);
let dataHeap = new Float64Array(mymod.HEAPF64.buffer, dataPtr, nDataBytes);
```
Then use it somewhere else in your script as:

```
rkchua(Xo,Yo,Zo,a,M0,M1,b, 100, dataHeap.byteOffset,rn.length)
var result = new Float64Array(dataHeap.buffer, dataHeap.byteOffset, rn.length);
```


