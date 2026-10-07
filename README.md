# 파일 실행 서버

- `/` : 생일 이벤트 편지 페이지 (`public/index.html`). 편지를 누르면 `public/video.mp4` 영상이 재생됩니다.
- `/upload.html` : 파일 업로드/관리 페이지

파일(또는 폴더)을 웹에서 올리면 링크가 생기고, 그 링크를 누르면 바로 열리는 서버입니다.
HTML/JS/CSS로 된 웹페이지는 링크를 누르면 브라우저에서 그대로 실행됩니다.
카카오톡으로 링크를 보내도 어디서든 열립니다.

## 1분 배포 (Render 무료, 카드 등록 불필요)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/tj1031203-boop/BT/tree/ccr-78406e46-ldrvr8)

1. 위 버튼을 누르고 GitHub 계정으로 Render에 로그인합니다.
2. `UPLOAD_PASSWORD` 칸에 업로드용 비밀번호를 정해서 입력합니다. (이 비밀번호를 아는 사람만 파일을 올리거나 지울 수 있습니다.)
3. **Apply** 를 누르고 2~3분 기다리면 `https://bt-file-server-xxxx.onrender.com` 같은 주소가 생깁니다.
4. 그 주소를 카카오톡으로 보내면 끝입니다.

### 알아둘 점 (무료 플랜)

- 15분 동안 아무도 접속하지 않으면 서버가 잠들고, 다음 접속 때 깨어나는 데 30초~1분 걸립니다.
- 무료 플랜은 디스크가 영구 저장되지 않아서 **서버가 재시작/재배포되면 올린 파일이 사라집니다.**
  계속 남겨야 하는 파일은 이 저장소의 `public/` 폴더에 넣고 커밋하면 항상 `https://주소/파일이름` 으로 열립니다.

## 다른 곳에 배포

- **Docker가 되는 곳 어디든 (AWS EC2 프리티어 등)**
  ```bash
  docker build -t bt-file-server .
  docker run -d -p 80:3000 -e UPLOAD_PASSWORD=비밀번호 -v $PWD/uploads:/app/uploads bt-file-server
  ```
  `-v` 로 폴더를 연결하면 재시작해도 파일이 남습니다.
- **내 컴퓨터에서**
  ```bash
  npm install
  UPLOAD_PASSWORD=비밀번호 npm start   # http://localhost:3000
  ```

## 환경 변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `UPLOAD_PASSWORD` | (없음) | 업로드/삭제 비밀번호. 비우면 누구나 올릴 수 있으니 꼭 설정하세요. |
| `MAX_FILE_MB` | `50` | 파일 하나당 최대 크기(MB) |
| `UPLOAD_DIR` | `./uploads` | 파일 저장 위치 |
| `PORT` | `3000` | 서버 포트 |
