# 코드 스타일 및 컨벤션

## TypeScript 컨벤션
- **경로 별칭**: `@/*` → `./src/*`
- **컴포넌트**: `import { FC } from 'react'` 사용 (React.FC 대신)
- **타입 정의**: Zod 스키마 우선, 타입 추론 활용
- **Interface vs Type**: Type alias 선호

## Prettier 설정
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

## Tailwind CSS 4 패턴
- **테마 색상**: `--color-brand` 등 CSS 변수 사용
- **OKLCH 색상 시스템**: 일관된 색상 관리
- **shadcn/ui 확장**: `cva` 패턴으로 variant 관리

## 린트 에러 수정 패턴
- ❌ Empty interface → ✅ Type alias
- ❌ useEffect 내 setState → ✅ 파생 상태
- 명시적 import 사용 (`ComponentType` vs `React.ComponentType`)

## 네이밍 컨벤션
- **컴포넌트**: PascalCase
- **파일명**: kebab-case (폴더), PascalCase (컴포넌트)
- **함수/변수**: camelCase
- **타입/인터페이스**: PascalCase
