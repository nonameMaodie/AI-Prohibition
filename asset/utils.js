import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import config from "./config.js";

class Utils {
	frequencyTimes = 0;

	/** @type { boolean } */
	alerting = false;
	path = this.getDeviceType() === "electron" ? lib.node.path : void 0;
	/**
	 * @param { string } name 音频名
	 */
	playAudio(name) {
		if (config.volume_audio === 0) return;
		const audio = new Audio(`${lib.assetURL}extension/AI禁将/audio/${name.replace(".mp3", "")}.mp3`);
		audio.volume = config.volume_audio / 120;
		audio.autoplay = true;
		audio.oncanplay = evt => Promise.resolve(audio.play()).catch(e => console.error(e));
		audio.onended = evt => audio.remove();
		audio.onerror = evt => audio.remove();
		return audio;
	}
	logFrequency() {
		if (this.frequencyTimesTimer) return;
		this.frequencyTimesTimer = setInterval(() => {
			console.log('频率：', this.frequencyTimes);
			this.frequencyTimes = 0;
		}, 1000);
	}
	/**
	 * 用于统计一段代码的执行频率，测试用
	 * 
	 */
	setFrequencyTimes() {
		this.logFrequency();
		this.frequencyTimes++;
	}

	/**
	 * 异步alert弹窗
	 * @param { string } str 弹窗文本
	 */
	asyncAlert(str) {
		if (this.alerting) return;
		this.alerting = true;
		return new Promise(resolve => {
			game.prompt(str, "alert", () => {
				this.alerting = false;
				resolve(true);
			});
		});
	}
	getDeviceType() {
		if (window.cordova) {
			return 'cordova';
		} else if (typeof window.require === "function") {
			return 'electron';
		}
		return 'other';
	}
	/**
	 * 重命名文件
	 * @param { string } oldPath 旧路径名
	 * @param { string } newFileName 新文件名
	 */
	renameFile(oldPath, newFileName) {
		return new Promise((resolve, reject) => {
			if (this.getDeviceType() === "electron") {
				const newPath = this.path.join(oldPath.substring(0, oldPath.lastIndexOf("/")), newFileName);
				lib.node.fs.rename(__dirname + "/" + oldPath, __dirname + "/" + newPath, function (err, data) {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			} else if (this.getDeviceType() === "cordova") {
				const nonameInitialized = localStorage.getItem("noname_inited");
				// 解析当前文件的文件系统 URL
				window.resolveLocalFileSystemURL(nonameInitialized + oldPath, function (fileEntry) {
					// 获取目标目录的父目录
					fileEntry.getParent(function (parentDirectoryEntry) {
						// 使用 moveTo 方法重命名文件
						fileEntry.moveTo(parentDirectoryEntry, newFileName, function (newFileEntry) {
							// 文件重命名成功
							resolve(null, newFileEntry);
						}, reject);
					}, reject);
				}, reject);
			}
		});
	}
	/**
	 * 分块执行任务
	 * @param { Array } tasks 需要执行的所有任务
	 * @param { function } runFunc 执行单个任务的回调
	 * @param { number } runSize 分块大小
	 * @param { function } [finallyFunc] 所有任务执行完毕的回调
	 */
	executeChunkedTasks(tasks, runFunc, runSize, finallyFunc = () => { }) {
		const subTasks = tasks.slice(0, runSize);
		if (!subTasks.length) {
			finallyFunc();
			return;
		}
		requestAnimationFrame(() => {
			subTasks.forEach(task => runFunc(task));
			this.executeChunkedTasks(tasks.slice(runSize), runFunc, runSize, finallyFunc);
		});
	}
	/**
	 * 打印单个武将包信息，测试用
	 * @param { string } pack 武将包id
	 */
	getPackInfo(pack) {
		console.group()
		let keys = Object.keys(lib.characterPack[pack]);
		let values = Object.values(lib.characterPack[pack]);
		console.log('总数', '-------------------------');
		console.log(lib.translate[pack + '_character_config'], '所有武将数:', keys.length);
		const gender = [...new Set(values.map(value => value.sex))];
		const group = [...new Set(values.map(value => value.group))];
		console.log('性别信息', '-------------------------');
		gender.forEach(g => console.log(lib.translate[g], keys.filter(key => lib.characterPack[pack][key].sex === g).length));
		console.log('势力信息', '-------------------------');
		group.forEach(g => console.log(lib.translate[g], keys.filter(key => lib.characterPack[pack][key].group === g).length));
		console.log('评级信息', '-------------------------');
		Object.keys(lib.rank.rarity).forEach(r => console.log(lib.translate[r], lib.rank.rarity[r].filter(k => keys.includes(k)).length))
		const sorts = Object.keys(lib.characterSort[pack] || {});
		console.log('分包信息', '-------------------------');
		sorts.forEach(s => console.log(lib.translate[s], Object.keys(lib.characterSort[pack][s]).length))
		console.groupEnd();
	}
	sortByOrder(uniqueArr, orderArr) {
		if (!orderArr || !orderArr.length) return uniqueArr.slice();
		const orderMap = new Map();
		orderArr.forEach((item, index) => {
			orderMap.set(item, index);
		});

		return [...uniqueArr].sort((a, b) => {
			const indexA = orderMap.has(a) ? orderMap.get(a) : Infinity;
			const indexB = orderMap.has(b) ? orderMap.get(b) : Infinity;
			return indexA - indexB;
		});
	}
}

export default new Utils();
