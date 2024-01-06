export default {
	modelSet({ commit }, data) {
		commit('modelSet', data);
	},
	pageTitleSet({ commit }, data) {
		commit('pageTitleSet', data);
	},
	mapMethods({ commit }, data) {
		commit('mapMethods', data);
	},
	viewInfo({ commit }, data) {
		commit('viewInfo', data);
	},
	markerInfo({ commit }, data) {
		commit('markerInfo', data);
	},
	currentProjectIdSet({ commit }, data) {
		commit('currentProjectIdSet', data);
	},
	mapInitFinish({ commit }, data) {
		commit('mapInitFinish', data);
	},
	popupInfo({ commit }, data) {
		commit('popupInfo', data);
	},
	setLayerControlState({ commit }, data) {
		commit('layerControlState', data);
	},
	fetchState({ commit }, data) {
		commit('fetchState', data);
	},
};
