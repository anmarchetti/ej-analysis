using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.External.Atcom.Models.Internal;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;
using InfoModifyBookingRequest = easyJet.Holidays.External.Atcom.Models.Internal.InfoModifyBookingRequest.InfoModifyBookingRequest;
using InfoModifyBookingResponse = easyJet.Holidays.External.Atcom.Models.ModifyBooking.InfoModifyBookingResponse;
using ModifyBookingRequest = easyJet.Holidays.External.Atcom.Models.Internal.ModifyBookingRequest.ModifyBookingRequest;
using Pax = easyJet.Holidays.Api.Domain.Data.AmendBooking.Pax;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    public class ModifyBookingMapper : IModifyBookingMapper
    {
        private readonly RequestBookingMapper _requestBookingMapper;
        private readonly PriceMapper _priceMapper;

        public ModifyBookingMapper(RequestBookingMapper requestBookingMapper, PriceMapper priceMapper)
        {
            _requestBookingMapper = requestBookingMapper;
            _priceMapper = priceMapper;
        }

        public static AmendmentsInfo Map(Amendments amendments)
        {
            if (amendments == null)
            {
                return new AmendmentsInfo()
                {
                    RoomAndBoard = false,
                    Booking = false,
                    Route = false,
                    Seats = false,
                    Pax = new Pax()
                    {
                        AmendAllow = false,
                        AmendNameOnly = false,
                    },
                    Memo = false,
                    Transfer = new AmendItem()
                    {
                        AmendAllow = false,
                        DowngradeAllow = false
                    },
                    SpecialRequest = true
                };
            }

            var amendmentsInfo = new AmendmentsInfo()
            {
                RoomAndBoard = amendments.Accom.Amend,
                Booking = amendments.Bkg.Amend,
                Route = amendments.Route.Amend,
                Pax = new Pax()
                {
                    AmendAllow = amendments.Pax.Amend,
                    AmendNameOnly = amendments.Pax.Amend_Name_Only
                },
                Memo = amendments.Memo.Amend,
                SpecialRequest = true,
                Seats = true,
                ChangeDates = true, //TODO: implement normal mapping when Atcom add change date in section.
                Accom = amendments.Accom.Amend
            };

            var transfer = amendments.Items.FirstOrDefault(item => item.Item_Type == Amend_Item_Type.TRF);

            if (transfer != null)
            {
                amendmentsInfo.Transfer.AmendAllow = transfer.Amend;
                amendmentsInfo.Transfer.DowngradeAllow = transfer.Downgrade_Allow;
            }

            return amendmentsInfo;
        }

        /// <inheritdoc />
        public InfoModifyBookingRequest BuildInfoModifyBookingRequest(BookingResponse response, bool sendExtraFlightInformationForInternalFlights = false)
        {
            
            var atcomBaseRequest = _requestBookingMapper.BuildAtcomBookingBaseRequest(
                response.Package.Accom,
                response.Package.Transport,
                response.Guests,
                response.Transfers,
                response.LateRoomCheckout,
                response.ExtraLuggageInfo,
                response.SeatSelection, 
                response.AirportParking,
                sendExtraFlightInformationForInternalFlights,
                response.PromotionCollections);
            
            // Validate if at least one flight is external (all flights should be the same)
            var withExternalFlights = response.Package.Transport.Routes[0].IsExternal;

            var infoModifyBookingRequest = new InfoModifyBookingRequest()
            {
                BkgNum = new BkgNum() { BkgId = response.BookingReference },
                Adm = atcomBaseRequest.Adm,
                CltInfo = atcomBaseRequest.CltInfo,
                Inc_AutoSelectedItems = withExternalFlights,   // "true" if there are ext flights
                BkgSts = atcomBaseRequest.BkgSts,
                BkgStsSpecified = atcomBaseRequest.BkgStsSpecified,
                Bkg_Ent = atcomBaseRequest.Bkg_Ent,
                Pax = atcomBaseRequest.Pax,
                Disc_Code = response.AmendmentInfo?.PromoCode
            };

            return infoModifyBookingRequest;
        }

        public async Task<ValidateAmendBookingResponse> Map(InfoModifyBookingResponse bookingInfoResponse, PriceBreakdownResponse priceBreakdownResponse, List<Benefit> benefitsContentData, bool isLoggedInAsTradeAgent)
        {
            if (bookingInfoResponse == null) throw new ArgumentNullException(nameof(bookingInfoResponse));

            var body = bookingInfoResponse.Payload.Body;

            // here potentially we will include more info into validate-package response if required
            var package = await _requestBookingMapper.MapResponse(body, priceBreakdownResponse, benefitsContentData);

            return new ValidateAmendBookingResponse
            {
                SessionId = body.Adm.SessId,
                RequestId = body.Adm.ReqId,
                ResultStatus = body.ResSts.ToString(),
                DiscountCode = package.DiscountCode,
                Accom = package.Package?.Accom,
                Duration = package.Package?.Accom?.CalculateDuration() ?? 0,

                BookingDate = package.BookingDate,
                BookingReference = body.BkgNum?.BkgId,
                Memos = package.Package?.Accom?.Memos,

                TradeAgentPriceBreakdown = isLoggedInAsTradeAgent ? package.TradeAgentPriceBreakdown : null,
                PriceBreakdown = package.PriceBreakdown,
                TaxesAndFees =
                [
                    .. _priceMapper.MapTaxesAndFees(
                        body.Bkg_Ent?.Package?
                            .SelectMany(p => p.Items?.OfType<Models.Internal.Accom>() ?? [])
                            .SelectMany(a => a.Rm_Cd ?? [])
                            .ToArray()
                        ?? [])
                ],
                PaymentInfo = package.PaymentInfo,
                ExtraLuggageInfo = package.ExtraLuggageInfo,
                Transfers = package.Transfers,
                Transport = package.Package?.Transport,
                Guests = package.Guests,
                LeadPassenger = package.LeadPassenger,
                SeatSelection = package.SeatSelection,
                ApiErrors = bookingInfoResponse.ApiErrors,
                Currency = package.Currency
            };
        }

        /// <summary>
        /// Build modify booking request 
        /// </summary>
        /// <param name="cltInfo"></param>
        /// <param name="bookingReference"></param>
        /// <param name="sessionId"></param>
        /// <param name="requestId"></param>
        /// <returns></returns>
        public static Models.ModifyBooking.ModifyBookingRequest BuildModifyBookingRequest(CltInfo cltInfo,
            string bookingReference,
            string sessionId,
            string requestId)
        {
            var modifyBookingRequestBody = new ModifyBookingRequest()
            {
                Adm = RequestBookingMapper.BuildAdmProperty(),
                CltInfo = cltInfo,
                BkgNum = new BkgNum()
                {
                    BkgId = bookingReference
                }
            };

            modifyBookingRequestBody.Adm.SessId = sessionId;

            modifyBookingRequestBody.Adm.ReqId = requestId;

            var modifyBookingRequest = new Models.ModifyBooking.ModifyBookingRequest
            {
                Payload = { Body = modifyBookingRequestBody }
            };

            return modifyBookingRequest;
        }
    }
}