import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import globalVars from "../asset/globalVars.js";
import config from "../asset/config.js";

/**@extends HTMLDivElement */
export default class CharacterBtn {
	static #skeletonButton = null;
	/** @type { string } 武将id */
	name;
	/** @type { boolean } 是否为骨骼样式 */
	isSkeleton;
	/**
	 * @param { string } id 武将id
	 * @param { boolean } skeleton 是否渲染为骨架
	 */
	constructor(id, skeleton = true) {
		let button;
		if (skeleton && CharacterBtn.#skeletonButton) {
			button = CharacterBtn.#skeletonButton.cloneNode();
		} else {
			button = ui.create.button(id, 'character', false);
		}
		CharacterBtn.#skeletonButton = CharacterBtn.#skeletonButton || button.cloneNode();
		Object.setPrototypeOf(CharacterBtn.prototype, Object.getPrototypeOf(button));
		Object.setPrototypeOf(button, this);
		button.classList.add('item');
		button.name = id;
		if (skeleton) {
			button.isSkeleton = true;
			button.innerHTML = '';
			button.style.backgroundImage = '';
		} else {
			button.updateState();
		}
		return button;
	}
	updateState() {
		const id = this.name;
		if (globalVars.prohibitedList.includes(id)) {
			if (config.prohibitedType === 'prohibited') this.setTag();
			if (config.prohibitedType === 'fakeProhibited') this.setFakeTag();
		}
		if (config.prohibitedList.includes(id)) this.block();
	}
	loadData() {
		if (this.isSkeleton) {
			this.isSkeleton = false;
			const id = this.name;
			ui.create.button(id, 'character', false, false, this);
			Object.setPrototypeOf(this, CharacterBtn.prototype);
			this.updateState();
		}
	}
	//获取锁链样式元素
	getTag() {
		return this.querySelector('.tag');
	}
	//设置锁链样式元素
	setTag() {
		if (!this.getTag()) {
			ui.create.div('.tag', this);
		}
	}
	//获取伪禁样式元素
	getFakeTag() {
		return this.querySelector('.fake-tag');
	}
	//设置伪禁样式元素
	setFakeTag() {
		if (!this.getFakeTag()) {
			ui.create.div('.fake-tag', this);
		}
	}
	hasTag() {
		return Boolean(this.getTag() || this.getFakeTag());
	}
	autoSetTag() {
		if (this.hasTag()) return;
		if (config.isFakeProhibitedActive) {
			this.setFakeTag();
		}
		else this.setTag();
	}
	//取消选择样式
	unselect() {
		const tag = this.getTag() || this.getFakeTag();
		if (tag) this.removeChild(tag);
		// return true; // 成功取消
		// }
		// return false;
	}
	/** * @returns {boolean} 切换选择样式 */
	// toggleSelect() {
	// 	if (this.unselect()) {
	// 		return false;
	// 	} else {
	// 		this.autoSetTag();
	// 		return true;
	// 	}
	// }
	//获取选择样式元素
	getBlock() {
		return this.querySelector('.isselected');
	}
	//设置已被选择样式（小黑屋）
	block() {
		if (this.getBlock()) return;
		const selected = ui.create.div('.isselected');
		this.insertBefore(selected, this.firstElementChild);
	}
	//设置取消已被选择样式（移除小黑屋）
	unblock() {
		const block = this.getBlock();
		if (block) this.removeChild(block);
	}
	//自动加入小黑屋
	autoToggleBlock() {
		if (this.hasTag()) this.block();
		else this.unblock();
	}
}

