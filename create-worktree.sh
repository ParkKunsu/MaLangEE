#!/bin/bash

if [ $# -eq 0 ]; then
	echo "Error: 워크트리 이름을 입력해주세요!"
	return 1
fi

# 첫 번째 아규먼트를 워크트리 이름으로 받기
ARGUMENT=$1
WORKTREE_PATH="../worktree/$ARGUMENT"

# 워크트리 생성하고 성공하면 현재 위치 변경
if git worktree add "$WORKTREE_PATH"; then
	echo "워크트리 생성 성공: $WORKTREE_PATH"
	# .mcp.json 파일을 워크트리로 복사
	if [ -f "./frontend/.mcp.json" ]; then
		cp "./frontend/.mcp.json" "$WORKTREE_PATH/frontend/.mcp.json"
		echo ".mcp.json 파일 복사 완료"
	fi
	if [ -f "./frontend/.env.local" ]; then
		cp "./frontend/.env.local" "$WORKTREE_PATH/frontend/.env.local"
		echo ".env.local 파일 복사 완료"
	fi
	if [ -f "./frontend/.env.test.local" ]; then
		cp "./frontend/.env.test.local" "$WORKTREE_PATH/frontend/.env.test.local"
		echo ".env.test.local 파일 복사 완료"
	fi
	cd "$WORKTREE_PATH" || return 1
	echo "디렉터리 변경 완료 $(pwd)"
	cd frontend
	yarn
	cd ..
	cursor .
else
	echo "워크트리 생성에 실패했습니다."
	return 1
fi
