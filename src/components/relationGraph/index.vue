<template>
	<div ref="ContainerRef" class="container">
		<slot name="content">
			<RelationGraphItem
				v-for="(item, i) in list"
				:key="i"
				:width="item.width"
				:height="item.height"
				:x="item.x"
				:y="item.y"
				:containerParams="item.containerParams"
				:index="i"
				@handleDrag="handleDrag"
			>
				<slot name="item"></slot>
			</RelationGraphItem>
		</slot>
		<template v-if="showLine">
			<svg width="100%" height="100%">
				<line
					v-for="(item, i) in list"
					:key="`line${i}`"
					:x1="item.x - item.width / 2"
					:y1="item.y - item.height / 2"
					:x2="item.x - item.width / 2 + (item.curPos.x - item.x) * 0.1"
					:y2="item.curPos.y - item.height / 2"
					stroke="#FF9626"
				></line>
				<line
					v-for="(item, i) in list"
					:key="`line${i}`"
					:x1="item.x - item.width / 2 + (item.curPos.x - item.x) * 0.1"
					:y1="item.curPos.y - item.height / 2"
					:x2="item.curPos.x - item.width / 2"
					:y2="item.curPos.y - item.height / 2"
					stroke="#FF9626"
				></line>
				<defs>
					<filter id="f3" x="-120%" y="-120%" width="400%" height="400%">
						<feGaussianBlur result="blurOut" in="offOut" stdDeviation="10"></feGaussianBlur>
						<feBlend in="SourceGraphic" in2="blurOut" mode="multiply"></feBlend>
					</filter>
					<linearGradient id="stroke" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="600" y2="200">
						<stop offset="0" style="stop-color: #ff9626"></stop>
						<stop offset="0.5" style="stop-color: #ff9626"></stop>
						<stop offset="1" style="stop-color: #ff9626"></stop>
					</linearGradient>
				</defs>
				<circle
					v-for="(item, i) in list"
					:key="`line${i}`"
					:cx="item.x - item.width / 2"
					:cy="item.y - item.height / 2"
					r="6"
					fill="url(#stroke)"
					style="stroke-width: 16px; stroke: rgba(255, 150, 38, 0.3)"
					filter="url(#f3)"
				></circle>
			</svg>
		</template>
	</div>
</template>

<script>
import { defineComponent, reactive, toRefs, ref, watch, onMounted } from 'vue';
import RelationGraphItem from './item.vue';

export default defineComponent({
	name: 'RelationGraph',
	props: ['width', 'height', 'x', 'y', 'showLine', 'list'],
	components: {
		RelationGraphItem,
	},
	setup(props, context) {
		const ContainerRef = ref(null);
		const state = reactive({
			list: props.list || [],
		});

		onMounted(async () => {
			ContainerRef.value.style.width = props.width + 'px';
			ContainerRef.value.style.height = props.height + 'px';
			ContainerRef.value.style.left = props.x + 'px';
			ContainerRef.value.style.top = props.y + 'px';
			if (props.showLine) {
				state.list = props.list;
				state.list.map(v => ({
					...v,
					containerParams: {
						cw: props.width,
						ch: props.height,
						ct: props.y,
						cl: props.x,
					},
				}));
			}
		});

		const handleDrag = pos => {
			if (props.showLine) {
				const { x, y, index } = pos;
				state.list[index].curPos = { x, y };
			}
		};

		return {
			ContainerRef,
			handleDrag,
			...toRefs(state),
		};
	},
});
</script>

<style scoped lang="scss">
.container {
	pointer-events: none;
	position: fixed;
	width: 500px;
	height: 500px;
	left: 0;
	top: 0;
	.line {
		position: fixed;
		// border: 1px dashed #fff;
		min-height: 6px;
		min-width: 6px;
	}
}
</style>
