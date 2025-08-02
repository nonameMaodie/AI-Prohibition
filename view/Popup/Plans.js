import Popup from "./index.js";
import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import config from "../../asset/config.js";
import utils from "../../asset/utils.js";
import globalVars from "../../asset/globalVars.js";
import Toast from "../Toast.js";

/** @extends HTMLLIElement */
class PlanCard {
	/** 
	 * @param { object } info 一个方案的信息，必须拥有 name 和 type 属性
	 */
	constructor(info) {
		const card = document.createElement('li');
		Object.setPrototypeOf(PlanCard.prototype, Object.getPrototypeOf(card));
		Object.setPrototypeOf(card, this);
		if (!info.id) info = card.createInfo(info.name, info.type);
		card.info = info;
		const show = document.createElement('div');
		show.classList.add('show');
		const img = `<img src="${lib.assetURL}extension/AI禁将/image/${info.type === "charactersPool" ? "icon-character" : "icon-locked"}.svg" style="width:20px; height:20px"></img>`;
		show.innerHTML = `<div data-id="title">${img} <label for="planName">${info.name}</label><input id="planName" type="text" maxlength="9"></div><div data-id="shortDesc">${info.shortDesc}</div><div data-id="desc">${info.desc}</div>`;
		const action = document.createElement('div');
		action.classList.add('action');
		action.innerHTML = `
			<span data-id="load">读取</span>
			<span data-id="cover">覆盖</span>
			<span data-id="edit">编辑</span>
			<span data-id="delete">删除</span>
		`;
		card.appendChild(show);
		card.appendChild(action);
		return card;
	}
	/**
	 * 获取文件名
	 * @param { object } info
	 * @returns { string } 
	 */
	getFileName(info) {
		const { name, id } = info;
		return `${name}-${id}.json`.replace(/\\|\/|:|\?|"|\*|<|>|\|/g, ".");
	}
	createInfo(name, type) {
		const info = {};
		info.name = name;
		info.type = type;
		info.id = Date.now().toString(32);
		const prohibitedList = config.prohibitedList;
		if (type === "charactersPool") {
			const length = globalVars.model.getAllCharactersId(config.showClosed).filter(id => !prohibitedList.includes(id)).length;
			info.desc = `（仅启用武将: ${length} 个）`;
			info.shortDesc = `启用: ${length}`;
		} else {
			info.desc = `（禁将数量: ${prohibitedList.length}个）`;
			info.shortDesc = `禁用: ${prohibitedList.length}`;
		}
		info.fileName = this.getFileName(info);
		return info;
	}
}

export default class Plans extends Popup {
	/** @type { number } 最大将池/方案数 */
	static maxCardNum = 30;

