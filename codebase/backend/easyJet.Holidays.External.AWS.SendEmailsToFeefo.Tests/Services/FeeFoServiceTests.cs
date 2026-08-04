using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Feefo;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Feefo.Models.EnterSale;
using easyJet.Holidays.External.Feefo.Models.Review;
using easyJet.Holidays.External.Feefo.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using System.Globalization;
using System.Web;
using Xunit;

namespace easyJet.Holidays.External.AWS.SendEmailsToFeefo.Tests.Services
{
    public class FeeFoServiceTests
    {
        private readonly Mock<IApiService> _apiService;
        private readonly FeefoService _sut;
        private readonly FeefoApiSettings _settings;

        public FeeFoServiceTests()
        {
            var fixture = FixtureUtils.AutoMoqFixture();
            _settings = new FeefoApiSettings
            {
                EndPointReviewsSummaryService = "https://api.feefo.com/api/20/reviews/summary/service",
                ReviewsSummaryServiceQueryParams = "summaryParam=1234",
                EndPointReviewsService = "https://api.feefo.com/api/20/reviews/service",
                ReviewsServiceQueryParams = "reviewsParam=123",
            };
            fixture.Inject(Options.Create(_settings));

            _apiService = fixture.Freeze<Mock<IApiService>>();
            _sut = fixture.Create<FeefoService>();
        }

