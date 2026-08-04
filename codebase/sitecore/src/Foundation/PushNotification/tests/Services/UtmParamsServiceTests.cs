using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using easyJet.Foundation.PushNotifications.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using NSubstitute;
using Xunit;

namespace easyJet.Feature.PushNotifications.Tests.Services
{
    public class UtmParamsServiceTests
    {
        private readonly IConfiguration configuration;
        private readonly UtmParamsService service;

        public UtmParamsServiceTests()
        {
            configuration = Substitute.For<IConfiguration>();
            service = new UtmParamsService(configuration);
        }

        [Fact]
        public void SetUtmParams_ShouldNotSetContentParams_IfContentIsEmpty()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_campaign=fake_campaing";

            // Act
            var actual = service.SetUtmParams(url, null, "fake_campaing");

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldNotSetCampaingParams_IfCampaingIsEmpty()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_content=fake_content";

            // Act
            var actual = service.SetUtmParams(url, "fake_content", null);

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldSetPredefinedParams_IfConfigHasQueryParamsSection()
        {
            // Arrange
            string url = "https://fake.com/some";
            string expectedUrl = "https://fake.com/some?utm_medium=push&utm_source=holidays";

            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();

            // Act
            var actual = new UtmParamsService(config).SetUtmParams(url, null, null);

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldReturnEmptyString_IfUrlIsNull()
        {
            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();
            // Act
            var actual = service.SetUtmParams(null, null, null);

            // Assert
            actual.Should().Be(string.Empty);
        }

        [Fact]
        public void SetUtmParams_ShouldSetCampaign_IfCampaignIsNotEmpty()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_medium=push&utm_source=holidays&utm_campaign=fake_campaign&utm_content=fake_content";
            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();

            // Act
            var actual = new UtmParamsService(config).SetUtmParamsForTokenizedUrl(url, "fake_content", "fake_campaign");

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldSetContent_IfCampaignIsEmpty()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_medium=push&utm_source=holidays&utm_content=fake_content";
            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();

            // Act
            var actual = new UtmParamsService(config).SetUtmParamsForTokenizedUrl(url, "fake_content", null);

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldSetCampaign_IfContentIsEmpty()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_medium=push&utm_source=holidays&utm_campaign=fake_campaign";
            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();

            // Act
            var actual = new UtmParamsService(config).SetUtmParamsForTokenizedUrl(url, null, "fake_campaign");

            // Assert
            actual.Should().Be(expectedUrl);
        }

        [Fact]
        public void SetUtmParams_ShouldReturnUrl_IfNotSetup()
        {
            // Arrange
            string url = "https://fake.com/some";
            var expectedUrl = "https://fake.com/some?utm_medium=push&utm_source=holidays";
            var config = new ConfigurationBuilder()
                .AddXmlFile("App_Config//sc.PushNotifications.FakeConfig.xml").Build();

            // Act
            var actual = new UtmParamsService(config).SetUtmParamsForTokenizedUrl(url, null, null);

            // Assert
            actual.Should().Be(expectedUrl);
        }
    }
}
