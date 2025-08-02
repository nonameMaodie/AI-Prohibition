import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import config from "../../asset/config.js";
import utils from "../../asset/utils.js";
import globalVars from "../../asset/globalVars.js";
import Toast from "../Toast.js";

/** @extends HTMLLIElement */
class SettingCard {
	/** 
	 * @param { object } info 一个方案的信息，必须拥有 name 和 type 属性
	 */
	constructor(info) {
		const card = document.createElement('li');
		card.info = info;
		Object.setPrototypeOf(SettingCard.prototype, Object.getPrototypeOf(card));
		Object.setPrototypeOf(card, this);
		const show = document.createElement('div');
		show.classList.add('show');
		const img = `<img src="${lib.assetURL}extension/AI禁将/image/icon-setting.svg" style="width:20px; height:20px"></img>`;
		show.innerHTML = `<div data-id="title">${img} <label for="settingName">${info.name}</label><input id="settingName" type="text" maxlength="12"></div><div data-id="desc">${info.desc}</div>`;

		const action = document.createElement('div');
		action.classList.add('action');
		action.innerHTML = `
			<span data-id="load">导入</span>
			<span data-id="edit">编辑</span>
			<span data-id="cover">覆盖</span>
			<span data-id="delete">删除</span>
		`;
		card.appendChild(show);
		card.appendChild(action);
		return card;
	}
}

export default class Settings extends HTMLDivElement {

