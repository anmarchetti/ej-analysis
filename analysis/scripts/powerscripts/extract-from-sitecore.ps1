function Get-ItemUrl {
    param(
        [item]$Item,
        [Sitecore.Sites.SiteContext]$SiteContext
    )
    
    $result = New-UsingBlock(New-Object Sitecore.Sites.SiteContextSwitcher $siteContext) {
        New-UsingBlock(New-Object Sitecore.Data.DatabaseSwitcher $item.Database) {
            [Sitecore.Links.LinkManager]::GetItemUrl($item)
        }
    }
    
    $result[0][0]
}

function Is-Published {
    param($item)
    
    $path = $item.Paths.FullPath
    if(($item = Get-Item -Path "web:\$($path)" -Language $item.Language -ErrorAction SilentlyContinue)) {
        return $true
    } else {
        return $false
    }
}

$siteContext = [Sitecore.Sites.SiteContext]::GetSite("Holidays")

function generate($rootPath, $language){
    $data = @()
    $defaultLayout = Get-LayoutDevice "Default"

    $childPages = Get-ChildItem -Path $rootPath -Recurse -Language $language | Where-Object { $_.__Renderings -ne "" -or $_.__FinalRenderings -ne "" }
    $page = Get-Item -Path $rootPath -Language $language | Where-Object { $_.Paths.Path -eq $rootPath }

    $pages = @()
    if ($page -ne $null) {
        $pages += $page
    }
    
    if ($childPages -ne $null) {
        $pages += $childPages
    }
     
    foreach($page in $pages) {
        $renderings = Get-Rendering -Item $page -Device $defaultLayout -FinalLayout
        
        # Check if the item is page
        if($renderings -eq $null -or $renderings.Count -eq 0) {
            continue
        }

        $componentNames = @()
    
        foreach($rendering in $renderings) {
            if($rendering.ItemID -ne $null)
            {
                $renderingItem = Get-Item master: -ID $rendering.ItemID
                if($renderingItem -ne $null)
                {
                    $componentItem = Get-Item -Path "master:" -ID $rendering.ItemID
                    $componentName = "$($componentItem.Name)_$($rendering.UniqueID)_$($rendering.Placeholder)"
                    $componentNames += $componentName
                }
            }
        }
        
        $pageUrl = Get-ItemUrl -SiteContext $siteContext -Item $page
    
        $data += New-Object PSObject -Property ([ordered]@{
            "PagePath" = $page.Paths.Path
            "ItemName" = $page.Name
            "Language" = $page.Language
            "PageUrl" = $pageUrl
            "IsPublishedLive" = Is-Published -item $page
            "Components (name_uid_placeholder)" = $componentNames -join '|'
        })
    }
    
    # Uncomment to store on hard-drive
    #$data | Export-Csv -Path $csvFilePath -NoTypeInformation

    return $data
}

 function generatePage($pagePath, $language){
    $data = @()
    $defaultLayout = Get-LayoutDevice "Default"

    $pages = Get-Item -Path $pagePath -Language $language | Where-Object { $_.Paths.Path -eq $pagePath}

    foreach($page in $pages) {
        $renderings = Get-Rendering -Item $page -Device $defaultLayout -FinalLayout
        
        # Check if the item is page
        if($renderings -eq $null -or $renderings.Count -eq 0) {
            continue
        }

        $componentNames = @()
    
        foreach($rendering in $renderings) {
            if($rendering.ItemID -ne $null)
            {
                $renderingItem = Get-Item master: -ID $rendering.ItemID
                if($renderingItem -ne $null)
                {
                    $componentItem = Get-Item -Path "master:" -ID $rendering.ItemID
                     $componentName = "$($componentItem.Name)_$($rendering.UniqueID)_$($rendering.Placeholder)"
                    $componentNames += $componentName
                }
            }
        }
        
        $pageUrl = Get-ItemUrl -SiteContext $siteContext -Item $page
    
        $data += New-Object PSObject -Property ([ordered]@{
            "PagePath" = $page.Paths.Path
            "ItemName" = $page.Name
            "Language" = $page.Language
            "PageUrl" = $pageUrl
            "IsPublishedLive" = Is-Published -item $page
            "Components (name_uid_placeholder)" = $componentNames -join '|'
        })
    }
    
    return $data
}


function generateRaport($rootPath, $language) {
    $firstChildPages = Get-ChildItem -Path $rootPath -Language $language
    $counter = 0;
    $totalItems = $firstChildPages.Count
    $raport =@()
    
    foreach ($page in $firstChildPages) {
       $counter++
       $percentage = ($counter / $totalItems) * 100
		
	   # Remark Skip Destination
       if ($page.Name -eq "Destinations") {
            Write-Host("Skip Destinations")
            continue;
       }
        
        Write-Host ("Processing item {0}({1}) |  {2} of {3} ({4:N2}%)" -f  $page.Name, $page.Language, $counter, $totalItems, $percentage)
         
        $raport += generate -rootPath $page.Paths.Path -language $page.Language
  }
  
   $destinationSpain = "/sitecore/content/EasyJet/Holidays/Home/Destinations/Spain";
   $destinationRegion = "/sitecore/content/EasyJet/Holidays/Home/Destinations/Spain/Cantabria"
   $destinationResort = "/sitecore/content/EasyJet/Holidays/Home/Destinations/Spain/Cantabria/Santander"
   $hotel = "/sitecore/content/EasyJet/Holidays/Home/Destinations/Spain/Tenerife/Playa De Las Americas/Cleopatra Palace"
   
   Write-Host ("Processing item {0}" -f  $destinationSpain)
   Write-Host ("Processing item {0}" -f  $destinationRegion)
   Write-Host ("Processing item {0}" -f  $destinationResort)
   
   $raport += generatePage -pagePath $destinationSpain -language "en"
   $raport += generatePage -pagePath $destinationRegion -language "en"
   $raport += generatePage -pagePath $destinationResort  -language "en"
   $raport += generatePage -pagePath $hotel  -language "en"
  
   $csvData = $raport| ConvertTo-Csv -NoTypeInformation -Delimiter ','
   $csvString = $csvData -join "`r`n"
   $csvString | Out-Download -Name "PageComponentsExport.csv"
}


# Generate Raport in breakdown mode (for all languages)
# Example:
 # Processing item Root(en) |  13 of 26 (50.00%)
 # Processing item Shortlists(en) |  14 of 26 (53.85%)
 # Processing item Shortlists No Results(en) |  15 of 26 (57.69%)
  generateRaport -rootPath "/sitecore/content/EasyJet/Holidays/Home" language "*"

# Remarks
 # Destination Page works very slow (Selected one country)