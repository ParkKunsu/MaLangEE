# Windows 11 환경에서 SSH 키 생성부터 서버 등록까지 처리하는 올인원 스크립트
# 사용법: .\copy-ssh-key.ps1 [-Server 49.50.137.35] [-User aimaster] [-KeyPath "C:\\Users\\...\\.ssh\\id_ed25519"] [-ForceNewKey]

param(
    [string]$Server = "49.50.137.35",
    [string]$User = "aimaster",
    [string]$KeyPath = "",
    [switch]$ForceNewKey
)

# 한글 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

function Write-Section($Message) {
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

function Require-Command($Name) {
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Host "필수 명령을 찾을 수 없습니다: $Name" -ForegroundColor Red
        Write-Host "Windows 설정 > 앱 > 선택적 기능에서 'OpenSSH Client'를 설치하세요." -ForegroundColor Yellow
        exit 1
    }
}

Write-Section "SSH 키 생성 및 서버 등록"
Write-Host "대상 서버: $User@$Server" -ForegroundColor Yellow
Write-Host ""

Require-Command "ssh"
Require-Command "ssh-keygen"

$sshDir = Join-Path $env:USERPROFILE ".ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir | Out-Null
}

# 키 경로 결정
if ([string]::IsNullOrWhiteSpace($KeyPath)) {
    $defaultKeys = @(
        (Join-Path -Path $sshDir -ChildPath "id_ed25519"),
        (Join-Path -Path $sshDir -ChildPath "id_rsa")
    )

    foreach ($candidate in $defaultKeys) {
        if (Test-Path $candidate) {
            $KeyPath = $candidate
            break
        }
    }

    if ([string]::IsNullOrWhiteSpace($KeyPath)) {
        $KeyPath = Join-Path $sshDir "id_ed25519"
    }
}

if ($KeyPath.EndsWith(".pub")) {
    $KeyPath = $KeyPath.Substring(0, $KeyPath.Length - 4)
}

$PubKeyPath = "$KeyPath.pub"

$needsKey = $ForceNewKey -or (-not (Test-Path $KeyPath)) -or (-not (Test-Path $PubKeyPath))
if ($needsKey) {
    if ($ForceNewKey -and ((Test-Path $KeyPath) -or (Test-Path $PubKeyPath))) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $KeyPath = Join-Path $sshDir "id_ed25519_$timestamp"
        $PubKeyPath = "$KeyPath.pub"
    }

    Write-Host "SSH 키를 생성합니다: $KeyPath" -ForegroundColor Yellow
    $comment = "$env:USERNAME@$env:COMPUTERNAME"
    ssh-keygen -t ed25519 -a 64 -f $KeyPath -C $comment
    if ($LASTEXITCODE -ne 0) {
        Write-Host "SSH 키 생성에 실패했습니다." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "기존 SSH 키를 사용합니다: $KeyPath" -ForegroundColor Green
}

if (-not (Test-Path $PubKeyPath)) {
    Write-Host "공개 키를 찾을 수 없습니다: $PubKeyPath" -ForegroundColor Red
    exit 1
}

$pubKey = (Get-Content $PubKeyPath -Raw).Trim()

Write-Host ""
Write-Host "원격 서버에 공개 키를 복사합니다..." -ForegroundColor Yellow

$command = @"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
if ! grep -Fxq '$pubKey' ~/.ssh/authorized_keys 2>/dev/null; then
    echo '$pubKey' >> ~/.ssh/authorized_keys
    echo 'SUCCESS'
else
    echo 'ALREADY_EXISTS'
fi
"@

try {
    $result = ssh -i $KeyPath -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=publickey,password,keyboard-interactive "$User@$Server" $command 2>&1

    if ($LASTEXITCODE -eq 0) {
        if ($result -match "SUCCESS") {
            Write-Host ""
            Write-Host "공개 키가 성공적으로 등록되었습니다." -ForegroundColor Green
        } elseif ($result -match "ALREADY_EXISTS") {
            Write-Host ""
            Write-Host "공개 키가 이미 서버에 존재합니다." -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "등록 결과:" -ForegroundColor Yellow
            Write-Host $result
        }
    } else {
        throw $result
    }

    Write-Host ""
    Write-Host "비밀번호 없이 접속을 테스트합니다..." -ForegroundColor Yellow
    $testResult = ssh -i $KeyPath -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$User@$Server" "echo OK" 2>&1
    if ($LASTEXITCODE -eq 0 -and $testResult -match "OK") {
        Write-Host "접속 테스트 성공" -ForegroundColor Green
        Write-Host "접속 명령: ssh -i $KeyPath $User@$Server" -ForegroundColor White
    } else {
        Write-Host "접속 테스트에 실패했습니다. 비밀번호 입력 후 직접 접속을 확인하세요." -ForegroundColor Yellow
        Write-Host "접속 명령: ssh -i $KeyPath $User@$Server" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "SSH 연결 또는 키 등록에 실패했습니다." -ForegroundColor Red
    Write-Host "오류: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동 등록 방법:" -ForegroundColor Yellow
    Write-Host "1) 아래 공개 키를 복사하세요:" -ForegroundColor White
    Write-Host $pubKey -ForegroundColor Cyan
    Write-Host "2) 서버 접속: ssh $User@$Server" -ForegroundColor White
    Write-Host "3) 아래 명령 실행:" -ForegroundColor White
    Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "   echo '공개키내용' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    exit 1
}
