using System.Collections.Generic;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Feature.SitecoreEnhancment.Workbox;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Abstractions;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class ConfigurationServiceTest
    {
        private readonly BaseSettings settings;
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IWorkboxConfigurationRepository workboxConfigurationRepository;
        private IConfigurationService sut;

        public ConfigurationServiceTest()
        {
            settings = Substitute.For<BaseSettings>();
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            workboxConfigurationRepository = Substitute.For<IWorkboxConfigurationRepository>();
            sut = new ConfigurationService(logger, workboxConfigurationRepository);
        }

        [Fact]
        public void GetWorkboxDictionary_EmptyDictionary_IfSettingsPathIsNotFound()
        {
            // Arrange
            settings.Configure().GetSetting(Constants.Workbox.WorkboxDictionaryXpathSettingsName).Returns(string.Empty);

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetWorkboxDictionary_EmptyDictionary_IfSettingsPathIsIncorrect()
        {
            // Arrange
            settings.Configure().GetSetting(Constants.Workbox.WorkboxDictionaryXpathSettingsName).Returns("test");

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetWorkboxDictionary_EmptyDictionary_IfConfigIsEmpty()
        {
            // Arrange
            var workboxDictionary = new WorkboxDictionary();
            workboxConfigurationRepository.GetWorkboxDictionaryConfig().Returns(workboxDictionary);

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetWorkboxDictionary_EmptyDictionary_IfConfigIsNull()
        {
            // Arrange
            var workboxDictionary = new WorkboxDictionary();
            workboxConfigurationRepository.GetWorkboxDictionaryConfig().Returns((WorkboxDictionary)null);

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            actual.Should().BeEmpty();
        }

        [Fact]
        public void GetWorkboxDictionary_Success()
        {
            // Arrange
            var workboxDictionary = new WorkboxDictionary();
            workboxDictionary.Entries.Add(new KeyValuePair<string, string>("key", "value"));
            workboxDictionary.Entries.Add(new KeyValuePair<string, string>("key2", "value2"));
            workboxConfigurationRepository.GetWorkboxDictionaryConfig().Returns(workboxDictionary);

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            actual.Count.Should().Be(2);
        }

        [Fact]
        public void GetWorkboxDictionary_Success_NoDuplicates()
        {
            // Arrange
            var workboxDictionary = new WorkboxDictionary();
            workboxDictionary.Entries.Add(new KeyValuePair<string, string>("key", "value"));
            workboxDictionary.Entries.Add(new KeyValuePair<string, string>("key", "value"));
            workboxConfigurationRepository.GetWorkboxDictionaryConfig().Returns(workboxDictionary);

            // Act
            var actual = sut.GetWorkboxDictionary();

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            actual.Count.Should().Be(1);
        }
    }
}