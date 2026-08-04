using System;
using System.Web.UI.HtmlControls;
using AutoFixture.Xunit2;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.Testing.Extensions;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Caching;
using Sitecore.Layouts;
using Sitecore.Web.UI.HtmlControls;
using Xunit;
using Page = System.Web.UI.Page;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class EnvironmentHintServiceTests
    {
        private readonly ISitecoreEnhancmentLogger logger;
        private readonly IEnvironmentHintSettingsService settings;
        private readonly IPageScriptManagerProvider pageScriptManagerProvider;
        private readonly ISitecoreContextProvider sitecoreContextProvider;
        private readonly EnvironmentHintService sut;

        public EnvironmentHintServiceTests()
        {
            logger = Substitute.For<ISitecoreEnhancmentLogger>();
            settings = Substitute.For<IEnvironmentHintSettingsService>();
            pageScriptManagerProvider = Substitute.For<IPageScriptManagerProvider>();
            sitecoreContextProvider = Substitute.For<ISitecoreContextProvider>();
            sut = new EnvironmentHintService(logger, settings, pageScriptManagerProvider, sitecoreContextProvider);
        }

        [Fact]
        public void AddEnvironmentStyle_ShouldDoNothing_IfSettingsNotSet()
        {
            // Arrange
            var pageScriptManager = PageScriptManager.Create();
            var itemsContext = new ItemsContext
            {
                ["sc_pagescriptmanager"] = pageScriptManager
            };
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new HtmlHead() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Returns(itemsContext);
            sitecoreContextProvider.Page.Returns(pageContext);
            pageScriptManagerProvider.Current.Returns(pageScriptManager);

            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageScriptManager.StylesheetFiles.Should().BeNullOrEmpty();
            pageContext.Page.Controls[0].Controls.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void AddEnvironmentStyle_ShouldDoNothing_IfPathIsNotMatching(string environmentName, string fontColor, string backgroundColor, string paths)
        {
            // Arrange
            var pageScriptManager = PageScriptManager.Create();
            var itemsContext = new ItemsContext
            {
                ["sc_pagescriptmanager"] = pageScriptManager
            };
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new HtmlHead() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Returns(itemsContext);
            sitecoreContextProvider.Page.Returns(pageContext);
            pageScriptManagerProvider.Current.Returns(pageScriptManager);
            settings.EnvironmentName.Returns(environmentName);
            settings.BackgroundColor.Returns(backgroundColor);
            settings.Paths.Returns(paths);
            settings.FontColor.Returns(fontColor);

            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageScriptManager.StylesheetFiles.Should().BeNullOrEmpty();
            pageContext.Page.Controls[0].Controls.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void AddEnvironmentStyle_ShouldAddStyle_IfPagescriptmanagerIsSet(string environmentName, string fontColor, string backgroundColor)
        {
            // Arrange
            var pageScriptManager = PageScriptManager.Create();
            var itemsContext = new ItemsContext
            {
                ["sc_pagescriptmanager"] = pageScriptManager
            };
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new HtmlHead() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Returns(itemsContext);
            sitecoreContextProvider.Page.Returns(pageContext);
            pageScriptManagerProvider.Current.Returns(pageScriptManager);
            settings.EnvironmentName.Returns(environmentName);
            settings.BackgroundColor.Returns(backgroundColor);
            settings.Paths.Returns("~/sitecore/login/default.aspx");
            settings.FontColor.Returns(fontColor);

            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageScriptManager.StylesheetFiles.Should().NotBeNullOrEmpty();
            pageContext.Page.Controls[0].Controls.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void AddEnvironmentStyle_ShouldAddStyle_IfPageContextContainsHtmlHead(string environmentName, string fontColor, string backgroundColor)
        {
            // Arrange
            var itemsContext = new ItemsContext();
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new HtmlHead() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Returns(itemsContext);
            sitecoreContextProvider.Page.Returns(pageContext);
            settings.EnvironmentName.Returns(environmentName);
            settings.BackgroundColor.Returns(backgroundColor);
            settings.Paths.Returns("~/sitecore/login/default.aspx");
            settings.FontColor.Returns(fontColor);
            itemsContext["sc_pagescriptmanager"] = null;

            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageContext.Page.Controls[0].Controls.Should().NotBeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void AddEnvironmentStyle_ShouldDoNothing_IfPageContextNotContainsHtmlHead(string environmentName, string fontColor, string backgroundColor)
        {
            // Arrange
            var pageScriptManager = PageScriptManager.Create();
            var itemsContext = new ItemsContext();
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new Page() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Returns(itemsContext);
            sitecoreContextProvider.Page.Returns(pageContext);
            pageScriptManagerProvider.Current.Returns(pageScriptManager);
            settings.EnvironmentName.Returns(environmentName);
            settings.BackgroundColor.Returns(backgroundColor);
            settings.Paths.Returns("~/sitecore/login/default.aspx");
            settings.FontColor.Returns(fontColor);
            itemsContext["sc_pagescriptmanager"] = null;

            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageScriptManager.StylesheetFiles.Should().BeNullOrEmpty();
            pageContext.Page.Controls[0].Controls.Should().BeNullOrEmpty();
        }

        [Theory]
        [AutoData]
        public void AddEnvironmentStyle_ShouldDoNothing_IfExceptionIsThrown(string environmentName, string fontColor, string backgroundColor)
        {
            // Arrange
            var pageScriptManager = PageScriptManager.Create();
            var itemsContext = new ItemsContext();
            var pageContext = new PageContext();
            var page = new Page
            {
                Controls = { new Page() },
                AppRelativeVirtualPath = "~/sitecore/login/default.aspx"
            };
            pageContext.ForceSetFieldValue("page", page);

            sitecoreContextProvider.Items.Throws<Exception>();
            sitecoreContextProvider.Page.Returns(pageContext);
            pageScriptManagerProvider.Current.Returns(pageScriptManager);
            settings.EnvironmentName.Returns(environmentName);
            settings.BackgroundColor.Returns(backgroundColor);
            settings.Paths.Returns("~/sitecore/login/default.aspx");
            settings.FontColor.Returns(fontColor);
            itemsContext["sc_pagescriptmanager"] = null;
            // Act
            sut.AddEnvironmentStyle();

            // Assert
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
            pageScriptManager.StylesheetFiles.Should().BeNullOrEmpty();
            pageContext.Page.Controls[0].Controls.Should().BeNullOrEmpty();
        }
    }
}