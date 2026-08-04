using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.LivePrice;
using easyJet.Holidays.Api.Domain.Data.Payment;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.External.Cms.Mappers;
using easyJet.Holidays.External.Cms.Models.Promotion;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Xunit;
using Offer = easyJet.Holidays.Api.Domain.Data.PackageOffers.Offer;

namespace easyJet.Holidays.External.Cms.Tests.Mappers
{
    public class ValidatePromotionBaseMapperTests
    {
        [Theory]
        [AutoMoqData]
        public void BuildValidatePromotionBaseFromOffer_ValidInput_ReturnsValidOutput(Offer offer)
        {
            var res = ValidatePromotionBaseMapper.BuildValidatePromotionBaseFromOffer(offer);
            AssertNotNull(res);
        }

        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItem_ValidInput_ReturnsValidOutput(Offer offer)
        {
            offer.PriceExcludingTouristTax = 100;
            offer.PricePPExcludingTouristTax = 50;

            offer.SeatSelection = new List<SeatMap>
            {
                new SeatMap
                {
                    Seats = new List<Seat>
                    {
                        new Seat
                        {
                            Price = 50
                        }
                    }
                }
            };
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItem(offer, new PromoCodeSettings());
            AssertNotNull(res);
            res.Price.Should().Be(50);
        }

        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItemFromLivePriceSummaryModel_ValidInput_ReturnsValidOutput(LivePriceSummaryModel livePrice)
        {
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItemFromLivePriceSummaryModel(livePrice);
            AssertNotNull(res);
        }

        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItemWithAdditionalData_ValidInput_ReturnsValidOutput(Offer offer, PromoCodeSettings promoCodeSettings, string customerPromoCode, string market)
        {
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItem(offer, promoCodeSettings, customerPromoCode, market);
            AssertNotNull(res);
        }

        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItemShouldHaveSumOfPeople_ValidInput_ReturnsValidOutput(Offer offer, PromoCodeSettings promoCodeSettings, string customerPromoCode, string market)
        {
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItem(offer, promoCodeSettings, customerPromoCode, market);
            AssertNotNull(res);
            res.NAdults.Should().Be(offer.Accom.Unit.Sum(x => x.Occupation.Adults));
            res.NChildren.Should().Be(offer.Accom.Unit.Sum(x => x.Occupation.Children));
            res.NInfants.Should().Be(offer.Accom.Unit.Sum(x => x.Occupation.Infants));
        }
        
        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItemFromValidatePackageRequest_ValidInput_ReturnsValidOutput(ValidateBookingRequest request, PriceInfo info)
        {
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItemFromValidatePackageRequest(request, info);
            AssertNotNull(res);
        }
        
        [Fact]
        public void BuildBaseRequestItemFromValidatePackageRequest_NullInput_ReturnsValidOutput()
        {
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItemFromValidatePackageRequest(null, null);
            res.Should().NotBeNull();
        }
        
        [Theory]
        [AutoMoqData]
        public void BuildBaseRequestItemFromValidatePackageRequest_AccomNullInput_ReturnsValidOutput(ValidateBookingRequest request, PriceInfo info)
        {
            request.Offer = null;
            var res = ValidatePromotionBaseMapper.BuildBaseRequestItemFromValidatePackageRequest(request, info);
            res.Should().NotBeNull();
        }

        private static void AssertNotNull(ValidatePromotionBase res)
        {
            res.Airport.Should().NotBeNull();
            res.DepartureDate.Should().NotBeNull();
            res.ReturnDate.Should().NotBeNull();
            res.Duration.Should().NotBeNull();
            res.Price.Should().NotBe(0);
            res.PricePP.Should().NotBe(0);
            res.HolidayTheme.Should().NotBeNull();
            res.HolidayType.Should().NotBeNull();
            res.NAdults.Should().NotBeNull();
            res.NChildren.Should().NotBeNull();
            res.BookingDate.Should().NotBeNull();
            res.NInfants.Should().NotBeNull();
        }
    }
}