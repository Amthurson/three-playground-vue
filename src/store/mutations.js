export default {
	modelSet(state, data) {
		state.modelSet = data;
	},
	pageTitleSet(state, data) {
		state.pageTitle = data;
	},
	mapMethods(state, data) {
		state.mapMethods = data;
	},
	viewInfo(state, data) {
		state.viewInfo = data;
	},
	markerInfo(state, data) {
		state.markerInfo = data;
	},
	currentProjectIdSet(state, data) {
		state.currentProjectId = data;
	},
	mapInitFinish(state, data) {
		state.mapInitFinish = data;
	},
	popupInfo(state, data) {
		state.popupInfo = data;
	},
	setLayerControlState(state, data) {
		state.layerControlState = data;
	},
	fetchState(state, data) {
		state.fetchState = data;
	},
};
