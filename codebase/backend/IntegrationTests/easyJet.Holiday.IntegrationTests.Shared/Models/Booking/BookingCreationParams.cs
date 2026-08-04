using easyJet.Holiday.IntegrationTests.Shared.Constants;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holiday.IntegrationTests.Shared.Models.Booking;

public class BookingCreationParams
{
    public string StartDate { get; set; }

    public int Duration { get; set; }

    public string Departure { get; set; }

    public int PriceFrom { get; set; }

    public int PriceTo { get; set; }

    public string Geography { get; set; }

    public string Destinations { get; set; }

    public string SearchType { get; set; }

    public string Theme { get; set; }

    public bool IsDeposit { get; set; }

    public bool IsCanceled { get; set; }

    public bool IsCredited { get; set; }

    public CreditsOnlyPaymentParams CreditsOnlyPaymentParams { get; set; }

    public int AdultsNumber { get; set; } = GuestsConstants.DefaultNumberOfAdults;

    public int ChildrenNumber { get; set; }

    public int InfantsNumber { get; set; }

    public bool BookSeatsForAllNonInfants { get; set; }

    public string? SeatsPriceBand { get; set; }

    public string? Promocode { get; set; }

    public bool BookTheMostExpensiveFlight { get; set; }

    public bool BookTheMostExpensiveRoomAndBoard { get; set; }

    public AccomContractTypeUI ContractType { get; set; }

    public FlightType FlightType { get; set; }

    public int PayingCustomersCount => AdultsNumber + ChildrenNumber;
    
    public string? PromoCollection { get; set; }
}

public class CreditsOnlyPaymentParams
{
    public string Currency { get; set; }
}

public class Payment
{
    public PaymentCompletion PaymentCompletion { get; set; }
    public PaymentOption PaymentOption { get; set; }

    public decimal? CashPercent { get; set; }
    public decimal? OneTimeCreditPercent { get; set; }
    public decimal? GoodWillCreditPercent { get; set; }
    public decimal? RefundCreditPercent { get; set; }
    public decimal? GiftCardCreditPercent { get; set; }
    public bool ClearVouchers { get; set; } = true;
}

public enum PaymentOption
{
    CARD,
    CREDIT,
    [Display(Name = "CARD AND CREDIT")] CARD_AND_CREDIT,
    CUSTOM
}

public enum PaymentCompletion
{
    [Display(Name = "FULLY PAID")] FULLY_PAID,
    DEPOSIT
}

public enum FlightType
{
    Any, Internal, External
}

public enum AccomContractTypeUI
{
    Any, Direct, HotelBeds
}

public enum Language
{
    [Display(Name = "United Kingdom")]
    en,
    [Display(Name = "Deutschland")]
    de_DE,
    [Display(Name = "Suisse")]
    fr_CH,
    [Display(Name = "Schweiz")]
    de_CH,
    [Display(Name = "France")]
    fr_FR
}