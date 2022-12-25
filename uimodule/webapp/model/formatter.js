sap.ui.define([], function () {
	"use strict";
	return {
		statusFormatter: function (status = "") {
			if (status === "T") {
				return this.getView().getModel("i18n").getResourceBundle().getText("withdrawn");
			} else if (status === "U" || status === "P") {
				return this.getView().getModel("i18n").getResourceBundle().getText("inactive");
			} else if (status === "X") {
				return this.getView().getModel("i18n").getResourceBundle().getText("withdrawnInDoosan");
			} else {
				return this.getView().getModel("i18n").getResourceBundle().getText("active");
			}
		},
	};
});
