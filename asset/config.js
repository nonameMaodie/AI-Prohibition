import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import globalVars from "./globalVars.js";

class Config {
	static get #defaultConfig() {
		return {
			record: ['默认', 'all', 'all', 0, false, false],
			addMenu: true, // 是否添加到菜单栏
			remember: true, // 记住界面状态
			zoom: 1.3, // 当前缩放比例
			small: false, // 是否使用小图
			showClosed: false, // 是否显示已关闭的武将包和武将
			volume_audio: 30, // 音效音量
			prohibited: {
				default: [], // 仅点将禁用列表
			},
			fakeProhibited: {
				default: [], // 一般伪禁将列表
				identity_zhu: [], // 主公伪禁将列表
				identity_zhong: [], // 忠臣伪禁将列表
				identity_fan: [], // 反贼伪禁将列表
				identity_nei: [], // 内奸伪禁将列表
				doudizhu_1: [], // 地主伪禁将列表
				doudizhu_2: [], // 二号位农民伪禁将列表
				doudizhu_3: [], // 三号位农民伪禁将列表
				versus_two_1: [], // 一号位2v2伪禁将列表
				versus_two_2: [], // 二号位2v2伪禁将列表
				versus_two_3: [], // 三号位2v2伪禁将列表
				versus_two_4: [], // 四号位2v2伪禁将列表
			}
		}
	}

	/** * @type { '默认'|'评级'|'势力'|'性别' } 当前武将包的分类方式 */
	get currentActiveMode() { return this.remember ? this.record[0] : Config.#defaultConfig.record[0]; }
	set currentActiveMode(value) { this.record[0] = value; }
	/** * @type { string } 当前武将包（'all' 或 武将包id） */
	get currentActivePackId() { return this.remember ? this.record[1] : Config.#defaultConfig.record[1]; }
	set currentActivePackId(value) { this.record[1] = value; }
	/** * @type { string } 当前武将包的分类（‘standard_2008’、‘standard_2013’|'epic'、'legend'|'wei'、'shu'） */
	get currentActivePackCategoryId() { return this.remember ? this.record[2] : Config.#defaultConfig.record[2]; }
	set currentActivePackCategoryId(value) { this.record[2] = value; }
	/** * @type { number } 武将包栏的滚动条位置 */
	get scrollLeft() { return this.remember ? this.record[3] : Config.#defaultConfig.record[3]; }
	set scrollLeft(value) { this.record[3] = value; }
	/** * @type { boolean } 是否在显示“禁将列表” */
	get isCharSelectedActive() { return this.remember ? this.record[4] : Config.#defaultConfig.record[4]; }
	set isCharSelectedActive(value) { this.record[4] = value; }
	/** * @type { boolean } 是否按下了“伪禁”按钮 */
	get isFakeProhibitedActive() { return this.remember ? this.record[5] : Config.#defaultConfig.record[5]; }
	set isFakeProhibitedActive(value) { this.record[5] = value; }
	constructor() {
		let config = game.getExtensionConfig('AI禁将', 'forbidai');
		if (config === void 0 || typeof config !== 'object') {
			game.saveExtensionConfig('AI禁将', 'forbidai', Config.#defaultConfig);
			config = game.getExtensionConfig('AI禁将', 'forbidai');
		}
		// 兼容旧版本配置
		if (Array.isArray(config.bannedList)) {
			if (!config.prohibited) config.prohibited = {};
			if (!config.prohibited.default) config.prohibited.default = [];
			config.prohibited.default.addArray(config.bannedList);
		}
		Object.setPrototypeOf(config, this);
		config.save();
		return config;
	}
	/**
	 * 保存配置
	 * @param { object? } value 配置
	 * @returns { Promise<void> }
	 */
	save = globalVars.debounce(function (value) {
		if (value) {
			Object.deepAssign(this, value);
		}
		this.autoAdjustProperties();
		game.saveExtensionConfigValue('AI禁将', 'forbidai');
	}, null, true);
	/**
	 * 重置为默认配置
	 *  @returns { Promise<void> }
	 */
	saveDefault() {
		return this.save(Config.#defaultConfig);
	}
	/**
	 * 自动增刪配置项
	 */
	autoAdjustProperties(deep = false) {
		const defaultConfig = Config.#defaultConfig;
		Object.keys(this).forEach(key => {
			if (!defaultConfig.hasOwnProperty(key)) {
				delete this[key];
			}
		})
		const fn = function (obj, defaultConfig) {
			Object.keys(defaultConfig).forEach(key => {
				if (obj[key] === void 0) {
					obj[key] = defaultConfig[key];
				}
				if (typeof defaultConfig[key] === 'object') {
					fn(obj[key], defaultConfig[key]);
				}
			})
		};
		fn(this, defaultConfig);
	}
	/**
	 * @returns {"fakeProhibited"|"prohibited"}
	 */
	get prohibitedType() {
		return this.isFakeProhibitedActive ? "fakeProhibited" : "prohibited";
	}
	get prohibitedMode() {
		return this.isFakeProhibitedActive ? globalVars.fakeProhibitedMode : globalVars.prohibitedMode;
	}
	get prohibitedList() {
		return this[this.prohibitedType][this.prohibitedMode];
	}
	set prohibitedList(value) {
		this[this.prohibitedType][this.prohibitedMode] = value;
	}
	get prohibitedDesc() {
		const map = {
			prohibited: {
				default: '仅点将可选禁将',
			},
			fakeProhibited: {
				default: '仅玩家可选伪禁',
				identity_zhu: '主公伪禁',
				identity_zhong: '忠臣伪禁',
				identity_fan: '反贼伪禁',
				identity_nei: '内奸伪禁',
				doudizhu_1: '地主伪禁',
				doudizhu_2: '2号农民伪禁',
				doudizhu_3: '3号农民伪禁',
				versus_two_1: '1号2V2伪禁',
				versus_two_2: '2号2V2伪禁',
				versus_two_3: '3号2V2伪禁',
				versus_two_4: '4号2V2伪禁',
			}
		}
		return map[this.prohibitedType][this.prohibitedMode];
	}
}

const config = new Config();
globalVars.prohibitedList = config.prohibitedList.slice();

export default config;



