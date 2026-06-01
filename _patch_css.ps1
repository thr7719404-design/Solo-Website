$path = "D:\Solo Website\frontend-react\src\pages\admin\Admin.module.css"
$c = Get-Content $path -Raw
$anchor = ".field input::placeholder,`r`n.field textarea::placeholder { color: var(--admin-text-muted); }"
$rule = @"
.field input[type="checkbox"],
.field input[type="radio"] {
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  cursor: pointer;
  accent-color: var(--admin-accent, #2563eb);
  flex: 0 0 auto;
}
"@
$addition = $anchor + "`r`n`r`n" + $rule
if ($c.Contains($anchor)) {
  if ($c.Contains('.field input[type="checkbox"]')) {
    Write-Output "ALREADY HAS RULE"
  } else {
    $c = $c.Replace($anchor, $addition)
    Set-Content -Path $path -Value $c -NoNewline
    Write-Output "ADDED"
  }
} else {
  Write-Output "ANCHOR NOT FOUND"
}
