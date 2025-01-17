// @ts-nocheck
sap.ui.define(
	["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/PDFViewer", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (Controller, JSONModel, MessageBox, PDFViewer, Filter, FilterOperator) {
		"use strict";

		return Controller.extend("com.hdi.myProfile.controller.Result", {
			onInit: function () {
				this._pdfViewer = new PDFViewer();
				this.getView().addDependent(this._pdfViewer);
				this._pdfUrlMap = new Map();

				this.aUserIds = [];
			},

			onAfterRendering: async function () {
				// this._pdfViewer = new PDFViewer();
				// this.getView().addDependent(this._pdfViewer);

				await this.getOwnerComponent().getAuth();

				if (!this.getOwnerComponent()._gIsNormalAccess) {
					this.loadFragment("RestrictUserPage");
				} else if (!this.getOwnerComponent()._gIsLoginInfo) {
					this.loadFragment("NoLoginInfoPage");
				} else {
					// Normal Case
					const oParam = {
						userId: this.getOwnerComponent()._gUserId,
						token: this.getOwnerComponent()._gToken,
					};
					const oAuth = await this.connect("POST", "user/auth", oParam);

					if (oAuth !== "AUTH_ACCESS") {
						this.loadFragment("AuthCheckPage");
					}
				}
			},
			// 검색 방법 변경 시 발생 Event
			onChangeCategory: function (oEvent) {
				const sKey = oEvent.getParameters().selectedItem.getKey();

				const oNameSearchField = this.byId("nameSearchField"); // 성명 Search Field
				const oBasicSearchField = this.byId("basicSearchField"); // 그 외 Search Field

				oNameSearchField.setValue("");
				oBasicSearchField.setValue("");

				if (sKey === "userIds") {
					this.byId("searchVBox").setVisible(false);
					this.byId("uploadVBox").setVisible(true);
				} else {
					this.byId("searchVBox").setVisible(true);
					this.byId("uploadVBox").setVisible(false);
				}

				if (sKey === "ename") {
					oNameSearchField.setVisible(true);
					oBasicSearchField.setVisible(false);
				} else {
					oNameSearchField.setVisible(false);
					oBasicSearchField.setVisible(true);
				}
			},
			// [사번 Upload] 버튼 클릭 시
			onPressUpload: async function (oEvent) {
				// 전역 배열 초기화
				this.aUserIds = [];

				//Open Fragment
				await this.loadFragment("Upload");
			},
			// Upload.fragment 함수 - 사번 붙여넣기 동작 시
			onPasteData: function (oEvent) {
				const aPaste = oEvent.getParameters().data;

				let aUserId = [];
				let aPasteData = [];

				aPaste.forEach((aData, idx) => {
					for (let userId of aData) {
						if (userId !== "") {
							aUserId.push({ PERSON_ID: userId });
						}
					}
				});
				// 중복 제거 후 배열로 변경
				const aSetUserId = [...new Set(aUserId.map(JSON.stringify))].map(JSON.parse);

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
			// 인원 검색 실행
			onSearch: async function (oEvent) {
				const oParameter = oEvent.getParameters();
				// Clear 버튼 클릭 시, Search 로직 타지 않음
				if (oParameter.clearButtonPressed) return;

				const oComponent = this.getOwnerComponent();

				const oCategorySelect = this.byId("categorySelect");
				const sCategorySelectedKey = oCategorySelect.getSelectedKey();

				const oStatusMCB = this.byId("statusMCB");
				const aStatusMCBKeys = oStatusMCB.getSelectedKeys();

				let sQuery = "";

				if (aStatusMCBKeys.length === 0) {
					MessageBox.information("재직 구분을 선택하여 주세요.");
					return;
				}

				if (sCategorySelectedKey === "userIds") {
					if (!this.aUserIds.length) {
						MessageBox.information("업로드된 사번이 없습니다. 안내문을 읽고 다시 조회해주세요.");
						return;
					} else {
						sQuery = this.aUserIds;
						this._oUploadPage.close();
					}
				} else {
					sQuery = oParameter.query;

					if (sQuery.length < 2) {
						MessageBox.information("검색어를 2글자 이상 입력해주세요.");
						return;
					}
				}

				let oParam = {
					userId: oComponent._gUserId, // 로그인 사용자 Person ID
					token: oComponent._gToken, // 로그인 사용자 토근
				};

				let oAddParam = {
					aPersonId: [],
					aUserId: [],
					orgeh: "", // 조직 이름
					ename: "", // 직원 이름
					status: aStatusMCBKeys, // 재직구분 선택 값 배열
					lang: oComponent._gLang, // 언어
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

				oParam = Object.assign({}, oParam, oAddParam);

				let aResult = await this.connect("POST", "user/search", oParam, true);

				// 권한이 없는 경우 빈 배열로 바인딩
				if (aResult === "AUTH_ERR") {
					aResult = [];
				}
				// 국가에 따른 이름 규칙 적용
				for (const item of aResult) {
					// 한/중/일 은 이름을 Last + First
					if (["KOR", "CHN", "JPN"].some((el) => el === item.nationality)) {
						item.fullName = item.lastName + " " + item.firstName;
						item.fullName2 = item.lastName + item.firstName;
					} else {
						// 그 외 국가는 First + Last
						item.fullName = item.firstName + " " + item.lastName;
						item.fullName2 = item.firstName + item.lastName;
					}
				}

				const oTable = this.byId("resultTable");
				const oTitle = this.byId("resultTableTitle");

				let oModel = new JSONModel();
				oModel.setProperty("/data", aResult);

				oTable.setModel(oModel);

				const sResultTxt = this.getView().getModel("i18n").getResourceBundle().getText("searchResult"); //조회결과
				oTitle.setText(`${sResultTxt} (${aResult.length})`);
			},
			// 인사프로필 조회
			onPressProfileOpen: async function (oEvent) {
				const oComponent = this.getOwnerComponent();
				//Circle 보고서 조회 부분 참고
				const oButton = oEvent.getSource();
				const oBindingContext = oButton.getBindingContext();
				const oTargetObject = oBindingContext.getObject();

				try {
					const oUserParam = {
						personId: oTargetObject.personId,
						userId: oTargetObject.userId,
					};

					const key = `${oTargetObject.state}_${oTargetObject.userId}_${oComponent._gLang}`;
					let pdfUrl = "";

					if (this._pdfUrlMap.has(key)) {
						// 한번 불러왔던 PDF는 저장해둔 후 다시 불러오지 않음
						pdfUrl = this._pdfUrlMap.get(key);
					} else {
						const oParam = {
							userId: oComponent._gUserId, // 로그인 사용자 User ID
							token: oComponent._gToken, // 로그인 사용자 토큰
							format: "HDI", // HDI : 현대중공업 포멧, GROUP : 그룹 공통 포멧
							properties: {
								lang: oComponent._gLang, // PDF 언어 선택
								pageOrientation: "portrait",
								fontSize: 8,
							},
							aUser: [oUserParam], // 배열 길이가 1이면 PDF 파일, 2이상이면 zip 파일 제공
						};
						const oFile = await this.connect("POST", "profile", oParam, true);

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
			// [프로필 다운로드] 버튼 클릭 시 Event
			// 프로필 다중 다운로드
			onPressReportDownload: async function (oEvent) {
				const oComponent = this.getOwnerComponent();
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
					};
					aPersonId.push(oUserParam);
				}

				const oParam = {
					userId: oComponent._gUserId,
					token: oComponent._gToken, // 로그인 사용자 토큰
					format: "HDI", // HDI : 현대중공업 포멧, GROUP : 그룹 공통 포멧
					properties: {
						lang: oComponent._gLang, // PDF 언어 선택
						pageOrientation: "portrait",
						fontSize: 8,
					},
					aUser: aPersonId, // 배열 길이가 1이면 PDF 파일, 2이상이면 zip 파일 제공
				};

				try {
					const oFile = await this.connect("POST", "profile", oParam, true);

					let a = document.createElement("a");
					let url = window.URL.createObjectURL(oFile);
					a.href = url;

					if (aItems.length === 1) {
						a.download = "profile.pdf";
					} else {
						a.download = "profiles.zip";
					}

					document.body.append(a);
					a.click();
					a.remove();
					window.URL.revokeObjectURL(url);
				} catch (err) {
					console.log(err);
					return Promise.reject(err);
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
							new Filter("fullName", FilterOperator.Contains, sQuery),
							new Filter("fullName2", FilterOperator.Contains, sQuery),
							new Filter("title", FilterOperator.Contains, sQuery),
							new Filter("position", FilterOperator.Contains, sQuery),
							new Filter("jobGroup", FilterOperator.Contains, sQuery),
							new Filter("empType", FilterOperator.Contains, sQuery),
						],
						false
					);

					const oFilter = this._oGlobalFilter;
					oBinding.filter(oFilter);
				} else {
					oBinding.filter(null);
				}
			},
		});
	}
);
