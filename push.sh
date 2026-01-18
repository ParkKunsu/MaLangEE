#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 커밋 메시지 확인
COMMIT_MSG="$*"

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${YELLOW}커밋 메시지가 입력되지 않았습니다.${NC}"
    echo -n "커밋 메시지를 입력하세요 (기본값: 'update'): "
    read input_msg
    if [ -z "$input_msg" ]; then
        COMMIT_MSG="update"
    else
        COMMIT_MSG="$input_msg"
    fi
fi

echo -e "${YELLOW}🚀 Git Push 프로세스 시작...${NC}"

# 1. 상태 확인
git status
echo ""

# 2. 푸시
echo -e "${YELLOW}[1/1] 원격 저장소로 푸시 (git push origin main)${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git Push 완료!${NC}"
else
    echo -e "${RED}❌ Git Push 실패. 권한(403)이나 충돌을 확인하세요.${NC}"
    exit 1
fi
