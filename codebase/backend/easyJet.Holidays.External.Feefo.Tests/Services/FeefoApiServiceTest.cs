using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.Feefo;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Feefo.Models.Review;
using easyJet.Holidays.External.Feefo.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Xunit;

namespace easyJet.Holidays.External.Feefo.Tests.Services
{
    public class FeefoApiServiceTest
    {
        private readonly IFixture _fixture;
        private FeefoService FeefoService { get; }

        private const string FeefoMerchantIdentifier = "test-easyjet-holidays";

        private FeefoApiSettings _feefoApiSettings = new FeefoApiSettings()
        {
            MerchantIdentifier = FeefoMerchantIdentifier,
            ClientId = "KfWQXd04whDFSZFA5CS6qi7Glv7gNFLr",
            ClientSecret = "dg904SG21o7rY6gzqCIALgKClF84A6T3",
            EndPointAuthentication = "https://api.feefo.com/api/oauth/v2/token",
            EndPointEnterSaleRemotely = "https://api.feefo.com/api/20/entersaleremotely",
            EndPointReviewsService = "https://api.feefo.com/api/20/reviews/service",
            EndPointReviewsSummaryService = "https://api.feefo.com/api/20/reviews/summary/service"
        };

        public FeefoApiServiceTest()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            FeefoService = new FeefoService(null, null, _fixture.Freeze<ILogger<FeefoService>>());
        }

        [Fact]
        public void SlitIntoBuckets_BucketsContainsElements()
        {
            var data = FeefoService.SplitIntoBuckets(563, 100);
            data.Should().HaveCount(6, "Because 5 x 100 and 1 x 63");
            data.Should().HaveElementAt(5, 63, "Because last element needs to be 63");
        }

        [Theory]
        [MemberData(nameof(ConvertPeriodData))]
        public void ConvertPeriod_CheckDay(FeefoRequestPeriod requestPeriod, string expectedValue)
        {
            var data = FeefoService.ConvertPeriod(requestPeriod);
            data.Should().Be(expectedValue);
        }

        public static IEnumerable<object[]> ConvertPeriodData()
        {
            return new List<object[]>()
            {
                new object[] { FeefoRequestPeriod.Day, "24_hours" },
                new object[] { FeefoRequestPeriod.Week, "week" },
                new object[] { FeefoRequestPeriod.Month, "month"},
                new object[] { FeefoRequestPeriod.Year, "year"},
                new object[] { FeefoRequestPeriod.All, "all"}
            };
        }

        [Fact]
        public void ConvertSort_CheckUpdatedDate()
        {
            var data = FeefoService.ConvertSort(FeefoRequestSort.UpdatedDate);
            data.Should().Be("updated_date", "Because enum is UpdatedDate");
        }

        [Fact]
        public void PopulateFIlterData_ContainsAllFilter()
        {
            var feefoReviewsSearchRequest = new FeefoReviewsSearchRequest()
            {
                TagDate = new DateTime(2022, 02, 01),
                TagNumberOfPassengers = 1,
            };

            feefoReviewsSearchRequest.CreatedDateTime = new DateTime(2022, 02, 01);
            feefoReviewsSearchRequest.UpdatedDateTime = new DateTime(2022, 03, 01);
            feefoReviewsSearchRequest.UpdatedSince = FeefoRequestPeriod.Day;
            feefoReviewsSearchRequest.Sort = FeefoRequestSort.UpdatedDate;
            feefoReviewsSearchRequest.Rating = new List<int>() { 1, 2 };

            var feefoDetailReviewsRequest = new FeefoDetailReviewsRequest();

            // Act
            FeefoService.PopulateFilterData(feefoReviewsSearchRequest, feefoDetailReviewsRequest);

            feefoDetailReviewsRequest.DateTime.Should().Be("2022-02-01");
            feefoDetailReviewsRequest.UpdatedDateTime.Should().Be("2022-03-01");
            feefoDetailReviewsRequest.SinceUpdatedPeriod.Should().Be("24_hours");
            feefoDetailReviewsRequest.Sort.Should().Be("updated_date");
            feefoDetailReviewsRequest.Tags.Should().Be("numberofpassengers:1,date:01-02-2022");
            feefoDetailReviewsRequest.Rating.Should().Be("1,2");
        }

        [Fact]
        public void GetSearchTags_ContainsAllTagIdentifiers()
        {
            // Arrange
            var tagCategory = "testTagCategory";
            var tagDestinationCountry = "testTagDestinationCountry";
            var tagDestinationRegion = "testTagDestinationRegion";
            var tagHotel = "testTagHotel";
            var tagPackageType = "testTagPackageType";
            var tagResort = "testTagResort";


            var feefoReviewsSearchRequest = new FeefoReviewsSearchRequest()
            {
                TagCategory = tagCategory,
                TagDate = new DateTime(2022, 02, 01),
                TagDestinationCountry = tagDestinationCountry,
                TagDestinationRegion = tagDestinationRegion,
                TagHotel = tagHotel,
                TagNumberOfPassengers = 1,
                TagPackageType = tagPackageType,
                TagResort = tagResort,
            };

            // Act
            var data = FeefoService.GetSearchTags(feefoReviewsSearchRequest);

            // Assert
            data.Should().ContainAll(new string[] { tagCategory, "01-02-2022", tagDestinationCountry, tagDestinationRegion, tagHotel, "1", tagPackageType, tagResort }, "because all tag values were provided.");
        }
    }
}
