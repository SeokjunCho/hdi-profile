// @ts-nocheck

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "com/hdi/myProfile/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("com.hdi.myProfile.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                $("#loader").hide();
                // Check workspace
                const sCurLocation = " " + window.location;
    
                this._gUserId = "";
                this._gToken = "";
                this._bIsDev = false;
                this._gAuth = "";
                this._gAdmin = "";
                this._gTimeStamp = "";
                //this._gIsNormalAccess = "";
                //this._gIsLoginInfo = "";
    
                // 접속 환경 확인
                if (sCurLocation.indexOf("workspace") > 0 || sCurLocation.indexOf("localhost") > 0) {
                    this._bIsDev = true;
                } else {
                    this._bIsDev = false;
                }
    
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);
                // enable routing
                this.getRouter().initialize();
                // set the device model
                this.setModel(models.createDeviceModel(), "device");
    
                // Loading create
                this._gBusyDialog = new sap.m.BusyDialog({
                    text: "로딩중입니다...",
                    customIconWidth: "60px",
                    customIconHeight: "60px",
                    customIcon: "./resources/img/loading.gif",
                    customIconDensityAware: false,
                });

                console.log("HDI Component Start!");
                this.onInit();
            },
        
            onInit: async function() {
                const oResult = await this.getToken();
                this._gUserId = oResult.user_name;
            },

            getToken: function () {
                return new Promise((resolve) => {
                    $.ajax({
                        url: "/getToken",
                        method: "GET",
                        datatype: "json",
                        async: true,
                        cache: false,
                        success: function (data) {
                            const cdata = $.parseJSON(data);
                            console.log("=== data ===");
                            console.log(cdata);
    
                            if (!!cdata.user_name) {
                                resolve(cdata);
                            } else {
                                resolve("JWT_NULL");
                            }
                        },
    
                        error: function (error) {
                            console.log(error);
                            resolve("JWT_ERROR");
                        },
                    });
                });
            }, 
        });
    }
);