	baseStyle = `
			*{
				margin: 0;
				padding: 0;
			}
			.operation {
				width: 100%;
				display: flex;
				justify-content: space-between;
				margin-bottom: 10px;
			}
			.operation img{
				width: 20px;
				cursor: pointer;
				vertical-align: text-bottom;
			}
			.operation span[data-id="text"]{
				font-size: 18px;
				cursor: pointer;
			}
			ul{
				display: grid;
				gap: 10px;
				list-style: none;
			}
			ul>li {
				display: flex;
				position: relative;
				justify-content: space-between;
				background: rgba(200,200,200,.3);
				border-radius: 10px;
				height: 40px;
				padding: 10px;
	            transition: 0.5s;
				box-sizing: border-box;
			}
			ul>li:hover {
				height: 62px;
			}		
			ul>li:hover .action{
				opacity: 1;
				transform: translate(0, -50%);
				pointer-events: auto;
			}
			ul>li:hover .show>[data-id="desc"] {
				transform: translate(0, 5px);
				pointer-events: auto;
			}
			.show{
				position: relative;
				width: 60%;
			}
			.action{
				position: absolute;
				display: flex;
				gap: 23px;
				text-align: center;
				align-items: center;
				color: #ebebeb;
				right: 10px;
				top: 31px;
				opacity: 0;
				pointer-events: none;
           		transform: translate(100%, -50%);
            	transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);
			}
			.show>[data-id="title"]{
				position: absolute;
			}
			.show>[data-id="desc"]{
				position: absolute;
				pointer-events: none;
				top: 50%;
				transform: translate(450px, -50%);
            	transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
			}
			.show label[for="settingName"] {
				font-size: 22px;
				line-height: 22px;
				font-weight: 550;
				vertical-align: top;
			}
			.show label[for="settingName"].hidden {
				 display: none; 
			}
			.show label[for="settingName"] +input{
				 width: 100px;
				 display: none;
				 vertical-align: top;
			}
			.show label[for="settingName"].hidden +input{
				 display: inline;
			}
			.show div[data-id="desc"] {
				font-size: 15px;
				color: #dbdbdb;
			}
			.action>span {
				font-size: 19px;
				cursor: pointer;
			}
			.action>span:hover {
				color: #83AAEF;
			}
			`
	constructor(onBack) {
		super();
		this.onBack = onBack;
		this.classList.add('sub-page');
		this.style.cssText = `
				box-sizing: border-box;
				min-width: 100%;
				padding: 8px 8px 0 8px;  
			`;
		const shadow = this.attachShadow({ mode: 'open' });
		const template = document.createElement('template');
		template.innerHTML = `
			<style>		
				${this.baseStyle}
			</style>
			<div class="operation"> 
				<div class="back">
					<img src="${lib.assetURL}extension/AI禁将/image/icon-back.svg">
					<span data-id="text"> 返回</span>
				</div>
				<div class="add">
					<img src="${lib.assetURL}extension/AI禁将/image/add.png">
					<span data-id="text"> 导出新的禁将设置</span>
				</div>
			</div>
			<ul></ul>`;
		shadow.appendChild(template.content);
		this.node = {
			ul: this.shadowRoot.querySelector('ul'),
		}
	}
	connectedCallback() {
		const ul = this.node.ul;
		this.readAllJSON()
			.then(settings => {
				const addSetting = info => ul.appendChild(new SettingCard(info));
				utils.executeChunkedTasks(settings, addSetting, 10);
				this.#addListener();
			});
	}
	/** 
	 * @param { string? } name
	 * @returns { SettingCard } */
	createNewSettingCard(name) {
		const info = {};
		if (!name) {
			const lis = this.node.ul.querySelectorAll('ul>li');
			let str = '设置';
			let num = 1;
			const nameArr = Array.from(lis, card => card.info.name);
			while (true) {
				const cnNumber = get.cnNumber(num, true);
				if (nameArr.every(name => name !== str + cnNumber)) {
					str += cnNumber;
					break;
				}
				num++;
			}
			info.name = str;
		} else { info.name = name; }
		const time = new Date().toLocaleString().replace(/\\|\/|:|\?|"|\*|<|>|\|/g, ".");
		info.desc = '导出时间：' + time;
		info.fileName = info.name + ' - ' + time + '.json';
		return new SettingCard(info);
	}
	#addListener() {
		const ul = this.node.ul;
		const back = this.shadowRoot.querySelector('.operation>div.back');
		const add = this.shadowRoot.querySelector('.operation>div.add');

		add.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', e => {
			utils.playAudio('click1');
			const cards = Array.from(ul.childNodes);
			game.prompt('请输入新的设置名<br><font size="1px">（直接点击“确定”使用默认名称）</font>', null, result => {
				if (typeof result !== 'string') return;
				const cardName = result.trim();
				if (cards.some(card => card.info.name === cardName)) {
					alert("命名有重复！");
					return;
				}
				if (cardName.match(/[\\|\/|:|\?|"|\*|<|>|\|]/g)) {
					alert("请勿使用特殊字符！");
					return;
				}
				const card = this.createNewSettingCard(cardName);
				this.writeJSON(card.info)
					.then(() => {
						ul.appendChild(card);
						new Toast().info(`“${card.info.name}”已导出至extension/AI禁将/settings`);
					})
					.catch(e => {
						new Toast().error("文件导出失败");
						console.error("文件导出失败，错误信息：" + e);
					});
			})
		});
		back.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', e => {
			utils.playAudio('click5');
			this.onBack();
			setTimeout(() => {
				this.remove();
			}, 300);
		});
		ul.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', e => {
			const card = e.target.closest('ul>li');
			if (!card) return;
			if (e.target.closest('li .action')) {
				switch (e.target.getAttribute('data-id')) {
					case 'load': {
						utils.playAudio('click1');
						this.readJSON(card.info.fileName)
							.then(data => {
								return config.save(data);
							})
							.then(() => {
								globalVars.prohibitedMode = 'default';
								globalVars.fakeProhibitedMode = 'default';
								globalVars.prohibitedList = config.prohibitedList.slice();
								new Toast().success('导入成功');
								globalVars.selector.reload();
							})
							.catch((e) => {
								new Toast().error(`读取失败`);
								console.error(`读取失败！错误信息：${e}`);
							});
						break;
					}
					case 'cover': {
						utils.playAudio('click1');
						const oldCard = card;
						game.prompt(`请输入新的设置名` + '<br><font size="1px">（直接点击“确定”使用原名覆盖）</font>', null, result => {
							if (typeof result !== 'string') return;
							const cardName = result.trim() || oldCard.info.name;
							const newCard = this.createNewSettingCard(cardName);
							this.deleteJSON(oldCard.info.fileName)
								.then(() => {
									return this.writeJSON(newCard.info);
								})
								.then(() => {
									ul.replaceChild(newCard, oldCard);
									new Toast().info(`新设置“${newCard.info.name}”已覆盖原设置`);
								})
								.catch(e => {
									new Toast().error("覆盖失败");
									console.error("覆盖失败，错误信息：" + e);
								});
						})
						break;
					}
					case 'edit': {
						utils.playAudio('click1');
						const name = card.querySelector('label[for="settingName"]');
						const input = name.nextElementSibling;
						this.validateInput(name, input);
						break;
					}
					case 'delete': {
						utils.playAudio('click1');
						if (!confirm('确定删除此设置吗？')) return;
						this.deleteJSON(card.info.fileName).then(() => card.remove()).catch(e => {
							new Toast().error("删除失败");
							console.error("删除失败，错误信息：" + e);
						});
						break;
					}
				}
			}
		});
		ul.addEventListener('dblclick', (e) => {
			if (e.target.matches('label[for="settingName"]')) {
				const name = e.target;
				const input = name.nextElementSibling;
				this.validateInput(name, input);
			}
		});
	}
	/**
	 * 校验输入框内容
	 * @param { HTMLElement } name 
	 * @param { HTMLInputElement} input 
	 */
	validateInput(name, input) {
		const card = name.closest('ul>li');
		name.classList.add('hidden');
		setTimeout(() => input.focus(), 0);
		input.onkeydown = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				input.blur();
			}
		};
		input.onblur = (e) => {
			let value = input.value;
			name.classList.remove('hidden');
			value = value.trim();
			if (!value) return;
			if (Array.from(card.parentNode.childNodes).some(item => item !== card && item.info.name === value)) {
				alert("命名有重复！");
				return;
			}
			const oldFileName = card.info.fileName;
			const oldName = card.info.name;
			const newFileName = oldFileName.replace(oldName, value);
			this.renameJSON(oldFileName, newFileName)
				.then(() => {
					card.querySelector('label[for="settingName"]').innerHTML = value;
					card.info.name = value;
					card.info.fileName = newFileName;
				})
				.catch(e => {
					new Toast().error('重命名失败');
					console.error(e);
				})
		}
	}
	async readJSON(fileName) {
		const info = await lib.init.promises.json(`${lib.assetURL}extension/AI禁将/settings/${fileName}`);
		return info;
	}
	/**
	 * 读取所有的JSON文件
	 * @returns { Promise<object> }
	 */
	async readAllJSON() {
		const [folders, files] = await game.promises.getFileList(`extension/AI禁将/settings`);
		const settings = [];
		for (const file of files) {
			if (file.endsWith('.json')) {
				const info = {};
				info.name = file.replace(/\.json$/, '');
				let match1 = info.name.match(/(.+?)\s*-\s*[^-]+$/);
				if (!match1) {
					match1 = info.name.match(/^(.*?)(?=\d)/);
				}
				let match2 = info.name.match(/[^-]+$/);
				if (!match2) {
					match2 = info.name.match(/\d+.*/);
				}
				info.name = match1 ? match1[1] : info.name;
				info.desc = match2 ? ('导出时间：' + match2[0].trim()) : null;
				info.fileName = file;
				settings.push(info);
			}
		}
		return settings;
	}
	/**
	 * 写入JSON文件
	 * @param { SettingCard } SettingCard
	 * @returns { Promise }
	 */
	async writeJSON(info) {
		const directory = `extension/AI禁将/settings`;
		const fileName = info.fileName;
		await game.promises.writeFile(JSON.stringify(config, null, 2), directory, fileName);
	}
	/**
	 * 删除JSON文件
	 * @param { SettingCard } SettingCard
	 * @returns { Promise }
	 */
	async deleteJSON(fileName) {
		await game.promises.removeFile(`extension/AI禁将/settings/${fileName}`);
	}
	/**
	 * 重命名JSON文件
	 * @param { string } oldFileName 旧文件名
	 * @param { string } newFileName 新文件名
	 * @returns { Promise }
	 */
	async renameJSON(oldFileName, newFileName) {
		await utils.renameFile(`extension/AI禁将/settings/` + oldFileName, newFileName);
	}
}

customElements.define('selector-popup-sttings', Settings, { extends: 'div' });
