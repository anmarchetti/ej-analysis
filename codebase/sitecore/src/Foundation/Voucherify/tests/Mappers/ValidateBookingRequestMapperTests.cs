using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentSearch.Repositories;
using easyJet.Foundation.Destinations.ContentSearch.SearchTypes;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Voucherify.Logging;
using easyJet.Foundation.Voucherify.Mappers;
using easyJet.Foundation.Voucherify.Models.Requests;
using FluentAssertions;
using NSubstitute;
using Sitecore.ContentSearch.Linq;
using Xunit;

namespace easyJet.Foundation.Voucherify.Tests.Mappers
{
    public class ValidateBookingRequestMapperTests
    {
        private readonly IDestinationsRepository destinationsRepository;
        private readonly ValidateBookingRequestMapper validateBookingRequestMapper;
        private readonly IVoucherifyLogger logger;

        public ValidateBookingRequestMapperTests()
        {
            destinationsRepository = Substitute.For<IDestinationsRepository>();
            logger = Substitute.For<IVoucherifyLogger>();
            validateBookingRequestMapper = new ValidateBookingRequestMapper(destinationsRepository, logger);
        }

        [Theory]
        [AutoDbData]
        public void MapFromValidateBookingRequest_ShouldReturnValidateBooking(ValidateBookingRequest[] requests)
        {
            // Arrange
            var hints = new List<SearchHit<HotelSearchResultItem>>()
            {
                {
                    new SearchHit<HotelSearchResultItem>(1, new HotelSearchResultItem()
                    {
                        HotelCountry = "{\"Code\":\"ESTFGS\",\"Name\":\"Golf Del Sur\",\"Type\":null}",
                        HotelLocation = "{\"Code\":\"ESTFGS\",\"Name\":\"Golf Del Sur\",\"Type\":null}",
                        HotelResort = "{\"Code\":\"ESTFGS\",\"Name\":\"Golf Del Sur\",\"Type\":null}",
                        SourceCodes = new[] { "ESTFGS001" },
                        Code = "784738"
                    })
                }
            };

            var results = new SearchResults<HotelSearchResultItem>(hints, 1);

            destinationsRepository.SearchHotelsByCodes(Arg.Any<string[]>()).Returns(results);

            // Act
            var actual = validateBookingRequestMapper.MapFromValidateBookingRequest(requests);

            // Assert
            actual.Should().NotBeEmpty();
        }
    }
}
