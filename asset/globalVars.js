import { lib, game, ui, get, ai, _status } from "../../../noname.js";

class GlobalVars {
	/** @type {Selector} */
	selector = null;
	/** @type {SelectorController} */
	controller = null;
	/** @type {SelectorModel} */
	model = null;
	/** 
	 * 判断是否为本体或其他扩展的禁将
	 * @type {function} */
	forbidai_savedFilter = null;
	/**
	 * 当前记录的禁用列表
	 * @type {string[]}
	 */
	prohibitedList = [];
	/** 
	* 当前仅点将禁将细分名
	* @type {'default'}*/
	prohibitedMode = 'default';
	/** 
	* 当前伪禁将细分名
	* @type {'default'|'identity_zhu'|'identity_zhong'|'identity_fan'|'identity_nei'|'doudizhu_1'|'doudizhu_2'|'doudizhu_3'|'versus_two_1'|'versus_two_2'|'versus_two_3'|'versus_two_4'}*/
	fakeProhibitedMode = 'default';
	/**
	 * 是否收起了高级违禁列表
	 *  @type {boolean} */
	isAFPHidden = true;

	get uiZoom() {
		return (+game.documentZoom || 1) / (+game.deviceZoom || 1);
	}

	/**
	 * 防抖函数，返回一个 Promise，在 func 执行完成后 resolve
	 * @param {Function} func 要执行的函数
	 * @param {number} delay 延迟时间，默认 200ms
	 * @param {boolean} immediate 是否立即执行（首次触发即执行）
	 * @returns {Function} 包裹后的防抖函数，调用时返回一个 Promise
	 */
	debounce(func, delay = 200, immediate = false) {
		let timer;

		return function (...args) {
			const context = this;

			return new Promise((resolve) => {
				if (timer) clearTimeout(timer);

				if (immediate && !timer) {
					const result = func.apply(context, args);
					timer = setTimeout(() => {
						timer = null;
						resolve(result);
					}, delay);
					return;
				}

				timer = setTimeout(() => {
					const result = func.apply(context, args);
					timer = null;
					resolve(result);
				}, delay);
			});
		};
	}
}

window.gl = new GlobalVars();
export default window.gl;

// export default new GlobalVars();
