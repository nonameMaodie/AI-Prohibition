import { lib, game, ui, get, ai, _status } from "../../../noname.js";

lib.init.css(lib.assetURL + 'extension/AI禁将/view', "Toast");//调用css样式
class Toast extends HTMLDivElement {
	types = ['success', 'error', 'info', 'warn'];

	constructor() {
		super();
		this.id = 'cus-toast';
	}

	show(message, type) {
		ui.window.appendChild(this);

		this.textContent = message;
		this.classList.remove(...this.types);
		const validType = this.types.includes(type) ? type : 'info';
		this.classList.add(validType);

		this.animate([
			{ opacity: 0, transform: 'translateX(-50%) translateY(50%)' },
			{ opacity: 1, transform: 'translateX(-50%) translateY(100%)' },
		], {
			duration: 300,
			fill: 'forwards'
		});
		setTimeout(() => {
			this.animate([
				{ opacity: 1, transform: 'translateX(-50%) translateY(100%)' },
				{ opacity: 0, transform: 'translateX(-50%) translateY(0)' }
			], {
				duration: 1000,
				easing: 'ease-out',
				fill: 'forwards'
			});

			setTimeout(() => {
				ui.window.removeChild(this);
			}, 1000);
		}, 2000);
	}
	success(message) {
		this.show(message, 'success');
	}
	error(message) {
		this.show(message, 'error');
	}
	info(message) {
		this.show(message, 'info');
	}
	warn(message) {
		this.show(message, 'warn');
	}
}

customElements.define('liansheng-toast', Toast, { extends: 'div' });
export default Toast; 
