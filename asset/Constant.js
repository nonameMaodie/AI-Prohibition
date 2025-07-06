export default class Constant {
	static maxZoom = 1.8;
	static minZoom = 1.0;
	static get zoomRange() {
		return Constant.maxZoom - Constant.minZoom;
	}
}
