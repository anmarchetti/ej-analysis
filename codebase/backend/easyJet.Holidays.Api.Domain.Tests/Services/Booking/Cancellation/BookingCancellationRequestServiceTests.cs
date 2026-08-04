using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Booking.Cancellation;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking.Cancellation;

public class BookingCancellationRequestServiceTests
{
    private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
    private readonly Mock<IAuthenticationService> _authenticationServiceMock;
    private readonly Mock<IOptions<CookiesSettings>> _cookiesSettingsMock;
    private readonly BookingCancellationRequestService _service;

    public BookingCancellationRequestServiceTests()
    {
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _authenticationServiceMock = new Mock<IAuthenticationService>();
        _cookiesSettingsMock = new Mock<IOptions<CookiesSettings>>();
        _cookiesSettingsMock.Setup(options => options.Value).Returns(new CookiesSettings { Language = "en" });

        _service = new BookingCancellationRequestService(
            _httpContextAccessorMock.Object,
            _authenticationServiceMock.Object,
            _cookiesSettingsMock.Object
        );
    }

    // Test 1: Customer authorized when cookie matches language
    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnTrue_WhenCookieExistsForLanguage()
    {
        // Arrange
        var mockContext = new DefaultHttpContext();

        // Mock the cookies collection
        var mockCookies = new Mock<IRequestCookieCollection>();
        mockCookies.Setup(c => c.ContainsKey("en")).Returns(true);
        mockContext.Request.Cookies = mockCookies.Object;

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(mockContext);

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.True(result);
    }

    // Test 2: Customer not authorized when cookie does not exist for language
    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenCookieDoesNotExistForLanguage()
    {
        // Arrange
        var mockContext = new DefaultHttpContext();

        // Mock the cookies collection with a different language
        var mockCookies = new Mock<IRequestCookieCollection>();
        mockCookies.Setup(c => c.ContainsKey("fr")).Returns(true); 
        mockContext.Request.Cookies = mockCookies.Object;

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(mockContext);

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }

    // Test 3: Customer not authorized when there is no language cookie
    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenLanguageCookieIsNotPresent()
    {
        // Arrange
        var mockContext = new DefaultHttpContext();

        // Mock the cookies collection without any language cookie
        var mockCookies = new Mock<IRequestCookieCollection>();
        mockCookies.Setup(c => c.ContainsKey(It.IsAny<string>())).Returns(false); // No cookies set
        mockContext.Request.Cookies = mockCookies.Object;

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(mockContext);

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }

    // Test 4: Customer not authorized when language setting is null or empty
    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenLanguageSettingIsNullOrEmpty()
    {
        // Arrange
        _cookiesSettingsMock.Setup(options => options.Value).Returns(new CookiesSettings
        {
            Language = null // Simulate missing language setting
        });

        var mockContext = new DefaultHttpContext();

        // Mock the cookies collection with a language cookie
        var mockCookies = new Mock<IRequestCookieCollection>();
        mockCookies.Setup(c => c.ContainsKey("en")).Returns(false);
        mockContext.Request.Cookies = mockCookies.Object;

        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(mockContext);

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }

    // Test 5: Customer not authorized when there is no HTTP context
    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenHttpContextIsNull()
    {
        // Arrange
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnTrue_WhenContextIsNullButUserIsAuthorized()
    {
        // Arrange
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
        _authenticationServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("test@reply.com");

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenContextIsNullAndUserEmailIsEmpty()
    {
        // Arrange
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
        _authenticationServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync("");

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsCustomerAuthorizedRequest_ShouldReturnFalse_WhenContextIsNullAndUserEmailIsNull()
    {
        // Arrange
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext)null);
        _authenticationServiceMock.Setup(x => x.GetCustomerEmail()).ReturnsAsync(default(string));

        // Act
        var result = await _service.IsWebsiteRequest();

        // Assert
        Assert.False(result);
    }
}