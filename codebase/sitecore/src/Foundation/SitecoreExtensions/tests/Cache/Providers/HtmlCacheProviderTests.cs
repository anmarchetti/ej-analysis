using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.SitecoreExtensions.Cache.Providers;
using FluentAssertions;
using Sitecore;
using Sitecore.Collections;
using Sitecore.FakeDb.Sites;
using Sitecore.Sites;
using Xunit;

namespace easyJet.Foundation.SitecoreExtensions.Tests.Cache.Providers
{
    public class HtmlCacheProviderTests
    {
        [Fact]
        public void IsCacheEnabled_ShouldBeFalse_IfSiteContextNull()
        {
            // Arrange
            var actual = HtmlCacheProvider.IsCacheEnabled();

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void IsCacheEnabled_ShouldBeTrue_IfHtmlCacheIsEnable(string sitename)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.IsCacheEnabled();

                // Assert
                actual.Should().BeTrue();
            }
        }

        [Theory]
        [AutoData]
        public void IsCacheEnabled_ShouldBeFalse_IfHtmlCacheIsNotEnable(string sitename)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "false" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.IsCacheEnabled();

                // Assert
                actual.Should().BeFalse();
            }
        }

        [Theory]
        [AutoData]
        public void GetFromContext_ShouldBeNull_IfHtmlCacheIsNotEnable(string sitename, string key)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "false" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.GetFromContext<List<string>>(key);
                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void GetFromContext_ShouldBeEquivalentToPassedData_IfHtmlCacheIsEnable(string sitename, string key, List<string> data)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);
            siteContext.Caches.HtmlCache.InnerCache.Add(key, data);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.GetFromContext<List<string>>(key);

                // Assert
                actual.Should().BeEquivalentTo(data);
            }
        }

        [Theory]
        [AutoData]
        public void GetFromSiteSpecificContext_ShouldBeNull_IfHtmlCacheIsNotEnable(string sitename, string key)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "language", "en" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.GetFromSiteSpecificContext<List<string>>(key);

                // Assert
                actual.Should().BeNull();
            }
        }

        [Theory]
        [AutoData]
        public void SetToContext_ShouldBeNull_IfValueIsNull(string key)
        {
            // Arrange
            object value = null;

            // Act
            var actual = HtmlCacheProvider.SetToContext<object>(key, value);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void SetToContext_ShouldStoreItem(string sitename, string key, List<string> value)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "language", "en" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);
            siteContext.Caches.HtmlCache.InnerCache.Add(key, value);
            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.SetToContext(key, value);

                // Assert
                (Context.Site.Caches.HtmlCache.InnerCache[key] as List<string>).Should().BeEquivalentTo(value);
                actual.Should().BeEquivalentTo(value);
            }
        }

        [Theory]
        [AutoData]
        public void SetToContext_ShouldStoreItemForSpecificTime_IfItemIsSupplied(string sitename, string key, List<string> value, int expirationMinutes)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "language", "en" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);
            siteContext.Caches.HtmlCache.InnerCache.Add(key, value);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.SetToContext(key, value, expirationMinutes);

                // Assert
                (Context.Site.Caches.HtmlCache.InnerCache[key] as List<string>).Should().BeEquivalentTo(value);
                actual.Should().BeEquivalentTo(value);
            }
        }

        [Theory]
        [AutoData]
        public void SetToSiteSpecificContext_ShouldStoreItem_IfItemIsSupplied1(string sitename, List<string> value)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "language", "en" },
                { "htmlCacheSize", "50MB" }
            };

            var siteContext = new FakeSiteContext(siteSettings);

            var lang = "en";
            var siteSpecificKey = $"{sitename}_{sitename}_{lang}";

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                var actual = HtmlCacheProvider.SetToSiteSpecificContext(sitename, value, 0, lang);

                // Assert
                (Context.Site.Caches.HtmlCache.InnerCache[siteSpecificKey] as List<string>).Should().BeEquivalentTo(value);
                actual.Should().BeEquivalentTo(value);
            }
        }

        [Theory]
        [AutoData]
        public void RemoveFromSiteSpecificContext_ShouldRemoveDataFromCache_IfDataInCache(string sitename, List<string> value)
        {
            // Arrange
            var siteSettings = new StringDictionary()
            {
                { "name", sitename },
                { "database", "web" },
                { "cacheHtml", "true" },
                { "language", "en" },
                { "htmlCacheSize", "50MB" }
            };

            var lang = "en";
            var siteSpecificKey = $"{sitename}_{sitename}_{lang}";

            var siteContext = new FakeSiteContext(siteSettings);
            siteContext.Caches.HtmlCache.InnerCache.Add(siteSpecificKey, value);

            // Act
            using (new SiteContextSwitcher(siteContext))
            {
                HtmlCacheProvider.RemoveFromSiteSpecificContext(sitename, lang);

                var actual = Context.Site.Caches.HtmlCache.InnerCache[siteSpecificKey];

                // Assert
                actual.Should().BeNull();
            }
        }
    }
}
