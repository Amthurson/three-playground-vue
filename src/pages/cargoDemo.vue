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
      <!-- <label for="models">选择模型:</label> -->
      <!-- <select name="models" @change="(e)=>handleOnChangeRange(e,'currentModelIndex')" multiple>
        <option v-for="(item,index) in models" :key="item" :selected="currentModelIndex.includes(index)" :value="index">{{item.name}}</option>
      </select> -->
      <!-- <label for="modalAlpha">模型透明度:{{modalAlpha}}</label> -->
      <!-- <input type="range" min="0" max="1" step="0.01" :value="modalAlpha" @input="(e)=>handleOnChangeRange(e,'modalAlpha')" name="modalAlpha" class="modalAlpha" /> -->
      <!-- <label for="animation">{{ settings.length==0 ? "此模型无动画" : "动画（混合空间权重）" }}</label> -->
      <template v-for="(item,i) in settings" :key="item">
        <label for="animation">{{item.name}}权重:{{item.weight}}</label>
        <input type="range" min="0" max="1" step="0.01" :value="item.weight" @input="(e)=>handleOnChangeRange(e,'settings',{i,prop:'weight'})" name="animation" class="animation" />
      </template>
    </div>
    <!-- 信息窗口 -->
    <div class="infoPopwindow">
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
    <div v-if="isLoading" class="loading">Loading Data...</div>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, ref, watch, toRaw } from "vue";
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
    BoxGeometry,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshStandardMaterial,
    Mesh,
    FrontSide,
    LOD,
    Frustum, // 视锥
    Matrix4, // 矩阵
    Box3,
    Sphere,
    WebGLCubeRenderTarget,
    CubeCamera,
    LinearMipmapLinearFilter,
    TextureLoader,
    RepeatWrapping,
    PlaneGeometry,
    RGBAFormat,
    ObjectLoader,
    Group
} from "three";
import { AxesHelper } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
// threejs自带天空示例
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const loader = new ObjectLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/three/examples/js/libs/draco/gltf/');

// 树控件
// import Treeselect from '@riophae/vue-treeselect'
// import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'

// 加载模型
import { api_getModel } from '@/service/index.js';
import _ from "lodash";

