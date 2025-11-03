
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {FontLoader} from "three/addons/loaders/FontLoader.js";
import Module from './rkchua.js';


let container, camera, renderer;
let gui;

/////////////////
let a, M0, M1, b;
let Xo, Yo, Zo;
let run_button, clear_button,play_button;
let XBX,YBX,ZBX;
let RN = 0.0;
//////////////////
const nx0 = 45.0 
const ny0 = 10;
const nx1 = 0.0;  
const ny1 = 20.0;
///////////////
const Np = 10001;
const NL = 3*Np;
//const NL = 6;
const mymod = await Module();
var rkchua = mymod.cwrap('integrals', 'number', ['number','number','number',
												 'number','number','number',
												 'number','number','number','number']);


///////////
let rn = new Float64Array( Array(NL).fill(1.0) );
let nDataBytes = rn.length * rn.BYTES_PER_ELEMENT;
let dataPtr = mymod._malloc(nDataBytes);
let dataHeap = new Float64Array(mymod.HEAPF64.buffer, dataPtr, nDataBytes);
/////

let T = []; let X=[]; let Y=[]; let Z= [];
let pointsxyz = []; let colors = [];
let ptx = []; let pxt =[]; let pyt =[]; let pzt =[];
let Cx = [];
let Cy = [];
let Cz = [];
let Mx,My,Mz;

////		
let font;
const loader = new FontLoader();
var  textMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc2bfc9)});
let tXYZ = ['X','Y','Z'];
let k;

const scenes= [];
init();

function init() {


	for (let i=0;i<Np;i++){
		T[i]=i*1e-2;
	}

	a = 15.6;
	M0 = -1.14;
	M1 = -0.71;
	b = 28;
	Xo = 0.7; Yo = 0.0; Zo = 0.0;

	container = document.querySelector( '.container' );

	for (let i = 0; i<2; i++){

		const scene = new THREE.Scene();

		if (i==0){

			const frustumSize = 25.0;
			const aspect = 2*window.innerWidth / window.innerHeight;
			const camera = new THREE.OrthographicCamera( frustumSize * aspect / - 1.5, frustumSize * aspect / 1.5, frustumSize / 1.5, frustumSize / - 1.5, 0.1, 200 );
			 
		 	camera.position.x = 0;
		 	camera.position.y = 0;
		 	camera.position.z = 10.0;
			
			scene.userData.camera = camera;
			scene.background = new THREE.Color( 0x170b42);

			const controls = new OrbitControls( scene.userData.camera, container );
			controls.enableRotate = false;
			scene.userData.controls = controls;
		}

		if (i==1){

			const camera = new THREE.PerspectiveCamera( 50, 1, 1, 300 );
			camera.position.x = 30+ny1;
			camera.position.y = 30+ny1;
			camera.position.z = 30+ny1;
		
			scene.userData.camera = camera;
			scene.background = new THREE.Color( 0x000000 );

			const controls = new OrbitControls( scene.userData.camera, container );
			controls.enablePan = false;
			scene.userData.controls = controls;
		}
                       
		scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444, 3 ) );
		const light = new THREE.DirectionalLight( 0xffffff, 1.5 );
		light.position.set( 1, 1, 1 );
		scene.add(light)
		scenes.push(scene)

	}

	initMeshes();
	initGUI();
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setScissorTest( true );
	renderer.setAnimationLoop( animate );
	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize );
}

