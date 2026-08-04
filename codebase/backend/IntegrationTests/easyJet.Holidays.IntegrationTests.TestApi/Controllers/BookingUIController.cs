using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holidays.Api.Domain.Data.SharedServices.Vouchers;
using easyJet.Holidays.IntegrationTests.TestApi.Models;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Credit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace easyJet.Holidays.IntegrationTests.TestApi.Controllers
{
    public class BookingUIController(IBookingService bookingService, ICreditService creditService) : Controller
    {
        public IActionResult Index()
        {
            AddEnumsToViewbag();

            return View(new RandomBooking());
        }

        [HttpPost]
        public async Task<IActionResult> Index(RandomBooking randomBookingModel)
        {
            CustomerCredentials? customerCredentials = null;
            AgentCredentials? agentCredentials = null;
            var newUser = true;

            if (randomBookingModel.Email != null && randomBookingModel.Password != null)
            {
                newUser = false;
                customerCredentials = new Holiday.IntegrationTests.Shared.Models.Customers.CustomerCredentials()
                {
                    Email = randomBookingModel.Email,
                    Password = randomBookingModel.Password,
                    RememberMe = true,
                };
            }
            if (randomBookingModel is { AgentNumber: not null, AgentPassword: not null, ConsultantName: not null })
            {
                newUser = false;
                agentCredentials = new AgentCredentials()
                {
                    Number = randomBookingModel.AgentNumber, 
                    Password = randomBookingModel.AgentPassword, 
                    Ref = randomBookingModel.ConsultantName,
                };
            }
            else
            {
                if (randomBookingModel.AuthenticationMethod == AuthenticationMethod.TradePortal)
                {
                    if (string.IsNullOrEmpty(randomBookingModel.AgentNumber))
                    {
                        ModelState.AddModelError(nameof(randomBookingModel.AgentNumber), "Agent number is required.");
                    }
                    if (string.IsNullOrEmpty(randomBookingModel.AgentPassword))
                    {
                        ModelState.AddModelError(nameof(randomBookingModel.AgentPassword), "Agent password is required.");
                    }
                    if (string.IsNullOrEmpty(randomBookingModel.ConsultantName))
                    {
                        ModelState.AddModelError(nameof(randomBookingModel.ConsultantName), "Consultant name is required.");
                    }
                }
            }

            if (ModelState.IsValid)
            {
                var bookingRequest = new CreateBookingRequest()
                {
                    IsTradePortal = randomBookingModel.AuthenticationMethod == AuthenticationMethod.TradePortal,
                    BookingCreationParams =
                        new BookingCreationParams()
                        {
                            StartDate =
                                DateTime.UtcNow.AddDays(randomBookingModel.DaysBeforeDeparture)
                                    .ToString("yyyy-MM-dd"),
                            AdultsNumber = randomBookingModel.NumberOfAdults,
                            ChildrenNumber = randomBookingModel.NumberOfChildren,
                            InfantsNumber = randomBookingModel.NumberOfInfants,
                            Duration = randomBookingModel.Duration,
                            PriceFrom = randomBookingModel.MinPrice,
                            PriceTo = randomBookingModel.MaxPrice,
                            ContractType = randomBookingModel.ContractType,
                            FlightType = randomBookingModel.FlightType,
                            BookTheMostExpensiveFlight = randomBookingModel.BookTheMostExpensiveFlight,
                            BookTheMostExpensiveRoomAndBoard = randomBookingModel.BookTheMostExpensiveRoomAndBoard,
                            Promocode = randomBookingModel.Promocode,
                            PromoCollection = randomBookingModel.PromoCollection,
                        },
                    Payment = new Payment()
                    {
                        PaymentOption = randomBookingModel.PaymentOption,
                        PaymentCompletion = randomBookingModel.PaymentCompletion,
                        CashPercent = randomBookingModel.CashPercent,
                        RefundCreditPercent = randomBookingModel.RefundCreditPercent,
                        GiftCardCreditPercent = randomBookingModel.GiftCardCreditPercent,
                        GoodWillCreditPercent = randomBookingModel.GoodWillCreditPercent,
                        OneTimeCreditPercent = randomBookingModel.OneTimeCreditPercent,
                        ClearVouchers = randomBookingModel.ClearVouchers,
                    },
                    CustomerCredentials = customerCredentials,
                    NumberOfBookings = randomBookingModel.NumberOfBookings,
                    AgentCredentials = agentCredentials,
                    Language = randomBookingModel.Language
                };

                var bookingResponse = await bookingService.CreateRandomBooking(bookingRequest);

                var responveVm = CreateBookingResponseViewModel(bookingResponse, newUser);
                var responseJson =
                    JsonSerializer.Serialize(responveVm, new JsonSerializerOptions { WriteIndented = true });
                randomBookingModel.Booking = responseJson;
                randomBookingModel.Logs = JsonSerializer.Serialize(bookingResponse.Attempts,
                    new JsonSerializerOptions
                    {
                        WriteIndented = true,
                        DefaultIgnoreCondition =
                            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingDefault
                    });
            }

            AddEnumsToViewbag();

            return View(randomBookingModel);
        }

        private static object CreateBookingResponseViewModel(CreateBookingsResponse response, bool newUser)
        {
            return new BookingResponseViewModel
            {
                Bookings = response.Bookings.Select(booking => new BookingViewModel()
                {
                    BookingReference = booking.BookingReference,
                    Date = booking.Package.Accom.StartDate,
                    LastName = response.Customer.LastName,
                    Currency = booking.Currency.Code,
                }).ToList(),
                Email = response.Customer.Email,
                Password = newUser ? response.CustomerCredentials?.Password : string.Empty,
            };
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        private void AddEnumsToViewbag()
        {
            ViewBag.PaymentCompletion = ConvertEnumToSelectList<PaymentCompletion>();
            ViewBag.PaymentOption = ConvertEnumToSelectList<PaymentOption>();
            ViewBag.ContractTypes = ConvertEnumToSelectList<AccomContractTypeUI>();
            ViewBag.FlightTypes = ConvertEnumToSelectList<FlightType>();
            ViewBag.Languages = ConvertEnumToSelectList<Language>(new Dictionary<object, string>()
            {
                { Language.en, "en" },
                { Language.de_DE, "de-DE" },
                { Language.fr_CH, "fr-CH" },
                { Language.de_CH, "de-CH" },
                { Language.fr_FR, "fr-FR" }
            });
        }

        private static SelectList ConvertEnumToSelectList<T>(Dictionary<object, string>? valueMapper = null) where T : Enum
        {
            var enumValues = Enum.GetValues(typeof(T))
                .Cast<T>()
                .Select(e => new
                {
                    Value = valueMapper != null && valueMapper.TryGetValue(e, out string? value)? value: e.ToString(),
                    Text = e.GetType()
                            .GetMember(e.ToString())
                            .First()
                            .GetCustomAttribute<DisplayAttribute>()?.Name ?? e.ToString()
                })
                .ToList();

            var selectList = new SelectList(enumValues, "Value", "Text");
            return selectList;
        }
        
        public IActionResult Voucher()
        {
            return View(new Voucher());
        }

        [HttpPost]
        public async Task<IActionResult> Voucher(Voucher voucherModel)
        {
            ArgumentNullException.ThrowIfNull(voucherModel, nameof(voucherModel));

            CustomerCredentials? customerCredentials = null;
            if (voucherModel is { Email: not null, Password: not null })
            {
                customerCredentials = new CustomerCredentials()
                {
                    Email = voucherModel.Email, Password = voucherModel.Password, RememberMe = true,
                };
            }

            Dictionary<string, object> voucherMetaData = new Dictionary<string, object>()
            {
                {"market", voucherModel.MarketCode}
            };
            foreach (var metadataRow in voucherModel.MetaData.Split(new List<string>() { ";" }.ToArray(),
                         StringSplitOptions.RemoveEmptyEntries))
            {
                var metaDataContent = metadataRow.Split(new List<string>() { ";" }.ToArray(),
                    StringSplitOptions.RemoveEmptyEntries);
                if (metaDataContent.Length != 2)
                {
                    continue;
                }

                voucherMetaData.Add(metaDataContent[0].Trim(), metaDataContent[1].Trim());
            }

            var voucherRequest = new CreateAndPublishVoucherRequest()
            {
                Currency = voucherModel.Currency,
                Amount = voucherModel.Amount,
                Source = VoucherSource.Web,
                MetaData = voucherMetaData,
                ReasonCode = voucherModel.ReasonCode,
                VoucherId = Guid.NewGuid().ToString(),
            };

            var voucherResponse = await creditService.AddCredit(customerCredentials, voucherRequest);

            voucherModel.Vouchers = JsonSerializer.Serialize(voucherResponse, new JsonSerializerOptions { WriteIndented = true });

            return View(voucherModel);
        }
    }
}
