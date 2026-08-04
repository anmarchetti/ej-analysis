using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Logging;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Tests.Logging;

public class HeaderAllowlistLoggingInterceptorTests
{
    private const string AllowedHeaderName = "X-Correlation-Id";

    private readonly ApiSettings _settings;
    private readonly HeaderAllowlistLoggingInterceptor _sut;

    public HeaderAllowlistLoggingInterceptorTests()
    {
        _settings = new ApiSettings { Logging = new LoggingSettings { AllowedRequestHeaders = [AllowedHeaderName] } };
        _sut = new HeaderAllowlistLoggingInterceptor(Options.Create(_settings));
    }

    [Fact]
    public async Task OnRequestAsync_HeaderInAllowlist_AddsHeaderAsParameter()
    {
        // Arrange
        const string headerValue = "abc-123";
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers[AllowedHeaderName] = headerValue;
        var logContext = new HttpLoggingInterceptorContext { HttpContext = httpContext };

        // Act
        await _sut.OnRequestAsync(logContext);

        // Assert
        logContext.Parameters.Should().ContainSingle(p => p.Key == AllowedHeaderName && p.Value!.Equals(headerValue));
    }

    [Fact]
    public async Task OnRequestAsync_HeaderNotInAllowlist_DoesNotAddHeaderAsParameter()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers.Authorization = "Bearer token";
        var logContext = new HttpLoggingInterceptorContext { HttpContext = httpContext };

        // Act
        await _sut.OnRequestAsync(logContext);

        // Assert
        logContext.Parameters.Should().BeEmpty();
    }

    [Fact]
    public async Task OnRequestAsync_AllowlistMatchDiffersInCase_AddsHeaderAsParameter()
    {
        // Arrange
        const string header = "abc-123";
        _settings.Logging.AllowedRequestHeaders.Add(header);

        // inline due to hashset being built in ctor
        var sut = new HeaderAllowlistLoggingInterceptor(Options.Create(_settings));


        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers[header.ToUpperInvariant()] = "headerValue";
        var logContext = new HttpLoggingInterceptorContext { HttpContext = httpContext };

        // Act
        await sut.OnRequestAsync(logContext);

        // Assert
        logContext.Parameters.Should().ContainSingle(p => string.Equals(p.Key, header, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task OnResponseAsync_DoesNothing()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers[AllowedHeaderName] = "abc-123";
        var logContext = new HttpLoggingInterceptorContext { HttpContext = httpContext };

        // Act
        await _sut.OnResponseAsync(logContext);

        // Assert
        logContext.Parameters.Should().BeEmpty();
    }
}
