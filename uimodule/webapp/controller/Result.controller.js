
// @ts-nocheck
sap.ui.define(
    ["./BaseController"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("com.hdi.myProfile.controller.Result", {
            onInit: function () {
                /*
                const oFilter = this.byId("filterBar");

                oFilter.addEventDelegate({
                    onBeforeRendering: function () {
                        oFilter._oSearchButton.setText("조회하기");
                        oFilter.removeEventDelegate(this);
                    },
                });
                */
            },

            onChangeCategory: function (oEvent) {
                const sKey = oEvent.getParameters().selectedItem.getKey();

                if (sKey === "massPersonId") {
                    this.byId("searchVBox").setVisible(false);
                    this.byId("uploadVBox").setVisible(true);
                } else {
                    this.byId("searchVBox").setVisible(true);
                    this.byId("uploadVBox").setVisible(false);
                }
            },

            onPressUpload: async function(oEvent) {
                console.log("onPressUpload");
                //Open Fragment
                await this.loadFragment("Upload");
            },

            onPasteData: function(oEvent) {
                console.log("onPasteData");
                console.log(oEvent.getParameters());
            }
        });
    }
);
