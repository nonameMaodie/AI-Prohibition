import { lib, game, ui, get, ai, _status } from "../../noname.js";
import Selector from "./view/Selector.js";
import SelectorController from "./controller/SelectorController.js";
import SelectorModel from "./model/SelectorModel.js";
import globalVars from "./asset/globalVars.js";
import config from "./asset/config.js";
import ployfill from "./asset/polyfill.js";
import history from "./asset/updateHistory.js";
import Toast from "./view/Toast.js";

game.import("extension", function () {

	const latestHistory = history[0];
	const selectorController = new SelectorController();

	return {
		editable: false,
		name: "AI禁将",
		content: function (cfg, pack) {
			/* <-------------------------AI禁将-------------------------> */
			new Selector();
			new SelectorModel();

			!(function () {
				let savedFilter = lib.filter.characterDisabled;
				let stockDisabled = false;
				/**
				 * 从《玄武江湖》抄来的AI禁将
				*/
				lib.filter.characterDisabled = function (i, libCharacter) {
					if (stockDisabled) return savedFilter(i, libCharacter);
					let prohibitedList = config.prohibited.default;
					if (prohibitedList.includes(i)) {
						return true;
					}
					return savedFilter(i, libCharacter);
				};
				/**
				 * 判断是否为本体或者其他扩展的禁将
				 */
				globalVars.forbidai_savedFilter = function (i, libCharacter) {
					stockDisabled = true;
					let result = lib.filter.characterDisabled(i, libCharacter);
					stockDisabled = false;
					return result;
				};
			}());

			/* <-------------------------从《全能搜索》抄来的加入顶部菜单栏-------------------------> */
			if (config.addMenu) {
				const getSystem = setInterval(() => {
					if (ui.system1 || ui.system2) {
						clearInterval(getSystem);
						ui.create.system(`
							<span style="
							  padding: 3px;
							  color: white; 
							  background-color: #fb4343; 
							  font-family: 'shousha';
							  border-radius: 5px;">禁
							</span>`, function () {
							selectorController.openSelector('showSystem');
						});
					}
				}, 500);
			}

			/* <-------------------------伪禁-------------------------> */
			lib.skill._AI禁将_fake_prohibited = {
				trigger: {
					global: 'gameStart',
					player: 'enterGame',
				},
				filter(event, player) {
					return player !== game.me;
				},
				silent: true,
				unique: true,
				priority: Infinity,
				charlotte: true,
				superCharlotte: true,
				/**
				 * 检查有无伪禁武将并返回
				 * @param { Player } target 目标角色
				 * @param { string } mode 模式
				 * @param { string } subMode 当前具体模式
				 * @returns { { case: string, '1'?: string, '2'?: string } }
				 */
				hasWjCharacter(target, mode, subMode) {
					const fakeProhibited = config.fakeProhibited;
					const resFunc = function (target, configName) {
						let res = {};
						if (!fakeProhibited[configName] || !fakeProhibited.default) {
							return res;
						}
						res.case = configName;
						// 检查对应及default配置
						if (fakeProhibited[configName].includes(target.name1)) {
							res[1] = target.name1;
						} else if (configName !== 'default' && fakeProhibited.default.includes(target.name1)) {
							res[1] = target.name1;
						}
						if (target.name2) {
							if (fakeProhibited[configName].includes(target.name2)) {
								res[2] = target.name2;
							} else if (configName !== 'default' && fakeProhibited.default.includes(target.name2)) {
								res[2] = target.name2;
							}
						}

						return res;
					};
					const identity = target.identity;
					if (mode === 'identity') {
						if (identity === 'zhu' || target === game.zhu || target === game.rZhu || target === game.bZhu) {
							return resFunc(target, 'identity_zhu');
						} else if (identity === 'zhong' || target === game.zhong || identity.slice(1) === 'Zhong') {
							return resFunc(target, 'identity_zhong');
						} else if (subMode === 'purple') {
							return resFunc(target, `identity_${String.toLowerCase(identity.slice(1))}`);
						} else {
							return resFunc(target, `identity_${identity}`);
						}
					} else if (mode === 'doudizhu') {
						const seatnum = get.distance(game.zhu, target, 'absolute') + 1;
						if (identity === 'fan') {
							const nongmin1 = fakeProhibited.doudizhu_2;
							const nongmin2 = fakeProhibited.doudizhu_3;
							if (Boolean(nongmin1.length) !== Boolean(nongmin2.length)) {
								return resFunc(target, nongmin1.length ? 'doudizhu_2' : 'doudizhu_3');
							}
						}
						return resFunc(target, `doudizhu_${seatnum}`);
					} else if (mode === 'versus' && subMode === 'two') {
						const seatnum = get.distance(_status.firstAct, game.me, 'absolute') + 1;
						return resFunc(target, `versus_two_${seatnum}`);
					}
					return resFunc(target, 'default');
				},
				/**
				 * 获取 caseName 对应的候选武将列表
				 * @param { string } caseName 伪禁表名
				 * @returns { string[] }
				 */
				getCandidateCharacters(caseName) {
					// 创建对应候选武将池
					if (!_status.AI禁将_fpMap) {
						_status.AI禁将_fpMap = {};

						// 确保全局武将列表存在
						if (!_status.characterlist) {
							game.initCharactertList();
						}

						// 初始化默认候选池
						const fakeProhibited = config.fakeProhibited;
						const defaultProhibited = fakeProhibited.default || [];
						let list = _status.characterlist.slice(0);

						for (let name of defaultProhibited) {
							if (list.includes(name)) {
								list.remove(name);
							}
						}
						_status.AI禁将_fpMap.default = list;
					}

					// 当前case已经初始化
					if (_status.AI禁将_fpMap[caseName]) {
						return _status.AI禁将_fpMap[caseName];
					}

					const fakeProhibited = config.fakeProhibited;

					// 只初始化当前需要的候选列表
					const prohibitedList = fakeProhibited[caseName] || [];
					let list = _status.AI禁将_fpMap.default.slice(0);

					for (let name of prohibitedList) {
						if (list.includes(name)) {
							list.remove(name);
						}
					}
					_status.AI禁将_fpMap[caseName] = list;
					return list;
				},
				async content(event, trigger, player) {
					const mode = get.mode();

					// 查找有无伪禁武将
					const fp = lib.skill._AI禁将_fake_prohibited.hasWjCharacter(player, mode, _status.mode);
					if (!fp[1] && !fp[2]) return;

					// 随机抽取替换武将
					const candidateCharacters = lib.skill._AI禁将_fake_prohibited.getCandidateCharacters(fp.case);
					if (fp[1]) {
						fp[1] = candidateCharacters.randomGet();
					} else {
						fp[1] = player.name1;
					}
					if (!fp[1]) {
						new Toast().info('没有可供候选的武将！');
						return;
					}
					candidateCharacters.remove(fp[1]);
					if (fp[2]) {
						fp[2] = candidateCharacters.randomGet();
						if (!fp[2]) {
							new Toast().info('没有可供候选的武将！');
							return;
						}
					} else {
						fp[2] = player.name2;
					}
					candidateCharacters.remove(fp[2]);

					// 换将前准备
					const originalNames = [player.name, player.name1, player.name2];
					const info1 = get.character(originalNames[1]);
					const info2 = get.character(originalNames[2]);
					let hiddenSkills = [];
					if (mode === 'guozhan') {
						// 国战移除对应暗置技能
						if (fp[1] !== originalNames[1]) {
							hiddenSkills.addArray(info1.skills);
						}
						if (fp[2] !== originalNames[2]) {
							hiddenSkills.addArray(info2.skills);
						}
						player.hiddenSkills.removeArray(hiddenSkills);
					} else {
						// 隐匿武将亮将
						if (fp[1] !== originalNames[1] && info1.hasHiddenSkill) {
							hiddenSkills.addArray(info1.skills);
						}
						if (fp[2] !== originalNames[2] && info2.hasHiddenSkill) {
							hiddenSkills.addArray(info2.skills);
						}
						if (hiddenSkills.length) {
							// 移除隐匿武将技能，避免亮将触发
							player.removeSkill('g_hidden_ai');
							player.hiddenSkills.removeArray(hiddenSkills);
							await player.showCharacter(2, false);
						}
					}

					// 换将
					player.init(fp[1], fp[2]);

					/*if (mode !== 'guozhan') {
						// 非隐匿武将亮将
						let showCharacterIndex;
						if (fp[1] !== originalNames[1] && !get.character(fp[1]).hasHiddenSkill) {
							showCharacterIndex = 0;
						}
						if (fp[2] !== originalNames[2] && !get.character(fp[2]).hasHiddenSkill) {
							if (showCharacterIndex === 0) {
								showCharacterIndex = 2;
							} else {
								showCharacterIndex = 1;
							}
						}
						if (typeof showCharacterIndex === 'number') {
							await player.showCharacter(showCharacterIndex, false);
						}
					}*/

					// 伪禁记录
					let characterNames = [];
					let characterIndex;
					if (fp[1] !== originalNames[1]) {
						// 主将已变更
						if (player.isUnseen(0)) {
							characterNames.push('未知');
						} else {
							characterNames.push(lib.translate[fp[1]]);
						}
						characterIndex = '主将';
					}
					if (fp[2] !== originalNames[2]) {
						// 副将已变更
						if (player.isUnseen(1)) {
							characterNames.push('未知');
						} else {
							characterNames.push(lib.translate[fp[2]]);
						}
						if (characterNames.length === 1) {
							characterIndex = '副将';
						} else {
							// 主副都变更则直接用“武将牌”代替
							characterIndex = '武将牌';
						}
					} else if (!fp[2]) {
						// 单将模式
						characterIndex = '武将牌';
					}
					let seatnum = player.getSeatNum();
					if (_status.firstAct) {
						seatnum = get.distance(_status.firstAct, player, 'absolute') + 1;
					}
					// if (!seatnum && originalNames[0].length > 7 && originalNames[0].startsWith('unknown')) {
					// 	seatnum = Number.parseInt(originalNames[0].slice(7)) + 1;
					// }
					if (!seatnum && _status.cheat_seat) {
						const seat = _status.cheat_seat.link;
						let playerFirst;
						if (seat == 0) {
							playerFirst = game.me;
						} else {
							playerFirst = game.players[game.players.length - seat];
						}
						if (!playerFirst) {
							playerFirst = game.me;
						}
					}
					if (!seatnum && game.zhu) {
						seatnum = get.distance(game.zhu, player, 'absolute') + 1;
					}
					if (seatnum > 0) {
						// 有座位号用座次表示
						if (characterNames.some((i) => i !== '未知')) {
							game.log(
								`#b${get.cnNumber(seatnum, true)}号位`,
								'将',
								`#y${characterIndex}`,
								'变更为',
								`#b${characterNames.join('、')}`
							);
						} else {
							// 主副将均不可见
							game.log(`#b${get.cnNumber(seatnum, true)}号位`, '变更了', `#y${characterIndex}`);
						}
					} else {
						// 无座位号用更换前的名字代替
						if (characterNames.some((i) => i !== '未知')) {
							game.log(
								`#b${lib.translate[originalNames[0]]}`,
								'将',
								`#y${characterIndex}`,
								'变更为',
								`#b${characterNames.join('、')}`
							);
						} else {
							game.log(`#b${lib.translate[originalNames[0]]}`, '变更了', `#y${characterIndex}`);
						}
					}

					// 主公加成
					const isZhu = (target) => {
						switch (get.mode()) {
							case 'identity':
								if (target.isZhu && target.identityShown) {
									// 明主
									return true;
								}
								if (target === game.zhong) {
									// 明忠
									return true;
								}
								return false;
							case 'doudizhu':
								return target.identity === 'zhu';
							case 'versus':
								if (_status.mode === 'four' || _status.mode === 'guandu') {
									return target.isZhu;
								}
								return target === game.friendZhu || target === game.enemyZhu;
						}
					};
					if (isZhu(player) && !player.isInitFilter('noZhuHp')) {
						player.maxHp++;
						player.hp++;
					}
					await player.update();

					// 变更势力
					let newGroups = [];
					if (!player.isUnseen(1)) {
						newGroups = get.is.double(fp[1], true) || [get.character(fp[1]).group];
					} else if (fp[2] && !player.isUnseen(2)) {
						newGroups = get.is.double(fp[2], true) || [get.character(fp[2]).group];
					}
					if (get.config('choose_group') && (newGroups.includes('shen') || newGroups.includes('western'))) {
						newGroups.addArray(lib.group);
						newGroups.removeArray(['shen', 'western']);
					}
					if (newGroups.length) {
						if (newGroups.length === 1) {
							await player.changeGroup(newGroups[0], false);
						} else {
							let groups = [];
							for (let i of newGroups) {
								const zhu = get.zhu(player, null, i);
								if (!zhu) {
									continue;
								}
								if (mode === 'guozhan') {
									await player.changeGroup(i, false);
									break;
								}
								const same = i === zhu.group ? 1 : -1;
								const attitude = get.attitude(player, zhu);
								if (same * attitude > 0) {
									await player.changeGroup(i, false);
									break;
								}
								if (attitude) {
									groups.push(i);
								} else {
									groups.unshift(i);
								}
							}
							if (groups.length) {
								await player.changeGroup(groups[0], false);
							}
						}
					}
				},
			};

			lib.arenaReady.push(() => {
				if (game.getExtensionConfig('AI禁将', 'forbidai_load_aiyh')) return;
				if (Array.isArray(lib.config.extension_AI优化_wj)) {
					const originalConfig = {
						default: lib.config.extension_AI优化_wj || [],
						identity_zhu: lib.config.extension_AI优化_zhu || [],
						identity_zhong: lib.config.extension_AI优化_zhong || [],
						identity_fan: lib.config.extension_AI优化_fan || [],
						identity_nei: lib.config.extension_AI优化_nei || [],
						doudizhu_1: lib.config.extension_AI优化_dizhu || [],
						doudizhu_2: lib.config.extension_AI优化_nongmin || [],
						doudizhu_3: lib.config.extension_AI优化_nongmin || [],
					};
					let acc = [0, 0];
					for (let i in originalConfig) {
						if (originalConfig[i].length) {
							acc[0]++;
							acc[1] += originalConfig[i].length;
						}
					}
					if (acc[0] && confirm('是否加载《AI优化》的伪禁数据到《AI禁将》？')) {
						const fakeProhibited = config.fakeProhibited;
						for (let i in originalConfig) {
							if (originalConfig[i].length) {
								fakeProhibited[i].addArray(originalConfig[i]);
							}
						}
						config.save();
						game.saveExtensionConfig('AI禁将', 'forbidai_load_aiyh', true);
						alert(`已成功将${get.cnNumber(acc[0])}张伪禁表共计${acc[1]}条数据添加至《AI禁将》中`);
					}
				}
			})

		},
		precontent: function () {
			ployfill.run();
		},
		config: {
			"updateInfo": {
				name: `版本：${latestHistory.version}`,
				init: '1',
				unfrequent: true,
				intro: "查看此版本更新说明",
				"item": {
					"1": "<font color=#2cb625>更新说明",
				},
				"textMenu": function (node, link) {
					lib.setScroll(node.parentNode);
					node.parentNode.style.transform = "translateY(-100px)";
					node.parentNode.style.width = "350px";
					node.style.cssText = "width: 350px; padding:5px; box-sizing: border-box;";
					let str = '';
					const changeLog = latestHistory.changes;
					for (let i of changeLog) {
						str += `·${i}<br>`;
					}
					if (history.length > 1) {
						str += "<br><---------分割线---------><br>历史更新内容：<br>"
						for (let i = 1; i < history.length; i++) {
							str += `<br><b>${history[i].version}</b> (${history[i].date})<br>`;
							for (let j of history[i].changes) {
								str += `·${j}<br>`;
							}
						}
					}
					node.innerHTML = str;
				},
			},

			"date": {
				name: '更新日期：' + latestHistory.date,
				clear: true,
				nopointer: true,
			},

			"compatibility": {
				name: '运行环境：' + latestHistory.compatibility,
				clear: true,
				nopointer: true,
			},

			"forbidai_bg": {
				name: "AI禁将界面背景图片",
				init: "huanhua",
				unfrequent: true,
				intro: "更改背景图（实时生效）",
				"item": {
					"xitong": "跟随系统",
					"huanhua": "幻化之战",
					"erqiao": "大乔小乔",
					"yueye": "仲夏月夜",
				},
				"textMenu": function (node, link) {
					lib.setScroll(node.parentNode);
					node.parentNode.style.transform = "translateY(-100px)";
					//node.parentNode.style.height = "710px";
					node.parentNode.style.width = "200px";
					node.style.cssText = "width: 200px; height: 115px; position:relative; padding:0; border-radius:10px; color: white; box-sizing:border-box;";
					if (link === "xitong") {
						node.style.height = "38px";
						node.innerHTML = '<div style="font-family: xingkai, xinwei;line-height:28px; text-align: center; width: 200px; height:30px; box-sizing:border-box; border-radius:10px; border:2px solid gray; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">跟随系统</div>';
					}
					else {
						const div = ui.create.div();
						div.style.cssText += `
							background:url(${lib.assetURL}extension/AI禁将/image/${link}_bg.jpg) no-repeat right center/cover;
							width: 192px;
							height: 108px;
							text-align: center;
							box-sizing: border-box;
							border-radius: 10px;
							border: 2px solid gray;
							padding-top: 18px;
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);">`;
						div.innerHTML = `
							<span style="font-family: xingkai, xinwei;">
								${node.innerText}
							</span>`
						node.innerHTML = '';
						node.appendChild(div);
					}
				},
			},

			"open_forbidai": {
				"clear": true,
				name: '<ins style="color:#36C0F5">打开禁将界面</ins>',
				onclick: function () {
					lib.config.touchscreen ? setTimeout(() => selectorController.openSelector(), 100) : selectorController.openSelector();
				},
			},

			"open_md_doc": {
				"clear": true,
				name: '<ins style="color:#2cb625">扩展说明文档</ins>',
				onclick: function () {
					const readerUrl = lib.assetURL + 'extension/AI禁将/readMD/index.html';
					const mdUrl = lib.assetURL + 'extension/AI禁将/README.md';

					const a = document.createElement('a');
					a.href = mdUrl;
					const absoluteMDUrl = a.href; // 使用a标签的特性获取md文件的绝对路径

					const iframe = document.createElement('iframe');
					iframe.src = readerUrl;
					iframe.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; border: none;"
					iframe.setAttribute('allowfullscreen', '');
					iframe.addEventListener('load', async () => {
						const markdownContent = await game.promises.readFileAsText(mdUrl);
						iframe.contentWindow.postMessage({
							type: 'initialized-markdown',
							data: markdownContent,
							absoluteMDUrl,
						})
					})
					ui.window.appendChild(iframe);
				},
			},

			"repositor2": {
				clear: true,
				name: `点击复制gitee仓库地址`,
				async onclick() {
					if (navigator.clipboard && navigator.clipboard.writeText) {
						await navigator.clipboard.writeText("https://gitee.com/ninemangos/AI-Prohibition");
						new Toast().success('复制成功！');
					} else {
						new Toast().error('复制失败！');
					}
				}
			},
		}, help: {}, package: {
			character: {
				character: {
				},
				translate: {
				},
			},
			card: {
				card: {
				},
				translate: {
				},
				list: [],
			},
			skill: {
				skill: {
				},
				translate: {
				},
			},
			intro: "一个轻量级、多功能的禁将扩展, 感谢《玄武江湖》《全能搜索》等扩展的代码参考。",
			author: "芒果🥭、157",
			diskURL: "",
			forumURL: "",
			version: latestHistory.version,
		}, files: { "character": [], "card": [], "skill": [], "audio": [] }
	}
});
