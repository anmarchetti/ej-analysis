using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using AutoFixture.Xunit2;
using easyJet.Feature.ScrappingTrigger.Logging;
using easyJet.Feature.ScrappingTrigger.Services;
using easyJet.Feature.ScrappingTrigger.Settings;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.ScrappingTrigger.Tests.Services
{
    public class ScrapingTriggerFilterServiceTests
    {
        private readonly IScrappingTriggerLogger logger;
        private readonly IScrapingTriggerSettingsService settingsService;

        public ScrapingTriggerFilterServiceTests()
        {
            logger = Substitute.For<IScrappingTriggerLogger>();
            settingsService = Substitute.For<IScrapingTriggerSettingsService>();
        }

        [Fact]
        public void Filter_ShouldReturnNull_IfParameterIsNull()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.Filter(null);

            // Assert
            result.Should().BeNull();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Filter_ShouldReturnNull_IfTemplateDoesNotMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(ID.NewID);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.Filter(new List<Item> { item });

            // Assert
            result.Should().BeEmpty();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void Filter_ShouldReturnList_IfTemplateDoesMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.Filter(new List<Item> { item });

            // Assert
            result.Should().NotBeNull();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void IsMatch_ShouldReturnFalse_IfParameterIsNull()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.IsMatching(null);

            // Assert
            result.Should().BeFalse();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void IsMatch_ShouldReturnFalse_IfTemplateDoesNotMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(ID.NewID);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.IsMatching(item);

            // Assert
            result.Should().BeFalse();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void IsMatch_ShouldReturnTrue_IfTemplateDoesMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.IsMatching(item);

            // Assert
            result.Should().BeTrue();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void GetPageItems_ShouldReturnNull_IfParameterIsNull()
        {
            // Arrange
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(null, new List<ID>());

            // Assert
            result.Should().BeNullOrEmpty();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetPageItems_ShouldReturnNull_IfTDeletedIsNull(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(item, null);

            // Assert
            result.Should().BeNullOrEmpty();
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetPageItems_ShouldReturnItem_IfTemplateDoesMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(item, new List<ID>());

            // Assert
            result.Should().Contain(item);
            result.Should().HaveCount(1);
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetPageItems_ShouldReturnAncestor_IfDeleted(ID templateId)
        {
            // Arrange
            var ancestor = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemAxes();
            var fakeItem = new FakeItem().WithRuntimeSettings().WithTemplate(templateId).WithItemAxes().WithParent(ancestor);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var item = fakeItem.ToSitecoreItem();
            item.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(ancestor);

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(item, new List<ID> { item.ID });

            // Assert
            result.Should().Contain(ancestor);
            result.Should().HaveCount(1);
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetPageItems_ShouldNotReturnItem_IfTemplateDoesNotMatch(ID templateId)
        {
            // Arrange
            var item = new FakeItem().WithRuntimeSettings().WithTemplate(ID.NewID).WithItemAxes();
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(item, new List<ID>()).ToList();

            // Assert
            result.Should().NotContain(item);
            result.Should().HaveCount(0);
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void GetPageItems_ShouldNotReturnParent_IfTemplateDoesNotMatch(ID templateId)
        {
            // Arrange
            var parent = new FakeItem().WithRuntimeSettings().WithTemplate(templateId);
            var fakeItem = new FakeItem().WithRuntimeSettings().WithTemplate(ID.NewID).WithItemAxes().WithParent(parent);
            var item = fakeItem.ToSitecoreItem();
            item.Axes.SelectSingleItem(Arg.Any<string>()).ReturnsForAnyArgs(parent);
            settingsService.GetSettings().Returns(new ScrapingTriggerSettings
            {
                IsEnabled = true,
                Templates = new HashSet<ID> { templateId }
            });

            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.GetPageItems(item, new List<ID>()).ToList();

            // Assert
            result.Should().Contain(parent);
            result.Should().HaveCount(1);
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void HasRedirect_ShouldReturnFalse_IfItemIsNull()
        {
            // Arrange
            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.HasRedirect(null);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRedirect_ShouldReturnFalse_IfFieldIsNUll()
        {
            // Arrange
            var item = new FakeItem();
            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.HasRedirect(item);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRedirect_ShouldReturnFalse_IfFieldIsEmpty()
        {
            // Arrange
            var item = new FakeItem().WithField(Constants.Fields.RedirectUrl, string.Empty);
            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.HasRedirect(item);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void HasRedirect_ShouldReturnTrue_IfFieldNotEmpty()
        {
            // Arrange
            var item = new FakeItem().WithField(Constants.Fields.RedirectUrl, "redirect");
            var sut = new ScrapingTriggerFilterService(settingsService);

            // Act
            var result = sut.HasRedirect(item);

            // Assert
            result.Should().BeTrue();
        }
    }
}