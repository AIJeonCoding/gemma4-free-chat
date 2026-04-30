# gemma-4-free-chatbot

내 장비 없이 한 달 0원으로 24시간 돌아가는 Gemma 4 챗봇.
**Cloudflare Worker + OpenRouter 무료 라우트** 조합으로 GPU도, 폰도, 자체 서버도 필요 없습니다.

## 구조

```
브라우저 → Cloudflare Worker → OpenRouter (:free) → Google Gemma 4 31B
```

- API 키는 Worker에 숨김
- CORS, 모델 화이트리스트도 Worker가 처리
- 같은 Worker에서 챗봇 UI(`/chat`)와 API(`/v1/*`) 둘 다 서빙
- 프론트는 `fetch` 한 줄, 텍스트/이미지 입력 지원

## 빠른 시작 (5분)

### 1. OpenRouter 키 발급
[openrouter.ai/keys](https://openrouter.ai/keys) → Sign in → **Create Key** → `sk-or-v1-...` 복사

### 2. 프로젝트 셋업
```bash
git clone https://github.com/AIJeonCoding/gemma4-free-chat.git
cd gemma4-free-chat
npm install
cp .dev.vars.example .dev.vars
# .dev.vars 열어서 OPENROUTER_KEY=sk-or-v1-... 넣기
```

### 3. 로컬 테스트
```bash
npm run dev
```
브라우저에서 [http://localhost:8787/chat](http://localhost:8787/chat) 접속 → 메시지 전송 → 스트리밍 응답.
Worker URL 입력란은 자동으로 현재 도메인이 채워집니다.

### 4. Cloudflare 배포
```bash
npx wrangler login
npx wrangler secret put OPENROUTER_KEY
npm run deploy
```
배포 끝나면:
- `https://gemma-proxy.<당신아이디>.workers.dev/chat` → 챗봇 UI
- `https://gemma-proxy.<당신아이디>.workers.dev/v1/chat/completions` → API
- 한 워커가 UI + API 둘 다 서빙 (별도 호스팅 불필요)

### 5. 보안 좁히기 (선택)
배포 후 `wrangler.toml`에서 `ALLOWED_ORIGINS`를 본인 도메인으로 변경:
```toml
ALLOWED_ORIGINS = "https://내사이트.com"
```
→ `npm run deploy` 다시.

## 비용

| 항목 | 한도 | 비용 |
|---|---|---|
| OpenRouter `:free` | 일 50건 (무충전) / 일 1000건 ($10 한 번 충전 시) | 토큰 비용 $0 |
| Cloudflare Worker | 일 10만 요청 | $0 |

$10 충전금은 무료 모델 호출에서 차감되지 않습니다. 사이드 프로젝트엔 차고 넘칩니다.

## 지원 모델

기본 화이트리스트 (`src/worker.js` 상단):

- `google/gemma-4-31b-it:free` — 텍스트 + 이미지, 256K
- `google/gemma-4-26b-a4b-it:free` — 텍스트 + 이미지 + 영상(60초)
- 유료 버전 2종 (충전 시)

다른 모델 추가는 `ALLOWED_MODELS` 배열에 모델명 추가 후 재배포.

## 보안 주의

무료 모델은 프롬프트가 학습 데이터로 활용될 수 있습니다 (`:free` 라우트 한정).
- ✅ 사이드 프로젝트, 더미 데이터, 본인 PoC
- ⚠️ 회사 정식 서비스는 유료 모델 또는 Vertex AI 권장

## 호출 예시

```js
const r = await fetch('https://gemma-proxy.<아이디>.workers.dev/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'google/gemma-4-31b-it:free',
    messages: [{ role: 'user', content: '안녕' }],
    stream: true,
  }),
});
```

OpenAI API 호환 포맷이라 기존 OpenAI SDK 그대로 `baseURL`만 바꿔서 사용 가능합니다.

## 라이선스

[MIT](./LICENSE)

## 관련 영상

📺 *(영상 링크 영상 업로드 후 추가)*
