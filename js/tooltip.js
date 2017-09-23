/**
 * Bind tooltip to node
 * @param {HTMLElement|string} target
 * @param {{icon: string=, content: HTMLElement|string, width: int=, position: int=}} tooltip
 */
function bindTooltip(target, tooltip) {
	if (typeof target === "string") {
		target = $.e("span", {html: target});
	}

	tooltip.position = tooltip.position || (Tooltip.X_CENTER | Tooltip.Y_TOP); // TODO check each X and Y

	$.elements.addClass(target, "tooltip-wrap");

	var mContent, mIcon, mText;

	target.appendChild(mContent = $.e("div", {
		"class": "tooltip-content",
		append: [
			mIcon = $.e("div", {"class": "tooltip-icon"}),
			mText = $.e("div", {"class": "tooltip-text"})
		]
	}));


	var obj = {
		node: mContent,

		setIcon: function(icon) {
			$.elements.clearChild(mIcon);
			$.elements[icon ? "removeClass" : "addClass"](mContent, "tooltip-noImage");

			if (!icon) {
				return obj;
			}

			mIcon.appendChild(typeof icon === "string"
				? $.e("img", {src: icon})
				: icon
			);
			return obj;
		},

		setContent: function(text) {
			$.elements.clearChild(mText);
			if (text instanceof HTMLElement) {
				mText.appendChild(text);
			} else {
				mText.innerHTML = text;
			}
			return obj;
		}
	};

	obj.setIcon(tooltip.icon);
	obj.setContent(tooltip.content);

	tooltip.width = tooltip.width || 375;


	mContent.style.width = tooltip.width + "px";

	var delta = -(tooltip.width / 2);

	if (tooltip.position & Tooltip.X_LEFT) {
		delta = -tooltip.width + 20;
		$.elements.addClass(mContent, "tooltip-x-left");
	}

	if (tooltip.position & Tooltip.X_RIGHT) {
		delta = -20;
		$.elements.addClass(mContent, "tooltip-x-right");
	}

	mContent.style.marginLeft = delta + "px";


	return obj;
}

var Tooltip = {
	X_LEFT: 1,
	X_CENTER: 2,
	X_RIGHT: 4,
	Y_TOP: 8,
	Y_CENTER: 16,
	Y_BOTTOM: 32
};