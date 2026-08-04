using System.Collections.Specialized;
using easyJet.Feature.SitecoreEnhancment.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Text;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Tests.CustomFields.Services
{
    public class RenderingParameterEditorServiceTests
    {
        private readonly IFieldEditorUrlBuilder fieldEditorUrlBuilder;
        private readonly IRenderingParameterService renderingParameterService;
        private readonly RenderingParameterEditorService sut;

        public RenderingParameterEditorServiceTests()
        {
            fieldEditorUrlBuilder = Substitute.For<IFieldEditorUrlBuilder>();
            renderingParameterService = Substitute.For<IRenderingParameterService>();
            sut = new RenderingParameterEditorService(fieldEditorUrlBuilder, renderingParameterService);
        }

        [Fact]
        public void ParseEditParametersMetadata_WithValidMetadata_ShouldReturnParsedValues()
        {
            // Arrange
            var metadata = "hiddenField|dropdown|clientId";

            // Act
            var (hiddenFieldId, dropdownId, hiddenFieldClientId) = sut.ParseEditParametersMetadata(metadata);

            // Assert
            hiddenFieldId.Should().Be("hiddenField");
            dropdownId.Should().Be("dropdown");
            hiddenFieldClientId.Should().Be("clientId");
        }

        [Fact]
        public void ParseEditParametersMetadata_WithNullMetadata_ShouldReturnEmptyStrings()
        {
            // Act
            var (hiddenFieldId, dropdownId, hiddenFieldClientId) = sut.ParseEditParametersMetadata(null);

            // Assert
            hiddenFieldId.Should().BeEmpty();
            dropdownId.Should().BeEmpty();
            hiddenFieldClientId.Should().BeEmpty();
        }

        [Fact]
        public void ParseEditParametersMetadata_WithPartialMetadata_ShouldReturnAvailableValues()
        {
            // Arrange
            var metadata = "hiddenField|dropdown";

            // Act
            var (hiddenFieldId, dropdownId, hiddenFieldClientId) = sut.ParseEditParametersMetadata(metadata);

            // Assert
            hiddenFieldId.Should().Be("hiddenField");
            dropdownId.Should().Be("dropdown");
            hiddenFieldClientId.Should().BeEmpty();
        }

        [Fact]
        public void CreatePipelineParameters_ShouldReturnNameValueCollectionWithCorrectKeys()
        {
            // Arrange
            var hiddenFieldId = "hidden1";
            var dropdownId = "dropdown1";
            var hiddenFieldClientId = "client1";

            // Act
            var result = sut.CreatePipelineParameters(hiddenFieldId, dropdownId, hiddenFieldClientId);

            // Assert
            result.Should().NotBeNull();
            result[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldId].Should().Be(hiddenFieldId);
            result[Constants.RenderingMappingEditor.PipelineParameters.DropdownId].Should().Be(dropdownId);
            result[Constants.RenderingMappingEditor.PipelineParameters.HiddenFieldClientId].Should().Be(hiddenFieldClientId);
        }

        [Fact]
        public void TryParseRenderingId_WithValidId_ShouldReturnTrueAndParsedId()
        {
            // Arrange
            var validId = "{11111111-1111-1111-1111-111111111111}";

            // Act
            var result = sut.TryParseRenderingId(validId, out var renderingId);

            // Assert
            result.Should().BeTrue();
            renderingId.Should().NotBe(ID.Null);
        }

        [Fact]
        public void TryParseRenderingId_WithInvalidId_ShouldReturnFalse()
        {
            // Arrange
            var invalidId = "not-a-valid-id";

            // Act
            var result = sut.TryParseRenderingId(invalidId, out var renderingId);

            // Assert
            result.Should().BeFalse();
            renderingId.Should().Be(ID.Null);
        }

        [Fact]
        public void TryParseRenderingId_WithEmptyString_ShouldReturnFalse()
        {
            // Act
            var result = sut.TryParseRenderingId(string.Empty, out var renderingId);

            // Assert
            result.Should().BeFalse();
            renderingId.Should().Be(ID.Null);
        }

        [Fact]
        public void GetFieldEditorUrlOptions_WithParametersTemplate_ShouldReturnFullEditorOptions()
        {
            // Arrange
            var renderingId = ID.NewID;
            var currentParams = "Placeholder=Main";
            var expectedUrl = new UrlString("/field-editor");

            fieldEditorUrlBuilder.BuildFieldEditorUrl(renderingId, currentParams).Returns(expectedUrl);

            // Act
            var result = sut.GetFieldEditorUrlOptions(renderingId, currentParams);

            // Assert
            result.Should().NotBeNull();
            result.Url.Should().Be(expectedUrl);
            result.UseBasicParams.Should().BeFalse();
            result.Header.Should().Be(Constants.RenderingMappingEditor.EditRenderingParametersDialogTitle);
        }

        [Fact]
        public void GetFieldEditorUrlOptions_WithoutParametersTemplate_ShouldReturnBasicEditorOptions()
        {
            // Arrange
            var renderingId = ID.NewID;
            var currentParams = "Placeholder=Main";
            var basicUrl = new UrlString("/basic-editor");

            fieldEditorUrlBuilder.BuildFieldEditorUrl(renderingId, currentParams).Returns((UrlString)null);
            fieldEditorUrlBuilder.BuildBasicRenderingPropertiesUrl(currentParams).Returns(basicUrl);

            // Act
            var result = sut.GetFieldEditorUrlOptions(renderingId, currentParams);

            // Assert
            result.Should().NotBeNull();
            result.Url.Should().Be(basicUrl);
            result.UseBasicParams.Should().BeTrue();
            result.Header.Should().Be(Constants.RenderingMappingEditor.EditRenderingPropertiesDialogTitle);
        }

        [Fact]
        public void ProcessFieldEditorResult_ShouldDelegateToRenderingParameterService()
        {
            // Arrange
            var result = "someHandle";
            var renderingId = ID.NewID;
            var useBasicParams = false;
            var expectedParams = "Placeholder=Main&Data Source=/sitecore";

            renderingParameterService.ExtractParametersFromFieldEditorResult(result, renderingId, useBasicParams)
                .Returns(expectedParams);

            // Act
            var actualParams = sut.ProcessFieldEditorResult(result, renderingId, useBasicParams);

            // Assert
            actualParams.Should().Be(expectedParams);
            renderingParameterService.Received(1).ExtractParametersFromFieldEditorResult(result, renderingId, useBasicParams);
        }

        [Fact]
        public void FieldEditorUrlOptions_Properties_ShouldBeSettable()
        {
            // Arrange & Act
            var options = new FieldEditorUrlOptions
            {
                Url = new UrlString("/test"),
                UseBasicParams = true,
                Width = "800",
                Height = "600",
                Header = "Test Header"
            };

            // Assert
            options.Url.ToString().Should().Be("/test");
            options.UseBasicParams.Should().BeTrue();
            options.Width.Should().Be("800");
            options.Height.Should().Be("600");
            options.Header.Should().Be("Test Header");
        }
    }
}
