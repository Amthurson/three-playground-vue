<template>
	<div
		ref="ItemRef"
		class="item"
		draggable="true"
		@drag="handleDragItem"
		@dragend="handleDragItem"
		@dragenter="handleEnter"
		@dragleave="handleLeave"
		@dragStart="handleDragStart"
		@mousedown="handleMouseDown"
		@touchstart="handleMouseDown"
		@touchmove="handleDragItem"
		@touchend="handleDragItem"
	>
		<slot></slot>
	</div>
</template>

<script>
import cimMap from './cim.map';
import { defineComponent, reactive, toRefs, ref, watch, onMounted, onUnmounted } from 'vue';

export default defineComponent({
	name: 'RelationGraphItem',
	props: [
		'width',
		'height',
		'hasBounded',
		'x',
		'y',
		'framePos',
		'offsetPos',
		'zIndex',
		'containerParams',
		'resourceType',
		'index',
	],
	emits: ['handleDrag'],
	setup(props, context) {
		const ItemRef = ref(null);
		const ContainerRef = ref(null);
		const state = reactive({
			containerParams: {},
			mouseStartPos: {
				x: 0,
				y: 0,
			},
			curItemPos: {
				x: 0,
				y: 0,
			},
			offset: {
				x: 0,
				y: 0,
			},
			lastPos: null,
		});

		watch(
			() => props.zIndex,
			(n, o) => {
				ItemRef.value.style.zIndex = n || 'unset';
			}
		);

		const setPos = async (x, y) => {
			try {
				if (ItemRef.value?.style) {
					ItemRef.value.style.left = x + 'px';
					ItemRef.value.style.top = y + 'px';
				}
				state.mouseStartPos = state.curItemPos = { x, y };
				context.emit('handleDrag', {
					x,
					y,
					index: props.index,
					type: 'reset',
				});
			} catch (err) {
				console.log(err);
			}
		};

		const setFrame = async () => {
			const { width, height, containerParams, framePos } = props;
			let x = framePos ? framePos.x : props.x;
			let y = framePos ? framePos.y : props.y;
			let resourceType = framePos ? framePos.spatialReference : props.resourceType;
			state.containerParams = containerParams;
			ItemRef.value.style.width = width + 'px';
			ItemRef.value.style.height = height + 'px';
			let pos = { x, y };
			if (typeof resourceType !== 'undefined') {
				const FdPos = resourceType === '飞渡' ? pos : await transPos(x, y, resourceType);
				state.lastPos = FdPos;
				if (!Number.isNaN(+x)) {
					pos = await cimMap.pointToScreen(FdPos.x, FdPos.y);
					console.log(FdPos, pos, '123123');
					await setPos(pos.x, pos.y);
				}
			} else {
				const newMapPoint = await cimMap.mapToScreen(pos.x, pos.y);
				await setPos(pos.x, pos.y);
			}
		};

		const resetPos = async e => {
			try {
				if (state.lastPos) {
					const { x, y } = state.lastPos;
					const pos = await cimMap.pointToScreen(x, y);
					await setPos(pos.x, pos.y);
				} else {
					setFrame();
				}
			} catch (error) {
				console.log(state.lastPos, error, 'lastPos');
			}
		};

		const hViewResize = (() => {
			let timer;
			return () => {
				ItemRef.value.style.visibility = 'hidden';
				clearTimeout(timer);
				timer = setTimeout(() => {
					resetPos(null);
					ItemRef.value.style.visibility = '';
				}, 300);
			};
		})();

		onMounted(async () => {
			await setFrame();
			window.addEventListener('view-camera', e => resetPos(e));
			window.addEventListener('view-resize', e => resetPos(e));
		});

		onUnmounted(() => {
			window.removeEventListener('view-camera', e => resetPos(e));
			window.removeEventListener('view-resize', e => resetPos(e));
		});

		// 坐标装换（奥格坐标转换）
		const transPos = async (x, y, resourceType) => {
			[x, y] = await cimMap.toCurrSpatialReference([x, y], resourceType || '百度');
			return { x, y };
		};

		// 拖拽
		const handleDragItem = async e => {
			const { cw, ch, ct, cl } = state.containerParams;
			const { hasBounded } = props;
			const { x, y } = state.offset;
			const iw = props.width;
			const ih = props.height;
			const box = {
				top: ct,
				left: cl,
				right: cw + cl - iw,
				bottom: ch + ct - ih,
			};
			const curItemPos =
				typeof hasBounded !== 'undefined' || hasBounded
					? {
							x: e.clientX < box.left ? box.left : e.clientX > box.right ? box.right : e.clientX - x,
							y: e.clientY < box.top ? box.top : e.clientY > box.bottom ? box.bottom : e.clientY - y,
					  }
					: {
							x: e.clientX - x,
							y: e.clientY - y,
					  };
			state.curItemPos = curItemPos;
			ItemRef.value.style.top = curItemPos.y + 'px';
			ItemRef.value.style.left = curItemPos.x + 'px';
			context.emit('handleDrag', {
				...curItemPos,
				index: props.index,
				type: 'drag',
			});
			const newMapPoint = await cimMap.mapToScreen(curItemPos.x, curItemPos.y);
			if (newMapPoint) {
				const { x, y } = newMapPoint;
				state.lastPos = { x, y };
			}
			return false;
		};

		const handleEnter = e => {
			ItemRef.value.style.background = 'linear-gradient(225deg, #ffc54d, #e0a641)';
		};

		const handleLeave = e => {
			// ItemRef.value.style.background = 'linear-gradient(225deg, #89c4ff, #73a5e6)';
			ItemRef.value.style.background = '';
		};
		const handleDragStart = e => {
			// console.log(e, 'start');
		};
		const handleMouseDown = e => {
			const { clientX: x, clientY: y } = e;
			state.offset = {
				x: x - state.curItemPos.x,
				y: y - state.curItemPos.y,
			};
			state.mouseStartPos = { x, y };
			// console.log(state);
		};
		return {
			ContainerRef,
			ItemRef,
			handleDragItem,
			handleEnter,
			handleDragStart,
			handleMouseDown,
			...toRefs(state),
			handleLeave,
		};
	},
});
</script>

<style scoped lang="scss">
.item {
	// transition: 0.05s all ease-in-out;
	pointer-events: all;
	position: fixed;
	top: 0;
	left: 0;
	width: 100px;
	height: 100px;
	cursor: grab;
}
</style>
