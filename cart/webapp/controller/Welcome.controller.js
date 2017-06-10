sap.ui.define([
	'sap/ui/demo/cart/controller/BaseController',
	'sap/ui/demo/cart/model/cart',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/demo/cart/model/formatter'
], function(BaseController, cart, JSONModel, Filter, formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.cart.controller.Welcome", {

		_iCarouselTimeout: 0, // a pointer to the current timeout
		_iCarouselLoopTime: 8000, // loop to next picture after 8 seconds

		formatter: formatter,

		_mFilters: {
			Promoted: [new Filter("Type", "EQ", "Promoted")],
			Viewed: [new Filter("Type", "EQ", "Viewed")],
			Favorite: [new Filter("Type", "EQ", "Favorite")]
		},

		onInit: function() {
			var oViewModel = new JSONModel({
				welcomeCarouselShipping: 'img/ShopCarouselShipping.jpg',
				welcomeCarouselInviteFriend: 'img/ShopCarouselInviteFriend.jpg',
				welcomeCarouselTablet: 'img/ShopCarouselTablet.jpg',
				welcomeCarouselCreditCard: 'img/ShopCarouselCreditCard.jpg',
				Promoted: [],
				Viewed: [],
				Favorite: [],
				carouselItem1: [],
				carouselItem2: [],
				carouselItem3: [],
				carouselItem4: [],
				carouselItem5: [],
				Currency: "EUR"
			});
			this.getView().setModel(oViewModel, "view");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);
			this.getRouter().getTarget("welcome").attachDisplay(this._onRouteMatched, this);
			this.getRouter().getRoute("home").attachPatternMatched(this._loadCardFromUrl, this);

			// select random carousel page at start
			var oWelcomeCarousel = this.byId("welcomeCarousel");
			var iRandomIndex = Math.floor(Math.random() * oWelcomeCarousel.getPages().length - 1);
			oWelcomeCarousel.setActivePage(oWelcomeCarousel.getPages()[iRandomIndex]);
		},

		/**
		 * lifecycle hook that will initialize the welcome carousel
		 */
		onAfterRendering: function() {
			this.onCarouselPageChanged();
		},

		_loadCardFromUrl: function(oEvent) {
			var oRouterArgs = oEvent.getParameter("arguments");
			if (oRouterArgs["?query"]) {
				var oModel = this.getView().getModel();

				oModel.read("/Products", {
					success: function(oData) {
						var aProducts = oRouterArgs["?query"].products.split(",");
						var aQuantities = oRouterArgs["?query"].quantities.split(",");
						var sNavTarget = oRouterArgs["?query"].navTarget;

						var oResourceBundle = this.getModel("i18n").getResourceBundle();
						var oCartModel = this.getModel("cartProducts");

						for (var id in aProducts) {
							for (var product in oModel.oData) {
								if (product.includes("Products('") && oModel.oData[product].ProductId === aProducts[id]) {
									for (var i = 0; i < aQuantities[id]; i++) {
										cart.addToCart(oResourceBundle, oModel.oData[product], oCartModel);
									}
								}
							}
						}
						// restore old hash
						sap.ui.core.routing.HashChanger.getInstance().setHash(sNavTarget);
					}.bind(this)
				});
			}
		},

		_onRouteMatched: function(oEvent) {
			// we do not need to call this function if the url hash refers to product or cart product
			if (oEvent.getParameter("name") !== "product" && oEvent.getParameter("name") !== "cartProduct") {
				var aPromotedData = this.getView().getModel("view").getProperty("/Promoted");
				if (!aPromotedData.length) {
					var oModel = this.getModel();
					this.iCount = 1;
					Object.keys(this._mFilters).forEach(function(sFilterKey) {
						oModel.read("/FeaturedProducts", {
							urlParameters: {
								"$expand": "Product"
							},
							filters: this._mFilters[sFilterKey],
							success: function(oData) {
								this.getModel("view").setProperty("/" + sFilterKey, oData.results);
								if (sap.ui.Device.system.phone && sFilterKey === "Promoted" && this.iCount > 0) {
									this._selectCarouselItems();
									this.iCount --;
								} else if (!sap.ui.Device.system.phone && sFilterKey === "Promoted") {
									this._selectPromotedItems();
								}
							}.bind(this)
						});
					}.bind(this));
				}
			}
		},

		/**
		 * clear previous animation and initialize the loop animation of the welcome carousel
		 */
		onCarouselPageChanged: function() {
			clearTimeout(this._iCarouselTimeout);
			this._iCarouselTimeout = setTimeout(function() {
				var oWelcomeCarousel = this.byId("welcomeCarousel");
				if (oWelcomeCarousel) {
					oWelcomeCarousel.next();
					this.onCarouselPageChanged();
				}
			}.bind(this), this._iCarouselLoopTime);
		},

		/**
		 * Event handler to determine which link the user has clicked
		 * @param {sap.ui.base.Event} oEvent the press event of the link
		 */
		onSelectProduct: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("view");
			var sCategoryId = oContext.getProperty("Product/Category");
			var sProductId = oContext.getProperty("Product/ProductId");
			this.getOwnerComponent().getRouter().navTo("product", {
				id: sCategoryId,
				productId: sProductId
			});
		},

		/**
		 * Navigates to the category page on phones
		 */
		onShowCategories: function() {
			this.getRouter().navTo("categories");
		},

		/**
		 * Opens a lightbox when clicking on the picture
		 * @param {sap.ui.base.Event} oEvent the press event of the image
		 */
		onPicturePress: function(oEvent) {
			var sPath = "view>" + oEvent.getSource().getBindingContext("view").getPath() + "/Product";
			this.byId("lightBox").bindElement({
				path: sPath
			});
			this.byId("lightBox").open();
		},

		/**
		 * Event handler to determine which button was clicked
		 * @param {sap.ui.base.Event} oEvent the button press event
		 */
		onAddButtonPress: function(oEvent) {
			var oResourceBundle = this.getModel("i18n").getResourceBundle();
			var oProduct = oEvent.getSource().getBindingContext("view").getObject();
			var oCartModel = this.getModel("cartProducts");
			cart.addToCart(oResourceBundle, oProduct, oCartModel);
		},

		/**
		 * Select two random elements from the promoted array
		 * @private
		 */
		_selectPromotedItems: function() {
			var aPromotedItems = this.getView().getModel("view").getProperty("/Promoted");
			var aSelectedPromoted = [];
			for (var i = 0; i < 2; i++) {
				var oSelectedPromoted = aPromotedItems[Math.floor(Math.random() * aPromotedItems.length)];
				aSelectedPromoted.push(oSelectedPromoted);
			}
			this.getModel("view").setProperty("/Promoted", aSelectedPromoted);
		},

		_selectCarouselItems: function () {

			var aSelectedCarouselItems1 = [],
				aSelectedCarouselItems2 = [],
				aSelectedCarouselItems3 = [],
				aSelectedCarouselItems4 = [],
				aSelectedCarouselItems5 = [],
				aSelectedCarouselItems = [];
			/*for (var i=1; i<=5; i++) {
			 debugger;
			 var aCarouselItems = this.getView().getModel("view").getProperty("/Promoted");
			 var oSelectedPromoted = aCarouselItems.pop();
			 aSelectedCarouselItems.push(oSelectedPromoted);
			 this.getModel("view").setProperty("/carouselItem"+i, aSelectedCarouselItems);
			 aSelectedCarouselItems.pop();
			 }*/

			var aCarouselItems1 = this.getView().getModel("view").getProperty("/Promoted");
			var oSelectedPromoted1 = aCarouselItems1.pop();
			aSelectedCarouselItems1.push(oSelectedPromoted1);
			this.getModel("view").setProperty("/carouselItem1", aSelectedCarouselItems1);

			var aCarouselItems2 = this.getView().getModel("view").getProperty("/Promoted");
			var oSelectedPromoted2 = aCarouselItems1.pop();
			aSelectedCarouselItems2.push(oSelectedPromoted2);
			this.getModel("view").setProperty("/carouselItem2", aSelectedCarouselItems2);

			var aCarouselItems3 = this.getView().getModel("view").getProperty("/Promoted");
			var oSelectedPromoted3 = aCarouselItems3.pop();
			aSelectedCarouselItems3.push(oSelectedPromoted3);
			this.getModel("view").setProperty("/carouselItem3", aSelectedCarouselItems3);

			var aCarouselItems4 = this.getView().getModel("view").getProperty("/Promoted");
			var oSelectedPromoted4 = aCarouselItems4.pop();
			aSelectedCarouselItems4.push(oSelectedPromoted4);
			this.getModel("view").setProperty("/carouselItem4", aSelectedCarouselItems4);

			var aCarouselItems5 = this.getView().getModel("view").getProperty("/Promoted");
			var oSelectedPromoted5 = aCarouselItems5.pop();
			aSelectedCarouselItems5.push(oSelectedPromoted5);
			this.getModel("view").setProperty("/carouselItem5", aSelectedCarouselItems5);
		}
	});
});