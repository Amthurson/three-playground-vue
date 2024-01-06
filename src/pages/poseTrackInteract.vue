<template>
  <div class="wrap">
    <div @click="handleFullScreen" ref="detechResultRef" class="detech-result-container">
      <PoseTracking @onResult="onFaceResult" />
    </div>
    <!-- 视窗 -->
    <div class="container" ref="containerRef" id="container">
    </div>
    <!-- 控件 -->
    <div :class="`pannel ${!showMenu ?'hide':''}`">
      <label for="rotationSpeed">场景旋转速度:{{rotationSpeed}}</label>
      <input type="range" min="0" max="5" step="1" :value="rotationSpeed" @input="(e)=>handleOnChangeRange(e,'rotationSpeed')" name="rotationSpeed" class="rotationSpeed" />
      <select @change="(e)=>handleChangeLineFunc(e,1)" name="" value="0" id="">
        <option v-for="(item,i) in lineFunctionsList" :key="i" :value="i">{{item.name}}</option>
      </select>
      <label for="ParaboloidA">xy平面上的线性函数公式：{{FunctionDes}}</label>
      <div class="row">
        <div>a:</div>
        <input type="range" min="-10" max="10" step="0.001" :value="ParaboloidA" @input="(e)=>handleOnChangeRange(e,'ParaboloidA')" name="ParaboloidA" class="ParaboloidA" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidA')" name="ParaboloidA" :value="ParaboloidA" id="">
      </div>
      <div class="row">
        <div>b:</div>
        <input type="range" min="-100" max="100" step="0.001" :value="ParaboloidB" @input="(e)=>handleOnChangeRange(e,'ParaboloidB')" name="ParaboloidB" class="ParaboloidB" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidB')" name="ParaboloidB" :value="ParaboloidB" id="">
      </div>
      <div class="row">
        <div>c:</div>
        <input type="range" min="-100" max="100" step="0.001" :value="ParaboloidC" @input="(e)=>handleOnChangeRange(e,'ParaboloidC')" name="ParaboloidC" class="ParaboloidC" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidC')" name="ParaboloidC" :value="ParaboloidC" id="">
      </div>
      <select @change="(e)=>handleChangeLineFunc(e,2)" name="" value="0" id="">
        <option v-for="(item,i) in lineFunctionsList" :key="i" :value="i">{{item.name}}</option>
      </select>
      <label for="ParaboloidA">xz平面上的线性函数公式：{{FunctionDes2}}</label>
      <div class="row">
        <div>a:</div>
        <input type="range" min="-10" max="10" step="0.001" :value="ParaboloidA2" @input="(e)=>handleOnChangeRange(e,'ParaboloidA2')" name="ParaboloidA2" class="ParaboloidA2" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidA2')" name="ParaboloidA2" :value="ParaboloidA2" id="">
      </div>
      <div class="row">
        <div>b:</div>
        <input type="range" min="-100" max="100" step="0.001" :value="ParaboloidB2" @input="(e)=>handleOnChangeRange(e,'ParaboloidB2')" name="ParaboloidB2" class="ParaboloidB2" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidB2')" name="ParaboloidB2" :value="ParaboloidB2" id="">
      </div>
      <div class="row">
        <div>c:</div>
        <input type="range" min="-100" max="100" step="0.001" :value="ParaboloidC2" @input="(e)=>handleOnChangeRange(e,'ParaboloidC2')" name="ParaboloidC2" class="ParaboloidC2" />
        <input type="text" @change="(e)=>handleOnChangeRange(e,'ParaboloidC2')" name="ParaboloidC2" :value="ParaboloidC2" id="">
      </div>
      <label for="ParaboloidDensity">XY平面线性函数x轴密度:{{ParaboloidDensity}}</label>
      <input type="range" min="1" max="100" step="1" :value="ParaboloidDensity" @input="(e)=>handleOnChangeRange(e,'ParaboloidDensity')" name="ParaboloidDensity" class="rotationSpeed" />
      <label for="nodeCounts">XZ平面椭圆曲线点密度:{{nodesCount}}</label>
      <input type="range" min="1" max="360" step="1" @input="(e)=>handleOnChangeRange(e,'nodesCount')" :value="nodesCount" name="nodeCounts" class="nodeCounts" />
      <label for="ParaboloidColorRangeClip">mesh边缘颜色</label>
      <input type="color" @change="(e)=>handleOnChangeRange(e,'ParaboloidColorRangeClip')" :value="ParaboloidColorRangeClip" name="ParaboloidColorRangeClip"/>
      <label for="ParaboloidColorRangeCenter">mesh中心颜色</label>
      <input type="color" @change="(e)=>handleOnChangeRange(e,'ParaboloidColorRangeCenter')" :value="ParaboloidColorRangeCenter" name="ParaboloidColorRangeCenter"/>
      <label for="isParaboloidShowLine"> mesh瓦片的边:{{isParaboloidShowLine?"显示":"隐藏"}}</label>
      <input type="checkbox" @click="(e)=>handleOnChangeRange({target:{value:e.target.checked}},'isParaboloidShowLine')" name="isParaboloidShowLine" :value="isParaboloidShowLine" checked="checked" id="">
      <label for="lineColor">线颜色</label>
      <input type="color" @change="(e)=>handleOnChangeRange(e,'lineColor')" :value="lineColor" name="lineColor"/>
      <input type="range" min="0" max="1" step="0.01" :value="modalAlpha" @input="(e)=>handleOnChangeRange(e,'modalAlpha')" name="modalAlpha" class="modalAlpha" />
      <div>
        <label for="lineType">实线: </label>
        <input type="radio" name="lineType" checked @change="(e)=>handleOnChangeRange(e,'lineType')" value="1">
        <label for="lineType">虚线: </label>
        <input type="radio" name="lineType" @change="(e)=>handleOnChangeRange(e,'lineType')" value="0">
      </div>
      <label for="linewidth">线宽:{{linewidth}}</label>
      <input type="range" min="1" max="50" step="1" :value="linewidth" @input="(e)=>handleOnChangeRange(e,'linewidth')" name="linewidth" class="linewidth" />
      <input type="button" @click="handleAddPath('curve')" value="添加旋转路径"/>
      <label for="radius">半径:{{radius}}</label>
      <input type="range" min="1" max="50" step="0.01" :value="radius" @input="(e)=>handleOnChangeRange(e,'radius')" name="radius" class="radius" />
      <label for="layerHeight">层高:{{layerHeight}}</label>
      <input type="range" min="1" max="100" step="0.01" @input="(e)=>handleOnChangeRange(e,'layerHeight')" :value="layerHeight" name="layerHeight" class="layerHeight" />
      <label for="layers">层数:{{layers}}</label>
      <input type="range" min="1" max="100" step="1" @input="(e)=>handleOnChangeRange(e,'layers')" :value="layers" name="layers" class="layers" />
      <input type="button" @click="handleAddPath('rand')" value="添加随机路径"/>
      <label for="layers">随机点数:{{pointCounts}}</label>
      <input type="range" min="0" max="1000" step="1" @input="(e)=>handleOnChangeRange(e,'pointCounts')" :value="pointCounts" name="pointsCounts" class="pointsCounts" />
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, ref, watch } from "vue";
import { 
    Scene,
    BoxGeometry,
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
    LatheGeometry,
    BufferAttribute,
    VertexColors,
    DoubleSide,
    CubicBezierCurve3 // 贝塞尔曲线
} from "three";
import { MeshBasicMaterial } from "three";
import { Mesh } from "three";
import { AxesHelper } from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// 树控件
// import Treeselect from '@riophae/vue-treeselect'
// import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'

