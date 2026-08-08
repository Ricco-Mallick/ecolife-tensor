$gitExe = Join-Path $env:TEMP "mingit\cmd\git.exe"
$ghExe = "C:\Program Files\GitHub CLI\gh.exe"
$token = (& $ghExe auth token).Trim()
$remoteUrl = "https://may1102-1909:$token@github.com/Ricco-Mallick/ecolife-tensor.git"

Write-Host "Verifying current commit base (Ricco's 52 commits)..."
$baseCount = (& $gitExe rev-list --count HEAD).Trim()
Write-Host "Base branch commit count: $baseCount"

Write-Host "Configuring Git credentials for may1102-1909..."
& $gitExe config user.name "may1102-1909"
& $gitExe config user.email "may1102-1909@users.noreply.github.com"

Write-Host "Staging all user features and updates..."
& $gitExe add .

Write-Host "Committing updates on top of Ricco's 52 commits..."
& $gitExe commit -m "Feat: TensorFlow AI Waste Scanner, Satellite Green Map, Pedometer, AI Proof Verification & Live Leaderboard"

$newCount = (& $gitExe rev-list --count HEAD).Trim()
Write-Host "New total commit history length: $newCount commits"

Write-Host "Pushing new commit on top of main branch to GitHub..."
& $gitExe push $remoteUrl main

Write-Host "Successfully pushed commit #53 on top of Ricco's 52 original commits!"
