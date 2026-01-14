#!/bin/bash

###############################################
#  MaLangEE 통합 배포 스크립트
#  실행 방법: ./deploy.sh [옵션]
#
#  사용자: aimaster (개발자)
#  
#  기능:
#  1. Git Pull (코드 업데이트)
#  2. Backend 빌드
#  3. Frontend 의존성 설치 (NPM)
#  4. 서비스 재시작 (Systemd)
#
#  옵션:
#  all       : 전체 배포 (Git Pull + Build + Restart)
#  backend   : Backend만 배포
#  frontend  : Frontend만 배포
#  ai        : AI-Engine만 배포
#  restart   : 서비스 재시작만 수행
###############################################

# 프로젝트 경로
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
AI_DIR="$PROJECT_ROOT/ai-engine"
USER="aimaster"
HOME_DIR="/home/$USER"

# GitHub 설정
GITHUB_REPO="https://github.com/MaLangEECoperation/MaLangEE.git"
REPO_NAME=$(basename "$GITHUB_REPO" .git)
BRANCH="main"

# 로그 파일
LOG_FILE="/var/log/${REPO_NAME}_deploy.log"

# 색상 정의
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 사용법 출력
usage() {
    echo -e "${CYAN}사용법: $0 [옵션]${NC}"
    echo "옵션:"
    echo "  all       : 전체 배포 (Git Pull + Build + Restart)"
    echo "  backend   : Backend만 배포"
    echo "  frontend  : Frontend만 배포"
    echo "  ai        : AI-Engine만 배포"
    echo "  restart   : 서비스 재시작만 수행"
    echo ""
    exit 1
}

# 인자 확인
if [ $# -eq 0 ]; then
    usage
fi

TARGET=$1

# 로그 기록
echo "======================================" | tee -a $LOG_FILE
echo "   $REPO_NAME Deployment Started" | tee -a $LOG_FILE
echo "   $(date)" | tee -a $LOG_FILE
echo "======================================" | tee -a $LOG_FILE

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        MaLangEE 배포 스크립트          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "대상: $TARGET"
echo ""

# 프로젝트 폴더 확인
if [ ! -d "$PROJECT_ROOT" ]; then
    echo "[ERROR] 프로젝트 폴더를 찾을 수 없습니다: $PROJECT_ROOT" | tee -a $LOG_FILE
    exit 1
fi

cd "$PROJECT_ROOT" || exit 1

# 1. Git Pull
if [[ "$TARGET" == "all" || "$TARGET" == "git" ]]; then
    echo -e "${GREEN}1️⃣ Git Pull (코드 업데이트)${NC}"
    echo "[INFO] Git pull 실행" | tee -a $LOG_FILE
    
    if [ -d ".git" ]; then
        git fetch --all | tee -a $LOG_FILE
        git checkout $BRANCH | tee -a $LOG_FILE
        git pull origin $BRANCH | tee -a $LOG_FILE
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Git Pull 실패!${NC}"
            echo "[ERROR] Git Pull 실패" | tee -a $LOG_FILE
            exit 1
        fi
        echo -e "${GREEN}✓ Git Pull 완료${NC}"
    else
        echo -e "${YELLOW}⚠ Git 저장소가 아닙니다. Git Pull을 건너뜁니다.${NC}"
    fi
    echo ""
fi

# 2. Frontend 빌드
if [[ "$TARGET" == "all" || "$TARGET" == "frontend" ]]; then
    echo -e "${GREEN}2️⃣ Frontend 빌드 (React/Vite)${NC}"
    echo "[INFO] React 빌드 시작" | tee -a $LOG_FILE
    
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR" || exit 1
        

        # npm install (타임아웃 설정: 5분)
        echo "[INFO] npm install 실행 중... (최대 5분)" | tee -a $LOG_FILE
        timeout 300 npm install 2>&1 | tee -a $LOG_FILE
        INSTALL_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $INSTALL_EXIT_CODE -eq 124 ]; then
            echo -e "${RED}✗ Frontend 의존성 설치 타임아웃! (5분 초과)${NC}"
            echo "[ERROR] Frontend npm install 타임아웃" | tee -a $LOG_FILE
            cd "$PROJECT_ROOT" || exit 1
            exit 1
        elif [ $INSTALL_EXIT_CODE -ne 0 ]; then
            echo -e "${RED}✗ Frontend 의존성 설치 실패!${NC}"
            echo "[ERROR] Frontend npm install 실패 (exit code: $INSTALL_EXIT_CODE)" | tee -a $LOG_FILE
            cd "$PROJECT_ROOT" || exit 1
            exit 1
        fi
        
        # npm build (타임아웃 설정: 5분)
        echo "[INFO] npm run build 실행 중... (최대 5분)" | tee -a $LOG_FILE
        timeout 300 npm run build 2>&1 | tee -a $LOG_FILE
        BUILD_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $BUILD_EXIT_CODE -eq 124 ]; then
            echo -e "${RED}✗ Frontend 빌드 타임아웃! (5분 초과)${NC}"
            echo "[ERROR] Frontend npm build 타임아웃" | tee -a $LOG_FILE
            cd "$PROJECT_ROOT" || exit 1
            exit 1
        elif [ $BUILD_EXIT_CODE -ne 0 ]; then
            echo -e "${RED}✗ Frontend 빌드 실패!${NC}"
            echo "[ERROR] Frontend npm build 실패 (exit code: $BUILD_EXIT_CODE)" | tee -a $LOG_FILE
            cd "$PROJECT_ROOT" || exit 1
            exit 1
        fi
        
        echo -e "${GREEN}✓ Frontend 빌드 완료${NC}"
        cd "$PROJECT_ROOT" || exit 1
    else
        echo -e "${YELLOW}⚠ Frontend 폴더가 없습니다: $FRONTEND_DIR${NC}"
        echo "[WARN] Frontend 폴더 없음: $FRONTEND_DIR" | tee -a $LOG_FILE
    fi
    echo ""
