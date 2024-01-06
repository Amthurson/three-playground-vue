<template>
  <div ref="containerRef" class="container">
    <video class="input_video"></video>
    <canvas ref="handsOutputRef" class="output_canvas"></canvas>
    <div v-show="isOpenPanel" class="control-panel" />
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, watch, ref } from "vue";
import {
  Hands,
  HAND_CONNECTIONS
} from "@mediapipe/hands";
import {
  ControlPanel,
  StaticText,
  Toggle,
  SourcePicker,
  Slider,
  FPS,
} from "@mediapipe/control_utils";
import { drawConnectors,drawLandmarks,lerp } from "@mediapipe/drawing_utils";
import { Camera } from '@mediapipe/camera_utils'
export default defineComponent({
  name: "HandsTracking",
  props: [
    'isOpenPanel', // 是否开启操控面板
    'solutionOptions' // API Config 文档：https://google.github.io/mediapipe/solutions/hands#javascript-solution-api
  ],
  emits: [
    'onResult',
  ],
  setup(props, context) {
    const containerRef = ref(null);
    const handsOutputRef = ref(null);
    const state = reactive({
      media: {},
      solutionOptions: props.solutionOptions || { // mediapipe 计算配置
        selfieMode: true, // 是否自拍
        maxNumHands: 3, // 最大手数量检测数
        modelComplexity: 0, // 模型复杂选项 0、1
        minDetectionConfidence: 0.8, // 最小检测置信度
        minTrackingConfidence: 0.8, // 最小跟踪置信度
      },
      isOpenPanel: typeof props.isOpenPanel !== "undefined" ? props.isOpenPanel : true
    });
    const onResults = (results) => {
      // 处理结果数据分类
      const {multiHandLandmarks} = results;
      if(multiHandLandmarks && multiHandLandmarks.length>0) {
        const detailsResult = multiHandLandmarks.map(hands=>({
          handConnectionsPoints: hands.length>0 ? HAND_CONNECTIONS.map(v=>[hands[v[0]],hands[v[1]]]) : [],
        }));
        context.emit("onResult",detailsResult);
      }
      // const canvasElement = document.getElementsByClassName("output_canvas")[0];
      const canvasElement = handsOutputRef.value;
      const canvasCtx = canvasElement.getContext("2d");

      // Draw the overlays.
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      if (results.multiHandLandmarks && results.multiHandedness) {
        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
          const classification = results.multiHandedness[index];
          const isRightHand = classification.label === 'Right';
          const landmarks = results.multiHandLandmarks[index];
          drawConnectors(
              canvasCtx, landmarks, HAND_CONNECTIONS,
              {color: isRightHand ? '#00FF00' : '#FF0000'});
          drawLandmarks(canvasCtx, landmarks, {
            color: isRightHand ? '#00FF00' : '#FF0000',
            fillColor: isRightHand ? '#FF0000' : '#00FF00',
            radius: (data) => {
              if(data.from.z) {
                return lerp(data.from.z, -0.15, .1, 10, 1);
              }
            }
          });
        }
      }
      canvasCtx.restore();
    };

    const startTracking = async () => {
      const canvasElement = handsOutputRef.value;
      const videoElement = document.getElementsByClassName("input_video")[0];

      // start use mediapipe api
      const config = {
        locateFile: (file) => {
          // return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`; // yolov训练好的网络配置
          return `${import.meta.env.VITE_BASE_API}/mediapipe/hands@0.4.1646424915/${file}`;
        },
      };
      const hands = new Hands(config);
      hands.setOptions(state.solutionOptions);
      hands.onResults(onResults);

      // Present a control panel through which the user can manipulate the solution
      // options.
      const controlsElement =
        document.getElementsByClassName("control-panel")[0];
      const fpsControl = new FPS();
      new ControlPanel(controlsElement, state.solutionOptions)
        .add([
          new StaticText({ title: "MediaPipe Hands" }),
          fpsControl,
          new Toggle({ title: "Selfie Mode", field: "selfieMode" }),
          new SourcePicker({
            onFrame: async (input, size) => {
              const aspect = size.height / size.width;
              let width, height;
              if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
              } else {
                width = window.innerWidth;
                height = width * aspect;
              }
              canvasElement.width = width;
              canvasElement.height = height;
              await hands.send({ image: input });
            },
          }),
          new Slider({
            title: "Max Number of Hands",
            field: "maxNumHands",
            range: [1, 4],
            step: 1,
          }),
          new Toggle({ title: "Model Complexity", field: "modelComplexity" }),
          new Slider({
            title: "Min Detection Confidence",
            field: "minDetectionConfidence",
            range: [0, 1],
            step: 0.01,
          }),
          new Slider({
            title: "Min Tracking Confidence",
            field: "minTrackingConfidence",
            range: [0, 1],
            step: 0.01,
          }),
        ])
        .on((x) => {
          const options = x;
          videoElement.classList.toggle("selfie", options.selfieMode);
          hands.setOptions(options);
        });

        // use camera utils
        // const camera = new Camera(videoElement, {
        //   onFrame: async () => {
        //     await hands.send({image: videoElement});
        //   },
        //   facingMode: 'enviorment',
        //   width: containerRef.value.width,
        //   height: containerRef.value.height
        // });
        // camera.start();
    };

    onMounted(async () => {
      await startTracking()
    });
    return {
      ...toRefs(state),
      handsOutputRef,
      containerRef
    };
  },
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixin.scss";
.container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: scroll;
  @include flexRowCenter();
  .input_video {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .output_canvas {
    width: 100%;
    height: 100%;
  }
  .control-panel {
    position: absolute;
    left: 10px;
    top: 10px;
  }
}
</style>