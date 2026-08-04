$criteriaTemplate = @(
    @{Filter = "Equals"; Field = "_templatename"; Value = "Country"; },
    @{Filter = "Equals"; Field = "_templatename"; Value = "Resort"; }, 
    @{Filter = "Equals"; Field = "_templatename"; Value = "Hotel"; }, 
    @{Filter = "Equals"; Field = "_templatename"; Value = "Region"; }
)

$predicateTemplate = New-SearchPredicate -Operation Or -Criteria $criteriaTemplate

$criteriaVersion = @{ Filter = "Equals"; Field = "_latestversion"; Value = "true"; }
$predicateVersion = New-SearchPredicate -Criteria $criteriaVersion

$predicateTemplateAndVersion = New-SearchPredicate -First $predicateTemplate -Second $predicateVersion -Operation And

$props = @{
    Index = "sitecore_destinations_master_index"
    Predicate = $predicateTemplateAndVersion
}

$items = Find-Item @props
$items
Write-Host "Num of items: " $items.length
$counter = 0

ForEach ($searchResultItem in $items) 
{
  $item = Get-Item -Path master: -ID $searchResultItem.ItemId;
   
  $item.Editing.BeginEdit();
  $item["PageTitle"] = "";
  $item["Description"] = "";
  $item.Editing.EndEdit();
  $counter++;
    Write-Host $item.DisplayName "has been updated"
  
}
$counter