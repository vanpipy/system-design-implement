param(
  [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "Quickstart verify against $BaseUrl" -ForegroundColor Cyan

$account = @{
  accountId = "ACC-QS-1"
  accountType = "CASH"
  currency = "CNY"
}

# 1) Deposit 100.00
$depositBody = @{
  requestId = "REQ-QS-1"
  idempotencyKey = "IDEMP-QS-1"
  account = $account
  transactions = @(@{
    transactionType = "DEPOSIT"
    direction = "CREDIT"
    amount = "100.00"
  })
} | ConvertTo-Json -Depth 5

$depositRes = Invoke-RestMethod -Method Post -Uri "$BaseUrl/balances/transactions" -ContentType "application/json" -Body $depositBody -ErrorAction Stop
Write-Host "Deposit status: $($depositRes.status)" -ForegroundColor Green

# 2) Batch query balances
$batchBody = @{
  accounts = @(
    $account,
    @{
      accountId = "ACC-NOT-EXIST"
      accountType = "CASH"
      currency = "CNY"
    }
  )
} | ConvertTo-Json -Depth 5

$balances = Invoke-RestMethod -Method Post -Uri "$BaseUrl/balances" -ContentType "application/json" -Body $batchBody -ErrorAction Stop
Write-Host "Balances items: $($balances.items.Length)" -ForegroundColor Green

# 3) Snapshots by request
$snapshots = Invoke-RestMethod -Method Get -Uri "$BaseUrl/balances/snapshots?requestId=REQ-QS-1" -ErrorAction Stop
Write-Host "Snapshots items: $($snapshots.items.Length)" -ForegroundColor Green

# 4) Transactions by account
$qs = "accountId=$($account.accountId)&accountType=$($account.accountType)&currency=$($account.currency)"
$txs = Invoke-RestMethod -Method Get -Uri "$BaseUrl/balances/transactions?$qs" -ErrorAction Stop
Write-Host "Transactions items: $($txs.items.Length)" -ForegroundColor Green

Write-Host "Quickstart verification finished." -ForegroundColor Cyan

