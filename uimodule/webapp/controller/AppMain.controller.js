// @ts-nocheck
sap.ui.define(
    ["./BaseController"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("com.hdi.myProfile.controller.AppMain", {
            onInit: function () {

            },

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
        });
    }
);
