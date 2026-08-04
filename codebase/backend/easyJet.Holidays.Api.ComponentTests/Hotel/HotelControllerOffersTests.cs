using AutoFixture.Xunit3;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Hotel
{
    /// <summary>
    /// Component tests for <see cref="HotelController"/>
    /// </summary>
    public class HotelControllerOffersTests : BaseComponentTest
    {
        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2020-07-10&duration=7&departure=LGW,LTN,SEN,STN&room[0].adults=1&room[0].children=0&room[0].infants=1&room[0].roomCode=1BA01&room[1].adults=2&room[1].children=1&room[1].infants=0&room[1].roomCode=1BA01&accommodationId=ESMJ0005&outboundRouteId=171396/3117&inboundRouteId=173043/3342&packageId=229154/2/920/7&boardType=AI")]
        public async Task Offers_MultipleRoomsAndDIfferentNumberOfOffersInResponse_AggregateData(string queryString)
        {
            ApplyManyConfigurationFields(
                new KeyValuePair<string, string>[]
                {
                    new("Cache:BackgroundRefreshDisabled", "false"),
                    new("EnvironmentBehaviour:PreloadReferenceDataOnStart", "true")
                });

            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_ESMJ0005_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("flexibleDays=3&duration=7&room[0].adults=3&room[0].infants=0&startDate=3020-05-02&departure=LTN&room[0].children=0&room[0].roomCode=1BA01&accommodationId=GRCR0001&outboundRouteId=2150961804/78677&inboundRouteId=2150962090/78678&packageId=2151225593/2/852/7&boardType=SC&transfer=GRCR0001HERP")]
        public async Task Offers_WithNonDefaultTransfer_ShouldSendInfoBookingRequestAndMap(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_GRCR0001_nondefaulttransfer_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("flexibleDays=3&duration=7&room[0].adults=3&room[0].infants=0&startDate=2020-05-02&departure=LTN&room[0].children=0&room[0].roomCode=1BA01&accommodationId=GRCR0001&outboundRouteId=2150961804/78677&inboundRouteId=2150962090/78678&packageId=2151225593/2/852/7&boardType=SC&transfer=GRCR0001HERS")]
        public async Task Offers_DefaultTransfer_ShouldNotSendInfoBookingRequestAndMap(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_GRCR0001_defaulttransfer_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("flexibleDays=3&duration=7&room[0].adults=3&room[0].infants=0&startDate=2020-05-02&departure=LTN&room[0].children=0&room[0].roomCode=1BA01&accommodationId=GRCR0001&outboundRouteId=2150961804/78677&inboundRouteId=2150962090/78678&packageId=2151225593/2/852/7&boardType=SC")]
        public async Task Offers_NoTransfer_ShouldNotSendInfoBookingRequestAndMap(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_GRCR0001_notransfer_response.json");
        }


        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2020-05-06&duration=7&departure=LGW&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=DBT.ST-2!NOR.CG-PACKAGEHB&room[1].adults=1&room[1].roomCode=INVALID&room[1].children=1&accommodationId=X9065039&outboundRouteId=Ef5240b19d965709839acc3e3f1921a2e&inboundRouteId=E3f4279eb4054fb06f453a9c6d4456590&packageId=2151481234/2/856/7&boardType=HB&isExt=true&childAges=7")]
        public async Task Offers_ExternalAccomodationTwoRoomsInvalidRoomCode_NoResults(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_X9065039_invalid_roomcode_response.json");
        }

        //!!Based on mocks, should be updated when real data gets available
        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2023-06-23&flexibleDays=0&duration=15&departure=SEN,LGW,STN,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=TW01&room[1].adults=2&room[1].children=0&room[1].infants=0&room[1].roomCode=TW01&accommodationId=YGRCF0044&outboundRouteId=Ec0f6e86b0e8219209d29f3cfb0bb2299&inboundRouteId=Ec1561c30137c413af2f2df0edbf20f7e&packageId=2154857380/2/1450/26&boardType=BB&transfer=GEMT002948SS&geography=GR,GRCF&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21")]
        public async Task Offers_DynamicInventoryTwoRoomsTwoContract_MergedOffers(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_YGRCF0044_di_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2023-06-23&flexibleDays=0&duration=15&departure=SEN,LGW,STN,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=TW01&room[1].adults=2&room[1].children=0&room[1].infants=0&room[1].roomCode=TW01&accommodationId=YGRCF0055&outboundRouteId=Ec0f6e86b0e8219209d29f3cfb0bb2299&inboundRouteId=Ec1561c30137c413af2f2df0edbf20f7e&packageId=2154857380/2/1450/26&boardType=BB&transfer=GEMT002948SS&geography=GR,GRCF&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&&lug=")]
        public async Task Offers_WithInternalFlightAndCityBreakProm_ShouldEnrichOffersWithBeachComplimentary(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_YGRCF0055_di_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2023-06-23&flexibleDays=0&duration=15&departure=SEN,LGW,STN,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=TW01&room[1].adults=2&room[1].children=0&room[1].infants=0&room[1].roomCode=TW01&accommodationId=YGRCF0044&outboundRouteId=Ec0f6e86b0e8219209d29f3cfb0bb2299&inboundRouteId=Ec1561c30137c413af2f2df0edbf20f7e&packageId=2154857380/2/1450/26&boardType=BB&transfer=GEMT002948SS&geography=GR,GRCF&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&&lug=LUG-5|bike-1")]
        public async Task Offers_WithAdultsLuggageOnly_ShouldEnrichOffers(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_YGRCF0044_with_adult_luggage_response.json");
        }

        [Trait("Api", "/api/v1.0/hotel/offers")]
        [Trait("Category", "Component")]
        [Theory]
        [InlineAutoData("startDate=2023-06-23&flexibleDays=0&duration=15&departure=SEN,LGW,STN,LTN&room[0].adults=2&room[0].children=0&room[0].infants=0&room[0].roomCode=TW01&room[1].adults=2&room[1].children=0&room[1].infants=0&room[1].roomCode=TW01&accommodationId=YGRCF0044&outboundRouteId=Ec0f6e86b0e8219209d29f3cfb0bb2299&inboundRouteId=Ec1561c30137c413af2f2df0edbf20f7e&packageId=2154857380/2/1450/26&boardType=BB&transfer=GEMT002948SS&geography=GR,GRCF&altAcc[0].accId=GRCF0044&altAcc[0].packId=2154857381/2/1950/21&lcbIn=1|2&lcbOut=1|2")]
        public async Task Offers_WithLCBOnly_ShouldEnrichOffers(string queryString)
        {
            await Client.GetAndValidate(
                $"/api/v1.0/hotel/offers?{queryString}",
                "__admin", "files", "WebApi", "hotel-offers", "hotel_offers_for_YGRCF0044_with_LCB_response.json");
        }
    }
}
