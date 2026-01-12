#!/bin/bash

###############################################
#  MaLangEE 서비스 등록 스크립트 (Systemd)
#  실행 방법: sudo bash 5-setup_services.sh
#
#  기능:
#  1. Frontend (React/Vite) 서비스 등록
#  2. Backend (Spring Boot) 서비스 등록
#  3. AI-Engine (Python) 서비스 등록
#  4. 서버 재시작 시 자동 실행 설정
###############################################

# 공통 설정 로드
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# [Fix] Windows에서 편집된 경우를 대비해 변수 내 \r 제거 (Sanitize)
DB_HOST=$(echo "$DB_HOST" | tr -d '\r')
DB_PORT=$(echo "$DB_PORT" | tr -d '\r')
DB_NAME=$(echo "$DB_NAME" | tr -d '\r')
DB_USER=$(echo "$DB_USER" | tr -d '\r')
DB_PASSWORD=$(echo "$DB_PASSWORD" | tr -d '\r')
OPENAI_API_KEY=$(echo "$OPENAI_API_KEY" | tr -d '\r')
SECRET_KEY=$(echo "$SECRET_KEY" | tr -d '\r')

# ============================================
# Secret Key (JWT) & API Key 관리
# ============================================
SECRETS_FILE="$SCRIPT_DIR/secrets.sh"

# 1. 기존 secrets.sh 로드 (있는 경우)
if [ -f "$SECRETS_FILE" ]; then
    source "$SECRETS_FILE"
fi

# 2. JWT Secret Key 자동 생성 (없을 경우)
if [ -z "$SECRET_KEY" ]; then
    echo "  ℹ️  JWT Secret Key가 없으므로 새로 생성합니다..."
    
    # openssl로 랜덤 키 생성
    NEW_SECRET=$(openssl rand -hex 32)
    
    # 파일에 저장 (기존 내용 유지하며 추가)
    if [ ! -f "$SECRETS_FILE" ]; then
        echo "#!/bin/bash" > "$SECRETS_FILE"
        chmod 600 "$SECRETS_FILE"
    fi
    
    echo "export SECRET_KEY=\"$NEW_SECRET\"" >> "$SECRETS_FILE"
    
    # 현재 세션에도 적용
    export SECRET_KEY="$NEW_SECRET"
    echo "  ✓ 새 Secret Key 생성 및 저장 완료"
fi

# 프로젝트 경로
PROJECT_ROOT=$(get_project_path "$DEPLOY_USER" "$GITHUB_REPO")
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
AI_DIR="$PROJECT_ROOT/ai-engine"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Systemd 서비스 자동 등록 스크립트   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

# Root 권한 확인
if [[ $EUID -ne 0 ]]; then
   echo "이 스크립트는 root 권한으로 실행되어야 합니다." 
   exit 1
fi

# 0. 필수 패키지 확인
echo -e "\n${GREEN}0️⃣ 필수 패키지 확인 및 설치${NC}"

# Poetry 설치 확인 (Python Backend)
# 주의: 스크립트가 root로 실행되므로 DEPLOY_USER(aimaster) 계정으로 설치해야 함
if ! sudo -u "$DEPLOY_USER" command -v poetry &> /dev/null; then
    echo "  ℹ️  $DEPLOY_USER 계정에 Poetry가 없습니다. 설치를 진행합니다..."
    
    # aimaster 권한으로 설치 스크립트 실행
    sudo -u "$DEPLOY_USER" bash -c "curl -sSL https://install.python-poetry.org | python3 -"
    
    # PATH 설정 확인 및 추가 (root 세션용)
    POETRY_BIN="/home/$DEPLOY_USER/.local/bin/poetry"
    echo "  ✓ Poetry 설치 완료 ($POETRY_BIN)"
else
    echo "  ✓ Poetry 이미 설치됨"
fi



# Poetry 경로 확인
POETRY_PATH=$(which poetry)
# 만약 root path에 없다면 사용자 홈 디렉토리 확인 시도 (일반적인 경우)
if [ -z "$POETRY_PATH" ]; then
    POETRY_PATH="/home/$DEPLOY_USER/.local/bin/poetry"
fi
echo "  ℹ️  Poetry 경로: $POETRY_PATH"

# Node/NPM 경로 확인
NPM_PATH=$(which npm)
NODE_PATH=$(which node)
echo "  ℹ️  NPM 경로: $NPM_PATH"
echo "  ℹ️  Node 경로: $NODE_PATH"

# Python 경로 확인
PYTHON_PATH=$(which python3)
echo "  ℹ️  Python 경로: $PYTHON_PATH"


# ============================================
# DB 설정 확인 (Interactive)
# ============================================
echo -e "\n${GREEN}0️⃣-1 데이터베이스 설정 확인${NC}"
echo "  서비스에 등록될 DB 연결 정보를 확인합니다."
echo "  • Database: $DB_NAME"
echo "  • User: $DB_USER"
echo "  • Host: $DB_HOST"
echo ""

read -p "  위 설정으로 진행하시겠습니까? (Y/n): " CONFIRM_DB
if [[ "$CONFIRM_DB" =~ ^[Nn]$ ]]; then
    echo ""
    read -p "  • Database Name [$DB_NAME]: " INPUT_DB_NAME
    read -p "  • Database User [$DB_USER]: " INPUT_DB_USER
    read -sp "  • Database Password: " INPUT_DB_PASSWORD
    echo ""
    read -p "  • Database Host [$DB_HOST]: " INPUT_DB_HOST
    echo ""
    
    if [ -n "$INPUT_DB_NAME" ]; then DB_NAME="$INPUT_DB_NAME"; fi
    if [ -n "$INPUT_DB_USER" ]; then DB_USER="$INPUT_DB_USER"; fi
    if [ -n "$INPUT_DB_PASSWORD" ]; then DB_PASSWORD="$INPUT_DB_PASSWORD"; fi
    if [ -n "$INPUT_DB_HOST" ]; then DB_HOST="$INPUT_DB_HOST"; fi
    
    # 입력값에 대해서도 \r, 공백 제거 (Sanitize)
    DB_HOST=$(echo "$DB_HOST" | tr -d '\r' | xargs)
    
    echo "  ✓ 설정이 업데이트되었습니다."
