<template>
<div class="wrap">
    <div id="container" class="geomap" ref="geomap"></div>
    <div class="pannel">
        <input type="range" name="radius" class="radius" />
        <input type="range" name="nodeCounts" class="ranodeCountsdius" />
    </div>
</div>
</template>
 
<script>
import { defineComponent, onMounted, reactive, toRefs, ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

import AMapLoader from "@amap/amap-jsapi-loader";
export default defineComponent({
    name: "AMapWithThree",
    setup(){
        const geomap = ref(null);
        const state =reactive({
            map: null,
            gllayer: null,
            render: null,
            camera: null,
            line: null,
            lightlist: [
                {
                    type: "AmbientLight", //光的类型
                    color: 0xffffff, //光的颜色
                    intensity: 2, //光照强度
                    posiy: [10,10, 10], //光照位置
                },
                {
                    type: "DirectionalLight", //光的类型
                    color: 0xffffff, //光的颜色
                    intensity: 2, //光照强度
                    posiy: [10, 10, 10], //光照位置
                },
            ],
            customCoords: null,
            AMapConfig: {
                center: [113.362627,23.101029]
            },
            aminonte: false,//镜头自动绕Y轴自转
        });
        onMounted(()=>{
            //DOM初始化完成进行地图初始化
            initMap();
        });

        // 添加3d
        const addthree = () => {
            // 初始化数据转换工具
            state.customCoords = state.map.customCoords;
            // 经纬度数据转换
            state.customCoords.lngLatsToCoords([state.AMapConfig.center]);
            // 引入three图层
            state.gllayer = new AMap.GLCustomLayer({
                // 图层的层级c
                zIndex: 2000,
                // 初始化的操作，创建图层过程中执行一次。
                init: (gl) => {
                    state.render = new THREE.WebGLRenderer({
                        context: gl, // 地图的 gl 上下文
                        alpha: true,
                    });
                    // 初始化场景对象
                    initScene();
                    // 初始化模型
                    // 建筑群模型
                    // const loaderConfig = {
                    //     path: 'public/buildings_pack/',
                    //     fileName: "scene.gltf",
                    //     position: [0,0,150],
                    //     rotation: [0,0,0],
                    //     scale: [50,50,50],
                    // }
                    // 半透丰富结构建筑
                    const loaderConfig = {
                        path: 'public/casa_mvc_-_apresentacao/',
                        fileName: "scene.gltf",
                        position: [0,100,0],
                        rotation: [0,0,0],
                        scale: [10,10,10],
                    }
                    initLoader(loaderConfig);
                    // 初始化光源
                    initLight();
                    // 初始化相机
                    initCamera();
                    // 添加曲线路径
                    // addSplineCurve();

                    // 自动清空画布这里必须设置为 false，否则地图底图将无法显示
                    // 这里我们的地图模式是 3D，所以创建一个透视相机，
                    // 相机的参数初始化可以随意设置，因为在 render 函数中，每一帧都需要同步相机参数，
                    //因此这里变得不那么重要。
                    // 如果你需要 2D 地图（viewMode: '2D'），那么你需要创建一个正交相机
                    // 环境光照和平行光
                    state.render.autoClear = false;
                },
                render: () => {
                    renderer();
                },
            });
            // 把three图层引入地图
            state.map.add(state.gllayer);
            // 渲染图层
            animate();
            // 设置动画
            // tweenUpdate();
        }

        // 初始化场景对象
        const initScene =()=> {
            // 初始化场景
            scene = new THREE.Scene();
            // 旋转场景
            scene.rotation.x = (Math.PI / 180) * 90;
            // scene.rotation.y = (Math.PI / 180) * -58;
            scene.scale.set(1.18, 1.18, 1.18);
            // 创建三维坐标系
            var axesHelper = new THREE.AxesHelper(100);
            scene.add(axesHelper);
        };
        // 初始化光源
        const initLight = () => {
            // 遍历添加光源
            state.lightlist.forEach((item) => {
                var light = new THREE[item.type](item.color, item.intensity);
                light.position.set(item.posiy[0], item.posiy[1], item.posiy[2]); //点光源位置
                scene.add(light);
            });
        };
        // 初始化相机
        const initCamera = () => {
            const geomapEle = document.getElementsByClassName("geomap")[0];
            state.camera = new THREE.PerspectiveCamera(
                60,
                geomapEle.offsetWidth / geomapEle.offsetHeight,
                100,
                1 << 30
            );
        }

        // 加载模型 - GLTF ------------------------------------------------------------------------------------------------
        const initLoader = (config) => {
            const {
                path,
                fileName,
                position,
                rotation,
                scale
            } = config;
            // 加载gltf模型（glb) 
            const modelloader = new GLTFLoader().setPath( path );
            modelloader.load(fileName, (obj)=>{
                scene.add(obj.scene);
                obj.animations; // Array<THREE.AnimationClip>
                obj.scene; // THREE.Group
                obj.scenes; // Array<THREE.Group>
                obj.cameras; // Array<THREE.Camera>
                obj.asset; // Object
                obj.scene.position.set(...position);
                obj.scene.rotation.set(...rotation);
                obj.scene.scale.set(...scale);
                state.render.render( scene, state.camera );
            }, (xhr) => {
                console.log("xhr", (xhr.loaded/xhr.total) * 100 + "% loaded");
            }, (error) => {
                console.log("error while loading",error)
            }
            )
        }

        // 加载模型 - Fbx ------------------------------------------------------------------------------------------------
        // const initLoader = () => {
        //     const modelloader = new FBXLoader().setPath( 'public/fbx/' );
        //     modelloader.load("gjh-gjg.fbx", (obj)=>{
        //         scene.add(obj.scene);
        //         console.log(obj);
        //         obj.animations; // Array<THREE.AnimationClip>
        //         obj.scene; // THREE.Group
        //         obj.scenes; // Array<THREE.Group>
        //         obj.cameras; // Array<THREE.Camera>
        //         obj.asset; // Object
        //         obj.scene.position.set(0,0,0);
        //         obj.scene.rotation.set(0,0,0);
        //         obj.scene.scale.set(20,20,20);
        //         state.render.render( scene, state.camera );
        //     }, (xhr) => {
        //         console.log("xhr", (xhr.loaded/xhr.total) * 100 + "% loaded");
        //     }, (error) => {
        //         console.log("error while loading",error)
        //     }
        //     )
        // }

        // 添加线段路径 points, color: rgb
        const addPath = (points=[[0,0,0]],color="rgb(255,255,0)") => {
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color(color)
            });

            const pointsObj = points.map(v=>new THREE.Vector3(v[0],v[1],v[2]));

            const geometry = new THREE.BufferGeometry();
            geometry.setFromPoints( pointsObj );

            const line = new THREE.Line( geometry, material );
            if(state.line){
                scene.remove( state.line );
            }
            state.line = line;
            scene.add( line );
        }

        // 渲染器对象
        const renderer = () => {
            // 这里必须执行！！重新设置 three 的 gl 上下文状态。
            state.render.state.reset();
            var { near, far, fov, up, lookAt, position } =
                state.customCoords.getCameraParams();
            // 2D 地图下使用的正交相机
        
            // 这里的顺序不能颠倒，否则可能会出现绘制卡顿的效果。
            state.camera.near = near;
            state.camera.far = far;
            state.camera.fov = fov;
            state.camera.position.set(...position);
            state.camera.up.set(...up);
            state.camera.lookAt(...lookAt);
            state.camera.updateProjectionMatrix();
        
            // 2D 地图使用的正交相机参数赋值
            //   state.camera.top = top;
            //   state.camera.bottom = bottom;
            //   state.camera.left = left;
            //   state.camera.right = right;
            //   state.camera.position.set(...position);
            //   state.camera.updateProjectionMatrix();
            state.render.render(scene, state.camera);
        };
        // 动画
        const animate = () => {
            // 渲染时刷新地图
            state.map.render(scene, state.camera);
            //   添加了一个旋转地图的动画
            if (state.aminonte) {
                var totation = state.map.getRotation();
                // -360 - 360 范围
                // 在-180的时候重置为180 （aminonte是停止一下动画的
                if (totation > -180) {
                    state.map.setRotation((totation - 0.01) % 360, true);
                } else if (totation <= -180) {
                    state.aminonte = false;
                    state.map.setRotation(180, true);
                    state.aminonte = true;
                }
            };
            // 添加线段
            if(scene) {
                 addPath([
                    [0,0,0],
                    [150,0,0],
                    [0,150,0],
                    [0,0,150],
                    [-150,0,0],
                    [0,-150,0],
                    [0,0,-150],
                ], "rgb(255,0,0)");
            }
            // 自动刷新
            window.requestAnimationFrame(animate);
        }
        // 初始化地图
        const initMap = ()=> {
            window._AMapSecurityConfig = {
                securityJsCode:"289758945ffbd5fea7d797ac83d3e50c",//初始化时加载秘钥
            };

            AMapLoader.load({
                key: "3e96f36e2aa159ec5298a02b002bae5a", // 申请好的Web端开发者Key，首次调用 load 时必填
                version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
                plugins: [""], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
            })
            .then((AMap) => {
                state.map = new AMap.Map("container", {
                    //设置地图容器id
                    viewMode: "3D", //是否为3D地图模式
                    zoom: 17, //初始化地图级别
                    center: state.AMapConfig.center, //初始化地图中心点位置
                    pitch: 75
                });
                // 添加动画
                addthree();
            })
            .catch((e) => {
                console.log(e);
            });
        }
        return {
            ...toRefs(state),
            geomap
        }
    }
});
</script>
 
<style lang="scss" scoped>
.wrap {
    padding: 0px;
    margin: 0px;
    width: 100%;
    height: 800px;
    #container {
        padding: 0px;
        margin: 0px;
        width: 100%;
        height: 800px;
    }
    .pannel {
        position: fixed;
        top: 0;
        left: 0;
        padding: 15px;
        z-index: 9999;
    }
}

</style>