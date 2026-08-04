using System;
using Sitecore.Data;

namespace easyJet.Foundation.Presentation.Models
{
    /// <summary>
    /// Represents a single rendering mapping entry with key rendering, value rendering, and parameters.
    /// Immutable value object for rendering mapping entries.
    /// </summary>
    public class RenderingMapping
    {
        /// <summary>
        /// Gets the key rendering item ID.
        /// </summary>
        public ID KeyId { get; }

        /// <summary>
        /// Gets the value rendering item ID.
        /// </summary>
        public ID ValueId { get; }

        /// <summary>
        /// Gets the rendering parameters string (stored as string, not ID).
        /// </summary>
        public string Parameters { get; }

        /// <summary>
        /// Gets the optional rendering instance UID filter. When not <see cref="Guid.Empty"/>
        /// the replacement is only applied to the rendering instance with this exact UID.
        /// </summary>
        public Guid Uid { get; }

        /// <summary>
        /// Gets a value indicating whether this mapping instructs the processor to remove the
        /// rendering instead of replacing it.
        /// </summary>
        public bool IsJustRemove { get; }

        /// <summary>
        /// Gets a value indicating whether this mapping is valid (has a non-null key rendering).
        /// </summary>
        public bool IsValid => KeyId != (ID)null && !KeyId.IsNull;

        /// <summary>
        /// Initializes a new instance of the <see cref="RenderingMapping"/> class.
        /// </summary>
        /// <param name="keyId">The key rendering item ID.</param>
        /// <param name="valueId">The value rendering item ID.</param>
        /// <param name="parameters">The rendering parameters string.</param>
        /// <param name="uid">Optional rendering instance UID filter (empty = apply to all instances).</param>
        /// <param name="isJustRemove">When <c>true</c> the processor removes the rendering instead of replacing it.</param>
        public RenderingMapping(ID keyId, ID valueId, string parameters, Guid uid = default, bool isJustRemove = false)
        {
            KeyId = keyId ?? ID.Null;
            ValueId = valueId ?? ID.Null;
            Parameters = parameters ?? string.Empty;
            Uid = uid;
            IsJustRemove = isJustRemove;
        }

        /// <summary>
        /// Returns a string representation of the mapping in the format keyId:valueId:parameters.
        /// </summary>
        /// <returns>String representation of the mapping.</returns>
        public override string ToString()
        {
            return Uid != Guid.Empty
                ? $"{KeyId}:{ValueId}:{Parameters}:{Uid:B}"
                : $"{KeyId}:{ValueId}:{Parameters}";
        }

        /// <summary>
        /// Determines whether two ItemMapping instances are equal.
        /// </summary>
        /// <param name="obj">The object to compare.</param>
        /// <returns>True if equal; otherwise false.</returns>
        public override bool Equals(object obj)
        {
            if (obj is RenderingMapping other)
            {
                return KeyId == other.KeyId &&
                       ValueId == other.ValueId &&
                       Parameters == other.Parameters &&
                       Uid == other.Uid &&
                       IsJustRemove == other.IsJustRemove;
            }

            return false;
        }

        /// <summary>
        /// Returns a hash code for this instance.
        /// </summary>
        /// <returns>Hash code.</returns>
        public override int GetHashCode()
        {
            unchecked
            {
                int hash = 17;
                hash = (hash * 23) + (KeyId?.GetHashCode() ?? 0);
                hash = (hash * 23) + (ValueId?.GetHashCode() ?? 0);
                hash = (hash * 23) + (Parameters?.GetHashCode() ?? 0);
                hash = (hash * 23) + Uid.GetHashCode();
                hash = (hash * 23) + IsJustRemove.GetHashCode();
                return hash;
            }
        }
    }
}
