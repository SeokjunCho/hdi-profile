sap.ui.define([], function () {
	"use strict";
	return {
		statusFormatter: function (status) {
			//this.getView().getModel("i18n").getResourceBundle().getText("words");
			if (status === "T") {
				return "퇴직";
			} else if (status === "U" || status === "P") {
				return "휴직";
			} else if (status === "X") {
				return "퇴사(21.08.19 이전)";
			} else {
				return "재직";
			}
		},
	};
});
