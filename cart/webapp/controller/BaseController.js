sap.ui.define(
	["sap/ui/core/mvc/Controller",
		'sap/m/MessageToast',
		'sap/m/Dialog',
		'sap/m/Image',
		'sap/m/Button'
	],
	function(Controller, MessageToast, Dialog, Image, Button) {
		"use strict";

		return Controller.extend("sap.ui.demo.cart.controller.BaseController", {

			/**
			 * Convenience method for accessing the router.
			 * @public
			 * @returns {sap.ui.core.routing.Router} the router for this component
			 */
			getRouter: function() {
				return sap.ui.core.UIComponent.getRouterFor(this);
			},

			/**
			 * Convenience method for getting the view model by name.
			 * @public
			 * @param {string} [sName] the model name
			 * @returns {sap.ui.model.Model} the model instance
			 */
			getModel: function(sName) {
				return this.getView().getModel(sName);
			},

			/**
			 * Convenience method for setting the view model.
			 * @public
			 * @param {sap.ui.model.Model} oModel the model instance
			 * @param {string} sName the model name
			 * @returns {sap.ui.mvc.View} the view instance
			 */
			setModel: function(oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			/**
			 * Getter for the resource bundle.
			 * @public
			 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
			 */
			getResourceBundle: function() {
				return this.getOwnerComponent().getModel("i18n").getResourceBundle();
			},

			/**
			 * Handler for Switch Device dialog.
			 * Creates a URL with all session information: Current page and content of shopping cart.
			 * This url his hidden behind a QR-Code generated via google API.
			 * @public
			 * @returns
			 */
			onSwitchDeviceButtonPress: function() {
				var oCartModel = this.getView().getModel("cartProducts");

				//all relevant cart properties are set back to default. Content is deleted.
				var cartEntries = oCartModel.getProperty("/cartEntries");
				var aProducts = [];
				var aQuantities = [];

				for (var entry in cartEntries) {
					if (!cartEntries.hasOwnProperty(entry)) {
						continue;
					}
					aProducts.push(cartEntries[entry]["ProductId"]);
					aQuantities.push(cartEntries[entry]["Quantity"]);
				}

				var currentHash = sap.ui.core.routing.HashChanger.getInstance().getHash();

				// we add all products, all quanitites and the current hash to the url
				// refer to WelcomeController._loadCardFromUrl for resolvement
				var oParameters = {
					"query": {
						"products": aProducts.join(","),
						"quantities": aQuantities.join(","),
						"navTarget": encodeURIComponent(currentHash)
					}
				};

				// the url
				var sUrl = window.location.origin + window.location.pathname + "#/" + this.getRouter().getURL("home", oParameters);

				var sEncodedUrl = encodeURIComponent(sUrl);

				// var qrUrl
				// we use google chart api to generate qr code: https://developers.google.com/chart/infographics/docs/qr_codes
				var qrUrl = "https://chart.googleapis.com/chart?cht=qr&chs=400x300&chl=" + sEncodedUrl;

				// opening the dialog
				var qrDialog = new Dialog({
					title: 'Switch Device',
					content: new sap.m.VBox(
						"VBox" ,
						{
							alignItems : sap.m.FlexAlignItems.Center,
							justifyContent: sap.m.FlexJustifyContent.Center,
							items: [
								new Button({
									text: 'Copy URL to clipboard',
									width: "220px",
									press: function () {
										var $temp = $("<input>");
										try {
											$("body").append($temp);
											$temp.val(sUrl).select();
											document.execCommand("copy");
											$temp.remove();
											MessageToast.show("copied to clipboard");
										} catch (oException) {
											MessageToast.show("error while copying to clipboard");
										}
									}.bind(this)
								}),
								new sap.m.Text("textBlank1",{text: " "}),
								new sap.m.Text("textOr1",{text: "to mobile device"}),
								new Image({src: qrUrl}),
								new sap.m.Text("textOr2",{text: "to all devices"}),
								new sap.m.Text("textBlank2",{text: " "}),
								new sap.m.Input(
									"emailaddress",
									{
										width: "220px",
										placeholder : "Enter email address"
									}
								),
								new Button({
									text: '     send email     ',
									width: "220px",
									press: function () {
										var address=sap.ui.getCore().byId("emailaddress").getValue();
										$(location).attr('href', 'mailto:'
											+ address
											+ '?subject=Switch%20Device'
											+ "&body="
											+ sEncodedUrl)
									}.bind(this)
								})
							]
						}),
					beginButton: new Button({
						text: 'Close',
						press: function() {
							qrDialog.close();
						}.bind(this)
					})
				});
				//to get access to the global model
				this.getView().addDependent(qrDialog);

				qrDialog.open();
			},

			/**
			 * Event handler for login dialog
			 */
			onOpenLoginDialog: function () {
				this.byId("loginDialog").open();
			},
			onLoginCancelButtonPress: function () {
				this.byId("loginDialog").close();
			},
			onLoginSubmitButtonPress: function () {
				var user=this.byId("inputUsername").getValue();
				this.byId("loginDialog").close();
				MessageToast.show("Hello, "+user+ ". You are now logged in!");
				var oUserModel = this.getView().getModel("user");
				oUserModel.setProperty("/username", user);
				oUserModel.setProperty("/isAuthenticated", true);
			},
			onRegistrationLinkPress: function () {
				this.byId("loginDialog").close();
				this.byId("createAccountDialog").open();
			},
			onRegistrationCancelButtonPress: function () {
				this.byId("createAccountDialog").close();
			},
			onRegistrationSubmitButtonPress: function () {
				this.byId("createAccountDialog").close();
				MessageToast.show("Account was successfully created!");
			}

		});
	});