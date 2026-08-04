$parent_item = Get-Item master: -ID "{AB33CEA4-B280-4025-BBC1-0A7E056053CF}"
$template_id = "{C5C485D2-C352-4E12-AC74-7A23DF280E45}"

$path = "C:\projects\digital\sitecore\scripts\PowerShell\countries\country_codes.csv"

$countries = Import-Csv $path -delimiter ","
$countries | ForEach-Object {
    $CountryName = $_.name
    $Code = $_.code
    
    $item = New-Item -Parent $parent_item -Name $CountryName -ItemType $template_id
    $item.Editing.BeginEdit()
    $item["CountryName"] = $CountryName
    $item["CountryCode"] = $Code
    $item.Editing.EndEdit() | Out-Null
    
    Write-Host "item $_ created"
}