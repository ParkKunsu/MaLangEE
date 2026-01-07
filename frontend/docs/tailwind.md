# Tailwind CSS v4 가이드

말랭이 프로젝트의 Tailwind CSS v4 설정 및 디자인 시스템 가이드입니다.

## 설정 파일

Tailwind CSS v4는 CSS 기반 설정을 사용합니다. 모든 설정은 `src/app/globals.css`에 정의되어 있습니다.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* 테마 변수 정의 */
}
```

## 디자인 시스템 색상

### Primary Scale (Purple)

버튼, 포인트 컬러로 사용되는 보라색 계열입니다.

| 변수 | 값 | 용도 |
|------|-----|------|
| `primary-900` | `#5F51D9` | 가장 진한 보라 |
| `primary-800` | `#6F60EB` | 다크모드 액센트 |
| `primary-700` | `#7B6CF6` | 기본 primary 색상 |
| `primary-600` | `#B6AEFF` | 라이트 포인트 |
| `primary-500` | `#C9C5F3` | 가장 연한 보라 |

```tsx
<button className="bg-primary-700 hover:bg-primary-800">
  버튼
</button>
```

### Gray Scale (Purple tone)

보라색 톤이 가미된 그레이 스케일입니다.

| 변수 | 값 | 용도 |
|------|-----|------|
| `gray-900` | `#1F1C2B` | 타이틀, 다크모드 배경 |
| `gray-800` | `#2B2F35` | 다크모드 카드 배경 |
| `gray-700` | `#4A4658` | 다크모드 보더 |
| `gray-600` | `#6A667A` | 라이트모드 muted 텍스트 |
| `gray-500` | `#8B879B` | 비활성 텍스트 |
| `gray-400` | `#A9A6B5` | 다크모드 muted 텍스트 |
| `gray-300` | `#D5D2DE` | 구분선 |
| `gray-200` | `#ECEAF2` | 라이트모드 보더 |
| `gray-100` | `#F5F4F9` | 라이트모드 secondary 배경 |
| `gray-70` | `#FAF9FD` | 사이드바 배경 |
| `gray-50` | `#FDFDFF` | 다크모드 텍스트 |

```tsx
<p className="text-gray-900 dark:text-gray-50">
  텍스트
</p>
```

### Dim Colors

오버레이에 사용되는 반투명 색상입니다.

| 변수 | 값 | 용도 |
|------|-----|------|
| `dim` | `rgba(0, 0, 0, 0.7)` | 강한 오버레이 |
| `dim-light` | `rgba(0, 0, 0, 0.4)` | 약한 오버레이 |

```tsx
<div className="bg-dim">
  <Modal />
</div>
```

## 시맨틱 색상

shadcn/ui와 호환되는 시맨틱 색상 변수입니다.

| 변수 | 라이트모드 | 다크모드 | 용도 |
|------|-----------|---------|------|
| `background` | `#FFFFFF` | `#1F1C2B` | 페이지 배경 |
| `foreground` | `#1F1C2B` | `#FDFDFF` | 기본 텍스트 |
| `primary` | `#7B6CF6` | `#7B6CF6` | 주요 액션 |
| `secondary` | `#F5F4F9` | `#4A4658` | 보조 배경 |
| `muted` | `#F5F4F9` | `#4A4658` | 비활성 배경 |
| `muted-foreground` | `#6A667A` | `#A9A6B5` | 비활성 텍스트 |
| `accent` | `#B6AEFF` | `#6F60EB` | 강조 |
| `destructive` | oklch 기반 | oklch 기반 | 삭제/위험 |
| `border` | `#ECEAF2` | `#4A4658` | 테두리 |
| `input` | `#ECEAF2` | `#4A4658` | 입력 필드 테두리 |
| `ring` | `#7B6CF6` | `#7B6CF6` | 포커스 링 |

```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    버튼
  </button>
</div>
```

## 그라디언트 유틸리티

### 기본 그라디언트

```tsx
// 핑크 → 파랑
<div className="gradient-primary" />

// 핑크 → 파랑 → 노랑
<div className="gradient-primary-extended" />

// 따뜻한 톤 (노랑 → 핑크)
<div className="gradient-warm" />

// 시원한 톤 (핑크 → 파랑)
<div className="gradient-cool" />

// 생동감 있는 (보라 → 핑크 → 오렌지)
<div className="gradient-vibrant" />

// 부드러운 (연보라)
<div className="gradient-soft" />

// 블러쉬 (연분홍 → 연보라)
<div className="gradient-blush" />
```

