# Frontend scripts 사용법

위 문서는 `frontend/scripts` 폴더에 있는 개발/운영 보조 스크립트들의 용도와 사용법, 트러블슈팅을 정리합니다.

대상 파일
- `restart-dev.sh` — 개발 서버(Next) 포트 정리 후 포트 3000으로 dev 실행(단발용)
- `start-frontend.sh` — user-level systemd에서 호출하는 시작 스크립트 (포트 정리 + dev 시작)
- `manage-frontend.sh` — 서비스 관리용 스크립트 (start/stop/restart/status)

주의
- 대부분 작업은 사용자(`aimaster`) 권한으로 수행하도록 설계되어 있습니다. 루트(root)로 실행된 기존 프로세스나 systemd 서비스가 포트를 점유했다면 관리자 권한으로 해당 프로세스를 중지해야 합니다.
- 스크립트는 `lsof`, `ss`, `systemctl --user` 등을 사용합니다. 해당 명령들이 시스템에 설치되어 있어야 합니다.

---

## 1) `restart-dev.sh`
경로: `frontend/scripts/restart-dev.sh`

### 목적
- 로컬에서 빠르게 개발 서버를 재시작할 때 쓰는 원클릭 스크립트입니다.
- 포트(3000, 3001)를 확인하여 프로세스 종료를 시도하고 `.next/dev/lock`을 삭제한 뒤 `npm run dev` (또는 `yarn dev`)로 dev 서버를 포트 3000에서 실행합니다.
- (업데이트) 시스템/사용자 단의 `systemd` 유닛과 Next/Node 관련 프로세스도 찾아 중지하도록 확대했습니다. 즉, 단순 포트 강제 종료 외에 `malangee-frontend` 또는 `next` 관련 서비스가 자동으로 재시작하거나 다른 사용자가 띄운 인스턴스가 있는 경우 이를 탐지해 중지 시도합니다.

### 사용법
```bash
cd /home/aimaster/projects/MaLangEE/frontend
./scripts/restart-dev.sh
```

### 상세 동작 (업데이트된 동작 포함)
- 1) 먼저 `lsof`로 3000/3001 포트의 PID를 찾고 `kill`을 시도합니다.
- 2) 기존에 있던 `pkill`/프로세스 패턴 매칭에 더해, `systemctl --user`(유저 단위)와 `systemctl`(시스템 단위)를 검색해 `malangee-frontend`나 `next` 관련 서비스 단위를 찾아 중지 시도합니다. 시스템 단위는 `sudo`가 필요할 수 있습니다.
- 3) `ps` 출력에서 `/node_modules/.bin/next`, `next-server`, `next dev` 또는 프로젝트 경로를 포함하는 Node/Next 프로세스를 찾아 polite kill(TERM) 후 필요 시 강제 종료(SIGKILL)를 시도합니다. 강제 종료는 `sudo` fallback을 시도합니다.
- 4) `.next/dev/lock` 파일을 삭제합니다.
- 5) 포트가 확보되면 `PORT=3000 NODE_ENV=development npm run dev`로 dev 서버를 시작합니다.

### 주의사항 (추가)
- 루트(root) 또는 다른 사용자 소유의 프로세스는 일반 유저로는 종료할 수 없습니다. 스크립트는 `sudo`를 이용한 중지 시도를 포함하지만, 실제로 중지하려면 sudo 비밀번호 입력이 필요하거나 관리자 권한이 필요할 수 있습니다.
- 이 스크립트는 `next` 관련 패턴을 기반으로 프로세스를 찾아 중지하므로, 같은 호스트에서 다른 Next.js 애플리케이션(프로덕션 등)을 운영 중이라면 그 서비스도 중단될 수 있습니다. 여러 앱을 운영 중인 서버에서는 사용 전에 반드시 중지 대상 PID/유닛을 확인하세요.
- 자동으로 systemd 유닛을 중지하더라도 그 유닛이 `enabled` 상태라면 관리자 권한으로 `sudo systemctl disable <unit>` 를 통해 재시작을 방지해야 합니다.

---

## 2) `start-frontend.sh`
경로: `frontend/scripts/start-frontend.sh`

### 목적
- user-level systemd 단위(예: `malangee-frontend.service`)에서 `ExecStart`로 호출되도록 만든 시작 스크립트입니다.
- 사용자 권한으로 안전하게 포트를 정리하고 dev 서버를 실행합니다.

### 사용법
- systemd에서 자동으로 호출되므로 직접 실행할 필요는 보통 없습니다. 수동 실행 시:
```bash
cd /home/aimaster/projects/MaLangEE/frontend
./scripts/start-frontend.sh
```

