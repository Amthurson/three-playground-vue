<template>
    <div class="container">
      <div class="header">
        <div class="title">{{route.name}}</div>
      </div>
      <div class="content">
        <div class="menu">
            <div @click="handleChangePage(i)" v-for="(item,i) in menus" :key="i" :class="`item ${i===selected ? 'selected':''}`">{{item.title}}</div>
        </div>
        <div class="view">
            <div v-if="route.path === '/three'" class="intro">
                <div class="title">ThreeJS</div>
                <div class="line"></div>
                <img @click="handlePreview" src="/docs/ThreeJS.svg" alt="">
                <div class="sub-title">
                    1. Three场景搭建
                </div>
                <div class="text">
                    创建场景的基本要素：<br/>
                    场景创建(scene)：new Scene()<br/>
                    镜头(camera)：new PerspectiveCamera()<br/>
                    渲染器(renderer)：new WebGLRenderer()<br/>
                    坐标轴(axis)：new AxesHelper()<br/>
                    环境光源(ambientLight)：new AmbientLight()<br/>
                    直射光源(directionalLight)：new DirectionalLight()<br/>
                    镜头控制器(orbitControl)：new OrbitControls()<br/>
                    <br/>
                    基本思路：<br/>
                    创建一个init的function -> 创建容器div -> 监听容器大小 -> 创建renderer -> 将renderer.domElement append进容器中 -> 创建scene -> 创建camera -> 创建axis -> 创建orbitControl -> 创建环境、直射光源 -> camera、axis、orbitControl添加到scene中 -> 创建animate 方法，通过resquestAnimationFrame( animate ) 实时渲染，并在init内部执行
                </div>
                <div class="sub-title">
                    2. 天空及地面实现
                </div>
                <div class="text">
                    全景图片分割处理网站<br/>
                    <a href="https://jaxry.github.io/panorama-to-cubemap/">https://jaxry.github.io/panorama-to-cubemap/</a><br/>
                    <a href="https://www.360toolkit.co/convert-spherical-equirectangular-tocubemap.html">https://www.360toolkit.co/convert-spherical-equirectangular-tocubemap.html</a>
                </div>
                <div class="sub-title">
                    2. 模型相关
                </div>
                <div class="text">
                    功能：<br/>
                    fbx、gltf、模型加载
                    <br/>
                    构件树，射线碰撞
                    <br/>
                    mixer混合空间动画<br/>
                    <br/>
                    重要知识点：<br/>
                    1. gltf、fbx加载
                    2. 射线碰撞实现点击
                    3. 镜头与场景根据屏幕或者容器变化进行resize
                </div>
                <div class="sub-title">
                    3. 解析几何
                </div>
                <div class="text">
                    功能：<br/>
                    抛物线、椭圆曲线、双曲线、正弦函数等初等函数作图
                    <br/>
                    正交平面线性方程交点绘制双曲线形成的面
                </div>
            </div>
            <router-view></router-view>
        </div>
      </div>
    </div>
  </template>
  
  <script>
    import { defineComponent, onMounted, reactive, toRefs } from "vue";
    import ThreeWorld from "@/components/ThreeWorld.vue";
    import { useRouter, useRoute } from "vue-router";
    export default defineComponent({
        name: "Demo",
        components: {
            ThreeWorld
        },
        setup(props,context) {
            const router = useRouter();
            const route = useRoute();
            const state = reactive({
                selected: 1,
                menus: [
                    // {
                    //     title: "Catalog",
                    //     route: "/three",
                    // },
                    {
                        title: "仓库DEMO",
                        route: "/three/cargoDemo",
                    },
                    {
                        title: "天空、阳光、地表材质",
                        route: "/three/sky-floor",
                    },
                    {
                        title: "第一人称平地视角",
                        route: "/three/fiirst-person-walk",
                    },
                    {
                        title: "第一人称自由视角",
                        route: "/three/fiirst-person-free",
                    },
                    {
                        title: "第三人称固定视角",
                        route: "/three/third-person-static",
                    },
                    {
                        title: "地球",
                        route: "/three/earth",
                    },
                    {
                        title: "WebGIS实现",
                        route: "/three/map",
                    },
                    {
                        title: "模型渲染",
                        route: "/three/models",
                    },
                    {
                        title: "函数可视化",
                        route: "/three/function-geometry",
                    },
                    {
                        title: "NURBS曲面",
                        route: "/three/NURBSSurface",
                    },
                    {
                        title: "AI面部实时建模",
                        route: "/three/face-detech-model",
                    },
                    {
                        title: "手势识别Three场景交互",
                        route: "/three/hand-track-interact",
                    },
                    {
                        title: "pose识别Three场景交互",
                        route: "/three/pose-track-interact",
                    },
                ]
            });
            
            const handleChangePage = (index) => {
                state.selected = index;
                router.push(state.menus[index].route);
            }

            
            onMounted(()=>{
                const currentIndex = state.menus.findIndex(v=>route.path===v.route);
                if(currentIndex===-1) return;
                state.selected = currentIndex
            })

            const handlePreview = () => {
                window.open('/docs/ThreeJS.svg')
            }

            return {
                ...toRefs(state),
                route,
                handleChangePage,
                handlePreview
            }
        }
    })
  </script>
  
  <style lang="scss" scoped>
  @import "@/assets/styles/mixin.scss";
  .container {
    width: 100vw;
    height: 100vh;
    .header {
        width: 100%;
        // padding: 30px;
        height: 60px;
        display: flex;
        padding-left: 15px;
        justify-content: flex-start;
        align-items: center;
        background-image: linear-gradient(13deg,rgba(154, 0, 97, 0.959), rgba(226, 141, 21, 0.889));
        backdrop-filter: blur(10px);
        .title {
            font-size: 24px;
            font-weight: 500;
            color: #fff;
            text-shadow: -1px -1px 5px rgba(255,255,255,0.3);
        }
    }
    .content {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
        .menu {
            min-width: fit-content;
            background-image: linear-gradient(135deg,rgba(97, 8, 90, 0.829), rgba(32, 0, 86, 0.889));
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            height: 100%;
            overflow-y: scroll;
            max-height: calc(100vh - 60px);
            .item {
                transition: all 0.2s ease-in-out;
                cursor: pointer;
                padding: 15px;
                color: #ffffffce;
                font-size: 16px;
                word-break: keep-all;
                width: 100%;
                // background-color: rgba(0, 0, 0, 0.049);
                background-image: linear-gradient(13deg,rgba(240, 0, 180, 0), rgba(226, 141, 21, 0));
            }
            .item:hover{
                transition: all 0.2s ease-in-out;
                color: #fff;
                text-shadow: -1px -1px 10px rgba(255,255,255,0.5);
                // background-color: rgba(255,255,255,0.2);
                background-image: linear-gradient(13deg,rgba(240, 0, 180, 0.393), rgba(226, 141, 21, 0));
            }
            .selected {
                color: #fff;
                text-shadow: -1px -1px 10px rgba(255,255,255,0.9);
                background-color: rgba(55, 36, 153, 0.734);
                background-image: linear-gradient(13deg,rgba(240, 0, 180, 0.393), rgba(226, 141, 21, 0));
            }
        }
        .view {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: radial-gradient(circle at 50% 50%,#23252b,#2b293d,rgb(44, 36, 61));
            .intro {
                position: absolute;
                width: 80vw;
                min-width: 640px;
                height: calc(100% - 60px); 
                overflow-y: scroll;
                padding: 30px;
                margin-top:0;
                color: #fff;
                background-color: rgba(255,255,255,0.05);
                backdrop-filter: blur(50px);
                box-shadow: 0 0 30px rgba(0,0,0,0.3);
                .title {
                    margin-bottom: 24px;
                    font-size: 28px;
                    font-weight: 500;
                }
                .line {
                    width: 100%;
                    height: 0;
                    border-top: 1px solid rgba(255,255,255,0.3);
                    margin: 16px 0;
                }
                .sub-title {
                    font-size: 18px;
                    font-weight: 400;
                    margin: 32px 0 16px;
                }
                .sub-title:first-child {
                    margin-top: 0;
                }
                .text {
                    font-size: 14px;
                    font-weight: 300;
                }
                a {
                    color: rgb(180, 234, 255);
                }
                img {
                    width: 100%;
                }
            }
        }
    }
  }
  </style>