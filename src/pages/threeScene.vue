<template>
  <div class="container">
    <div class="item">
      <ThreeWorld />
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, reactive, toRefs } from "vue";
import ThreeWorld from "@/components/ThreeWorld.vue";
export default defineComponent({
  name: "Demo",
  components: {
      ThreeWorld
  },
  setup(props,context) {
    const state = reactive({
      results: {},
    });
    onMounted(()=>{
        
    })
   
    return {
      ...toRefs(state),
    }
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixin.scss";
.container {
  width: 100%;
  height: 100%;
}
</style>