### 상세 동작
- 현재 사용자 소유의 3000/3001 포트 리스너를 찾아 `kill` (유저 소유 프로세스만)
- `.next/dev/lock` 삭제
- `PORT=3000 NODE_ENV=development yarn dev`(yarn 있으면) 또는 `npm run dev` 실행

### 비고
- systemd user unit과 조합해 사용하면 로그인 시 자동 시작, 로그 중앙화, 재시작 정책 등을 일관되게 관리할 수 있습니다.

---

## 3) `manage-frontend.sh`
경로: `frontend/scripts/manage-frontend.sh`

### 목적
- 프로젝트 루트(프론트엔드)의 남아있는 Next/Node 프로세스들을 정리하고, user-level systemd 서비스(`malangee-frontend.service`)를 안전하게 시작/중지/재시작/상태확인하도록 만든 관리 스크립트입니다.
- 반복적으로 `포트 점유 -> 락 제거 -> 재시작`을 수동으로 하지 않게 해줍니다.

### 제공 명령
- 기본: `restart`
- `start` / `stop` / `status`

### 사용법
```bash
cd /home/aimaster/projects/MaLangEE/frontend
# 재시작 (stop -> 정리 -> lock 제거 -> start)
./scripts/manage-frontend.sh restart

# 시작만
./scripts/manage-frontend.sh start

# 중지
./scripts/manage-frontend.sh stop

# 상태 확인 (systemd 상태 + 포트 리스닝 상태)
./scripts/manage-frontend.sh status
```

### 상세 동작
- `stop_manual_procs`: `ps`에서 프로젝트 루트 경로를 포함하는 `node`/`next` 프로세스의 PID를 찾아 `kill` 시도
- 유저가 소유한 포트 3000 리스너가 있으면 추가로 kill
- `.next/dev/lock` 제거
- systemd user 서비스 활성화 및 시작 (`systemctl --user enable --now malangee-frontend.service`)

### 권장 워크플로
- 로컬 개발 시작/재시작 시 `./scripts/manage-frontend.sh restart`를 사용하세요.
- 시스템에 의해 자동으로 재시작되는 root 프로세스가 있었다면 먼저 관리자 권한으로 해당 서비스를 중지해야 합니다.

---

## systemd user unit (참고)
파일 위치: `~/.config/systemd/user/malangee-frontend.service`

이 unit 파일은 유저 권한으로 프론트엔드를 관리하도록 설정되어 있으며, `ExecStartPre`로 사용자 소유의 리스너를 종료하고 포트가 해제될 때까지 대기합니다. 서비스 로그는 `journalctl --user -u malangee-frontend.service`로 확인 가능합니다.

시작/중지 예시:
```bash
# 즉시 시작/활성화
systemctl --user enable --now malangee-frontend.service

# 중지
systemctl --user stop malangee-frontend.service

# 상태 및 로그
systemctl --user status malangee-frontend.service --no-pager -l
journalctl --user -u malangee-frontend.service -f
```

---

## 트러블슈팅

1) EADDRINUSE: address already in use 0.0.0.0:3000
- 원인: 포트 3000을 이미 점유한 프로세스가 있음.
- 확인:
```bash
ss -ltnp | grep ':3000'
# 또는
lsof -iTCP:3000 -sTCP:LISTEN -P -n
```
- 해결:
  - 소유자가 `aimaster`인 프로세스면 `./scripts/manage-frontend.sh stop` 로 정리 후 재시작.
  - root 또는 다른 사용자가 소유하면 관리자 권한으로 종료 필요:
```bash
sudo lsof -i :3000 -P -n
sudo kill <pid>
# 또는
sudo systemctl stop <service-name>
```

2) `.next/dev/lock` 때문에 3001로 바인딩되는 경우
- 해결: `rm -f frontend/.next/dev/lock` 또는 `./scripts/manage-frontend.sh restart` 로 자동 삭제 후 재시작

3) `.git/objects` 가 root 소유여서 git 동작에 실패하는 경우
- 해결(관리자 필요):
```bash
cd /home/aimaster/projects/MaLangEE
sudo chown -R $(whoami):$(id -gn) .git/objects
```

4) systemd unit이 자꾸 실패/무한 재시작 하는 경우
- 서비스 로그 확인:
```bash
journalctl --user -u malangee-frontend.service -n 200 --no-pager
```
- 서비스 설정에서 `RestartSec` / `StartLimitBurst` 등을 늘려 일시적 실패를 완화

---

## 권장 사용 패턴
- 개발 시작: `./scripts/manage-frontend.sh restart`
- 빠른 일회성 재시작(포트 정리 후 직접 실행): `./scripts/restart-dev.sh`
- systemd 기반 관리(로그/재시작/자동시작): `systemctl --user enable --now malangee-frontend.service`
