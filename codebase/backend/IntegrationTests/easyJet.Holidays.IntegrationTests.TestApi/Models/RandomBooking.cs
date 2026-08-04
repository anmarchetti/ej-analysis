using easyJet.Holiday.IntegrationTests.Shared.Constants;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.IntegrationTests.TestApi.Models
{
    public class RandomBooking
    {
        public int DaysBeforeDeparture { get; set; } = 60;
        public string? Email { get; set; }
        public string? Password { get; set; }
        public int NumberOfAdults { get; set; } = GuestsConstants.DefaultNumberOfAdults;
        public int NumberOfChildren { get; set; } = 0;
        public int NumberOfInfants { get; set; } = 0;
        public int Duration { get; set; } = 10;
        public int MinPrice { get; set; } = 0;
        public int MaxPrice { get; set; } = 9999;
        public string? Promocode { get; set; }
        public string? PromoCollection { get; set; }
        public string Language { get; set; } = "en";
        public PaymentCompletion PaymentCompletion { get; set; } = PaymentCompletion.FULLY_PAID;
        public PaymentOption PaymentOption { get; set; } = PaymentOption.CARD;
        public AccomContractTypeUI ContractType { get; set; }
        public FlightType FlightType { get; set; }

        [Display(Name = "Book the most expensive flight")]
        public bool BookTheMostExpensiveFlight { get; set; }

        [Display(Name = "Book the most expensive room and board")]
        public bool BookTheMostExpensiveRoomAndBoard { get; set; }

        public string? Booking { get; set; }
        public string? Logs { get; set; }
        public int NumberOfBookings { get; set; } = 1;

        public decimal? CashPercent { get; set; }
        public decimal? OneTimeCreditPercent { get; set; }
        public decimal? GoodWillCreditPercent { get; set; }
        public decimal? RefundCreditPercent { get; set; }
        public decimal? GiftCardCreditPercent { get; set; }
        public bool ClearVouchers { get; set; } = true;
        
        public AuthenticationMethod AuthenticationMethod { get; set; } = AuthenticationMethod.GenerateRandomUser;

        public string? AgentNumber { get; set; } = "12346";
        public string? AgentPassword { get; set; } = "1122";
        public string? ConsultantName { get; set; } = "test";
    }
    
    public enum AuthenticationMethod
    {
        GenerateRandomUser,
        UseExistingUser,
        TradePortal
    } 
}
