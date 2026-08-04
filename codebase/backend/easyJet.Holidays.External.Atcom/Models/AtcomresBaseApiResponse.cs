using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Text;

namespace easyJet.Holidays.External.Atcom.Models;

public class AtcomresBaseApiResponse<T> : XmlApiResponse<T> where T : Internal.AtcomresBaseResponse
{
    public override ApiError[] ApiErrors => GetMessages(Internal.Ser_MsgSeverity.ERROR);

    public override ApiError[] ApiWarnings => GetMessages(Internal.Ser_MsgSeverity.WARN);

    private ApiError[] GetMessages(Internal.Ser_MsgSeverity severity)
    {
        return Payload?.Body?.Adm?.Ser_Msg?.Where(x => x != null && x.Severity != null && x.Severity == severity).Select(x =>
        {
            var formattedError = new StringBuilder(x.Desc);

            if (x.KeyValuePair != null)
            {
                foreach (var k in x.KeyValuePair)
                {
                    formattedError.Replace($"{{{k.Key}}}", k.Value);
                }
            }

            return new ApiError
            {
                Code = x.Code,
                Message = formattedError.ToString()
            };
        }).ToArray();
    }
}