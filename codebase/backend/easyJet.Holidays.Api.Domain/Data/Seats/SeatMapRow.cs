namespace easyJet.Holidays.Api.Domain.Data.Seats
{
    public class SeatMapRow
    {
        public bool IsExitRow { get; set; }
        public int RowNumber { get; set; }
        public bool IsOverWing { get; set; }
        public string PriceBandName { get; set; }
        public List<SeatMapRowBlock> Blocks { get; set; }
    }
}
