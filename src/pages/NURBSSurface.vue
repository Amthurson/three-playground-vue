<template>
    <div class="wrap">
      <!-- 视窗 -->
      <div class="container" ref="containerRef" id="container">
      </div>
      <!-- 控件 -->
      <div :class="`pannel ${!showMenu ?'hide':''}`">
        <!-- <div @click="showMenu = !showMenu" class="slide">
          >
        </div> -->
        <label for="models">选择天空:</label>
        <div>
          <label for="skyType">Three Sky实例: </label>
          <input type="radio" name="skyType" checked @change="(e)=>handleOnChangeRange(e,'skyType')" value="1">
          <label for="skyType">CubeTexture贴图天空: </label>
          <input type="radio" name="skyType" @change="(e)=>handleOnChangeRange(e,'skyType')" value="0">
        </div>
        <select name="curSkyTextureIndex" v-if="skyType==='0'" @change="(e)=>handleOnChangeRange(e,'curSkyTextureIndex')">
          <option v-for="(item,index) in skyTexture" :key="item" :selected="index === curSkyTextureIndex" :value="index">{{item.name}}</option>
        </select>
        <label for="rotationSpeed">场景旋转速度:{{rotationSpeed}}</label>
        <input type="range" min="0" max="50000" step="1" :value="rotationSpeed" @input="(e)=>handleOnChangeRange(e,'rotationSpeed')" name="rotationSpeed" class="rotationSpeed" />
      </div>
      <!-- 信息窗口 -->
      <div :class="`infoPopwindow ${showChosenObject?'':'hide'}`">
        <div class="tree" v-if="objInfo.tree">
          <treeselect style="width:fit-content;" v-model="objInfo.value" :multiple="true" :options="objInfo.tree">
          </treeselect>
        </div>
      </div>
      <!-- 信息窗口 -->
      <div :class="`chosenObjInfo ${showChosenObject?'':'hide'}`">
        <div class="row">
          <div @click="showClickDetails=!showClickDetails" style="cursor:pointer" class="title">选中元件属性</div>
          <div @click="showChosenObject=false" class="close">→</div>
        </div>
        <div class="details">
          <div class="row">
            <div class="label">uuid:</div>
            <div class="value">{{chosenObjectInfo.object.uuid}}</div>
          </div>
          <div class="row">
            <div class="label">name:</div>
            <div class="value">{{chosenObjectInfo.object.name}}</div>
          </div>
          <div class="row">
            <div class="label">parent uuid:</div>
            <div class="value">{{chosenObjectInfo.object.parent.uuid}}</div>
          </div>
          <div class="row">
            <div class="label">parent name:</div>
            <div class="value">{{chosenObjectInfo.object.parent.name}}</div>
          </div>
          <div :class="`row ${showClickDetails?'':'hide'}`">
            <div class="label">all info:</div>
            <div class="clickInfo">
              {{JSON.stringify(chosenObjectInfo.object)}}
            </div>
          </div>
        </div>
      </div>
      <!-- loading -->
      <div v-if="progress!==100" class="loading-wrap">
        <div class="loading">
          <div :style="{width: progress/100*298 + 'px'}" class="progress"></div>
          <div class="info">加载中... {{ progress }} %</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { defineComponent, onMounted, reactive, toRefs, ref, watch } from "vue";
  import { 
      Scene,
      Line,
      LineBasicMaterial,
      Vector3,
      BufferGeometry,
      PerspectiveCamera,
      WebGLRenderer,
      AmbientLight,
      Color,
      DirectionalLight,
      LineDashedMaterial,
      Points,
      PointsMaterial,
      SphereGeometry, // 球体
      Raycaster,
      Vector2,
      AnimationMixer, // 动画
      Clock, // delta time
      // BoxGeometry,
      MeshBasicMaterial,
      Mesh,
      AxesHelper,
      WebGLCubeRenderTarget,
      RGBAFormat,
      LinearMipmapLinearFilter,
      CubeCamera,
      CubeTextureLoader,
      TextureLoader,
      MeshStandardMaterial,
      RepeatWrapping,
      PlaneGeometry,
      ImageUtils,
      Group,
      MeshLambertMaterial,
      DoubleSide,
      Vector4,
  } from "three";
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  // import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
  
  // threejs自带天空示例
  import { Sky } from 'three/examples/jsm/objects/Sky.js';
  
    import { NURBSSurface } from 'three/examples/jsm/curves/NURBSSurface.js';
    import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';


  // 树控件
  // import Treeselect from '@riophae/vue-treeselect'
  // import '@riophae/vue-treeselect/dist/vue-treeselect.css'
  import Treeselect from 'vue3-treeselect'
  import 'vue3-treeselect/dist/vue3-treeselect.css'
  
  // 加载模型
  import { api_getModel } from '@/service/index.js';
  
  export default  defineComponent({
    name: "ThreeDemo",
    components: {
      Treeselect
    },
    setup() {
      const containerRef = ref(null);
      const state = reactive({
        lineColor: "#ff7cff", // 线颜色
        showClickDetails: false,
        showChosenObject: false,
        progress: 100,// 加载进度
        scene: {}, // 场景
        camera: {}, // 镜头
        orbitControl: null, // 镜头轴操控实例
        clock: {}, // three时钟实例
        mixer: {}, // 混合空间
        renderer: {}, // 渲染容器,
        axis: {}, // 坐标轴
        clickPoint: null, // 点击射线碰撞后落点标记 
        nodesCount: 1, // 旋转曲线 - 单圈节点
        layerHeight: 1, // 旋转曲线 - 单层高度
        radius: 1, // 旋转曲线 - 单圈半径
        layers: 1, // 旋转曲线 - 层数
        pointCounts: 1, // 随机曲线 - 点数
        resPoints: [], // 随机曲线 - 点集
        linewidth: 1, // 线宽
        lineType: "2", // 实虚线
        line: {}, // 几何线集对象
        point: {}, // 几何点集对象
        randerArray: [
          100,20,100
        ], // 随机点位边界
        rotationSpeed: 4,
        gltfObjs: [], // 加载的模型对象集
        modalAlpha: 0.5, // 模型透明度
        markers: [], // 添加marker
        currentModelIndex: 6, // 默认选择模型
        models: [ // 模型列表
          {
            name: '卡通平层office场景',
            config: {
              path: '/models/isometric_office/',
              fileName: "scene.gltf",
              position: [50,0,-50],
              rotation: [0,0,0],
              scale: [10,10,10],
            },
            cacheIndex: null
          },
          {
            name: '半透丰富结构建筑',
            config: {
              path: '/models/casa_mvc_-_apresentacao/',
              fileName: "scene.gltf",
              position: [-100,100,0],
              rotation: [0,0,0],
              scale: [10,10,10],
            },
            cacheIndex: null
          },
          {
            name: '红砖楼',
            config: {
              path: '/models/buildings/',
              fileName: "scene.gltf",
              position: [0,0,0],
              rotation: [0,0,0],
              scale: [5,5,5],
            },
            cacheIndex: null
          },
          {
            name: '简单工地工程',
            config: {
              path: '/models/buildings_pack/',
              fileName: "test.glb",
              position: [0,0,150],
              rotation: [0,0,0],
              scale: [50,50,50],
            },
            cacheIndex: null
          },
          {
            name: '工贸-实训楼装修',
            config: {
              path: '/models/工贸-实训楼装修/',
              fileName: "model.gltf",
              position: [0,0,0],
              rotation: [0,0,0],
              scale: [0.1,0.1,0.1],
            },
            cacheIndex: null,
            type: "DRACO"
          },
          {
            name: 'BEE',
            config: {
              path: '/models/',
              fileName: "bee.glb",
              position: [0,0,0],
              rotation: [0,0,0],
              scale: [1,1,1],
            },
            cacheIndex: null
          },
          {
            name: '塔吊模型',
            config: {
              path: '/models/crane/',
              fileName: "scene.gltf",
              position: [0,30,0],
              rotation: [0,0,0],
              scale: [0.05,0.05,0.05],
            },
            cacheIndex: null
          },
          {
            name: '广交会部分BIM',
            config: {
              path: '/models/v1/',
              fileName: "main.gltf",
              position: [-160,0,-65],
              rotation: [0,0,0],
              scale: [0.05,0.05,0.05],
            },
            cacheIndex: null
          },
          {
            name: '广交会部分BIM2',
            config: {
              path: '/models/v2/',
              fileName: "main.gltf",
              position: [-200,0,-80],
              rotation: [0,0,0],
              scale: [0.2,0.2,0.2],
              pieces: 4
            },
            cacheIndex: null
          },
          {
            name: '广交会西区钢结构',
            config: {
              path: '/models/guangjiaohui_gangjiegou/',
              fileName: "main.gltf",
              position: [0,0,0],
              rotation: [0,0,0],
              scale: [0.2,0.2,0.2],
              pieces: 4
            },
            cacheIndex: null
          }
        ],
        showMenu: false, 
        chosenObjectInfo: {
          object: {
            uuid: "",
            name: "",
            parent: {
              uuid: "",
              name: ""
            }
          }
        },
        objInfo: {
          value:null,
          tree:[]
        }, // gltf对象信息
        settings: { // 动画参数
          idleWeight: 0.0,
          hoverWeight: 0.5,
          flyWeight: 0.1,
        },
        skyType: '1', // 天空类型 0- 贴图 1- threejs sky对象
        curSkyTextureIndex: 0,
        skyTexture: [ // 天空材质素材
          {
            name: "晴朗天空",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox4/negz.jpg'
            ]
          },
          {
            name: "黑暗盒子",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox1/negz.jpg'
            ]
          },
          {
            name: "傍晚天空",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox2/negz.jpg'
            ]
          },
          {
            name: "雪地广场",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox3/negz.jpg'
            ]
          },
          {
            name: "黑白天空",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox5/negz.jpg'
            ]
          },
          {
            name: "草原",
            urls: [
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/posx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/negx.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/posy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/negy.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/posz.jpg',
              import.meta.env.VITE_BASE_API+'/skyTexture/skyBox6/negz.jpg'
            ]
          }
        ],
        sky: null, // 天空实例,
        SunParameters: null, // 太阳参数
        cubeCamera: null, // cudeCam实例
        cubeRenderTarget: null, // CudeCam渲染目标
        light: null, // directLight
        earthBall: null, // 地球实例
        group: null,
        nsControlPoints: [
            [
                new Vector4( - 200, - 200, 100, 1 ),
                new Vector4( - 200, - 100, - 200, 1 ),
                new Vector4( - 200, 100, 250, 1 ),
                new Vector4( - 200, 200, - 100, 1 )
            ],
            [
                new Vector4( 0, - 200, 0, 1 ),
                new Vector4( 0, - 100, - 100, 5 ),
                new Vector4( 0, 100, 150, 5 ),
                new Vector4( 0, 200, 0, 1 )
            ],
            [
                new Vector4( 200, - 200, - 100, 1 ),
                new Vector4( 200, - 100, 200, 1 ),
                new Vector4( 200, 100, - 250, 1 ),
                new Vector4( 200, 200, 100, 1 )
            ]
        ]
      });

      // 创建场景
      const init = () => {
          // 创建场景 ------------------------------------------------------------------------------------
          const scene = new Scene();
  
          // 创建相机 ------------------------------------------------------------------------------------
          const camera = new PerspectiveCamera(75, containerRef.value.clientWidth/ containerRef.value.clientHeight,0.1,100000000); // 创建镜头
  
          camera.position.x = -122.67650143873007;
          camera.position.y = 134.0421831042352;
          camera.position.z = -293.1235789487993;
  
          const renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
          }); // 创建容器);
          renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
          // 添加坐标轴 ------------------------------------------------------------------------------------
          const axis = new AxesHelper(2000);
          state.axis;
          scene.add(axis);
  
          containerRef.value.appendChild(renderer.domElement);
  
          // 世界时间
          state.clock = new Clock();
  
          // 添加灯光 ------------------------------------------------------------------------------------
          const ambientLight = new AmbientLight(0xffffff, 1);
          scene.add(ambientLight);
  
          const directionalLight = new DirectionalLight( 0xffffff, 1 );
          scene.add( directionalLight );
          state.light = directionalLight
  
          // 添加控制器 ------------------------------------------------------------------------------------
          state.orbitControl = new OrbitControls(camera, containerRef.value);
          state.orbitControl.enableDamping = true;
          state.orbitControl.enablePan = false; // 禁止移动相机
          state.orbitControl.maxDistance = 800; // 最远距离
          state.orbitControl.minDistance = 160; // 最近距离
          state.orbitControl.listenToKeyEvents(containerRef.value)
  
          // 镜头聚焦到场景原点
          camera.lookAt(scene.position);
         
          // 加载gltf模型（glb)  ------------------------------------------------------------------------------------
          // loafGLTF(state.models[state.currentModelIndex].config);
  
          // 监听点击
          // click();
  
          // 渲染结果 ------------------------------------------------------------------------------------
          function animate() {
            if(state.rotationSpeed) scene.rotation.y += state.rotationSpeed * 0.001;
            renderer.render( scene, camera );
  
            if(state.mixer) {
              const mixerUpdateDelta = state.clock.getDelta();
              // console.log(state.mixer);
              state.mixer.update && state.mixer.update( mixerUpdateDelta );
            }
            window.__camera = state.camera;
            state.orbitControl.update();
            requestAnimationFrame( animate );
          };
  
          animate();
          state.scene = scene;
          state.renderer = renderer
          state.camera = camera;
  
          // 创建天空
          initSky();  // three Sky实例
          // initCudeTextureSky(); // 贴图材质天空
          addSurface();
      }
  
      // 初始化天空
      const initSky = ()=>{
        let sky = new Sky();
        let uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = 0;
        uniforms[ 'rayleigh' ].value = 0.001;
        uniforms[ 'mieCoefficient' ].value = 0;
        uniforms[ 'mieDirectionalG' ].value = 0;
        let SunParameters = {
          distance: 100000,
          inclination: 0.49,//倾向
          azimuth: 0.205//方位角
        };
        state.SunParameters = SunParameters
   
        const cubeRenderTarget = new WebGLCubeRenderTarget(128, {
          format: RGBAFormat,
          generateMipmaps: true,
          minFilter: LinearMipmapLinearFilter
        })
   
        const cubeCamera = new CubeCamera( 0.01, 1000, cubeRenderTarget );
  
        sky.scale.setScalar( 450000 );
        state.sky = sky
        state.scene.add(sky);
        state.cubeCamera = cubeCamera
        state.cubeRenderTarget = cubeRenderTarget
        updateSun()
      };
      // directLight平行光与镜头同步
      const updateSun = ()=>{
        let parameters = state.SunParameters
        let sky = state.sky 
        let cubeCamera = state.cubeCamera 
        let light = state.light
        let theta = Math.PI * ( parameters.inclination - 0.5 );
        let phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );
        light.position.x = parameters.distance * Math.cos( phi );
        light.position.y = parameters.distance * Math.sin( phi ) * Math.sin( theta );
        light.position.z = parameters.distance * Math.sin( phi ) * Math.cos( theta );
   
        sky.material.uniforms[ 'sunPosition' ].value = light.position.copy( light.position );
        // this.water.material.uniforms[ 'sunDirection' ].value = light.position.clone().normalize();
        // cubeCamera.update( state.renderer, sky );
   
        state.scene.background = state.cubeRenderTarget.texture
      }
  
      // 更新场景尺寸
      const updateViewSize = () => {
        const { camera } =state;
        if(camera) {
          // Update camera
          state.camera.aspect = containerRef.value.clientWidth/ containerRef.value.clientHeight;
          state.camera.updateProjectionMatrix();
        
          // Update renderer
          state.renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
          state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }

      watch(
        ()=>containerRef.value,
        (newVal, oldVal)=>{
          if(newVal && newVal.clientWidth > 0) {
            init();
          }
        }
      );
  
    // NURBS surface
    const addSurface = () => {
        let group = new Group();
        group.position.y = 50;
        state.scene.add( group );
        // const nsControlPoints = [
        //     [
        //         new Vector4( - 200, - 200, 100, 1 ),
        //         new Vector4( - 200, - 100, - 200, 1 ),
        //         new Vector4( - 200, 100, 250, 1 ),
        //         new Vector4( - 200, 200, - 100, 1 )
        //     ],
        //     [
        //         new Vector4( 0, - 200, 0, 1 ),
        //         new Vector4( 0, - 100, - 100, 5 ),
        //         new Vector4( 0, 100, 150, 5 ),
        //         new Vector4( 0, 200, 0, 1 )
        //     ],
        //     [
        //         new Vector4( 200, - 200, - 100, 1 ),
        //         new Vector4( 200, - 100, 200, 1 ),
        //         new Vector4( 200, 100, - 250, 1 ),
        //         new Vector4( 200, 200, 100, 1 )
        //     ]
        // ];
        const {nsControlPoints} = state;
        const degree1 = 2;
        const degree2 = 3;
        const knots1 = [ 0, 0, 0, 1, 1, 1 ];
        const knots2 = [ 0, 0, 0, 0, 1, 1, 1, 1 ];
        const nurbsSurface = new NURBSSurface( degree1, degree2, knots1, knots2, nsControlPoints );
        const map = new TextureLoader().load( '/uv_grid_opengl.jpg' );
        map.wrapS = map.wrapT = RepeatWrapping;
        map.anisotropy = 16;

        function getSurfacePoint( u, v, target ) {

            return nurbsSurface.getPoint( u, v, target );

        }

        const geometry = new ParametricGeometry( getSurfacePoint, 20, 20 );
        const material = new MeshLambertMaterial( { map: map, side: DoubleSide } );
        const object = new Mesh( geometry, material );
        object.position.set( 0,0,0 );
        object.scale.multiplyScalar( 1 );
        group.add( object );
        state.group = group;
    }

    watch(
        ()=>state.nsControlPoints,
        (n,o)=>{
            updateSurface()
        }
    )

    const updateSurface = () => {
        const {nsControlPoints} = state;
        const degree1 = 2;
        const degree2 = 3;
        const knots1 = [ 0, 0, 0, 1, 1, 1 ];
        const knots2 = [ 0, 0, 0, 0, 1, 1, 1, 1 ];
        const nurbsSurface = new NURBSSurface( degree1, degree2, knots1, knots2, nsControlPoints );
        const map = new TextureLoader().load( '/uv_grid_opengl.jpg' );
        map.wrapS = map.wrapT = RepeatWrapping;
        map.anisotropy = 16;

        function getSurfacePoint( u, v, target ) {

            return nurbsSurface.getPoint( u, v, target );

        }

        const geometry = new ParametricGeometry( getSurfacePoint, 20, 20 );
        const material = new MeshLambertMaterial( { map: map, side: DoubleSide } );
        const object = new Mesh( geometry, material );
        object.position.set( 0,0,0 );
        object.scale.multiplyScalar( 1 );
        state.group.add( object );
    }

      // 点击事件
      const click = () => {
        //点击射线碰撞
        const raycaster = new Raycaster();
        const mouse = new Vector2();
        containerRef.value.addEventListener('click', onDocumentMouseDown, false);
        function onDocumentMouseDown(event) {
            if(event.button===0) { // 判断鼠标左键
              // event.preventDefault();
              mouse.x = (event.offsetX / containerRef.value.clientWidth) * 2 - 1;
              mouse.y = -(event.offsetY / containerRef.value.clientHeight) * 2 + 1;
  
              raycaster.setFromCamera(mouse, state.camera);
              
              //总结一下，这里必须装网格，mesh，装入组是没有效果的
              //所以我们将所有的盒子的网格放入对象就可以了
              // 需要被监听的对象要存储在clickObjects中。
              const clickObjects = [];
              // state.gltfObjs.map(v=>{
              //   v.scene.traverse(obj=>{
              //       clickObjects.push(obj);
              //   });
              // });
              state.scene.traverse(obj=>{
                  clickObjects.push(obj);
              });
              var intersects = raycaster.intersectObjects(clickObjects);
  
              if(intersects.length > 0) {
                  // 标记点击位置
                  const {x,y,z} = intersects[0].point;
                  state.scene.remove(state.clickPoint);
                  const clickPoint = addPoint([[x,y,z]],"rgb(255,0,0)")
                  state.clickPoint = clickPoint;
                  state.scene.add(clickPoint);
                  // 碰撞第一个物体处理逻辑（透明度设为1，其他设为设置透明度）
                  state.gltfObjs.map(v=>{
                    setModalAlphaValue(v,state.modalAlpha);
                    state.chosenObjectInfo = intersects[0];
                    state.showChosenObject = true;
                    v.scene.traverse((obj) => {
                      if (obj.isMesh && intersects[0].object.uuid === obj.uuid) {
                        //设置mesh的一些属性（比如透明度）
                        obj.material.transparent = true;
                        const newOpacity = 1;
                        obj.material.opacity = newOpacity;
                      }
                    }); 
                    return v;
                  })
                  state.gltfObjs.map(v=>{
                    renderModels(v)
                    return v;
                  });
              } else {
                state.chosenObjectInfo = {
                  object: {
                    uuid: "",
                    name: "",
                    parent: {
                      uuid: "",
                      name: ""
                    }
                  }
                }
                state.showChosenObject = false
                // 取消选择恢复透明度
                state.gltfObjs.map(v=>{
                  setModalAlphaValue(v,state.modalAlpha);
                  return v;
                });
              }
            }
        }
      }
  
      // 加载gltf模型（glb、gltf)  ------------------------------------------------------------------------------------
      const loafGLTF = async (config) => {
        try {
          state.progress = 0;
          const {
            path,
            fileName,
            position,
            rotation,
            scale
          } = config;
  
          // 请求后端，判断是否有json，若有则为切片模型，根据json加载
          const res = await api_getModel(path+'/main-data.json');
          const modelloader = new GLTFLoader().setPath( import.meta.env.VITE_BASE_API + path );
          let fileNames = [];
          if(!res) {
            fileNames.push(fileName)
          } else {
            const { partFileNames } = res;
            fileNames = partFileNames
          }
          // 清空模型
          if(state.gltfObjs.length>0) { 
            state.gltfObjs.map(v=>{
              state.scene.remove(v.scene);
              return v;
            })
          }
          // 加载模型
          state.gltfObjs = [];
          state.objInfo.tree = [{
            name: 'Combine',
            uuid: '0-root',
            type: "dir",
            id: '0-root',
            label: 'Combination',
            children: []
          }];
          fileNames.map(v=>{
             modelloader.load(v, (obj)=>{
                state.gltfObjs.push(obj);
                // state.scene.add(obj.scene);
                // state.objInfo.tree = filterTree(obj.scenes)
                state.objInfo.tree[0].children.push(filterTree(obj.scenes)[0]) // 获取模型信息
                obj.scene.position.set(...position);
                obj.scene.rotation.set(...rotation);
                obj.scene.scale.set(...scale);
                setModalAlphaValue(obj,state.modalAlpha);
                // 动画
                state.mixer = new AnimationMixer(obj.scene);
                const animations = obj.animations;
                if(animations && animations.length>0) {
                  state.hoverAction = state.mixer.clipAction( animations[ 0 ] );
                  state.idleAction = state.mixer.clipAction( animations[ 1 ] );
                  state.flyAction = state.mixer.clipAction( animations[ 2 ] );
                  state.actions = [ 
                    state.idleAction, 
                    state.hoverAction, 
                    state.flyAction 
                  ];
                  activateAllActions();
                }
                return true;
            }, (xhr) => {
                state.progress = Math.round(xhr.loaded/xhr.total * 10000) / 100;
            }, (error) => {
                console.log("error while loading",error);
                return false;
            });
          })
        } catch (error) {
          console.log(error);
        } finally {
          state.progress =100;
        }
      }
  
      function activateAllActions() {
        setWeight( state.idleAction, state.settings[ 'idleWeight' ] );
        setWeight( state.hoverAction, state.settings[ 'hoverWeight' ] );
        setWeight( state.flyAction, state.settings[ 'flyWeight' ] );
        state.actions.forEach( function ( action ) {
          action.play();
        });
      }
  
      function setWeight( action, weight ) {
        action.enabled = true;
        action.setEffectiveTimeScale( 1 );
        action.setEffectiveWeight( weight );
      }
  
      const filterTree = (obj) => {
        return obj.map((v,i)=>({
          name:v.name || "0-root-"+i,
          uuid: v.uuid || "0-root-"+i,
          type: v.type || "",
          selected: false,
          id: v.uuid || "0-root-"+i,
          label: v.name || "0-root-"+i,
          children: v.children.length >0 ? filterTree(v.children) : []
        }))
      }
  
      // 刷新模型
      const renderModels = (obj) => {
        state.scene.remove(obj.scene);
        state.scene.add(obj.scene);
      }
  
      // 设置模型透明度
      const setModalAlphaValue = (obj, opacity) => {
        // 设置透明度
        obj.scene.traverse(function (obj) {
            obj.animations.length > 0 && console.log(obj);
            if (obj.isMesh) {
              // 设置mesh的一些属性（比如透明度）
              obj.material.transparent = true;
              const newOpacity = opacity;
              obj.material.opacity = newOpacity;
            }
        });
        // 刷新模型
        renderModels(obj);
      }
  
      // 绘制点 -------------------------------------------------------------------------------------------------------------
      const addPoint = (points=[[0,0,0]],color="rgb(255,255,0)") => {
        const pointMaterial = new PointsMaterial({
          color: new Color(color),
        })
        const pointsObj = points.map(v=>new Vector3(v[0],v[1],v[2]));
  
        // points geometry
        const geometry = new SphereGeometry(15, 32, 16 );
        geometry.setFromPoints( pointsObj );
        const point = new Points(geometry, pointMaterial);
        return point;
      }
  
      const addCurveNode = (points=[[0,0,0]],color="rgb(255,255,0)") => {
        state.scene.remove( state.point );
        const point = addPoint(points,color)
        state.point = point;
        state.scene.add( point );
      }
  
      // 绘制路径  ------------------------------------------------------------------------------------
      // 添加线段路径 points, color: rgb
      const addPath = (points=[[0,0,0]],color="rgb(255,255,0)") => {
          let material;
          if(state.lineType==="1") {
             material = new LineBasicMaterial({
                color: new Color(color),
                linewidth: 30,
                linecap: 'round', //ignored by WebGLRenderer
                linejoin: 'round' //ignored by WebGLRenderer
            });
          }else {
            material = new LineDashedMaterial({
                color: new Color(color),
                scale: 1,
                dashSize: 10,
                gapSize: 20,
            });
          }
  
          const geometry = new BufferGeometry();
          const pointsObj = points.map(v=>new Vector3(v[0],v[1],v[2]));
          geometry.setFromPoints( pointsObj );
          const line = new Line( geometry, material );
          state.scene.remove( state.line );
          state.line = line;
          state.scene.add( line );
          addCurveNode(points,color);
      }
      
      // 添加线段
      // 圆上的点 r 半径, nodesCount 节点数
      const getPointsOnCircle =(r, nodesCount)=>{
        const points = [];
        for(let i=0;i<nodesCount;i++) {
          const deg = (2*Math.PI / 360) * 360/nodesCount * i;
          points.push([
            Math.sin(deg) * r, 
            Math.cos(deg) * r
          ])
        }
        return points;
      };
  
      // 添加圆柱曲线
      const addCurve = (config) => {
        const {
          nodesCount,
          layerHeight,
          radius,
          layers
        } = config
        const pointsOnFlat = getPointsOnCircle(radius, nodesCount);
        const resPoints = [];
        for(let i=0; i<layers;i++) {
          const segmentHeight = layerHeight/nodesCount;
          // 每层高度
          pointsOnFlat.map((v,i2)=>{
            resPoints.push([v[0],i2*segmentHeight+i*layerHeight,v[1]])
          });
        }
        state.resPoints = resPoints;
      }
  
      // 监听参数更新场景 -------------------------------------------------------------------------------
      watch(
        ()=>state.currentModelIndex,
        (newVal,oldVal)=> {
          loafGLTF(state.models[state.currentModelIndex].config);
        }
      )
  
      // 监听透明度变化
      watch(
        ()=>state.modalAlpha,
        (newVal,oldVal)=>{
          console.log(state.gltfObjs)
          state.gltfObjs.map(v=>{
            setModalAlphaValue(v,newVal);
            return v;
          });
        }
      )
      
      watch(
        ()=>state.lineColor,
        (newVal,oldVal)=>{
          addPath(state.resPoints,state.lineColor);
        }
      )
  
      watch(
        ()=>state.resPoints,
        (newVal,oldVal)=>{
          addPath(state.resPoints,state.lineColor);
        }
      )
  
      // 监听模型选中节点
      watch(
        ()=>state.objInfo.value,
        (newVal,oldVal)=>{
          console.log(newVal);
          // 碰撞第一个物体处理逻辑（透明度设为1，其他设为设置透明度）
          state.gltfObjs.map(v=>{
            setModalAlphaValue(v,state.modalAlpha);
            v.scene.traverse((obj) => {
              if (newVal.includes(obj.uuid)) {
                setHighLightMeshTraverse([obj])
              }
            });
            renderModels(v)
            return v;
          });
        }
      );
  
      const setHighLightMeshTraverse = (scenes) => {
        return scenes.map(v=>{
          if(v.isMesh) {
            //设置mesh的一些属性（比如透明度）
            v.material.transparent = true;
            const newOpacity = 1;
            v.material.opacity = newOpacity;
          }
          return {
            ...v,
            childiren: v.children.length>0 && setHighLightMeshTraverse(v.children)
          }
        })
      }
  
      onMounted(()=>{
        window.addEventListener("resize",updateViewSize)
      })
  
      // 滑动参数改变
      const handleOnChangeRange = (e, type) => {
        const value = e.target.value;
        state[type] = value;
      }
  
      // 添加随机路径
      const handleAddRandPath = () => {
        const pointCounts = state.pointCounts;
        const resPoints = state.resPoints;
        const randerArray = state.randerArray
        if(state.resPoints.length>pointCounts){
          const cutCount =state.resPoints.length - pointCounts;
          resPoints.splice(pointCounts,cutCount);
        } else {
          for(let i=state.resPoints.length;i<pointCounts;i++) {
            const randomX = Math.round(-randerArray[0]/2+Math.random()*randerArray[0]);
            const randomY = Math.round(0+Math.random()*randerArray[1]);
            const randomZ = Math.round(-randerArray[2]/2+Math.random()*randerArray[2]);
            resPoints.push([
              randomX,
              randomY,
              randomZ,
            ])
          }
        }
        
        state.resPoints = resPoints,
        addPath(resPoints,state.lineColor);
      }
  
      const handleAddPath = (curveType) => {
        switch (curveType) {
          case "curve":
            const {
              nodesCount,
              layerHeight,
              radius,
              layers,
            } = state;
            addCurve({
              nodesCount,
              layerHeight,
              radius,
              layers,
            });
            break;
          case "rand":
            state.resPoints = [];
            handleAddRandPath();
            break;
          default:
            break;
        }
      }
  
      const handleChangeParaboloidColor = (e) => {
        console.log(e)
      }
  
      const handleChangeLineFunc =(e,type) => {
        if(type===2) {
          const index = +e.target.value
          const { lineFunctionsList } = state
          state.Linefunction2 = lineFunctionsList[index]
          return;
        }
        const index = +e.target.value
        const { lineFunctionsList } = state
        state.Linefunction = lineFunctionsList[index]
      }
  
      return {
        ...toRefs(state),
        containerRef,
        handleOnChangeRange,
        handleAddPath,
        handleChangeParaboloidColor,
        handleChangeLineFunc
      }
    }
  })
  </script>
  
  <style lang="scss" scoped>
  @import "@/assets/styles/mixin.scss";
  .wrap {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: scroll;
    background: transparent;
    .bg {
      width: 100%;
      height: 100%;
      position: absolute;
      z-index: 10;
      top: 0;
      left: 0;
      // filter: blur(50px);
      @include flexRowCenter();
      img {
        width: 100%;
        height: 100%;
        object-fit:cover;
        object-position: center center;
      }
    }
    .container {
      height: 100%;
      width: 100%;
      color: #5e32d8;
      word-break: break-all;
      position: absolute;
      z-index: 99;
      left: 0;
      top: 0;
    }
    .pannel {
        transition: all 0.3s ease-in-out;
        transform: translateX(0);
        position: absolute;
        top: 0;
        left: 0;
        padding: 15px;
        z-index: 9999;
        margin: 15px;
        height: 100vh;
        overflow-y: scroll;
        @include flexColumnTopCenter();
        align-items: flex-start;
        backdrop-filter: blur(5px);
        color: #ffffff;
        .row {
          width:100%;
          display: flex;
          flex-direction:row;
          justify-content: flex-start;
          align-items:center;
        }
        input[type="text"]{
          appearance: none;
          background-color: rgba(0,0,0,0.8);
          color:#FFF;
          border: none;
        }
        input[type="slider"] {
          width: 100%;
        }
        input, label{
          margin-bottom: 15px;
        }
        div {
          @include flexRowLeftCenter();
        }
        .slide {
          @include flexRowCenter();
          position: absolute;
          z-index: 9999;
          cursor: pointer;
          top: 50vh;
          right: 0;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #43434399;
          border: rgba(8, 7, 7, 0.4);
          color: #ffffff;
        }
    }
    .infoPopwindow {
      transition: all 0.3s ease-in-out;
      transform: translateX(0);
      position: absolute;
      top: 0;
      right: 0;
      padding: 15px;
      z-index: 99;
      height: 100vh;
      @include flexColumnBetweenRight();
      align-items: flex-start;
      backdrop-filter: blur(5px);
      background-color: rgba(8, 7, 7, 0.4);
      max-width: 200px;
      overflow: scroll;
      .tree {
        width: fit-content;
      }
      .hide {
        transition: all 0.3s ease-in-out;
        transform: translateX(120%);
        opacity: 0;
      }
    }
    .chosenObjInfo {
      transition: all 0.3s ease-in-out;
      transform: translateX(0);
      position: absolute;
      z-index: 999;
      top: 0;
      right: 0;
      width: 20vw;
      min-height: 30vh;
      max-height: 80vh;
      overflow-y: scroll;
      backdrop-filter: blur(10px);
      margin: 20px;
      padding: 15px;
      border-radius: 10px;
      background-color: rgba(0,0,0,0.6);
      border: 1px solid rgb(43, 43, 43);
      box-shadow: 0 3px 3px rgba(0,0,0,0.1);
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-bottom: 8px;
        .title {
          color: #fff;
          font-size: 16px;
        }
        .close {
          cursor: pointer;
          color: #fff;
          font-size: 16px;
          height: 20px;
          width: 20px;
          @include flexRowCenter();
          border-radius: 50px;
          background-color: rgba(0,0,0,0.4);
        }
      }
      .details {
        width: 100%;
        color: #fff;
        @include flexColumnTopCenter();
        .row {
          width: 100%;
          transform: scaleY(1 );
          transform-origin: 0 0;
          transition: all 0.3s ease-in-out;
          @include flexRowLeftCenter();
          .label {
            color: rgba(255,255,255,0.8);
            font-size: 12px;
            padding-right: 10px;
          }
          .value {
            color: #fff;
            white-space: nowrap;
            width: 100%;
            overflow: hidden;
          }
          .clickInfo {
            width: 100%;
            transition: all 0.3s ease-in-out;
            color: #fff;
            word-break: break-all;
            white-space: pre-line;
            height: auto;
            max-height: 15vh;
            overflow-y: scroll;
          }
        }
        .hide {
          transition: all 0.3s ease-in-out;
          // height: 0;
          transform: scaleY(0);
          transform-origin: 0 0;
        }
      }
    }
    .pannel.hide, .chosenObjInfo.hide, .infoPopwindow.hide {
        display: none;
        transform: translateX(150%);
    }
    .loading-wrap {
      position: absolute;
      z-index: 99999;
      transform: translateX(0);
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(10px);
      background-color: rgba(0,0,0,0.3);
      @include flexRowCenter();
      .loading {
        width: 300px;
        height: 50px;
        border: 1px solid #ffffff;
        border-radius: 25px;
        background-color: rgba(0,0,0,0.2);
        color: #fff;
        position: absolute;
        transition: 0.5s all ease-in-out;
        @include flexRowCenter();
        .progress {
          transition: 0.5s all ease-in-out;
          width: 300px;
          height: 48px;
          border: none;
          border-radius: 25px;
          background-color: #1852f39a;
          position: absolute;
          left: 0;
        }
        .info {
          position: absolute;
          z-index: 99;
        }
      }
      
    }
  }
  </style>