fi

# 3. Backend 빌드
if [[ "$TARGET" == "all" || "$TARGET" == "backend" ]]; then
    echo -e "${GREEN}3️⃣ Backend 빌드 ${NC}"
    echo "[INFO] 빌드 시작" | tee -a $LOG_FILE
    
    if [ -d "$BACKEND_DIR" ]; then
        cd "$BACKEND_DIR" || exit 1
        
        # Unified Build: Backend에서 Poetry Install (AI Engine 포함)
        echo "[INFO] Unified Dependency Install (Poetry)" | tee -a $LOG_FILE
        
        if [ -f "pyproject.toml" ]; then
            poetry config virtualenvs.in-project true
            
            # 1차 시도: 일반 설치 (출력을 캡처하여 경고 메시지 확인)
            INSTALL_OUTPUT=$(poetry install 2>&1)
            INSTALL_EXIT_CODE=$?
            
            # 결과를 화면과 로그에 출력
            echo "$INSTALL_OUTPUT" | tee -a $LOG_FILE
            
            # 실패했거나, Lock 파일 호환성 경고가 있는 경우 재시도
            if [ $INSTALL_EXIT_CODE -ne 0 ] || [[ "$INSTALL_OUTPUT" == *"The lock file might not be compatible"* ]]; then
                echo -e "${YELLOW}⚠ Lock 파일 호환성 문제 또는 설치 오류 감지. 갱신 후 재시도...${NC}"
                echo "[INFO] poetry lock 갱신 및 재설치 실행..." | tee -a $LOG_FILE
                
                poetry lock
                poetry install
            fi
        else
            echo -e "${YELLOW}⚠ pyproject.toml이 없습니다.${NC}"
        fi
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ 의존성 설치 최종 실패!${NC}"
            echo "[ERROR] poetry install 실패" | tee -a $LOG_FILE
            exit 1
        fi
        
        echo -e "${GREEN}✓ Backend 및 AI-Engine 의존성 설치 완료${NC}"
        cd "$PROJECT_ROOT" || exit 1
    else
        echo -e "${YELLOW}⚠ Backend 폴더가 없습니다: $BACKEND_DIR${NC}"
    fi
    echo ""
fi


# 4. AI-Engine 업데이트
if [[ "$TARGET" == "all" || "$TARGET" == "ai" ]]; then
    echo -e "${GREEN}4️⃣ AI-Engine 업데이트 (Python)${NC}"
    echo "[INFO] Python AI 엔진 업데이트" | tee -a $LOG_FILE
    
    if [ -d "$AI_DIR" ]; then
        # Unified Build에서 이미 의존성 설치됨
        echo -e "${GREEN}✓ AI-Engine 준비 완료 (Unified Build)${NC}"
    else
        echo -e "${YELLOW}⚠ AI-Engine 폴더가 없습니다: $AI_DIR${NC}"
    fi
    echo ""
fi

# 5. 서비스 재시작
if [[ "$TARGET" == "all" || "$TARGET" == "restart" ]]; then
    echo -e "${GREEN}5️⃣ 서비스 재시작${NC}"
    
    echo "  • Backend 재시작 중..."
    sudo systemctl restart malangee-backend
    if [ $? -eq 0 ]; then
        echo "[INFO] Backend 재시작 성공" | tee -a $LOG_FILE
    else
        echo "[ERROR] Backend 재시작 실패" | tee -a $LOG_FILE
    fi
    
    echo "  • Frontend 재시작 중..."
    sudo systemctl restart malangee-frontend
    if [ $? -eq 0 ]; then
        echo "[INFO] Frontend 재시작 성공" | tee -a $LOG_FILE
    else
        echo "[ERROR] Frontend 재시작 실패" | tee -a $LOG_FILE
    fi
    
    echo "  • AI-Engine 재시작 중..."
    sudo systemctl restart malangee-ai
    if [ $? -eq 0 ]; then
        echo "[INFO] AI-Engine 재시작 성공" | tee -a $LOG_FILE
    else
        echo "[ERROR] AI-Engine 재시작 실패" | tee -a $LOG_FILE
    fi
    echo ""
fi

# 6. 상태 확인
echo -e "${CYAN}📊 서비스 상태 확인:${NC}"
echo ""

if [[ "$TARGET" == "all" || "$TARGET" == "restart" ]]; then
    echo "Backend 상태:"
    sudo systemctl status malangee-backend --no-pager | head -n 3
    echo ""
    
    echo "Frontend 상태:"
    sudo systemctl status malangee-frontend --no-pager | head -n 3
    echo ""
    
    echo "AI-Engine 상태:"
    sudo systemctl status malangee-ai --no-pager | head -n 3
    echo ""
fi

echo -e "${GREEN}✓ 배포 완료!${NC}"
echo "======================================" | tee -a $LOG_FILE
echo "   $REPO_NAME Deployment Completed" | tee -a $LOG_FILE
echo "   $(date)" | tee -a $LOG_FILE
echo "======================================" | tee -a $LOG_FILE
