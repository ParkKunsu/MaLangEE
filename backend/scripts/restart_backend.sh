#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Backend 서비스 재시작 스크립트 시작...${NC}"

# 1. 서비스 중지 시도
echo -e "${YELLOW}[1/4] 서비스 종료 요청 (systemctl stop)...${NC}"
sudo systemctl stop malangee-backend

# 2. 포트 8080 점유 프로세스 확인 및 강제 종료
echo -e "${YELLOW}[2/4] 포트 8080 잔여 프로세스 확인...${NC}"
# PID 추출
PID=$(sudo netstat -tulpn | grep :8080 | awk '{print $7}' | cut -d'/' -f1)

if [ ! -z "$PID" ]; then
    echo -e "${RED}⚠️  멈춘 프로세스 발견 (PID: $PID). 강제 종료합니다...${NC}"
    sudo kill -9 $PID
    sleep 1
    echo -e "${GREEN}✓ 프로세스 종료 완료${NC}"
else
    echo -e "${GREEN}✓ 포트 8080 깨끗함${NC}"
fi

# 3. 서비스 시작
echo -e "${YELLOW}[3/4] 서비스 시작 (systemctl start)...${NC}"
sudo systemctl start malangee-backend

# 4. 상태 확인
echo -e "${YELLOW}[4/4] 상태 및 로그 확인...${NC}"
sleep 2

# 서비스 상태 확인
if systemctl is-active --quiet malangee-backend; then
    echo -e "${GREEN}✅ Backend 서비스가 정상적으로 실행 중입니다!${NC}"
    echo "---------------------------------------------------"
    sudo systemctl status malangee-backend --no-pager | head -n 5
    echo "---------------------------------------------------"
    echo -e "${YELLOW}📋 최근 로그 (마지막 10줄):${NC}"
    sudo journalctl -u malangee-backend -n 10 --no-pager
else
    echo -e "${RED}❌ 서비스 시작 실패. 로그를 확인하세요.${NC}"
    sudo journalctl -u malangee-backend -n 20 --no-pager
    exit 1
fi
