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
      <div>
        <label for="earthTextureType">半透明: </label>
        <input type="radio" name="earthTextureType" checked @change="(e)=>handleOnChangeRange(e,'earthTextureType')" value="1">
        <label for="earthTextureType">卫星影像: </label>
        <input type="radio" name="earthTextureType" @change="(e)=>handleOnChangeRange(e,'earthTextureType')" value="0">
      </div>
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
      <label for="lineColor">行政区域边线颜色</label>
      <input type="color" @change="(e)=>handleOnChangeRange(e,'lineColor')" :value="lineColor" name="lineColor"/>
      <!-- <label for="rotationSpeed">场景旋转速度:{{rotationSpeed}}</label>
      <input type="range" min="0" max="50000" step="1" :value="rotationSpeed" @input="(e)=>handleOnChangeRange(e,'rotationSpeed')" name="rotationSpeed" class="rotationSpeed" /> -->
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
    Spherical,
    MeshPhongMaterial,
    DoubleSide,
    FrontSide,
    AdditiveBlending,
    ShaderMaterial,
} from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'

// 标签
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

// threejs自带天空示例
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// 树控件
// import Treeselect from '@riophae/vue-treeselect'
// import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import Treeselect from 'vue3-treeselect'
import 'vue3-treeselect/dist/vue3-treeselect.css'

// import {mapToScreenPosition} from "./map.ts";

// 加载模型
import { api_getModel, api_getXmlData } from '@/service/index.js';

