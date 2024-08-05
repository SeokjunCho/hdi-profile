// @ts-nocheck

sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/Device", "com/hdi/myProfile/model/models", "sap/ui/model/json/JSONModel"], function (UIComponent, Device, models, JSONModel) {
	"use strict";

	return UIComponent.extend("com.hdi.myProfile.Component", {
		metadata: {
			manifest: "json",
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
			this._gLang = "ko_KR"; //default value
			this._gIsNormalAccess = "";
			this._gIsLoginInfo = "";

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

			// console.log("HDI Component Start!");
		},

		getAuth: async function () {
			this._gBusyDialog.open();
			if (!this._bIsDev) {
				const oResult = await this.getToken();

				if (oResult === "JWT_ERROR" || oResult === "JWT_NULL") {
					this._gIsNormalAccess = false;
					this._gIsLoginInfo = false;
				} else {
					this._gIsNormalAccess = true;
					this._gUserId = oResult.userId;
					this._gToken = oResult.token;

					if (this._gUserId === "" || this._gToken === "") {
						this._gIsLoginInfo = false;
					} else {
						this._gIsLoginInfo = true;
					}
				}
			} else {
				this._gIsNormalAccess = true;
				this._gIsLoginInfo = true;
				const aLocal = await this.getLocalInfo();
				this._gToken = aLocal[0];
				this._gUserId = aLocal[1];

				// console.log("localhost login info : ")
				// console.log(aLocal);
			}
			this._gBusyDialog.close();
		},

		getLocalInfo: function () {
			return new Promise((resolve, reject) => {
				let oEnvModel = new JSONModel(sap.ui.require.toUrl("com/hdi/myProfile/env.json"));
				oEnvModel.attachRequestCompleted(() => {
					resolve([oEnvModel.getData().UserInformation[0].token, oEnvModel.getData().UserInformation[0].userId]);
				});
			});
		},

		getToken: async function () {
			return new Promise((resolve, reject) => {
				$.ajax({
					url: "/getToken",
					method: "GET",
					datatype: "json",
					async: true,
					cache: false,
					success: function (data) {
						const cdata = $.parseJSON(data);

						if (cdata.userId == undefined || cdata.userId == "" || cdata.userId == null) {
							resolve("JWT_NULL");
						} else {
							resolve(cdata);
						}
					},
					error: function (error) {
						resolve("JWT_ERROR");
					},
				});
			});
		}, //End of getUserSessionInfo
	});
});
