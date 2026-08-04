using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.Services
{
    public class TemplateServiceTests
    {
        private readonly IRenderingMappingLogger logger;

        public TemplateServiceTests()
        {
            logger = Substitute.For<IRenderingMappingLogger>();
        }

        [Fact]
        public void GetFieldNames_WhenTemplateItemIsNull_ReturnsEmpty()
        {
            // Arrange
            var sut = new TemplateService();

            // Act
            var result = sut.GetFieldNames(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetFieldIdToNameMap_WhenTemplateItemIsNull_ReturnsEmptyDictionary()
        {
            // Arrange
            var sut = new TemplateService();

            // Act
            var result = sut.GetFieldIdToNameMap(null);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetStandardValuesItem_WhenTemplateItemIsNull_ReturnsNull()
        {
            // Arrange
            var sut = new TemplateService();

            // Act
            var result = sut.GetStandardValuesItem(null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldDescriptors_WhenTemplateItemIsNull_ReturnsEmpty()
        {
            // Arrange
            var sut = new TemplateService();
            var parsedParams = new NameValueCollection();
            var addedFields = new HashSet<string>();

            // Act
            var result = sut.BuildFieldDescriptors(null, parsedParams, addedFields);

            // Assert
            result.Should().BeEmpty();
        }

        [Fact]
        public void Constructor_WithNullLogger_DoesNotThrow()
        {
            // Act
            var sut = new TemplateService(null);

            // Assert
            sut.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_DefaultConstructor_DoesNotThrow()
        {
            // Act
            var sut = new TemplateService();

            // Assert
            sut.Should().NotBeNull();
        }

        [Fact]
        public void GetFieldNames_WithFakeItem_HandlesExceptionGracefully()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetFieldNames(fakeItem);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetFieldIdToNameMap_WithFakeItem_HandlesExceptionGracefully()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetFieldIdToNameMap(fakeItem);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void GetStandardValuesItem_WithFakeItem_ReturnsNull()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetStandardValuesItem(fakeItem);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldDescriptors_WithFakeItem_HandlesExceptionGracefully()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();
            var parsedParams = new NameValueCollection { { "TestField", "TestValue" } };
            var addedFields = new HashSet<string>();

            // Act
            var result = sut.BuildFieldDescriptors(fakeItem, parsedParams, addedFields).ToList();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        [Fact]
        public void BuildFieldDescriptors_WithNullParsedParams_DoesNotThrow()
        {
            // Arrange
            var sut = new TemplateService();
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();
            var addedFields = new HashSet<string>();

            // Act
            var result = sut.BuildFieldDescriptors(fakeItem, null, addedFields).ToList();

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public void GetFieldNames_WithLogger_LogsWarningOnException()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetFieldNames(fakeItem);

            // Assert
            result.Should().NotBeNull();
            logger.Received(1).Warn(
                Arg.Is<string>(s => s.Contains("Failed to get field names")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }

        [Fact]
        public void GetFieldIdToNameMap_WithLogger_LogsWarningOnException()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetFieldIdToNameMap(fakeItem);

            // Assert
            result.Should().NotBeNull();
            logger.Received(1).Warn(
                Arg.Is<string>(s => s.Contains("Failed to build field ID to name map")),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }

        [Fact]
        public void GetStandardValuesItem_WithLogger_HandlesExceptionGracefully()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            var result = sut.GetStandardValuesItem(fakeItem);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public void BuildFieldDescriptors_WithLogger_LogsWarningOnException()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var fakeItem = new FakeItem(ID.NewID).ToSitecoreItem();
            var parsedParams = new NameValueCollection();
            var addedFields = new HashSet<string>();

            // Act
            var result = sut.BuildFieldDescriptors(fakeItem, parsedParams, addedFields).ToList();

            // Assert
            result.Should().BeEmpty();
            logger.Received().Warn(
                Arg.Any<string>(),
                Arg.Any<Exception>(),
                Arg.Any<object>());
        }

        [Fact]
        public void GetFieldNames_WithNullTemplate_DoesNotLog()
        {
            // Arrange
            var sut = new TemplateService(logger);

            // Act
            sut.GetFieldNames(null);

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetFieldIdToNameMap_WithNullTemplate_DoesNotLog()
        {
            // Arrange
            var sut = new TemplateService(logger);

            // Act
            sut.GetFieldIdToNameMap(null);

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetStandardValuesItem_WithNullTemplate_DoesNotLog()
        {
            // Arrange
            var sut = new TemplateService(logger);

            // Act
            sut.GetStandardValuesItem(null);

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void BuildFieldDescriptors_WithNullTemplate_DoesNotLog()
        {
            // Arrange
            var sut = new TemplateService(logger);
            var parsedParams = new NameValueCollection();
            var addedFields = new HashSet<string>();

            // Act
            sut.BuildFieldDescriptors(null, parsedParams, addedFields).ToList();

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void BuildFieldDescriptors_ReturnsFieldDescriptorInfoType()
        {
            // Arrange
            var sut = new TemplateService();
            var item = new FakeItem(ID.NewID).ToSitecoreItem();
            var parsedParams = new NameValueCollection();
            var addedFields = new HashSet<string>();

            // Act
            var result = sut.BuildFieldDescriptors(item, parsedParams, addedFields);

            // Assert
            result.Should().BeAssignableTo<IEnumerable<FieldDescriptorInfo>>();
        }

        [Fact]
        public void Constructor_WithLogger_UsesProvidedLogger()
        {
            // Arrange
            var customLogger = Substitute.For<IRenderingMappingLogger>();
            var sut = new TemplateService(customLogger);
            var item = new FakeItem(ID.NewID).ToSitecoreItem();

            // Act
            sut.GetFieldNames(item);

            // Assert
            customLogger.Received().Warn(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetFieldIdToNameMap_ReturnsDictionary()
        {
            // Arrange
            var sut = new TemplateService();

            // Act
            var result = sut.GetFieldIdToNameMap(null);

            // Assert
            result.Should().BeAssignableTo<IDictionary<ID, string>>();
        }

        [Fact]
        public void GetFieldNames_ReturnsEnumerable()
        {
            // Arrange
            var sut = new TemplateService();

            // Act
            var result = sut.GetFieldNames(null);

            // Assert
            result.Should().BeAssignableTo<IEnumerable<string>>();
        }
    }
}