namespace easyJet.Holidays.Api.Domain.Data.Seats
{
    public class SeatMapSeat
    {
        public bool IsWindowSeat { get; set; }

        public bool IsAisleSeat { get; set; }

        public bool IsExitRow { get; set; }

        public bool IsAvailable { get; set; }

        public bool IsMiddleSeat { get; set; }

        public bool IsAvailableForInfant { get; set; }

        public bool IsAvailableForChild { get; set; }

        public bool IsBulkheadSeat { get; set; }

        public bool IsOccupiedByInfant { get; set; }

        public decimal Price { get; set; }

        public string Currency { get; set; }

        public decimal PriceWithCreditCardFee { get; set; }

        public string SeatAccess { get; set; }

        public string Number { get; set; }

        public string PriceBand { get; set; }

        public int PriceBandId { get; set; }

        public bool IsPremiumSeat { get; set; }

        public int ChargeCodeId { get; set; }

        public List<Product> Products { get; set; }
    }
}
