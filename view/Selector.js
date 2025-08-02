import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import globalVars from "../asset/globalVars.js";
import CanvasBoard from './CanvasBoard.js';
import Dialog from './Dialog.js';
import CharacterBtn from './CharacterBtn.js';
import config from "../asset/config.js";

lib.init.css(lib.assetURL + 'extension/AI禁将/view', "Selector");//调用css样式
/**
 * @type {Selector}
 * @extends {HTMLDivElement}
 */
class Selector extends HTMLDivElement {
	/** * @type { boolean } 是否已经初始化 */
	#isInit
	/** * @type { object } */
	node
	/** * @type { HTMLCanvasElement } */
	canvas

	animationFrameTimer = null;

	forbidai_bg = null;
	observer = null;
	/**
	 * 当前展示的武将id
	 */
	displayedCharsId = [];
	get allButtons() {
		return Array.from(this.node.characterList.querySelectorAll('.dialog .buttons .item'));
	}
	constructor() {
		super();
		globalVars.selector = this;
		this.classList.add('Selector');
		this.observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				const btn = entry.target;
				setTimeout(() => {
					if (entry.isIntersecting || entry.intersectionRatio > 0.01) {
						btn.loadData();
						this.observer.unobserve(btn);
					}
				}, 100);
			})
		}, {
			rootMargin: '100px'
		})
		this.innerHTML = `
			<div class="selector-header">
				<div class="select">
					<span class="classification">分类: </span>
					<span class="choose">
						<span class="method">
							<span style="color: #ffe6b7;">默认</span>
							<img src="${lib.assetURL}extension/AI禁将/image/T3.png">
						</span>
						<div class="select-content">
							<div>
								<span>默认</span>
								<span>评级</span>
								<span>势力</span>
								<span>性别</span>
							</div>
						</div>
					</span>
				</div>
				<div class="selector-header-pack">
					<button class="selector-header-help" title="帮助"></button>
					<button class="selectAll">全选</button>
					<button class="inverse">反选</button>
					<button class="plan">方案</button>
					<button class="setUp" title="设置"></button>
				</div>
				<form class="selector-header-search">
					<div class="search-content">
						<input class="input" type="text" autocomplete="off"
							accesskey="f" maxlength="100" x-webkit-speech="" x-webkit-grammar="builtin:translate" value=""
							placeholder="支持正则搜索" title="支持正则搜索">
						<div class="search-clean"></div>
					</div>
					<button type="button"></button>
				</form>
				<div class="selector-header-fake-prohibited">伪禁</div>
				<div class="selector-header-loginfo">
					已禁用：<span style="color: #ffe6b7;">0</span>/<span style="color: #ffe6b7;">0</span>个武将
				</div>
				<div class="selector-header-close"></div>
			</div>
			<div class="selector-list">
				<button class="selector-list-left" title="向左滚动"></button>
				<button class="selector-list-right" title="向右滚动"></button>
				<div data-id="all-pack">全扩</div>
				<ul></ul>
			</div>
			<div class="selector-content">
				<div class="selector-content-characterSort">
					<div data-id="all-characters">所有武将</div>
					<ol></ol>
					<div class="result">
		  				<button class="charSelectedBtn">禁将列表</button>
		  				<button class="charConfirmBtn">确认禁将</button>			
					</div>
				</div>
				<div class="characterList"></div>
			</div>
	 	  `;
		this.node = {
			selectChoose: this.querySelector('.selector-header>.select>.choose'),
			help: this.querySelector('.selector-header-help'),
			selectAll: this.querySelector('.selector-header-pack>.selectAll'),
			inverse: this.querySelector('.selector-header-pack>.inverse'),
			plan: this.querySelector('.selector-header-pack>.plan'),
			setUp: this.querySelector('.selector-header-pack>.setUp'),
			searchInput: this.querySelector('.selector-header-search .input'),
			searchClean: this.querySelector('.selector-header-search .search-clean'),
			searchBtn: this.querySelector('.selector-header-search>button'),
			fakeProhibitedBtn: this.querySelector('.selector-header-fake-prohibited'),
			loginfo1: this.querySelector('.selector-header-loginfo>span'),
			loginfo2: this.querySelector('.selector-header-loginfo>span:last-child'),
			close: this.querySelector('.selector-header-close'),
			left: this.querySelector('.selector-list-left'),
			right: this.querySelector('.selector-list-right'),
			charPackList: this.querySelector('.selector-list'),
			charPackCategories: this.querySelector('.selector-content-characterSort'),
			charSelectedBtn: this.querySelector('.selector-content-characterSort .charSelectedBtn'),
			charConfirmBtn: this.querySelector('.selector-content-characterSort .charConfirmBtn'),
			characterList: this.querySelector('.selector-content>.characterList'),
		}
	}
	init() {
		if (this.#isInit) return;
		this.#isInit = true;
		this.#addListener();
		this.renderPackList();
		const cvs = new CanvasBoard(this.node.characterList, this);
		this.canvas = cvs;
		if (config.remember) {
			this.node.selectChoose.querySelector('.method>span').textContent = config.currentActiveMode;
			if (config.isCharSelectedActive) this.node.charSelectedBtn.classList.add('active');
			if (config.isFakeProhibitedActive) this.node.fakeProhibitedBtn.classList.add('active');
		}

		const forbidai_bg = lib.config.extension_AI禁将_forbidai_bg;
		if (forbidai_bg) {
			this.style.backgroundImage = forbidai_bg === 'xitong' ? ui.background.style.backgroundImage : `url("${lib.assetURL}extension/AI禁将/image/${forbidai_bg}_bg.jpg")`;
			const that = this;
			that.forbidai_bg = forbidai_bg;
			Object.defineProperty(lib.config, 'extension_AI禁将_forbidai_bg', {
				get() {
					return that.forbidai_bg;
				},
				set(newValue) {
					if (that.forbidai_bg !== newValue) {
						if (newValue !== 'xitong') that.style.backgroundImage = `url("${lib.assetURL}extension/AI禁将/image/${newValue}_bg.jpg")`;
						else that.style.backgroundImage = window.getComputedStyle(ui.background).backgroundImage;
						that.forbidai_bg = newValue;
					}
				}
			});

			const observer = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					if (mutation.type === 'attributes' && mutation.attributeName === 'style' && mutation.target === ui.background) {
						if (that.forbidai_bg === 'xitong') this.style.backgroundImage = window.getComputedStyle(ui.background).backgroundImage;
					}
				});
			});
			const conf = {
				attributes: true,
				attributeFilter: ['style']
			};
			observer.observe(ui.background, conf);
		}
	}
	reload() {
		this.remove();
		new Selector().open();
	}
	/**
	 * @param { function } onClose 
	 */
	open() {
		document.documentElement.style.setProperty('--sl-layout-zoom', config.zoom / globalVars.uiZoom);
		ui.window.appendChild(this);
		this.init();
		if (this.node.dialog) {
			this.node.dialog.classList.remove('hidden');
			this.node.characterList.appendChild(this.node.dialog);
		}
		this.setAttribute("data-visible", "true");
		if (config.remember) this.node.charPackList.scrollLeft = config.scrollLeft;
	}
	close() {
		this.setAttribute("data-visible", "false");
	}
	/**
	 * 渲染武将包列表/渲染武将包分类列表
	 * @param { 'packList' | 'packCategories' } name 
	 */
	renderList(name, showClosed) {
		const list = globalVars.model.getList(name, showClosed);
		let parentNode;
		let getActiveId;
		let setActiveId;
		let getInnerHTML;
		let firstElement;
		let next = () => { };

		if (name === 'packList') {
			parentNode = this.node.charPackList.querySelector('ul');
			getActiveId = () => config.currentActivePackId;
			setActiveId = (id) => config.currentActivePackId = id;
			getInnerHTML = (id) => {
				return id === 'all-pack' ? '全扩' : (lib.translate[id + '_character_config'] || '')
			}
			firstElement = this.node.charPackList.querySelector('div[data-id="all-pack"]')
			next = this.renderPackCategories.bind(this);
		} else if (name === 'packCategories') {
			parentNode = this.node.charPackCategories.querySelector('ol');
			getActiveId = () => config.currentActivePackCategoryId;
			setActiveId = (id) => config.currentActivePackCategoryId = id;
			getInnerHTML = (id) => {
				return id === 'all-characters' ? '所有武将' : (lib.translate[id] || '');
			}
			firstElement = this.node.charPackCategories.querySelector('div[data-id="all-characters"]')
			next = this.renderCharacterList.bind(this);
		} else {
			throw new Error('name must be "packList" or "packCategories",name:', name);
		}

		//清空 parentNode 的所有子元素
		parentNode.innerHTML = '';
		//渲染每一个 li
		list.forEach(id => {
			//创建li元素
			const li = document.createElement('li');
			//给li添加自定义属性
			li.setAttribute('data-id', id);
			//如果当前li名是当前记录的高亮名，给li添加 active 类名
			if (config.remember && id === getActiveId()) li.classList.add('active');
			//给li添加内容
			li.innerHTML = getInnerHTML(id);
			//将li添加到ul中
			parentNode.appendChild(li);
		});

		//如果没有高亮li，则给第一个li添加 active 类名
		const activeLi = parentNode.querySelector('li.active');
		if (!activeLi && firstElement) {
			firstElement.classList.add('active');
			setActiveId(firstElement.getAttribute('data-id'));
		}

		//调用next函数
		next();
	}
	// 渲染武将包列表
	renderPackList() {
		this.renderList('packList', config.showClosed);
	}
	//渲染武将包分类列表
	renderPackCategories() {
		this.renderList('packCategories', config.showClosed);
	}
	/**
	 * 渲染每一个武将
	 * @param { string[]? } charactersArr 
	 */
	renderCharacterList(charactersArr) {
		const characters = charactersArr || globalVars.model.getList('characters', config.showClosed);
		//逐帧渲染和懒加载武将按钮
		const characterList = this.node.characterList;
		if (this.node.dialog) this.node.dialog.remove();
		const dialog = new Dialog(characterList);
		this.node.dialog = dialog;
		/* const dialog = this.node.dialog || new Dialog(characterList);
		this.node.dialog = dialog; */
		dialog.content.innerHTML = '';
		const buttonsElement = ui.create.div('.buttons', dialog.content);
		if (config.small) buttonsElement.classList.add('smallzoom');
		this.renderElements(characters, buttonsElement);
		globalVars.controller.autoToggleSelectAllBtn();
	}
	/**
	 * 逐帧渲染大量 DOM 元素
	 * @param { Array } elements - 需要渲染的 DOM 元素数组
	 * @param { HTMLElement } container - 容器 DOM 节点
	 */
	renderElements(characters, container) {
		this.displayedCharsId = characters.slice();
		this.node.selectAll.removeAttribute('disabled');
		this.node.inverse.removeAttribute('disabled');
		if (this.observer) {
			this.observer.disconnect();
			this.observe = null;
		}

		let num = 8; // 每帧渲染的元素数量
		let count_num = 0; //当前渲染的元素起始索引
		// let step = 2; //步长
		let frame = 0; // 当前帧数
		if (this.animationFrameTimer) {
			cancelAnimationFrame(this.animationFrameTimer);
		}

		const prohibitedList = config.prohibitedList;
		const renderFrame = () => {
			const start = count_num;
			const end = Math.min(count_num + num, characters.length);
			count_num = end;

			if (frame > 5) num = 200;
			else if (frame > 2) num = 100;

			const fragment = document.createDocumentFragment();
			for (let i = start; i < end; i++) {
				const char = characters[i];
				const btn = new CharacterBtn(char, frame !== 0);
				fragment.appendChild(btn);
				this.observer.observe(btn);
			}

			container.appendChild(fragment);
			this.node.loginfo2.textContent = end;
			if (end < characters.length) {
				frame++;
				this.animationFrameTimer = requestAnimationFrame(renderFrame);
			} else {
				this.node.loginfo1.textContent = prohibitedList.filter(id => characters.includes(id)).length;
				this.node.selectAll.removeAttribute('disabled');
				this.node.inverse.removeAttribute('disabled');
			}
		};

		this.node.selectAll.setAttribute('disabled', 'true');
		this.node.inverse.setAttribute('disabled', 'true');
		renderFrame();
	}
	#addListener() {
		const {
			selectChoose,
			help,
			selectAll,
			inverse,
			plan,
			setUp,
			searchInput,
			searchClean,
			searchBtn,
			fakeProhibitedBtn,
			close,
			left,
			right,
			charPackList,
			charPackCategories,
			charSelectedBtn,
			charConfirmBtn,
			characterList
		} = this.node;
		const selector = this;
		const getEvtName = function (name) {
			const map = new Map([
				["mouseup", "touchend"],
				["click", "touchend"],
				["mousedown", "touchstart"],
			]);
			return lib.config.touchscreen ? map.get(name) : name;
		}
		const handleEventListener = function (target, eventName, callbackName) {
			target.addEventListener(eventName, function (e) {
				globalVars.controller[callbackName](this, e);
			});
		}
		const click = getEvtName('click');
		const mousedown = getEvtName('mousedown');
		const mouseup = getEvtName('mouseup');

		handleEventListener(selector, mouseup, 'onMouseupSelector');
		handleEventListener(selectChoose, click, 'onClickSelectChooseBtn');
		handleEventListener(help, click, 'onClickHelpBtn');
		handleEventListener(selectAll, click, 'onClickSelectAllBtn');
		handleEventListener(inverse, click, 'onClickInverseBtn');
		handleEventListener(plan, click, 'onClickPlanBtn');
		handleEventListener(setUp, click, 'onClickSetUpBtn');
		handleEventListener(searchInput, 'keydown', 'onKeydownSearchInput');
		handleEventListener(searchInput, 'input', 'onInputSearchInput');
		handleEventListener(searchClean, click, 'onClickSearchClean');
		handleEventListener(searchBtn, click, 'onClickSearchBtn');
		handleEventListener(fakeProhibitedBtn, click, 'onClickFakeProhibitedBtn');
		handleEventListener(close, click, 'onClickCloseBtn');
		handleEventListener(left, mousedown, 'onMousedownDirectionBtn');
		handleEventListener(right, mousedown, 'onMousedownDirectionBtn');
		handleEventListener(charPackList.querySelector('ul'), 'wheel', 'onWheelCharPackList');
		handleEventListener(charPackList, click, 'onClickList');
		handleEventListener(charPackCategories, click, 'onClickList');
		handleEventListener(charSelectedBtn, click, 'onClickCharSelectedBtn');
		handleEventListener(charConfirmBtn, click, 'onClickCharConfirmBtn');
		handleEventListener(characterList, 'mousedown', 'onMousedownCharacterList');
	}
}

customElements.define('character-selector', Selector, { extends: 'div' });
export default Selector;
