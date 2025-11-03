
			import * as THREE from 'three';

			import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
			import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
			import {FontLoader} from "three/addons/loaders/FontLoader.js";
			import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
			import Module from './rklorenz.js';

			let canvas, renderer;
			let Sig, Rho, Beta, gui;
			let Xo, Yo, Zo;
			let run_button, clear_button,play_button;
			let XBX,YBX,ZBX;
			let RN = 0.0

			////
			const Np = 2*5001;
			const NL = 3*Np;
			//const NL = 6;
			const mymod = await Module();
			var rklorenz = mymod.cwrap('integrals', 'number', ['number','number','number',
																 'number','number','number',
																 'number','number','number']);

			let rn = new Float64Array( Array(NL).fill(1.0) );
			let nDataBytes = rn.length * rn.BYTES_PER_ELEMENT;
			let dataPtr = mymod._malloc(nDataBytes);
			let dataHeap = new Float64Array(mymod.HEAPF64.buffer, dataPtr, nDataBytes);
			/////
			const scenes = [];

			let T = []; let X=[]; let Y=[]; let Z= [];
			let pointsxyz = []; let colors = [];
			let ptx = []; let pxt =[]; let pyt =[]; let pzt =[];
			let Cx = [];
			let Cy = [];
			let Cz = [];
			let Mx,My,Mz;
		
			let font;
			const loader = new FontLoader();
			var  textMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc2bfc9)});
			let tXYZ = ['X','Y','Z'];
			let k;

			init();

			function init() {

				let tn = 0.0;
				for (let i=0;i<Np;i++){
					T[i]=i*1e-2;
				}
				Sig = 10.0;
				Rho = 18,0;
				Beta = 8.0/10.0;
				Xo = 1.0; Yo=1.0; Zo = 0.0;

				canvas = document.getElementById( 'c' );

				const content = document.getElementById( 'content' );

				for ( let i = 0; i < 2; i ++ ) {

					const scene = new THREE.Scene();
					scene.background =  new THREE.Color( 0x170b42 );

					// make a list item
					const element = document.createElement( 'div' );
					element.className = 'list-item';

					const sceneElement = document.createElement( 'div' );
					element.appendChild( sceneElement );

					const descriptionElement = document.createElement( 'div' );
					if (i==0){
					descriptionElement.innerText = 'Phase Portrait (X,Y,Z) ';
					}
					else{
					descriptionElement.innerText = 'Solutions X/Y/Z vs Time';
					}
					element.appendChild( descriptionElement );

					// the element that represents the area we want to render the scene
					scene.userData.element = sceneElement;
					content.appendChild( element );

			

					if(i==0){
						const camera = new THREE.PerspectiveCamera( 50, 1, 1, 300 );
						camera.position.x = 30;
						camera.position.y = 30;
						camera.position.z = 30;
						scene.userData.camera = camera;
						const controls = new OrbitControls( scene.userData.camera, scene.userData.element );
						controls.enablePan = false;
						scene.userData.controls = controls;
					}

					if(i==1){
						const frustumSize = 25.0;
   						const aspect = window.innerWidth / window.innerHeight;
						const camera = new THREE.OrthographicCamera( frustumSize * aspect / - 1.5, frustumSize * aspect / 1.5, frustumSize / 1.5, frustumSize / - 1.5, 0.1, 200 );
						//camera.position.set(0.0, 0.0, 150.5);
						camera.position.x = 0;
						camera.position.y = 0;
						camera.position.z = 10.0;
						scene.userData.camera = camera;
						const controls = new OrbitControls( scene.userData.camera, scene.userData.element );
						controls.enableRotate = false;
						scene.userData.controls = controls;
					}

					scene.add( new THREE.HemisphereLight( 0xaaaaaa, 0x444444, 3 ) );

					const light = new THREE.DirectionalLight( 0xffffff, 1.5 );
					light.position.set( 1, 1, 1 );
					scene.add( light );

					scenes.push( scene );

				}
				///// Axes Scene 1
				const axesHelper = new THREE.AxesHelper(20);
				const axcolor = new THREE.Color(0xc2bfc9);
				axesHelper.setColors(axcolor,axcolor,axcolor);
				scenes[0].add( axesHelper );
				///////
				const axesHelper2 = new THREE.AxesHelper(100);
				axesHelper2.setColors(axcolor,axcolor,axcolor);
				axesHelper2.translateX(-25);
				scenes[1].add( axesHelper2 );
				///////
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

					textX.position.set(20,0,0);
					textY.position.set(0,20,0);
					textZ.position.set(0,0,20);
					
					scenes[0].add(textX);
					scenes[0].add(textY);
					scenes[0].add(textZ);


					const Tsh = font.generateShapes('T (final = 100)',1.0);
					const gT = new THREE.ShapeGeometry(Tsh);
					const textT = new THREE.Mesh(gT,textMaterial);


					const XYZsh = font.generateShapes('Xi-<Xi> (i=1,2,3)',1.0);
					const gXYZ = new THREE.ShapeGeometry(XYZsh);
					const textXYZ = new THREE.Mesh(gXYZ,textMaterial);

					textT.position.set(67.5,-1.1,0);
					textXYZ.position.set(-24,15.0,0);

					scenes[1].add(textT)
					scenes[1].add(textXYZ)

				});	
		

				for(let i=0;i<Np;i++){
					const color = new THREE.Color(); 
					pointsxyz.push(0.0,0.0,0.0);
					color.setRGB(0.48,0.92,0.87, THREE.SRGBColorSpace);
					colors.push(color.r,color.g,color.b);

					const pcolorx = new THREE.Color(); 
					pcolorx.setRGB(1.0,0.0,0.0, THREE.SRGBColorSpace);

					const pcolory = new THREE.Color(); 
					pcolory.setRGB(0.9,1.0,9.0, THREE.SRGBColorSpace);

					const pcolorz = new THREE.Color(); 
					pcolorz.setRGB(0.72,0.85,0.07, THREE.SRGBColorSpace);

					Cx.push(pcolorx.r,pcolorx.g,pcolorx.b);
					Cy.push(pcolory.r,pcolory.g,pcolory.b);
					Cz.push(pcolorz.r,pcolorz.g,pcolorz.b);
				}
				

				const geom = new THREE.BufferGeometry();
				geom.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
				geom.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
				//geom.computeBoundingSphere();
				const pMaterial =  new THREE.PointsMaterial( { size: 0.25, vertexColors: true } );

				let points = new THREE.Points( geom, pMaterial );
				scenes[0].add( points );

				let SolX = new THREE.BufferGeometry();
				let SolY = new THREE.BufferGeometry();
				let SolZ = new THREE.BufferGeometry();
				SolX.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
				SolY.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
				SolZ.setAttribute( 'position', new THREE.Float32BufferAttribute( pointsxyz, 3 ) );
				SolX.setAttribute( 'color', new THREE.Float32BufferAttribute( Cx, 3 ) );
				SolY.setAttribute( 'color', new THREE.Float32BufferAttribute( Cy, 3 ) );
				SolZ.setAttribute( 'color', new THREE.Float32BufferAttribute( Cz, 3 ) );

				let pX = new THREE.Points( SolX, pMaterial );
				let pY = new THREE.Points( SolY, pMaterial );
				let pZ = new THREE.Points( SolZ, pMaterial );
				scenes[1].add(pX);scenes[1].add(pY);scenes[1].add(pZ);

				ptx.push(0.0,0.0,0.0);
				const pgn =  new THREE.BufferGeometry();
				const pcolor = new THREE.Color(); 
				pcolor.setRGB(0.67,0.96,0.086, THREE.SRGBColorSpace);
				const pNMaterial =  new THREE.PointsMaterial( { size: 0.5, vertexColors: true } );
				pgn.setAttribute( 'color', new THREE.Float32BufferAttribute( pcolor, 3 ) );
				pgn.setAttribute( 'position', new THREE.Float32BufferAttribute( ptx, 3 ) );
				let pnx = new THREE.Points(pgn,pNMaterial)
				scenes[0].add(pnx)

				//
				pxt.push(0.0,0.0,0.0);
				pyt.push(0.0,0.0,0.0);
				pzt.push(0.0,0.0,0.0);
				const pgnx =  new THREE.BufferGeometry();
				const pgny =  new THREE.BufferGeometry();
				const pgnz =  new THREE.BufferGeometry();
				const Xpcolor = new THREE.Color(); 
				const Ypcolor = new THREE.Color(); 
				const Zpcolor = new THREE.Color(); 
				Xpcolor.setRGB(1.00,0.00,0.000, THREE.SRGBColorSpace);
				Ypcolor.setRGB(0.9,1.00,0.9, THREE.SRGBColorSpace);
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
				scenes[1].add(pnx1)
				scenes[1].add(pny1)
				scenes[1].add(pnz1)

				//

				initGUI();
				renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
				renderer.setClearColor( 0xffffff, 1 );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setAnimationLoop( animate );

			}

			function initGUI(){
				gui = new GUI();

				const param ={
					'Sigma': Sig,
					'Rho': Rho,
					'Beta': Beta,
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

				gui.add(param, 'Sigma',0.0,20,0.1 ).onChange( function (val){
					Sig = val;
				});


				gui.add(param, 'Rho',0.0,50,0.1 ).onChange( function (val){
					Rho = val;
				});


				gui.add(param, 'Beta',0.0,5.0,0.1 ).onChange( function (val){
					Beta = val;
				});



				gui.add(param, 'Xo',-10.0,10.0,0.1 ).onChange( function (val){
					Xo = val;
				});

				gui.add(param, 'Yo',-10.0,10.0,0.1 ).onChange( function (val){
					Yo = val;
				});

				gui.add(param, 'Zo',-10.0,10.0,0.1 ).onChange( function (val){
					Zo = val;
				});
				//////
				run_button = gui.add(param,'Run');
				play_button = gui.add(param,'Play').disable();
				clear_button = gui.add(param,'Stop').disable();
				XBX = gui.add(param,'X').onChange(function(val){
					scenes[1].children[3].visible = val;
					scenes[1].children[6].visible = val;
				}).disable();
				YBX = gui.add(param,'Y').onChange(function(val){
					scenes[1].children[4].visible = val;
					scenes[1].children[7].visible = val;
				}).disable();
				ZBX = gui.add(param,'Z').onChange(function(val){
					scenes[1].children[5].visible = val;
					scenes[1].children[8].visible = val;
				}).disable();


			}

			function RK(){
				console.log('RK');
				//console.log(scenes[1].children)
				let qn = rklorenz(Xo,Yo,Zo,Sig,Rho,Beta, 100, dataHeap.byteOffset,rn.length)
				var result = new Float64Array(dataHeap.buffer, dataHeap.byteOffset, rn.length);
				
				/////
				let n=0;
				let U = scenes[0].children[3].geometry.attributes.position
				let VX = scenes[1].children[3].geometry.attributes.position
				let VY = scenes[1].children[4].geometry.attributes.position
				let VZ = scenes[1].children[5].geometry.attributes.position

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
					U.setXYZ(i,X[i]-Mx,Y[i]-My,Z[i]-Mz);
					VX.setXYZ(i,T[i]-25,X[i]-Mx,0.0);
					VY.setXYZ(i,T[i]-25,Y[i]-My,0.0);
					VZ.setXYZ(i,T[i]-25,Z[i]-Mz,0.0);
				}

				U.needsUpdate = true;
				VX.needsUpdate = true;
				VY.needsUpdate = true;
				VZ.needsUpdate = true;

				scenes[1].children[3].geometry.computeBoundingSphere();
				scenes[1].children[4].geometry.computeBoundingSphere();
				scenes[1].children[5].geometry.computeBoundingSphere();



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




			function updateSize() {

				const width = canvas.clientWidth;
				const height = canvas.clientHeight;

				if ( canvas.width !== width || canvas.height !== height ) {

					renderer.setSize( width, height, false );

				}

			}

			function animate() {

				updateSize();

				canvas.style.transform = `translateY(${window.scrollY}px)`;

				renderer.setClearColor( 0xffffff );
				renderer.setScissorTest( false );
				renderer.clear();

				renderer.setClearColor( 0xe0e0e0 );
				renderer.setScissorTest( true );

				let m = 0
				scenes.forEach( function ( scene ) {

					// so something moves					
					let tn = 0.0*(Date.now() * 0.001);
					scene.children[ 0 ].rotation.y = tn; //Date.now() * 0.001;
					if ((m==0)&(RN==1)){

						scene.children[2].rotation.y = tn;
						scene.children[3].rotation.y = tn;
						if (scene.children.length >= 5){
							scene.children[4].rotation.y = tn;
						}
						//m = 1;
						k = (k+1)%Np;
						let M = scene.children[4].geometry.attributes.position
						M.setXYZ(0,X[k]-Mx,Y[k]-My,Z[k]-Mz)
						M.needsUpdate = true;
						
						}
					if ((m!=0)&(RN==1)){

						let M1 = scene.children[6].geometry.attributes.position
						let M2 = scene.children[7].geometry.attributes.position
						let M3 = scene.children[8].geometry.attributes.position
						M1.setXYZ(0,T[k]-25,X[k]-Mx,0.0);
						M2.setXYZ(0,T[k]-25,Y[k]-My,0.0);
						M3.setXYZ(0,T[k]-25,Z[k]-Mz,0.0);
						scenes[1].children[6].geometry.computeBoundingSphere();
						scenes[1].children[7].geometry.computeBoundingSphere();
						scenes[1].children[8].geometry.computeBoundingSphere();
						M1.needsUpdate = true;
						M2.needsUpdate = true;
						M3.needsUpdate = true;

					}
					m=1;
					// get the element that is a place holder for where we want to
					// draw the scene
					const element = scene.userData.element;

					// get its position relative to the page's viewport
					const rect = element.getBoundingClientRect();

					// check if it's offscreen. If so skip it
					if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
						 rect.right < 0 || rect.left > renderer.domElement.clientWidth ) {

						return; // it's off screen

					}
                   
					// set the viewport
					const width = rect.right - rect.left;
					const height = rect.bottom - rect.top;
					const left = rect.left;
					const bottom = renderer.domElement.clientHeight - rect.bottom;

					renderer.setViewport( left, bottom, width, height );
					renderer.setScissor( left, bottom, width, height );

					const camera = scene.userData.camera;

					//camera.aspect = width / height; // not changing in this example
					//camera.updateProjectionMatrix();

					//scene.userData.controls.update();

					renderer.render( scene, camera );

				} );

			}