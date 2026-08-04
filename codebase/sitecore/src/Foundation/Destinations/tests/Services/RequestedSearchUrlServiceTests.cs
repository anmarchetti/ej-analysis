using easyJet.Foundation.Destinations.Services;
using NSubstitute;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Sitecore.Links.UrlBuilders;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class RequestedSearchUrlServiceTests
    {
        private readonly RequestedSearchUrlService requestedSearchUrlService;
        private readonly BaseLinkManager linkManager;

        public RequestedSearchUrlServiceTests()
        {
            linkManager = NSubstitute.Substitute.For<BaseLinkManager>();
            requestedSearchUrlService = new RequestedSearchUrlService(linkManager);
        }

        [Fact]
        public void GetLiveSiteBaseUrl_IfLiveSiteBaseUrlFoundOnMarketTemplate_ReturnsLiveSiteBaseUrlFromTemplate()
        {
            string fieldName = "LiveSiteBaseUrl", expectedValue = "ExpectedUrlFromMarketTemplate",
                rootSectionName = "rootSection", innerSectionName = "innerSectionName", childItemName = "child";
            var templateId = Constants.TemplateIds.RequestedSearchesMarketFolder;
            var template = new DbTemplate("RequestedSearchesMarketFolder", templateId)
            {
                new DbField(fieldName)
            };

            using (var db = new Db
            {
                template,
                new DbItem(rootSectionName)
                {
                    new DbItem(innerSectionName, id: ID.NewID, templateId: templateId)
                    {
                        { fieldName, expectedValue },
                        new DbItem(childItemName)
                    }
                }
            })
            {
                var item = db.GetItem($"/sitecore/content/{rootSectionName}/{innerSectionName}/{childItemName}");

                var liveSiteBaseUrl = requestedSearchUrlService.GetLiveSiteBaseUrl(item, "liveBaseUrlFromSettings");

                Assert.NotNull(liveSiteBaseUrl);
                Assert.Equal(expectedValue, liveSiteBaseUrl);
            }
        }

        [Fact]
        public void GetLiveSiteBaseUrl_IfLiveSiteBaseUrlNotFoundOnMarketTemplate_ReturnsDefaultLiveBaseUrl()
        {
            string fieldName = "Not-LiveSiteBaseUrl", expectedValue = "ExpectedUrlFromMarketTemplate",
                rootSectionName = "rootSection", innerSectionName = "innerSectionName", childItemName = "child",
                incomingDefaultLiveBaseUrl = "defaultliveBaseUrl/{language}/test", expectedLiveBaseUrl = "defaultliveBaseUrl/en/test";
            var templateId = Constants.TemplateIds.RequestedSearchesMarketFolder;
            var template = new DbTemplate("RequestedSearchesMarketFolder", templateId)
            {
                new DbField(fieldName)
            };

            using (var db = new Db
            {
                template,
                new DbItem(rootSectionName)
                {
                    new DbItem(innerSectionName, id: ID.NewID, templateId: templateId)
                    {
                        { fieldName, expectedValue },
                        new DbItem(childItemName)
                    }
                }
            })
            {
                var item = db.GetItem($"/sitecore/content/{rootSectionName}/{innerSectionName}/{childItemName}");

                var liveSiteBaseUrl = requestedSearchUrlService.GetLiveSiteBaseUrl(item, incomingDefaultLiveBaseUrl);

                Assert.NotNull(liveSiteBaseUrl);
                Assert.Equal(expectedLiveBaseUrl, liveSiteBaseUrl);
            }
        }

        [Fact]
        public void BuildUrl_WhenItemAndBaseUrlPassed_ValidUrlIsReturned()
        {
            var urlBuilderOptions = new ItemUrlBuilderOptions { AlwaysIncludeServerUrl = false };
            linkManager.GetDefaultUrlBuilderOptions().Returns(urlBuilderOptions);

            string rootSectionName = "rootSection", innerSectionName = "innerSectionName", childItemName = "child",
                baseUrl = "baseUrl/", itemRelativePath = "relative-path", expectedUrl = $"{baseUrl}{itemRelativePath}";
            var templateId = Constants.TemplateIds.RequestedSearchesMarketFolder;

            using (var db = new Db
            {
                new DbItem(rootSectionName)
                {
                    new DbItem(innerSectionName, id: ID.NewID, templateId: templateId)
                    {
                        new DbItem(childItemName)
                    }
                }
            })
            {
                var item = db.GetItem($"/sitecore/content/{rootSectionName}/{innerSectionName}/{childItemName}");
                linkManager.GetItemUrl(item, urlBuilderOptions).Returns(itemRelativePath);

                var itemUrl = requestedSearchUrlService.BuildUrl(item, baseUrl);

                Assert.NotNull(itemUrl);
                Assert.Equal(expectedUrl, itemUrl);
            }
        }
    }
}
