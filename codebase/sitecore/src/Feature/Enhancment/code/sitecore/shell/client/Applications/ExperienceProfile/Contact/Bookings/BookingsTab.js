define(["sitecore", "/-/speak/v1/experienceprofile/DataProviderHelper.js"], function (sc, providerHelper) {
    var app = sc.Definitions.App.extend({
        initialized: function () {
            var tableName = "speakbookings";
            var localUrl = "/intel/" + tableName;

            providerHelper.setupHeaders([
                { urlKey: localUrl + "?", headerValue: tableName }
            ]);

            var url = sc.Contact.baseUrl + localUrl;

            providerHelper.initProvider(this.BookingsDataProvider, tableName, url, this.BookingsMessageBar);

            providerHelper.subscribeSorting(this.BookingsDataProvider, this.BookingsList);
            providerHelper.getListData(this.BookingsDataProvider);

            providerHelper.subscribeAccordionHeader(this.BookingsDataProvider, this.BookingsAccordion);
            
        }
    });
    return app;
});