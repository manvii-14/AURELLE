const rnd=(a,b)=>a+Math.random()*(b-a),$=s=>document.querySelector(s),N=6000;
const PRE={fire:{gravity:.2,visc:.3,dens:.35,elas:.6,vol:.6,cursor:.6,turb:.7,tension:.3,time:1},water:{gravity:.35,visc:.55,dens:.45,elas:.7,vol:.6,cursor:.5,turb:.25,tension:.7,time:1},earth:{gravity:.7,visc:.45,dens:.85,elas:.7,vol:.5,cursor:.5,turb:.1,tension:.6,time:1},air:{gravity:.05,visc:.2,dens:.15,elas:.8,vol:.75,cursor:.45,turb:.45,tension:.2,time:1}};
const EL={fire:['Fire','Intensity'],water:['Water','Flow'],earth:['Earth','Stability'],air:['Air','Freedom']};
const GE={fire:-.6,water:1,earth:1.6,air:-.15};
const PAL={midnight:{fire:['#ff3d00','#ffb300','#fff2c0'],water:['#00e5ff','#3d5afe','#c6a8ff'],earth:['#d08a2e','#7c4dff','#22e5ff'],air:['#9fdcff','#e0b3ff','#ffffff']},pearl:{fire:['#c8553a','#e8a46a','#fff1d6'],water:['#4f8db5','#8fb8d6','#ffffff'],earth:['#6f5a45','#a68f72','#f3e6c8'],air:['#a58ccf','#cdb9e8','#ffffff']}};
const BG={midnight:{c:'#0d0724',fire:'#3a0a05',water:'#04183a',earth:'#2a1a06',air:'#1a1840'},pearl:{c:'#fffdf7',fire:'#f2ddd0',water:'#d6e6ef',earth:'#e6dccb',air:'#e9e3f3'}};
PAL.ember=PAL.midnight;BG.ember={c:'#1b1917',fire:'#5a2012',water:'#27393a',earth:'#3a2c18',air:'#4a3a22'};const MOODS={Dreamy:['water','torus','pearl',{visc:.6,turb:.3}],Euphoric:['fire','orb','midnight',{cursor:.8,vol:.8,gravity:.1,visc:.45,turb:.4,tension:.6}],Melancholic:['water','surface','midnight',{visc:.8,gravity:.6}],Chaotic:['fire','fragments','midnight',{turb:1,elas:.95,visc:.1,tension:.1,gravity:.4,dens:.3}],Meditative:['earth','torus','pearl',{turb:.05,visc:.7}],Weightless:['air','orb','pearl',{gravity:0,vol:.85}]};
const SL=[['P.gravity','Gravity',0,1,['Weightless','Balanced','Extreme']],['P.visc','Viscosity',0,1,['Fluid','Silky','Thick']],['P.dens','Density',0,1,['Sparse','Medium','Dense']],['P.elas','Elasticity',0,1,['Soft','Springy','Bouncy']],['P.vol','Volume',0,1,['Compact','Medium','Expanded']],['P.cursor','Cursor force',0,1,['Gentle','Normal','Powerful']],['P.turb','Turbulence',0,1,['Calm','Swirling','Chaotic']],['P.tension','Surface tension',0,1,['Loose','Cohesive','Tight']],['P.time','Time dilation',.1,2,['Slow','Real-time','Fast']]];
const DEF=()=>({el:'water',shape:'orb',theme:'midnight',cm:'attract',reform:.5,react:.7,radius:.6,count:1,morph:0,P:{...PRE.water}});
let S=DEF(),hist=[],hi=-1,tab=null,freeze=0,sh=0;
/* ---------- three ---------- */
const cv=$('#c'),R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});R.setClearColor(0,0);R.setPixelRatio(Math.min(devicePixelRatio,2));
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,1,.1,100);let cz=13;cam.position.z=cz;
const pos=new Float32Array(N*3),vel=new Float32Array(N*3),Hc=new Float32Array(N*3),seed=new Float32Array(N),sp=new Float32Array(N);
for(let i=0;i<N;i++){seed[i]=Math.random();pos[i*3]=rnd(-30,30);pos[i*3+1]=rnd(-20,20);pos[i*3+2]=rnd(-30,10)}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('aS',new THREE.BufferAttribute(seed,1));geo.setAttribute('aV',new THREE.BufferAttribute(sp,1).setUsage(THREE.DynamicDrawUsage));
const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{c1:{value:new THREE.Color()},c2:{value:new THREE.Color()},c3:{value:new THREE.Color()},uG:{value:0},uOp:{value:1},uSize:{value:8},uPx:{value:R.getPixelRatio()}},
vertexShader:`attribute float aS;attribute float aV;uniform float uSize,uPx,uG;varying float vS,vV;void main(){vS=aS;vV=aV;vec4 m=modelViewMatrix*vec4(position,1.);gl_PointSize=uSize*uPx*(1.+uG*.7+aS*.8)*(14./-m.z);gl_Position=projectionMatrix*m;}`,
fragmentShader:`uniform vec3 c1,c2,c3;uniform float uG,uOp;varying float vS,vV;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=1.-smoothstep(0.,.5,d);a=.15+a*a;vec3 c=mix(c1,c2,vS);c=mix(c,c3,clamp(vV+uG*.35,0.,1.));gl_FragColor=vec4(c,a*uOp);}`});
const pts=new THREE.Points(geo,mat);pts.frustumCulled=false;sc.add(pts);let fb=0,fr=0;
function fallback(){if(useF){useF=0;console.warn('VIBE: surface pass failed, using particles');look();return}fb=1;pts.material=new THREE.PointsMaterial({size:.09,transparent:true,depthWrite:false,opacity:.9});look();console.warn('VIBE: custom shader failed, using PointsMaterial fallback')}
let useF=1,HF=false,rt,vx=0,vy=0;try{HF=R.capabilities.isWebGL2&&(R.extensions.has('EXT_color_buffer_float')||R.extensions.has('EXT_color_buffer_half_float'))}catch(_){}const FS=HF?1:4;
const mk=(w,h)=>new THREE.WebGLRenderTarget(w,h,{type:HF?THREE.HalfFloatType:THREE.UnsignedByteType,format:THREE.RGBAFormat,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:true,depthBuffer:false});
const fm=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneFactor,uniforms:{uSz:{value:44},uPx:{value:1},uI:{value:.1}},vertexShader:`attribute float aS;attribute float aV;uniform float uSz,uPx;varying float vS,vV;void main(){vS=aS;vV=aV;vec4 m=modelViewMatrix*vec4(position,1.);gl_PointSize=uSz*uPx*(14./-m.z);gl_Position=projectionMatrix*m;}`,fragmentShader:`uniform float uI;varying float vS,vV;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);if(r>1.)discard;float w=(1.-r);w*=w*uI;gl_FragColor=vec4(w,w*vV,w*vS,w);}`});
const fS=new THREE.Scene(),fpts=new THREE.Points(geo,fm);fpts.frustumCulled=false;fS.add(fpts);
const qm=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tD:{value:null},px:{value:new THREE.Vector2(1,1)},uScale:{value:FS},uThr:{value:1},uEl:{value:1},uTh:{value:0},uT:{value:0},uB:{value:0},uM:{value:0},uTr:{value:0},uVis:{value:.5},uTur:{value:.3},uDen:{value:.5},uAsp:{value:1},uC:{value:new THREE.Color()}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`uniform sampler2D tD;uniform vec2 px;uniform vec3 uC;uniform float uScale,uThr,uEl,uTh,uT,uB,uM,uTr,uVis,uTur,uDen,uAsp;varying vec2 vUv;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1.,0.)),f.x),mix(h2(i+vec2(0.,1.)),h2(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*nz(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float D(vec2 u){return texture2D(tD,u).r*uScale;}
float Hb(vec2 u,float b,float k){float d=texture2D(tD,u,b).r*uScale;return d/(d+k);}
void main(){vec2 uv=vUv,q=vec2(uv.x*uAsp,uv.y);
if(uEl<.5)uv+=(vec2(fbm(q*5.+vec2(0.,-uT*1.6)),fbm(q*5.+vec2(7.,-uT*1.6)))-.5)*(.01+uB*.025+uTur*.02);
else if(uEl>2.5){vec2 c=q-vec2(.5*uAsp,.5);float r=length(c),an=1.4/(r*3.+1.)*(.6+uM)+uT*.15;vec2 rc=mat2(cos(an),-sin(an),sin(an),cos(an))*c;uv+=(rc-c)*vec2(1./uAsp,1.)*.35;}
else if(uEl>1.5)uv.x+=sin(uv.y*70.+uT*40.)*uB*.004;
float d=D(uv);vec2 ex=vec2(px.x*2.,0.),ey=vec2(0.,px.y*2.);
vec2 e1=px*3.,e2=px*14.;float gx=(Hb(uv+vec2(e1.x,0.),2.,2.)-Hb(uv-vec2(e1.x,0.),2.,2.))*5.+(Hb(uv+vec2(e2.x,0.),4.5,3.)-Hb(uv-vec2(e2.x,0.),4.5,3.))*9.;float gy=(Hb(uv+vec2(0.,e1.y),2.,2.)-Hb(uv-vec2(0.,e1.y),2.,2.))*5.+(Hb(uv+vec2(0.,e2.y),4.5,3.)-Hb(uv-vec2(0.,e2.y),4.5,3.))*9.;vec3 n=normalize(vec3(-gx,-gy,1.));
float a=smoothstep(uThr-.2,uThr+.2,d);vec3 L1=normalize(vec3(-.5,.6,.65)),L2=normalize(vec3(.6,-.3,.5));
float sp1=pow(max(dot(n,normalize(L1+vec3(0.,0.,1.))),0.),90.);vec3 col=vec3(0.);float al=a;
if(uEl>.5&&uEl<1.5){vec2 w=q*(26.-uVis*14.)+vec2(uT*.6,-uT*.4);vec3 nn=normalize(n+vec3((nz(w)-.5)*.35,(nz(w+9.)-.5)*.35,0.)*(1.-uVis*.6));float th=clamp(d*.22,0.,1.);
col=mix(vec3(.12,.72,.82),vec3(0.,.16,.3),th*.9);vec3 r2=vec3(2.*nn.z*nn.x,2.*nn.z*nn.y,2.*nn.z*nn.z-1.);vec3 sky=mix(vec3(.55,.8,.95),vec3(.9,.97,1.),smoothstep(-.2,.8,r2.y));float f2=pow(1.-nn.z,2.5);col=mix(col,sky,.15+f2*.7);
float c1=fbm(q*9.+vec2(uT*.35,-uT*.2));float caus=pow(1.-abs(c1-.5)*2.,7.);col+=vec3(.5,.95,1.)*caus*.55*(1.-th*.6)*(.6+uB);
col+=vec3(1.)*pow(max(dot(nn,normalize(L1+vec3(0.,0.,1.))),0.),120.)*1.6+vec3(.7,.9,1.)*pow(max(dot(nn,normalize(L2+vec3(0.,0.,1.))),0.),60.)*.6;al=a*(.82+f2*.18);}
else if(uEl<.5){float nf=fbm(q*4.+vec2(0.,-uT*(2.4-uVis*1.6)));float ht=d*.2+(nf-.5)*(.7+uTur*.5)+uB*.35+.06;
col=mix(vec3(.25,0.,.02),vec3(.95,.12,.03),smoothstep(.12,.4,ht));col=mix(col,vec3(1.,.5,.06),smoothstep(.35,.6,ht));col=mix(col,vec3(1.,.82,.25),smoothstep(.55,.8,ht));col=mix(col,vec3(1.,.97,.85),smoothstep(.85,1.1,ht));
col+=vec3(1.,.7,.3)*sp1*.5;al=smoothstep(.1,.28,ht)*smoothstep(.05,.5,d);}
else if(uEl<2.5){vec3 nn=n;vec3 r2=vec3(2.*nn.z*nn.x,2.*nn.z*nn.y,2.*nn.z*nn.z-1.);float y=r2.y*.5+.5;
vec3 env=mix(vec3(.04,.045,.06),vec3(.88,.92,.97),smoothstep(.3,.8,y));env+=vec3(1.)*smoothstep(.55,.95,sin(r2.x*2.2+r2.y*3.+1.))*.5;env*=.92+.12*nz(vec2(q.x*2.,q.y*320.));
col=env*(.55+.45*(1.-uDen*.5))*vec3(.8,.86,1.);float cr=fbm(q*4.+nn.xy*.8);float crack=1.-smoothstep(0.,.012+.02*uB,abs(cr-.5));
col*=1.-crack*.7;col+=vec3(1.,.42,.08)*crack*(.15+uB*1.8);al=a;}
else{vec2 c=q-vec2(.5*uAsp,.5);float r=length(c),ang=atan(c.y,c.x);float sw=sin(ang*5.+r*16.-uT*(.8+uM*2.))*.5+.5;float n1=fbm(q*3.2+vec2(uT*.12,-uT*.08)+sw*.4);
col=mix(vec3(.82,.47,.2),vec3(1.,.7,.5),smoothstep(.25,.6,n1));col=mix(col,vec3(.96,.84,.62),smoothstep(.45,.8,n1+sw*.2));col=mix(col,vec3(1.,.97,.9),smoothstep(.65,1.,n1+n.z*.3-.1+sw*.1));
col+=vec3(1.,.88,.62)*pow(1.-n.z,2.)*1.2+vec3(1.,.95,.8)*sp1*.5;al=smoothstep(.1,1.3,d)*(.55+n1*.55);}
if(uTh>.5)col=mix(col,vec3(.97,.94,.9),.22);col=min(col,vec3(1.));
float halo=smoothstep(.2,uThr,d)*(1.-a)*(1.-uTh)*step(uEl,2.5)*.16;float ao=max(al,halo);gl_FragColor=vec4(min(col*al+uC*halo,vec3(ao)),ao);}`});
const qS=new THREE.Scene(),qQ=new THREE.Mesh(new THREE.PlaneGeometry(2,2),qm),qc=new THREE.Camera();qQ.frustumCulled=false;qS.add(qQ);
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();const pr=Math.min(devicePixelRatio,2)*.5;if(rt)rt.dispose();rt=mk(Math.max(2,innerWidth*pr|0),Math.max(2,innerHeight*pr|0));fm.uniforms.uPx.value=pr;qm.uniforms.tD.value=rt.texture;qm.uniforms.px.value.set(1/rt.width,1/rt.height);qm.uniforms.uAsp.value=innerWidth/innerHeight}addEventListener('resize',resize);resize();
function draw(){if(useF){R.setRenderTarget(rt);R.render(fS,cam);R.setRenderTarget(null);R.render(qS,qc);if(pts.visible){R.autoClear=false;R.render(sc,cam);R.autoClear=true}}else R.render(sc,cam)}
const SPL={orb:[1,.2],torus:[1.1,.26],fragments:[1,.17],surface:[2.6,.4]};
function funi(dtr){const P=S.P,s=SPL[S.shape],po=!!tab,dw=innerWidth>820,io=!$('#intro').classList.contains('out'),ox=io&&dw?-innerWidth*.13:po&&dw?(panel.offsetWidth+28)/2:0,oy=io&&!dw?-innerHeight*.2:po&&!dw?panel.offsetHeight/2:0,k=Math.min(1,dtr*8);vx+=(ox-vx)*k;vy+=(oy-vy)*k;cam.setViewOffset(innerWidth,innerHeight,vx,vy,innerWidth,innerHeight);fpts.rotation.copy(pts.rotation);fpts.position.copy(pts.position);geo.setDrawRange(0,Math.max(300,Math.round(N*S.count)));
fm.uniforms.uSz.value=30*s[0]*(innerHeight/800)*(.85+P.vol*.3);fm.uniforms.uI.value=s[1]*(.7+P.dens*.6)/FS;const u=qm.uniforms;u.uT.value=tt;u.uB.value=B*S.react;u.uM.value=M;u.uTr.value=T;u.uVis.value=P.visc;u.uTur.value=P.turb;u.uDen.value=P.dens;u.uThr.value=.7+(1-P.tension)*.9;u.uEl.value=['fire','water','earth','air'].indexOf(S.el);u.uTh.value=S.theme=='pearl'?1:0}
/* ---------- shapes ---------- */
const cache={};let HT;
function gen(s){const a=new Float32Array(N*3),cs=[];for(let c=0;c<14;c++)cs.push([rnd(-5,5),rnd(-3,3),rnd(-2,2)]);
for(let i=0;i<N;i++){let x,y,z;
if(s=='orb'){const u=rnd(-1,1),th=rnd(0,6.283),r=2.2*Math.cbrt(Math.random()),q=Math.sqrt(1-u*u);x=r*q*Math.cos(th);y=r*u;z=r*q*Math.sin(th)}
else if(s=='torus'){const th=rnd(0,6.283),ph=rnd(0,6.283),r=.25+.6*Math.sqrt(Math.random());x=(2.6+r*Math.cos(ph))*Math.cos(th);y=(2.6+r*Math.cos(ph))*Math.sin(th);z=r*Math.sin(ph)}
else if(s=='surface'){x=rnd(-11,11);y=rnd(-6,6);z=rnd(-.3,.3)}
else{const c=cs[i%14],g=()=>(Math.random()+Math.random()+Math.random()-1.5)*.7;x=c[0]+g();y=c[1]+g();z=c[2]+g()}
a[i*3]=x;a[i*3+1]=y;a[i*3+2]=z}return a}
function setShape(s){S.shape=s;HT=cache[s]||(cache[s]=gen(s));meta()}
/* ---------- audio ---------- */
let AC,an,master,fd,nb,genOn=0,fileOn=0,fEl,tim,nt=0,stp=0,B=0,M=0,T=0;
function initA(){if(AC){AC.resume();return}AC=new(window.AudioContext||window.webkitAudioContext)();an=AC.createAnalyser();an.fftSize=512;an.smoothingTimeConstant=.55;master=AC.createGain();master.gain.value=.7;master.connect(an);an.connect(AC.destination);fd=new Uint8Array(an.frequencyBinCount);nb=AC.createBuffer(1,AC.sampleRate>>1,AC.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
function tone(ty,f,t,l,v,f2){const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+l);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+l);o.connect(g);g.connect(master);o.start(t);o.stop(t+l+.05)}
function hat(t,v){const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=nb;f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+.06)}
const BPM={fire:138,water:74,earth:96,air:58},SCL=[0,3,5,7,10,12,15];
function sched(){while(nt<AC.currentTime+.15){const e=S.el,s=stp%16,b=60/BPM[e]/4,root={fire:55,water:110,earth:65.4,air:220}[e],hz=n=>root*2**(n/12);
const kick=e=='fire'?s%4==0:e=='earth'?s%8==0||s==10:e=='water'?s==0||s==10:s==0;
if(kick)tone('sine',e=='water'||e=='air'?90:150,nt,.35,.9,40);
if((e=='fire'&&s%2)||(e=='earth'&&s%4==2)||(e=='water'&&s%4==2))hat(nt,.22);
if((e=='fire'&&s%2==0)||(e=='earth'&&s%4==2))tone(e=='fire'?'sawtooth':'triangle',hz(SCL[(s>>2)%3]),nt,b*2.5,e=='fire'?.1:.22);
if(s%4==0||Math.random()<.2)tone(e=='fire'?'square':e=='air'?'sine':'triangle',hz(12+SCL[Math.floor(Math.random()*7)]),nt,b*(e=='air'?8:4),e=='fire'?.05:.11);
nt+=b;stp++}}
function genToggle(){initA();if(genOn){clearInterval(tim);genOn=0}else{stopFile();nt=AC.currentTime+.05;stp=0;tim=setInterval(sched,30);genOn=1}}
function stopFile(){if(fEl){fEl.pause();fileOn=0}}
function loadFile(f){if(!f)return;initA();if(genOn)genToggle();stopFile();fEl=new Audio(URL.createObjectURL(f));fEl.loop=true;AC.createMediaElementSource(fEl).connect(master);fEl.play();fileOn=1;rp()}
function meters(t){if(genOn||fileOn){an.getByteFrequencyData(fd);const av=(a,b)=>{let s=0;for(let i=a;i<b;i++)s+=fd[i];return s/(b-a)/255};const b=av(0,4),m=av(4,25),h=av(25,120)*2.2;B+=(b-B)*(b>B?.6:.12);M+=(m-M)*.3;T+=(h-T)*(h>T?.6:.2)}else{B=.12+.1*Math.pow(Math.sin(t*1.3),2);M=.25+.1*Math.sin(t*.4);T=.08}}
/* ---------- input ---------- */
let nx=0,ny=0,down=0,charge=0,cl=new THREE.Vector3(),cp=new THREE.Vector3(),pv=new THREE.Vector3(),lastX=0,rotY=0,rotX=0;
function ptr(e){px_=e.clientX;py_=e.clientY;const r=cv.getBoundingClientRect();nx=(e.clientX-r.left)/r.width*2-1;ny=-((e.clientY-r.top)/r.height)*2+1}
cv.addEventListener('pointerdown',e=>{ptr(e);down=1;charge=0;if(S.cm=='grab')coreDrag=1;lastX=e.clientX;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{ptr(e);if(down&&e.shiftKey){rotY+=(e.clientX-lastX)*.008;rotX+=(e.movementY||0)*.008}lastX=e.clientX});
cv.addEventListener('pointerup',()=>{const cd=coreDrag;coreDrag=0;down=0;if(!cd)burst(cl,2+charge*2.2,charge*14+6);addRipple(px_,py_,1+charge);charge=0});
cv.addEventListener('wheel',e=>{e.preventDefault();cz=Math.min(24,Math.max(5,cz+e.deltaY*.01))},{passive:false});
function burst(c,rad,f){for(let i=0;i<N;i++){const i3=i*3,dx=pos[i3]-c.x,dy=pos[i3+1]-c.y,dz=pos[i3+2]-c.z,d=Math.hypot(dx,dy,dz)+.01;if(d<rad){const k=f*(1-d/rad)/d;vel[i3]+=dx*k;vel[i3+1]+=dy*k;vel[i3+2]+=dz*k}}}
function explode(){for(let i=0;i<N;i++){const i3=i*3,d=Math.hypot(pos[i3],pos[i3+1],pos[i3+2])+.1,f=rnd(6,16)/d;vel[i3]+=pos[i3]*f;vel[i3+1]+=pos[i3+1]*f;vel[i3+2]+=pos[i3+2]*f}}
/* ---------- simulation ---------- */
function step(dtr,t){const P=S.P,NC=Math.max(300,Math.round(N*S.count)),wl=wells.length,RD=.8+S.radius*6,dt=dtr*P.time,e=S.el,mass=.4+P.dens*2,gy=-P.gravity*GE[e]*3,kb=(.5+P.tension*2.4)*(.6+P.elas*.8)*(S.shape=='fragments'?.3+S.reform*1.6:1)*(S.shape=='surface'?.6:1),
sc_=.55+P.vol*.9,damp=Math.exp(-(.2+P.visc*3.5)*dt),tb=P.turb*6*(e=='fire'?1.5:1)/mass,cf=P.cursor*45*(1+charge)/mass,au=S.react,wk=(e=='water'?1:e=='earth'?.5:.35)*(S.shape=='surface'?1.4:1),wa=(.12+B*au*2.4)*wk,wind=t*.3+M*4,fl=-4.7,cm=S.cm,hm=Math.min(1,dtr*2.5);
if(e=='fire'&&T>.3)for(let j=0;j<25;j++){const i=(Math.random()*N|0)*3;vel[i+1]+=rnd(3,9)*au;vel[i]+=rnd(-3,3)}
for(let i=0;i<NC;i++){const i3=i*3;Hc[i3]+=(HT[i3]-Hc[i3])*hm;Hc[i3+1]+=(HT[i3+1]-Hc[i3+1])*hm;Hc[i3+2]+=(HT[i3+2]-Hc[i3+2])*hm;
let x=pos[i3],y=pos[i3+1],z=pos[i3+2],hx=Hc[i3]*sc_,hy=Hc[i3+1]*sc_,hz=Hc[i3+2]*sc_;hz+=Math.sin(Math.hypot(hx,hy)*1.4-t*3)*wa;
let ax=(hx-x)*kb,ay=(hy-y)*kb+gy,az=(hz-z)*kb;const ph=i%7;
ax+=Math.sin(y*.9+t*1.3+ph)*tb;ay+=Math.cos(z*1.1+t*1.1+ph)*tb+(e=='fire'?1.2:0);az+=Math.sin(x*.8-t*.9+ph)*tb;
const dx=x-cl.x,dy=y-cl.y,dz=z-cl.z,d2=dx*dx+dy*dy+dz*dz,f=Math.exp(-d2/RD)*cf;
if(cm=='attract'||cm=='grab'){const gg=cm=='grab'&&down?2.5:1;ax-=dx*f*gg;ay-=dy*f*gg;az-=dz*f*gg}else if(cm=='repel'){ax+=dx*f;ay+=dy*f;az+=dz*f}else{ax+=-dy*f-dx*f*.2;ay+=dx*f-dy*f*.2}
if(down){const g=Math.exp(-d2/4)*.8;vel[i3]+=pv.x*g*P.cursor*6;vel[i3+1]+=pv.y*g*P.cursor*6}
for(let k=0;k<wl;k++){const w=wells[k],wx=w.x-x,wy=w.y-y,wz=w.z-z,wd=Math.sqrt(wx*wx+wy*wy+wz*wz)+.01;if(wd<7){const ff=(1-wd/7)*w.pw*22/Math.max(1,wd);ax+=wx/wd*ff-wy/wd*ff*.45;ay+=wy/wd*ff+wx/wd*ff*.45;az+=wz/wd*ff}}
const r=Math.hypot(x,y)+.1,bp=B*au*(e=='fire'?42:12)/mass;ax+=x/r*bp;ay+=y/r*bp;
if(e=='earth')ay+=Math.sin(x*1.5+t*18)*B*au*14/mass;
if(e=='air'){ay+=T*au*18/mass;ax+=Math.cos(wind)*M*au*8;az+=Math.sin(wind)*M*au*8}
if(e=='water'){ax+=Math.sin(t*.5+y*.3)*M*au*6;ay+=Math.cos(t*.4+x*.3)*M*au*3}
let vx=(vel[i3]+ax*dt)*damp,vy=(vel[i3+1]+ay*dt)*damp,vz=(vel[i3+2]+az*dt)*damp;const s2=vx*vx+vy*vy+vz*vz;if(s2>625){const q=25/Math.sqrt(s2);vx*=q;vy*=q;vz*=q}
x+=vx*dt;y+=vy*dt;z+=vz*dt;if(y<fl){y=fl;vy=-vy*P.elas*.9;vx*=.92}
pos[i3]=x;pos[i3+1]=y;pos[i3+2]=z;vel[i3]=vx;vel[i3+1]=vy;vel[i3+2]=vz;sp[i]=Math.min(1,Math.sqrt(s2)*.1)}}
/* ---------- look ---------- */
function look(){const p=PAL[S.theme][S.el],pe=S.theme=='pearl';qm.uniforms.uC.value.set(p[0]);pts.visible=!useF||S.el=='fire'||S.el=='air';if(fb){pts.material.color.set(p[0]);pts.material.blending=pe?THREE.NormalBlending:THREE.AdditiveBlending;pts.material.needsUpdate=true}mat.uniforms.c1.value.set(p[0]);mat.uniforms.c2.value.set(p[1]);mat.uniforms.c3.value.set(p[2]);
mat.blending=pe?THREE.NormalBlending:THREE.AdditiveBlending;mat.uniforms.uOp.value=pe?.85:1;mat.needsUpdate=true;
document.documentElement.dataset.theme=S.theme;document.body.style.background=S.theme=='ember'?`radial-gradient(55% 45% at 72% 0%,${BG.ember[S.el]},transparent 70%),radial-gradient(40% 40% at 100% 25%,#4b4f2c99,transparent 70%),radial-gradient(40% 35% at 0% 5%,#7a2c1e99,transparent 70%),#171615`:`radial-gradient(ellipse at 50% 42%,${BG[S.theme].c},${BG[S.theme][S.el]} 85%)`;
$('#ht').textContent=EC[S.el];mat.uniforms.uSize.value=(4+S.P.dens*8)*(useF?.45:1)}
function apply(){setShape(S.shape);look()}
/* ---------- history ---------- */
function snap(){const j=JSON.stringify(S);if(hist[hi]===j)return;hist=hist.slice(0,hi+1);hist.push(j);if(hist.length>40)hist.shift();hi=hist.length-1}
function load(j){S=Object.assign(DEF(),JSON.parse(j));apply();rp()}
function undo(){if(hi>0){hi--;load(hist[hi])}}function redo(){if(hi<hist.length-1){hi++;load(hist[hi])}}
/* ---------- UI ---------- */
const TABS=['Elements','Physics','Shapes','Materials','Sound','Forces','Capture','More'];
TABS.forEach(n=>{const b=document.createElement('button');b.textContent=n;b.dataset.t=n;$('#dock').appendChild(b)});
$('#dock').onclick=e=>{const t=e.target.dataset.t;if(!t)return;tab=tab==t?null:t;rp()};
const B_=(a,l,on)=>`<button data-a="${a}" class="${on?'on':''}">${l}</button>`;
function slider(k,l,mn,mx,w){const o=k.startsWith('P.'),v=o?S.P[k.slice(2)]:S[k],n=(v-mn)/(mx-mn),d=w?w[n<.34?0:n<.67?1:2]:'';return`<div class="sl"><div><label>${l}</label><span id="v_${k.replace('.','_')}">${d} ${Math.round(n*100)}%</span></div><input type="range" style="--fill:${Math.round(n*100)}%" data-k="${k}" min="${mn}" max="${mx}" step=".01" value="${v}" data-w="${w||''}" data-mn="${mn}" data-mx="${mx}"></div>`}
function rp(){const p=$('#panel');document.body.classList.toggle('po',!!tab);document.querySelectorAll('#dock button').forEach(b=>b.classList.toggle('on',b.dataset.t==tab));if(!tab){p.style.display='none';return}p.style.display='block';p.classList.remove('show');void p.offsetWidth;p.classList.add('show');let h=`<h3>${tab}</h3>`;
if(tab=='Elements'){h+='<div class="g">'+Object.keys(EL).map(k=>B_('el:'+k,'<i class="sw" style="background:radial-gradient(circle at 30% 30%,'+PAL.midnight[k][2]+','+PAL.midnight[k][0]+' 60%,'+PAL.midnight[k][1]+')"></i>'+EL[k][0]+' · '+EL[k][1],S.el==k)).join('')+'</div><h3>Mood → universe</h3><div class="g">'+Object.keys(MOODS).map(k=>B_('mood:'+k,k)).join('')+'</div><p class="n">Any sound works in any world; genres are only suggestions.</p>'}
else if(tab=='Physics'){h+='<p class="n">MATTER LAB — every slider drives the live simulation.</p>'+SL.map(s=>slider(...s)).join('')+'<div class="g">'+B_('resetx','Reset experiment')+'</div>'}
else if(tab=='Shapes'){h+='<div class="g">'+[['orb','Orb · Sculpt'],['surface','Surface · Immerse'],['fragments','Fragments · Destroy'],['torus','Torus · Flow']].map(s=>B_('shape:'+s[0],s[1],S.shape==s[0])).join('')+'</div><div class="g">'+B_('morph','Auto-morph (continuous)',S.morph)+'</div>'}
else if(tab=='Materials'){h+='<div class="g">'+B_('theme:pearl','Pearl',S.theme=='pearl')+B_('theme:midnight','Midnight',S.theme=='midnight')+B_('theme:ember','Ember',S.theme=='ember')+'</div><p class="n">Interface and matter lighting. Render:</p><div class="g">'+B_('surf',useF?'Liquid surfaces: on':'Liquid surfaces: off',useF)+'</div>'}
else if(tab=='Sound'){h+='<div class="g">'+B_('gen',genOn?'■ Stop generated sound':'▶ Generate sound',genOn)+'</div><p class="n">Local track (analysed with Web Audio):</p><input type="file" accept="audio/*" id="file"><div class="g" style="margin-top:8px">'+B_('fpause',fileOn?'Pause track':'Play track')+'</div><p class="n">Spotify is not included in this build. With no audio playing, the world runs a gentle idle pulse.</p>'}
else if(tab=='Forces'){h+='<div class="modes">'+[['attract','◎','Attract'],['repel','↗','Repel'],['swirl','⟳','Vortex'],['grab','✥','Grab']].map(m=>'<button data-a="cm:'+m[0]+'" class="'+(S.cm==m[0]?'on':'')+'"><span>'+m[1]+'</span>'+m[2]+'</button>').join('')+'</div><p class="n tip"><i class="ld"></i>'+TIP[S.cm]+'</p>'+slider('react','Audio influence',0,1,['Subtle','Balanced','Intense'])+slider('reform','Reform pull',0,1,['Drifting','Gathering','Magnetic'])+slider('radius','Force radius',0,1,['Tight','Reach','Wide'])+slider('count','Particle count',.2,1,['Sparse','Rich','Dense'])+'<div class="g">'+B_('burst','✺ Burst')+B_('well','◎ Drop gravity well')+B_('explode','Explode')+'</div>'}
else if(tab=='Capture'){h+='<div class="g">'+B_('freeze',freeze?'Resume':'Freeze frame',freeze)+B_('export','Export PNG')+'</div><p class="n">Export composites the current frame over the world background.</p>'}
else{h+='<div class="g">'+B_('rand','Randomize')+B_('undo','Undo')+B_('redo','Redo')+B_('reset','Reset world')+B_('fs','Fullscreen')+'</div><h3>Aurelle fingerprint</h3><canvas id="fp" width="90" height="90"></canvas><textarea id="code" spellcheck="false">'+btoa(JSON.stringify(S))+'</textarea><div class="g" style="margin-top:6px">'+B_('copy','Copy code')+B_('loadc','Load code')+'</div>'}
p.innerHTML=h;if(tab=='More')fp();const f=$('#file');if(f)f.onchange=()=>loadFile(f.files[0])}
function fp(){const c=$('#fp').getContext('2d'),pl=PAL[S.theme][S.el],ks=Object.keys(S.P);c.clearRect(0,0,90,90);ks.forEach((k,i)=>{const a=i/ks.length*6.283,v=S.P[k]/(k=='time'?2:1);c.strokeStyle=pl[i%3];c.lineWidth=5;c.beginPath();c.moveTo(45+Math.cos(a)*10,45+Math.sin(a)*10);c.lineTo(45+Math.cos(a)*(10+v*32),45+Math.sin(a)*(10+v*32));c.stroke()});c.fillStyle=pl[1];c.fillRect(42,42,6,6)}
const panel=$('#panel');
panel.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;const v=+e.target.value;if(k.startsWith('P.'))S.P[k.slice(2)]=v;else S[k]=v;const n=(v-e.target.dataset.mn)/(e.target.dataset.mx-e.target.dataset.mn),w=e.target.dataset.w.split(',');e.target.style.setProperty('--fill',Math.round(n*100)+'%');if(k=='count')meta();$('#v_'+k.replace('.','_')).textContent=(w[1]?w[n<.34?0:n<.67?1:2]:'')+' '+Math.round(n*100)+'%';if(k=='P.dens')look()});
panel.addEventListener('change',e=>{if(e.target.dataset.k)snap()});
panel.addEventListener('click',e=>{const a=e.target.dataset.a;if(!a)return;const[x,y]=a.split(':');
if(x=='el'){const t=S.P.time;S.el=y;S.P={...PRE[y],time:t};look()}
else if(x=='mood'){const m=MOODS[y];S.el=m[0];S.shape=m[1];S.theme=m[2];S.P={...PRE[m[0]],...m[3]};apply()}
else if(x=='shape')setShape(y);
else if(x=='theme'){S.theme=y;look()}
else if(x=='cm')S.cm=y;
else if(x=='morph')S.morph=!S.morph;
else if(x=='explode')explode();
else if(x=='resetx'){S.P={...PRE[S.el]};look()}else if(x=='surf'){useF=!useF;look()}
else if(x=='reset'){S=DEF();apply()}
else if(x=='gen')genToggle();
else if(x=='fpause'){if(fEl){fileOn?fEl.pause():fEl.play();fileOn=!fileOn}}
else if(x=='freeze')freeze=!freeze;
else if(x=='export')exp();
else if(x=='rand')randomize();
else if(x=='undo'){undo();return}else if(x=='redo'){redo();return}
else if(x=='burst'){burst(cl,4.5,20);addRipple(px_||innerWidth/2,py_||innerHeight/2,2.2)}else if(x=='well'){wells.push({x:cl.x,y:cl.y,z:0,pw:1,l:1,ph:Math.random()*6});if(wells.length>5)wells.shift()}else if(x=='fs')ui();
else if(x=='copy'){const t=$('#code');t.select();try{navigator.clipboard.writeText(t.value)}catch(_){document.execCommand('copy')}return}
else if(x=='loadc'){try{load(atob($('#code').value.trim()));snap()}catch(_){alert('Invalid Aurelle code')}return}
if(MSG[x])notify(MSG[x](y));snap();rp()});
function ui(){document.body.classList.toggle('hid');if(document.body.classList.contains('hid')){document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}else if(document.fullscreenElement)document.exitFullscreen()}
$('#fsb').onclick=ui;
function exp(){draw();const w=cv.width,h=cv.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),gr=g.createRadialGradient(w/2,h*.42,0,w/2,h*.42,Math.max(w,h)*.7);gr.addColorStop(0,BG[S.theme].c);gr.addColorStop(1,BG[S.theme][S.el]);g.fillStyle=gr;g.fillRect(0,0,w,h);g.drawImage(cv,0,0);g.globalCompositeOperation=S.theme=='pearl'?'multiply':'screen';g.drawImage(fx,0,0,w,h);c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='aurelle-'+S.el+'-'+S.shape+'.png';a.click()})}
$('#enter').onclick=()=>{initA();$('#intro').classList.add('out')};
/* ---------- loop ---------- */
const bars=[...document.querySelectorAll('#m u')];let last=performance.now(),tt=0,mt=0;
function loop(now){requestAnimationFrame(loop);const dtr=Math.min(.033,(now-last)/1e3);last=now;const t=now/1e3;meters(t);
if(S.morph&&(mt+=dtr)>6){mt=0;const o=['orb','torus','fragments','surface'];setShape(o[(o.indexOf(S.shape)+1)%4])}
cam.position.z+=(cz-cam.position.z)*.1;pts.rotation.y+=(rotY-pts.rotation.y)*.2+(S.shape=='surface'?0:.0015);rotY=pts.rotation.y;pts.rotation.x+=(rotX-pts.rotation.x)*.2;
cam.updateMatrixWorld();pts.updateMatrixWorld();const v=new THREE.Vector3(nx,ny,.5).unproject(cam).sub(cam.position).normalize();cp.copy(cam.position).addScaledVector(v,-cam.position.z/v.z);const nl=pts.worldToLocal(cp.clone());pv.copy(nl).sub(cl);pv.clampLength(0,1.5);cl.copy(nl);
if(down)charge=Math.min(2.5,charge+dtr);else charge*=.9;
if(coreDrag){core.x+=cp.x-lastCp.x;core.y+=cp.y-lastCp.y;core.vx=cp.x-lastCp.x;core.vy=cp.y-lastCp.y}else{core.x+=core.vx;core.y+=core.vy;core.vx*=.94;core.vy*=.94}core.x=Math.max(-8,Math.min(8,core.x));core.y=Math.max(-4.5,Math.min(4.5,core.y));lastCp.copy(cp);pts.position.set(core.x,core.y,0);
if(!freeze){tt+=dtr*S.P.time;step(dtr,tt);geo.attributes.position.needsUpdate=true;geo.attributes.aV.needsUpdate=true}
if(!fb&&++fr==3){const pr=R.info.programs||[];if(!pr.length||pr.some(q=>q.diagnostics&&q.diagnostics.runnable===false))fallback()}
mat.uniforms.uG.value=B*S.react;[B,M,T].forEach((x,i)=>bars[i].style.height=Math.max(3,Math.min(22,x*30))+'px');funi(dtr);draw();drawFx(dtr,tt);stat()}

