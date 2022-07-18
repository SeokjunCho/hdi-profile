
// @ts-nocheck
sap.ui.define(
	["./BaseController", "sap/ui/core/Fragment"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, Fragment) {
		"use strict";

		return Controller.extend("com.hdi.myProfile.controller.AppMain", {
			onInit: function () {},

			onChangeThemeMode: function () {
				const oBtn = this.byId("themeBtn");
				if (oBtn.getIcon() === "sap-icon://lightbulb") {
					sap.ui.getCore().applyTheme("sap_fiori_3");
					this.byId("themeBtn").setIcon("sap-icon://master-task-triangle");
					this.byId("themeBtn").setText("다크 모드로 보기");
				} else {
					sap.ui.getCore().applyTheme("sap_fiori_3_dark");
					this.byId("themeBtn").setIcon("sap-icon://lightbulb");
					this.byId("themeBtn").setText("라이트 모드로 보기");
				}
			},

			onChangeLang: function (oEvent) {
				console.log("onChangeLang : ");

				var oButton = oEvent.getSource(),
					oView = this.getView();

				// create popover
				if (!this._pPopover) {
					this._pPopover = Fragment.load({
						id: oView.getId(),
						name: "com.hdi.myProfile.view.fragment.Language",
						controller: this,
					}).then(function (oPopover) {
						oView.addDependent(oPopover);
						return oPopover;
					});
				}

				this._pPopover.then(function (oPopover) {
					oPopover.openBy(oButton);
				});
			},

            onSelectLang: function(oEvent) {
                const oItem = oEvent.getSource();
                const oTitle = oItem.getTitle();
                const oDesc = oItem.getDescription();

                const oBtn = this.byId("changeLangBtn");
                oBtn.setText(`${oTitle}(${oDesc})`);

                if(oDesc === "KO") {
                    console.log("KO Changed!");
                    sap.ui.getCore().getConfiguration().setLanguage("ko");
                } else if (oDesc === "EN") {
                    console.log("EN Changed!");
                    sap.ui.getCore().getConfiguration().setLanguage("en");
                } else { // ZH
                    console.log("ZH Changed!");
                    sap.ui.getCore().getConfiguration().setLanguage("zh");
                }
                this.onPressLangClose();
            },

            onPressLangClose: function() {
				this._pPopover.then(function (oPopover) {
					oPopover.close();
				});
            }
		});
	}
);
