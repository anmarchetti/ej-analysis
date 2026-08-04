using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Rainbow.Filtering;
using Rainbow.Model;
using Rainbow.Storage;
using Rainbow.Storage.Sc.Deserialization;
using Sitecore.Data;
using Sitecore.Data.Serialization.Exceptions;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.Serialization
{
    /// <summary>
    /// Default <see cref="Unicorn.Deserialization.UnicornDeserializer"/> has issue with updating shared -> unshared field during deserilization.
    /// Overwrite UnicornDeserilizer to resolve the issue with changing shared field to unshared.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public class UnicornDeserializer : Unicorn.Deserialization.UnicornDeserializer, IDeserializer
    {
        public UnicornDeserializer(IDefaultDeserializerLogger logger, IFieldFilter fieldFilter)
            : base(logger, fieldFilter)
        {
        }

        /// <summary>
        /// Deserialize item.
        /// </summary>
        /// <param name="serializedItemData">Serialized item data.</param>
        /// <param name="fieldValueManipulator">Field value manipulator.</param>
        /// <returns>Data about item.</returns>
        public new IItemData Deserialize(IItemData serializedItemData, IFieldValueManipulator fieldValueManipulator)
        {
            Assert.ArgumentNotNull(serializedItemData, "serializedItem");

            using (new VersionSafeEnforceVersionPresenceDisabler())
            {
                var targetItem = GetOrCreateTargetItem(serializedItemData, out var newItemWasCreated);
                var softErrors = new List<TemplateMissingFieldException>();

                try
                {
                    bool changeHappened = false;

                    var templateChangeHappened = ChangeTemplateIfNeeded(serializedItemData, targetItem);

                    var branchChangeHappened = ChangeBranchIfNeeded(serializedItemData, targetItem, newItemWasCreated);

                    var renameHappened = RenameIfNeeded(serializedItemData, targetItem);

                    ResetTemplateEngineIfItemIsTemplate(targetItem);

                    var fieldSharingWasUpdated = UpdateFieldSharingIfNeeded(serializedItemData, targetItem);

                    var sharedFieldsWereChanged = PasteSharedFields(serializedItemData, targetItem, newItemWasCreated, softErrors, fieldValueManipulator);

                    var unversionedFieldsWereChanged = PasteUnversionedFields(serializedItemData, targetItem, newItemWasCreated, softErrors, fieldValueManipulator);

                    var versionChangeHappened = PasteVersions(serializedItemData, targetItem, newItemWasCreated, softErrors, fieldValueManipulator);

                    if (softErrors.Count > 0)
                    {
                        throw TemplateMissingFieldException.Merge(softErrors);
                    }

                    changeHappened = templateChangeHappened | branchChangeHappened | renameHappened | sharedFieldsWereChanged | unversionedFieldsWereChanged | fieldSharingWasUpdated | versionChangeHappened;

                    if (!changeHappened)
                    {
                        return null;
                    }

                    return new Rainbow.Storage.Sc.ItemData(targetItem, ParentDataStore);
                }
                catch (ParentForMovedItemNotFoundException)
                {
                    throw;
                }
                catch (ParentItemNotFoundException)
                {
                    throw;
                }
                catch (TemplateMissingFieldException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    if (newItemWasCreated)
                    {
                        targetItem.Delete();
                        ClearCaches(targetItem.Database, new ID(serializedItemData.Id));
                    }

                    throw new DeserializationException("Failed to paste item: " + serializedItemData.Path, ex);
                }
            }
        }
    }
}