fi


# 1. Backend 서비스 (Spring Boot)
echo -e "\n${GREEN}1️⃣ Backend 서비스 등록 (malangee-backend)${NC}"

# 기존 서비스 중지 및 비활성화 (있다면)
if systemctl is-active --quiet malangee-backend; then
    echo "  ℹ️  기존 Backend 서비스 중지 중..."
    systemctl stop malangee-backend
fi

cat > /etc/systemd/system/malangee-backend.service <<EOF
[Unit]
Description=MaLangEE Backend Service (FastAPI)
After=syslog.target network.target postgresql.service

[Service]
User=$DEPLOY_USER
WorkingDirectory=$BACKEND_DIR
# Poetry를 통한 Uvicorn 실행
ExecStart=$POETRY_PATH run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT
SuccessExitStatus=143
Restart=always
RestartSec=10
Environment=PYTHONPATH=$BACKEND_DIR:$AI_DIR
Environment=PATH=/usr/bin:/usr/local/bin:/home/$DEPLOY_USER/.local/bin
Environment=OPENAI_API_KEY=$OPENAI_API_KEY
Environment=SECRET_KEY=$SECRET_KEY
Environment=USE_SQLITE=FALSE
Environment=POSTGRES_USER=$DB_USER
Environment=POSTGRES_PASSWORD=$DB_PASSWORD
Environment=POSTGRES_SERVER=$DB_HOST
Environment=POSTGRES_PORT=$DB_PORT
Environment=POSTGRES_DB=$DB_NAME

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable malangee-backend
systemctl start malangee-backend
echo "  ✓ Backend 서비스 등록 및 시작 완료"

# 2. AI-Engine 서비스 (Python)
echo -e "\n${GREEN}2️⃣ AI-Engine 서비스 등록 (malangee-ai)${NC}"

# 기존 서비스 중지 및 비활성화 (있다면)
if systemctl is-active --quiet malangee-ai; then
    echo "  ℹ️  기존 AI-Engine 서비스 중지 중..."
    systemctl stop malangee-ai
fi

cat > /etc/systemd/system/malangee-ai.service <<EOF
[Unit]
Description=MaLangEE AI Engine Service (Python)
After=syslog.target network.target

[Service]
User=$DEPLOY_USER
WorkingDirectory=$BACKEND_DIR
# Backend의 Poetry 가상환경을 사용하여 AI-Engine 실행
ExecStart=$POETRY_PATH run python ../ai-engine/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable malangee-ai
systemctl start malangee-ai
echo "  ✓ AI-Engine 서비스 등록 및 시작 완료"

# 3. Frontend 서비스 (React/Vite)
# 주의: 개발 서버(Vite)를 프로덕션 서비스로 돌리는 것은 권장되지 않으나, 요청하신 대로 구성합니다.
# 실제 배포 시에는 'npm run build' 후 Nginx 등으로 정적 파일을 서빙해야 합니다.
echo -e "\n${GREEN}3️⃣ Frontend 서비스 등록 (malangee-frontend)${NC}"

# 의존성 설치 (npm install) 확인 및 실행
if [ -f "$FRONTEND_DIR/package.json" ]; then
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo "  ℹ️  Frontend 의존성(node_modules)이 없습니다. 설치를 진행합니다..."
        # aimaster 권한으로 설치 실행
        su - $USER -c "cd $FRONTEND_DIR && npm install"
        echo "  ✓ Frontend 의존성 설치 완료"
    else
        echo "  ✓ Frontend 의존성 이미 존재함"
    fi
fi

# 기존 서비스 중지 및 비활성화 (있다면)
if systemctl is-active --quiet malangee-frontend; then
    echo "  ℹ️  기존 Frontend 서비스 중지 중..."
    systemctl stop malangee-frontend
fi

cat > /etc/systemd/system/malangee-frontend.service <<EOF
[Unit]
Description=MaLangEE Frontend Service (React/Vite)
After=syslog.target network.target

[Service]
User=$USER
WorkingDirectory=$FRONTEND_DIR
# NPM 경로 동적 적용
ExecStart=$NPM_PATH run dev
Restart=always
RestartSec=10
# Node.js 실행을 위한 PATH 설정 필수
Environment=PATH=/usr/bin:/usr/local/bin:$USER_HOME/.nvm/versions/node/v18.0.0/bin
Environment=NODE_ENV=development

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable malangee-frontend
systemctl start malangee-frontend
echo "  ✓ Frontend 서비스 등록 및 시작 완료"

# 4. 상태 확인
echo -e "\n${CYAN}📊 서비스 상태 확인:${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC}"
systemctl status malangee-backend --no-pager | head -n 3
echo ""
echo -e "${YELLOW}AI-Engine:${NC}"
systemctl status malangee-ai --no-pager | head -n 3
echo ""
echo -e "${YELLOW}Frontend:${NC}"
systemctl status malangee-frontend --no-pager | head -n 3

echo -e "\n${GREEN}✓ 모든 서비스가 백그라운드에 등록되었으며, 재부팅 시 자동 실행됩니다.${NC}"
echo "  로그 확인: journalctl -u malangee-backend -f"