	constructor() {
		super(`
			.content{
				display: flex;
				justify-content: space-between;
				gap: 10px;
			}
			.content>div{
				width: 100%;
			}
			.content .add{
				margin-bottom: 10px;
   				padding: 0 5px;
			}
			.content .add img{
				width: 20px;
				vertical-align: text-bottom;
			}
			.content .add span[data-id="text"]{
				font-size: 18px;
			}
			.content ul{
				display: grid;
				gap: 10px;
				list-style: none;
			}
			.content ul>li {
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
			.content ul>li:hover {
				height: 62px;
			}		
			.content ul>li:hover .action{
				opacity: 1;
				transform: translate(0, -50%);
				pointer-events: auto;
			}
			.content ul>li:hover .show>[data-id="desc"] {
				opacity: 1;
				transform: translateY(26px);
				pointer-events: auto;
			}
			.content ul>li:hover .show>[data-id="shortDesc"] {
				opacity: 0;
			}
			.content .show{
				position: relative;
				width: 75%;
			}
			.content .action{
				position: absolute;
				display: grid;
				gap: 10px;
				grid-template-columns: repeat(2, 1fr);
				grid-template-rows: repeat(2, 1fr);
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
			.content .show>[data-id="title"]{
				position: absolute;
			}
			.content .show>[data-id="desc"]{
				position: absolute;
				opacity: 0;
				pointer-events: none;
           		transform: translateY(50px);
            	transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
			}
			.content .show>[data-id="shortDesc"]{
				position: absolute;
				top: 10px;
				opacity: 1;
				pointer-events: none;
				color: #dbdbdb;
           		transform: translate(249px, -50%);
            	transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
			}
			.content .show label[for="planName"] {
				font-size: 22px;
				line-height: 22px;
				font-weight: 550;
				vertical-align: top;
			}
			.content .show label[for="planName"].hidden {
				 display: none; 
			}
			.content .show label[for="planName"] +input{
				 width: 100px;
				 display: none;
				 vertical-align: top;
			}
			.content .show label[for="planName"].hidden +input{
				 display: inline;
			}
			.content .show div[data-id="desc"] {
				font-size: 15px;
				color: #dbdbdb;
			}
			.content .action>span {
				font-size: 16px;
				cursor: pointer;
			}
			.content .action>span:hover {
				color: #83AAEF;
			}
		`);
		this.setCaption('将池与方案');
		this.readAllJSON()
			.then(plans => {
				const charactersPool = ui.create.div('.charactersPool', `
							<div class="add"><img src="${lib.assetURL}extension/AI禁将/image/add.png" style="cursor: pointer;"><span data-id="text"> 添加新的将池</span></div>
							<ul></ul>
						`);
				const prohibitedPlan = ui.create.div('.prohibitedPlan', `
							<div class="add"><img src="${lib.assetURL}extension/AI禁将/image/add.png" style="cursor: pointer;"><span data-id="text"> 添加新的方案</span></div>
							<ul></ul>
						`);
				const charactersPoolUl = charactersPool.querySelector('ul');
				const prohibitedPlanUl = prohibitedPlan.querySelector('ul');
				const addPlan = info => (info.type === "charactersPool" ? charactersPoolUl : prohibitedPlanUl).appendChild(new PlanCard(info));
				utils.executeChunkedTasks(plans, addPlan, 30, () => {
					[charactersPool, prohibitedPlan].forEach(ele => {
						const textnode = ele.querySelector('span[data-id="text"]');
						if (ele.querySelectorAll('ul>li').length >= Plans.maxCardNum) {
							textnode.innerHTML += '（已达上限）';
						}
					})
				});
				this.node.content.node = { charactersPool, prohibitedPlan };
				this.setContent(charactersPool);
				this.setContent(prohibitedPlan);
				this.#addListener();
			});
	}
	/** 
	 * @param { 'charactersPool' | 'prohibitedPlan' } type
	 * @param { string? } name
	 * @returns { PlanCard } */
	createNewPlanCard(type, name) {
		const info = {};
		info.type = type;
		if (!name) {
			const lis = this.node.content.querySelectorAll('ul>li');
			let str = type === 'charactersPool' ? '将池' : '方案';
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
		return new PlanCard(info);
	}
	#addListener() {
		this.node.content.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', e => {
			if (e.target.closest('.content .add')) {
				//添加按钮
				utils.playAudio('click1');
				const type = e.target.closest('.charactersPool') ? 'charactersPool' : 'prohibitedPlan';
				const cards = Array.from(e.target.closest('.content .add').nextElementSibling.childNodes);
				game.prompt(`请输入新的${type === 'charactersPool' ? '将池名' : '方案名'}` + '<br><font size="1px">（直接点击“确定”使用默认名称）</font>', null, result => {
					if (typeof result !== 'string') return;
					const cardName = result.trim();
					if (cards.some(card => card.info.name === cardName)) {
						alert("命名有重复！");
						return;
					}
					const card = this.createNewPlanCard(type, cardName);
					const ul = this.node.content.querySelector(type === 'charactersPool' ? '.charactersPool ul' : '.prohibitedPlan ul');
					let count = ul.childElementCount;
					if (count >= Plans.maxCardNum) return;
					this.writeJSON(card.info)
						.then(() => {
							ul.appendChild(card);
							count++;
							const textnode = this.node.content.querySelector(('.' + type + ' .add span[data-id="text"]'))
							if (count >= Plans.maxCardNum && !textnode.innerHTML.includes('（已达上限）')) {
								textnode.innerHTML += '（已达上限）';
							}
							new Toast().info(`“${card.info.name}”已添加至extension/AI禁将/plans`);
						})
						.catch(e => {
							new Toast().error("添加失败");
							console.error("添加失败，错误信息：" + e);
						});

				})
			} else if (e.target.closest('.content ul>li>.action')) {
				switch (e.target.getAttribute('data-id')) {
					case 'load': {
						utils.playAudio('click1');
						const card = e.target.closest('.content ul>li');
						this.readJSON(card.info.fileName, true)
							.then(data => {
								globalVars.prohibitedList = data.prohibitedList;
								config.prohibitedList = globalVars.prohibitedList.slice();
								config.save();
								new Toast().success(`读取“${card.info.name}”成功！`);
								globalVars.selector.renderCharacterList();
							})
							.catch((e) => {
								new Toast().error(`读取失败`);
								console.error(`读取失败！错误信息：${e}`);
							});
						break;
					}
					case 'cover': {
						utils.playAudio('click1');
						const ul = e.target.closest('.content ul');
						const type = e.target.closest('.charactersPool') ? 'charactersPool' : 'prohibitedPlan';
						const oldCard = e.target.closest('.content ul>li');
						game.prompt(`请输入新的${type === 'charactersPool' ? '将池名' : '方案名'}` + '<br><font size="1px">（直接点击“确定”使用原名覆盖）</font>', null, result => {
							if (typeof result !== 'string') return;
							const cardName = result.trim() || oldCard.info.name;
							const newCard = this.createNewPlanCard(type, cardName);
							this.deleteJSON(oldCard.info.fileName)
								.then(() => {
									return this.writeJSON(newCard.info);
								})
								.then(() => {
									ul.replaceChild(newCard, oldCard);
									const typeName = type === 'charactersPool' ? '将池' : '方案';
									new Toast().info(`“${newCard.info.name}”已覆盖原${typeName}！`);
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
						const name = e.target.closest('.content ul>li').querySelector('label[for="planName"]');
						const input = name.nextElementSibling;
						this.validateInput(name, input);
						break;
					}
					case 'delete': {
						utils.playAudio('click1');
						const oldCard = e.target.closest('.content ul>li');
						const typeName = oldCard.info.type === 'charactersPool' ? '将池' : '方案';
						if (!confirm(`确定删除此${typeName}吗？`)) return;
						const ul = e.target.closest('.content ul');
						this.deleteJSON(oldCard.info.fileName)
							.then(() => {
								oldCard.remove();
								if (ul.childElementCount < Plans.maxCardNum) {
									const text = ul.previousElementSibling.querySelector('span[data-id="text"]');
									text.innerHTML = text.innerHTML.replace('（已达上限）', '');
								}
							})
							.catch(e => {
								new Toast().error("删除失败");
								console.error("删除失败，错误信息：" + e);
							});
						break;
					}
				}
			}
		});
		this.node.content.addEventListener('dblclick', (e) => {
			if (e.target.matches('label[for="planName"]')) {
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
		const card = name.closest('.content ul>li');
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
			if (value.match(/[\\|\/|:|\?|"|\*|<|>|\|]/g)) {
				alert("请勿使用特殊字符！");
				return;
			}
			const oldFileName = card.info.fileName;
			const info = Object.assign({}, card.info);
			info.name = value;
			const newFileName = card.getFileName(info);
			info.fileName = newFileName;
			this.renameJSON(oldFileName, newFileName)
				.then(() => {
					return this.readJSON(newFileName)
				})
				.then(readInfo => {
					Object.assign(readInfo, info);
					return new Promise(resolve => game.writeFile(JSON.stringify(readInfo, Object.keys(readInfo).remove("fileName"), 2), `extension/AI禁将/plans`, newFileName, data => resolve(data)));
				}, e => console.error(e))
				.then(() => {
					card.querySelector('label[for="planName"]').innerHTML = value;
					Object.assign(card.info, info);
				})
				.catch(e => {
					new Toast().error('重命名失败');
					console.error(e);
				})
		}
	}
	async readJSON(fileName, parse = false) {
		const info = await lib.init.promises.json(`${lib.assetURL}extension/AI禁将/plans/${fileName}`);
		if (!parse) return info;
		if (info.type === "charactersPool") {
			info.prohibitedList = globalVars.model.getAllCharactersId(config.showClosed).filter(id => !info.charactersPool.includes(id));
			delete info.charactersPool;
		}
		return info;
	}
	async oldReadAllJSON() {
		const [folders, files] = await game.promises.getFileList(`extension/AI禁将/plan`);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const info = await lib.init.promises.json(`${lib.assetURL}extension/AI禁将/plan/${file}`);
				info.prohibitedList = info.bannedList.slice();
				await game.promises.removeFile(`extension/AI禁将/plan/${file}`);
				await game.promises.writeFile(JSON.stringify(info, Object.keys(info).remove("fileName"), 2), `extension/AI禁将/plans`, file);
			}
			await game.promises.removeDir('extension/AI禁将/plan');
		}
	}
	/**
	 * 读取所有的JSON文件
	 * @returns { Promise<object> }
	 */
	async readAllJSON() {
		const result = await game.promises.checkDir('extension/AI禁将/plan');
		if (result === 1) await this.oldReadAllJSON();
		const [folders, files] = await game.promises.getFileList(`extension/AI禁将/plans`);
		const plans = [];
		for (const file of files) {
			if (file.endsWith('.json')) {
				const info = await this.readJSON(file);
				info.shortDesc = info.charactersPool ? `启用: ${info.charactersPool.length}` : `禁用: ${info.prohibitedList.length}`;
				for (const key in info) {
					if (['charactersPool', 'prohibitedList'].includes(key)) delete info[key];
				}
				info.fileName = file;
				plans.push(info);
			}
		}
		plans.sort((planA, planB) => parseInt(planA.id, 32) - parseInt(planB.id, 32));
		return plans;
	}
	/**
	 * 写入JSON文件
	 * @param { PlanCard } PlanCard
	 * @returns { Promise }
	 */
	async writeJSON(info) {
		const info2 = Object.assign({}, info);
		if (info2.type === "charactersPool") {
			info2.prohibitedList = null;
			info2.charactersPool = globalVars.model.getAllCharactersId(config.showClosed).filter(id => !config.prohibitedList.includes(id));
		} else {
			info2.charactersPool = null;
			info2.prohibitedList = config.prohibitedList.slice();
		}
		const fileName = info2.fileName;
		await game.promises.writeFile(JSON.stringify(info2, Object.keys(info2).remove("fileName", "shortDesc"), 2), `extension/AI禁将/plans`, fileName);
	}
	/**
	 * 删除JSON文件
	 * @param { PlanCard } PlanCard
	 * @returns { Promise }
	 */
	async deleteJSON(fileName) {
		await game.promises.removeFile(`extension/AI禁将/plans/${fileName}`);
	}
	/**
	 * 重命名JSON文件
	 * @param { string } oldFileName 旧文件名
	 * @param { string } newFileName 新文件名
	 * @returns { Promise }
	 */
	async renameJSON(oldFileName, newFileName) {
		await utils.renameFile(`extension/AI禁将/plans/` + oldFileName, newFileName);
	}
}

customElements.define('selector-popup-plan', Plans);
