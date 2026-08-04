using AutoFixture;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Api.Domain.Interfaces.Destinations;
using easyJet.Holidays.Api.Domain.Interfaces.Hotels;
using easyJet.Holidays.Api.Domain.Services.Content;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.Api.Domain.Tests.Controllers
{
    public class ContentControllerTests
    {
        private readonly IFixture _fixture;
        private readonly Mock<IHotelsService> _hotelsServiceMock = new();
        private readonly Mock<IReferenceDataService> _referenceDataServiceMock = new();
        private readonly Mock<ITransferService> _transferServiceMock = new();
        private readonly Mock<IDestinationsService> _destinationsServiceMock = new();
        private readonly Mock<ICmsContentService> _cmsContentServiceMock = new();
        private readonly ContentController _sut;

        public ContentControllerTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();

            _fixture.Inject(Options.Create(new LanguageSettings
            {
                DefaultLanguage = "en",
            }));

            _sut = new ContentController(
                _hotelsServiceMock.Object,
                _referenceDataServiceMock.Object,
                _transferServiceMock.Object,
                _destinationsServiceMock.Object,
                _cmsContentServiceMock.Object,
                _fixture.Create<IOptions<LanguageSettings>>());
        }

        [Fact]
        public async Task GetTransferInstructions_NoLang_GetsByDefaultLanguage()
        {
            var productId = "1234";

            var response = await _sut.TransferInstructions(productId, null) as ObjectResult;

            _transferServiceMock.Verify(x => x.GetTransferInfoByProductId(productId, "en"));
        }

        [Fact]
        public async Task GetSomethingDifferentDestinations_OK()
        {
            _cmsContentServiceMock
                .Setup(x => x.GetSomethingDifferentDestinationsCodes())
                .ReturnsAsync(["ITLG"]);

            var response = await _sut.GetSomethingDifferentDestinations();
            var parsedResponse = response as IEnumerable<string>;
            var arrayResponse = parsedResponse?.ToArray();

            arrayResponse?.Should().NotBeNull();
            arrayResponse?.Length.Should().Be(1);
            arrayResponse?[0].Should().Be("ITLG");
        }
    }
}
