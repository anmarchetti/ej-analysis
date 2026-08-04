define(["sitecore", "/-/speak/v1/experienceprofile/DataProviderHelper.js", "/-/speak/v1/experienceprofile/CintelUtl.js"], function (sc, providerHelper, cintelUtil) {
    var intelPath = "/intel",
    dataSetProperty = "dataSet";
    
    var initializeTabExtension = (app) => {
        var transformers = $.map(
            [
                "default"
            ], function (tableName) {
                return { urlKey: intelPath + "/" + tableName + "?", headerValue: tableName };
            });

        providerHelper.setupHeaders(transformers);
        providerHelper.addDefaultTransformerKey();

        setupPreferences(app);
    }

    var setupPreferences = (app) => {
        var baseUrl = "/api/Contacts/Preferences?contactId=" + cintelUtil.getQueryParam("cid");
        providerHelper.initProvider(app.ContactDetailsDataProvider, "", baseUrl, app.PreferencesMessageBar);
        providerHelper.getData(
            app.ContactDetailsDataProvider,
            $.proxy(function (jsonData) {
                cintelUtil.setText(app.FirstPartyMarketingValue, jsonData.Marketing?.FirstPartyMarketing, false);
                cintelUtil.setText(app.ThirdPartyMarketingValue, jsonData.Marketing?.ThirdPartyMarketing, false);
                cintelUtil.setText(app.MarketResearchOptOutValue, jsonData.Marketing?.MarketResearchOptOut, false);
                cintelUtil.setText(app.DoNotContactValue, jsonData.Marketing?.DoNotContact, false);
                
                cintelUtil.setText(app.PreferredValue, jsonData.Communication?.Preferred, false);
                cintelUtil.setText(app.WhatsAppNumberValue, jsonData.Communication?.WhatsAppNumber, false);
                cintelUtil.setText(app.TwitterAccountValue, jsonData.Communication?.TwitterAccount, false);
                cintelUtil.setText(app.FacebookAccountValue, jsonData.Communication?.FacebookAccount, false);
            }));
    }
    return initializeTabExtension;
});