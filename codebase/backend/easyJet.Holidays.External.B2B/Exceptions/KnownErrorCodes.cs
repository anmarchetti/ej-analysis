using easyJet.Holidays.Api.Domain.Data.Errors;

namespace easyJet.Holidays.External.B2B.Exceptions
{
    public static class KnownErrorCodes
    {
        public static readonly ApiError MemberPasswordIncorrect = new ApiError
        {
            Code = "1500003",
            Message = "PasswordIncorrect(4001)"
        };

        public static readonly ApiError MemberAccountLocked = new ApiError
        {
            Code = "1500003",
            Message = "AccountLocked(5001)"
        };
    }
}
