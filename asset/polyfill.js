import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import utils from "../asset/utils.js";

class Ployfill {
	run() {
		if (typeof Object.deepAssign !== 'function') {
			Object.defineProperty(Object, 'deepAssign', {
				value: function deepAssign(target, ...sources) {
					if (target == null) {
						throw new TypeError('Cannot convert undefined or null to object');
					}

					// 将 target 转换为对象
					target = Object(target);

					for (let source of sources) {
						if (source == null) continue; // 跳过 null 或 undefined

						const keys = Object.keys(source);
						for (const key of keys) {
							const descriptor = Object.getOwnPropertyDescriptor(source, key);

							// 如果是可枚举属性
							if (descriptor && descriptor.enumerable) {
								const value = source[key];

								// 判断是否是对象或数组，并递归处理
								if (value && typeof value === 'object' && !Array.isArray(value)) {
									if (!target[key] || typeof target[key] !== 'object') {
										target[key] = {};
									}
									deepAssign(target[key], value); // 递归调用
								} else {
									// 否则直接赋值
									target[key] = value;
								}
							}
						}
					}

					return target;
				},
				configurable: false,
				writable: false
			});
		}

		game.saveExtensionConfigValue = game.saveExtensionConfigValue || function (extension, key) {
			return game.saveExtensionConfig(extension, key, game.getExtensionConfig(extension, key))
		};

		if (!game.checkDir) {
			const deviceType = utils.getDeviceType();
			if (deviceType === 'cordova') {
				const nonameInitialized = localStorage.getItem("noname_inited");
				game.checkDir = function (dir, callback, onerror) {
					let path = lib.path.join(nonameInitialized, dir);
					window.resolveLocalFileSystemURL(
						path,
						entry => {
							callback?.(entry.isDirectory ? 1 : 0);
						},
						error => {
							if ([FileError.NOT_FOUND_ERR, FileError.NOT_READABLE_ERR].includes(error.code)) {
								callback?.(-1);
							} else {
								onerror?.(new Error(`Code: ${error.code}`));
							}
						}
					);
				};
			} else if (deviceType === 'electron') {
				game.checkDir = function (dir, callback, onerror) {
					let dirPath = __dirname + "/" + dir;
					// 如果路径不存在，则无需再尝试获取信息
					if (!lib.node.fs.existsSync(dirPath)) {
						callback?.(-1);
						return;
					}
					lib.node.fs.stat(dirPath, (err, stat) => {
						if (err) {
							// 如果是无法访问的情况，则按照函数需求返回-1
							if (err.code === "EACCES") {
								callback?.(-1);
							}
							// 反之则直接将err传入onerror
							else {
								onerror?.(err);
							}
							return;
						}
						callback?.(stat.isDirectory() ? 1 : 0);
					});
				};
			} else {
				game.checkDir = function (dir, callback, onerror) {
					game.getFileList(dir, (folders, files) => { callback?.(1) }, e => {
						callback?.(-1);
						onerror(e);
					})
				};
			}
		}

		if (!game.promises) game.promises = {};
		const promises = {
			getFileList(dir) {
				return new Promise((resolve, reject) => {
					// @ts-expect-error ignore
					game.getFileList(dir, (folders, files) => resolve([folders, files]), reject);
				});
			},
			removeFile(filename) {
				return new Promise((resolve, reject) => {
					// @ts-expect-error ignore
					game.removeFile(filename, err => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				})
			},
			writeFile(data, path, name) {
				return new Promise((resolve, reject) => {
					game.writeFile(data, path, name, resolve);
				}).then(result => {
					return new Promise((resolve, reject) => {
						if (result instanceof Error) {
							reject(result);
						} else {
							resolve(result);
						}
					});
				});
			},
			checkDir(dir) {
				return new Promise((resolve, reject) => {
					game.checkDir(dir, resolve, reject);
				});
			},
			readFileAsText(filename) {
				return new Promise((resolve, reject) => {
					// @ts-expect-error ignore
					game.readFileAsText(filename, resolve, reject);
				});
			}
		}
		for (const key in promises) {
			if (!game.promises[key]) game.promises[key] = promises[key];
		}

		if (!lib.init.promises) lib.init.promises = {};
		const lib_promises = {
			json(url) {
				return new Promise((resolve, reject) => lib.init.json(url, resolve, reject));
			}
		}
		for (const key in lib_promises) {
			if (!lib.init.promises[key]) lib.init.promises[key] = lib_promises[key];
		}

	}
}

export default new Ployfill();
