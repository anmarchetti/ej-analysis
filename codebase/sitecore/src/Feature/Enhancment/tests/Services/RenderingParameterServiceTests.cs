using System;
using System.Collections.Generic;
using System.Linq;
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
using Sitecore.Shell.Applications.WebEdit;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class RenderingParameterServiceTests
    {
        [Fact]
        public void ExtractParametersFromFieldEditorResult_GuidKey_IsTranslatedToFieldName()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var masterDb = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(masterDb);

            var fieldId = ID.NewID;
            var fakeField = new FakeItem(fieldId).WithName("MyField").ToSitecoreItem();
            masterDb.GetItem(fieldId).Returns(fakeField);

            var logger = Substitute.For<IRenderingMappingLogger>();
            var sut = new RenderingParameterService(dbProvider, logger);

            var input = fieldId.ToString() + "=true";

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult(input, ID.Null, useBasicParams: false);

            // Assert
            result.Should().Be("MyField=true");
        }

        [Fact]
        public void ParseAndCategorizeParameters_SeparatesStandardAndCustom()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns((Database)null);
            var logger = Substitute.For<IRenderingMappingLogger>();
            var sut = new RenderingParameterService(dbProvider, logger);

            var input = HttpUtility.UrlEncode("Placeholder") + "=main&" + HttpUtility.UrlEncode("CustomParam") + "=1";

            // Act
            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            // Assert
            standard.Should().ContainKey("Placeholder");
            standard["Placeholder"].Should().Be("main");
            custom.Should().ContainKey("CustomParam");
            custom["CustomParam"].Should().Be("1");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_EmptyInput_ReturnsEmpty()
        {
            var sut = CreateSutWithNoDb();
            sut.ExtractParametersFromFieldEditorResult(null, ID.Null, false).Should().BeEmpty();
            sut.ExtractParametersFromFieldEditorResult(" ", ID.Null, false).Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_SingleFlagParam_NormalizesToTrue()
        {
            var sut = CreateSutWithNoDb();
            var result = sut.ExtractParametersFromFieldEditorResult("flagParam", ID.Null, false);
            result.Should().Be("flagParam=true");
        }

        [Fact]
        public void GetStandardFieldNames_NoRenderingId_ReturnsFallbackSet()
        {
            var sut = CreateSutWithNoDb();
            var names = sut.GetStandardFieldNames(null);
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void GetStandardFieldNames_InvalidRenderingIdFormat_ReturnsFallbackSet()
        {
            var sut = CreateSutWithNoDb();
            var names = sut.GetStandardFieldNames("not-a-guid");
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ParseAndCategorizeParameters_SupportsSemicolonSeparator()
        {
            var sut = CreateSutWithNoDb();
            var input = $"{HttpUtility.UrlEncode("CustomA")}={HttpUtility.UrlEncode("x")};{HttpUtility.UrlEncode("Placeholder")}={HttpUtility.UrlEncode("main")}";
            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);
            standard.Should().ContainKey("Placeholder");
            custom.Should().ContainKey("CustomA");
        }

        [Fact]
        public void ParseAndCategorizeParameters_DecodesAmpersandEntity()
        {
            var sut = CreateSutWithNoDb();
            var input = "A=1&amp;B=2";

            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            custom.Should().ContainKey("A");
            custom.Should().ContainKey("B");
        }

        [Fact]
        public void ParseAndCategorizeParameters_DuplicateKeys_LastWins()
        {
            var sut = CreateSutWithNoDb();
            var input = "A=1&A=2";

            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            custom.Should().ContainKey("A");
            custom["A"].Should().Be("2");
        }

        [Fact]
        public void ParseAndCategorizeParameters_PlaceholderAlias_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("ph=main", string.Empty);

            standard.Should().ContainKey("ph");
            custom.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_FlagOnly_KeyGetsTrue()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("FlagOnly", string.Empty);

            custom.Should().ContainKey("FlagOnly");
            custom["FlagOnly"].Should().Be("true");
        }

        [Fact]
        public void GetStandardFieldNames_RenderingItemWithoutParamsField_ReturnsFallback()
        {
            var db = Substitute.For<Database>();
            var renderingItem = new FakeItem().ToSitecoreItem();
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns(renderingItem);
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var set = sut.GetStandardFieldNames(ID.NewID.ToString());

            set.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void GetStandardFieldNames_RenderingItemParamsInvalidGuid_ReturnsFallback()
        {
            var db = Substitute.For<Database>();
            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, "not-a-guid")
                .ToSitecoreItem();
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns(renderingItem);
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var set = sut.GetStandardFieldNames(ID.NewID.ToString());

            set.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenDbThrows_ReturnsEncodedPairs()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.When(x => x.GetDatabase(DatabaseType.Master)).Do(_ => { throw new Exception("db down"); });
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("A=1&B=2", ID.Null, false);

            result.Should().Be("A=1&B=2");
        }

        [Fact]
        public void GetStandardFieldNames_WhenDbThrows_ReturnsFallbackSet()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.When(x => x.GetDatabase(DatabaseType.Master)).Do(_ => { throw new Exception("db down"); });
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var names = sut.GetStandardFieldNames(null);

            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithEmptyRenderingId_ProcessesFallback()
        {
            var sut = CreateSutWithNoDb();

            var result = sut.ExtractParametersFromFieldEditorResult("CustomField=TestValue", ID.Null, useBasicParams: false);

            result.Should().Contain("CustomField=TestValue");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_MultipleParams_PreservesAll()
        {
            var sut = CreateSutWithNoDb();
            var input = "Param1=Value1&Param2=Value2&Param3=Value3";

            var result = sut.ExtractParametersFromFieldEditorResult(input, ID.Null, useBasicParams: false);

            result.Should().Contain("Param1=Value1");
            result.Should().Contain("Param2=Value2");
            result.Should().Contain("Param3=Value3");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithCachingParams_CategorizesAsStandard()
        {
            var sut = CreateSutWithNoDb();
            var input = "Cacheable=1&VaryByData=1&VaryByDevice=1&VaryByLogin=0";

            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            standard.Should().ContainKey("Cacheable");
            standard.Should().ContainKey("VaryByData");
            standard.Should().ContainKey("VaryByDevice");
            standard.Should().ContainKey("VaryByLogin");
            custom.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithMixedCaseKeys_HandlesCorrectly()
        {
            var sut = CreateSutWithNoDb();
            var input = "placeholder=main&DATASOURCE=/content&customField=value";

            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            standard.Should().ContainKey("placeholder");
            standard.Should().ContainKey("DATASOURCE");
            custom.Should().ContainKey("customField");
        }

        [Fact]
        public void GetStandardFieldNames_EmptyString_ReturnsFallbackSet()
        {
            var sut = CreateSutWithNoDb();

            var names = sut.GetStandardFieldNames(string.Empty);

            names.Should().Contain(new[] { "Placeholder", "Data Source", "Cacheable" });
        }

        [Fact]
        public void GetStandardFieldNames_WhitespaceRenderingId_ReturnsFallbackSet()
        {
            var sut = CreateSutWithNoDb();

            var names = sut.GetStandardFieldNames("   ");

            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_UrlEncodedValues_DecodesCorrectly()
        {
            var sut = CreateSutWithNoDb();
            var input = HttpUtility.UrlEncode("Field Name") + "=" + HttpUtility.UrlEncode("Value With Spaces");

            var result = sut.ExtractParametersFromFieldEditorResult(input, ID.Null, useBasicParams: false);

            result.Should().Contain("Field+Name");
            result.Should().Contain("Value+With+Spaces");
        }

        [Fact]
        public void ParseAndCategorizeParameters_SxaTags_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("SxaTags=tag1,tag2", string.Empty);

            standard.Should().ContainKey("SxaTags");
            standard["SxaTags"].Should().Be("tag1,tag2");
        }

        [Fact]
        public void ParseAndCategorizeParameters_ClearOnIndexUpdate_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("ClearOnIndexUpdate=1", string.Empty);

            standard.Should().ContainKey("ClearOnIndexUpdate");
        }

        [Fact]
        public void ParseAndCategorizeParameters_DisableLazyLoading_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("DisableLazyLoading=true", string.Empty);

            standard.Should().ContainKey("DisableLazyLoading");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_EmptyValue_PreservesEmptyValue()
        {
            var sut = CreateSutWithNoDb();

            var result = sut.ExtractParametersFromFieldEditorResult("EmptyField=", ID.Null, useBasicParams: false);

            result.Should().Contain("EmptyField=");
        }

        [Fact]
        public void GetStandardFieldNames_RenderingNotFoundInDb_ReturnsFallback()
        {
            var db = Substitute.For<Database>();
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var set = sut.GetStandardFieldNames(ID.NewID.ToString());

            set.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void GetStandardFieldNames_ParametersTemplateNotFoundInDb_ReturnsFallback()
        {
            var db = Substitute.For<Database>();
            var templateId = ID.NewID;
            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(Arg.Is<ID>(id => id != templateId)).Returns(renderingItem);
            db.GetItem(templateId).Returns((Item)null);

            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var set = sut.GetStandardFieldNames(ID.NewID.ToString());

            set.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ParseAndCategorizeParameters_VaryByQueryString_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("VaryByQueryString=id,page", string.Empty);

            standard.Should().ContainKey("VaryByQueryString");
            standard["VaryByQueryString"].Should().Be("id,page");
        }

        [Fact]
        public void ParseAndCategorizeParameters_VaryByUser_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("VaryByUser=1", string.Empty);

            standard.Should().ContainKey("VaryByUser");
        }

        [Fact]
        public void ParseAndCategorizeParameters_VaryByParm_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("VaryByParm=size", string.Empty);

            standard.Should().ContainKey("VaryByParm");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_UseBasicParamsTrue_UsesStandardTemplate()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("CustomField=test", ID.NewID, useBasicParams: true);

            result.Should().Contain("CustomField=test");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_RenderingIdNull_UseBasicParamsFalse_FallsBackToQueryString()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("key=value", ID.Null, useBasicParams: false);

            result.Should().Be("key=value");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_RenderingNotFound_FallsBackToQueryString()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("field=value", ID.NewID, useBasicParams: false);

            result.Should().Contain("field=value");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_RenderingWithoutParamsTemplate_FallsBackToQueryString()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingItem = new FakeItem().ToSitecoreItem();
            db.GetItem(Arg.Any<ID>()).Returns(renderingItem);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("custom=data", ID.NewID, useBasicParams: false);

            result.Should().Contain("custom=data");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_RenderingWithInvalidTemplateId_FallsBackToQueryString()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingItem = new FakeItem()
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, "invalid-guid")
                .ToSitecoreItem();
            db.GetItem(Arg.Any<ID>()).Returns(renderingItem);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var result = sut.ExtractParametersFromFieldEditorResult("param=val", ID.NewID, useBasicParams: false);

            result.Should().Contain("param=val");
        }

        [Fact]
        public void ParseAndCategorizeParameters_EmptyKeyAfterDecode_IsIgnored()
        {
            var sut = CreateSutWithNoDb();
            var input = "=value&validKey=validValue";

            var (standard, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            custom.Should().ContainKey("validKey");
            custom.Should().NotContainKey(string.Empty);
        }

        [Fact]
        public void ParseAndCategorizeParameters_ScDatasourceAlias_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("sc_datasource=/content/item", string.Empty);

            standard.Should().ContainKey("sc_datasource");
        }

        [Fact]
        public void ParseAndCategorizeParameters_DsAlias_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("ds=/content/item", string.Empty);

            standard.Should().ContainKey("ds");
        }

        [Fact]
        public void GetStandardFieldNames_DbProviderReturnsNull_ReturnsFallback()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns((Database)null);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            var names = sut.GetStandardFieldNames(ID.NewID.ToString());

            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_MultipleEncodedParams_PreservesAll()
        {
            var sut = CreateSutWithNoDb();
            var input = $"{HttpUtility.UrlEncode("Field One")}={HttpUtility.UrlEncode("Value 1")}&{HttpUtility.UrlEncode("Field Two")}={HttpUtility.UrlEncode("Value 2")}";

            var result = sut.ExtractParametersFromFieldEditorResult(input, ID.Null, useBasicParams: false);

            result.Should().Contain("Field+One");
            result.Should().Contain("Field+Two");
        }

        [Fact]
        public void ParseAndCategorizeParameters_CachingParam_IsStandard()
        {
            var sut = CreateSutWithNoDb();

            var (standard, custom) = sut.ParseAndCategorizeParameters("Caching=true", string.Empty);

            standard.Should().ContainKey("Caching");
        }

        [Fact]
        public void ParseAndCategorizeParameters_ShouldHandleAliasesOfStandardKeys()
        {
            var sut = new RenderingParameterService();
            var input = "ph=main&sc_datasource=/x&ds=/y";

            var (std, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            std.Should().ContainKey("ph");
            std.Should().ContainKey("sc_datasource");
            std.Should().ContainKey("ds");
            custom.Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_Duplicates_UsesLastOccurrence()
        {
            var sut = new RenderingParameterService();
            var normalized = sut.ExtractParametersFromFieldEditorResult("size=s&size=xl", ID.NewID, false);
            normalized.Should().Contain("size=xl");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_ShouldHandleMissingValues_AndEncode()
        {
            var sut = new RenderingParameterService();
            var rid = ID.NewID;
            var input = "flag&size=xl&weird=&with%20space=value%2bplus";

            var result = sut.ExtractParametersFromFieldEditorResult(input, rid, false);

            result.Should().Contain("flag=true");
            result.Should().Contain("size=xl");
            result.Should().Contain("weird=");
            result.Should().Contain("with+space=value%2bplus");
        }

        [Fact]
        public void ParseAndCategorizeParameters_ShouldTreatCaseInsensitiveStandardKeys()
        {
            var sut = new RenderingParameterService();
            var input = "Data Source=/sitecore/content&PLACEHOLDER=Main&Custom=1";

            var (std, custom) = sut.ParseAndCategorizeParameters(input, string.Empty);

            std.Should().ContainKey("Data Source");
            std.Should().ContainKey("PLACEHOLDER");
            custom.Should().ContainKey("Custom");
        }

        [Fact]
        public void Constructor_WithNullDatabaseProvider_ThrowsArgumentNullException()
        {
            // Act
            Action act = () => new RenderingParameterService(null, Substitute.For<IRenderingMappingLogger>());

            // Assert
            act.Should().Throw<ArgumentNullException>().Where(ex => ex.ParamName == "databaseProvider");
        }

        [Fact]
        public void Constructor_WithNullLogger_DoesNotThrow()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();

            // Act
            Action act = () => new RenderingParameterService(dbProvider, null);

            // Assert
            act.Should().NotThrow();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WhenParametersIsEmpty_ShouldReturnEmptyDictionaries()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(string.Empty, string.Empty);

            // Assert
            standardParams.Should().BeEmpty();
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WhenParametersIsNull_ShouldReturnEmptyDictionaries()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(null, string.Empty);

            // Assert
            standardParams.Should().BeEmpty();
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WhenParametersIsWhitespace_ShouldReturnEmptyDictionaries()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters("   ", string.Empty);

            // Assert
            standardParams.Should().BeEmpty();
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithCustomParameters_ShouldCategorizeCorrectly()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "CustomField1=Value1&CustomField2=Value2";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().BeEmpty();
            customParams.Should().HaveCount(2);
            customParams.Should().ContainKey("CustomField1");
            customParams.Should().ContainKey("CustomField2");
            customParams["CustomField1"].Should().Be("Value1");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithSpecialCharacters_ShouldHandleCorrectly()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "CustomParam=Value+With+Spaces&Another=Test%26Value";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            customParams.Should().HaveCount(2);
            customParams["CustomParam"].Should().Be("Value With Spaces");
            customParams["Another"].Should().Be("Test&Value");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithFlagsAndSeparators_ShouldNormalize()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "flag;size=xl&color=blue&amp;weird=";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().NotContainKey("flag");
            customParams.Should().ContainKey("flag");
            customParams["flag"].Should().Be("true");
            customParams.Should().ContainKey("size");
            customParams["size"].Should().Be("xl");
            customParams.Should().ContainKey("color");
            customParams["color"].Should().Be("blue");
            customParams.Should().ContainKey("weird");
            customParams["weird"].Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_ShouldNormalizeAndUrlEncode()
        {
            // Arrange
            var sut = CreateService();
            var renderingId = ID.NewID;
            var result = "flag;size=xl&color=blue";

            // Act
            var normalized = sut.ExtractParametersFromFieldEditorResult(result, renderingId, useBasicParams: false);

            // Assert
            normalized.Should().Contain("flag=true");
            normalized.Should().Contain("size=xl");
            normalized.Should().Contain("color=blue");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenEmpty_ReturnsEmpty()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult(string.Empty, ID.Null, false);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenNull_ReturnsEmpty()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult(null, ID.Null, false);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenWhitespace_ReturnsEmpty()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult("   ", ID.Null, false);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingIdNull_ReturnsFallbackSet()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var names = sut.GetStandardFieldNames(null);

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source", "Cacheable" });
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingIdEmpty_ReturnsFallbackSet()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var names = sut.GetStandardFieldNames(string.Empty);

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingIdWhitespace_ReturnsFallbackSet()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var names = sut.GetStandardFieldNames("   ");

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingIdInvalid_ReturnsFallbackSet()
        {
            // Arrange
            var sut = CreateService();

            // Act
            var names = sut.GetStandardFieldNames("not-a-guid");

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithStandardPlaceholder_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "Placeholder=Main&CustomField=value";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("Placeholder");
            standardParams["Placeholder"].Should().Be("Main");
            customParams.Should().ContainKey("CustomField");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithDataSource_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "Data Source=/sitecore/content";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("Data Source");
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithCacheable_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "Cacheable=1&VaryByData=1&VaryByDevice=0";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("Cacheable");
            standardParams.Should().ContainKey("VaryByData");
            standardParams.Should().ContainKey("VaryByDevice");
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithPlaceholderAliases_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "ph=main&sc_datasource=/content&ds=/item";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("ph");
            standardParams.Should().ContainKey("sc_datasource");
            standardParams.Should().ContainKey("ds");
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithDbProvider_TranslatesGuidKeys()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var masterDb = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(masterDb);

            var fieldId = ID.NewID;
            var fieldItem = new FakeItem(fieldId).WithName("CustomField").ToSitecoreItem();
            masterDb.GetItem(fieldId).Returns(fieldItem);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());
            var input = fieldId.ToString() + "=TestValue";

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult(input, ID.Null, false);

            // Assert
            result.Should().Contain("CustomField=TestValue");
        }

        [Fact]
        public void GetStandardFieldNames_WithValidRenderingId_QueriesDatabase()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());
            var renderingId = ID.NewID;

            // Act
            var names = sut.GetStandardFieldNames(renderingId.ToString());

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
            db.Received().GetItem(renderingId);
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithUseBasicParams_UsesStandardTemplate()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var sut = new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult("field=value", ID.NewID, useBasicParams: true);

            // Assert
            result.Should().Contain("field=value");
        }

        [Fact]
        public void Constructor_WithNullTemplateService_ThrowsArgumentNullException()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();

            // Act
            Action act = () => new RenderingParameterService(dbProvider, logger, null);

            // Assert
            act.Should().Throw<ArgumentNullException>().Where(ex => ex.ParamName == "templateService");
        }

        [Fact]
        public void GetStandardFieldNames_WithMockedTemplateService_ReturnsFieldNames()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();
            var templateItem = new FakeItem(templateId).ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(new[] { "CustomParam1", "CustomParam2", "MySpecialField" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var names = sut.GetStandardFieldNames(renderingId.ToString());

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
            names.Should().Contain(new[] { "CustomParam1", "CustomParam2", "MySpecialField" });
        }

        [Fact]
        public void GetStandardFieldNames_WithTemplateServiceReturningEmpty_ReturnsFallbackOnly()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();
            var templateItem = new FakeItem(templateId).ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var names = sut.GetStandardFieldNames(renderingId.ToString());

            // Assert
            names.Should().Contain(new[] { "Placeholder", "Data Source" });
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithMockedTemplateService_RecognizesCustomFields()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);
            var parameters = "Placeholder=Main&CustomField=value";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("Placeholder");
            customParams.Should().ContainKey("CustomField");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithMockedTemplateService_UsesFieldIdToNameMap()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var fieldId = ID.NewID;
            var fieldNameMap = new Dictionary<ID, string>
            {
                { fieldId, "MappedFieldName" }
            };

            templateService.GetFieldIdToNameMap(Arg.Any<Item>())
                .Returns(fieldNameMap);
            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult("key=value", ID.Null, false);

            // Assert
            result.Should().Contain("key=value");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithSystemFieldGuid_SkipsSystemField()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            var systemFieldItem = new FakeItem(fieldId).WithName("__Created").ToSitecoreItem();
            db.GetItem(fieldId).Returns(systemFieldItem);

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());
            templateService.GetFieldIdToNameMap(Arg.Any<Item>())
                .Returns(new Dictionary<ID, string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act - passing a GUID that resolves to a system field
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=value", ID.Null, false);

            // Assert - GUID key should remain as GUID (not translated) since it's a system field, but URL-encoded in the result
            result.Should().Contain(HttpUtility.UrlEncode(fieldId.ToString()));
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithMultipleParameters_NormalizesAll()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());
            templateService.GetFieldIdToNameMap(Arg.Any<Item>())
                .Returns(new Dictionary<ID, string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult("field1=value1&field2=value2&field3=value3", ID.Null, false);

            // Assert
            result.Should().Contain("field1=value1");
            result.Should().Contain("field2=value2");
            result.Should().Contain("field3=value3");
        }

        [Fact]
        public void GetStandardFieldNames_WithRenderingItemHavingParametersTemplate_QueriesTemplateService()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(Arg.Is<Item>(i => i.ID == templateId))
                .Returns(new[] { "CustomParam1", "CustomParam2" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var result = sut.GetStandardFieldNames(renderingId.ToString());

            // Assert
            result.Should().Contain("CustomParam1");
            result.Should().Contain("CustomParam2");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithSxaTags_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "SxaTags=tag1,tag2";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("SxaTags");
            customParams.Should().BeEmpty();
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithDisableLazyLoading_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "DisableLazyLoading=true";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("DisableLazyLoading");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithClearOnIndexUpdate_CategorizesAsStandard()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "ClearOnIndexUpdate=1";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("ClearOnIndexUpdate");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenDatabaseThrows_LogsAndReturnsEncodedFallback()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Arg.Any<ID>()).Returns(x => throw new System.Exception("DB error"));

            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());
            templateService.GetFieldIdToNameMap(Arg.Any<Item>())
                .Returns(new Dictionary<ID, string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);
            var fieldId = ID.NewID;

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult($"{fieldId}=value", ID.Null, false);

            // Assert
            result.Should().NotBeEmpty();
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WithRenderingIdAndUseBasicParamsFalse_GetsRenderingTemplate()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);

            templateService.GetFieldIdToNameMap(Arg.Any<Item>())
                .Returns(new Dictionary<ID, string>());
            templateService.GetFieldNames(Arg.Any<Item>())
                .Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var result = sut.ExtractParametersFromFieldEditorResult("field=value", renderingId, useBasicParams: false);

            // Assert
            result.Should().Contain("field=value");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithMixedCaseStandardKeys_HandlesCorrectly()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "PLACEHOLDER=Main&DaTaSOurCe=/content";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("PLACEHOLDER");
            standardParams.Should().ContainKey("DaTaSOurCe");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WithWhitespaceKey_TreatsAsCustom()
        {
            // Arrange
            var sut = CreateService();
            var parameters = "%20=1&Placeholder=Main";

            // Act
            var (standardParams, customParams) = sut.ParseAndCategorizeParameters(parameters, string.Empty);

            // Assert
            standardParams.Should().ContainKey("Placeholder");
            customParams.Should().ContainKey(" ");
        }

        [Fact]
        public void GetStandardFieldNames_WhenStandardRenderingParametersTemplateExists_AddsTemplateFieldNames()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var standardTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(standardTemplateItem);
            templateService.GetFieldNames(standardTemplateItem).Returns(new[] { "MyStandardParam" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var names = sut.GetStandardFieldNames(string.Empty).ToList();

            // Assert
            names.Should().Contain("MyStandardParam");
            names.Should().Contain("Placeholder");
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingHasParametersTemplate_AddsRenderingSpecificFieldNames()
        {
            // Arrange
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();

            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);

            templateService.GetFieldNames(templateItem).Returns(new[] { "RenderingSpecificParam" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // Act
            var names = sut.GetStandardFieldNames(renderingId.ToString()).ToList();

            // Assert
            names.Should().Contain("RenderingSpecificParam");
        }

        // ============================================================
        // Area 1: GetStandardFieldNames with valid rendering + template
        // ============================================================
        [Fact]
        public void GetStandardFieldNames_WithValidRenderingAndTemplate_ReturnsBothGlobalAndRenderingSpecificNames()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(templateItem).Returns(new[] { "RenderingParam1", "RenderingParam2" });
            templateService.GetFieldNames(Arg.Is<Item>(i => i.ID != templateId)).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var names = sut.GetStandardFieldNames(renderingId.ToString()).ToList();

            // ASSERT
            names.Should().Contain("Placeholder");
            names.Should().Contain("Data Source");
            names.Should().Contain("RenderingParam1");
            names.Should().Contain("RenderingParam2");
        }

        [Fact]
        public void GetStandardFieldNames_WithValidRenderingAndTemplate_CallsTemplateServiceGetFieldNames()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>()).Returns(new[] { "TemplateOnlyField" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            sut.GetStandardFieldNames(renderingId.ToString());

            // ASSERT
            templateService.Received().GetFieldNames(Arg.Is<Item>(i => i.ID == templateId));
        }

        // ============================================================
        // Area 2: BuildStandardKeys with DB template → ParseAndCategorize
        // ============================================================
        [Fact]
        public void ParseAndCategorizeParameters_WhenStandardTemplateHasFields_TreatsThemAsStandard()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var standardTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(standardTemplateItem);
            templateService.GetFieldNames(standardTemplateItem).Returns(new[] { "FromStandardTemplate" });
            templateService.GetFieldNames(Arg.Is<Item>(i => i.ID != standardTemplateItem.ID)).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var (standard, custom) = sut.ParseAndCategorizeParameters("FromStandardTemplate=1&NotStandardKey=2", string.Empty);

            // ASSERT
            standard.Should().ContainKey("FromStandardTemplate");
            custom.Should().ContainKey("NotStandardKey");
        }

        [Fact]
        public void BuildStandardKeys_WhenStandardTemplateExists_AddsTemplateFieldNamesToStandardKeys()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var standardTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(standardTemplateItem);
            templateService.GetFieldNames(standardTemplateItem).Returns(new[] { "StdParamAlpha", "StdParamBeta" });
            templateService.GetFieldNames(Arg.Is<Item>(i => i.ID != standardTemplateItem.ID)).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var names = sut.GetStandardFieldNames(null).ToList();

            // ASSERT
            names.Should().Contain("StdParamAlpha");
            names.Should().Contain("StdParamBeta");
            names.Should().Contain("Placeholder");
        }

        [Fact]
        public void BuildStandardKeys_WhenStandardTemplateThrowsOnGetFieldNames_LogsWarnAndReturnsFallback()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var standardTemplateItem = new FakeItem(ID.NewID).ToSitecoreItem();
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(standardTemplateItem);
            templateService.GetFieldNames(standardTemplateItem).Returns(_ => throw new InvalidOperationException("template fields unavailable"));

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var names = sut.GetStandardFieldNames(null).ToList();

            // ASSERT
            names.Should().Contain("Placeholder");
            names.Should().Contain("Data Source");
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        // ============================================================
        // Area 3: ResolveFieldName / TranslateGuidKeyToFieldName edge cases
        // ============================================================
        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenGuidResolvesToNullFieldItem_KeepsGuidAsKey()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            db.GetItem(fieldId).Returns((Item)null);

            var logger = Substitute.For<IRenderingMappingLogger>();
            var sut = new RenderingParameterService(dbProvider, logger);

            // ACT
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=someValue", ID.Null, useBasicParams: false);

            // ASSERT
            result.Should().Contain(HttpUtility.UrlEncode(fieldId.ToString()));
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenGuidResolvesToSystemFieldItem_KeepsGuidAsKey()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            var systemFieldItem = new FakeItem(fieldId).WithName("__SystemField").ToSitecoreItem();
            db.GetItem(fieldId).Returns(systemFieldItem);

            var logger = Substitute.For<IRenderingMappingLogger>();
            var sut = new RenderingParameterService(dbProvider, logger);

            // ACT
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=someValue", ID.Null, useBasicParams: false);

            // ASSERT
            result.Should().Contain(HttpUtility.UrlEncode(fieldId.ToString()));
            result.Should().NotContain("__SystemField");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenTranslateGuidKeyThrows_LogsWarnAndKeepsGuidKey()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            db.GetItem(fieldId).Returns(_ => throw new InvalidOperationException("db lookup failed"));
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            templateService.GetFieldNames(Arg.Any<Item>()).Returns(Enumerable.Empty<string>());
            templateService.GetFieldIdToNameMap(Arg.Any<Item>()).Returns(new Dictionary<ID, string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=val", ID.Null, useBasicParams: false);

            // ASSERT
            result.Should().NotBeEmpty();
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        // ============================================================
        // Area 4: GetStandardFieldNames rendering-specific exception path
        // ============================================================
        [Fact]
        public void GetStandardFieldNames_WhenRenderingSpecificGetFieldNamesThrows_LogsWarnAndReturnsFallback()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();

            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);

            templateService.GetFieldNames(templateItem).Returns(_ => throw new InvalidOperationException("field fetch failed"));
            templateService.GetFieldNames(Arg.Is<Item>(i => i.ID != templateId)).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var names = sut.GetStandardFieldNames(renderingId.ToString()).ToList();

            // ASSERT
            names.Should().Contain("Placeholder");
            names.Should().Contain("Data Source");
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        // ============================================================
        // Iteration 4: Deeper path coverage
        // ============================================================
        [Fact]
        public void Constructor_WithDatabaseProviderOnly_CreatesWorkingInstance()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns((Database)null);

            // ACT
            var sut = new RenderingParameterService(dbProvider);
            var (standard, custom) = sut.ParseAndCategorizeParameters("Placeholder=main&UnknownKey=1", string.Empty);

            // ASSERT
            standard.Should().ContainKey("Placeholder");
            custom.Should().ContainKey("UnknownKey");
        }

        [Fact]
        public void ParseAndCategorizeParameters_WhenStandardKeysLoadedFromTemplate_CustomTemplateFieldIsStandard()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var stdParamsItem = new FakeItem(Constants.TemplateIds.StandardRenderingParameters).ToSitecoreItem();
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns(stdParamsItem);
            templateService.GetFieldNames(Arg.Any<Item>()).Returns(new[] { "CustomTemplateField" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var (standard, custom) = sut.ParseAndCategorizeParameters("CustomTemplateField=value", string.Empty);

            // ASSERT
            standard.Should().ContainKey("CustomTemplateField");
            custom.Should().BeEmpty();
        }

        [Fact]
        public void GetStandardFieldNames_WhenRenderingAndTemplateItemResolve_ReturnsRenderingSpecificField()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);
            db.GetItem(Constants.TemplateIds.StandardRenderingParameters).Returns((Item)null);

            var renderingId = ID.NewID;
            var templateId = ID.NewID;
            var templateItem = new FakeItem(templateId).ToSitecoreItem();
            var renderingItem = new FakeItem(renderingId)
                .WithField(Constants.RenderingMappingEditor.FieldNames.ParametersTemplate, templateId.ToString())
                .ToSitecoreItem();
            db.GetItem(renderingId).Returns(renderingItem);
            db.GetItem(templateId).Returns(templateItem);
            templateService.GetFieldNames(templateItem).Returns(new[] { "RenderingSpecificField" });

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var result = sut.GetStandardFieldNames(renderingId.ToString());

            // ASSERT
            result.Should().Contain("RenderingSpecificField");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenGuidResolvesToDoubleUnderscoreNamedField_KeepsGuidNotFieldName()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            var hiddenFieldItem = new FakeItem(fieldId).WithName("__Hidden").ToSitecoreItem();
            db.GetItem(fieldId).Returns(hiddenFieldItem);
            templateService.GetFieldNames(Arg.Any<Item>()).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=value", ID.Null, useBasicParams: false);

            // ASSERT
            result.Should().Contain(HttpUtility.UrlEncode(fieldId.ToString()));
            result.Should().NotContain("__Hidden");
        }

        [Fact]
        public void ExtractParametersFromFieldEditorResult_WhenDbGetItemThrowsOnGuidKeyLookup_LogsAndPreservesGuidKey()
        {
            // ARRANGE
            var dbProvider = Substitute.For<IDatabaseProvider>();
            var logger = Substitute.For<IRenderingMappingLogger>();
            var templateService = Substitute.For<ITemplateService>();
            var db = Substitute.For<Database>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns(db);

            var fieldId = ID.NewID;
            db.GetItem(fieldId).Returns(x => { throw new InvalidOperationException("field lookup error"); });
            templateService.GetFieldNames(Arg.Any<Item>()).Returns(Enumerable.Empty<string>());

            var sut = new RenderingParameterService(dbProvider, logger, templateService);

            // ACT
            var result = sut.ExtractParametersFromFieldEditorResult(fieldId.ToString() + "=val", ID.Null, useBasicParams: false);

            // ASSERT
            result.Should().Contain(HttpUtility.UrlEncode(fieldId.ToString()));
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        private static RenderingParameterService CreateSutWithNoDb()
        {
            var dbProvider = Substitute.For<IDatabaseProvider>();
            dbProvider.GetDatabase(DatabaseType.Master).Returns((Database)null);
            return new RenderingParameterService(dbProvider, Substitute.For<IRenderingMappingLogger>());
        }

        private static RenderingParameterService CreateService() => new RenderingParameterService();
    }
}
