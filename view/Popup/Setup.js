import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import globalVars from "../../asset/globalVars.js";
import Popup from "./index.js";
import utils from "../../asset/utils.js";
import config from "../../asset/config.js";
import Constant from "../../asset/Constant.js";

export default class Setup extends Popup {
	constructor() {
		const minValue = 50, maxValue = 150;
		const zoom = +getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
		const relativeValue = (zoom - Constant.minZoom) / Constant.zoomRange;
		const value = Math.round(relativeValue * (maxValue - minValue) + minValue);
		const thumbWidth = 18;
		const inputWidth = 150;

		super(`
			/* 设置弹窗的文本区域设置布局 */
			.content{
				display: grid;
			    align-content: flex-start;
				font-size: 18px;
			}
			.content>div {
				width: 100%;
				display: flex;
				height: 38px;
				justify-content: space-between;
				align-items: center;
				transition: all.1s linear;
			}

			/*设置弹窗的按钮开启样式*/
			.content>div>h3 +span {
				display: block;
				background: url(${lib.assetURL}extension/AI禁将/image/button-off.png) no-repeat center center/contain;
				width: 60px;
				height: 21.6px;
				transform: scale(0.8);
				transform-origin: right center;
				cursor: pointer;
			}
			.content>div.hidden {
				opacity: 0;
				pointer-events: none;
				margin-top: -50px;
			}
			.content>[data-id="advancedFPContent"] {
				transition: all.15s linear;
				background: rgba(200, 200, 200, .3);
				border-radius: 11px;
			}
			.content>[data-id="advancedFPContent"].hidden {
				margin-top: -240px;
				pointer-events: none;
				opacity: 0;
			}
			[data-id="advancedFPContent"]>div {
				display: flex;
				justify-content: space-between;
				align-items: center;
				height: 38px;
				border-radius: inherit;
				padding: 0 11px;
			}
			[data-id="advancedFPContent"]>div:hover {
				background: rgba(131, 170, 239, 0.7);
			}
			[data-id="advancedFPContent"]>div>h3 {
				line-height: 38px;
			}
			[data-id="advancedFPContent"]>div>h3:last-child {
				cursor: pointer;
			}
			/*设置弹窗的按钮关闭样式*/
			.content>div>span.active {
				background: url(${lib.assetURL}extension/AI禁将/image/button-on.png) no-repeat center center/contain;
			}
			/*设置弹窗的按钮开启样式*/
			.content>div>.slider {
				display: flex;
				justify-content: space-between;
				align-items: center;
				width: 200px;
			}
			.slider>input[type="range"] {
				--sl-custom-height: 8px;
				--sl-custom-width: ${relativeValue * (inputWidth - thumbWidth)}px;
				position: relative;
				appearance: none;
				-webkit-appearance: none;
				width: ${inputWidth}px;
				height: var(--sl-custom-height);
				background-color: #EFEFEF;
				outline: none;
				border-radius: calc(var(--sl-custom-height) / 2);
			}
			.slider.volume-slider>input[type="range"] {
				--sl-custom-volume-width: ${config.volume_audio * (inputWidth - thumbWidth) / 100}px;
			}
			.slider>input[type="range"]::before {
				content: "";
				position: absolute;
				width: calc(var(--sl-custom-width) + ${thumbWidth / 2}px);
				z-index: 0;
				background-color: #767676;
				height: var(--sl-custom-height);
				border-radius: calc(var(--sl-custom-height)/2) 0 0 calc(var(--sl-custom-height) / 2);
			}
			.slider.volume-slider>input[type="range"]::before {
				width: calc(var(--sl-custom-volume-width) + ${thumbWidth / 2}px);
			}
			.slider>input[type="range"]::-webkit-slider-thumb {
				appearance: none;
				-webkit-appearance: none;
				position: relative;
				z-index: 1;
				width: ${thumbWidth}px;
				height: ${thumbWidth}px;
				border-radius: 9px;
				background-color: #767676;
			}
			.slider>input[type="range"]:hover {
				background-color: #E5E5E5;
			}
			.slider>input[type="range"]:hover::before,
			.slider>input[type="range"]::-webkit-slider-thumb:hover {
				background-color: #616161;
			}
			.slider>input[type="range"]:active {
				background-color: #F5F5F5;
			}
			.slider>input[type="range"]:active::-webkit-slider-thumb,
			.slider>input[type="range"]:active::before {
				background-color: #838383;
			}
			.slider>input[type="number"] {
				width: 40px;
			}
		`);
		this.state = {
			minValue,
			maxValue,
			thumbWidth,
			inputWidth
		}

		this.setCaption('设置');
		this.setContent(`     
			<div data-id="clear"><h3>一键清除禁将记录并恢复默认设置</h3></div>
			<div data-id="remember"><h3>打开界面时加载上次退出的页面</h3><span></span></div>
			<div data-id="addMenu"><h3>禁将功能添加到游戏顶部菜单栏</h3><span></span></div>
			<div data-id="importData"><h3>导入禁将设置</h3></div>
			<div data-id="importDataSelect" class="hidden"><input style="width:75%" type="file" accept="*/*"><button style="padding:0 1vh;">确定</button></div>  
			<div data-id="exportData"><h3>导出禁将设置</h3></div>
			<div data-id="setZoom">
				<h3>界面缩放</h3>
				<div class="slider">
					<input type="range" name="slider-input1" min="${minValue}" max="${maxValue}" value="${value}">
					<input type="number" name="slider-input2" min="${minValue}" max="${maxValue}" value="${value}">
				</div>
			</div>
			<div data-id="setVolume">
				<h3>音效音量</h3>
				<div class="slider volume-slider">
					<input type="range" name="slider-input1" min="0" max="100" value="${config.volume_audio}">
					<input type="number" name="slider-input2" min="0" max="100" value="${config.volume_audio}">
				</div>
			</div>
			<div data-id="advancedFP"><h3>高级伪禁(点击展开)</h3></div>
			<span data-id="advancedFPContent" class="${globalVars.isAFPHidden ? 'hidden' : ''}">
				<div data-id="identity_zhu"><h3>主公伪禁</h3><h3>切换界面</h3></div>
				<div data-id="identity_zhong"><h3>忠臣伪禁</h3><h3>切换界面</h3></div>
				<div data-id="identity_fan"><h3>反贼伪禁</h3><h3>切换界面</h3></div>
				<div data-id="identity_nei"><h3>内奸伪禁</h3><h3>切换界面</h3></div>
				<div data-id="doudizhu_1"><h3>地主伪禁</h3><h3>切换界面</h3></div>
				<div data-id="doudizhu_2"><h3>农民二号位伪禁</h3><h3>切换界面</h3></div>
				<div data-id="doudizhu_3"><h3>农民三号位伪禁</h3><h3>切换界面</h3></div>
				<div data-id="versus_two_1"><h3>2V2一号位伪禁</h3><h3>切换界面</h3></div>
				<div data-id="versus_two_2"><h3>2V2二号位伪禁</h3><h3>切换界面</h3></div>
				<div data-id="versus_two_3"><h3>2V2三号位伪禁</h3><h3>切换界面</h3></div>
				<div data-id="versus_two_4"><h3>2V2四号位伪禁</h3><h3>切换界面</h3></div>
			</span>  
		`);
		const content = this.node.content;
		this.node.content.node = {
			remember: content.querySelector('div[data-id="remember"]'),
			addMenu: content.querySelector('div[data-id="addMenu"]'),
			importData: content.querySelector('div[data-id="importData"]'),
			importDataSelect: content.querySelector('div[data-id="importDataSelect"]'),
			exportData: content.querySelector('div[data-id="exportData"]'),
			clear: content.querySelector('div[data-id="clear"]'),
			setZoom: content.querySelector('div[data-id="setZoom"]'),
			setVolume: content.querySelector('div[data-id="setVolume"]'),
			advancedFP: content.querySelector('div[data-id="advancedFP"]'),
			advancedFPContent: content.querySelector('span[data-id="advancedFPContent"]')
		};
		for (const div of this.node.content.node.advancedFPContent.querySelectorAll('div')) {
			if (div.getAttribute('data-id') === globalVars.fakeProhibitedMode) {
				const h3 = div.querySelector('h3:last-child');
				h3.style.color = '#ff647f';
				h3.textContent = '退出界面';
				break;
			}
		}
		if (!globalVars.isAFPHidden) {
			this.node.content.node.advancedFP.textContent = '高级伪禁(点击收起)';
			this.node.content.scrollTo({
				top: this.node.content.scrollHeight,
				behavior: "smooth" // 平滑滚动
			});
		}
		this.#addListener();
	}
	#addListener() {
		const { remember, addMenu, importData, importDataSelect, exportData, clear, setZoom, setVolume, advancedFP, advancedFPContent } = this.node.content.node;
		this.autoToggleConfigBtn(remember);
		this.autoToggleConfigBtn(addMenu);

