using easyJet.Holidays.Api.Domain.Data.Booking;
using System.Text.RegularExpressions;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking;

public class AmendPaxHistory
{
    private const string regxPattern = @"pax_(?<index>\d{1,})[\s | =]{1,}(?<wasChanged>yes|no)";

    public List<AmendPaxHistoryItem> AmendPaxHistoryItems { get; } = new List<AmendPaxHistoryItem>();

    public AmendPaxHistory(IEnumerable<Memo> paxMemo)
    {
        if (paxMemo != null && paxMemo.Any())
        {
            var options = RegexOptions.Compiled | RegexOptions.IgnoreCase;
            var reg = new Regex(regxPattern, options);

            foreach (var memo in paxMemo)
            {
                reg.Matches(memo.Text).ToList().ForEach(match => AmendPaxHistoryItems.Add(MatMatchToAmendPaxHistoryItem(match)));
            }
        }
    }

    private AmendPaxHistoryItem MatMatchToAmendPaxHistoryItem(Match match)
    {
        var result = new AmendPaxHistoryItem
        {
            Index = match.Groups["index"].Value,
            PaxNameChanged = Enum.Parse<AmendPaxCondition>(match.Groups["wasChanged"].Value)
        };

        return result;
    }
}