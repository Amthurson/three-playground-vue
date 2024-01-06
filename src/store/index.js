import { createStore, useStore as baseUseStore } from 'vuex';

import actions from './actions';
import mutations from './mutations';

const defaultState = {
	modelSet: true, // 模型操控
	mapInitFinish: false, // 地图加载状态 true: 地图加载完成
	mapMethods: {
		methods: '',
		params: {},
	},
	viewInfo: {},
	markerInfo: {}, // 点击mark tag信息
	currentProjectId: '', // 当前选中项目Id
	popupInfo: {
		show: false, // 弹窗显示状态
		type: 'basic', // 弹窗类型
		data: {}, // 弹窗信息
		option: {
			noblur: false, // 是否不开启毛玻璃 默认开启
		}, // 额外附加信息
	}, // 弹窗状态及数据
	layerControlState: {}, // 图层控制操作状态
	fetchState: false, //接口请求状态
};

// 定义 injection key
export const key = Symbol();

// 创建一个新的 store 实例
export const store = createStore({
	state() {
		return defaultState;
	},
	actions,
	mutations,
});

// 定义自己的 `useStore` 组合式函数
export default function useStore() {
	return baseUseStore(key);
}
