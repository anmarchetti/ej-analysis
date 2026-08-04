using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.B2B.Services;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.B2B.Tests.Services
{
    public class B2BMembersServiceTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<ILogger<B2BMembersService>> _loggerMock = new();
        private readonly Mock<ILanguageService> _languageServiceMock = new();
        private readonly B2BMembersService _b2BMembersService;
        private readonly Mock<EndpointsProvider> _endpointsProvider = new();
        private readonly Mock<IApiService> _apiService = new();
        private readonly CustomerDetails customerDetails;
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock;
        public B2BMembersServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            // Data
            _languageServiceMock.Setup(x => x.GetCurrentLanguage()).Returns("fr-CH");

            customerDetails = new CustomerDetails
            {
                FirstName = "Jan",
                LastName = "Kowalski",
                CountryCode = "fr-CH",
                MobilePhone = "623543567",
                DialingCode = "+48",
                Email = "kowalski@jan.com"
            };

            // HttpContextAccessor
            var connectionMock = _fixture.Freeze<Mock<ConnectionInfo>>();
            connectionMock
                .SetupGet(cm => cm.RemoteIpAddress)
                .Returns(new System.Net.IPAddress(2130706433));

            var contextMock = _fixture.Freeze<Mock<HttpContext>>();
            contextMock
                .SetupGet(c => c.Connection)
                .Returns(connectionMock.Object);

            var hca = _fixture.Freeze<Mock<IHttpContextAccessor>>();
            hca
                .SetupGet(x => x.HttpContext)
                .Returns(contextMock.Object);

            // EndpointsProvider
            var settings = Options.Create(new B2BSettings()
            {
                Url = "https://b2b.129.ejtest.com",
                Api = new B2BApiSettings { MyService = "MyService.asmx" }
            });

            _endpointsProvider = new Mock<EndpointsProvider>(settings, Options.Create(new EnvironmentBehaviourSettings()),
                null, new Mock<ILogger<BaseEndpointsProvider>>().Object);

            // Services
            _apiService = new Mock<IApiService>();

            _referenceDataServiceMock = new Mock<IReferenceDataService>();
            _referenceDataServiceMock
                .Setup(x => x.GetCustomerDetailsFormSettings())
                .ReturnsAsync(new CustomerDetailsFormSettings
                {
                    PasswordProhibitedWordsString = "ProhibitedWord"
                });
            
            _b2BMembersService = new B2BMembersService(
                _apiService.Object,
                Options.Create(new B2BSettings()),
                _endpointsProvider.Object,
                hca.Object,
                _referenceDataServiceMock.Object,
                _loggerMock.Object,
                _languageServiceMock.Object);
        }

        [Fact]
        public async Task GetLanguageCodeExecutionCountAtPasswordReset()
        {
            await _b2BMembersService.ResetPassword(customerDetails.Email);

            _languageServiceMock.Verify(x => x.GetCurrentLanguage(), Times.Once());
        }

        [Fact]
        public async Task CreateCustomerSuccessLanguageCodeExecutionCount()
        {
            await _b2BMembersService.Create(customerDetails, "p4$ssworD");

            _languageServiceMock.Verify(x => x.GetCurrentLanguage(), Times.Once());
        }

        [Fact]
        public async Task CreateCustomerFailedPasswordContainsProhibitedWord()
        {
            var exception = await Assert.ThrowsAsync<Exception>(async () => await _b2BMembersService.Create(customerDetails, "ProhibitedWord"));
            exception.Message.Should().Be("Password contains prohibited words");
        }
    }
}