function initGUI(){
	gui = new GUI();

	const param ={
		'a': a,
		'M0': M0,
		'M1': M1,
		'b': b,
		'Xo': Xo,
		'Yo': Yo,
		'Zo': Zo,
		'Run':  RK,
		'Play': play,
		'Stop': clear,
		'X': true,
		'Y': true,
		'Z': true
		};

	gui.add(param, 'a',10.0,16,0.01 ).onChange( function (val){
		a = val;
	});


	gui.add(param, 'M0',-2.0,0.0,0.001 ).onChange( function (val){
		M0 = val;
	});


	gui.add(param, 'M1',-2.0,0.0,0.001 ).onChange( function (val){
		M1 = val;
	});

	gui.add(param, 'b', 27.5,30.0,0.001 ).onChange( function (val){
		b = val;
	});


	gui.add(param, 'Xo',0.0,1.0,0.1 ).onChange( function (val){
		Xo = val;
	});

	gui.add(param, 'Yo',-0.0,1.0,0.1 ).onChange( function (val){
		Yo = val;
	});

	gui.add(param, 'Zo',-0.0,1.0,0.1 ).onChange( function (val){
		Zo = val;
	});


	run_button = gui.add(param,'Run');
	play_button = gui.add(param,'Play').disable();
	clear_button = gui.add(param,'Stop').disable();
	XBX = gui.add(param,'X').onChange(function(val){
		scenes[0].children[3].visible = val;
		scenes[0].children[6].visible = val;
		}).disable();
	YBX = gui.add(param,'Y').onChange(function(val){
		scenes[0].children[4].visible = val;
		scenes[0].children[7].visible = val;
		}).disable();
	ZBX = gui.add(param,'Z').onChange(function(val){
		scenes[0].children[5].visible = val;
		scenes[0].children[8].visible = val;
		}).disable();
}

function RK(){

	console.log("RK");
	rkchua(Xo,Yo,Zo,a,M0,M1,b, 100, dataHeap.byteOffset,rn.length)
	var result = new Float64Array(dataHeap.buffer, dataHeap.byteOffset, rn.length);
				
	/////
	console.log(scenes[0].children)
	let n=0;
	let U = scenes[1].children[3].geometry.attributes.position
	let VX = scenes[0].children[3].geometry.attributes.position
	let VY = scenes[0].children[4].geometry.attributes.position
	let VZ = scenes[0].children[5].geometry.attributes.position

	for(let i=0;i<result.length;i+=3){
		X[n] = result[i];
		Y[n] = result[i+1]; 
		Z[n] = result[i+2];
		n+=1;
		}
	const MX = X.reduce((snx,csumx) => snx+csumx); 
	const MY = Y.reduce((sny,csumy) => sny+csumy); 
	const MZ = Z.reduce((snz,csumz) => snz+csumz);
	const N = X.length;
	Mx=MX/N; My=MY/N; Mz=MZ/N;

	for(let i =0; i<N;i++){
		U.setXYZ(i,X[i]-Mx,Y[i]-My+ny1,Z[i]-Mz);
		VX.setXYZ(i,T[i]-nx0,X[i]-Mx-ny0,0.0);
		VY.setXYZ(i,T[i]-nx0,Y[i]-My-ny0,0.0);
		VZ.setXYZ(i,T[i]-nx0,Z[i]-Mz-ny0,0.0);
		}

	U.needsUpdate = true;
	VX.needsUpdate = true;
	VY.needsUpdate = true;
	VZ.needsUpdate = true;
	scenes[0].children[3].geometry.computeBoundingSphere();
	scenes[0].children[4].geometry.computeBoundingSphere();
	scenes[0].children[5].geometry.computeBoundingSphere();
	scenes[0].children[6].geometry.computeBoundingSphere();

	run_button.disable(false);
	play_button.disable(false);
	XBX.disable(false);
	YBX.disable(false);
	ZBX.disable(false);
	mymod._free(dataHeap.byteOffset);


}


function play(){
	console.log('Play');
	RN=1.0;
	play_button.disable(true);
	clear_button.disable(false);
	run_button.disable(true);
	k = 0;
}

function clear(){
	console.log('Clear');
	RN=0.0;
	let Q = scenes[0].children[4].geometry.attributes.position;
	Q.setXYZ(0,0.0,0.0,0.0);
	Q.needsUpdate = true;
	play_button.disable(false);
	run_button.disable(false);

}