### 그라디언트 색상값

| 클래스 | 색상값 |
|--------|--------|
| `gradient-primary` | `#F6D7FF → #DCE9FF` |
| `gradient-primary-extended` | `#F6D7FF → #DCE9FF → #FFFDE2` |
| `gradient-warm` | `#FFFCDC → #FFD8FC` |
| `gradient-cool` | `#F6D7FF → #DCE9FF` |
| `gradient-vibrant` | `#A770EF → #CF8BF3 → #FDB99B` |
| `gradient-soft` | `#F3EFFF → #EAD7F8` |
| `gradient-blush` | `#FADADD → #E6D9FF` |

## Border Radius

CSS 변수 `--radius`를 기준으로 상대적인 크기가 정의됩니다. 기본값은 `0.625rem` (10px)입니다.

| 변수 | 계산식 | 기본값 |
|------|--------|--------|
| `radius-sm` | `--radius - 4px` | 6px |
| `radius-md` | `--radius - 2px` | 8px |
| `radius-lg` | `--radius` | 10px |
| `radius-xl` | `--radius + 4px` | 14px |
| `radius-2xl` | `--radius + 8px` | 18px |
| `radius-3xl` | `--radius + 12px` | 22px |
| `radius-4xl` | `--radius + 16px` | 26px |

```tsx
<div className="rounded-lg">기본 라운드</div>
<div className="rounded-2xl">큰 라운드</div>
```

## 다크모드

`dark` 클래스를 통해 다크모드가 적용됩니다.

```tsx
// 자동 전환
<div className="bg-background text-foreground">
  라이트/다크 자동 적용
</div>

// 수동 지정
<div className="bg-white dark:bg-gray-900">
  명시적 다크모드
</div>
```

### 다크모드 토글 구현 예시

```tsx
const toggleDarkMode = () => {
  document.documentElement.classList.toggle("dark");
};
```

## 사용 예시

### 카드 컴포넌트

```tsx
<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-card-foreground">
    카드 타이틀
  </h3>
  <p className="mt-2 text-muted-foreground">
    카드 설명 텍스트
  </p>
</div>
```

### 버튼 스타일

```tsx
// Primary 버튼
<button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-800">
  Primary
</button>

// Secondary 버튼
<button className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-gray-200">
  Secondary
</button>

// 그라디언트 버튼
<button className="gradient-vibrant rounded-lg px-4 py-2 text-white">
  Gradient
</button>
```

### 입력 필드

```tsx
<input
  type="text"
  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
  placeholder="입력하세요"
/>
```

## Chart 색상

차트 라이브러리(Recharts)에서 사용할 수 있는 색상 변수입니다.

| 변수 | 라이트 | 다크 |
|------|--------|------|
| `chart-1` | `#7B6CF6` | `#7B6CF6` |
| `chart-2` | `#B6AEFF` | `#B6AEFF` |
| `chart-3` | `#F6D7FF` | `#6F60EB` |
| `chart-4` | `#DCE9FF` | `#5F51D9` |
| `chart-5` | `#FFFDE2` | `#C9C5F3` |

```tsx
<AreaChart data={data}>
  <Area
    dataKey="value"
    fill="var(--chart-1)"
    stroke="var(--chart-1)"
  />
</AreaChart>
```

## Sidebar 색상

사이드바 전용 색상 변수입니다.

| 변수 | 라이트 | 다크 |
|------|--------|------|
| `sidebar` | `#FAF9FD` | `#2B2F35` |
| `sidebar-foreground` | `#1F1C2B` | `#FDFDFF` |
| `sidebar-primary` | `#7B6CF6` | `#7B6CF6` |
| `sidebar-accent` | `#F5F4F9` | `#4A4658` |
| `sidebar-border` | `#ECEAF2` | `#4A4658` |

```tsx
<aside className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
  <nav>
    <a className="hover:bg-sidebar-accent">메뉴 1</a>
  </nav>
</aside>
```

## 참고 자료

- [Tailwind CSS v4 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [이너써클 Figma 디자인 시스템](https://www.figma.com/design/Fl5FSDITnfaalJhepW2p1d/)