		const click = lib.config.touchscreen ? 'touchend' : 'click';
		importData.addEventListener(click, this.handleClickImportDataConfig.bind(this));
		importDataSelect.addEventListener(click, this.handleClickImportDataSelectConfig.bind(this));
		exportData.addEventListener(click, this.handleClickExportDataConfig.bind(this));
		clear.addEventListener(click, this.handleClickClearConfig.bind(this));
		setZoom.querySelector('.slider>input[type="range"]').addEventListener('input', this.handleInputSetZoomConfig.bind(this));
		setZoom.querySelector('.slider>input[type="number"]').addEventListener('input', this.handleInputSetZoomConfig.bind(this));
		setVolume.querySelector('.slider>input[type="range"]').addEventListener('input', this.handleInputSetVolumeConfig.bind(this));
		setVolume.querySelector('.slider>input[type="number"]').addEventListener('input', this.handleInputSetVolumeConfig.bind(this));
		advancedFP.addEventListener(click, this.handleClickAdvancedFP.bind(this));
		advancedFPContent.addEventListener(click, this.handleClickAdvancedFPContent.bind(this));
	}
	autoToggleConfigBtn(node, callback = () => { }) {
		const btn = node.querySelector('span');
		const name = node.getAttribute('data-id')
		if (config[name]) btn.classList.add('active');
		btn.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', (e) => {
			utils.playAudio('click1');
			const bool = btn.classList.toggle('active');
			config[name] = bool;
			config.save().then(callback);
		});
	}
	handleClickImportDataConfig(e) {
		if (e) utils.playAudio('click2');
		e.target.closest('[data-id="importData"]').nextElementSibling.classList.toggle('hidden');
	}
	handleClickImportDataSelectConfig(e) {
		const btn = e.target;
		if (btn.tagName !== 'BUTTON') return;
		if (e) utils.playAudio('click2');
		const fileToLoad = btn.previousSibling.files[0];
		if (fileToLoad) {
			var fileReader = new FileReader();
			fileReader.onload = function (fileLoadedEvent) {
				let data = fileLoadedEvent.target.result;
				if (!data) return;

				if (fileToLoad?.name?.endsWith('.json')) {
					data = JSON.parse(data);
				} else {
					try {
						data = JSON.parse(lib.init.decode(data));
						if (!data || typeof data != 'object') {
							throw ('文件数据不是一个对象');
						}
						const keys = Object.keys(data);
						if (!keys.length || keys.some(key => !config.hasOwnProperty(key))) {
							throw ('导入数据识别不到，请检查文件是否正确');
						}
					}
					catch (e) {
						console.error(e);
						alert('导入失败');
						return;
					}
				}

				console.log('data', data);

				// 兼容旧版本配置
				if (Array.isArray(data.bannedList)) {
					config.prohibited.default.addArray(data.bannedList);
				}
				config.save(data).then(() => {
					globalVars.prohibitedMode = 'default';
					globalVars.fakeProhibitedMode = 'default';
					globalVars.prohibitedList = config.prohibitedList.slice();

					alert('导入成功');
					globalVars.selector.reload();
				});
			}
			fileReader.readAsText(fileToLoad, "UTF-8");
		}
	}
	handleClickExportDataConfig(e) {
		if (e) utils.playAudio('click2');
		const directory = `extension/AI禁将/settings`;
		const fileNameToSaveAs = ('AI禁将 - 设置 - ' + new Date().toLocaleString() + '.json').replace(/\\|\/|:|\?|"|\*|<|>|\|/g, ".");
		game.writeFile(JSON.stringify(config, null, 2), directory, fileNameToSaveAs, (result) => {
			if (result instanceof Error) {
				alert("文件导出失败，错误信息：" + result);
			} else {
				alert("文件已导出至" + directory + '/' + fileNameToSaveAs);
			}
		});
	}
	handleClickClearConfig(e) {
		if (e) utils.playAudio('click2');
		if (confirm('确定要清除禁将记录并恢复默认设置吗？')) {
			config.saveDefault().then(() => {
				globalVars.prohibitedList = config.prohibitedList.slice();
				alert('清除成功！');
				globalVars.selector.reload();
			});
		}
	}
	handleInputSetZoomConfig(e) {
		const rangeInput = this.node.content.node.setZoom.querySelector('.slider>input[type="range"]');
		const numberInput = this.node.content.node.setZoom.querySelector('.slider>input[type="number"]');
		const { minValue, maxValue, thumbWidth, inputWidth } = this.state;
		const value = Math.max(minValue, Math.min(maxValue, +e.target.value));

		(e.target === rangeInput ? numberInput : rangeInput).value = value;
		const relativeValue = (value - minValue) / (maxValue - minValue);
		rangeInput.style.setProperty('--sl-custom-width', `${relativeValue * (inputWidth - thumbWidth)}px`);
		const zoom = (relativeValue * Constant.zoomRange + Constant.minZoom);
		document.documentElement.style.setProperty('--sl-layout-zoom', zoom);
		config.computedZoom = zoom * game.documentZoom;
		config.save();
	}
	handleInputSetVolumeConfig(e) {
		const rangeInput = this.node.content.node.setVolume.querySelector('.slider>input[type="range"]');
		const numberInput = this.node.content.node.setVolume.querySelector('.slider>input[type="number"]');
		(e.target === rangeInput ? numberInput : rangeInput).value = e.target.value;
		const { thumbWidth, inputWidth } = this.state;
		rangeInput.style.setProperty('--sl-custom-volume-width', `${e.target.value * (inputWidth - thumbWidth) / 100}px`);
		config.volume_audio = e.target.value;
		config.save();
	}
	handleClickAdvancedFP(e) {
		if (e) utils.playAudio('click2');
		const target = e.target.closest('[data-id="advancedFP"]');
		const isHidden = target.nextElementSibling.classList.toggle('hidden');
		const HTML = target.innerHTML;
		globalVars.isAFPHidden = isHidden;
		target.innerHTML = isHidden ? HTML.replace('(点击收起)', '(点击展开)') : HTML.replace('(点击展开)', '(点击收起)');
	}
	handleClickAdvancedFPContent(e) {
		if (e.target.matches('div>h3:last-child')) {
			utils.playAudio('click2');
			if (JSON.stringify([...globalVars.prohibitedList].sort()) !== JSON.stringify([...config.prohibitedList].sort())) {
				if (!confirm('当前界面禁将的选择还没保存，确定要切换吗？')) return;
			}
			setTimeout(() => this.close(), 0);

			const fakeProhibitedBtn = globalVars.selector.node.fakeProhibitedBtn;
			if (e.target.textContent === '退出界面') {
				config.isFakeProhibitedActive = false;
				globalVars.fakeProhibitedMode = 'default';
				globalVars.prohibitedList = config.prohibitedList.slice();
				globalVars.selector.renderCharacterList();
				fakeProhibitedBtn.classList.remove('active');
				fakeProhibitedBtn.classList.remove('advancedFP');
				fakeProhibitedBtn.textContent = '伪禁';
			} else {
				config.isFakeProhibitedActive = true;
				globalVars.fakeProhibitedMode = e.target.closest('[data-id="advancedFPContent"]>div').getAttribute('data-id');
				globalVars.prohibitedList = config.prohibitedList.slice();
				globalVars.selector.renderCharacterList();
				fakeProhibitedBtn.classList.add('active');
				fakeProhibitedBtn.classList.add('advancedFP');
				fakeProhibitedBtn.textContent = config.prohibitedDesc;
			}

		}
	}
}

customElements.define('selector-popup-setup', Setup);