function initMeshes() {


		///// Axes Scene 1
		const axesHelper = new THREE.AxesHelper(20);
		const axcolor = new THREE.Color(0xc2bfc9);
		axesHelper.setColors(axcolor,axcolor,axcolor);
		axesHelper.translateY(ny1);
		scenes[1].add( axesHelper );
		///////
		const axesHelper2 = new THREE.AxesHelper(100);
		axesHelper2.setColors(axcolor,axcolor,axcolor);
		axesHelper2.translateX(-nx0);
		axesHelper2.translateY(-ny0);
		scenes[0].add( axesHelper2 );

		loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",function(font){
					const Xsh = font.generateShapes(tXYZ[0],1.5);
					const gX = new THREE.ShapeGeometry(Xsh);
					const textX = new THREE.Mesh(gX,textMaterial);
			

					const Ysh = font.generateShapes(tXYZ[1],1.5);
					const gY = new THREE.ShapeGeometry(Ysh);
					const textY = new THREE.Mesh(gY,textMaterial);
					
					const Zsh = font.generateShapes(tXYZ[2],1.5);
					const gZ = new THREE.ShapeGeometry(Zsh);
					const textZ = new THREE.Mesh(gZ,textMaterial);

					textX.position.set(20,ny1,0);
					textY.position.set(0,20+ny1,0);
					textZ.position.set(0,ny1,20);
					
					scenes[1].add(textX);
					scenes[1].add(textY);
					scenes[1].add(textZ);


					const Tsh = font.generateShapes('T (final = 100)',1.0);
					const gT = new THREE.ShapeGeometry(Tsh);
					const textT = new THREE.Mesh(gT,textMaterial);


					const XYZsh = font.generateShapes('Xi-<Xi> (i=1,2,3)',1.0);
					const gXYZ = new THREE.ShapeGeometry(XYZsh);
					const textXYZ = new THREE.Mesh(gXYZ,textMaterial);

					textT.position.set(35.5,-11.1,0);
					textXYZ.position.set(-45,-2.0,0);

					scenes[0].add(textT)					
					scenes[0].add(textXYZ)

				});	
		
		
	for(let i=0;i<Np;i++){
		const color = new THREE.Color(); 
		pointsxyz.push(0.0,0.0,0.0);
		color.setRGB(0.8,0.92,0.7, THREE.SRGBColorSpace);
		colors.push(color.r,color.g,color.b);

		const pcolorx = new THREE.Color(); 
		pcolorx.setRGB(1.0,0.0,0.0, THREE.SRGBColorSpace);

		const pcolory = new THREE.Color(); 
		pcolory.setRGB(0.9,1.0,0.9, THREE.SRGBColorSpace);

		const pcolorz = new THREE.Color(); 
		pcolorz.setRGB(0.72,0.85,0.07, THREE.SRGBColorSpace);

		Cx.push(pcolorx.r,pcolorx.g,pcolorx.b);
		Cy.push(pcolory.r,pcolory.g,pcolory.b);
		Cz.push(pcolorz.r,pcolorz.g,pcolorz.b);
		}
				
		const geom = new THREE.BufferGeometry();
		geom.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
		geom.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
		geom.computeBoundingSphere();
		const pMaterial =  new THREE.PointsMaterial( { size: 0.1, vertexColors: true } );
		const pMaterialt =  new THREE.PointsMaterial( { size: 1.5, vertexColors: true } );

		let points = new THREE.Points( geom, pMaterial );
		scenes[1].add( points );

		let SolX = new THREE.BufferGeometry();
		let SolY = new THREE.BufferGeometry();
		let SolZ = new THREE.BufferGeometry();
		SolX.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
		SolY.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
		SolZ.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
		SolX.setAttribute( 'color', new THREE.Float32BufferAttribute( Cx, 3 ) );
		SolY.setAttribute( 'color', new THREE.Float32BufferAttribute( Cy, 3 ) );
		SolZ.setAttribute( 'color', new THREE.Float32BufferAttribute( Cz, 3 ) );

		let pX = new THREE.Points( SolX, pMaterialt );
		let pY = new THREE.Points( SolY, pMaterialt );
		let pZ = new THREE.Points( SolZ, pMaterialt );
		scenes[0].add(pX);scenes[0].add(pY);scenes[0].add(pZ);

		ptx.push(0.0,0.0+ny1,0.0);


		const pgn =  new THREE.BufferGeometry();	
		const pcolor = new THREE.Color(); 
		pcolor.setRGB(0.67,0.96,0.086, THREE.SRGBColorSpace);
		const pNMaterial =  new THREE.PointsMaterial( { size: 0.5, vertexColors: true } );
		pgn.setAttribute( 'color', new THREE.Float32BufferAttribute( pcolor, 3 ) );
		pgn.setAttribute( 'position', new THREE.Float32BufferAttribute( ptx, 3 ) );
		let pnx = new THREE.Points(pgn,pNMaterial)
		scenes[1].add(pnx)

		pxt.push(0.0,-ny0,0.0);
		pyt.push(0.0,-ny0,0.0);
		pzt.push(0.0,-ny0,0.0);
		const pgnx =  new THREE.BufferGeometry();
		const pgny =  new THREE.BufferGeometry();
		const pgnz =  new THREE.BufferGeometry();
		const Xpcolor = new THREE.Color(); 
		const Ypcolor = new THREE.Color(); 
		const Zpcolor = new THREE.Color(); 
		Xpcolor.setRGB(1.00,0.00,0.000, THREE.SRGBColorSpace);
		Ypcolor.setRGB(0.9,1.0,0.9, THREE.SRGBColorSpace);
		Zpcolor.setRGB(0.67,0.96,0.086, THREE.SRGBColorSpace);
		const XpNMaterial =  new THREE.PointsMaterial( { size: 5.5, vertexColors: true } );
		const YpNMaterial =  new THREE.PointsMaterial( { size: 5.5, vertexColors: true } );
		const ZpNMaterial =  new THREE.PointsMaterial( { size: 5.5, vertexColors: true } );
		pgnx.setAttribute( 'color', new THREE.Float32BufferAttribute( Xpcolor, 3 ) );
		pgny.setAttribute( 'color', new THREE.Float32BufferAttribute( Ypcolor, 3 ) );
		pgnz.setAttribute( 'color', new THREE.Float32BufferAttribute( Zpcolor, 3 ) );
		pgnx.setAttribute( 'position', new THREE.Float32BufferAttribute( pxt, 3 ) );
		pgny.setAttribute( 'position', new THREE.Float32BufferAttribute( pyt, 3 ) );
		pgnz.setAttribute( 'position', new THREE.Float32BufferAttribute( pzt, 3 ) );
				//pgnx.computeBoundingSphere();
		let pnx1 = new THREE.Points(pgnx,XpNMaterial)
		let pny1 = new THREE.Points(pgny,YpNMaterial)
		let pnz1 = new THREE.Points(pgnz,ZpNMaterial)
		scenes[0].add(pnx1)
		scenes[0].add(pny1)
		scenes[0].add(pnz1)



	}


