// @ts-nocheck
sap.ui.define(
	[
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/core/UIComponent",
		"com/hdi/myProfile/model/formatter",
		"sap/ui/core/Fragment",
		"sap/m/MessageBox",
		"sap/ui/model/json/JSONModel",
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 * @param {typeof sap.ui.core.routing.History} History
	 * @param {typeof sap.ui.core.UIComponent} UIComponent
	 */
	function (
		Controller,
		History,
		UIComponent,
		formatter,
		Fragment,
		MessageBox,
		JSONModel
	) {
		"use strict";

		return Controller.extend("com.hdi.myProfile.controller.BaseController", {
			formatter: formatter,

			/**
			 * Convenience method for getting the view model by name in every controller of the application.
			 * @public
			 * @param {string} sName the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel: function (sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model in every controller of the application.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.core.mvc.View} the view instance
			 */
			setModel: function (oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Convenience method for getting the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle: function () {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Method for navigation to specific view
			 * @public
			 * @param {string} psTarget Parameter containing the string for the target navigation
			 * @param {Object.<string, string>} pmParameters? Parameters for navigation
			 * @param {boolean} pbReplace? Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
			 */
			navTo: function (psTarget, pmParameters, pbReplace) {
				this.getRouter().navTo(psTarget, pmParameters, pbReplace);
			},

			getRouter: function () {
				return UIComponent.getRouterFor(this);
			},

			onNavBack: function () {
				const sPreviousHash = History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					window.history.back();
				} else {
					this.getRouter().navTo("appHome", {}, true /* no history*/);
				}
			},

			loadFragment: async function (param) {
				console.log("loadFragment");
				if (param === "Upload") {
					console.log(this._oUploadPage);
					if (!this._oUploadPage) {
						Fragment.load({
							name: "com.hdi.myProfile.view.fragment.Upload",
							controller: this,
						}).then(
							function (oPage) {
								this._oUploadPage = oPage;
								this.getView().addDependent(this._oUploadPage);

								const oMsgStrip = sap.ui.getCore().byId("uploadMsgStrip");
								//console.log(oMsgStrip);
								oMsgStrip.setText(
									"1. Excel, 메모장 등을 이용하여 조회하고자 하는 사번을 <br> 입력 후 마우스로 드래그 하여 <strong>복사(Ctr+C)</strong>합니다.<br> 2. 본 화면에서 <strong>붙여넣기(Ctr+V)</strong> 키를 누르면 데이터가 로드<br>됩니다.<br>3. 아래 표에서 내용 확인 후 [조회하기]버튼을 눌러 주세요."
								);

								this._oUploadPage.open();
							}.bind(this)
						);
					} else {
						const oTable = sap.ui.getCore().byId("uploadTable");
						const oTitle = sap.ui.getCore().byId("resultTitle");
						console.log(oTitle);
						let oModel = new JSONModel();
						oModel.setProperty("/pasteData", []);
						oTable.setModel(oModel);
						oTitle.setText(`대상자 (0)`);
						this._oUploadPage.open();
					}
				}
			},

			onCloseDialog: async function (oEvent) {
				if (oEvent.getSource().getId() === "UploadCloseBtn") {
					this._oUploadPage.close();
				}
			},

			connect: function (sMethod, sUrl, oParam, async = true) {
				const oComponent = this.getOwnerComponent();
				const _gBusyDialog = oComponent._gBusyDialog;
				let oXhrFields = {};
				if (sUrl === "profile") {
					oXhrFields = {
						responseType: "blob",
					};
				}

				return new Promise((resolve, reject) => {
					_gBusyDialog.open();
					let URL = "";
					if (!oComponent._bIsDev) {
						URL = "hdi-profile-back/" + sUrl;
					} else {
						URL = "http://localhost:8080/" + sUrl;
					}

					console.log("Call from BaseController.js");
					console.log(`URL : ${URL}`);
					console.log(`METHOD : ${sMethod}`);

					jQuery.ajax({
						url: URL,
						type: sMethod,
						datatype: "json",
						data: JSON.stringify(oParam),
						contentType: "application/json",
						xhrFields: oXhrFields,
						async: async,
						success: function (results) {
							resolve(results);
							_gBusyDialog.close();
							if (!!results.message && results.message !== "") {
								MessageBox.error(
									"오류가 발생했습니다. 담당자에게 연락해주세요."
								);
							}
						},
						error: function (err) {
							if (err.statusText.indexOf("localhost") !== -1) {
								MessageBox.error(
									"localhost환경입니다. Node Express Back-end서버를 실행시켜주세요."
								);
							}
							reject(err);
							_gBusyDialog.close();
						},
					});
				});
			},
		});
	}
);
