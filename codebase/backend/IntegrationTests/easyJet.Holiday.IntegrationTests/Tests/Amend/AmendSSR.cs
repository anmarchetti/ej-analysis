using Allure.Xunit.Attributes;
using Allure.XUnit.Attributes.Steps;
using easyJet.Holiday.IntegrationTests.Infrastructure.Repeat;
using easyJet.Holiday.IntegrationTests.Infrastructure.TestApi;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using FluentAssertions;
using Newtonsoft.Json;
using Refit;
using Xunit.Abstractions;

namespace easyJet.Holiday.IntegrationTests.Tests.Amend
{
    [AllureSuite("Amendment tests")]
    [AllureSubSuite("Amend special request")]
    [AllureOwner("CSS team")]
    public class AmendSSR : BaseTest
    {
        public AmendSSR(IHttpClientFactory _httpClientFactory, TestApiHttpClient testApiHttpClient, ITestOutputHelper testOutputHelper) :
            base(_httpClientFactory, testApiHttpClient, testOutputHelper)
        { }

        [Fact(DisplayName = "Amend ssr for random booking.")]
        [AllureDescription("Amend ssr for random booking.")]
        public async Task AmendSSR_RandomBooking_ChangeOnAvailableTransfer()
        {
            var specialRequests = await GetSepcialRequests();

            var (updatedBooking, selectedSpecialRequest) =
                await RepeatDecorator<(BookingResponse, string)>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContext = await CreateBookingStep();
                    CheckError(bookingContext);

                    //2. Login and get auth cookie
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                    //3. Get special request list from sitecore

                    string specialRequest = string.Empty;
                    if (specialRequests.SpecialRequestType.Any())
                    {
                        specialRequest = specialRequests.SpecialRequestType.First().SpecialRequests?.FirstOrDefault()?.Code ?? string.Empty;
                    }
                    //4. Add special request to the booking
                    return (await AmendSSRStep(bookingContext.Content.BookingResponse, specialRequest, loginCookie), specialRequest);
                });
            //Assert
            updatedBooking.SpecialRequests.Should().HaveCount(1);
            updatedBooking.SpecialRequests.First().Code.Should().Be(selectedSpecialRequest);
        }

        [Fact(DisplayName = "Amend ssr for random booking until we reach amendment limit set in cms.")]
        [AllureDescription("Amend ssr for random booking until we reach amendment limit set in cms.")]
        public async Task AmendSSR_RandomBooking_ChangeOverLimit_CatchErrorResponse()
        {
            var amendSettings = await GetAmendBookingSettingsStep();
            var specialRequestResponse = await GetSepcialRequests();

            var specialRequests = new Queue<SpecialRequest>(specialRequestResponse.SpecialRequestType.First().SpecialRequests);

            if (amendSettings.AmendSpecialRequestCount > specialRequests.Count())
            {
                throw new Exception("amendment limit is higher than number of available special requests");
            }

            var errorResponse =
                await RepeatDecorator<Dictionary<string, string>>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContext = await CreateBookingStep();
                    CheckError(bookingContext);

                    //2. Login and get auth cookie
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                    //3. make number of amendments equal sitecore setting
                    for (int i = 0; i < amendSettings.AmendSpecialRequestCount; i++)
                    {
                        var specialRequest = specialRequests.Dequeue().Code;

                        await AmendSSRStep(bookingContext.Content.BookingResponse, specialRequest, loginCookie);
                    }

                    //4. make additional amendment to produce error
                    var updatedBookingErrorResponse = await AmendSSRStepGetApiResponse(
                        bookingContext.Content.BookingResponse,
                        new List<string> { specialRequests.Dequeue().Code },
                        loginCookie);

                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(updatedBookingErrorResponse.Error.Content);
                });

            //Assert
            errorResponse.Should().NotBeNullOrEmpty();
            errorResponse["code"].Should().Be("API-ERR-230009");
        }

        [Fact(DisplayName = "Amend ssr for random booking throw error on contradictory groups when trying to add multiple of the same kind.")]
        [AllureDescription("Amend ssr for random booking throw error on contradictory groups when trying to add multiple of the same kind.")]
        public async Task AmendSSR_RandomBooking_AddTwoFromOneContradictoryGroup_CatchErrorResponse()
        {
            var specialRequestResponse = await GetSepcialRequests();
            var specialRequestContradictoryGroup = specialRequestResponse.SpecialRequestsContradictoryGroup.FirstOrDefault(x => x.SpecialRequests.Count > 1)
            ?? throw new Exception("Contradictory group with multiple ssrs does not exists");

            var specialContradictoryRequests = specialRequestContradictoryGroup.SpecialRequests.Select(x => x.Code).ToList();

            var errorResponse =
                await RepeatDecorator<Dictionary<string, string>>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContext = await CreateBookingStep();
                    CheckError(bookingContext);

                    //2. Login and get auth cookie
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                    //3. Try to amend with multiple codes of the same group
                    var updatedBookingErrorResponse = await AmendSSRStepGetApiResponse(bookingContext.Content.BookingResponse, specialContradictoryRequests, loginCookie);

                    //4. Parse response
                    return JsonConvert.DeserializeObject<Dictionary<string, string>>(updatedBookingErrorResponse.Error.Content);
                });

            //Assert
            errorResponse.Should().NotBeNullOrEmpty();
            errorResponse?["code"].Should().Be("API-ERR-300201");
        }

        [Fact(DisplayName = "Try to amend ssr with non existend special request.")]
        [AllureDescription("Try to amend ssr with non existend special request.")]
        public async Task AmendSSR_RandomBooking_AmendWithNonExistendSSR_CatchErrorResponse()
        {
            var updatedBookingErrorResponse =
                await RepeatDecorator<BookingResponse>
                .Create()
                .RepeatTimes(3)
                .Execute(async () =>
                {
                    //1. Create booking
                    var bookingContext = await CreateBookingStep();
                    CheckError(bookingContext);

                    //2. Login and get auth cookie
                    var loginCookie = await LoginAsAdminUserStep(bookingContext.Content.CustomerCredentials);

                    //3. Try to amend with non existend SSR
                    return await AmendSSRStep(bookingContext.Content.BookingResponse, "123456789", loginCookie);
                });

            //Assert
            updatedBookingErrorResponse.Should().NotBeNull();
            updatedBookingErrorResponse.SpecialRequests.Should().BeEmpty();
        }

        [AllureStep("Amend ssr option.")]
        private async Task<BookingResponse> AmendSSRStep(BookingResponse booking, string ssr, string loginCookie)
        {
            var amendBookingRequest = new AmendSsrRequest
            {
                BookingReference = booking.BookingReference,
                Date = booking.Package.Transport.Routes.FirstOrDefault(r => r.Direction == Direction.Outbound).DepDate.Value.UtcDateTime,
                LastName = booking.Guests.Single(x => x.IsLead).LastName,
                SpecialRequests = new List<string> { ssr }
            };

            var amendResponse = await amendBookingApi.AmendSSR(amendBookingRequest, loginCookie);

            CheckError(amendResponse);

            return amendResponse.Content;
        }

        [AllureStep("Amend ssr option, get api response with error.")]
        private async Task<ApiResponse<BookingResponse>> AmendSSRStepGetApiResponse(BookingResponse booking, List<string> ssr, string loginCookie)
        {
            var amendBookingRequest = new AmendSsrRequest
            {
                BookingReference = booking.BookingReference,
                Date = booking.Package.Transport.Routes.FirstOrDefault(r => r.Direction == Direction.Outbound).DepDate.Value.UtcDateTime,
                LastName = booking.Guests.Single(x => x.IsLead).LastName,
                SpecialRequests = ssr
            };

            var amendResponse = await amendBookingApi.AmendSSR(amendBookingRequest, loginCookie);

            return amendResponse;
        }

        [AllureStep("Load special request list from sitecore.")]
        private async Task<SpecialRequests> GetSepcialRequests()
        {
            var result = await sitecoreApi.GetSpecialRequests();

            CheckError(result);

            return result.Content;
        }

        [AllureStep("Load amend booking settings.")]
        private async Task<AmendBookingSetting> GetAmendBookingSettingsStep()
        {
            var result = await sitecoreApi.GetAmendBookingSettings();
            CheckError(result);
            return result.Content;
        }

        private static void CheckError(IApiResponse apiResponse)
        {
            if (apiResponse.Error is not null)
            {
                throw new Exception(apiResponse.Error.Message);
            }
        }
    }
}
