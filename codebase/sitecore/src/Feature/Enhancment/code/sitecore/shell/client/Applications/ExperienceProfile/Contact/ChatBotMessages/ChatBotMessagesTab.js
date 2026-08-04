define(["sitecore", "/-/speak/v1/experienceprofile/DataProviderHelper.js"], function (sc, providerHelper) {
    var app = sc.Definitions.App.extend({
        initialized: function () {
            var tableName = "speakchatbotmessages";
            var localUrl = "/intel/" + tableName;

            providerHelper.setupHeaders([
                { urlKey: localUrl + "?", headerValue: tableName }
            ]);

            var url = sc.Contact.baseUrl + localUrl;

            providerHelper.initProvider(this.MessagesDataProvider, tableName, url, this.ErrorMessageBar);

            providerHelper.subscribeSorting(this.MessagesDataProvider, this.MessagesList);
            providerHelper.getListData(this.MessagesDataProvider);

            providerHelper.subscribeAccordionHeader(this.MessagesDataProvider, this.ChatBotMessagesAccordion);
            
        }
    });
    return app;
});