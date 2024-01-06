import fdPlayer from 'fdplayer';

const addedIds: string[] = [];

export default fdPlayer.apiProxy({
	// toCurrSpatialReference: (coordinates: number[] | number[][], resourceType) =>
	// 	__g.coord.toCurrSpatialReference(coordinates, resourceType),
	// pointToScreen: (x, y) => {
	// 	return view.toScreen({
	// 		x,
	// 		y,
	// 		type: 'point',
	// 		spatialReference: view.spatialReference,
	// 	});
	// },
	// mapToScreen: (x, y) => {
	// 	return view.toMap({
	// 		x,
	// 		y,
	// 		spatialReference: view.spatialReference,
	// 	});
	// },
	// addPolyline: (id: string, coordinates) => {
	// 	__g.polyline.add({
	// 		id,
	// 		color: [146, 206, 254],
	// 		style: 1,
	// 		thickness: 4,
	// 		coordinates,
	// 	});
	// 	__g.polyline.focus(id);
	// 	addedIds.push(id);
	// },
	// delPolyline: (ids?: string | string[]) => {
	// 	__g.common.remove(ids || addedIds);
	// },
	// resetCamera: () => __g.common.setGZCam(),
});
