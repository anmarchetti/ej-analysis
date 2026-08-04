define(["sitecore", "/-/speak/v1/experienceprofile/DataProviderHelper.js", "./Modal.js"], function (sc, providerHelper, modal) {
    var app = sc.Definitions.App.extend({
        initialized: function () {
            var tableName = "speakemails";
            var localUrl = "/intel/" + tableName;

            providerHelper.setupHeaders([
                { urlKey: localUrl + "?", headerValue: tableName }
            ]);

            var url = sc.Contact.baseUrl + localUrl;

            providerHelper.initProvider(this.EmailsDataProvider, tableName, url, this.EmailsMessageBar);

            providerHelper.subscribeSorting(this.EmailsDataProvider, this.EmailsList);
            providerHelper.getListData(this.EmailsDataProvider);

            providerHelper.subscribeAccordionHeader(this.EmailsDataProvider, this.EmailsAccordion);

            var settings = {
                speedOpen: 50,
                speedClose: 250,
                activeClass: 'is-active',
                visibleClass: 'is-visible',
                selectorTarget: '[data-modal-target]',
                selectorTrigger: '[data-modal-trigger]',
                selectorClose: '[data-modal-close]',
            };

            var getHeader = function(){
                return `<strong>Subject:</strong> ${this.EmailsList.get("selectedItem").get("Subject")}<br/> <strong>SentDate</strong>: ${this.EmailsList.get("selectedItem").get("SentDate")}`;
            }
            var getBody = function(){
                return this.EmailsList.get("selectedItem").get("Body");
            }

            modal.insertModal(document.getElementsByClassName("sc-fullWidth")[0], "emails_body_modal", settings);
            modal.subscribeDialog(this.EmailsList, getHeader.bind(this), getBody.bind(this), this);
        }

    });
    return app;
});