// @ts-nocheck
sap.ui.define(
	[
		"./BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"sap/m/PDFViewer",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/core/ws/WebSocket",
	],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, JSONModel, MessageBox, PDFViewer, Filter, FilterOperator, WebSocket) {
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

				this._pdfViewer = new PDFViewer();
				this.getView().addDependent(this._pdfViewer);
				this._pdfUrlMap = new Map();

				this.aUserIds = [];
			},

			onChangeCategory: function (oEvent) {
				const sKey = oEvent.getParameters().selectedItem.getKey();
				const sQuery = this.byId("querySF");
				sQuery.setValue("");

				if (sKey === "userIds") {
					this.byId("searchVBox").setVisible(false);
					this.byId("uploadVBox").setVisible(true);
				} else {
					this.byId("searchVBox").setVisible(true);
					this.byId("uploadVBox").setVisible(false);
				}

				if (sKey === "ename") {
					sQuery.setPlaceholder("예시) 김 현대 (성명), 현대 (이름)");
				} else {
					sQuery.setPlaceholder("두 글자 이상 입력하세요.");
				}
			},

			onPressUpload: async function (oEvent) {
				console.log("onPressUpload");
				// 전역 배열 초기화
				this.aUserIds = [];

				//Open Fragment
				await this.loadFragment("Upload");
				console.log("onPressUpload Finish");
			},

			onPasteData: function (oEvent) {
				console.log("onPasteData!!");
				//console.log(oEvent.getParameters());

				const aPaste = oEvent.getParameters().data;
				//console.log(aPaste);

				let aUserId = [];
				let aPasteData = [];

				aPaste.forEach((aData, idx) => {
					console.log(idx);
					console.log(aData);

					for (let userId of aData) {
						//if (!isNaN(userId) && userId !== "") {
						if (userId !== "") {
							aUserId.push({ PERSON_ID: userId });
						}
					}
				});

				console.log("aUserId : ");
				console.log(aUserId);

				console.log("new arr");

				const aSetUserId = [...new Set(aUserId.map(JSON.stringify))].map(JSON.parse);

				console.log(aSetUserId);
				this.aUserIds = aSetUserId;

				aSetUserId.forEach((obj, idx) => {
					if (idx <= 4) {
						aPasteData.push(obj);
					} else if (idx === 5) {
						aPasteData.push({
							PERSON_ID: `외 ${aSetUserId.length - idx}건의 데이터가 로드 되었습니다.`,
						});
					}
				});

				const oTable = sap.ui.getCore().byId("uploadTable");
				const oTitle = sap.ui.getCore().byId("resultTitle");

				let oModel = new JSONModel();
				oModel.setProperty("/pasteData", aPasteData);
				oTable.setModel(oModel);
				oTitle.setText(`대상자 (${aSetUserId.length})`);
			},

			onSearch: async function (oEvent) {
				console.log("onSearch!");
				const oComponent = this.getOwnerComponent();
				const oCategorySelect = this.byId("categorySelect");
				const sCategorySelectedKey = oCategorySelect.getSelectedKey();

				const oStatusMCB = this.byId("statusMCB");
				const aStatusMCBKeys = oStatusMCB.getSelectedKeys();
				let sQuery = "";

				if (sCategorySelectedKey === "userIds") {
					if (!this.aUserIds.length) {
						MessageBox.information("업로드된 사번이 없습니다. 안내문을 읽고 다시 조회해주세요.");
						return;
					} else {
						sQuery = this.aUserIds;
						this._oUploadPage.close();
					}
				} else {
					sQuery = oEvent.getParameters().query;

					if (sQuery.length < 2) {
						MessageBox.information("검색어를 2글자 이상 입력해주세요.");
						return;
					}
				}

				console.log(sCategorySelectedKey);
				console.log(sQuery);

				let oAddParam = {
					aPersonId: [],
					aUserId: [],
					orgeh: "", // 조직 이름
					ename: "", // 직원 이름
					status: aStatusMCBKeys,
				};

				if (sCategorySelectedKey === "ename") {
					oAddParam.ename = sQuery;
				} else if (sCategorySelectedKey === "userId") {
					oAddParam.aPersonId.push(sQuery);
				} else if (sCategorySelectedKey === "orgeh") {
					oAddParam.orgeh = sQuery;
				} else if (sCategorySelectedKey === "userIds") {
					for (let obj of sQuery) {
						oAddParam.aPersonId.push(`${obj.PERSON_ID}`);
					}
				}

				if (oComponent._bIsDev) {
					oComponent._gUserId = "minchoul.jung@doosan.com";
				}

				let oParam = {
					userId: oComponent._gUserId, // 로그인 사용자 Person ID
					token: "", // 로그인 사용자 토근
				};

				oParam = Object.assign({}, oParam, oAddParam);

				const aResult = await this.connect("POST", "user", oParam);
				console.log("=== result === ");
				console.log(aResult);

				const oTable = this.byId("resultTable");
				const oTitle = this.byId("resultTableTitle");
				let oModel = new JSONModel();
				oModel.setProperty("/data", aResult);

				oTable.setModel(oModel);
				oTitle.setText(`조회결과 (${aResult.length})`);
			},

			onPressProfileOpen: async function (oEvent) {
				console.log("Profile Open (Fragment)");
				//Circle 보고서 조회 부분 참고
				const oButton = oEvent.getSource();
				const oBindingContext = oButton.getBindingContext();
				const oTargetObject = oBindingContext.getObject();

				console.log(oTargetObject);

				try {
					const oUserParam = {
						personId: oTargetObject.personId,
						userId: oTargetObject.userId,
						isPrimary: oTargetObject.isPrimary,
					};

					const key = `${oTargetObject.state}_${oTargetObject.userId}`;
					let pdfUrl = "";

					if (this._pdfUrlMap.has(key)) {
						pdfUrl = this._pdfUrlMap.get(key);
					} else {
						const oParam = {
							userId: "", // 로그인 사용자 User ID
							token: "", // 로그인 사용자 토큰
							format: "HDI", // HDI : 현대중공업 포멧, GROUP : 그룹 공통 포멧
							properties: {
								lang: "ko_KR", // PDF 언어 선택
								pageOrientation: "portrait",
								fontSize: 8,
							},
							aUser: [oUserParam], // 배열 길이가 1이면 PDF 파일, 2이상이면 zip 파일 제공
						};
						const oFile = await this.connect("POST", "profile", oParam);

						pdfUrl = URL.createObjectURL(oFile);
						this._pdfUrlMap.set(key, pdfUrl);
					}
					jQuery.sap.addUrlWhitelist("blob");
					this._pdfViewer.setShowDownloadButton(false);
					this._pdfViewer.setSource(pdfUrl);
					this._pdfViewer.setTitle(`${oTargetObject.lastName} ${oTargetObject.firstName} ${oTargetObject.title} Profile`);
					this._pdfViewer.open();
				} catch (err) {
					console.log(err);
					MessageBox.error("보고서 생성 중 오류가 발생했습니다. 담당자에게 문의해주세요");
				}
			},

			onPressReportDownload: async function (oEvent) {
				const oTable = this.byId("resultTable");
				const aItems = oTable.getSelectedItems();

				//const oData = oTable.getModel().getData();
				// 메일 발송 버튼 예외 체크
				if (aItems.length === 0) {
					MessageBox.information("조회결과에서 프로필을 다운받고자 하는 대상자를 체크해 주세요.");
					return;
				}
				let aPersonId = [];

				for (const oItem of aItems) {
					const oContext = oItem.getBindingContext();
					const oObj = oContext.getProperty(null, oContext);

					let oUserParam = {
						personId: oObj.personId,
						userId: oObj.userId,
						isPrimary: oObj.isPrimary,
					};
					aPersonId.push(oUserParam);
				}

				const oParam = {
					userId: "seokjun.cho",
					token: "", // 로그인 사용자 토큰
					format: "HDI", // HDI : 현대중공업 포멧, GROUP : 그룹 공통 포멧
					properties: {
						lang: "ko_KR", // PDF 언어 선택
						pageOrientation: "portrait",
						fontSize: 8,
					},
					aUser: aPersonId, // 배열 길이가 1이면 PDF 파일, 2이상이면 zip 파일 제공
				};
				try {
					// 소켓 연결이 완료 될 때 까지 대기, 연결 실패 시 catch로 넘어감
					await this.connectWebSocket();

					const oFile = await this.connect("POST", "profile", oParam);

					let a = document.createElement("a");
					let url = window.URL.createObjectURL(oFile);
					a.href = url;
					a.download = "profiles.zip";

					document.body.append(a);
					a.click();
					a.remove();
					window.URL.revokeObjectURL(url);
				} catch (err) {
					console.log(err);
					return Promise.reject(err);
				}
			},

			// 재직구분 formatter
			statusFormatter: function (status) {
				//this.getView().getModel("i18n").getResourceBundle().getText("words");
				if (status === "T") {
					return "퇴직";
				} else if (status === "U" || status === "P") {
					return "휴직";
				} else {
					return "재직";
				}
			},

			// "대상자 검색" 팝업 - 검색 필터
			filterGlobally: function (oEvent) {
				let sQuery = oEvent.getParameter("query");
				const oTable = this.byId("resultTable");
				const oBinding = oTable.getBinding("items");
				this._oGlobalFilter = null;

				oBinding.attachChange((oFilterEvent) => {
					this.byId("resultTableTitle").setText(`대상자 (${oFilterEvent.getSource().iLength})`);
				});

				if (sQuery) {
					this._oGlobalFilter = new Filter(
						[
							new Filter("personId", FilterOperator.Contains, sQuery),
							new Filter("userId", FilterOperator.Contains, sQuery),
							new Filter("company", FilterOperator.Contains, sQuery),
							new Filter("department", FilterOperator.Contains, sQuery),
							new Filter("title", FilterOperator.Contains, sQuery),
							new Filter("position", FilterOperator.Contains, sQuery),
							new Filter("employeeType", FilterOperator.Contains, sQuery),
						],
						false
					);

					const oFilter = this._oGlobalFilter;
					oBinding.filter(oFilter);
				} else {
					oBinding.filter(null);
				}
			},

			connectWebSocket: function () {
				return new Promise((resolve, reject) => {
					this.connection = new WebSocket("ws://localhost:8080"); // 서버와 연결
					// 연결 완료 시
					this.connection.attachOpen(() => {
						console.log("Open Connection");
						this.connection.send(JSON.stringify({ type: "new", userId: "seokjun.cho" }));
						resolve(true);
					});
					// Error Handler
					this.connection.attachError(() => {
						reject("Socker Error");
					});
					// 연결 Close 시 Handler
					this.connection.attachClose(() => {
						console.log("Close Connection");
					});
					// 메시지 수신 시 Handler
					this.connection.attachMessage((oEvent) => {
						const oMessage = JSON.parse(oEvent.getParameter("data"));
						console.log(oMessage);
						// isComplete 메세지를 받았을 경우 소켓 종료
						if (oMessage.isComplete) {
							this.disconnectWebSocket();
						}
					});
				});
			},

			disconnectWebSocket: function () {
				this.connection.close();
			},
		});
	}
);