const EC={fire:'02 — FIRE · Volatile / bright / explosive',water:'01 — WATER · Fluid / adaptive / reflective',earth:'03 — EARTH · Dense / grounded / mineral',air:'04 — AIR · Weightless / ethereal / free'},SN={orb:'ORBITAL FORM 001',torus:'ORBITAL SYSTEM 002',surface:'INFINITE SURFACE 003',fragments:'FRAGMENT FIELD 004'};
const TIP={attract:'Draw matter toward your cursor like a magnetic field.',repel:'Push matter away. Hold, then release for an impact pulse.',swirl:'Bend nearby matter into a spinning current.',grab:'Drag to pull matter and carry the whole form with inertia.'};
const wells=[],core={x:0,y:0,vx:0,vy:0},lastCp=new THREE.Vector3();let coreDrag=0,px_=0,py_=0,ripples=[],tmr,lastSt='';
const MSG={el:y=>EL[y][0]+' world',mood:y=>y+' atmosphere applied',shape:y=>SN[y],theme:y=>y+' appearance',explode:()=>'Matter scattered',burst:()=>'Impact pulse released',well:()=>'Gravity well deployed — matter is drawn inward',rand:()=>'A new universe, generated',reset:()=>'World reset',resetx:()=>'Physics restored to baseline',gen:()=>genOn?'Generative sound on':'Generative sound off',freeze:()=>freeze?'Frame frozen':'Motion resumed',export:()=>'Artwork captured as PNG',cm:y=>({attract:'Attract',repel:'Repel',swirl:'Vortex',grab:'Grab'})[y]+' mode'};
function notify(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tmr);tmr=setTimeout(()=>t.classList.remove('show'),2200)}
function meta(){$('#sm').innerHTML='MATTER STUDY<b>'+SN[S.shape]+'</b>Free motion · '+Math.round(N*S.count)+' particles'}
function stat(){const t=fileOn?'ANALYSING TRACK':genOn?'GENERATIVE SOUND':'IDLE PULSE';if(t!=lastSt){lastSt=t;$('#stt').textContent=t}}
function randomize(){Object.keys(S.P).forEach(k=>S.P[k]=k=='time'?rnd(.6,1.4):rnd(.05,.95));S.el=['fire','water','earth','air'][Math.random()*4|0];S.cm=['attract','repel','swirl','grab'][Math.random()*4|0];setShape(['orb','surface','fragments','torus'][Math.random()*4|0]);look()}
$('#surp').onclick=()=>{randomize();snap();notify(MSG.rand());rp()};
addEventListener('keydown',e=>{if(e.key=='Escape'){tab=null;rp()}if(e.key.toLowerCase()=='p'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){S.theme=S.theme=='pearl'?'midnight':'pearl';look();snap();rp()}});
const fx=$('#fx'),fc=fx.getContext('2d');
function fxr(){const d=Math.min(devicePixelRatio,2);fx.width=innerWidth*d;fx.height=innerHeight*d;fc.setTransform(d,0,0,d,0,0)}fxr();addEventListener('resize',fxr);
const ha=(c,a)=>c+Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
const proj=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).project(cam);return[(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight]};
function addRipple(x,y,p){ripples.push({x,y,r:2,p,l:1});if(ripples.length>24)ripples.shift()}
function drawFx(dt,t){const W=innerWidth,H=innerHeight;fc.clearRect(0,0,W,H);const p=PAL[S.theme][S.el],a=B*S.react,u=H/(2*.4663*cam.position.z),sc2=.55+S.P.vol*.9,[cx,cy]=proj(pts.position.x,pts.position.y,0),R_=2.2*sc2*u*.88;
if(S.shape=='orb'||S.shape=='torus'){const g=fc.createRadialGradient(cx,cy,R_*.15,cx,cy,R_*1.9);g.addColorStop(0,ha(p[0],.14+a*.12));g.addColorStop(.55,ha(p[2],.05));g.addColorStop(1,ha(p[0],0));fc.globalAlpha=1;fc.fillStyle=g;fc.fillRect(cx-R_*2,cy-R_*2,R_*4,R_*4)}
if(S.shape=='orb'){for(let j=0;j<3;j++){fc.beginPath();fc.ellipse(cx,cy,R_*(1.28+j*.18),R_*(.37+j*.04),-.56+j*.31+t*(.025+j*.009),0,6.283);fc.strokeStyle=j==1?p[1]:p[2];fc.globalAlpha=(j==1?.4:.2)+a*.3;fc.lineWidth=j==1?1.1:.7;fc.stroke()}
for(let j=0;j<7;j++){const g=t*.22+j*.8976;fc.fillStyle=p[2];fc.globalAlpha=.35+.25*Math.sin(t+j);fc.beginPath();fc.arc(cx+Math.cos(g)*R_*1.15,cy+Math.sin(g)*R_*1.15,1.2+a*2,0,6.283);fc.fill()}}
else if(S.shape=='torus'){const r=R_*1.15;for(let j=0;j<5;j++){const g=t*(.07+j*.015)+j*1.2;fc.beginPath();fc.ellipse(cx+Math.cos(g)*15,cy+Math.sin(g)*11,r*(1+j*.13),r*(.28+j*.035),-.62+j*.3,0,6.283);fc.strokeStyle=j%2?p[0]:p[1];fc.lineWidth=j==2?1.3:.7;fc.globalAlpha=.2+a*.25;fc.stroke()}}
else if(S.shape=='surface'){fc.lineWidth=.7;for(let L=0;L<10;L++){fc.beginPath();const by=H*(.36+L*.045),am=15+L*5+a*34;for(let x=-20;x<=W+20;x+=10){const y=by+Math.sin(x*(.003+L*.00028)+t*(.65+L*.04)+L)*am+Math.sin(x*.009-t*.8+L)*am*.25;x==-20?fc.moveTo(x,y):fc.lineTo(x,y)}fc.strokeStyle=L%2?p[0]:p[1];fc.globalAlpha=.14+L*.012+a*.08;fc.stroke()}}
ripples=ripples.filter(r=>r.l>0);ripples.forEach(r=>{if(!freeze){r.r+=(1.5+r.p*1.2)*dt*60;r.l-=.007*dt*60}fc.beginPath();fc.arc(r.x,r.y,r.r,0,6.283);fc.strokeStyle=p[1];fc.globalAlpha=Math.max(0,r.l*.4);fc.lineWidth=1+r.p*.5;fc.stroke()});
wells.forEach(w=>{w.l-=freeze?0:dt*.02;const wp=pts.localToWorld(new THREE.Vector3(w.x,w.y,w.z)),[wx,wy]=proj(wp.x,wp.y,wp.z);[18+Math.sin(t*2+w.ph)*4,30+Math.sin(t*1.2+w.ph)*7].forEach(rr=>{fc.beginPath();fc.arc(wx,wy,rr,0,6.283);fc.strokeStyle=p[1];fc.globalAlpha=Math.max(0,w.l)*.6;fc.lineWidth=1.2;fc.stroke()})});
for(let i=wells.length-1;i>=0;i--)if(wells[i].l<=0)wells.splice(i,1);
if(coreDrag){fc.beginPath();fc.arc(px_,py_,26,0,6.283);fc.strokeStyle=p[2];fc.globalAlpha=.6;fc.lineWidth=1.2;fc.stroke()}fc.globalAlpha=1}
setShape('orb');{const s0=.55+S.P.vol*.9;for(let i=0;i<N*3;i++){Hc[i]=HT[i];pos[i]=HT[i]*s0*(1+Math.random()*1.2)}}look();snap();requestAnimationFrame(loop);
