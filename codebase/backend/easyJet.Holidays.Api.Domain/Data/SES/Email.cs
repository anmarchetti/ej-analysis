#nullable enable

namespace easyJet.Holidays.Api.Domain.Data.SES
{
    public record Email
    {
        //required
        public string From { get; init; }
        public string To { get; init; }
        public string Subject { get; init; }
        public string Template { get; init; }

        //optional
        public Dictionary<string, string>? Variables { get; init; }
        public string? ReplyTo { get; init; }
        public List<EmailAttachment>? Attachments { get; init; }
    }

    public record EmailAttachment
    {
        public string FileName { get; init; }
        public Stream Content { get; init; }
        public string ContentType { get; init; }
    }
}
