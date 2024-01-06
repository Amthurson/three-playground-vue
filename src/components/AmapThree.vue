<template>
  <div class="container" id="container">

  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, ref } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
export default defineComponent({
    name: "ThreeDemo",
    setup() {
        const containerRef = ref(null)
        const state = reactive({
        });
        onMounted(()=>{
            AMapLoader.load({
                "key": "3e96f36e2aa159ec5298a02b002bae5a",              // 申请好的Web端开发者Key，首次调用 load 时必填
                "version": "2.0",   // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
                "plugins": [
                    "GltfLoader",
                    "Map3D"
                ],           // 需要使用的的插件列表，如比例尺'AMap.Scale'等
            }).then((AMap)=>{
                console.log(AMap)

                const map = new AMap.Map('container',{
                    zoom: 16,  //设置地图显示的缩放级别
                    center: [113.360398,23.10198],//设置地图中心点坐标
                    layers: [new AMap.TileLayer.Satellite()],  //设置图层,可设置成包含一个或多个图层的数组
                    mapStyle: 'amap://styles/whitesmoke',  //设置地图的显示样式
                    viewMode: '3D',  //设置地图模式
                    pitch:75,
                    terrain: true
                });
                
                map.AmbientLight = new AMap.Lights.AmbientLight([1, 1, 1], 0.9);
                map.DirectionLight = new AMap.Lights.DirectionLight([0, -1, 1], [1, 1, 1], 0.1); 

                var object3Dlayer = new AMap.Object3DLayer();
                map.add(object3Dlayer);

                // 加载AMap.GltfLoader插件
                AMap.plugin(["AMap.GltfLoader"],function(){
                    // 创建AMap.GltfLoader插件实例
                    var gltf = new AMap.GltfLoader();

                    // 调用load方法，加载 glTF 模型资源
                    var urlDuck = 'https://a.amap.com/jsapi_demos/static/gltf/Duck.gltf';  // 模型资源文件路径，远程/本地文件均可
                    gltf.load(urlDuck, function( gltfCity ){
                        console.log(gltfCity);
                        // gltfCity 为解析后的gltf对象
                        var option = {
                            position: new AMap.LngLat(113.363413,23.101542),  // 必须, 设置gltf模型位置
                            scale: 600,  // 非必须，设置模型缩放倍数
                            height: 100,  // 非必须，设置模型高度
                            scene: 0, // 非必须，设置当前场景序号
                        }
                        gltfCity.setOption(option);
                        gltfCity.rotateY(90);
                        object3Dlayer.add(gltfCity);
                    });

                    // 可多次调用load方法，加载多个 glTF 模型资源
                    var urlCity = 'https://a.amap.com/jsapi_demos/static/gltf-online/shanghai/scene.gltf';
                    gltf.load(urlCity, function( gltfDuck ){
                        // gltfDuck 为解析后的gltf对象
                    });
                })

            }).catch(e => {
                console.log(e);
            });
        })
        return {
            ...toRefs(state)
        }
    }
});
</script>
<style lang="scss" scoped>
@import "@/assets/styles/mixin.scss";
.container {
    width: 100%;
    height: 100%;
}
</style>