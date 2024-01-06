import { createRouter, createWebHistory } from 'vue-router';

const routes = [
	{ path: '/:pathMatch(.*)*', component: () => import('@/pages/errorPages/404.vue') },
	{
		path: '/',
		redirect: '/three',
	},
	{
		path: '/index',
		name: 'index',
		component: () => import('@/pages/threeScene.vue'),
	},
	{
		path: '/three',
		name: 'Threejs World',
		component: () => import('@/layout/index.vue'),
		children: [
			{
				path: '/three/cargoDemo',
				name: '仓库DEMO',
				component: ()=>import('@/pages/cargoDemo.vue')
			},
			{
				path: '/three/sky-floor',
				name: '天空、阳光、地表材质',
				component: ()=>import('@/pages/skyFloor.vue')
			},
			{
				path: '/three/earth',
				name: '地球',
				component: ()=>import('@/pages/earth.vue')
			},
			{
				path: '/three/map',
				name: 'WebGIS实现',
				component: ()=>import('@/pages/map.vue')
			},
			{
				path: '/three/models',
				name: '模型渲染',
				component: ()=>import('@/pages/models.vue')
			},
			{
				path: '/three/function-geometry',
				name: '函数可视化',
				component: ()=>import('@/pages/functionGeometry.vue')
			},
			{
				path: '/three/NURBSSurface',
				name: 'NURBS曲面',
				component: ()=>import('@/pages/NURBSSurface.vue')
			},
			{
				path: '/three/face-detech-model',
				name: 'AI面部实时建模',
				component: ()=>import('@/pages/FaceDetechModel.vue')
			},
			{
				path: '/three/hand-track-interact',
				name: '手势识别Three场景交互',
				component: ()=>import('@/pages/handTrackInteract.vue')
			},
			{
				path: '/three/pose-track-interact',
				name: 'pose识别Three场景交互',
				component: ()=>import('@/pages/poseTrackInteract.vue')
			},
			{
				path: '/three/fiirst-person-walk',
				name: '第一人称平地视角',
				component: ()=>import('@/pages/Controls/firstPersonWalk.vue')
			},
			{
				path: '/three/fiirst-person-free',
				name: '第一人称自由视角',
				component: ()=>import('@/pages/Controls/firstPersonFree.vue')
			},
			{
				path: '/three/third-person-static',
				name: '第三人称视角',
				component: ()=>import('@/pages/Controls/thirdPersonByClick.vue')
			},
		]
	},
	{
		path: '/amap',
		name: 'amap',
		component: () => import('@/components/AMapWithThree.vue'),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});


router.beforeEach((to, from, next) => {
	next();
});

router.afterEach((to, from, failer) => {

});

export default router;
