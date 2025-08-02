import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import globalVars from "../asset/globalVars.js";
import utils from "../asset/utils.js";
import config from "../asset/config.js";
import Popup from "../view/Popup/index.js";
import Help from "../view/Popup/Help.js";
import Plans from "../view/Popup/Plans.js";
import Setup from "../view/Popup/Setup.js";
import Constant from "../asset/Constant.js";
import Toast from "../view/Toast.js";

export default class SelectorController {
	/** * @type { number } 定时任务的id */
	#timeId1;
	#timeId2;
	#timeId3;
	/** * @type { boolean } 是否处于搜索框的搜索状态下 */
	isSearching;
	/** * @type { boolean } 若为true，则在等待键盘抬起 */
	awaitKeyup;
	/** * @type { "showSystem" | undefined } */
	onClose
	/** * @type { Array } 用于记录窗口事件并禁用，关闭时恢复 */
	recordEvent = [];
	constructor() {
		globalVars.controller = this;
	}
	/**
	 * @param { "showSystem" | undefined } onClose 
	 */
	openSelector(onClose) {
		this.addProhibitedEvent(window, 'onkeydown');
		this.addProhibitedEvent(lib.config, 'swipe');
		window.onkeydown = this.onKeydownWindow.bind(this);
		this.onClose = onClose;
		globalVars.selector.open();
	}
	onKeydownWindow(event) {
		const key = event.key.toLowerCase();
		if (!event.ctrlKey && !event.metaKey) {
			switch (key) {
				case 'f1': {
					this.onClickHelpBtn();
					break;
				}
				case 'escape':
				case 'esc': {
					if (!(globalVars.selector.lastElementChild instanceof Popup)) {
						this.onClickCloseBtn();
					}
					break;
				}
			}
		} else {
			switch (key) {
				case 'a': {
					const target = globalVars.selector.node.selectAll;
					this.onClickSelectAllBtn(target);
					break;
				}
				case 'f': {
					globalVars.selector.node.searchInput.focus();
					break;
				}
				case 's': {
					this.onClickCharConfirmBtn();
					break;
				}
				case 'j': {
					const target = globalVars.selector.node.charSelectedBtn;
					this.onClickCharSelectedBtn(target);
					break;
				}
				case 'h': {
					this.onClickHelpBtn();
					break;
				}
				case 't': {
					this.onClickSetUpBtn();
					break;
				}
				case 'b': {
					this.onClickInverseBtn();
					break;
				}
				case 'control': {
					if (this.awaitKeyup) return;
					this.awaitKeyup = true;
					const handleMousewheel = (e) => {
						if (!e.ctrlKey) return;
						const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
						let zoom = +getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
						const max = Constant.maxZoom / globalVars.uiZoom, min = Constant.minZoom / globalVars.uiZoom;
						zoom = delta > 0 ? Math.min(max, zoom + 0.08) : Math.max(min, zoom - 0.08);
						document.documentElement.style.setProperty('--sl-layout-zoom', zoom);
						config.zoom = zoom * globalVars.uiZoom;
						config.save();
					};
					const handleKeyup = (e) => {
						if (e.key.toLowerCase() !== 'control') return;
						this.awaitKeyup = false;
						window.removeEventListener('mousewheel', handleMousewheel);
					};
					window.addEventListener('mousewheel', handleMousewheel);
					window.addEventListener('keyup', handleKeyup, { once: true });
					break;
				}
			}
		}
	}
	onClickSelectChooseBtn(target, event) {
		utils.playAudio('click1');
		if (target.classList.toggle('active'));
		if (event.target.matches('.select-content span')) {
			const methodSpan = target.querySelector('.method>span');
			if (config.currentActiveMode === event.target.innerText) return;
			methodSpan.textContent = event.target.innerText;
			config.currentActiveMode = event.target.innerText;
			globalVars.selector.renderPackCategories();
		}
	}
	onClickHelpBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Help(globalVars.selector);
	}
	onClickSelectAllBtn(target, event) {
		if (event) utils.playAudio('click2');
		if (target.classList.toggle('active')) {
			target.textContent = '全不选';
			globalVars.selector.allButtons.forEach(btn => {
				this.handleCharBtnSelect(btn);
			});
		} else {
			target.textContent = '全选';
			globalVars.selector.allButtons.forEach(btn => {
				this.handleCharBtnUnselect(btn);
			});
		}
	}
	autoToggleSelectAllBtn = globalVars.debounce(function () {
		const { selectAll } = globalVars.selector.node;
		if (globalVars.selector.displayedCharsId.every(id => globalVars.prohibitedList.includes(id))) {
			if (!selectAll.classList.contains('active')) {
				selectAll.classList.add('active');
				selectAll.textContent = '全不选';
			}
		} else {
			if (selectAll.classList.contains('active')) {
				selectAll.classList.remove('active');
				selectAll.textContent = '全选';
			}
		}
	}, 30)
	onClickInverseBtn(target, event) {
		if (event) utils.playAudio('click2');
		globalVars.selector.allButtons.forEach(btn => {
			this.handleCharBtnToggleSelect(btn);
		});
	}
	onClickPlanBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Plans(globalVars.selector);
	}
	onClickSetUpBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Setup(globalVars.selector);
	}
	onKeydownSearchInput(target, event) {
		event.stopPropagation();
		if (event.key == 'Enter') {
			event.preventDefault();
			this.search();
		}
	}
	onInputSearchInput(target, event) {
		if (target.value !== '') {
			globalVars.selector.node.searchClean.style.display = 'block';
		} else {
			globalVars.selector.node.searchClean.style.display = 'none';
		}
	}
	onClickSearchClean(target, event) {
		globalVars.selector.node.searchInput.value = '';
		globalVars.selector.node.searchInput.focus();
		target.style.display = 'none';
	}
	onClickSearchBtn(target, event) {
		this.search();
	}
	search() {
		const selector = globalVars.selector;
		const value = selector.node.searchInput.value;
		if (value.trim() === "") {
			if (this.isSearching) {
				this.isSearching = false;
				selector.renderCharacterList();
			} else {
				alert("请输入正确内容");
			}
			return;
		}
		const reg = new RegExp(value);
		const characters = globalVars.model.getCharactersId(c => reg.test(c) || reg.test(lib.translate[c]), config.showClosed);
		this.isSearching = true;
		selector.renderCharacterList(characters);
	}
	onClickFakeProhibitedBtn(target, event) {
		if (event) utils.playAudio('click2');
		target.classList.remove('advancedFP');
		target.textContent = '伪禁';
		config.isFakeProhibitedActive = target.classList.toggle('active');
		new Toast().info(config.isFakeProhibitedActive ? '已切换至仅玩家可选伪禁' : '已切换至仅点将可选禁将');
		globalVars.fakeProhibitedMode = 'default';
		globalVars.prohibitedList = config.prohibitedList.slice();
		globalVars.selector.renderCharacterList();
	}
	onClickCloseBtn(target, event) {
		if (event) utils.playAudio('click5');
		config.scrollLeft = globalVars.selector.node.charPackList.scrollLeft;
		config.save();
		globalVars.selector.close();
		this.removeAllProhibitedEvent();
		if (ui.dialog) ui.dialog.show();
		if (this.onClose === "showSystem") {
			setTimeout(() => {
				game.closePopped();
				ui.system1.classList.add("shown");
				ui.system2.classList.add("shown");
				game.closeMenu();
				ui.click.shortcut();
			}, 0)
		} else {
			ui.arena.classList.add('menupaused');
			ui.menuContainer.show();
		}
	}
	onMousedownDirectionBtn(target, event) {
		utils.playAudio('click2');
		const change = target.classList.contains('selector-list-left') ? -200 : 200;
		const ul = target.parentNode.querySelector('ul');
		ul.scroll({ left: ul.scrollLeft + change, behavior: 'smooth' });
		this.#timeId2 = setTimeout(() => this.#timeId1 = setInterval(() => ul.scrollLeft += change / 2, 100), 300);
	}
	onWheelCharPackList(target, event) {
		event.preventDefault();
		target.scrollLeft += event.deltaY / 2;
	}
	onClickList(target, event) {
		const item = event.target.closest('li[data-id],div[data-id="all-pack"],div[data-id="all-characters"]');
		if (!item) return;
		if (event) utils.playAudio('click3');
		const selector = globalVars.selector;
		const activeItem = target.querySelector('li.active,div.active');
		if (item === activeItem && !this.isSearching) {
			return;
		};
		if (activeItem) {
			activeItem.classList.remove('active');
		}
		//给当前点击的 li 添加 active 类名
		item.classList.add('active');
		const id = item.getAttribute('data-id');
		target === selector.node.charPackList ? config.currentActivePackId = id : config.currentActivePackCategoryId = id;
		target === selector.node.charPackList ? selector.renderPackCategories() : selector.renderCharacterList();
		this.isSearching = false;
	}
	onMouseupSelector(target, event) {
		clearInterval(this.#timeId1);
		clearTimeout(this.#timeId2);
	}
	onClickCharSelectedBtn(target, event) {
		if (event) utils.playAudio('click2');
		if (target.classList.toggle('active')) {
			config.isCharSelectedActive = true;
			globalVars.selector.renderCharacterList();
		} else {
			config.isCharSelectedActive = false;
			globalVars.selector.renderCharacterList();
		}
	}
	onClickCharConfirmBtn(target, event) {
		if (event) utils.playAudio('click2');
		const num = globalVars.prohibitedList.length - config.prohibitedList.length;
		config.prohibitedList = globalVars.prohibitedList.slice();
		config.save().then(() => {
			const isCordova = utils.getDeviceType() === "cordova";
			const enter = isCordova ? '\n\n' : '<br><br>';
			const success = isCordova ? '禁将成功!' : `<center style="font-size: 22px">禁将成功!</center>`;
			const str = `${success}${enter}新增【${config.prohibitedDesc}】 ${num} 个`;
			isCordova ? alert(str) : utils.asyncAlert(str);
			globalVars.selector.node.loginfo1.textContent = globalVars.selector.displayedCharsId.filter(id => config.prohibitedList.includes(id)).length;
			globalVars.selector.allButtons.forEach(btn => btn.autoToggleBlock());
		})
	}
	onMousedownCharacterList(target, event) {
		//不是左键点击直接返回
		if (event.button !== 0) return;
		const button = event.target.closest('.button.item');
		if (!button) {
			const content = target.querySelector('.content-container>.content');
			if (!content || event.target !== content.querySelector('.buttons')) return;
			globalVars.selector.canvas.handleMouseDown(content, event);
		} else {
			target.addEventListener("mouseup", e => {
				if (e.target.closest('.button.item') === button) {
					if (event) {
						utils.playAudio(button.hasTag() ? 'click6' : 'click4');
					}
					this.handleCharBtnToggleSelect(button);
				}
			}, { once: true });
		}
	}
	handleCharBtnSelect(btn) {
		globalVars.prohibitedList.add(btn.name);
		if (btn.isSkeleton) return;
		btn.autoSetTag();
		this.autoToggleSelectAllBtn();
	}
	handleCharBtnUnselect(btn) {
		globalVars.prohibitedList.remove(btn.name);
		if (btn.isSkeleton) return;
		btn.unselect();
		this.autoToggleSelectAllBtn();
	}
	handleCharBtnToggleSelect(btn) {
		if (btn.hasTag()) {
			this.handleCharBtnUnselect(btn);
		} else {
			this.handleCharBtnSelect(btn);
		}
	}
	/**
	 * @param { object } target 目标对象
	 * @param { string } key 目标对象的键
	 */
	addProhibitedEvent(target, key) {
		this.recordEvent.push([target, key, target[key]]);
		target[key] = typeof target[key] === 'function' ? () => { } : null;
	}
	removeAllProhibitedEvent() {
		this.recordEvent.forEach((item) => {
			item[0][item[1]] = item[2];
		});
		this.recordEvent = [];
	}
}

