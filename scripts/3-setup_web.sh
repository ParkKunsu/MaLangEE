#!/bin/bash

###############################################
#  Nginx 웹 서버 설정 스크립트 (루트 분기 방식)
#  실행 방법: bash setup_nginx.sh
#  또는: sudo bash setup_nginx.sh (권장)
#
#  설정 내용:
#  ├─ Nginx 설치
#  ├─ Frontend 리버스 프록시 설정 (루트 경로 /)
#  ├─ Backend API 프록시 설정 (/api)
#  ├─ 환경별 .env 파일 자동 생성
#  └─ CORS 설정
#
#  OS: Ubuntu/Debian 기반
###############################################

# 공통 설정 로드
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# 프로젝트 경로
PROJECT_ROOT=$(get_project_path "$DEPLOY_USER" "$GITHUB_REPO")

echo ""
echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║     $PROJECT_NAME Nginx 웹 서버 설정        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Root 권한 확인
if [[ $EUID -ne 0 ]]; then
    print_warning "이 스크립트는 root 권한으로 실행하는 것이 권장됩니다."
    echo "실행 방법: sudo bash setup_nginx.sh"
    echo ""
fi

# 1) Nginx 설치
print_header "1️⃣ Nginx 설치"

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    print_success "Nginx 이미 설치됨: $NGINX_VERSION"
else
    print_info "Nginx 설치 중..."
    if command -v sudo &> /dev/null; then
        sudo apt-get update -y &>/dev/null
        sudo apt-get install -y nginx &>/dev/null
        print_success "Nginx 설치 완료"
    else
        apt-get update -y &>/dev/null
        apt-get install -y nginx &>/dev/null
        print_success "Nginx 설치 완료"
    fi
fi

# 2) 사용자 입력: Frontend/Backend 포트 설정
print_header "2️⃣ Frontend & Backend 포트 설정"

echo -e "${CYAN}로컬에서 실행 중인 서버 정보를 입력하세요.${NC}\n"

# Frontend 설정
read -p "Frontend 포트 (기본값: 3000): " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-"3000"}

read -p "Frontend 호스트 (기본값: localhost): " FRONTEND_HOST
FRONTEND_HOST=${FRONTEND_HOST:-"localhost"}

# Backend 설정
read -p "Backend 포트 (기본값: 8080): " BACKEND_PORT_INPUT
BACKEND_PORT=${BACKEND_PORT_INPUT:-"8080"}

read -p "Backend 호스트 (기본값: localhost): " BACKEND_HOST_INPUT
BACKEND_HOST=${BACKEND_HOST_INPUT:-"localhost"}

# 도메인/IP 설정
read -p "도메인/IP (기본값: 49.50.137.35): " DOMAIN_NAME_INPUT
DOMAIN_NAME=${DOMAIN_NAME_INPUT:-"49.50.137.35"}

echo ""
echo -e "${YELLOW}설정 정보:${NC}"
echo "  • 프로젝트명: $PROJECT_NAME"
echo "  • 서비스명: $SERVICE_NAME"
echo "  • Frontend: http://$FRONTEND_HOST:$FRONTEND_PORT"
echo "  • Backend: http://$BACKEND_HOST:$BACKEND_PORT"
echo "  • Nginx 도메인/IP: $DOMAIN_NAME"
echo ""
echo -e "${CYAN}웹 접속 경로 (루트 분기):${NC}"
echo "  • Frontend: http://$DOMAIN_NAME/"
echo "  • Backend API: http://$DOMAIN_NAME/api"
echo ""

# 3) Nginx 설정 파일 생성
print_header "3️⃣ Nginx 설정 파일 생성"

NGINX_CONFIG="$NGINX_SITES_AVAILABLE/$NGINX_CONFIG_NAME"

print_info "Nginx 설정 파일 생성 중: $NGINX_CONFIG"

# Nginx 설정 파일 작성 (루트 분기 방식)
cat > /tmp/malangee_nginx.conf << 'EOFNGINX'
# MaLangEE Nginx 설정 (루트 분기 방식)
# 구조:
#   / → Frontend (localhost:3000)
#   /api/ → Backend (localhost:8080)

# Frontend 업스트림
upstream frontend_upstream {
    server FRONTEND_HOST:FRONTEND_PORT;
}

# Backend 업스트림
upstream backend_upstream {
    server BACKEND_HOST:BACKEND_PORT;
}

