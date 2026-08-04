using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using FluentAssertions.Execution;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account
{
    /// <summary>
    /// Component tests for <see cref="AccountController"/>
    /// </summary>
    public class AccountControllerLoginTests : BaseComponentTest
    {
        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Theory]
        [InlineAutoData("Valid request", "test@easyjet.com", "pass", HttpStatusCode.OK)]
        [InlineAutoData("Invlaid email", "test_easyjet.com", "pass", HttpStatusCode.BadRequest)]
        [InlineAutoData("No password", "test@easyjet.com", "", HttpStatusCode.BadRequest)]
        [InlineAutoData("No email", "", "pass", HttpStatusCode.BadRequest)]
        public async Task Login_ValidateRequest(string because, string email, string password, HttpStatusCode status)
        {
            // Arrange 
            var query = $"/api/v1.0/account/login";
            var body = JsonConvert.SerializeObject(new
            {
                email,
                password,
                captcha = "uniquetoken",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert            
            response.StatusCode.Should().Be(status, because);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Theory]
        [InlineAutoData("/api/v1.0/account/login", "test@easyjet.com", "Qwerty_0", "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;", "domain=localhost; path=/; secure; samesite=lax; httponly")]
        public async Task Login_ValidData_AddsDAEncryptedSessionCookie(string apiUrl, string email, string password, string cookieKeyValue, string cookieOptions)
        {
            // Arrange 
            var body = JsonConvert.SerializeObject(new
            {
                email,
                password,
                rememberMe = true,
                captcha = "uniquetoken",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync(apiUrl, new StringContent(body, Encoding.UTF8, "application/json"));
            var cookies = response.Headers.GetValues("Set-Cookie");
            var sessionCookie = cookies.FirstOrDefault(x => x.IndexOf(cookieKeyValue) >= 0);

            // Assert
            sessionCookie.Should().NotBeNull();
            sessionCookie.Contains(cookieOptions).Should().BeTrue();
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Theory]
        [InlineAutoData("/api/v1.0/account/login", "test@easyjet.com", "pass", "domain=localhost; path=/; secure; samesite=lax; httponly")]
        public async Task Login_ValidData_AddsDAExpirationCookie(string apiUrl, string email, string password, string cookieOptions)
        {
            // Arrange 
            var body = JsonConvert.SerializeObject(new
            {
                email,
                password,
                rememberMe = true,
                captcha = "uniquetoken",
                DisableTracking = true
            });

            var expires = DateTime.UtcNow.AddMinutes(1500); // 1500 is from appsettings.json
            var expectedExpirationMls = expires.ToEpocMls();


            // Act
            var response = await Client.PostAsync(apiUrl, new StringContent(body, Encoding.UTF8, "application/json"));
            var cookies = response.Headers.GetValues("Set-Cookie");
            var expiresCookie = cookies.FirstOrDefault(x => x.IndexOf("eJExpires=") >= 0);

            // Assert
            expiresCookie.Should().NotBeNull();
            expiresCookie.Contains(cookieOptions).Should().BeTrue();

            var exprationMls = long.Parse(expiresCookie.Split(";")[0].Split("=")[1]); // "eJExpires=1231231231232; expires=Tue......"
            (exprationMls - expectedExpirationMls).Should().BeLessThan((long)5e3); // assume request takes less then 5 seconds
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Theory]
        [InlineAutoData("/api/v1.0/account/login", "test@easyjet.com", "pass")]
        public async Task Login_DontRememberMe_DeleteDAExpirationCookie(string apiUrl, string email, string password)
        {
            // Arrange 
            var body = JsonConvert.SerializeObject(new
            {
                email,
                password,
                rememberMe = false,
                captcha = "uniquetoken",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync(apiUrl, new StringContent(body, Encoding.UTF8, "application/json"));
            var cookies = response.Headers.GetValues("Set-Cookie");
            var expirationCookie = cookies.FirstOrDefault(x => x.IndexOf("eJExpires=") >= 0);

            // Assert
            expirationCookie.Should().Be("eJExpires=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=localhost; path=/; secure; samesite=lax; httponly");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Theory]
        [InlineAutoData("/api/v1.0/account/login", "emailnotexist@easyjet.com", "pass")]
        public async Task Login_InvalidCreds_ForbiddenWithError(string apiUrl, string email, string password)
        {
            // Arrange 
            var body = JsonConvert.SerializeObject(new
            {
                email,
                password,
                captcha = "uniquetoken",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync(apiUrl, new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            await response.AssertErrorResponse(ApiExceptionCodes.AuthCustomerLoginError, HttpStatusCode.BadRequest);
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Fact]
        public async Task Login_NoCaptcha_BadRequest()
        {
            // Arrange
            ApplyConfigurationField("Google:ReCAPTCHA:Enabled", "true");

            var body = JsonConvert.SerializeObject(new
            {
                email = "test@easyjet.com",
                password = "pass",
                captcha = "",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync("/api/v1.0/account/login", new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            var content = await response.Content.ReadAsStringAsync();
            content.Should().Be("CAPTCHA is required");
        }

        [Trait("Category", "Component")]
        [Trait("Api", "/api/v1.0/account/login")]
        [Fact]
        public async Task Login_InvalidCaptcha_BadRequest()
        {
            // Arrange

            ApplyManyConfigurationFields(new[]
            {
                new KeyValuePair<string, string>("Google:ReCAPTCHA:Enabled", "true"),
            });

            var body = JsonConvert.SerializeObject(new
            {
                email = "test@easyjet.com",
                password = "pass",
                captcha = "invalidcaptcha",
                DisableTracking = true
            });

            // Act
            var response = await Client.PostAsync("/api/v1.0/account/login", new StringContent(body, Encoding.UTF8, "application/json"));

            // Assert
            using (new AssertionScope())
            {
                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
                var content = await response.Content.ReadAsStringAsync();
                content.Should().Be("Invalid CAPTCHA");
            }
        }
    }
}