#!/bin/bash

###############################################
#  MaLangEE 테스트 프로젝트 생성 스크립트 (React + Spring Boot)
#  실행 방법: sudo bash 4-setup_test_project.sh
#
#  구성:
#  1. Frontend: React + Vite (Port 3000)
#  2. Backend: Java Spring Boot (Port 8080)
#  3. AI-Engine: Python Simple Server (Port 5000)
###############################################

# 공통 설정 로드
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# 프로젝트 경로
PROJECT_ROOT=$(get_project_path "$DEPLOY_USER" "$GITHUB_REPO")
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
AI_DIR="$PROJECT_ROOT/ai-engine"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   React + Spring Boot 프로젝트 생성    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"

# 1. 디렉토리 생성
echo -e "\n${GREEN}1️⃣ 디렉토리 생성 중...${NC}"

mkdir -p "$PROJECT_ROOT"
mkdir -p "$FRONTEND_DIR/src"
mkdir -p "$FRONTEND_DIR/public"
mkdir -p "$BACKEND_DIR/src/main/java/com/malangee/backend/controller"
mkdir -p "$BACKEND_DIR/src/main/resources"
mkdir -p "$AI_DIR"

echo "  ✓ 디렉토리 구조 생성 완료"

# 2. Frontend (React + Vite) 생성
echo -e "\n${GREEN}2️⃣ Frontend (React) 파일 생성 중...${NC}"

# package.json
cat > "$FRONTEND_DIR/package.json" <<EOF
{
  "name": "malangee-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.0"
  }
}
EOF

# vite.config.js
cat > "$FRONTEND_DIR/vite.config.js" <<EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})
EOF

# index.html
cat > "$FRONTEND_DIR/index.html" <<EOF
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MaLangEE React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# src/main.jsx
cat > "$FRONTEND_DIR/src/main.jsx" <<EOF
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# src/App.jsx
cat > "$FRONTEND_DIR/src/App.jsx" <<EOF
import { useState, useEffect } from 'react'

function App() {
  const [backendStatus, setBackendStatus] = useState('연결 확인 중...')
  const [aiStatus, setAiStatus] = useState('연결 확인 중...')

  // 현재 브라우저가 접속한 호스트(IP 또는 도메인)를 가져옴
  const host = window.location.hostname;

  useEffect(() => {
    // Backend Check (Port 8080)
    fetch(\`http://\${host}:8080/api/health\`)
      .then(res => res.text())
      .then(data => setBackendStatus(data))
      .catch(err => setBackendStatus('연결 실패 (Backend가 꺼져있거나 CORS 문제)'))

    // AI Engine Check (Port 5000)
    fetch(\`http://\${host}:5000\`)
      .then(res => res.text())
      .then(data => setAiStatus(data))
      .catch(err => setAiStatus('연결 실패 (AI Engine이 꺼져있거나 CORS 문제)'))
  }, [host])

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#61dafb' }}>🚀 MaLangEE React Frontend</h1>
      <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}>
        <h3>시스템 상태 모니터링</h3>
        <p><strong>접속 호스트:</strong> {host}</p>
        <p><strong>Backend (Spring Boot):</strong> {backendStatus}</p>
        <p><strong>AI Engine (Python):</strong> {aiStatus}</p>
      </div>
    </div>
  )
}

export default App
EOF

echo "  ✓ React 프로젝트 파일 생성 완료"

# 3. Backend (Spring Boot) 생성
echo -e "\n${GREEN}3️⃣ Backend (Spring Boot) 파일 생성 중...${NC}"

# pom.xml
cat > "$BACKEND_DIR/pom.xml" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.malangee</groupId>
    <artifactId>backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>backend</name>
    <description>MaLangEE Backend</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
EOF

# Application.java
cat > "$BACKEND_DIR/src/main/java/com/malangee/backend/BackendApplication.java" <<EOF
package com.malangee.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
EOF

# HealthController.java (CORS 설정 포함)
cat > "$BACKEND_DIR/src/main/java/com/malangee/backend/controller/HealthController.java" <<EOF
package com.malangee.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // 테스트용 모든 출처 허용
public class HealthController {

    @GetMapping("/health")
    public String healthCheck() {
        return "Backend 정상 작동 중 (Spring Boot)";
    }
}
EOF

# application.properties
cat > "$BACKEND_DIR/src/main/resources/application.properties" <<EOF
server.port=8080
EOF

echo "  ✓ Spring Boot 프로젝트 파일 생성 완료"

# 4. AI-Engine (Python) 생성
echo -e "\n${GREEN}4️⃣ AI-Engine (Python) 파일 생성 중...${NC}"

cat > "$AI_DIR/app.py" <<EOF
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        SimpleHTTPRequestHandler.end_headers(self)

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        # 한글 출력을 위해 encode('utf-8') 사용
        self.wfile.write('AI Engine 정상 작동 중 (Python)'.encode('utf-8'))

PORT = 5000
print(f"Starting AI Engine on port {PORT}...")
httpd = HTTPServer(('0.0.0.0', PORT), CORSRequestHandler)
httpd.serve_forever()
EOF

echo "  ✓ Python 서버 스크립트 생성 완료"

# 5. 권한 설정
echo -e "\n${GREEN}5️⃣ 권한 설정 (Owner: $USER)${NC}"
chown -R $USER:$USER "$PROJECT_ROOT"
echo "  ✓ 소유권 변경 완료"

# 6. 실행 안내
echo -e "\n${CYAN}🚀 프로젝트 실행 방법:${NC}"
echo "각 터미널을 열어서 아래 명령어를 순서대로 실행하세요."
echo ""
echo -e "${YELLOW}[Terminal 1] Frontend (React) 실행${NC}"
echo "  cd $FRONTEND_DIR"
echo "  npm install"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}[Terminal 2] Backend (Spring Boot) 실행${NC}"
echo "  cd $BACKEND_DIR"
echo "  mvn spring-boot:run"
echo ""
echo -e "${YELLOW}[Terminal 3] AI-Engine 실행${NC}"
echo "  cd $AI_DIR"
echo "  python3 app.py"
echo ""
echo -e "${CYAN}🌐 접속 주소:${NC}"
echo "  http://localhost:3000"