# HTTP 서버
server {
    listen 80;
    server_name DOMAIN_NAME;

    # ================================================
    # Backend API 프록시 (/api/...)
    # ================================================
    location /api/ {
        proxy_pass http://backend_upstream/;
        
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 설정
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' '86400' always;
        
        # OPTIONS 메서드 처리
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # ================================================
    # Frontend 프록시 (루트 경로 /)
    # ================================================
    location / {
        proxy_pass http://frontend_upstream;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # ================================================
    # 정적 파일 캐싱
    # ================================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend_upstream;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # ================================================
    # Gzip 압축
    # ================================================
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_vary on;
}
EOFNGINX

# 변수 치환
sed -i "s|FRONTEND_HOST|$FRONTEND_HOST|g" /tmp/malangee_nginx.conf
sed -i "s|FRONTEND_PORT|$FRONTEND_PORT|g" /tmp/malangee_nginx.conf
sed -i "s|BACKEND_HOST|$BACKEND_HOST|g" /tmp/malangee_nginx.conf
sed -i "s|BACKEND_PORT|$BACKEND_PORT|g" /tmp/malangee_nginx.conf
sed -i "s|DOMAIN_NAME|$DOMAIN_NAME|g" /tmp/malangee_nginx.conf

# 설정 파일 복사
if [[ $EUID -eq 0 ]]; then
    cp /tmp/malangee_nginx.conf "$NGINX_CONFIG"
    chmod 644 "$NGINX_CONFIG"
    print_success "Nginx 설정 파일 생성: $NGINX_CONFIG"
else
    sudo cp /tmp/malangee_nginx.conf "$NGINX_CONFIG"
    sudo chmod 644 "$NGINX_CONFIG"
    print_success "Nginx 설정 파일 생성: $NGINX_CONFIG"
fi

# 4) Nginx 설정 활성화
print_header "4️⃣ Nginx 설정 활성화"

# sites-enabled 심볼릭 링크 생성
if [[ $EUID -eq 0 ]]; then
    ln -sf "$NGINX_CONFIG" "$NGINX_SITES_ENABLED/$NGINX_CONFIG_NAME" 2>/dev/null || true
    rm -f "$NGINX_SITES_ENABLED/default" 2>/dev/null || true
    print_success "Nginx 설정 활성화 완료"
else
    sudo ln -sf "$NGINX_CONFIG" "$NGINX_SITES_ENABLED/$NGINX_CONFIG_NAME" 2>/dev/null || true
    sudo rm -f "$NGINX_SITES_ENABLED/default" 2>/dev/null || true
    print_success "Nginx 설정 활성화 완료"
fi

# 5) Nginx 설정 검증
print_header "5️⃣ Nginx 설정 검증"

if [[ $EUID -eq 0 ]]; then
    nginx -t &>/dev/null
else
    sudo nginx -t &>/dev/null
fi

if [ $? -eq 0 ]; then
    print_success "Nginx 설정 검증 완료 (문법 정상)"
else
    print_error "Nginx 설정에 오류가 있습니다"
    print_warning "설정 파일을 확인하세요: $NGINX_CONFIG"
fi

# 6) Nginx 시작/재시작
print_header "6️⃣ Nginx 시작/재시작"

if [[ $EUID -eq 0 ]]; then
    systemctl start nginx
    systemctl enable nginx
    systemctl reload nginx
    print_success "Nginx 시작 및 활성화 완료"
else
    sudo systemctl start nginx
    sudo systemctl enable nginx
    sudo systemctl reload nginx
    print_success "Nginx 시작 및 활성화 완료"
fi

# 7) 상태 확인
print_header "7️⃣ Nginx 상태 확인"

if [[ $EUID -eq 0 ]]; then
    systemctl status nginx --no-pager | head -5
else
    sudo systemctl status nginx --no-pager | head -5
fi

# 8) 설치 완료 요약
print_header "8️⃣ 설치 완료 요약"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✓ Nginx 설정 완료!                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}📝 설정 정보:${NC}"
echo "  • Nginx 설정 파일: $NGINX_CONFIG"
echo "  • 도메인/IP: $DOMAIN_NAME"
echo "  • 프로젝트 경로: $PROJECT_PATH"
echo ""

echo -e "${CYAN}🌐 웹 접속 정보:${NC}"
echo ""
echo "  Frontend:"
echo "    • 주소: http://$DOMAIN_NAME$PROJECT_PATH"
echo "    • 내부: http://$FRONTEND_HOST:$FRONTEND_PORT"
echo ""
echo "  Backend API:"
echo "    • 주소: http://$DOMAIN_NAME$PROJECT_PATH/api"
echo "    • 내부: http://$BACKEND_HOST:$BACKEND_PORT"
echo ""

echo -e "${CYAN}🚀 다음 단계:${NC}"
echo ""
echo "  1️⃣ Frontend 시작 (다른 터미널):"
echo "     cd $PROJECT_ROOT/frontend"
echo "     npm run dev"
echo ""
echo "  2️⃣ Backend 시작 (다른 터미널):"
echo "     cd $PROJECT_ROOT/backend"
echo "     mvn spring-boot:run"
echo ""
echo "  3️⃣ 웹 브라우저에서 접속 (루트 분기):"
echo "     Frontend: http://localhost:3000"
echo "     Backend API: http://localhost:$BACKEND_PORT/api"
echo ""

echo ""
echo -e "${CYAN}🌐 배포 후 웹 접속:${NC}"
echo ""
echo "  Frontend: http://$DOMAIN_NAME/"
echo "  Backend API: http://$DOMAIN_NAME/api"
echo ""

echo -e "${CYAN}⚙️ 유용한 명령어:${NC}"
echo ""
echo "  Nginx 상태 확인:"
echo "    sudo systemctl status nginx"
echo ""
echo "  Nginx 재시작:"
echo "    sudo systemctl restart nginx"
echo ""
echo "  Nginx 로그 확인:"
echo "    sudo tail -f /var/log/nginx/access.log"
echo "    sudo tail -f /var/log/nginx/error.log"
echo ""
echo "  Nginx 설정 수정:"
echo "    sudo nano $NGINX_CONFIG"
echo ""
echo "  설정 검증 후 재시작:"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""

echo -e "${CYAN}📌 주의사항:${NC}"
echo ""
echo "  ⚠ Frontend와 Backend가 실행 중이어야 합니다"
echo "  ⚠ 포트 80이 사용 가능해야 합니다"
echo "  ⚠ 공인 IP 사용 시 방화벽에서 포트 80 허용 필요"
echo ""
echo "  구조:"
echo "    / → Frontend (localhost:$FRONTEND_PORT)"
echo "    /api → Backend (localhost:$BACKEND_PORT)"
echo ""

echo -e "${GREEN}✓ Nginx 웹 서버 설정 완료!${NC}\n"