const cities =  {
  "上海": [121.487899486, 31.24916171],
  "临沧": [100.092612914, 23.8878061038],
  "丽江": [100.229628399, 26.8753510895],
  "保山": [99.1779956133, 25.1204891962],
  "大理白族自治州": [100.223674789, 25.5968996394],
  "德宏傣族景颇族自治州": [98.5894342874, 24.441239663],
  "怒江傈僳族自治州": [98.8599320425, 25.8606769782],
  "文山壮族苗族自治州": [104.246294318, 23.3740868504],
  "昆明": [102.714601139, 25.0491531005],
  "昭通": [103.725020656, 27.3406329636],
  "普洱": [100.98005773, 22.7887777801],
  "曲靖": [103.782538888, 25.5207581429],
  "楚雄彝族自治州": [101.529382239, 25.0663556742],
  "玉溪": [102.545067892, 24.3704471344],
  "红河哈尼族彝族自治州": [103.384064757, 23.3677175165],
  "西双版纳傣族自治州": [100.803038275, 22.0094330022],
  "迪庆藏族自治州": [99.7136815989, 27.8310294612],
  "乌兰察布": [113.112846391, 41.0223629468],
  "乌海": [106.831999097, 39.6831770068],
  "兴安盟": [122.048166514, 46.0837570652],
  "包头": [109.846238532, 40.6471194257],
  "呼伦贝尔": [119.760821794, 49.2016360546],
  "呼和浩特": [111.66035052, 40.8283188731],
  "巴彦淖尔": [107.42380672, 40.7691799024],
  "赤峰": [118.930761192, 42.2971123203],
  "通辽": [122.260363263, 43.633756073],
  "鄂尔多斯": [109.993706251, 39.8164895606],
  "锡林郭勒盟": [116.027339689, 43.9397048423],
  "阿拉善盟": [105.695682871, 38.8430752644],
  "北京": [116.395645038, 39.9299857781],
  "台中": [119.337634104, 26.0911937119],
  "台北": [114.130474436, 22.3748329286],
  "台南": [121.360525873, 38.9658447898],
  "嘉义": [114.246701335, 22.7288657203],
  "高雄": [111.590952812, 21.9464822541],
  "吉林": [126.564543989, 43.8719883344],
  "四平": [124.391382074, 43.1755247011],
  "延边朝鲜族自治州": [129.485901958, 42.8964136037],
  "松原": [124.832994532, 45.1360489701],
  "白城": [122.840776679, 45.6210862752],
  "白山": [126.435797675, 41.945859397],
  "辽源": [125.133686052, 42.9233026191],
  "通化": [125.942650139, 41.7363971299],
  "长春": [125.313642427, 43.8983376071],
  "乐山": [103.760824239, 29.6009576111],
  "内江": [105.073055992, 29.5994615348],
  "凉山彝族自治州": [102.259590803, 27.8923929037],
  "南充": [106.105553984, 30.8009651682],
  "宜宾": [104.633019062, 28.7696747963],
  "巴中": [106.757915842, 31.8691891592],
  "广元": [105.81968694, 32.4410401584],
  "广安": [106.635720331, 30.4639838879],
  "德阳": [104.402397818, 31.1311396527],
  "成都": [104.067923463, 30.6799428454],
  "攀枝花": [101.722423152, 26.5875712571],
  "泸州": [105.443970289, 28.8959298039],
  "甘孜藏族自治州": [101.969232063, 30.0551441144],
  "眉山": [103.841429563, 30.0611150799],
  "绵阳": [104.705518975, 31.5047012581],
  "自贡": [104.776071339, 29.3591568895],
  "资阳": [104.635930302, 30.132191434],
  "达州": [107.494973447, 31.2141988589],
  "遂宁": [105.564887792, 30.5574913504],
  "阿坝藏族羌族自治州": [102.228564689, 31.9057628583],
  "雅安": [103.009356466, 29.9997163371],
  "天津": [117.210813092, 39.1439299033],
  "中卫": [105.196754199, 37.5211241916],
  "吴忠": [106.208254199, 37.9935610029],
  "固原": [106.285267996, 36.0215234807],
  "石嘴山": [106.379337202, 39.0202232836],
  "银川": [106.206478608, 38.5026210119],
  "亳州": [115.787928245, 33.8712105653],
  "六安": [116.505252683, 31.7555583552],
  "合肥": [117.282699092, 31.8669422607],
  "安庆": [117.058738772, 30.5378978174],
  "宣城": [118.752096311, 30.9516423543],
  "宿州": [116.988692412, 33.6367723858],
  "池州": [117.494476772, 30.6600192482],
  "淮北": [116.791447429, 33.9600233054],
  "淮南": [117.018638863, 32.6428118237],
  "滁州": [118.324570351, 32.3173505954],
  "芜湖": [118.384108423, 31.3660197875],
  "蚌埠": [117.357079866, 32.9294989067],
  "铜陵": [117.819428729, 30.9409296947],
  "阜阳": [115.820932259, 32.9012113306],
  "马鞍山": [118.515881847, 31.6885281589],
  "黄山": [118.293569632, 29.7344348562],
  "东营": [118.583926333, 37.4871211553],
  "临沂": [118.340768237, 35.0724090744],
  "威海": [122.093958366, 37.5287870813],
  "德州": [116.328161364, 37.4608259263],
  "日照": [119.507179943, 35.4202251931],
  "枣庄": [117.279305383, 34.8078830784],
  "泰安": [117.089414917, 36.1880777589],
  "济南": [117.024967066, 36.6827847272],
  "济宁": [116.600797625, 35.4021216643],
  "淄博": [118.059134278, 36.8046848542],
  "滨州": [117.968292415, 37.4053139418],
  "潍坊": [119.142633823, 36.7161148731],
  "烟台": [121.30955503, 37.5365615629],
  "聊城": [115.986869139, 36.4558285147],
  "莱芜": [117.684666912, 36.2336541336],
  "菏泽": [115.463359775, 35.2624404961],
  "青岛": [120.384428184, 36.1052149013],
  "临汾": [111.538787596, 36.0997454436],
  "吕梁": [111.143156602, 37.527316097],
  "大同": [113.290508673, 40.1137444997],
  "太原": [112.550863589, 37.890277054],
  "忻州": [112.727938829, 38.461030573],
  "晋中": [112.7385144, 37.6933615268],
  "晋城": [112.867332758, 35.4998344672],
  "朔州": [112.479927727, 39.3376719662],
  "运城": [111.006853653, 35.0388594798],
  "长治": [113.120292086, 36.2016643857],
  "阳泉": [113.569237602, 37.8695294932],
  "东莞": [113.763433991, 23.0430238154],
  "中山": [113.422060021, 22.5451775145],
  "云浮": [112.050945959, 22.9379756855],
  "佛山": [113.134025635, 23.0350948405],
  "广州": [113.307649675, 23.1200491021],
  "惠州": [114.41065808, 23.1135398524],
  "揭阳": [116.379500855, 23.5479994669],
  "梅州": [116.126403098, 24.304570606],
  "汕头": [116.728650288, 23.3839084533],
  "汕尾": [115.372924289, 22.7787305002],
  "江门": [113.078125341, 22.5751167835],
  "河源": [114.713721476, 23.7572508505],
  "深圳": [114.025973657, 22.5460535462],
  "清远": [113.040773349, 23.6984685504],
  "湛江": [110.365067263, 21.2574631038],
  "潮州": [116.630075991, 23.6618116765],
  "珠海": [113.562447026, 22.2569146461],
  "肇庆": [112.47965337, 23.0786632829],
  "茂名": [110.931245331, 21.6682257188],
  "阳江": [111.977009756, 21.8715173045],
  "韶关": [113.594461107, 24.8029603119],
  "北海": [109.122627919, 21.472718235],
  "南宁": [108.297233556, 22.8064929356],
  "崇左": [107.357322038, 22.4154552965],
  "来宾": [109.231816505, 23.7411659265],
  "柳州": [109.42240181, 24.3290533525],
  "桂林": [110.260920147, 25.262901246],
  "梧州": [111.30547195, 23.4853946367],
  "河池": [108.069947709, 24.6995207829],
  "玉林": [110.151676316, 22.6439736084],
  "百色": [106.631821404, 23.9015123679],
  "贵港": [109.613707557, 23.1033731644],
  "贺州": [111.552594179, 24.4110535471],
  "钦州": [108.638798056, 21.9733504653],
  "防城港": [108.351791153, 21.6173984705],
  "乌鲁木齐": [87.5649877411, 43.8403803472],
  "伊犁哈萨克自治州": [81.2978535304, 43.9222480963],
  "克孜勒苏柯尔克孜自治州": [76.1375644775, 39.7503455778],
  "克拉玛依": [84.8811801861, 45.5943310667],
  "博尔塔拉蒙古自治州": [82.0524362672, 44.9136513743],
  "吐鲁番地区": [89.1815948657, 42.9604700169],
  "和田地区": [79.9302386372, 37.1167744927],
  "哈密地区": [93.5283550928, 42.8585963324],
  "喀什地区": [75.9929732675, 39.4706271887],
  "塔城地区": [82.9748805837, 46.7586836297],
  "昌吉回族自治州": [87.2960381257, 44.0070578985],
  "自治区直辖": [85.6148993383, 42.1270009576],
  "阿克苏地区": [80.2698461793, 41.1717309015],
  "阿勒泰地区": [88.1379154871, 47.8397444862],
  "南京": [118.778074408, 32.0572355018],
  "南通": [120.873800951, 32.0146645408],
  "宿迁": [118.296893379, 33.9520497337],
  "常州": [119.981861013, 31.7713967447],
  "徐州": [117.188106623, 34.2715534311],
  "扬州": [119.427777551, 32.4085052546],
  "无锡": [120.305455901, 31.5700374519],
  "泰州": [119.919606016, 32.4760532748],
  "淮安": [119.030186365, 33.6065127393],
  "盐城": [120.148871818, 33.3798618771],
  "苏州": [120.619907115, 31.317987368],
  "连云港": [119.173872217, 34.601548967],
  "镇江": [119.455835405, 32.2044094436],
  "上饶": [117.955463877, 28.4576225539],
  "九江": [115.999848022, 29.7196395261],
  "南昌": [115.893527546, 28.6895780001],
  "吉安": [114.992038711, 27.1138476502],
  "宜春": [114.400038672, 27.8111298958],
  "抚州": [116.360918867, 27.9545451703],
  "新余": [114.947117417, 27.8223215586],
  "景德镇": [117.186522625, 29.3035627684],
  "萍乡": [113.859917033, 27.639544223],
  "赣州": [114.935909079, 25.8452955363],
  "鹰潭": [117.035450186, 28.2413095972],
  "保定": [115.494810169, 38.886564548],
  "唐山": [118.183450598, 39.6505309225],
  "廊坊": [116.703602223, 39.5186106251],
  "张家口": [114.89378153, 40.8111884911],
  "承德": [117.933822456, 40.9925210525],
  "沧州": [116.863806476, 38.2976153503],
  "石家庄": [114.522081844, 38.0489583146],
  "秦皇岛": [119.604367616, 39.9454615659],
  "衡水": [115.686228653, 37.7469290459],
  "邢台": [114.520486813, 37.0695311969],
  "邯郸": [114.482693932, 36.6093079285],
  "三门峡": [111.181262093, 34.7833199411],
  "信阳": [114.085490993, 32.1285823075],
  "南阳": [112.542841901, 33.0114195691],
  "周口": [114.654101942, 33.6237408181],
  "商丘": [115.641885688, 34.4385886402],
  "安阳": [114.351806508, 36.1102667222],
  "平顶山": [113.300848978, 33.7453014565],
  "开封": [114.351642118, 34.8018541758],
  "新乡": [113.912690161, 35.3072575577],
  "洛阳": [112.447524769, 34.6573678177],
  "漯河": [114.0460614, 33.5762786885],
  "濮阳": [115.026627441, 35.7532978882],
  "焦作": [113.211835885, 35.234607555],
  "省直辖": [113.486804058, 34.157183768],
  "许昌": [113.83531246, 34.0267395887],
  "郑州": [113.64964385, 34.7566100641],
  "驻马店": [114.049153547, 32.9831581541],
  "鹤壁": [114.297769838, 35.7554258742],
  "丽水": [119.929575843, 28.4562995521],
  "台州": [121.440612936, 28.6682832857],
  "嘉兴": [120.760427699, 30.7739922396],
  "宁波": [121.579005973, 29.8852589659],
  "杭州": [120.219375416, 30.2592444615],
  "温州": [120.690634734, 28.002837594],
  "湖州": [120.137243163, 30.8779251557],
  "绍兴": [120.592467386, 30.0023645805],
  "舟山": [122.169872098, 30.0360103026],
  "衢州": [118.875841652, 28.9569104475],
  "金华": [119.652575704, 29.1028991054],
  "三亚": [109.522771281, 18.2577759149],
  "三沙": [112.350383075, 16.840062894],
  "海口": [110.330801848, 20.022071277],
  "省直辖": [109.733755488, 19.1805008013],
  "十堰": [110.801228917, 32.6369943395],
  "咸宁": [114.300060592, 29.8806567577],
  "孝感": [113.935734392, 30.9279547842],
  "宜昌": [111.310981092, 30.732757818],
  "恩施土家族苗族自治州": [109.491923304, 30.2858883166],
  "武汉": [114.316200103, 30.5810841269],
  "省直辖": [112.410562192, 31.2093162501],
  "荆州": [112.241865807, 30.332590523],
  "荆门": [112.217330299, 31.0426112029],
  "襄阳": [112.250092848, 32.2291685915],
  "鄂州": [114.895594041, 30.3844393228],
  "随州": [113.379358364, 31.7178576082],
  "黄冈": [114.906618047, 30.4461089379],
  "黄石": [115.050683164, 30.2161271277],
  "娄底": [111.996396357, 27.7410733023],
  "岳阳": [113.146195519, 29.3780070755],
  "常德": [111.653718137, 29.0121488552],
  "张家界": [110.481620157, 29.1248893532],
  "怀化": [109.986958796, 27.5574829012],
  "株洲": [113.131695341, 27.8274329277],
  "永州": [111.614647686, 26.4359716468],
  "湘潭": [112.935555633, 27.835095053],
  "湘西土家族苗族自治州": [109.7457458, 28.3179507937],
  "益阳": [112.366546645, 28.5880877799],
  "衡阳": [112.583818811, 26.8981644154],
  "邵阳": [111.461525404, 27.2368112449],
  "郴州": [113.037704468, 25.7822639757],
  "长沙": [112.979352788, 28.2134782309],
  "无堂区划分区域": [113.557519102, 22.2041179884],
  "澳门半岛": [113.566432335, 22.1950041592],
  "澳门离岛": [113.557519102, 22.2041179884],
  "临夏回族自治州": [103.215249178, 35.5985143488],
  "兰州": [103.823305441, 36.064225525],
  "嘉峪关": [98.2816345853, 39.8023973267],
  "天水": [105.736931623, 34.5843194189],
  "定西": [104.626637601, 35.5860562418],
  "平凉": [106.688911157, 35.55011019],
  "庆阳": [107.644227087, 35.7268007545],
  "张掖": [100.459891869, 38.939320297],
  "武威": [102.640147343, 37.9331721429],
  "甘南藏族自治州": [102.917442486, 34.9922111784],
  "白银": [104.171240904, 36.5466817062],
  "酒泉": [98.5084145062, 39.7414737682],
  "金昌": [102.208126263, 38.5160717995],
  "陇南": [104.934573406, 33.3944799729],
  "三明": [117.642193934, 26.2708352794],
  "南平": [118.181882949, 26.6436264742],
  "厦门": [118.103886046, 24.4892306125],
  "宁德": [119.54208215, 26.6565274192],
  "泉州": [118.600362343, 24.901652384],
  "漳州": [117.676204679, 24.5170647798],
  "福州": [119.330221107, 26.0471254966],
  "莆田": [119.077730964, 25.4484501367],
  "龙岩": [117.017996739, 25.0786854335],
  "山南地区": [91.7506438744, 29.2290269317],
  "拉萨": [91.111890896, 29.6625570621],
  "日喀则地区": [88.8914855677, 29.2690232039],
  "昌都地区": [97.18558158, 31.1405756319],
  "林芝地区": [94.3499854582, 29.6669406258],
  "那曲地区": [92.0670183689, 31.4806798301],
  "阿里地区": [81.1076686895, 30.4045565883],
  "六盘水": [104.85208676, 26.5918660603],
  "安顺": [105.928269966, 26.2285945777],
  "毕节": [105.333323371, 27.4085621313],
  "贵阳": [106.709177096, 26.6299067414],
  "遵义": [106.931260316, 27.6999613771],
  "铜仁": [109.168558028, 27.6749026906],
  "黔东南苗族侗族自治州": [107.985352573, 26.5839917665],
  "黔南布依族苗族自治州": [107.52320511, 26.2645359974],
  "黔西南布依族苗族自治州": [104.900557798, 25.0951480559],
  "丹东": [124.338543115, 40.1290228266],
  "大连": [121.593477781, 38.9487099383],
  "抚顺": [123.929819767, 41.8773038296],
  "朝阳": [120.446162703, 41.5718276679],
  "本溪": [123.77806237, 41.3258376266],
  "沈阳": [123.432790922, 41.8086447835],
  "盘锦": [122.07322781, 41.141248023],
  "营口": [122.233391371, 40.6686510665],
  "葫芦岛": [120.860757645, 40.7430298813],
  "辽阳": [123.172451205, 41.2733392656],
  "铁岭": [123.854849615, 42.2997570121],
  "锦州": [121.147748738, 41.1308788759],
  "阜新": [121.660822129, 42.0192501071],
  "鞍山": [123.007763329, 41.1187436822],
  "重庆": [106.530635013, 29.5446061089],
  "咸阳": [108.707509278, 34.345372996],
  "商洛": [109.934208154, 33.8739073951],
  "安康": [109.038044563, 32.70437045],
  "宝鸡": [107.170645452, 34.3640808097],
  "延安": [109.500509757, 36.6033203523],
  "榆林": [109.745925744, 38.2794392401],
  "汉中": [107.045477629, 33.0815689782],
  "渭南": [109.483932697, 34.5023579758],
  "西安": [108.953098279, 34.2777998978],
  "铜川": [108.968067013, 34.9083676964],
  "果洛藏族自治州": [100.223722769, 34.4804845846],
  "海东地区": [102.085206987, 36.5176101677],
  "海北藏族自治州": [100.879802174, 36.9606541011],
  "海南藏族自治州": [100.624066094, 36.2843638038],
  "海西蒙古族藏族自治州": [97.3426254153, 37.3737990706],
  "玉树藏族自治州": [97.0133161374, 33.0062399097],
  "西宁": [101.76792099, 36.640738612],
  "黄南藏族自治州": [102.007600308, 35.5228515517],
  "九龙": [114.173291988, 22.3072458588],
  "新界": [114.146701965, 22.4274312754],
  "香港岛": [114.183870524, 22.2721034276],
  "七台河": [131.019048047, 45.7750053686],
  "伊春": [128.910765978, 47.7346850751],
  "佳木斯": [130.284734586, 46.8137796047],
  "双鸭山": [131.17140174, 46.6551020625],
  "哈尔滨": [126.657716855, 45.7732246332],
  "大兴安岭地区": [124.19610419, 51.991788968],
  "大庆": [125.02183973, 46.59670902],
  "牡丹江": [129.608035396, 44.5885211528],
  "绥化": [126.989094572, 46.646063927],
  "鸡西": [130.941767273, 45.3215398866],
  "鹤岗": [130.292472051, 47.3386659037],
  "黑河": [127.500830295, 50.2506900907],
  "齐齐哈尔": [123.987288942, 47.3476998134]
};
export default  defineComponent({
  name: "ThreeDemo",
  components: {
    Treeselect
  },
  setup() {
    const containerRef = ref(null);
    const state = reactive({
      lineColor: "#ffaa44", // 线颜色
      showClickDetails: false,
      showChosenObject: false,
      progress: 100,// 加载进度
      scene: {}, // 场景
      camera: {}, // 镜头
      orbitControl: null, // 镜头轴操控实例
      distance: 0, // 镜头距离
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
      earthBall: null, // 地球实例, 材质处理
      earthBallOriginTexture: null, // 地球实例，源材质
      earthTextureType: 1, // 选择的地球材质
      earthRadius: 200,// 地球半径
      kmlLine: null, // 中国行政区划边线
      kmlData: [], // 中国行政区划边线kml数据
      labelRenderer: null, // 2d标签图层
      mapPoints: [] // 空间坐标
    })
    // 创建场景
    const init = () => {
        // 创建场景 ------------------------------------------------------------------------------------
        const scene = new Scene();

        // 创建相机 ------------------------------------------------------------------------------------
        const camera = new PerspectiveCamera(75, containerRef.value.clientWidth/ containerRef.value.clientHeight,0.1,100000000); // 创建镜头

        camera.position.x = -100.45006406850166;
        camera.position.y = 171.01468125301236;
        camera.position.z = -313.93327233424606;

        const renderer = new WebGLRenderer({
          antialias: true,
          alpha: true
        }); // 创建容器);
        renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 2d图层渲染器
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = "0px";
        labelRenderer.domElement.style.left = "0px";
        labelRenderer.domElement.style.zIndex = 100;
        containerRef.value.appendChild(labelRenderer.domElement);

        // 添加坐标轴 ------------------------------------------------------------------------------------
        // const axis = new AxesHelper(50);
        // state.axis;
        // scene.add(axis);

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
        state.orbitControl.enableDamping = true; // 是否开启转动惯性
        state.orbitControl.enablePan = false; // 禁止移动相机
        state.orbitControl.maxDistance = 375; // 最远距离
        state.orbitControl.minDistance = 200; // 最近距离
        state.orbitControl.listenToKeyEvents(containerRef.value)
        state.orbitControl.rotateSpeed = 0.01
        state.orbitControl.zoomSpeed = 0.2

        // 镜头聚焦到场景原点
        camera.lookAt(scene.position);
       
        // 加载gltf模型（glb)  ------------------------------------------------------------------------------------
        // loafGLTF(state.models[state.currentModelIndex].config);

        // 监听点击
        // click();

        // 渲染结果 ------------------------------------------------------------------------------------
        function animate() {
          // if(state.rotationSpeed) scene.rotation.y += state.rotationSpeed * 0.001;
          renderer.render( scene, camera );
          labelRenderer.render( scene, camera);

          if(state.mixer) {
            const mixerUpdateDelta = state.clock.getDelta();
            // console.log(state.mixer);
            state.mixer.update && state.mixer.update( mixerUpdateDelta );
          }
          window.__camera = state.camera;
          state.orbitControl.update();
          state.distance = state.orbitControl.getDistance();
          // console.log(state.mapPoints);
          window.__mapPoints = state.mapPoints;
          state.mapPoints && state.mapPoints.length>0 && mapToScreenPosition(state.mapPoints[0].point)
          requestAnimationFrame( animate );
        };

        animate();
        state.scene = scene;
        state.renderer = renderer
        state.labelRenderer = labelRenderer
        state.camera = camera;

        // 创建天空
        initSky();  // three Sky实例
        // initCudeTextureSky(); // 贴图材质天空

        // 创建地面
        // 将平面添加到场景中
				// var plane = createPlaneGeometryBasicMaterial();
				// state.scene.add(plane);

        // 创建地球
        addEarth();
        addEarth2();
        // 加载Geojson
        addGeojson();
    }

    const mapToScreenPosition = (vector3) => {
      let vector = vector3.project(state.camera);
      let halfWidth = window.innerWidth / 2,
          halfHeight = window.innerHeight / 2;  
      const res = {
          x: Math.round(vector.x * halfWidth + halfWidth),
          y: Math.round(-vector.y * halfHeight + halfHeight)  
      }
      // console.log(vector);
      return res
    }

    // 创建材质贴图天空
    const initCudeTextureSky = () => {
      const { urls } = state.skyTexture[state.curSkyTextureIndex];
      const cubeLoader = new CubeTextureLoader();
      state.scene.background = cubeLoader.load(urls);
    }
    
    // 坐标转换
    function createPosition(lnglat) {
      let spherical = new Spherical
      spherical.radius = state.earthRadius;
      const lng = lnglat[0]
      const lat = lnglat[1]
      const theta = (lng + 90) * (Math.PI / 180)
      const phi = (90 - lat) * (Math.PI / 180)
      spherical.phi = phi; // phi是方位面（水平面）内的角度，范围0~360度
      spherical.theta = theta; // theta是俯仰面（竖直面）内的角度，范围0~180度
      let position = new Vector3()
      position.setFromSpherical(spherical)
      return position
    }

    // 加载geojson kml数据落图
    const addGeojson = async () => {
      const res = await api_getXmlData();
      if(res.code === 200) {
        // 获取kml数据
        const { data } =res;
        state.kmlData = data;
        drawKmlLine(data);
        addCities();
      }
    }
    
    // 城市标签
    const addCities = () => {
      state.mapPoints = Object.entries(cities).map(([key,value])=>{
        const point = createPosition(value);
        const pointLabel = createLableObj(key,point);
        state.scene.add(pointLabel);
        return {key,point};
      });
    }

    // 创建标签
    function createLableObj(text, vector) {
      let laberDiv = document.createElement('div');//创建div容器
      laberDiv.className = 'cityLabel';
      laberDiv.textContent = text;
      laberDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
      laberDiv.style.color = "rgba(255,255,125,0.9)"
      laberDiv.style.fontSize = "10px";
      laberDiv.style.padding = "2px 5px";
      laberDiv.style.borderRadius = "3px";
      laberDiv.style.cursor = "pointer";
      // laberDiv.style.backdropFilter = "blur(10px)";
      laberDiv.style.opacity = "0";
      laberDiv.style.border = "1px solid rgba(255,255,125,0.2)";
      laberDiv.onmouseover = (e)=>{
        laberDiv.style.backgroundColor = "rgba(255,255,125,1)";
        laberDiv.style.color = "rgba(0,0,0,1)";
        laberDiv.style.zIndex = "10000";
      }
      laberDiv.onmouseleave = (e)=>{
        laberDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
        laberDiv.style.color = "rgba(255,255,125,0.9)"
        laberDiv.style.zIndex = "999";
      }
      let pointLabel = new CSS2DObject(laberDiv);  

      pointLabel.position.set(vector.x, vector.y, vector.z);
      return pointLabel;
    }

    // 绘画kml数据
    const drawKmlLine = (data) => {
      data.map(v=>{
        v.polygons.map(async v2=>{
          const arr = [];
          const pointsObj = v2.coordinates.map(v3=>{
            const point = createPosition(v3);
            const {x,y,z} = point;
            arr.push(x);
            arr.push(y);
            arr.push(z);
            return point
          });
          const geometry = new BufferGeometry();
          geometry.setFromPoints( pointsObj );
          // const geometry = new LineGeometry();
          // geometry.setPositions(arr)
          const material = new LineBasicMaterial({
            color: new Color(state.lineColor),
            linewidth: 30,
            linecap: 'round', //ignored by WebGLRenderer
            linejoin: 'round' //ignored by WebGLRenderer
          });

          const uniforms = {
            amplitude: { value: 5.0 },
            opacity: { value: 0.3 },
            color: { value: new Color( 0xffffff ) }
          };

          const shaderMaterial = new ShaderMaterial( {
            uniforms: uniforms,
            // vertexShader: document.getElementById( 'vertexshader' ).textContent,
            // fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true
          } );

          const lineMaterial = new LineMaterial({
            color: new Color(state.lineColor),
            linewidth: 3,
          })


          state.kmlLine && state.scene.remove(state.kmlLine);
          await state.scene.remove(state.kmlLine);
          // const line = new Line2( geometry, shaderMaterial );
          const line = new Line(geometry,material)
          state.kmlLine = line;
          await state.scene.add( line );
          // console.log(points)
          // addPath(points);
        })
      })
    }

    // 创建地球 半径100
    function addEarth() {
      const { earthRadius } = state;
      const earthGeo = new SphereGeometry(earthRadius, 50, 50);
      const earthMater = new MeshPhongMaterial({
        map: new TextureLoader().load("/earthTexture/earth3.jpg"),
        // roughness: 0.9,
        // metalness: 0.3,
        transparent: true,
        depthWrite: false,
        side: FrontSide,
        // blending: AdditiveBlending,
        opacity: 0.5,
        color: 0x2222ff
      });
      const earthMesh = new Mesh(earthGeo, earthMater);
      state.earthBall = earthMesh;
      state.scene.add(earthMesh)
    }


    // 创建地球
    const addEarth2 = () => {
      const { earthRadius } = state;
      // 定义地球材质
      const textureLoader = new TextureLoader();
      // 创建地球
      const earthBall = new Mesh(new SphereGeometry(earthRadius, 50, 50), new MeshStandardMaterial({
        map: textureLoader.load("/earthTexture/earth3.jpg"),
        roughness: 0.5,
        metalness: 0.3,
      }));
      earthBall.layers.set(0);
      state.earthBallOriginTexture = earthBall
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
        state.labelRenderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    }

    // 切换天空类型
    watch(
      ()=>state.skyType,
      (n,o)=>{
        if(n==="0") {
          state.scene.remove(state.sky);
          initCudeTextureSky();
          return;
        }
        initSky();
      }
    )

    // 切换地球材质类型
    watch(
      ()=>state.earthTextureType,
      (n,o)=>{
        if(n==="0") {
          state.scene.remove(state.earthBall);
          state.scene.add(state.earthBallOriginTexture);
          return;
        }
        state.scene.remove(state.earthBallOriginTexture);
        state.scene.add(state.earthBall);
      }
    )

    // 监听天空材质切换
    watch(
      ()=>state.curSkyTextureIndex,
      (n,o) => {
        initCudeTextureSky()
      }
    )

    watch(
      ()=>containerRef.value,
      (newVal, oldVal)=>{
        if(newVal && newVal.clientWidth > 0) {
          init();
        }
      }
    );


    // 监听镜头距离远点距离，动态设置操控缩放、旋转速度，变化率为2次曲线
    watch(
      ()=>state.distance,
      (n,o)=>{
        const maxZoomSpeed = 2;
        const minZoomSpeed = 0.005;
        const maxRotateSpeed = 1;
        const minRotateSpeed = 0.001;
        const maxDistance = 375;
        const minDistance = 200;
        const distanceRate = (n-minDistance) / (maxDistance-minDistance)

        state.orbitControl.rotateSpeed = minRotateSpeed + (maxRotateSpeed-minRotateSpeed) * Math.pow(distanceRate,2)
        state.orbitControl.zoomSpeed = minZoomSpeed + (maxZoomSpeed-minZoomSpeed) * Math.pow(distanceRate,2);
        
        // 根据镜头距离显隐
        showHideCityLabels(1-Math.pow(distanceRate,3))
      }
    );

    const showHideCityLabels = (opacity) => {
      const cityLabels = document.getElementsByClassName("cityLabel");
      for(let i =0;i<cityLabels.length;i++) {
        cityLabels[i].style.opacity = opacity > 0 ? opacity : 0
      }
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

    // 加载点云压缩数据
    const loadGLTFbyDARACO = (config) => {
      state.progress = 0;
      DRACOLoader
      const {
          path,
          fileName,
          position,
          rotation,
          scale
      } = config;
      const modelloader = new GLTFLoader().setPath( path );
      modelloader.load(fileName, (obj)=>{
          if(state.gltfObjs.length>0) {
            state.gltfObjs.map(v=>{
              state.scene.remove(v.scene);
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
        // addPath(state.resPoints,state.lineColor);
        drawKmlLine(state.kmlData);
        // console.log(state.kmlLine);
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

    onMounted(async ()=>{
      window.addEventListener("resize",updateViewSize);
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
  overflow: scroll;
  position: relative;
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
.laber_name {
  color: #fff;
}
</style>