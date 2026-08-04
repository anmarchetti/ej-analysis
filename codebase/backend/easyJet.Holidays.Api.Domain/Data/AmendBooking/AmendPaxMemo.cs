namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    public class AmendPaxHistoryItem
    {
        public string Index { get; set; }

        public AmendPaxCondition PaxNameChanged { get; set; }

        public override string ToString()
        {
            return $"Pax_{Index} = {PaxNameChanged.ToString()}";
        }
    }
}