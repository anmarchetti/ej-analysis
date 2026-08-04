using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Web;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Globalization;
using Sitecore.NSubstituteUtils;
using Sitecore.Text;
using Xunit;
using Version = Sitecore.Data.Version;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class FieldEditorUrlBuilderTests
    {
        private readonly IDatabaseProvider pDatabaseProvider;
        private readonly FieldEditorUrlBuilder pSut;

        public FieldEditorUrlBuilderTests()
        {
            pDatabaseProvider = Substitute.For<IDatabaseProvider>();
            pSut = new FieldEditorUrlBuilder(pDatabaseProvider, Substitute.For<IRenderingMappingLogger>());
        }

        [Fact]
        public void Constructor_WithNullDatabaseProvider_ThrowsArgumentNullException()
        {
            // Act
            Action act = () => new FieldEditorUrlBuilder(null, Substitute.For<IRenderingMappingLogger>());

            // Assert
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Constructor_WithNullLogger_ThrowsArgumentNullException()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();

            // Act
            Action act = () => new FieldEditorUrlBuilder(pDbProvider, null);

            // Assert
            act.Should().Throw<ArgumentNullException>().Where(ex => ex.ParamName == "logger");
        }

        [Fact]
        public void BuildFieldEditorUrl_WithNullRenderingId_ReturnsNull()
        {
            // Act
            var result = pSut.BuildFieldEditorUrl(ID.Null, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithRenderingItemNotFound_ReturnsNull()
        {
            // Arrange
            var pRenderingId = ID.NewID;
            pDatabaseProvider.GetItem(pRenderingId, DatabaseType.Master).Returns((Item)null);

            // Act
            var result = pSut.BuildFieldEditorUrl(pRenderingId, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithTemplateNotFound_ReturnsNull()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pRenderingId = ID.NewID;
            var pTemplateId = ID.NewID;
            var pRenderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pTemplateId.ToString())
                .ToSitecoreItem();

            pDbProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDbProvider.GetItem(pTemplateId, DatabaseType.Master).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            var result = pLocalSut.BuildFieldEditorUrl(pRenderingId, "key=value");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithNullCurrentParams_DoesNotThrow()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pRenderingId = ID.NewID;
            var pTemplateId = ID.NewID;
            var pRenderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pTemplateId.ToString())
                .ToSitecoreItem();
            var pTemplateItem = new FakeItem().ToSitecoreItem();

            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            pDbProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDbProvider.GetItem(pTemplateId, DatabaseType.Master).Returns(pTemplateItem);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            Action act = () => pLocalSut.BuildFieldEditorUrl(pRenderingId, null);

            // Assert
            act.Should().NotThrow();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithEmptyCurrentParams_DoesNotThrow()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pRenderingId = ID.NewID;
            var pTemplateId = ID.NewID;
            var pRenderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pTemplateId.ToString())
                .ToSitecoreItem();
            var pTemplateItem = new FakeItem().ToSitecoreItem();

            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            pDbProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDbProvider.GetItem(pTemplateId, DatabaseType.Master).Returns(pTemplateItem);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            Action act = () => pLocalSut.BuildFieldEditorUrl(pRenderingId, string.Empty);

            // Assert
            act.Should().NotThrow();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithNoParametersTemplate_ReturnsNull()
        {
            // Arrange
            var pRenderingId = ID.NewID;
            var pRenderingItem = new FakeItem().ToSitecoreItem();

            pDatabaseProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);

            // Act
            var result = pSut.BuildFieldEditorUrl(pRenderingId, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithEmptyParametersTemplate_ReturnsNull()
        {
            // Arrange
            var pRenderingId = ID.NewID;
            var pRenderingItem = new FakeItem().WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, string.Empty).ToSitecoreItem();

            pDatabaseProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);

            // Act
            var result = pSut.BuildFieldEditorUrl(pRenderingId, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithInvalidParametersTemplateGuid_ReturnsNull()
        {
            // Arrange
            var pRenderingId = ID.NewID;
            var pRenderingItem = new FakeItem().WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, "not-a-guid").ToSitecoreItem();
            pDatabaseProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);

            // Act
            var result = pSut.BuildFieldEditorUrl(pRenderingId, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithValidParameters_ReturnsUrlString()
        {
            // Arrange
            var pRenderingId = ID.NewID;
            var pTemplateId = ID.NewID;
            var pRenderingItem = new FakeItem().WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pTemplateId.ToString()).ToSitecoreItem();
            var pParametersTemplateItem = new FakeItem().ToSitecoreItem();

            var pMasterDb = Substitute.For<Database>();
            pDatabaseProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(pParametersTemplateItem);

            pDatabaseProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDatabaseProvider.GetItem(pTemplateId, DatabaseType.Master).Returns(pParametersTemplateItem);

            // Act
            var result = pSut.BuildFieldEditorUrl(pRenderingId, "test=params");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldEditorUrl_WithSpecialCharactersInParams_HandlesCorrectly()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pRenderingId = ID.NewID;
            var pTemplateId = ID.NewID;
            var pRenderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pTemplateId.ToString())
                .ToSitecoreItem();
            var pTemplateItem = new FakeItem().ToSitecoreItem();

            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            pDbProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDbProvider.GetItem(pTemplateId, DatabaseType.Master).Returns(pTemplateItem);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            Action act = () => pLocalSut.BuildFieldEditorUrl(pRenderingId, "key=value&special=test%26value");

            // Assert
            act.Should().NotThrow();
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithNullParams_ReturnsUrlWithEmptyValues()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            var result = pLocalSut.BuildBasicRenderingPropertiesUrl(null);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UrlString>();
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithEmptyParams_ReturnsUrlWithEmptyValues()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            var result = pLocalSut.BuildBasicRenderingPropertiesUrl(string.Empty);

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithValidParams_ReturnsUrlString()
        {
            // Arrange
            var pMasterDb = Substitute.For<Database>();
            pDatabaseProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pCurrentParams = $"{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.Placeholder)}=main&{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.DataSource)}=test";

            // Act
            var result = pSut.BuildBasicRenderingPropertiesUrl(pCurrentParams);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<UrlString>();
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithNoFields_ReturnsBasicUrl()
        {
            // Arrange
            var pMasterDb = Substitute.For<Database>();
            pDatabaseProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            var pTemplateItem = new FakeItem().ToSitecoreItem();
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(pTemplateItem);

            var pCurrentParams = $"{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.Placeholder)}=main&{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.DataSource)}=test";

            // Act
            var result = pSut.BuildBasicRenderingPropertiesUrl(pCurrentParams);

            // Assert
            result.Should().NotBeNull();
            result[Constants.RenderingMappingEditor.FieldNames.Placeholder].Should().Be("main");
            result[Constants.RenderingMappingEditor.FieldNames.DataSource].Should().Be("test");
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithOnlyPlaceholder_ReturnsUrlWithPlaceholder()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());
            var pCurrentParams = $"{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.Placeholder)}=header";

            // Act
            var result = pLocalSut.BuildBasicRenderingPropertiesUrl(pCurrentParams);

            // Assert
            result.Should().NotBeNull();
            result[Constants.RenderingMappingEditor.FieldNames.Placeholder].Should().Be("header");
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithOnlyDataSource_ReturnsUrlWithDataSource()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());
            var pCurrentParams = $"{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.DataSource)}=/sitecore/content";

            // Act
            var result = pLocalSut.BuildBasicRenderingPropertiesUrl(pCurrentParams);

            // Assert
            result.Should().NotBeNull();
            HttpUtility.UrlDecode(result[Constants.RenderingMappingEditor.FieldNames.DataSource]).Should().Be("/sitecore/content");
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WithUrlEncodedValues_HandlesEncodedInput()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, Substitute.For<IRenderingMappingLogger>());
            var pCurrentParams = $"{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.Placeholder)}={HttpUtility.UrlEncode("main content")}&{HttpUtility.UrlEncode(Constants.RenderingMappingEditor.FieldNames.DataSource)}={HttpUtility.UrlEncode("/sitecore/content/home")}";

            // Act
            var result = pLocalSut.BuildBasicRenderingPropertiesUrl(pCurrentParams);

            // Assert
            result.Should().NotBeNull();
            HttpUtility.UrlDecode(result[Constants.RenderingMappingEditor.FieldNames.Placeholder]).Should().Be("main content");
            HttpUtility.UrlDecode(result[Constants.RenderingMappingEditor.FieldNames.DataSource]).Should().Be("/sitecore/content/home");
        }

        [Fact]
        public void BuildBasicRenderingPropertiesUrl_WhenTemplateServiceReturnsDescriptors_ReturnsFieldEditorUrl()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pLogger = Substitute.For<IRenderingMappingLogger>();
            var pTemplateService = Substitute.For<ITemplateService>();

            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);

            var pStdParamsTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(pStdParamsTemplateItem);

            var pContextItem = CreateItemWithUriAndField("MyField");
            pTemplateService.BuildFieldDescriptors(
                    pStdParamsTemplateItem,
                    Arg.Any<NameValueCollection>(),
                    Arg.Any<HashSet<string>>())
                .Returns(
                    new List<FieldDescriptorInfo>
                    {
                        new FieldDescriptorInfo
                        {
                            FieldName = "MyField",
                            Value = "abc",
                            ContainsStandardValue = false,
                            ContextItem = pContextItem
                        }
                    });

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, pLogger, pTemplateService);

            // Act
            var pUrl = pLocalSut.BuildBasicRenderingPropertiesUrl(string.Empty);

            // Assert
            pUrl.Should().NotBeNull();
            pUrl.Should().BeOfType<UrlString>();
            HttpUtility.UrlDecode(pUrl.ToString()).Should().Contain("hdl=");
        }

        [Fact]
        public void BuildFieldEditorUrl_WhenTemplateServiceReturnsDescriptors_ReturnsFieldEditorUrl()
        {
            // Arrange
            var pDbProvider = Substitute.For<IDatabaseProvider>();
            var pLogger = Substitute.For<IRenderingMappingLogger>();
            var pTemplateService = Substitute.For<ITemplateService>();

            var pRenderingId = ID.NewID;
            var pParametersTemplateId = ID.NewID;

            var pRenderingItem = new FakeItem(pRenderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, pParametersTemplateId.ToString())
                .ToSitecoreItem();
            pRenderingItem.Uri.Returns(new ItemUri(pRenderingItem.ID, Language.Parse("en"), Version.First, "master"));

            var pParametersTemplateItem = new FakeItem(pParametersTemplateId).ToSitecoreItem();

            pDbProvider.GetItem(pRenderingId, DatabaseType.Master).Returns(pRenderingItem);
            pDbProvider.GetItem(pParametersTemplateId, DatabaseType.Master).Returns(pParametersTemplateItem);

            var pMasterDb = Substitute.For<Database>();
            pDbProvider.GetDatabase(DatabaseType.Master).Returns(pMasterDb);

            var pStdParamsTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            pMasterDb.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(pStdParamsTemplateItem);

            var pStdContextItem = CreateItemWithUriAndField("StdField");
            var pCustomContextItem = CreateItemWithUriAndField("CustomField");

            pTemplateService.BuildFieldDescriptors(
                    pStdParamsTemplateItem,
                    Arg.Any<NameValueCollection>(),
                    Arg.Any<HashSet<string>>())
                .Returns(
                    new List<FieldDescriptorInfo>
                    {
                        new FieldDescriptorInfo
                        {
                            FieldName = "StdField",
                            Value = "s",
                            ContainsStandardValue = false,
                            ContextItem = pStdContextItem
                        }
                    });

            pTemplateService.BuildFieldDescriptors(
                    pParametersTemplateItem,
                    Arg.Any<NameValueCollection>(),
                    Arg.Any<HashSet<string>>())
                .Returns(
                    new List<FieldDescriptorInfo>
                    {
                        new FieldDescriptorInfo
                        {
                            FieldName = "CustomField",
                            Value = "c",
                            ContainsStandardValue = false,
                            ContextItem = pCustomContextItem
                        }
                    });

            var pLocalSut = new FieldEditorUrlBuilder(pDbProvider, pLogger, pTemplateService);

            // Act
            var pUrl = pLocalSut.BuildFieldEditorUrl(pRenderingId, "StdField=s&CustomField=c");

            // Assert
            pUrl.Should().NotBeNull();
            HttpUtility.UrlDecode(pUrl.ToString()).Should().Contain("hdl=");
        }

        // ============================================================
        // Edge Cases
        // ============================================================
        [Fact]
        public void BuildFieldEditorUrl_WithInvalidParametersTemplate_ReturnsNull()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var sut = new FieldEditorUrlBuilder(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var renderingId = ID.NewID;
            var renderingItem = new FakeItem().WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, "not-a-guid").ToSitecoreItem();

            dbProvider.GetItem(renderingId, DatabaseType.Master).Returns(renderingItem);

            // Act
            var result = sut.BuildFieldEditorUrl(renderingId, "key=value");

            // Assert
            result.Should().BeNull();
        }

        private static Item CreateItemWithUriAndField(string pFieldName)
        {
            var pItem = new FakeItem(ID.NewID)
                .WithField(pFieldName, string.Empty)
                .ToSitecoreItem();

            pItem.Uri.Returns(new ItemUri(pItem.ID, Language.Parse("en"), Version.First, "master"));
            return pItem;
        }
    }
}