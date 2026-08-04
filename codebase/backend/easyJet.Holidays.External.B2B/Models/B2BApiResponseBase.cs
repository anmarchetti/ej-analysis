using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Xml.Serialization;

namespace easyJet.Holidays.External.B2B.Models
{
    public class B2BApiResponseBase<T> : XmlApiResponse<B2BApiResponse<T>>
    {
        public override ApiError[] ApiErrors
        {
            get
            {
                var error = Payload?.Body?.ErrorListRoot?.ErrorList?.Error;
                if (error != null)
                {
                    return new[] { new ApiError {
                            Code = error.Number,
                            Message = $"{error.Description}, method: {error.Method}, source: {error.Source}"
                        }
                    };
                }

                return null;
            }
        }
    }

    [XmlRoot(ElementName = "ResponseRoot")]
    public class B2BApiResponse<TData>
    {
        [XmlAttribute]
        public int Success { get; set; }

        public TData DataListRoot { get; set; }

        public ErrorListRoot ErrorListRoot { get; set; }
    }

    public class ErrorListRoot
    {
        public ErrorList ErrorList { get; set; }
    }

    public class ErrorList
    {
        public string Host { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public Error Error { get; set; }
    }

    public class Error
    {
        public string Number { get; set; }
        public string Description { get; set; }
        public string Method { get; set; }
        public string Source { get; set; }
    }
}
