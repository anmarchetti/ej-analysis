namespace easyJet.Holidays.Api.Domain.Data.AmendBooking.Dates;
public class AmendDateInfoResponse
{
    public bool AvailableHoliday { get; set; }
    public IEnumerable<AmendDate> AmendDates { get; set; }
}

public class AmendDate
{
    public string Date { get; set; }

    public bool IsAvailable { get; set; }
}