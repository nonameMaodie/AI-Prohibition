import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import globalVars from "../asset/globalVars.js";
import config from "../asset/config.js";

export default class SelectorModel {
	/** * @type { string[] } */
	openPackList = [];
	closedPackList = [];
	openCharactersId = [];
	closedCharactersId = [];
	constructor() {
		globalVars.model = this;
	}
	/**
	 * 获取所有的武将包id数组，数组的首项加上 'all'
	 */
	/**
	 * @param {boolean} includesClosed 是否包含已关闭的武将包
	 */
	getPackListId(includesClosed) {
		if (!this.openPackList.length && !this.closedPackList.length) {
			for (let i = 0; i < lib.config.all.characters.length; i++) {
				if (lib.config.characters.includes(lib.config.all.characters[i])) {
					this.openPackList.push(lib.config.all.characters[i]);
				} else {
					this.closedPackList.push(lib.config.all.characters[i]);
				}
			}
			for (let i in lib.characterPack) {
				if (!lib.config.all.characters.includes(i) && Object.keys(lib.characterPack[i]).length) {
					this.openPackList.push(i);
				}
			}
		}
		return includesClosed ? ['all', ...this.openPackList, ...this.closedPackList] : ['all', ...this.openPackList];
	}
	/**
	 * 获取所有的武将包分类id数组，数组的首项加上 'all'
	 */
	getPackCategoriesId(includesClosed) {
		const mode = config.currentActiveMode;
		const pack = config.currentActivePackId;
		switch (mode) {
			case '默认':
				return ['all', ...Object.keys(lib.characterSort[pack] || {})];
			case '评级':
				return ['all', ...Object.keys(lib.rank.rarity)];
			case '势力':
				const allPacks = this.getPackListId(includesClosed);
				allPacks.shift();
				return ['all', ...new Set(allPacks.flatMap(pack => Object.values(lib.characterPack[pack])).map(obj => obj.group || obj[1]))];
			case '性别':
				return ['all', 'male', 'female', 'double', ''];
		}
	}
	/**
	 * 获取所有的武将id数组，并将返回结果缓存在 this.#allCharactersId 中
	 * @param {boolean} includesClosed 是否包含已关闭的武将包
	 */
	getAllCharactersId(includesClosed) {
		if (!this.openCharactersId.length && !this.closedCharactersId.length) {
			this.openCharactersId = this.openPackList.flatMap(pack => Object.keys(lib.characterPack[pack]));
			this.closedCharactersId = this.closedPackList.flatMap(pack => Object.keys(lib.characterPack[pack]));
		}
		return includesClosed ? [...this.openCharactersId, ...this.closedCharactersId] : [...this.openCharactersId];
	}
	/**
	 * 获取所有或某一个武将包下的武将id数组
	 * @param { string } pack 'all' 或 武将包id
	 */
	getPackCharactersId(pack, includesClosed) {
		if (pack === 'all') return this.getAllCharactersId(includesClosed);
		return Object.keys(lib.characterPack[pack]);
	}
	/**
	 * 根据当前武将包id、模式和分类等过滤条件来获取武将id数组
	 */
	getCurrentCharactersId(includesClosed) {
		const mode = config.currentActiveMode;
		const pack = config.currentActivePackId;
		const packCategories = config.currentActivePackCategoryId;
		const libCharacter = includesClosed ? Object.assign({}, ...[...this.openPackList, ...this.closedPackList].map(i => lib.characterPack[i])) : lib.character;
		const characters = (() => {
			if (pack === 'all') {
				if (packCategories === 'all') return this.getAllCharactersId(includesClosed);
				switch (mode) {
					case '默认':
						return [];
					case '评级':
						return lib.rank.rarity[packCategories];
					case '势力':
						return this.getAllCharactersId(includesClosed).filter(id => libCharacter[id].group === packCategories || libCharacter[id][1] === packCategories);
					case '性别':
						return this.getAllCharactersId(includesClosed).filter(id => libCharacter[id].sex === packCategories || libCharacter[id][0] === packCategories);
				}
			} else if (packCategories === "all") {
				return Object.keys(lib.characterPack[pack]);
			}

			const packCharactersId = this.getPackCharactersId(pack);
			switch (mode) {
				case '默认':
					return lib.characterSort[pack][packCategories];
				case '评级':
					return packCharactersId.filter(id => lib.rank.rarity[packCategories].includes(id));
				case '势力':
					return packCharactersId.filter(id => lib.characterPack[pack][id].group === packCategories || lib.characterPack[pack][id][1] === packCategories);
				case '性别':
					return packCharactersId.filter(id => lib.characterPack[pack][id].sex === packCategories || lib.characterPack[pack][id][0] === packCategories);
			}
		})()
		return characters;
	}
	/**
	 * 根据 getCurrentCharactersId 返回的id数组进一步过滤，并去重排序
	 * @param { ((id: string) => boolean)? } filter
	 */
	getCharactersId(filter, includesClosed) {
		let characters = this.getCurrentCharactersId(includesClosed);
		const prohibitedList = config.prohibitedList;
		const prohibitedSet = new Set([...globalVars.prohibitedList, ...prohibitedList]);
		characters = characters.filter(id => {
			if (id === void 0 || !this.getAllCharactersId(includesClosed).includes(id)) return false;
			if (typeof filter === 'function' && !filter(id)) return false;
			if (config.isCharSelectedActive && !prohibitedSet.has(id)) return false;
			return true;
		});
		characters = [...new Set(characters)];
		return characters.sort((a, b) => {
			const configPH = config.prohibitedList;
			const currentPH = globalVars.prohibitedList;
			const AconfigPH = configPH.includes(a);
			const BconfigPH = configPH.includes(b);
			const AcurrentPH = currentPH.includes(a);
			const BcurrentPH = currentPH.includes(b);
			return (AconfigPH - BconfigPH) * 2 + AcurrentPH - BcurrentPH;
			// return !lib.filter.characterDisabled(b) - !lib.filter.characterDisabled(a) +
			// 	!globalVars.forbidai_savedFilter(b) - !globalVars.forbidai_savedFilter(a);
		})
	}
	/**
	 * @param { string } name 
	 * @returns { string[] }
	 */
	getList(name, includesClosed) {
		switch (name) {
			case 'packList': return this.getPackListId(includesClosed);
			case 'packCategories': return this.getPackCategoriesId(includesClosed);
			case 'characters': return this.getCharactersId(null, includesClosed);
		}
		return [];
	}
}
