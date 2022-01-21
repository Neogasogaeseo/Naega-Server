# Naega-Server


![00 banner](https://user-images.githubusercontent.com/49263163/148995914-65ed2cf7-7638-45fe-ad04-f0bee297ff7f.png)

​    


<div align="center"> 
나와 함께한 당신이 대신 써 주는, 나의 소개서  <br>
<b>🍄너가소개서</b>
</div>


---






---

## 💻 Server Developers

<p align="center">
<img align"center" src = https://user-images.githubusercontent.com/49263163/150396081-70ca4dd0-305c-4f03-a975-61167a073d9c.png></img>
</p>
<div align = "center">


​    




| ![KakaoTalk_Photo_2022-01-21-03-22-16](https://user-images.githubusercontent.com/49263163/150398442-ed2a1509-a91f-41ab-a9ac-407b0b901e27.png) | ![3](https://user-images.githubusercontent.com/49263163/150396194-894e132d-fc29-485a-a37d-a4470b5ee8d9.png) | ![KakaoTalk_Photo_2022-01-19-22-36-58-2](https://user-images.githubusercontent.com/49263163/150396204-72ceebfa-867f-46e5-9b4e-7fe6f6d5b295.png) |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|                            최영재                            |                          주어진사랑                          |                            허유정                            |
|         [realwhyjay](https://github.com/realwhyjay)          |             [ozzing](https://github.com/ozzing)              |            [hujumee](https://github.com/hujumee)             |

</div>

   


---

## Git Branch Strategy

![01strategy_img](https://user-images.githubusercontent.com/49263163/148995202-b776378a-e33b-40a6-b17d-f891e1b27dae.jpeg)

---

## Daily Flow

![너소서 초기 세팅 정리 002](https://user-images.githubusercontent.com/49263163/148995217-b2c6c098-d3c4-46ff-9323-dbb746939100.jpeg)

![너소서 초기 세팅 정리 003](https://user-images.githubusercontent.com/49263163/148995228-53621d13-4069-4f13-adc7-774e9a75d3b3.jpeg)
![너소서 초기 세팅 정리 004](https://user-images.githubusercontent.com/49263163/148995231-421b7b34-1aeb-4e79-b970-ffd4c8a25f4d.jpeg)
![너소서 초기 세팅 정리 005](https://user-images.githubusercontent.com/49263163/148995239-dd0d1ae4-0350-4459-bd2d-7b958c785ab5.jpeg)
![너소서 초기 세팅 정리 006](https://user-images.githubusercontent.com/49263163/148995240-2f99e00f-8107-4586-a1e6-643b56840cbc.jpeg)
![너소서 초기 세팅 정리 007](https://user-images.githubusercontent.com/49263163/148995243-807c6bea-c6de-481e-a100-9ce106c15251.jpeg)

---

## Convention

  ![너소서 초기 세팅 정리 008](https://user-images.githubusercontent.com/49263163/148995246-a9c49e5e-5e51-4eea-a245-15fe25d859d8.jpeg)
![너소서 초기 세팅 정리 009](https://user-images.githubusercontent.com/49263163/148995248-c0d56aa0-73af-40ef-9e79-94fa95ef252e.jpeg)
![너소서 초기 세팅 정리 010](https://user-images.githubusercontent.com/49263163/148995250-fe4fd747-4f1e-45a4-9038-60dd03b0c84c.jpeg)
![너소서 초기 세팅 정리 011](https://user-images.githubusercontent.com/49263163/148995252-05cfe146-31df-4aea-a794-a40d985582b5.jpeg)



---

## Project Foldering

```tsx
│  .env
│  .eslintrc.js
│  .gitignore
│  .prettierrc.js
│  index.js
│  package.json
│
├─api
│  │  index.js
│  └─routes
│      │  index.js
│      ├─auth
│      │  │index.js
│      ├─form
│      │  └─answer
│      │       │index.js
│      ├─team
│      │  ├─feedback
│      │       │index.js
│      │  ├─issue
│      │       │index.js
│      │  └─member
│      │       │index.js
│      └─user
│          │  index.js
│          └─keyword
│               │index.js
│
├─config
│      dbConfig.js
│      firebaseClient.js
│      
├─constants
│      jwt.js
│      responseMessage.js
│      statusCode.js
│      
├─db
│      db.js
│      index.js
│      
├─lib
│      convertSnakeToCamel.js
│      jwtHandlers.js
│      util.js
│      
└─node_modules
```

---

## Dependencies

```json
"dependencies": {
    "axios": "^0.24.0",
    "busboy": "^0.3.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "cross-env": "^7.0.3",
    "crypto": "^1.0.1",
    "dayjs": "^1.10.7",
    "dotenv": "^10.0.0",
    "eslint-config-prettier": "^8.3.0",
    "express": "^4.17.1",
    "firebase": "^9.6.2",
    "firebase-admin": "^9.2.0",
    "firebase-functions": "^3.11.0",
    "fs": "0.0.1-security",
    "helmet": "^4.6.0",
    "hpp": "^0.2.3",
    "jsonwebtoken": "^8.5.1",
    "lodash": "^4.17.21",
    "node-fetch": "^3.1.0",
    "os": "^0.1.2",
    "passport": "^0.5.2",
    "passport-kakao": "^1.0.1",
    "path": "^0.12.7",
    "pg": "^8.7.1",
    "qs": "^6.10.3"
  },
```

---

## ERD

![neogasogaeseo ERD](https://user-images.githubusercontent.com/49263163/150398851-a517fc45-d772-4f24-937a-3d707d8d49ab.png)

---

### 🛠️ API Doc

- [너가소개서 API 명세서](https://www.notion.so/suzieep/API-6bb395e6f26a44c4ad0d02383a8debe5)


---


