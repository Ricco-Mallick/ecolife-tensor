$gitExe = Join-Path $env:TEMP "mingit\cmd\git.exe"
$ghExe = "C:\Program Files\GitHub CLI\gh.exe"
$token = (& $ghExe auth token).Trim()
$remoteUrl = "https://may1102-1909:$token@github.com/Ricco-Mallick/ecolife-tensor.git"

Write-Host "Creating and switching to 'dev' branch..."
& $gitExe checkout -B dev

Write-Host "Configuring Git credentials for may1102-1909..."
& $gitExe config user.name "may1102-1909"
& $gitExe config user.email "may1102-1909@users.noreply.github.com"

Write-Host "Staging all local code changes..."
& $gitExe add .

Write-Host "Committing local feature code on 'dev' branch..."
& $gitExe commit -m "Feat (dev): Complete localhost features - TensorFlow AI Waste Scanner, Satellite Green Map, Pedometer, AI Proof Verification & Live Leaderboard" 2>$null

Write-Host "Pushing 'dev' branch to GitHub..."
& $gitExe push $remoteUrl dev --force -u

Write-Host "Successfully created and pushed 'dev' branch to GitHub!"
