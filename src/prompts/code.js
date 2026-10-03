// src/prompts/code.js
// 30 prompt Lap trinh - tu co ban den nang cao, da ngon ngu

export const CODE = [
  {
    id: 'code-01',
    cat: 'code',
    title: 'Giai thich doan code',
    desc: 'Muc dich, luong chay tung buoc va cac cho de gay loi. Co goi y cai thien.',
    tags: ['hoc code', 'chi tiet'],
    prompt: `Ban la senior developer dang huong dan junior doc hieu code.

NGON NGU: {{ngon ngu}}
TRINH DO NGUOI DOC: {{trinh do}}

CODE:
{{code}}

YEU CAU:

1. MUC DICH TONG QUAN
   - Doan code nay lam gi? (1-2 cau)
   - Dung trong ngu canh nao?

2. LUONG CHAY TUNG BUOC
   - Danh so tung buoc chinh.
   - Giai thich bien, ham duoc dung.

3. DIEM DE GAY LOI
   - 2-3 cho de sai hoac kho hieu.
   - Vi sao de sai. Cach tranh.

4. GOI Y CAI THIEN
   - Co the viet gon hon khong?
   - Cau truc du lieu/thuat toan tot hon?
   - Dat ten bien/ham ro rang?

5. PHIEN BAN CAI TIEN (neu co)
   - Viet lai code voi cai tien.
   - Chu thich cac thay doi.

DINH DANG:
- Giai thich bang tieng Viet, giu thuat ngu tieng Anh.`,
    long: true,
  },
  {
    id: 'code-02',
    cat: 'code',
    title: 'Tim va sua loi',
    desc: 'Nguyen nhan, ban sua toi thieu va cach tranh lap lai. Co phan tich root cause.',
    tags: ['debug', 'chi tiet'],
    prompt: `Ban la senior developer chuyen debug. Hay giup tim va sua loi.

NGON NGU: {{ngon ngu}}
MO TA LOI: {{mo ta loi}}
THONG BAO LOI: {{thong bao loi}}

CODE:
{{code}}

YEU CAU:

1. XAC DINH NGUYEN NHAN GOC
   - Loi nam o dong nao?
   - Vi sao loi xay ra? (logic, cu phap, moi truong, dependency)
   - Neu co nhieu nguyen nhan, xep theo kha nang.

2. BAN SUA TOI THIEU
   - Chi sua phan can thiet.
   - Giai thich tung thay doi.
   - Dua code da sua hoan chinh.

3. KIEM TRA LAI
   - Cach test de xac nhan da sua dung.
   - Edge case can chu y.

4. CACH TRANH LAP LAI
   - Loi nay thuoc loai gi? (off-by-one, null check, race condition)
   - Cach phong tranh (linting, testing, code review).

5. BAN CAI TIEN (tuy chon)

DINH DANG:
- Diff ro rang giua code cu va moi.`,
    long: true,
  },
  {
    id: 'code-03',
    cat: 'code',
    title: 'Viet component React',
    desc: 'Truy cap duoc bang ban phim, ho tro sang/toi, khong phu thuoc thu vien.',
    tags: ['React', 'chi tiet'],
    prompt: `Ban la React developer co kinh nghiem ve accessibility va performance.

YEU CAU COMPONENT: {{mo ta}}

RANG BUOC KY THUAT:
- Function component + hooks.
- Khong dung thu vien ngoai.
- Ho tro light/dark theme qua CSS variables.
- Responsive (mobile-first).
- Truy cap duoc bang ban phim.
- Co ARIA labels day du.

YEU CAU DAU RA:

1. COMPONENT CODE (day du, chay duoc).
2. CSS (dung CSS variables, khong !important).
3. VI DU SU DUNG.
4. TEST CASE GOI Y (5 test voi React Testing Library).
5. GHI CHU ACCESSIBILITY.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-04',
    cat: 'code',
    title: 'Don va toi uu CSS',
    desc: 'Tim selector xung dot, gia tri lap thanh bien, phan khong dung.',
    tags: ['CSS', 'chi tiet'],
    prompt: `Ban la CSS architect chuyen refactor.

CSS CAN RA SOAT:
{{css}}

YEU CAU:

1. PHAN TICH HIEN TRANG
   - So selector, so dong.
   - Van de: specificity war, duplicate, unused, magic numbers.

2. SELECTOR XUNG DOT
3. GIA TRI LAP THANH BIEN (de xuat ten bien).
4. PHAN KHONG DUNG (cach kiem tra truoc khi xoa).
5. BAN CSS GON HON (so sanh truoc/sau).
6. GHI CHU TUNG THAY DOI (bang: Thay doi | Ly do | Rui ro).

DINH DANG:
- Diff ro rang.`,
    long: true,
  },
  {
    id: 'code-05',
    cat: 'code',
    title: 'Viet unit test',
    desc: 'Viet unit test day du: happy path, edge case, error case.',
    tags: ['testing', 'chi tiet'],
    prompt: `Viet unit test cho ham/component sau:

CODE:
{{code}}

FRAMEWORK: {{framework}}

YEU CAU:

1. TEST HAPPY PATH (3-5 test)
2. TEST EDGE CASE (3-5 test)
   - Input rong, null, undefined.
   - So am, so 0, so rat lon.
   - Chuoi rong, chuoi dai.
3. TEST ERROR CASE (2-3 test)
   - Input sai dinh dang.
   - Exception.
4. TEST PERFORMANCE (neu can)
5. MOCK DATA (neu co dependency).

DINH DANG:
- Moi test co mo ta ro rang.`,
    long: true,
  },
  {
    id: 'code-06',
    cat: 'code',
    title: 'Refactor code',
    desc: 'Refactor code cu thanh code sach, de bao tri.',
    tags: ['refactor', 'chi tiet'],
    prompt: `Refactor doan code sau:

{{code}}

MUC TIEU: {{muc tieu}}

YEU CAU:

1. PHAN TICH CODE CU
   - Diem yeu.
   - Code smell.

2. DE XUAT CAI TIEN
   - Tach ham.
   - Dat ten ro rang.
   - Loai bo duplicate.
   - Ap dung design pattern (neu can).

3. CODE DA REFACTOR
4. SO SANH TRUOC/SAU
   - So dong, do phuc tap.
5. GHI CHU
   - Rui ro khi refactor.
   - Cach test.

DINH DANG:
- Diff ro rang.`,
    long: true,
  },
  {
    id: 'code-07',
    cat: 'code',
    title: 'Toi uu hieu nang',
    desc: 'Tim bottleneck, de xuat cai thien, do luong.',
    tags: ['performance', 'chi tiet'],
    prompt: `Toi uu hieu nang doan code sau:

{{code}}

NGU CANH:
- Kich thuoc du lieu: {{kich thuoc}}
- Tan suat chay: {{tan suat}}
- Yeu cau: {{yeu cau}}

YEU CAU:

1. PHAN TICH BOTTLENECK
   - Big O cua thuat toan hien tai.
   - Diem nghen chinh.

2. DE XUAT TOI UU
   - Cai thien thuat toan.
   - Cau truc du lieu tot hon.
   - Cache, memoization.
   - Parallel, async.

3. CODE TOI UU
4. SO SANH
   - Truoc: O(?), sau: O(?).
   - So phep tinh giam bao nhieu.

5. DO LUONG
   - Cach benchmark.
   - Cong cu goi y.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-08',
    cat: 'code',
    title: 'Viet API backend',
    desc: 'Viet REST API day du: routes, validation, error handling.',
    tags: ['backend', 'chi tiet'],
    prompt: `Viet REST API cho:

CHUC NANG: {{mo ta}}
FRAMEWORK: {{framework}}
DATABASE: {{database}}

YEU CAU:

1. CAU TRUC THU MUC
2. ROUTES
   - GET /items
   - GET /items/:id
   - POST /items
   - PUT /items/:id
   - DELETE /items/:id
3. VALIDATION
   - Input validation.
   - Error message ro rang.
4. ERROR HANDLING
   - Middleware.
   - Status code phu hop.
5. AUTHENTICATION (neu can)
6. DATABASE SCHEMA
7. VI DU REQUEST/RESPONSE

DINH DANG:
- Moi route co comment.`,
    long: true,
  },
  {
    id: 'code-09',
    cat: 'code',
    title: 'Viet query SQL',
    desc: 'Viet query SQL phuc tap: join, subquery, aggregate.',
    tags: ['SQL', 'chi tiet'],
    prompt: `Viet query SQL cho yeu cau:

YEU CAU: {{mo ta}}
SCHEMA: {{schema}}

YEU CAU:

1. PHAN TICH BAI TOAN
2. VIET QUERY
   - Co comment giai thich.
   - Dung alias ro rang.
3. GIAI THICH
   - Tung phan cua query.
   - Tai sao chon cach nay.
4. TOI UU (neu can)
   - Index goi y.
   - Cach viet hieu qua hon.
5. KET QUA MAU

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-10',
    cat: 'code',
    title: 'Viet regex',
    desc: 'Viet regex cho pattern cu the, co test case.',
    tags: ['regex', 'chi tiet'],
    prompt: `Viet regex cho yeu cau:

PATTERN CAN MATCH: {{mo ta}}
VI DU MATCH: {{vi du dung}}
VI DU KHONG MATCH: {{vi du sai}}

YEU CAU:

1. GIAI THICH PATTERN
2. REGEX
3. GIAI THICH TUNG PHAN
   - Ky tu dac biet.
   - Group.
4. TEST CASE
   - Bao nhieu case pass.
   - Bao nhieu case fail.
5. LUU Y
   - Edge case.
   - Ngon ngu khac nhau (JS vs Python).

DINH DANG:
- Regex trong code block.
- Test case dang bang.`,
    long: true,
  },
  {
    id: 'code-11',
    cat: 'code',
    title: 'Viet script automation',
    desc: 'Script tu dong hoa cong viec lap lai.',
    tags: ['automation', 'chi tiet'],
    prompt: `Viet script tu dong hoa:

CONG VIEC: {{mo ta}}
NGON NGU: {{ngon ngu}}

YEU CAU:

1. PHAN TICH CONG VIEC
   - Input.
   - Output.
   - Cac buoc.
2. SCRIPT HOAN CHINH
   - Co comment.
   - Co error handling.
3. CACH CHAY
4. CACH SCHEDULE (cron, task scheduler)
5. LOGGING
6. GHI CHU
   - Edge case.
   - Cach test.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-12',
    cat: 'code',
    title: 'Viet documentation',
    desc: 'Viet tai lieu cho code, API, hoac du an.',
    tags: ['docs', 'chi tiet'],
    prompt: `Viet documentation cho:

DOI TUONG: {{code / API / du an}}
CHI TIET: {{chi tiet}}

YEU CAU:

1. TONG QUAN
   - Muc dich.
   - Doi tuong su dung.
2. CAI DAT / SU DUNG
   - Yeu cau.
   - Cac buoc.
3. API REFERENCE (neu la API)
   - Endpoint.
   - Parameters.
   - Response.
4. VI DU
5. FAQ
6. TROUBLESHOOTING

DINH DANG:
- Markdown ro rang.
- Code block cho vi du.`,
    long: true,
  },
  {
    id: 'code-13',
    cat: 'code',
    title: 'Viet Git commit message',
    desc: 'Viet commit message theo chuan Conventional Commits.',
    tags: ['git', 'chi tiet'],
    prompt: `Viet commit message cho thay doi sau:

THAY DOI: {{mo ta}}
FILE ANH HUONG: {{danh sach file}}

YEU CAU:

1. COMMIT MESSAGE CHINH
   - Theo chuan Conventional Commits.
   - Format: type(scope): subject
2. TYPES
   - feat, fix, docs, style, refactor, test, chore.
3. BODY (neu can)
   - Chi tiet thay doi.
   - Ly do.
4. FOOTER (neu can)
   - Breaking changes.
   - Issue lien quan.

DINH DANG:
- Code block cho message.`,
    long: true,
  },
  {
    id: 'code-14',
    cat: 'code',
    title: 'Giai thich khai niem lap trinh',
    desc: 'Giai thich khai niem lap trinh kho hieu bang vi du don gian.',
    tags: ['ly thuyet', 'chi tiet'],
    prompt: `Giai thich khai niem lap trinh:

KHAI NIEM: {{khai niem}}
TRINH DO: {{trinh do}}

YEU CAU:

1. DINH NGHIA DON GIAN
2. VI DU DOI SONG
3. VI DU CODE
   - Vi du toi gian.
   - Vi du thuc te.
4. KHI NAO DUNG
5. LOI THUONG MAC
6. TAI LIEU THAM KHAO

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-15',
    cat: 'code',
    title: 'Viet database schema',
    desc: 'Thiet ke database schema cho ung dung.',
    tags: ['database', 'chi tiet'],
    prompt: `Thiet ke database schema cho:

UNG DUNG: {{mo ta}}
DATABASE: {{database}}

YEU CAU:

1. YEU CAU CHUC NANG
2. ENTITIES
   - Liet ke cac bang/collection can.
3. SCHEMA CHI TIET
   - Columns/fields.
   - Data types.
   - Constraints (PK, FK, unique, not null).
4. RELATIONSHIPS
   - 1-1, 1-N, N-N.
5. INDEX
   - Index can thiet cho query pho bien.
6. ERD (mo ta bang text)
7. MIGRATION SCRIPT

DINH DANG:
- Code block cho SQL/schema.`,
    long: true,
  },
  {
    id: 'code-16',
    cat: 'code',
    title: 'Debug async/await trong JavaScript',
    desc: 'Debug loi async/await, promise, callback hell.',
    tags: ['JavaScript', 'chi tiet'],
    prompt: `Debug code async/await sau:

{{code}}

LOI: {{mo ta loi}}

YEU CAU:

1. PHAN TICH LUONG ASYNC
   - Promise nao chay truoc?
   - Await co dung cho khong?
   - Co race condition khong?

2. LOI THUONG MAC
   - Quen await.
   - Await trong loop.
   - Unhandled promise rejection.
   - Callback hell.

3. CACH SUA
   - Code da sua.
   - Giai thich thay doi.

4. BEST PRACTICE
   - Try/catch.
   - Promise.all, Promise.race.
   - Async generators.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-17',
    cat: 'code',
    title: 'Viet hook tuy chinh React',
    desc: 'Viet custom hook cho logic phuc tap.',
    tags: ['React', 'chi tiet'],
    prompt: `Viet custom hook React cho:

CHUC NANG: {{mo ta}}
USE CASE: {{use case}}

YEU CAU:

1. HOOK CODE
   - Dat ten theo chuan useXxx.
   - Co comment.
   - Handle cleanup.
2. API
   - Input: tham so.
   - Output: gia tri tra ve.
3. VI DU SU DUNG
4. TEST
   - Test voi React Hooks Testing Library.
5. GHI CHU
   - Khi nao dung.
   - Khi nao khong nen dung.
   - Performance.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-18',
    cat: 'code',
    title: 'Chuyen doi code giua ngon ngu',
    desc: 'Chuyen code tu ngon ngu nay sang ngon ngu khac.',
    tags: ['convert', 'chi tiet'],
    prompt: `Chuyen code sau tu {{ngon ngu nguon}} sang {{ngon ngu dich}}:

{{code}}

YEU CAU:

1. PHAN TICH CODE GOC
2. CODE DA CHUYEN
3. GIAI THICH
   - Cu phap thay doi.
   - Thu vien tuong duong.
   - Khac biet ngu nghia.
4. LUU Y
   - Edge case khac nhau.
   - Performance.
5. TEST

DINH DANG:
- Code block co syntax highlighting cho ca 2 ngon ngu.`,
    long: true,
  },
  {
    id: 'code-19',
    cat: 'code',
    title: 'Viet Docker / docker-compose',
    desc: 'Viet Dockerfile va docker-compose cho du an.',
    tags: ['Docker', 'chi tiet'],
    prompt: `Viet Docker configuration cho:

DU AN: {{mo ta}}
STACK: {{stack}}
YEU CAU: {{dev / prod}}

YEU CAU:

1. DOCKERFILE
   - Base image.
   - Multi-stage build (neu can).
   - Optimize layer.
2. .DOCKERIGNORE
3. DOCKER-COMPOSE
   - Services.
   - Volumes.
   - Networks.
   - Environment.
4. HUONG DAN CHAY
5. LUU Y
   - Security.
   - Performance.
   - Size optimization.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-20',
    cat: 'code',
    title: 'Viet CI/CD pipeline',
    desc: 'Viet CI/CD pipeline cho GitHub Actions / GitLab CI.',
    tags: ['CI/CD', 'chi tiet'],
    prompt: `Viet CI/CD pipeline cho:

DU AN: {{mo ta}}
NEN TANG: {{nen tang}}
DEPLOY TARGET: {{deploy target}}

YEU CAU:

1. TRIGGERS
   - Khi nao chay? (push, PR, tag)
2. STEPS
   - Checkout code.
   - Install dependencies.
   - Lint, test.
   - Build.
   - Deploy.
3. CACHE
   - Cache dependencies.
4. ENVIRONMENT
   - Secrets.
   - Env vars.
5. NOTIFICATIONS
6. ROLLBACK STRATEGY

DINH DANG:
- Code block YAML co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-21',
    cat: 'code',
    title: 'Viet error handling tot',
    desc: 'Cai thien error handling trong code.',
    tags: ['error', 'chi tiet'],
    prompt: `Cai thien error handling cho code sau:

{{code}}

YEU CAU:

1. PHAN TICH HIEN TRANG
   - Try/catch co du khong?
   - Error messages ro rang?
   - Co log khong?
2. BEST PRACTICE
   - Catch specific errors.
   - Khong nuot loi.
   - Log du context.
   - Fallback strategy.
3. CODE DA SUA
4. ERROR CLASSES (neu can)
5. TEST ERROR CASES

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-22',
    cat: 'code',
    title: 'Viet code TypeScript',
    desc: 'Viet code TypeScript voi type safety day du.',
    tags: ['TypeScript', 'chi tiet'],
    prompt: `Viet code TypeScript cho:

CHUC NANG: {{mo ta}}
YEU CAU: strict mode, type-safe.

YEU CAU:

1. TYPES / INTERFACES
   - Dinh nghia types day du.
   - Dung generics neu can.
2. CODE
   - Full implementation.
   - Khong dung kieu any.
3. TYPE GUARDS
   - Neu can.
4. UTILS TYPES
   - Pick, Omit, Partial, v.v.
5. TEST
6. GIAI THICH
   - Vi sao chon type nay.

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-23',
    cat: 'code',
    title: 'Giai thich design pattern',
    desc: 'Giai thich design pattern voi vi du thuc te.',
    tags: ['design pattern', 'chi tiet'],
    prompt: `Giai thich design pattern:

PATTERN: {{pattern name}}

YEU CAU:

1. DINH NGHIA
2. VAN DE GIAI QUYET
3. CAU TRUC
   - Cac thanh phan.
   - Moi quan he.
4. VI DU CODE
   - Vi du don gian.
   - Vi du thuc te.
5. KHI NAO DUNG
6. UU NHUOC DIEM
7. PATTERN LIEN QUAN

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-24',
    cat: 'code',
    title: 'Viet GraphQL API',
    desc: 'Viet GraphQL schema va resolvers.',
    tags: ['GraphQL', 'chi tiet'],
    prompt: `Viet GraphQL API cho:

CHUC NANG: {{mo ta}}
FRAMEWORK: {{framework}}

YEU CAU:

1. SCHEMA
   - Types.
   - Queries.
   - Mutations.
   - Subscriptions (neu can).
2. RESOLVERS
3. AUTHENTICATION / AUTHORIZATION
4. ERROR HANDLING
5. DATALOADER (neu can, cho N+1 problem)
6. VI DU QUERY
7. TEST

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-25',
    cat: 'code',
    title: 'Viet WebSocket / real-time',
    desc: 'Viet WebSocket server va client.',
    tags: ['realtime', 'chi tiet'],
    prompt: `Viet WebSocket cho:

CHUC NANG: {{mo ta}}
STACK: {{stack}}

YEU CAU:

1. SERVER
   - Connection handling.
   - Events.
   - Rooms (neu can).
2. CLIENT
   - Connect.
   - Emit / on events.
   - Reconnection.
3. AUTHENTICATION
4. ERROR HANDLING
5. SCALE
   - Redis adapter (neu can).
6. VI DU

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-26',
    cat: 'code',
    title: 'Viet browser extension',
    desc: 'Viet extension cho Chrome/Firefox.',
    tags: ['extension', 'chi tiet'],
    prompt: `Viet browser extension cho:

CHUC NANG: {{mo ta}}
BROWSER: {{browser}}

YEU CAU:

1. MANIFEST.JSON
2. BACKGROUND SCRIPT
3. CONTENT SCRIPT
4. POPUP UI
   - HTML, CSS, JS.
5. PERMISSIONS
6. STORAGE
7. BUILD & PACKAGE
8. CAI DAT

DINH DANG:
- Code block co syntax highlighting.
- Cau truc thu muc ro rang.`,
    long: true,
  },
  {
    id: 'code-27',
    cat: 'code',
    title: 'Viet mobile app React Native',
    desc: 'Viet app React Native co ban.',
    tags: ['mobile', 'chi tiet'],
    prompt: `Viet app React Native cho:

CHUC NANG: {{mo ta}}
SCREENS: {{so man hinh}}

YEU CAU:

1. CAU TRUC THU MUC
2. NAVIGATION
   - Stack, tab.
3. SCREENS
   - Moi screen co component.
4. STATE MANAGEMENT
5. API CALLS
6. STYLING
7. NATIVE MODULES (neu can)
8. BUILD & DEPLOY

DINH DANG:
- Code block co syntax highlighting JSX.`,
    long: true,
  },
  {
    id: 'code-28',
    cat: 'code',
    title: 'Viet script web scraping',
    desc: 'Viet script scraping du lieu tu website.',
    tags: ['scraping', 'chi tiet'],
    prompt: `Viet script web scraping cho:

WEBSITE: {{url}}
DU LIEU CAN LAY: {{du lieu}}
NGON NGU: {{ngon ngu}}

YEU CAU:

1. PHAN TICH WEBSITE
   - Cau truc HTML.
   - Cach lay du lieu (selector).
2. SCRIPT
   - Fetch page.
   - Parse HTML.
   - Extract data.
   - Save (CSV, JSON, database).
3. HANDLE
   - Rate limit.
   - User-Agent.
   - Pagination.
   - Error retry.
4. LUU Y PHAP LY
   - robots.txt.
   - Terms of Service.
5. CACH CHAY

DINH DANG:
- Code block co syntax highlighting.`,
    long: true,
  },
  {
    id: 'code-29',
    cat: 'code',
    title: 'Viet CLI tool',
    desc: 'Viet command-line tool voi arguments va options.',
    tags: ['CLI', 'chi tiet'],
    prompt: `Viet CLI tool cho:

CHUC NANG: {{mo ta}}
NGON NGU: {{ngon ngu}}

YEU CAU:

1. COMMANDS
   - Liet ke commands.
   - Options / flags.
2. SCRIPT
   - Parse arguments.
   - Execute logic.
   - Output dep (mau, format).
3. HELP MESSAGE
4. VERSION
5. INSTALL & USAGE
6. TEST

DINH DANG:
- Code block co syntax highlighting.
- Vi du usage trong terminal.`,
    long: true,
  },
  {
    id: 'code-30',
    cat: 'code',
    title: 'Review code (pull request)',
    desc: 'Review code nhu senior developer, dua feedback chi tiet.',
    tags: ['review', 'chi tiet'],
    prompt: `Review doan code sau nhu mot senior developer:

{{code}}

NGU CANH: {{mo ta PR}}

YEU CAU:

1. TONG QUAN
   - Chat luong code (1-5 sao).
   - Diem manh.
   - Diem can cai thien.

2. COMMENT CHI TIET
   - Line by line (neu can).
   - De xuat cu the.

3. BEST PRACTICE
   - Naming.
   - Structure.
   - Error handling.
   - Performance.
   - Security.

4. DE XUAT CAI TIEN
   - Code mau.
   - Uu tien (must-fix, should-fix, nice-to-have).

5. KET LUAN
   - Approve / Request changes.

DINH DANG:
- Code block co syntax highlighting.
- Ro rang, co vi du.`,
    long: true,
  },
];