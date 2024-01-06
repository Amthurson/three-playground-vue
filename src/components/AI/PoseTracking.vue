<template>
  <div class="container">
    <video ref="videoRef" class="input_video"></video>
    <canvas ref="poseMeshOutputRef" class="output_canvas"></canvas>
    <div v-show="isOpenPanel" class="control-panel" />
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, watch, ref } from "vue";
import {
  Pose,
  POSE_CONNECTIONS
} from "@mediapipe/pose";
import {
  ControlPanel,
  StaticText,
  Toggle,
  SourcePicker,
  Slider,
  FPS,
} from "@mediapipe/control_utils";
import { drawConnectors,drawLandmarks,lerp } from "@mediapipe/drawing_utils";

export default defineComponent({
  name: "FaceTracking",
  props: [
    'isOpenPanel', // 是否开启操控面板
    'solutionOptions' // API Config 文档：https://google.github.io/mediapipe/solutions/face_mesh#javascript-solution-api
  ],
  emits: [
    'onResult',
  ],
  setup(props, context) {
    const poseMeshOutputRef = ref(null);
    const videoRef = ref(null);
    const state = reactive({
      media: {},
      solutionOptions: props.solutionOptions || {
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8
      },
      isOpenPanel: props.isOpenPanel,
    });
    const onResults = (results) => {
      // console.log(results);
      // 处理结果数据分类
      const {poseLandmarks} = results;
      if(!results || !poseLandmarks) results;
      // 获取connection节点信息
      const detailsResult = [poseLandmarks].map(pose=>({
        poseConnectionsPoints: pose.length>0 ? POSE_CONNECTIONS.map(v=>[pose[v[0]],pose[v[1]]]) : [],
      }));
      context.emit("onResult",detailsResult);
      
      // 绘画结果
      const canvasElement = poseMeshOutputRef.value;
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
      const multiPoseLandMarks = [poseLandmarks];
      if (poseLandmarks) {
        for (let index = 0; index < multiPoseLandMarks.length; index++) {
          const landmarks = multiPoseLandMarks[index];
          drawConnectors(
              canvasCtx, landmarks, POSE_CONNECTIONS,
              '#FFFFaa');
          drawLandmarks(canvasCtx, landmarks, {
            color: '#FFFFFF',
            fillColor: '#FFaa00',
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
      const canvasElement = poseMeshOutputRef.value;
      const videoElement = videoRef.value;

      // start use mediapipe api
      const config = {
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      };
      const pose = new Pose(config);
      pose.setOptions(state.solutionOptions);
      pose.onResults(onResults);

      // Present a control panel through which the user can manipulate the solution
      // options.
      const controlsElement =
        document.getElementsByClassName("control-panel")[0];
      const fpsControl = new FPS();
      new ControlPanel(controlsElement, state.solutionOptions)
        .add([
          new StaticText({ title: "MediaPipe Face Mesh" }),
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
              await pose.send({ image: input });
            },
          }),
          new Slider({
            title: "Max Number of Faces",
            field: "maxNumFaces",
            range: [1, 4],
            step: 1,
          }),
          new Toggle({ title: "Refine Landmarks", field: "refineLandmarks" }),
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
          pose.setOptions(options);
        });
    };

    onMounted(async () => {
      await startTracking();
    });
    return {
      ...toRefs(state),
      poseMeshOutputRef,
      videoRef
    };
  },
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixin.scss";
.container {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  position: relative;
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