function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

function animate() {

	let m=0
	scenes.forEach( function(scene) {


		camera = scene.userData.camera;

		if(m==0){

			if (RN==1){

				k=(k+1)%Np;
				
				let M1 = scene.children[6].geometry.attributes.position
				let M2 = scene.children[7].geometry.attributes.position
				let M3 = scene.children[8].geometry.attributes.position
				M1.setXYZ(0,T[k]-nx0,X[k]-Mx-ny0,0.0);
				M2.setXYZ(0,T[k]-nx0,Y[k]-My-ny0,0.0);
				M3.setXYZ(0,T[k]-nx0,Z[k]-Mz-ny0,0.0);
				//scene.children[6].geometry.computeBoundingSphere();
				//scenes[1].children[7].geometry.computeBoundingSphere();
				//scenes[1].children[8].geometry.computeBoundingSphere();
				M1.needsUpdate = true;
				M2.needsUpdate = true;
				M3.needsUpdate = true;


			}

			renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight/2 );
		
		}

		if(m==1){

			if(RN==1){
				let M = scene.children[4].geometry.attributes.position
				M.setXYZ(0,X[k]-Mx,Y[k]-My+ny1,Z[k]-Mz)
				M.needsUpdate = true;
			}

			renderer.setScissor(0,window.innerHeight/2, window.innerWidth, window.innerHeight/2 );
				//console.log(scene.children)
			scene.children[2].rotation.y = 0.0*(Date.now()*0.001);			
			}
			m=1;

		scene.userData.controls.update();
		renderer.render( scene, camera );
		})
	}
