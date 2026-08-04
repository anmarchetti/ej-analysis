namespace easyJet.Holidays.Api.Domain.Data.Cache
{
    public class CacheStatus
    {
        /// <summary>
        /// Current process status
        /// </summary>
        public ProcessStatus Process { get; set; }

        /// <summary>
        /// Cache buckets status
        /// </summary>
        public Dictionary<string, CacheBucketStatus> Buckets { get; set; }
    }

    public class ProcessStatus
    {
        /// <summary>
        /// The amount of physical memory, in bytes, allocated for the associated process.
        /// </summary>
        public decimal WorkingSetMb { get; set; }

        /// <summary>
        /// The amount of memory, in bytes, allocated for the associated process that cannot be shared with other processes.
        /// </summary>
        public decimal PrivateMemorySizeMb { get; set; }

        /// <summary>
        /// Retrieves the number of bytes currently thought to be allocated.
        /// </summary>
        public decimal GcTotalMb { get; internal set; }
    }

    /// <summary>
    /// Cache bucket statistics
    /// </summary>
    public class CacheBucketStatus
    {
        /// <summary>
        /// Number of keys for bucket
        /// </summary>
        public long KeysNumber { get; set; }

        /// <summary>
        /// Keys list
        /// </summary>
        public ICollection<string> Keys { get; set; }
    }
}