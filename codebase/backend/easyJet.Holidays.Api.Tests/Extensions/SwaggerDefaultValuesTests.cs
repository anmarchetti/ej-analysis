using easyJet.Holidays.Api.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.OpenApi;
using Moq;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace easyJet.Holidays.Api.Tests.Extensions;

public class SwaggerDefaultValuesTests
{
    private readonly SwaggerDefaultValues _sut = new();

    private static OperationFilterContext CreateContext(ApiDescription apiDescription)
    {
        apiDescription.ActionDescriptor ??= new ActionDescriptor();
        var methodInfo = typeof(SwaggerDefaultValuesTests)
            .GetMethod(nameof(DummyMethod), BindingFlags.NonPublic | BindingFlags.Static)!;
        return new OperationFilterContext(
            apiDescription,
            new Mock<ISchemaGenerator>().Object,
            new SchemaRepository(),
            new OpenApiDocument(),
            methodInfo);
    }

    private static void DummyMethod() { }

    [Fact]
    public void Apply_WhenResponseKeyNotFoundInOperation_DoesNotThrow()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.SupportedResponseTypes.Add(new ApiResponseType
        {
            StatusCode = 200,
            ApiResponseFormats = [new ApiResponseFormat { MediaType = "application/json" }]
        });

        var operation = new OpenApiOperation
        {
            Responses = new OpenApiResponses()
        };

        var context = CreateContext(apiDescription);

        // Act
        var action = () => _sut.Apply(operation, context);

        // Assert
        action.Should().NotThrow();
    }

    [Fact]
    public void Apply_WhenResponseContentIsNull_DoesNotThrow()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.SupportedResponseTypes.Add(new ApiResponseType
        {
            StatusCode = 200,
            ApiResponseFormats = [new ApiResponseFormat { MediaType = "application/json" }]
        });

        var operation = new OpenApiOperation
        {
            Responses = new OpenApiResponses
            {
                ["200"] = new OpenApiResponse() // Content is null by default in OpenApi v2
            }
        };

        var context = CreateContext(apiDescription);

        // Act
        var action = () => _sut.Apply(operation, context);

        // Assert
        action.Should().NotThrow();
    }

    [Fact]
    public void Apply_RemovesUnsupportedContentTypes()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.SupportedResponseTypes.Add(new ApiResponseType
        {
            StatusCode = 200,
            ApiResponseFormats = [new ApiResponseFormat { MediaType = "application/json" }]
        });

        var operation = new OpenApiOperation
        {
            Responses = new OpenApiResponses
            {
                ["200"] = new OpenApiResponse
                {
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/json"] = new OpenApiMediaType(),
                        ["text/plain"] = new OpenApiMediaType()
                    }
                }
            }
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        var content = operation.Responses["200"].Content;
        content.Should().ContainKey("application/json");
        content.Should().NotContainKey("text/plain");
    }

    [Fact]
    public void Apply_KeepsAllSupportedContentTypes()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.SupportedResponseTypes.Add(new ApiResponseType
        {
            StatusCode = 200,
            ApiResponseFormats =
            [
                new ApiResponseFormat { MediaType = "application/json" },
                new ApiResponseFormat { MediaType = "text/plain" }
            ]
        });

        var operation = new OpenApiOperation
        {
            Responses = new OpenApiResponses
            {
                ["200"] = new OpenApiResponse
                {
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/json"] = new OpenApiMediaType(),
                        ["text/plain"] = new OpenApiMediaType()
                    }
                }
            }
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        operation.Responses["200"].Content.Should().HaveCount(2);
    }

    [Fact]
    public void Apply_WhenParametersAreNull_ReturnsWithoutError()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        var operation = new OpenApiOperation
        {
            Parameters = null,
            Responses = new OpenApiResponses()
        };

        var context = CreateContext(apiDescription);

        // Act
        var action = () => _sut.Apply(operation, context);

        // Assert
        action.Should().NotThrow();
    }

    [Fact]
    public void Apply_SetsRequiredOnParameter_WhenDescriptionIsRequired()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.ParameterDescriptions.Add(new ApiParameterDescription
        {
            Name = "id",
            IsRequired = true
        });

        var parameter = new OpenApiParameter { Name = "id", Required = false };
        var operation = new OpenApiOperation
        {
            Parameters = [parameter],
            Responses = new OpenApiResponses()
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        parameter.Required.Should().BeTrue();
    }

    [Fact]
    public void Apply_DoesNotSetRequired_WhenDescriptionIsNotRequired()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.ParameterDescriptions.Add(new ApiParameterDescription
        {
            Name = "id",
            IsRequired = false
        });

        var parameter = new OpenApiParameter { Name = "id", Required = false };
        var operation = new OpenApiOperation
        {
            Parameters = [parameter],
            Responses = new OpenApiResponses()
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        parameter.Required.Should().BeFalse();
    }

    [Fact]
    public void Apply_DoesNotOverrideExistingParameterDescription()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.ParameterDescriptions.Add(new ApiParameterDescription
        {
            Name = "id",
            IsRequired = false
        });

        var parameter = new OpenApiParameter
        {
            Name = "id",
            Description = "Existing description"
        };
        var operation = new OpenApiOperation
        {
            Parameters = [parameter],
            Responses = new OpenApiResponses()
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        parameter.Description.Should().Be("Existing description");
    }

    [Fact]
    public void Apply_HandlesDefaultResponseKey()
    {
        // Arrange
        var apiDescription = new ApiDescription();
        apiDescription.SupportedResponseTypes.Add(new ApiResponseType
        {
            IsDefaultResponse = true,
            ApiResponseFormats = [new ApiResponseFormat { MediaType = "application/json" }]
        });

        var operation = new OpenApiOperation
        {
            Responses = new OpenApiResponses
            {
                ["default"] = new OpenApiResponse
                {
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["application/json"] = new OpenApiMediaType(),
                        ["application/xml"] = new OpenApiMediaType()
                    }
                }
            }
        };

        var context = CreateContext(apiDescription);

        // Act
        _sut.Apply(operation, context);

        // Assert
        var content = operation.Responses["default"].Content;
        content.Should().ContainKey("application/json");
        content.Should().NotContainKey("application/xml");
    }
}