        #region GetFormData
        [Fact]
        public void GetFormData_ContainsOnlyMerchantIdentifier()
        {
            // Arrange
            var merchantName = "testMerchant";
            var sale = new FeefoEnterSale() { MerchantIdentifier = merchantName };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { merchantName, FeefoService._merchantIdentifier }, "because only a merchantidentifier value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_ContainsOnlyProductSearchCode()
        {
            // Arrange
            var productSearchCode = "testProductSearchCode";
            var sale = new FeefoEnterSale() { ProductSearchCode = productSearchCode };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { productSearchCode, FeefoService._productsearchcode }, "because only a productSearchCode value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_ContainsOnlyDescription()
        {
            // Arrange
            var description = "testDescription";
            var sale = new FeefoEnterSale() { Description = description };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { description, FeefoService._description }, "because only a description value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._merchantIdentifier, FeefoService._email, FeefoService._name, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_ContainsOnlyEmail()
        {
            // Arrange
            var email = "test@test.test";
            var sale = new FeefoEnterSale() { Email = email };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { HttpUtility.UrlEncode(email), HttpUtility.UrlEncode(FeefoService._email) }, "because only an email value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._merchantIdentifier, FeefoService._description, FeefoService._name, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_ContainsOnlyName()
        {
            // Arrange
            var name = "testUser";
            var sale = new FeefoEnterSale() { Name = name };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { name, FeefoService._name }, "because only a name value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._merchantIdentifier, FeefoService._description, FeefoService._email, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_ContainsOnlyOrderReference()
        {
            // Arrange
            var orderRef = "12345";
            var sale = new FeefoEnterSale() { OrderReference = orderRef };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { orderRef, FeefoService._orderRef }, "because only an orderRef value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._merchantIdentifier, FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._customerRef, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_GenerateUnsubscribeLink()
        {
            // Arrange
            var unsubscribeLink = "https://www.easyjet.com/en/holidays/marketing-research-unsubscribe?encEmail=someTestEncryptEmail";
            var sale = new FeefoEnterSale() { UnsubscribeLink = unsubscribeLink };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { HttpUtility.UrlEncode(unsubscribeLink), HttpUtility.UrlEncode(FeefoService._unsubscribeLink) }, "because only an unsubscribeLink value was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._merchantIdentifier, FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._customerRef });
        }


        [Fact]
        public void GetFormData_HasPrice()
        {
            // Arrange
            var testPrice = 123.45;
            var sale = new FeefoEnterSale() { Amount = testPrice };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { testPrice.ToString(CultureInfo.InvariantCulture), FeefoService._amount }, $"because a price was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetFormData_ContainsOnlyHotelName()
        {
            // Arrange
            var hotelName = "testHotel";
            var sale = new FeefoEnterSale() { CustomerReference = hotelName };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(new string[] { hotelName, FeefoService._customerRef }, "because only a hotel name was provided.");
            data.Should().NotContainAny(new string[] { FeefoService._orderRef, FeefoService._merchantIdentifier, FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._unsubscribeLink });
        }

        [Fact]
        public void GetFormData_Complete()
        {
            // Arrange
            var merchantName = "testMerchant";
            var description = "testDescription";
            var email = "test@test.test";
            var name = "testUser";
            var orderRef = "12345";
            var reference = "testHotel";
            var unsubscribeLink = "https://www.easyjet.com/en/holidays/marketing-research-unsubscribe?encEmail=someTestEncryptEmail";
            var sale = new FeefoEnterSale()
            {
                MerchantIdentifier = merchantName,
                Description = description,
                Email = email,
                Name = name,
                OrderReference = orderRef,
                CustomerReference = reference,
                UnsubscribeLink = unsubscribeLink
            };

            // Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().ContainAll(
                new string[] { FeefoService._merchantIdentifier, FeefoService._description, FeefoService._email, FeefoService._name, FeefoService._orderRef, FeefoService._customerRef, FeefoService._unsubscribeLink },
                $"because all values were provided, making this a fully populated {typeof(FeefoEnterSale).Name} instance."
            );
        }

        [Fact]
        public void GetFormData_Empty()
        {
            // Arrange
            var sale = new FeefoEnterSale();

            //Act
            var data = _sut.GetFormData(sale);

            // Assert
            data.Should().BeNullOrEmpty($"because the {typeof(FeefoEnterSale).Name} instance is empty.");
        }

        #endregion
        #region GetTags
        [Fact]
        public void GetTags_HasDate()
        {
            // Arrange
            var now = DateTime.Now;
            var sale = new FeefoEnterSale() { Date = DateTime.Now };
            var expectedKV = KeyValuePair.Create(FeefoService._date, now.ToString("dd-MM-yyyy"));

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(expectedKV, $"because a date was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasCategory()
        {
            // Arrange
            var theme = "testCategory";
            var sale = new FeefoEnterSale() { HotelTheme = theme };
            var expectedKV = KeyValuePair.Create(FeefoService._category, theme);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(expectedKV, $"because a category was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasDestinationCountry()
        {
            // Arrange
            var destinationCountry = "testCountry";
            var sale = new FeefoEnterSale() { DestinationCountryName = destinationCountry };
            var excpectedKV = KeyValuePair.Create(FeefoService._destinationcountry, destinationCountry);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(excpectedKV, $"because a destinationCountry was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasDestinationRegion()
        {
            // Arrange
            var destinationRegion = "testRegion";
            var sale = new FeefoEnterSale() { DestinationRegionName = destinationRegion };
            var excpectedKV = KeyValuePair.Create(FeefoService._destinationregion, destinationRegion);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(excpectedKV, $"because a destinationRegion was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasResortName()
        {
            // Arrange
            var resortName = "testResort";
            var sale = new FeefoEnterSale() { ResortName = resortName };
            var excpectedKV = KeyValuePair.Create(FeefoService._resort, resortName);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(excpectedKV, $"because a resortName was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasHotelName()
        {
            // Arrange
            var hotelName = "testHotel";
            var sale = new FeefoEnterSale() { HotelName = hotelName };
            var excpectedKV = KeyValuePair.Create(FeefoService._hotel, hotelName);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(excpectedKV, $"because a hotelName was provided with the {typeof(FeefoEnterSale).Name} instance.");
        }

        [Fact]
        public void GetTags_HasPackageType()
        {
            // Arrange
            var package = "Test Holiday Type";
            var sale = new FeefoEnterSale() { PackageType = package };
            var expectedKV = KeyValuePair.Create(FeefoService._packageType, package);

            // Act
            var data = _sut.GetTags(sale);

            // Assert
            data.Should().Contain(expectedKV, $"because a packageType was provide with the {typeof(FeefoEnterSale).Name} instance.");
        }
        #endregion

        [Fact]
        public async Task GetServiceReviewsSummary_SendsQueryParams()
        {
            // Act
            await _sut.GetServiceReviewsSummary();

            // Assert
            _apiService.Verify(mock => mock.
                GetResponseContentAsync<FeefoReviewsSummaryRequest, FeefoReviewsSummaryResponse>(
                    It.Is<FeefoReviewsSummaryRequest>(match => match.QueryParams.Contains(_settings.ReviewsSummaryServiceQueryParams))), Times.Once);
        }

        [Fact]
        public async Task GetServiceReviews_SendsQueryParams()
        {
            // Arrange
            var request = new FeefoReviewsSearchRequest
            {
                Count = 10,
            };

            // Act
            await _sut.GetServiceReviews(request);

            // Assert
            _apiService.Verify(mock => mock.
                GetResponseContentAsync<FeefoDetailReviewsRequest, FeefoDetailReviewsServiceResponse>(
                    It.Is<FeefoDetailReviewsRequest>(match => match.QueryParams.Contains(_settings.ReviewsServiceQueryParams))), Times.Once);
        }
    }
}
