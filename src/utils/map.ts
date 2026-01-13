import L from "leaflet";

const iconWidth = 15;
const iconHeight = 20;

export const lollipopIcon = new L.DivIcon({
	className: "custom-lollipop-wrapper", // Wrapper class
	html: '<div class="lollipop-icon"></div>', // Our CSS lollipop
	iconSize: [iconWidth, iconHeight],
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -20],
});
