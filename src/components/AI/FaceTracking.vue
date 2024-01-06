<template>
  <div class="container">
    <video ref="videoRef" class="input_video"></video>
    <canvas ref="faseMeshOutputRef" class="output_canvas"></canvas>
    <div v-show="isOpenPanel" class="control-panel" />
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs, watch, ref } from "vue";
import {
  FaceMesh,
  FACEMESH_TESSELATION,
  FACEMESH_RIGHT_EYE,
  FACEMESH_RIGHT_EYEBROW,
  FACEMESH_LEFT_EYE,
  FACEMESH_LEFT_EYEBROW,
  FACEMESH_FACE_OVAL,
  FACEMESH_LIPS,
  FACEMESH_RIGHT_IRIS,
  FACEMESH_LEFT_IRIS,
} from "@mediapipe/face_mesh";
import {
  ControlPanel,
  StaticText,
  Toggle,
  SourcePicker,
  Slider,
  FPS,
} from "@mediapipe/control_utils";
import { drawConnectors } from "@mediapipe/drawing_utils";

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
    const faseMeshOutputRef = ref(null);
    const videoRef = ref(null);
    const state = reactive({
      media: {},
      solutionOptions: props.solutionOptions || { // mediapipe 计算配置
        selfieMode: true, // 是否自拍
        enableFaceGeometry: true, // 是否开启几何网格
        maxNumFaces: 3, // 最大面部检查数
        refineLandmarks: false, // 重新寻找面部
        minDetectionConfidence: 0.8, // 最小检测置信度
        minTrackingConfidence: 0.8, // 最小跟踪置信度
      },
      isOpenPanel: props.isOpenPanel,
    });
    const onResults = (results) => {
      // 处理结果数据分类
      const {multiFaceLandmarks} = results;
      if(multiFaceLandmarks && multiFaceLandmarks.length>0) {
        const detailsResult = multiFaceLandmarks.map(face=>({
          tesselationPoints: face.length>0 ? FACEMESH_TESSELATION.map(v=>[face[v[0]],face[v[1]]]) : [],
          rightEyePoints: face.length>0 ? FACEMESH_RIGHT_EYE.map(v=>[face[v[0]],face[v[1]]]):[],
          rightEyebowPoints: face.length>0 ? FACEMESH_RIGHT_EYEBROW.map(v=>[face[v[0]],face[v[1]]]):[],
          leftEyePoints: face.length>0 ? FACEMESH_LEFT_EYE.map(v=>[face[v[0]],face[v[1]]]):[],
          leftEyebowPoints: face.length>0 ? FACEMESH_LEFT_EYEBROW.map(v=>[face[v[0]],face[v[1]]]):[],
          faceOvalPoints: face.length>0 ? FACEMESH_FACE_OVAL.map(v=>[face[v[0]],face[v[1]]]):[],
          lipsPoints: face.length>0 ? FACEMESH_LIPS.map(v=>[face[v[0]],face[v[1]]]):[],
          rightIrisPoints: face.length>0 ? FACEMESH_RIGHT_IRIS.map(v=>[face[v[0]],face[v[1]]]):[],
          leftIrisPoints: face.length>0 ? FACEMESH_LEFT_IRIS.map(v=>[face[v[0]],face[v[1]]]):[],
        }));
        context.emit("onResult",detailsResult);
      }
      // const canvasElement = document.getElementsByClassName("output_canvas")[0];
      const canvasElement = faseMeshOutputRef.value;
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
      if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
            color: "#C0C0C070",
            lineWidth: 1,
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
            color: "#FF3030",
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {
            color: "#ffff55",
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
            color: "rgba(12,44,229)",
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {
            color: "#30FF30",
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
            color: "#ffffff",
          });
          drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
            color: "#f27322",
          });
          if (state.solutionOptions.refineLandmarks) {
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_IRIS, {
              color: "#EF00FF",
            });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_IRIS, {
              color: "#30FF30",
            });
          }
        }
      }
      canvasCtx.restore();
    };

    const startTracking = async () => {
      // const canvasElement = document.getElementsByClassName("output_canvas")[0];
      const canvasElement = faseMeshOutputRef.value;
      // const videoElement = document.getElementsByClassName("input_video")[0];
      const videoElement = videoRef.value;

      // start use mediapipe api
      const config = {
        locateFile: (file) => {
          // return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`; // 关键点：yolov训练好的网络配置
          return `${import.meta.env.VITE_BASE_API}/mediapipe/face_mesh@0.4.1633559619/${file}`;
        },
      };
      const faceMesh = new FaceMesh(config);
      faceMesh.setOptions(state.solutionOptions);
      faceMesh.onResults(onResults);

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
              await faceMesh.send({ image: input });
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
          faceMesh.setOptions(options);
        });
    };

    onMounted(async () => {
      await startTracking();
    });
    return {
      ...toRefs(state),
      faseMeshOutputRef,
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