// 加载模型
import { api_getModel } from '@/service/index.js';

import PoseTracking from "@/components/AI/PoseTracking.vue"

export default  defineComponent({
  name: "ThreeDemo",
  components: {
    Treeselect,
    PoseTracking
  },
  setup() {
    const containerRef = ref(null);
    const frameRef = ref(null);
    const state = reactive({
      lineFunctionsList: [
        {
          name: '抛物线',
          des: (a,b,c)=>{
            return `y=${a+""}x²+${!b?'':(b>0?('+'+b+'x'):(''+b+'x'))}`;
          },
          func: (x,a,b,c)=>{
            return [a * Math.pow(x,2) + b * x + c];
          }
        },
        {
          name: '正弦曲线',
          des: (a,b,c)=>{
            return `y=${a===0?"0":(a+""+(!b?'*sin(0)':'*sin('+b+'x)'))}`;
          },
          func: (x,a,b,c)=>{
            return [a * Math.sin(b*x)];
          }
        },{
          name: '双曲线',
          des: (a,b,c)=>{
            return `y=${a===0?'0':(a+"*(1/x)")}`;
          },
          func: (x,a,b,c)=>{
            return [x===0 ? 0 : Math.round(a*1/x*10000)/10000];
          }
        },
        {
          name: '椭圆曲线',
          des: (a,b,c) => {
            return `x^2/${a}^2+y^2/${b}^2=1（a>b>0）`;
          },
          func: (x,a,b,c) => {
            const res = a>=b && b >0 ? Math.pow((1-Math.pow(x/a,2))/Math.pow(b,2),0.5) : 0;
            return  [-res,res];
          }
        }
      ],
      FunctionDes: "",
      FunctionDes2: "",
      Linefunction: {
        name: '抛物线',
        des: (a,b,c)=>{
          return `y=${a+""}x²+${!b?'':(b>0?('+'+b+'x'):(''+b+'x'))}`;
        },
        func: (x,a,b,c)=>{
          return [a * Math.pow(x,2) + b * x + c];
        }
      },
      Linefunction2: 
      {
        name: '椭圆曲线',
        des: (a,b,c) => {
          return `x^2/${a}^2+y^2/${b}^2=1（a>b>0）`;
        },
        func: (x,a,b,c) => {
          const res = a>=b && b >0 ? Math.pow((1-Math.pow(x/a,2))/Math.pow(b,2),0.5) : 0;
          return  [-res,res];
        }
      },
      ParaboloidA: 0.3, // 函数中的a：y=ax²+bx+c （a）
      ParaboloidB: 0, // 函数中的b: y=ax²+bx+c （b）
      ParaboloidC: 0, // 函数中的c: y=ax²+bx+c （c）
      ParaboloidA2: 1, // 函数中的a：y=ax²+bx+c （a）
      ParaboloidB2: 1, // 函数中的b: y=ax²+bx+c （b）
      ParaboloidC2: 0, // 函数中的c: y=ax²+bx+c （c）
      ParaboloidDensity: 10, // 抛物线点密度
      isParaboloidShowLine: true, // 是否显示抛物面显示mesh边
      ParaboloidColorRange: [
        "#0050ff",
        "#b40a00"
      ], // 抛物面从上到下颜色渐变
      ParaboloidColorRangeClip: "#0050ff", // 抛物面边缘颜色
      ParaboloidColorRangeCenter: "#b40a00",// 抛物面中心颜色
      lineColor: "#ff7cff", // 线颜色
      showClickDetails: false,
      showChosenObject: false,
      progress: 100,// 加载进度
      scene: {}, // 场景
      camera: {}, // 镜头
      clock: {}, // three时钟实例
      mixer: {}, // 混合空间
      renderer: {}, // 渲染容器,
      axis: {}, // 坐标轴
      clickPoint: null, // 点击射线碰撞后落点标记
      nodesCount:50, // 旋转曲线 - 单圈节点
      layerHeight: 1, // 旋转曲线 - 单层高度
      radius: 1, // 旋转曲线 - 单圈半径
      layers: 1, // 旋转曲线 - 层数
      pointCounts: 1, // 随机曲线 - 点数
      resPoints: [], // 随机曲线 - 点集
      linewidth: 1, // 线宽
      lineType: 1, // 实虚线
      line: {}, // 几何线集对象
      point: {}, // 几何点集对象
      randerArray: [
        100,20,100
      ], // 随机点位边界
      rotationSpeed: 0,
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
      mesh: null, // 几何面
      aiResults: null, // AI识别结果
      aiWrap: {
        width: 300,
        height: 200,
        depth: 200
      },
      aiCamPos: {
        x: 0,
        y: 0,
        z: -100
      },
      facesModels: [], // 面部模型集合
      poseModels: [], // 手势模型集合
      poseLines: [], // 手势线集合
      posePoints: [] // 手势点集合
    })
    const init = () => {
        // 创建场景 ------------------------------------------------------------------------------------
        const scene = new Scene();

        // 创建相机 ------------------------------------------------------------------------------------
        const camera = new PerspectiveCamera(75, containerRef.value.clientWidth/ containerRef.value.clientHeight,0.1,1000); // 创建镜头

        camera.position.x= -4.720909886021641;
        camera.position.y= 27.969738197258486;
        camera.position.z= 232.99583425627134;
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

        // 添加灯光 ------------------------------------------------------------------------------------
        const ambientLight = new AmbientLight(0xffffff, 2);
        scene.add(ambientLight);

        const directionalLight = new DirectionalLight( 0xffffff, 1 );
        scene.add( directionalLight );

        // 添加控制器 ------------------------------------------------------------------------------------
        new OrbitControls(camera, containerRef.value);

        // 镜头聚焦到场景原点
        camera.lookAt(scene.position);
        click();

        // 持续渲染 ------------------------------------------------------------------------------------
        function animate() {
          if(state.rotationSpeed) scene.rotation.y += state.rotationSpeed * 0.001;
          renderer.render( scene, camera );

          if(state.mixer) {
            const mixerUpdateDelta = state.clock.getDelta();
            state.mixer.update && state.mixer.update( mixerUpdateDelta );
          }
          window.__camera = state.camera;
          requestAnimationFrame( animate );
        };

        animate();
        state.scene = scene;
        state.renderer = renderer
        state.camera = camera;

        // 添加贝塞尔曲线
        // addBezier3DCure();

        // 添加双曲面
        const {
          Linefunction,
          Linefunction2,
          ParaboloidA,
          ParaboloidB,
          ParaboloidC,
          ParaboloidDensity: density,
          ParaboloidA2,
          ParaboloidB2,
          ParaboloidC2,
          nodesCount: density2,
          ParaboloidColorRange: colorRange,
          isParaboloidShowLine: showLine
        } = state;
        const [
          {func: XYLineFunction},
          {func: XZLineFunction}
        ] = [
          Linefunction,
          Linefunction2,
        ]
        state.FunctionDes = state.Linefunction.des(state.ParaboloidA,state.ParaboloidB,state.ParaboloidC)
        state.FunctionDes2 = state.Linefunction2.des(state.ParaboloidA2,state.ParaboloidB2,state.ParaboloidC2)
        // addPointsOfParaboloid({
        //   XYlineFunctionParams: [ParaboloidA,ParaboloidB,ParaboloidC],
        //   XZLineFunctionParams: [ParaboloidA2,ParaboloidB2,ParaboloidC2],
        //   XYLineFunction,
        //   XZLineFunction,
        //   position:[0,0,0], // 顶点位置
        //   radius:10, // 0 - 10之间
        //   density, // 抛物线上的点密度
        //   density2, // 圆上点数
        //   colorRange,
        //   showLine,
        // });
        addAiCamPos()
    }

    const addAiCamPos = () => {
      const { aiCamPos } = state;
      const { x,y,z } =aiCamPos;
      const boxGeo = new BoxGeometry(10,10,10);
      const material = new MeshBasicMaterial({color:"#ffff00"});
      const cube = new Mesh(boxGeo,material);
      cube.position.x = x;
      cube.position.y = y;
      cube.position.z = z;
      state.scene.add(cube);
    }

    // 点击事件
    const click = () => {
      //点击射线
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
            })
            var intersects = raycaster.intersectObjects(clickObjects);

            if(intersects.length > 0) {
                // 标记点击位置
                const {x,y,z} = intersects[0].point;
                state.scene.remove(state.clickPoint);
                const clickPoint = addPoint([[x,y,z]],"rgb(255,255,120)")
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
                    } else {

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

    // Bezier 三维贝塞尔曲线
    const addBezier3DCure = ()=>{
      // 三维三次贝塞尔曲线 start
      const points = [
        [30,10,20],
        [20,50,20],
        [-20,50,20],
        [-30,10,20],
      ]
      const points2 = [
        [-20,50,20],
        [-30,10,20],
        [-20,20,20],
        [-30,60,20],
      ]
      const pointsObj = points.map(v=>new Vector3(v[0],v[1],v[2]));
      const pointsObj2 = points2.map(v=>new Vector3(v[0],v[1],v[2]));
      const material2 = new LineBasicMaterial({
        color: new Color("#fff000"),
        linewidth: 30,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
      });
      addPoint(points.concat(points2),"rgb(255,255,255)");
      const geometry = new BufferGeometry();
      geometry.setFromPoints( pointsObj.concat(pointsObj2) );
      const line2 = new Line( geometry, material2 );

      // 贝塞尔曲线
      var cbc3 = new CubicBezierCurve3(...pointsObj);
      var geometry5 = new BufferGeometry();
      geometry5.setFromPoints(cbc3.getPoints(50));
      var cbc4 = new CubicBezierCurve3(...pointsObj2);
      var geometry6 = new BufferGeometry();
      geometry6.setFromPoints(cbc4.getPoints(50));
      // 三维三次贝塞尔曲线 end
      var material5 = new LineBasicMaterial({
        color: 0xE58908
      });
      var line5 = new Line(geometry5, material5);
      var line6 = new Line(geometry6, material5);
      state.scene.add(line5,line2,line6);
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

    // 混合空间动效
    function activateAllActions() {
      setWeight( state.idleAction, state.settings[ 'idleWeight' ] );
      setWeight( state.hoverAction, state.settings[ 'hoverWeight' ] );
      setWeight( state.flyAction, state.settings[ 'flyWeight' ] );
      state.actions.forEach( function ( action ) {
        action.play();
      });
    }

    // 混合空间权重
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
        size:1
      })
      const pointsObj = points.map(v=>new Vector3(v[0],v[1],v[2]));

      // points geometry
      const geometry = new SphereGeometry(1, 320, 160 );
      geometry.setFromPoints( pointsObj );
      const point = new Points(geometry, pointMaterial);
      state.scene.remove( state.point );
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
        // addPoint(points,color);
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

    // 圆上的点 r 半径, nodesCount 节点数
    const getPointsOnOtherLine =(r, nodesCount,a,b,c,lineFunc)=>{
      const points = [];
      // for(let i=-r*nodesCount;i<r*nodesCount;i++) {
      //   const y = lineFunc(i/nodesCount,a,b,c);
      //   points.push([i/nodesCount,y]);
      // }
      for(let i=0;i<nodesCount;i++) {
        const deg = (2*Math.PI / 360) * 360/nodesCount * i;
        points.push([
          a* Math.sin(deg) * r, 
          b*Math.cos(deg) * r
        ])
      }
      return points;
    };

    // 添加车削缓冲几何体
    const addLatheGeormetry = () => {
      const points = [];
      for ( let i = 0; i < 10; i ++ ) {
        points.push( new Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
      }
      const geometry = new LatheGeometry( points );
      const material = new MeshBasicMaterial( { color: 0xffff00 } );
      const lathe = new Mesh( geometry, material );
      state.scene.add( lathe );
    }

    // 获取一维曲线上的点
    const getPointsOfOneDimensionLine =(
      a,b,c,xmin,xmax,density,func
    )=> {
      const points = [];
      for(let x=xmin*density;x<xmax*density+1;x++) {
        const y = func(x/density,a,b,c);
        y.map(v2=>{
          points.push([x/density,v2]);
        })
      }
      return points;
    }

    // 添加双曲面
    const addPointsOfParaboloid = (params={
      position:[0,0,0], // 顶点位置
      radius:5, // 0 - 5之间
      density : 10, // 抛物线上的点密度
      density2: 30, // 圆上点数
      colorRange: [
        "#0050ff",
        "#b40a00"
      ], // 从上而下渐变颜色 rgb
      showLine: true,
      XYlineFunctionParams: [0.5,0,0], // 抛物线公式三参数 y=ax²+bx+c(a≠0) [a,b,c]
      XYLineFunction: (x,a,b,c)=>{
        return a * Math.pow(x,2) + b * x + c;
      }, //初等线性函数
      XZLineFunctionParams: [1,1,0], // 抛物线公式三参数 y=ax²+bx+c(a≠0) [a,b,c]
      XZLineFunction: (x,a,b,c) => {
        return a>=b && b >0 ? Math.pow((1-Math.pow(x/a,2))/Math.pow(b,2),0.5) : 0;
      } //初等线性函数
    }) => {
      const { 
        position,
        radius,
        density,
        density2,
        colorRange,
        showLine,
        XYlineFunctionParams,
        XYLineFunction,
        XZLineFunctionParams,
        XZLineFunction
      } = params
      const xLength = Math.abs(radius)<=10 ? radius : 5;
      // y=ax^2 + bx
      const a = XYlineFunctionParams[0]===0 ? 0.5 : XYlineFunctionParams[0];
      const b = XYlineFunctionParams[1];
      const c = XYlineFunctionParams[2];
      // XY平面曲线点
      const PointsOfXYFlat = getPointsOfOneDimensionLine(a,b,c,-xLength,0,density,XYLineFunction).map(v=>[v[0],v[1],0]);
      // 面构造
      const verticesPoints = []; // mesh面顶点
      //类型数组创建顶点颜色colors数据 [ 
      //   1,0,0, // 第一个点，红色
      //   0,1,0, // 第二个点，绿色
      //   ...
      // ]
      const colors = [];
      const [a2,b2,c2] = XZLineFunctionParams;

      // 想法说明：每两层的四个点构成两个三角面,依次存入顶点
      // 颜色转换
      const red1 = parseInt(colorRange[0].substring(1,3),16);
      const green1 = parseInt(colorRange[0].substring(3,5),16);
      const blue1 = parseInt(colorRange[0].substring(5,7),16);
      const red2 = parseInt(colorRange[1].substring(1,3),16);
      const green2 = parseInt(colorRange[1].substring(3,5),16);
      const blue2 = parseInt(colorRange[1].substring(5,7),16);
      for(let i=0;i<PointsOfXYFlat.length-1;i++) {
        const pointsOfCircleLevel1 = getPointsOnOtherLine(PointsOfXYFlat[i][0],density2,a2,b2,c2,XZLineFunction);
        const pointsOfCircleLevel2 = getPointsOnOtherLine(PointsOfXYFlat[i+1][0],density2,a2,b2,c2,XZLineFunction);
        // const pointsOfCircleLevel1 = getPointsOfOneDimensionLine(a2,b2,c2,-Math.abs(PointsOfXYFlat[i][0]),Math.abs(PointsOfXYFlat[i][0]),density2,XZLineFunction);
        // const pointsOfCircleLevel2 = getPointsOfOneDimensionLine(a2,b2,c2,-Math.abs(PointsOfXYFlat[i+1][0]),Math.abs(PointsOfXYFlat[i+1][0]),density2,XZLineFunction);
        // console.log(pointsOfCircleLevel2);
        const Level1Color = [
          (red2-red1)/255*i/PointsOfXYFlat.length+red1/255,
          (green2-green1)/255*i/PointsOfXYFlat.length+green1/255,
          (blue2-blue1)/255*i/PointsOfXYFlat.length+blue1/255
        ];
        const Level2Color = [
          (red2-red1)/255*(i+1)/PointsOfXYFlat.length+red1/255,
          (green2-green1)/255*(i+1)/PointsOfXYFlat.length+green1/255,
          (blue2-blue1)/255*(i+1)/PointsOfXYFlat.length+blue1/255
        ];
        for(let j=0;j<density2;j++) {
          if(j<density2-1) {
            pointsOfCircleLevel1[j] && verticesPoints.push([pointsOfCircleLevel1[j][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[j][1]]);
            pointsOfCircleLevel2[j] && verticesPoints.push([pointsOfCircleLevel2[j][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j][1]]);
            pointsOfCircleLevel1[j+1] && verticesPoints.push([pointsOfCircleLevel1[j+1][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[j+1][1]]);
            pointsOfCircleLevel1[j+1] && verticesPoints.push([pointsOfCircleLevel1[j+1][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[j+1][1]]);
            pointsOfCircleLevel2[j] && verticesPoints.push([pointsOfCircleLevel2[j][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j][1]]);
            // verticesPoints.push([pointsOfCircleLevel2[j+1][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j+1][1]]);
            
            pointsOfCircleLevel2[j+1] && verticesPoints.push([pointsOfCircleLevel2[j+1][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j+1][1]]);
            // 颜色按层赋值
            colors.push(Level1Color);
            colors.push(Level2Color);
            colors.push(Level1Color);
            colors.push(Level1Color);
            colors.push(Level2Color);
            colors.push(Level2Color);
          } else {
            pointsOfCircleLevel1[j] && verticesPoints.push([pointsOfCircleLevel1[j][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[j][1]]);
            pointsOfCircleLevel2[j] && verticesPoints.push([pointsOfCircleLevel2[j][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j][1]]);
            pointsOfCircleLevel1[0] && verticesPoints.push([pointsOfCircleLevel1[0][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[0][1]]);
            pointsOfCircleLevel1[0] && verticesPoints.push([pointsOfCircleLevel1[0][0],PointsOfXYFlat[i][1],pointsOfCircleLevel1[0][1]]);
            pointsOfCircleLevel2[j] && verticesPoints.push([pointsOfCircleLevel2[j][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[j][1]]);
            pointsOfCircleLevel2[0] && verticesPoints.push([pointsOfCircleLevel2[0][0],PointsOfXYFlat[i+1][1],pointsOfCircleLevel2[0][1]]);
            // 颜色按层赋值
            colors.push(Level1Color);
            colors.push(Level2Color);
            colors.push(Level1Color);
            colors.push(Level1Color);
            colors.push(Level2Color);
            colors.push(Level2Color);
          }
        }
      }
      // state.resPoints = resPoints.map(v=>[v[0]+position[0],v[1]+position[1],v[2]+position[2]]);
      // addPoint(resPoints.map(v=>[v[0]+position[0],v[1]+position[1],v[2]+position[2]]),"rgb(255,255,0)")
      // const verticesPoints = resPoints.map(v=>v.join(',')).join(',').split(',');
      if(showLine) {
        state.resPoints = verticesPoints.map(v=>[v[0]+position[0],v[1]+position[1],v[2]+position[2]]);
      } else{
        state.resPoints = [];
      }

      // 画mesh
      const geometry = new BufferGeometry();
      const vertices = new Float32Array(verticesPoints.map(v=>[v[0]+position[0],v[1]+position[1],v[2]+position[2]].join(',')).join(',').split(','));
      const attribue = new BufferAttribute(vertices, 3);
      geometry.attributes.position = attribue;
      // 设置几何体attributes属性的颜色color属性
      const colorsArr = new Float32Array(colors.map(v=>v.join(',')).join(',').split(','));
      geometry.attributes.color = new BufferAttribute(colorsArr, 3); //3个为一组,表示一个顶点的颜色数据RGB
      var material = new MeshBasicMaterial({
        // 使用顶点颜色数据渲染模型，不需要再定义color属性
        // color: 0xff0000,
        opacity: 0.5,
        side: DoubleSide, //两面可见
        vertexColors: VertexColors, //以顶点颜色为准
        // wireframe: true,
        wireframeLinewidth:1,
        // reflectivity: 1,
      });
      // 网格模型  三角面渲染模式
      state.scene.remove( state.mesh );
      state.mesh = new Mesh(geometry, material); //网格模型
      state.scene.add(state.mesh); //点对象添加到场景中
      // getPointsOnCircle()
      // state.resPoints = points.map(v=>[v[0]+position[0],v[1]+position[1],v[2]+position[2]])
    }

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
      ()=>[state.ParaboloidA,
        state.ParaboloidB,
        state.ParaboloidC,
        state.ParaboloidDensity,
        state.ParaboloidColorRangeClip,
        state.ParaboloidColorRangeCenter,
        state.isParaboloidShowLine,
        state.Linefunction,
        state.Linefunction2,
        state.ParaboloidA2,
        state.ParaboloidB2,
        state.ParaboloidC2
      ],
      ([
        ParaboloidA,
        ParaboloidB,
        ParaboloidC,
        density,
        ColorRangeClip,
        ColorRangeCenter,
        showLine,
        Linefunction,
        Linefunction2,
        ParaboloidA2,
        ParaboloidB2,
        ParaboloidC2,
      ]) => {
        state.FunctionDes = Linefunction.des(ParaboloidA,ParaboloidB,ParaboloidC)
        const colorRange = [ColorRangeClip,ColorRangeCenter]
        // 添加双曲面
        const {
          nodesCount: density2
        } = state;
        const [
          {func: XYLineFunction},
          {func: XZLineFunction}
        ] = [
          Linefunction,
          Linefunction2,
        ]
        state.FunctionDes = state.Linefunction.des(state.ParaboloidA,state.ParaboloidB,state.ParaboloidC)
        state.FunctionDes2 = state.Linefunction2.des(state.ParaboloidA2,state.ParaboloidB2,state.ParaboloidC2)
        addPointsOfParaboloid({
          XYlineFunctionParams: [ParaboloidA,ParaboloidB,ParaboloidC],
          XZLineFunctionParams: [ParaboloidA2,ParaboloidB2,ParaboloidC2],
          XYLineFunction,
          XZLineFunction,
          position:[0,0,0], // 顶点位置
          radius:10, // 0 - 10之间
          density, // 抛物线上的点密度
          density2, // 圆上点数
          colorRange,
          showLine,
        });
      }
    )

    watch(
      ()=>state.radius,
      (newVal,oldVal)=>{
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
      }
    );
    watch(
      ()=>state.nodesCount,
      (density2,oldVal)=>{
        // const {
        //   layerHeight,
        //   radius,
        //   layers,
        // } = state;
        // addCurve({
        //   density2,
        //   layerHeight,
        //   radius,
        //   layers,
        // });
          
        // 添加双曲面
        const {
          Linefunction,
          Linefunction2,
          ParaboloidA,
          ParaboloidB,
          ParaboloidC,
          ParaboloidDensity: density,
          ParaboloidA2,
          ParaboloidB2,
          ParaboloidC2,
          ParaboloidColorRangeClip,
          ParaboloidColorRangeCenter,
          isParaboloidShowLine: showLine
        } = state;
        const colorRange = [ParaboloidColorRangeClip,ParaboloidColorRangeCenter]
        const [
          {func: XYLineFunction},
          {func: XZLineFunction}
        ] = [
          Linefunction,
          Linefunction2,
        ]
        state.FunctionDes = state.Linefunction.des(state.ParaboloidA,state.ParaboloidB,state.ParaboloidC)
        state.FunctionDes2 = state.Linefunction2.des(state.ParaboloidA2,state.ParaboloidB2,state.ParaboloidC2)
        addPointsOfParaboloid({
          XYlineFunctionParams: [ParaboloidA,ParaboloidB,ParaboloidC],
          XZLineFunctionParams: [ParaboloidA2,ParaboloidB2,ParaboloidC2],
          XYLineFunction,
          XZLineFunction,
          position:[0,0,0], // 顶点位置
          radius:10, // 0 - 10之间
          density, // 抛物线上的点密度
          density2, // 圆上点数
          colorRange,
          showLine,
        });
      }
    );
    watch(
      ()=>state.layerHeight,
      (newVal,oldVal)=>{
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
      }
    );
    watch(
      ()=>state.layers,
      (newVal,oldVal)=>{
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
      }
    );
    watch(
      ()=>state.pointCounts,
      (newVal,oldVal)=>{
        handleAddRandPath()
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

    // 获取识别结果
    const onFaceResult = (res) => {
      state.aiResults = res;
      renderPoseMesh(res);
    }

    const renderPoseMesh = (res) => {
      const { poseModels,poseLines,posePoints } = state;
      if(!res || res.length===0) {
        state.poseModels = [];
        state.poseLines = [];
        state.posePoints = [];
        return;
      }
      if(res.length < state.poseLines.length ) { // 根据检测结果删除痕迹模型、线、点
        const delcounts = poseLines.length - res.length;
        const delFacesModel = poseModels.splice(res.length-1,delcounts);
        delFacesModel.map(v=>{
          v.handConnectionsModel && state.scene.remove(v.handConnectionsModel)
        })
        
        const delhandLines = poseLines.splice(res.length-1,delcounts);
        delhandLines.map(v=>{
          v.handConnectionsLine && state.scene.remove(v.handConnectionsLine)
        })

        const delhandPoints = posePoints.splice(res.length-1,delcounts);
        delhandPoints.map(v=>{
          v.handConnectionsPoint && state.scene.remove(v.handConnectionsPoint)
        })
        state.poseModels = poseModels;
        state.poseLines = poseLines;
        state.posePoints = posePoints;
      }
      // 绘制盒子范围
      const { aiWrap } = state;
      const boxGeo = new BoxGeometry(aiWrap.width,aiWrap.height,aiWrap.depth);
      const boxMaterial = new MeshBasicMaterial({
        color:0x00229901,
        opacity: 0.2,
        wireframe: true,
        wireframeLinewidth: 1,
      });
      const cube = new Mesh(boxGeo,boxMaterial);
      state.scene.add(cube);
      // 检测结果建模
      res.map((pose,i)=>{
        const { poseConnectionsPoints } = pose
        if(!poseConnectionsPoints || poseConnectionsPoints.length===0) return;

        // 画点
        const curPosePoints = state.posePoints[i];
        const handConnectionsPoint = drawPoint(poseConnectionsPoints.flat(),aiWrap,"#ffffff");
        const posePoint = {
          handConnectionsPoint
        }
        if(curPosePoints) {
          curPosePoints.handConnectionsPoint && state.scene.remove(curPosePoints.handConnectionsPoint);
        }
        state.posePoints[i] = posePoint;
        if(!handConnectionsPoint) {
          state.scene.remove(curPosePoints.handConnectionsPoint); 
          return;
        }
        handConnectionsPoint && state.scene.add(handConnectionsPoint);

        // 划线
        const curPoseLines = state.poseLines[i];
        const handConnectionsLine = drawLine(poseConnectionsPoints.flat(),aiWrap);
        const poseLine = {
          handConnectionsLine
        }
        if(curPoseLines) {
          curPoseLines.handConnectionsLine && state.scene.remove(curPoseLines.handConnectionsLine);
        }
        state.poseLines[i] = poseLine;
        if(!handConnectionsLine) {
          state.scene.remove(curPoseLines.handConnectionsLine); 
          return;
        }
        handConnectionsLine && state.scene.add(handConnectionsLine);

        // 画面
        // const curPoseModel = state.poseModels[i];
        // const handConnectionsModel = drawMesh(poseConnectionsPoints.flat(),["#0050ff","#b40a00"],aiWrap); //网格模型
        
        // const poseModels = {
        //   handConnectionsModel, // ai 手部
        // }

        // if(curPoseModel) {
        //   curPoseModel.handConnectionsModel && state.scene.remove(curPoseModel.handConnectionsModel);
        // }

        // state.poseModels[i] = poseModels;

        // if(!handConnectionsModel) {
        //   state.scene.remove(curPoseModel.handConnectionsModel); 
        //   return;
        // }
        // handConnectionsModel && state.scene.add(handConnectionsModel);
      })
    }

    // 画点
    const drawPoint = (faceLandMarks,aiWrap,color="#0050ff") => {
      if(faceLandMarks.includes(undefined)) return null;
      const verticesPoints = faceLandMarks.map(v=>v ?
      [
        v.x*aiWrap.width-aiWrap.width*0.5 || 0,
        aiWrap.height*0.5-v.y*aiWrap.height || 0,
        -v.z*aiWrap.depth*0 || 0]:[0,0,0]);
      const pointMaterial = new PointsMaterial({
        color: new Color(color),
        size:4
      })
      const geometry = new SphereGeometry(1,320,320);
      const pointsObj = verticesPoints.map(v=>new Vector3(v[0],v[1],v[2]));
      geometry.setFromPoints( pointsObj );
      return new Points(geometry, pointMaterial);
    }

    // 画线
    const drawLine = (faceLandMarks,aiWrap,color="#0050ff",direction= -1) => {
      if(faceLandMarks.includes(undefined)) return null;
      const verticesPoints = faceLandMarks.map(v=>v ?
      [
        v.x*aiWrap.width-aiWrap.width*0.5 || 0,
        aiWrap.height*0.5-v.y*aiWrap.height || 0,
        (-v.z*aiWrap.depth*0)*direction || 0]:[0,0,0]);
      const material = new LineBasicMaterial({
        color: new Color(color),
        linewidth: 30,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
      });
      const geometry = new BufferGeometry();
      const pointsObj = verticesPoints.map(v=>new Vector3(v[0],v[1],v[2]));
      geometry.setFromPoints( pointsObj );
      return new Line( geometry, material );
    }

    // 画面
    const drawMesh = (faceLandMarks,colorRange=["#0050ff",
        "#b40a00"],aiWrap) => {
      if(faceLandMarks.includes(undefined)) return null;
      const verticesPoints = faceLandMarks.map(v=>v ?
      [
        v.x*aiWrap.width-aiWrap.width*0.5 || 0,
        aiWrap.height*0.5-v.y*aiWrap.height || 0,
        -v.z*aiWrap.depth*4 || 0].join(','):"0,0,0").join(',').split(',');
      const colors = [];
      for(let i=0;i<faceLandMarks.length;i++) {
        const red1 = parseInt(colorRange[0].substring(1,3),16);
        const green1 = parseInt(colorRange[0].substring(3,5),16);
        const blue1 = parseInt(colorRange[0].substring(5,7),16);
        const red2 = parseInt(colorRange[1].substring(1,3),16);
        const green2 = parseInt(colorRange[1].substring(3,5),16);
        const blue2 = parseInt(colorRange[1].substring(5,7),16);
        const color = [
          (red2-red1)/255*i/faceLandMarks.length+red1/255,
          (green2-green1)/255*i/faceLandMarks.length+green1/255,
          (blue2-blue1)/255*i/faceLandMarks.length+blue1/255
        ];
        colors.push(color);
      }
      // 画mesh
      const geometry = new BufferGeometry();
      const vertices = new Float32Array(verticesPoints);
      const attribue = new BufferAttribute(vertices, 3);
      geometry.attributes.position = attribue;
      // 设置几何体attributes属性的颜色color属性
      const colorsArr = new Float32Array(colors.map(v=>v.join(',')).join(',').split(','));
      geometry.attributes.color = new BufferAttribute(colorsArr, 3); //3个为一组,表示一个顶点的颜色数据RGB
      var material = new MeshBasicMaterial({
        // 使用顶点颜色数据渲染模型，不需要再定义color属性
        // color: 0xff0000,
        // opacity: 0.5,
        side: DoubleSide, //两面可见
        // vertexColors: VertexColors, //以顶点颜色为准
        wireframe: true,
        wireframeLinewidth:1,
        // reflectivity: 1,
      });
      // 网格模型  三角面渲染模式
      return new Mesh(geometry, material); //网格模型
    }

    const detechResultRef = ref(null);
    const handleFullScreen = () => {
      state.isDetechResultFullScreem = !state.isDetechResultFullScreem
    }

    watch(
      ()=>state.isDetechResultFullScreem,
      (n,o)=>{
        if(n) {
          detechResultRef.value.style.width="100vw";
          detechResultRef.value.style.height="100vh";
          detechResultRef.value.style.top="0";
          detechResultRef.value.style.left="0";
          return;
        }
        detechResultRef.value.style.width="300px";
        detechResultRef.value.style.height="200px";
        detechResultRef.value.style.top="auto";
        detechResultRef.value.style.left="auto";
      }
    )

    return {
      ...toRefs(state),
      containerRef,
      handleOnChangeRange,
      handleAddPath,
      frameRef,
      handleChangeLineFunc,
      detechResultRef,
      handleFullScreen,
      onFaceResult
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
  // background: radial-gradient(circle at 50% 50%,#384364,#1c292b,rgb(61, 61, 61));
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
    position: relative;
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
  .pannel.hide {
    display: none;
  }
  .infoPopwindow {
    transition: all 0.3s ease-in-out;
    transform: translateX(0);
    position: fixed;
    top: 0;
    right: 0;
    padding: 15px;
    z-index: 9999;
    margin: 15px;
    height: 100vh;
    overflow-y: scroll;
    @include flexColumnBetweenRight();
    align-items: flex-start;
    backdrop-filter: blur(5px);
    background-color: rgba(8, 7, 7, 0.4);
    max-width: 500px;
    .chosenObjInfo {
      transition: all 0.3s ease-in-out;
      transform: translateX(0);
      position: fixed;
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
      transition: all 0.3s ease-in-out;
      transform: translateX(120%);
      opacity: 0;
    }
  }
  .hide {
    transform: translateX(-1);
  }
  .loading-wrap {
    position: fixed;
    z-index: 99999;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
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
.detech-result-container {
  position: fixed;
  width: 300px;
  height: 200px;
  bottom: 20px;
  right: 20px;
  z-index: 9999999;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}
</style>