using System;
using System.Collections.Generic;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.Globalization;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Services
{
    public class OptimizelyExperimentationGateServiceTests
    {
        private readonly IOptimizelyLogger logger;
        private readonly IConsentService consentService;

        public OptimizelyExperimentationGateServiceTests()
        {
            logger = Substitute.For<IOptimizelyLogger>();
            consentService = Substitute.For<IConsentService>();
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenSettingsPathIsEmpty()
        {
            var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
            {
                OptimizelySettingsPath = string.Empty,
            };

            var result = sut.IsEnabledForCurrentLanguage();

            result.Should().BeFalse();
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenContextDatabaseIsNull()
        {
            var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
            {
                OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                Language = Language.Parse("en"),
            };

            var result = sut.IsEnabledForCurrentLanguage();

            result.Should().BeFalse();
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenContextLanguageIsNull()
        {
            consentService.IsPersonalizationConsentGiven().Returns(true);
            using (var db = new Db())
            {
                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeFalse();
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenSettingsItemIsMissing()
        {
            using (var db = new Db())
            {
                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                    SettingsItem = null,
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeFalse();
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnTrue_WhenCheckboxIsEnabled()
        {
            var settingDbItem = new DbItem("Optimizely Settings")
            {
                { Constants.SiteSettings.IsOptimizelyExperimentationEnabled, "1" },
            };
            consentService.IsPersonalizationConsentGiven().Returns(true);

            using (var db = new Db())
            {
                db.Add(settingDbItem);
                var settingItem = db.GetItem(settingDbItem.ID);

                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                    SettingsItem = settingItem,
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeTrue();
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenCheckboxIsDisabled()
        {
            var settingDbItem = new DbItem("Optimizely Settings")
            {
                { Constants.SiteSettings.IsOptimizelyExperimentationEnabled, string.Empty },
            };
            consentService.IsPersonalizationConsentGiven().Returns(true);

            using (var db = new Db())
            {
                db.Add(settingDbItem);
                var settingItem = db.GetItem(settingDbItem.ID);

                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                    SettingsItem = settingItem,
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeFalse();
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenErrorOccurs()
        {
            using (var db = new Db())
            {
                consentService.IsPersonalizationConsentGiven().Returns(true);
                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                    ThrowOnGetSettingsItem = true,
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeFalse();
                logger.Received(1).Error(
                    Arg.Any<string>(),
                    Arg.Any<Exception>(),
                    Arg.Any<object>());
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldUseRequestCache_WhenCalledMultipleTimes()
        {
            var settingDbItem = new DbItem("Optimizely Settings")
            {
                { Constants.SiteSettings.IsOptimizelyExperimentationEnabled, "1" },
            };

            consentService.IsPersonalizationConsentGiven().Returns(true);

            using (var db = new Db())
            {
                db.Add(settingDbItem);
                var settingItem = db.GetItem(settingDbItem.ID);

                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                    SettingsItem = settingItem,
                };

                var firstResult = sut.IsEnabledForCurrentLanguage();
                var secondResult = sut.IsEnabledForCurrentLanguage();

                firstResult.Should().BeTrue();
                secondResult.Should().BeTrue();
                sut.GetSettingsItemCallCount.Should().Be(1);
            }
        }

        [Fact]
        public void IsEnabledForCurrentLanguage_ShouldReturnFalse_WhenConsentIsNotGiven()
        {
            using (var db = new Db())
            {
                consentService.IsPersonalizationConsentGiven().Returns(false);

                var sut = new TestableOptimizelyExperimentationGateService(logger, consentService)
                {
                    OptimizelySettingsPath = "/sitecore/content/EasyJet/Holidays/Settings/Optimizely Settings",
                    Database = db.Database,
                    Language = Language.Parse("en"),
                };

                var result = sut.IsEnabledForCurrentLanguage();

                result.Should().BeFalse();
            }
        }

        private class TestableOptimizelyExperimentationGateService : OptimizelyExperimentationGateService
        {
            private readonly Dictionary<string, object> requestCache = new Dictionary<string, object>();

            public TestableOptimizelyExperimentationGateService(IOptimizelyLogger logger, IConsentService consentService)
                : base(logger, consentService)
            {
            }

            public string OptimizelySettingsPath { get; set; }

            public Database Database { get; set; }

            public Language Language { get; set; }

            public Item SettingsItem { get; set; }

            public bool ThrowOnGetSettingsItem { get; set; }

            public int GetSettingsItemCallCount { get; private set; }

            protected override string GetOptimizelySettingsPath() => OptimizelySettingsPath;

            protected override Database GetContextDatabase() => Database;

            protected override Language GetContextLanguage() => Language;

            protected override Item GetSettingsItem(Database database, string settingPath, Language language)
            {
                GetSettingsItemCallCount++;
                if (ThrowOnGetSettingsItem)
                {
                    throw new InvalidOperationException("test");
                }

                return SettingsItem;
            }

            protected override object GetRequestCacheItem(string cacheKey) => requestCache.TryGetValue(cacheKey, out var value) ? value : null;

            protected override void SetRequestCacheItem(string cacheKey, object value) => requestCache[cacheKey] = value;
        }
    }
}