// import { WebIO } from '@gltf-transform/core';
let lastFrameTime = 0;
const debounceInterval = 100; // Time in milliseconds

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
      rotationSpeed: 0,
      gltfObjs: [], // 加载的模型对象集
      sphereBoxs: [], // 模型的球状边界
      modalAlpha: 1, // 模型透明度
      markers: [], // 添加marker
      currentModelIndex: [0], // 默认选择模型
      models: [ // 模型列表
        // {
        //   name: '卡通平层office场景',
        //   config: {
        //     clickable: true, // 能否点击
        //     path: '/models/isometric_office/',
        //     fileName: "scene.gltf",
        //     position: [50,0,-50],
        //     rotation: [0,0,0],
        //     scale: [10,10,10],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'angry',
        //   config: {
        //     path: '/models/fbx/',
        //     fileType: 'fbx',
        //     fileName: "Angry.fbx",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [0.3,0.3,0.3],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'model_catgirl',
        //   config: {
        //     path: '/models/model_catgirl/',
        //     fileName: "scene.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [10,10,10],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'kitchen',
        //   config: {
        //     path: '/models/scan/',
        //     fileName: "kitchen.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [100,100,100],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'house_22_08_22',
        //   config: {
        //     path: '/models/scan/',
        //     fileName: "house_22_08_22.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [100,100,100],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'scan_rabbit',
        //   config: {
        //     path: '/models/scan/',
        //     fileName: "scan_rabbit.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [100,100,100],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: 'holding_cat_gltf',
        //   config: {
        //     path: '/models/scan/',
        //     fileName: "holding_cat.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [100,100,100],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '半透丰富结构建筑',
        //   config: {
        //     path: '/models/casa_mvc_-_apresentacao/',
        //     fileName: "scene.gltf",
        //     position: [-100,100,0],
        //     rotation: [0,0,0],
        //     scale: [10,10,10],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '红砖楼',
        //   config: {
        //     path: '/models/buildings/',
        //     fileName: "scene.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [5,5,5],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '简单工地工程',
        //   config: {
        //     path: '/models/buildings_pack/',
        //     fileName: "test.glb",
        //     position: [0,0,150],
        //     rotation: [0,0,0],
        //     scale: [50,50,50],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '工贸-实训楼装修',
        //   config: {
        //     path: '/models/工贸-实训楼装修/',
        //     fileName: "model.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [0.1,0.1,0.1],
        //   },
        //   cacheIndex: null,
        //   type: "DRACO"
        // },
        // {
        //   name: 'BEE',
        //   config: {
        //     path: '/models/',
        //     fileName: "bee.glb",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [1,1,1],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '塔吊模型',
        //   config: {
        //     path: '/models/crane/',
        //     fileName: "scene.gltf",
        //     position: [0,30,0],
        //     rotation: [0,0,0],
        //     scale: [0.05,0.05,0.05],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '广交会部分BIM',
        //   config: {
        //     path: '/models/v1/',
        //     fileName: "main.gltf",
        //     position: [-160,0,-65],
        //     rotation: [0,0,0],
        //     scale: [0.05,0.05,0.05],
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '广交会部分BIM2',
        //   config: {
        //     path: '/models/v2/',
        //     fileName: "main.gltf",
        //     position: [-200,0,-80],
        //     rotation: [0,0,0],
        //     scale: [0.2,0.2,0.2],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        // {
        //   name: '广交会西区钢结构',
        //   config: {
        //     path: '/models/guangjiaohui_gangjiegou/',
        //     fileName: "main.gltf",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [0.2,0.2,0.2],
        //     pieces: 4
        //   },
        //   cacheIndex: null
        // },
        {
          // \industrial_storage_rack
          name: '货架',
          config: {
            path: '/models/industrial_storage_rack/',
            fileName: "scene.gltf",
            position: [0,0,0],
            rotation: [0,0,0],
            scaleIndex:0.2,
            scale: [1,1,1],
            pieces: 4,
            isPale:false,
            // range:[134,8],
            clickable:true,
            range:[160,40],
            // range:[250,100],
            space:[7,0,24]
          },
          cacheIndex: null
        },
        {
          // \industrial_storage_rack
          name: 'single_mesh',
          config: {
            path: '/models/part/lowpoly_city_free/',
            fileName: "scene.gltf",
            position: [33,0,25],
            rotation: [0,0,0],
            scaleIndex: 0.02,
            scale: [1,1,1],
            pieces: 4,
            // range:[4,6],
            space:[11500,0,4000]
          },
          cacheIndex: null
        },
        {
          // \industrial_storage_rack
          name: '仓库',
          config: {
            path: '/models/part/b11_storage_v6/',
            fileName: "scene.gltf",
            position: [33,0,25],
            rotation: [0,0,0],
            scaleIndex: 0.02,
            scale: [1,1,1],
            pieces: 4,
            range:[4,6],
            isPale:false,
            space:[11500,0,4000]
          },
          cacheIndex: null
        },
        // {
        //   // \industrial_storage_rack
        //   name: '货架3',
        //   config: {
        //     path: '/models/part/',
        //     fileName: "industrial_storage_rack.glb",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [0.2,0.2,0.2],
        //     pieces: 4,
        //     range:[134,8],
        //     space:[1.4,0,4.8]
        //   },
        //   cacheIndex: null
        // },
        // {
        //   // \industrial_storage_rack
        //   name: '货架4',
        //   config: {
        //     path: '/models/part/',
        //     fileName: "warehouse_shelving_unit.glb",
        //     position: [0,0,0],
        //     rotation: [0,0,0],
        //     scale: [0.1,0.1,0.1],
        //     pieces: 4,
        //     range:[134,8],
        //     space:[1.4,0,4.8]
        //   },
        //   cacheIndex: null
        // }
      ],
      showMenu: true, 
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
      settings: [], // 混合空间设置
      isLoading:false,
      clickObjects: [],
      sky: null, // 天空实例,
      SunParameters: null, // 太阳参数
      cubeCamera: null, // cudeCam实例
      cubeRenderTarget: null, // CudeCam渲染目标
      light: null, // directLight
    })
    // 创建包裹
    // 创建单个盒子的函数
    const createBox = () => {
      const geometry = new BoxGeometry(0.01, 0.01, 0.01);
      const material = new MeshStandardMaterial({
        roughness: 0.01,
        color: 0x666688,
        metalness: 0.5,
      });
      return new Mesh(geometry, material);
    }

    // 创建一货架包裹
    const createShelf = (position) => {
      // 创建盒子组
      const boxGroup = new Group();

      // 盒子的间隔
      const boxSpacing = 0.015;

      // 创建盒子结构
      for (let layer = 0; layer < 3; layer++) {
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 5; col++) {
            const box = createBox();
            box.position.set(col * boxSpacing, layer * boxSpacing, row * boxSpacing);
            boxGroup.add(box);
          }
        }
      }
      // boxGroup.position.set(...position)
    }
    

    // 创建场景
    const init = () => {
        // 创建场景 ------------------------------------------------------------------------------------
        const scene = new Scene();

        // 创建相机 ------------------------------------------------------------------------------------
        const camera = new PerspectiveCamera(75, containerRef.value.clientWidth/ containerRef.value.clientHeight,0.1,100000); // 创建镜头

        // camera.position.x= 18.179019371004365;
        // camera.position.y= 23.085385388593217;
        // camera.position.z= 27.139104006276277;
        camera.position.x = 53.379529482352346;
        camera.position.y =67.78622019223894;
        camera.position.z =79.689260067476;

      
        // 创建视锥 ------------------------------------------------------------------------------------
        const frustum = new Frustum();  
        state.frustum = frustum;
        // 获取当前相机的投影矩阵和视图矩阵：
        const projectionMatrix = camera.projectionMatrix;
        const viewMatrix = camera.matrixWorldInverse;
        // 计算视锥体的矩阵
        const matrix = new Matrix4();
        matrix.multiplyMatrices(projectionMatrix, viewMatrix);
        frustum.setFromProjectionMatrix(matrix);
        
        const renderer = new WebGLRenderer({
          antialias: true,
          alpha: true
        }); // 创建容器
        renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 添加坐标轴 ------------------------------------------------------------------------------------
        const axis = new AxesHelper(50);
        state.axis;
        scene.add(axis);

        containerRef.value.appendChild(renderer.domElement);

        // 世界时间
        state.clock = new Clock();

        // 创建几何体 ------------------------------------------------------------------------------------
        // const geometry = new BoxGeometry(8,8,8); // 创建几何体
        // const material = new MeshBasicMaterial({color:0x002299}); // 创建材质
        // const cube = new Mesh(geometry,material); //几何体和材质结合

        // // 场景中添加几何体
        // scene.add(cube);
        // // 几何体旋转
        // cube.rotation.x += 0.5;
        // cube.rotation.y += 0.5;

        // 添加灯光 ------------------------------------------------------------------------------------
        const ambientLight = new AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight( 0xffffff, 1 );
        scene.add( directionalLight );
        state.light = directionalLight

        // 添加控制器 ------------------------------------------------------------------------------------
        state.orbitControl = new OrbitControls(camera, containerRef.value);

        // 镜头聚焦到场景原点
        camera.lookAt(scene.position);
       
        // LOD
        const lod = new LOD();

        // 高细节模型
        // lod.addLevel(highPolyModel, 0);

        // 中等细节模型
        // lod.addLevel(midPolyModel, 100);

        // 低细节模型
        // lod.addLevel(lowPolyModel, 200);
        
        state.lod = lod

        scene.add(lod);

        // DRACO decoder
        state.dracoLoader = dracoLoader

        // 加载gltf模型（glb)  ------------------------------------------------------------------------------------
        state.currentModelIndex.map(v=>{
          loadGLTF(state.models[v].config);
        })

        // 加载fbx模型 ------------------------------------------------------------------------------------
        // const modelloader = new FBXLoader().setPath( '/models/fbx/' );;
        // modelloader.load("gjh-gjg.fbx", (obj)=>{
        //     scene.add(obj.scene);
        //     console.log(obj);
        //     obj.animations; // Array<THREE.AnimationClip>
        //     obj.scene; // THREE.Group
        //     obj.scenes; // Array<THREE.Group>
        //     obj.cameras; // Array<THREE.Camera>
        //     obj.asset; // Object
        //     obj.scene.position.set(0,0,0);
        //     obj.scene.rotation.set(0,0,0);
        //     obj.scene.scale.set(0,0,0);
        //     renderer.render( scene, camera );
        // }, (xhr) => {
        //     console.log("xhr", (xhr.loaded/xhr.total) * 100 + "% loaded");
        // }, (error) => {
        //     console.log("error while loading",error)
        // }
        // )

        // 监听点击
        click();

        // 渲染结果 ------------------------------------------------------------------------------------
        // debugger;
        state.oldCameraMatrix = new Matrix4(); // 存储上一次的摄像机矩阵
        const animate = (currentTime) => {
          // 更新 LOD
          lod.update(camera);

          // if(state.mixer) {
          //   const mixerUpdateDelta = state.clock.getDelta();
          //   // console.log(state.mixer);
          //   state.mixer.update && state.mixer.update( mixerUpdateDelta );
          // }
          // window.__camera = state.camera;
          // requestAnimationFrame( animate );
          requestAnimationFrame(animate);

          if (currentTime - lastFrameTime > debounceInterval) {
              // Put operations here that you want to debounce
              if(state.mixer) {
                  const mixerUpdateDelta = state.clock.getDelta();
                  state.mixer.update && state.mixer.update(mixerUpdateDelta);
              }
              lastFrameTime = currentTime;
          }
          
          // 检查摄像机矩阵是否有变化
          if (camera && camera?.matrixWorld?.equals && !camera.matrixWorld.equals(state.oldCameraMatrix )) {
            // 更新存储的矩阵为当前的摄像机矩阵
            state.oldCameraMatrix.copy(camera.matrixWorld);
            // 摄像机有变化
            console.log("摄像机位置或朝向改变了");
            // 对于每个需要渲染的物体，检查其边界框或包围球是否与视锥体相交：
            // state.gltfObjs.map((v)=>{
            //   const box = new Box3().setFromObject(v);
            //   const sphere = new Sphere();
            //   box.getBoundingSphere(sphere);
            //   if(frustum.intersectsSphere(sphere)){
            //     scene.add(v)
            //   } else {
            //     scene.remove(v)
            //   }
            // });
            // console.log(scene);
            // 获取当前相机的投影矩阵和视图矩阵：
            // const projectionMatrix = camera.projectionMatrix;
            // const viewMatrix = camera.matrixWorldInverse;
            // 计算视锥体的矩阵
            // const matrix = new Matrix4();
            // matrix.multiplyMatrices(projectionMatrix, viewMatrix);
            // state.frustum.setFromProjectionMatrix(matrix);
            // scene.traverse(child=>{
            //   if(child.isMesh) {
            //     const box = new Box3().setFromObject(child.scene||child);
            //     const sphere = new Sphere();
            //     box.getBoundingSphere(sphere);
            //     if(!state.frustum.intersectsSphere(sphere)) {
            //       // console.log(child);
            //       child.visible = false;
            //       state.scene.remove(child)
            //     } else {
            //       child.visible = true;
            //     }
            //   }
            // })
          }

          // Always executed operations
          if(state.rotationSpeed) scene.rotation.y += state.rotationSpeed * 0.001;
          renderer.render(scene, camera);
        };

        animate(0);
        state.scene = scene;
        state.renderer = renderer
        state.camera = camera;

        // 创建天空
        initSky();  // three Sky实例
        // 创建地面
        // 将平面添加到场景中
				var plane = createPlaneGeometryBasicMaterial();
				state.scene.add(plane);
        createShelf([0,0,0])
    }

    // 初始化天空
    const initSky = ()=>{
      let sky = new Sky();
      let uniforms = sky.material.uniforms;
      uniforms[ 'turbidity' ].value = 10;
      uniforms[ 'rayleigh' ].value = 3;
      uniforms[ 'mieCoefficient' ].value = 0.005;
      uniforms[ 'mieDirectionalG' ].value = 0.7;
      let SunParameters = {
        distance: 400,
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
    
    // 创建地表
    const createPlaneGeometryBasicMaterial = () => {
      var textureLoader = new TextureLoader();
      var cubeMaterial = new MeshStandardMaterial({
        map: textureLoader.load("/floorTexture/cement.jpg"),
        // lightMap: textureLoader.load("/floorTexture/cement.jpg"),
        // lightMapIntensity: 0.5,
        // aoMap: textureLoader.load("/floorTexture/cement.jpg"),
        // aoMapIntensity: 0.5,
        // roughnessMap: textureLoader.load("/floorTexture/cement.jpg"),
        // metalnessMap: textureLoader.load("/floorTexture/cement.jpg"),
        // normalMap: textureLoader.load("/floorTexture/cement.jpg"),
        // normalMapType: NormalMapTypes,
        roughness: 0.8,
        metalness: 0.8,
        // color: new Color("rgba(255,255,255)"),
        // wireframe: true,
        // wireframeLinewidth: 10,
      });
      cubeMaterial.map.wrapS = RepeatWrapping;
      cubeMaterial.map.wrapT = RepeatWrapping;
      cubeMaterial.map.repeat.set(1000, 1000);
      // 创建地平面并设置大小
      var planeGeometry = new PlaneGeometry(10000, 10000);
      var plane = new Mesh(planeGeometry, cubeMaterial);
    
      // 设置平面位置并旋转
      plane.rotation.x = -0.5 * Math.PI;
      plane.position.x = 0;
      plane.position.z = 0;
      return plane;
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

    // 点击事件
    const click = () => {
      //点击射线碰撞
      const raycaster = new Raycaster();
      const mouse = new Vector2();
      let pos = {x:0,y:0}
      const onDocumentMouseDown = (event) => {
          // 因为点击涉及递归目前性能较差，做选择性开启优化
          const { currentModelIndex,models } = state;
          currentModelIndex.forEach(index=>{
            if(!models[index].config?.clickable) {
              return;
            }
            if(event.button===0) { // 判断鼠标左键
              // event.preventDefault();
              mouse.x = (event.offsetX / containerRef.value.clientWidth) * 2 - 1;
              mouse.y = -(event.offsetY / containerRef.value.clientHeight) * 2 + 1;
              if(pos.x!==event.clientX,pos.y!==event.clientY) return;
              // 非拖拽事件
              state.isLoading = true;

              raycaster.setFromCamera(mouse, state.camera);
              
              //总结一下，这里必须装网格，mesh，装入组是没有效果的
              //所以我们将所有的盒子的网格放入对象就可以了
              // 需要被监听的对象要存储在clickObjects中。
              // const clickObjects = [];
              // state.gltfObjs.map(v=>{
              //   v.traverse(obj=>{
              //       clickObjects.push(obj);
              //   });
              // });
              var intersects = raycaster.intersectObjects(state.clickObjects);

              if(intersects.length > 0) {
                  // 标记点击位置
                  const {x,y,z} = intersects[0].point;
                  state.scene.remove(state.clickPoint);
                  const clickPoint = addPoint([[x,y,z]],"rgb(255,0,0)")
                  state.clickPoint = clickPoint;
                  state.scene.add(clickPoint);
                  state.chosenObjectInfo = intersects[0]
                  state.showChosenObject = true;
                  // 碰撞第一个物体处理逻辑（透明度设为1，其他设为设置透明度）
                  // state.gltfObjs.map(v=>{
                  //   setModalAlphaValue(v,state.modalAlpha);
                  //   state.chosenObjectInfo = intersects[0];
                  //   state.showChosenObject = true;
                  //   v.traverse((obj) => {
                  //     if (obj.isMesh && intersects[0].object.uuid === obj.uuid) {
                  //       //设置mesh的一些属性（比如透明度）
                  //       obj.material.transparent = true;
                  //       const newOpacity = 1;
                  //       obj.material.opacity = newOpacity;
                  //     }
                  //   }); 
                  //   return v;
                  // })
                  state.isLoading = false;
                  // state.gltfObjs.map(v=>{
                  //   renderModels(v)
                  //   return v;
                  // });
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
                state.isLoading = false;
              }
            }
          })
      }
      containerRef.value.addEventListener('mouseup', onDocumentMouseDown, false);
      containerRef.value.addEventListener('mousedown', function(e){
        if(e.button === 0) {
          pos = {
            x:e.clientX,
            y:e.clientY
          };
        }
      }, false);
    }

    // 加载点云压缩数据
    const loadGLTFbyDARACO = (config) => {
      state.progress = 0;
      const {
          path,
          fileName,
          position,
          rotation,
          scale
      } = config;
      const loader = new GLTFLoader();
      loader.setDRACOLoader(state.dracoLoader)
      const modelloader = loader.setPath( path );
      modelloader.load(fileName, (obj)=>{
        if(state.gltfObjs.length>0) {
          state.gltfObjs.map(v=>{
            state.scene.remove(v);
            return v;
          });
        }
        state.gltfObjs = [];
        state.gltfObjs.push(obj);
        // state.scene.add(obj.scene);
        obj.scene.position.set(...position);
        obj.scene.rotation.set(...rotation);
        obj.scene.scale.set(...scale);
        state.gltfObjs.map(v=>{
          setModalAlphaValue(v,state.modalAlpha);
          return v;
        });
        return true;
      }, (xhr) => {
          state.progress = Math.round(xhr.loaded/xhr.total * 10000) / 100;
          console.log("xhr", (xhr.loaded/xhr.total) * 100 + "% loaded");
      }, (error) => {
          console.log("error while loading",error);
          state.progress = 100;
          return false;
      });
    }

    const loadFbx = async (config) => {
      try {
        state.progress = 0;
        const {
          path,
          fileName,
          position,
          rotation,
          scale,
        } = config;

        // 请求模型数据
        const modelloader = new FBXLoader().setPath(import.meta.env.VITE_BASE_API + path);

        // 清空模型
        if(state.gltfObjs.length>0) { 
          state.gltfObjs.map(v=>{
            state.scene.remove(v);
            return v;
          })
        }
        // 加载模型
        state.gltfObjs = [];
        modelloader.load(fileName, (scene)=>{
          const gltfObjFormData = {scene,...scene};
          state.gltfObjs.push(gltfObjFormData);
          scene.position.set(...position);
          scene.rotation.set(...rotation);
          scene.scale.set(...scale);
          setModalAlphaValue(gltfObjFormData,state.modalAlpha);
          console.log(scene)
          // 动画
          state.mixer = new AnimationMixer(scene);
          setModelAnimation(scene,scene.animations)
        }, (xhr) => {
            state.progress = Math.round(xhr.loaded/xhr.total * 10000) / 100;
        }, (error) => {
            console.log("error while loading",error)
        }
        )
      } catch (error) {
        console.log(error);
      } finally{
        state.progress=100
      }
    }

    // 加载gltf模型（glb、gltf)  ------------------------------------------------------------------------------------
    const loadGLTF = async (config) => {
      try {
        state.progress = 0;
        const {
          path,
          fileName,
          position,
          rotation,
          scale,
          fileType,
          scaleIndex
        } = config;

        // 其他类型模型兼容处理
        if(fileType) {
          switch (fileType) {
            case "fbx":
              return loadFbx(config);
            default:
              state.progress = 100;
              console.log('暂不支持加载此模型文件类型！');
              return;
          }
        }

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
          state.gltfObjs.map(scene=>{
            state.scene.remove(scene);
            return scene;
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
            state.objInfo.tree = filterTree(obj.scenes)
            state.objInfo.tree[0].children.push(filterTree(obj.scenes)[0]) // 获取模型信息
            if(!config.range) {
              let newObjScene = obj.scene.clone();
              // console.log(newObjScene);
              // newObjScene.traverse(function(child){
              //   if (child.isMesh) {
              //     // // 改变材质
              //     // child.material = new MeshStandardMaterial({
              //     //   roughness: 0.01,
              //     //   color: 0x666688,
              //     //   metalness: 0.5,
              //     // })
              //     // // child.material = new MeshBasicMaterial({color: 0x4466AA}); // Assign a basic material
                
              //     // 开启视锥剔除
              //     child.frustumCulled = true;
              //   }
              // })
              newObjScene.position.set(...position);
              newObjScene.rotation.set(...rotation);
              newObjScene.scale.set(
                scale[0]*scaleIndex,
                scale[1]*scaleIndex,
                scale[2]*scaleIndex
              );
              state.scene.add(newObjScene);
              state.gltfObjs.push(newObjScene);
              const box = new Box3().setFromObject(newObjScene);
              const sphere = new Sphere();
              box.getBoundingSphere(sphere);
              state.sphereBoxs.push(sphere);
              // setModalAlphaValue(obj,state.modalAlpha);
              state.objInfo.tree = filterTree(obj.scenes)
              state.objInfo.tree[0].children.push(filterTree(obj.scenes)[0]) // 获取模型信息
              // 动画
              state.mixer = new AnimationMixer(newObjScene);
              setModelAnimation(newObjScene,obj.animations)
              return true;
            }
            const geometries = [];
            // 获取当前相机的投影矩阵和视图矩阵：
            const projectionMatrix = state.camera.projectionMatrix;
            const viewMatrix = state.camera.matrixWorldInverse;
            // 计算视锥体的矩阵
            const matrix = new Matrix4();
            matrix.multiplyMatrices(projectionMatrix, viewMatrix);
            state.frustum.setFromProjectionMatrix(matrix);
            for(let i=0;i<config.range[0];i++ ) {
              for(let j=0;j<config.range[1];j++ ) {
                let newObjScene = obj.scene.clone();
                config?.isPale && newObjScene.traverse(function(child){
                  if (child.isMesh) {
                    // 简化材质
                    child.material = new MeshStandardMaterial({
                      roughness: 0.01,
                      color: 0x666688,
                      metalness: 0.5,
                    })
                    // child.material = new MeshBasicMaterial({color: 0x4466AA}); // Assign a basic material
                  }
                });
                // newObjScene.traverse(function(child){
                //   if (child.isMesh) {
                //     // 开启视锥剔除
                //     child.frustumCulled = true;
                //   }
                // })
                if(config?.clickable) {
                  newObjScene.traverse((child)=>{
                    state.clickObjects.push(child)
                  })
                }
                // console.log(newObjScene);
                newObjScene.position.set(
                  position[0]+i*config.space[0]*scaleIndex,
                  position[1],
                  position[2]+j*config.space[2]*scaleIndex
                );
                newObjScene.rotation.set(...rotation);
                newObjScene.scale.set(
                  scale[0]*scaleIndex,
                  scale[1]*scaleIndex,
                  scale[2]*scaleIndex
                );
                newObjScene.traverse(function(child){
                  if (child.isMesh) {
                    geometries.push(child.geometry);
                  }
                })
                const box = new Box3().setFromObject(newObjScene.scene||newObjScene);
                const sphere = new Sphere();
                box.getBoundingSphere(sphere);
                // console.log(!state.frustum.intersectsSphere(sphere))
                // if(!state.frustum.intersectsSphere(sphere)) {
                //   state.scene.add(newObj Scene);
                // }
                state.scene.add(newObjScene);
                state.gltfObjs.push(newObjScene);
                state.sphereBoxs.push(sphere);

                const geometry = new BoxGeometry(8,8,8); // 创建几何体
                const material = new MeshBasicMaterial({color:0x002299}); // 创建材质
                const cube = new Mesh(geometry,material); //几何体和材质结合
                state.scene.add(cube);

                // setModalAlphaValue(obj,state.modalAlpha);
                // 动画
                state.mixer = new AnimationMixer(newObjScene);
                setModelAnimation(newObjScene,obj.animations)
              }
            }
            // const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
            // const mergedMesh = new Mesh(mergedGeometry, new MeshStandardMaterial());
            // state.scene.add(mergedMesh);
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

    /**
     * 设置动画
     */
    const setModelAnimation = (scene,animations) => {
      try {
        if(!animations || animations.length===0){
          // console.log(scene.uuid+'此模型没有animations');
          state.settings=[]; 
          return false;
        }
        console.log(animations)
        state.mixer = new AnimationMixer(scene);
        state.settings = animations.map(v=>({
          action: state.mixer.clipAction(v),
          weight: 1,
          name: v.name
        }))
        activateAllActions(state.settings);
      } catch (error) {
        return false;
      }
    }

    /**
     * 更新动画设置
     */
    function activateAllActions(settings) {
      settings.forEach(v=>{
        const { action,weight } = v;
        setWeight( action, weight );
        action.play()
      });
    }

    watch(
      ()=>state.settings,
      (n,o)=>{
        activateAllActions(n);
      },
      {deep:true}
    )

    /**
     * 更新权重
     */
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
    const renderModels = (scene) => {
      try {
        // const box = new Box3().setFromObject(scene.scene||scene);
        // const sphere = new Sphere();
        // box.getBoundingSphere(sphere);
        // console.log(state.frustum.intersectsSphere(sphere));
        state.scene.remove(scene.scene||scene);
        state.scene.add(scene.scene||scene);
      } catch (error) {
        console.log(error,scene);
      }
    }

    // 设置模型透明度
    const setModalAlphaValue = (scene, opacity) => {
      // 设置透明度
      scene.traverse && scene.traverse(function (obj) {
        if (obj.isMesh) {
          // 设置mesh的一些属性（比如透明度）
          obj.material.transparent = true;
          const newOpacity = opacity;
          obj.material.opacity = newOpacity;
        }
      });
      // 刷新模型
      renderModels(scene);
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
        state.currentModelIndex.map(v=>{
          loadGLTF(state.models[v].config);
        })
      }
    )

    // 监听透明度变化
    watch(
      ()=>state.modalAlpha,
      (newVal,oldVal)=>{
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
    watch(
      ()=>[
        state.nodesCount,
        state.layerHeight,
        state.layers,
        state.radius
      ],
      ([nodesCount,
        layerHeight,
        layers,
        radius
      ])=>{
        addCurve({
          nodesCount,
          layerHeight,
          radius,
          layers
        });
      }
    );
    watch(
      ()=>state.pointCounts,
      (newVal,oldVal)=>{
        handleAddRandPath()
      }
    );

    // 监听模型选中节点
    watch(
      ()=>state.objInfo.value,
      (newVal,oldVal)=>{
        console.log(newVal);
        // 碰撞第一个物体处理逻辑（透明度设为1，其他设为设置透明度）
        state.gltfObjs.map(v=>{
          setModalAlphaValue(v,state.modalAlpha);
          v.traverse((obj) => {
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
    const handleOnChangeRange = (e, type,arrInfo) => {
      const value = e.target.value;
      if(arrInfo) {
        console.log(type);
        const {i,prop} = arrInfo;
        state[type][i][prop] = value;
        return;
      }
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
  .hide {
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
.loading {
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 9999;
  backdrop-filter: blur(2px);
  background-color: rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
}
</style>