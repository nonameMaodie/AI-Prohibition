import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import globalVars from "../../asset/globalVars.js";

export default class Help extends HTMLIFrameElement {
	constructor() {
		super();
		const readerUrl = lib.assetURL + 'extension/AI禁将/readMD/index.html';
		const mdUrl = lib.assetURL + 'extension/AI禁将/README.md';

		const a = document.createElement('a');
		a.href = mdUrl;
		const absoluteMDUrl = a.href; // 使用a标签的特性获取md文件的绝对路径

		this.src = readerUrl;
		this.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; border: none;"
		this.setAttribute('allowfullscreen', '');
		this.addEventListener('load', async () => {
			const markdownContent = await game.promises.readFileAsText(mdUrl);
			this.contentWindow.postMessage({
				type: 'initialized-markdown',
				data: markdownContent,
				absoluteMDUrl,
			})
		})
		globalVars.selector.appendChild(this);
	}
}
customElements.define('selector-popup-help', Help, { extends: 'iframe' });
