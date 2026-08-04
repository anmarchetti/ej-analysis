using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.Multisite.Services;
using easyJet.Foundation.Optimizely.Logging;
using easyJet.Foundation.Optimizely.Models;
using easyJet.Foundation.Optimizely.Services;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.Optimizely.Tests.Services
{
    public class ExperimentSettingsServiceTests
    {
        private readonly ISettingsService settingsService;
        private readonly IOptimizelyService optimizelyService;
        private readonly IOptimizelyDecisionContext decisionContext;
        private readonly IOptimizelyExperimentationGateService experimentationGateService;
        private readonly IOptimizelyLogger logger;
        private readonly ExperimentSettingsService sut;

        public ExperimentSettingsServiceTests()
        {
            settingsService = Substitute.For<ISettingsService>();
            optimizelyService = Substitute.For<IOptimizelyService>();
            decisionContext = Substitute.For<IOptimizelyDecisionContext>();
            experimentationGateService = Substitute.For<IOptimizelyExperimentationGateService>();
            logger = Substitute.For<IOptimizelyLogger>();
            decisionContext.GetAll().Returns(new List<OptimizelyDecisionContextModel>());
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(true);
            sut = new ExperimentSettingsService(settingsService, optimizelyService, decisionContext, experimentationGateService, logger);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldReturnEmptyList_WhenSettingsServiceReturnsNull()
        {
            // Arrange
            settingsService.GetAllSettings().Returns((List<Dictionary<string, object>>)null);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldReturnEmptyList_WhenSettingsServiceReturnsEmptyList()
        {
            // Arrange
            settingsService.GetAllSettings().Returns(new List<Dictionary<string, object>>());

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenExperimentsKeyIsMissing(
            string settingKey,
            string settingValue)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object> { { settingKey, settingValue } }
            };
            settingsService.GetAllSettings().Returns(settings);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
            optimizelyService.DidNotReceive().Decide(Arg.Any<string[]>());
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenExperimentsValueIsEmpty(
            string settingKey,
            string settingValue)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, string.Empty }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
            optimizelyService.DidNotReceive().Decide(Arg.Any<string[]>());
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenExperimentsValueIsWhitespace(
            string settingKey,
            string settingValue)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "   " }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
            optimizelyService.DidNotReceive().Decide(Arg.Any<string[]>());
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenOptimizelyReturnsNull(
            string settingKey,
            string settingValue,
            string flagKey)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);
            optimizelyService.Decide(Arg.Any<string[]>())
                .Returns((Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>)null);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenNoDecisionsAreEnabled(
            string settingKey,
            string settingValue,
            string flagKey)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { flagKey, (false, "control", new Dictionary<string, object>()) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
        }

        [Theory]
        [AutoData]
        public void GetAllSettingsWithExperiments_ShouldReturnBaseSettings_WhenExperimentationIsDisabledForCurrentLanguage(
            string settingKey,
            string settingValue,
            string flagKey)
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(false);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
            optimizelyService.DidNotReceive().Decide(Arg.Any<string[]>());
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldMergeExperimentValues_WhenDecisionIsEnabled()
        {
            // Arrange
            const string settingKey = "TestSetting";
            const string originalValue = "OriginalValue";
            const string experimentValue = "ExperimentValue";
            const string flagKey = "test-flag";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, originalValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var experimentVariables = new Dictionary<string, object>
            {
                { settingKey, experimentValue }
            };
            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { flagKey, (true, "variation", experimentVariables) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().NotBeSameAs(settings);
            result.Should().HaveCount(1);
            result[0][settingKey].Should().Be(experimentValue);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldNotModifyOriginalSettings_WhenApplyingExperiments()
        {
            // Arrange
            const string settingKey = "TestSetting";
            const string originalValue = "OriginalValue";
            const string experimentValue = "ExperimentValue";
            const string flagKey = "test-flag";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, originalValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var experimentVariables = new Dictionary<string, object>
            {
                { settingKey, experimentValue }
            };
            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { flagKey, (true, "variation", experimentVariables) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            settings[0][settingKey].Should().Be(originalValue);
            result[0][settingKey].Should().Be(experimentValue);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldIgnoreVariables_WhenKeyDoesNotExistInSettings()
        {
            // Arrange
            const string existingKey = "ExistingSetting";
            const string existingValue = "ExistingValue";
            const string nonExistentKey = "NonExistentSetting";
            const string flagKey = "test-flag";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { existingKey, existingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var experimentVariables = new Dictionary<string, object>
            {
                { nonExistentKey, "SomeValue" }
            };
            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { flagKey, (true, "variation", experimentVariables) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result[0].Should().NotContainKey(nonExistentKey);
            result[0][existingKey].Should().Be(existingValue);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldHandleMultipleFlags_WithCommaSeparation()
        {
            // Arrange
            const string settingKey1 = "Setting1";
            const string settingKey2 = "Setting2";
            const string originalValue1 = "Original1";
            const string originalValue2 = "Original2";
            const string experimentValue1 = "Experiment1";
            const string experimentValue2 = "Experiment2";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey1, originalValue1 },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "flag1, flag2" }
                },
                new Dictionary<string, object>
                {
                    { settingKey2, originalValue2 }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { "flag1", (true, "variation1", new Dictionary<string, object> { { settingKey1, experimentValue1 } }) },
                { "flag2", (true, "variation2", new Dictionary<string, object> { { settingKey2, experimentValue2 } }) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result[0][settingKey1].Should().Be(experimentValue1);
            result[1][settingKey2].Should().Be(experimentValue2);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldCallOptimizelyWithDistinctFlags()
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { "TestSetting", "TestValue" },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "flag1, flag1, flag2, flag1" }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>();
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            sut.GetAllSettingsWithExperiments();

            // Assert
            optimizelyService.Received(1).Decide(Arg.Is<string[]>(flags =>
                flags.Length == 2 &&
                flags[0] == "flag1" &&
                flags[1] == "flag2"));
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldTrimFlagNames()
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { "TestSetting", "TestValue" },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "  flag1  ,  flag2  " }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>();
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            sut.GetAllSettingsWithExperiments();

            // Assert
            optimizelyService.Received(1).Decide(Arg.Is<string[]>(flags =>
                flags.Length == 2 &&
                flags[0] == "flag1" &&
                flags[1] == "flag2"));
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldHandleEnabledDecisionWithNullVariables()
        {
            // Arrange
            const string settingKey = "TestSetting";
            const string settingValue = "TestValue";
            const string flagKey = "test-flag";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey, settingValue },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { flagKey, (true, "variation", null) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().HaveCount(1);
            result[0][settingKey].Should().Be(settingValue);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldOnlyApplyEnabledDecisions()
        {
            // Arrange
            const string settingKey1 = "Setting1";
            const string settingKey2 = "Setting2";
            const string originalValue1 = "Original1";
            const string originalValue2 = "Original2";
            const string experimentValue1 = "Experiment1";
            const string experimentValue2 = "Experiment2";

            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { settingKey1, originalValue1 },
                    { settingKey2, originalValue2 },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "flag1, flag2" }
                }
            };
            settingsService.GetAllSettings().Returns(settings);

            var decisions = new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
            {
                { "flag1", (true, "variation1", new Dictionary<string, object> { { settingKey1, experimentValue1 } }) },
                { "flag2", (false, "control", new Dictionary<string, object> { { settingKey2, experimentValue2 } }) }
            };
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(decisions);

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result[0][settingKey1].Should().Be(experimentValue1);
            result[0][settingKey2].Should().Be(originalValue2);
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldAddOptimizelyMetadata_WhenDecisionDetailsExist()
        {
            // Arrange
            const string flagKey = "flag-1";
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { "TestSetting", "TestValue" },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, flagKey }
                }
            };
            settingsService.GetAllSettings().Returns(settings);
            optimizelyService.Decide(Arg.Any<string[]>()).Returns(
                new Dictionary<string, (bool Enabled, string Variation, IDictionary<string, object> Variables)>
                {
                    { flagKey, (false, "control", new Dictionary<string, object>()) }
                });

            decisionContext.GetAll().Returns(
                new List<OptimizelyDecisionContextModel>
                {
                    new OptimizelyDecisionContextModel
                    {
                        FeatureKey = flagKey,
                        VariationKey = "control",
                        ExperimentKey = "exp-1",
                        IsDisabled = false,
                        Source = OptimizelyDecisionSource.Default,
                    }
                });
            decisionContext.GetUserId().Returns("user-1");
            decisionContext.GetUserAttributes().Returns(new Dictionary<string, object> { { "site", "holidays" } });

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result[0].Should().ContainKey(Constants.SiteSettings.OptimizelyDecisionsKey);
            result[0].Should().ContainKey(Constants.SiteSettings.OptimizelyUserIdKey);
            result[0].Should().ContainKey(Constants.SiteSettings.OptimizelyUserAttributesKey);
            result[0][Constants.SiteSettings.OptimizelyUserIdKey].Should().Be("user-1");
            ((string)result[0][Constants.SiteSettings.OptimizelyDecisionsKey]).Should().Contain("\"featureKey\":\"flag-1\"");
            ((string)result[0][Constants.SiteSettings.OptimizelyDecisionsKey]).Should().Contain("\"source\":\"Default\"");
            ((string)result[0][Constants.SiteSettings.OptimizelyUserAttributesKey]).Should().Contain("\"site\":\"holidays\"");
        }

        [Fact]
        public void GetAllSettingsWithExperiments_ShouldNotAddOptimizelyMetadata_WhenExperimentationIsDisabled()
        {
            // Arrange
            var settings = new List<Dictionary<string, object>>
            {
                new Dictionary<string, object>
                {
                    { "TestSetting", "TestValue" },
                    { Constants.SiteSettings.SiteSettingsExperimentsKey, "flag-1" }
                }
            };
            settingsService.GetAllSettings().Returns(settings);
            experimentationGateService.IsEnabledForCurrentLanguage().Returns(false);
            decisionContext.GetAll().Returns(
                new List<OptimizelyDecisionContextModel>
                {
                    new OptimizelyDecisionContextModel { FeatureKey = "flag-1", IsDisabled = true }
                });

            // Act
            var result = sut.GetAllSettingsWithExperiments();

            // Assert
            result.Should().BeSameAs(settings);
            result[0].Should().NotContainKey(Constants.SiteSettings.OptimizelyDecisionsKey);
            result[0].Should().NotContainKey(Constants.SiteSettings.OptimizelyUserIdKey);
            result[0].Should().NotContainKey(Constants.SiteSettings.OptimizelyUserAttributesKey);
        }
    }
}
