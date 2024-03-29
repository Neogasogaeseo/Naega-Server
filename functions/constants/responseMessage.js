module.exports = {
  NULL_VALUE: '필요한 값이 없습니다',
  OUT_OF_VALUE: '파라미터 값이 잘못되었습니다',
  WRONG_IMAGE: '이미지 값이 잘못되었습니다',

  // 회원가입
  CREATED_USER: '회원 가입 성공',
  NEED_REGISTER: '회원 가입 필요',
  REGISTERED_USER: '이미 유저 정보를 입력한 유저입니다.',
  REGISTER_USER_SUCCESS: '유저 정보 입력 성공',

  // 로그인
  LOGIN_SUCCESS: '로그인 성공',
  LOGIN_FAIL: '로그인 실패',
  NO_USER: '존재하지 않는 회원입니다.',
  MISS_MATCH_PW: '비밀번호가 맞지 않습니다.',
  WRONG_TOKEN: '잘못된 토큰입니다.',
  WRONG_AUTH: '잘못된 인가 코드입니다.',
  TOKEN_EXPIRED: '만료된 토큰입니다.',
  TOKEN_INVALID: '잘못된 토큰입니다.',
  DUPLICATE_USER_PROFILE_ID: '*중복된 아이디입니다.',
  TOKEN_REFRESH_SUCCESS: '토큰 리프레시 성공',

  // 유저
  READ_PROFILE_SUCCESS: '프로필 조회 성공',
  READ_USER_SUCCESS: '유저 조회 성공',
  READ_USER_LIST_SUCCESS: '유저 검색 결과 조회 성공',
  NO_USER_SEARCH_LIST: '유저 검색 결과 없음',
  UPDATE_USER: '유저 정보 수정 성공',
  DELETE_USER_SUCCESS: '유저 삭제 성공',
  USER_HOST_CHECK_SUCCESS: '유저 호스트 여부 확인 성공',

  // 키워드
  ALREADY_KEYWORD: '이미 존재하는 키워드입니다',
  ADD_KEYWORD_SUCCESS: '키워드 생성 성공',
  READ_KEYWORD_SUCCESS: '키워드 조회 성공',
  CANCLE_KEYWORD_SUCCESS: '키워드 생성 취소 성공',
  NOT_EXIST_KEYWORD: '존재하지 않는 키워드 입니다.',
  DELETE_KEYWORD_SUCCESS: '키워드 삭제 성공',
  DELETE_KEYWORD_FAIL: '키워드 삭제 실패',

  // 팀 정보
  READ_TEAM: '팀 정보 조회 성공',
  READ_ALL_TEAM: '모든 팀 정보 조회 성공',
  POST_TEAM: '팀 생성 성공',
  NO_TEAM: '존재하지 않는 팀입니다',
  UPDATE_TEAM: '팀 정보 수정 성공',
  DELETE_TEAM_SUCCESS: '팀 삭제 성공',
  READ_MY_TEAM_LIST: '유저가 속해있는 팀 리스트 조회 성공',

  // 팀원 정보
  READ_MEMBER: '팀원 정보 조회 성공',
  READ_ALL_TEAM_MEMBER: '모든 팀원 정보 조회 성공',
  POST_MEMBER: '팀원 등록 성공',
  NO_MEMBER: '존재하지 않는 팀원입니다',
  NO_AUTH_MEMBER: '수정, 삭제 권한이 없습니다',
  DELETE_MEMBER_SUCCESS: '팀원 삭제 성공',
  DELEGATE_HOST_SUCCESS: '관리자 권한 위임 성공',

  // 팀원소개서
  READ_ALL_TEAM_SUCCESS: '팀 목록 조회 성공',
  READ_MY_ISSUE_SUCCESS: '나와 관련된 이슈 조회 성공',
  READ_TEAM_SUCCESS: '팀 조회 성공',

  // 팀원소개서 이슈
  READ_TEAM_ISSUE_SUCCESS: '팀 이슈 조회 성공',
  READ_ALL_CATEGORY_SUCCESS: '이슈 카테고리 조회 성공',
  POST_TEAM_ISSUE: '팀 이슈 등록 성공',
  NO_TEAM_ISSUE_CONTENT: '이슈 컨텐트 값이 없습니다',
  READ_TEAM_ISSUE_DETAIL_SUCCESS: '팀 이슈 디테일 조회 성공',
  NO_ISSUE: '존재하지 않는 이슈입니다',
  UPDATE_ISSUE: '이슈 수정 성공',
  DELETE_ISSUE_SUCESS: '이슈 삭제 성공',

  // 피드백
  ADD_FEEDBACK_SUCCESS: '피드백 생성 성공',
  UPDATE_FEEDBACK_SUCCESS: '피드백 수정 성공',
  DELETE_FEEDBACK_SUCCESS: '피드백 삭제 성공',
  INTERNAL_SERVER_ERROR: '서버 내부 에러',
  READ_ISSUE_FEEDBACK_SUCCESS: '팀 이슈 피드백 조회 성공',
  FEEDBACK_IS_PINNED_TOGGLE_SUCCESS: '피드백 핀 토글 성공',
  NO_PINNED_FEEDBACK: '북마크된 피드백이 없습니다',
  READ_TEAM_AND_PINNED_FEEDBACK_SUCCESS: '팀과 북마크 피드백 조회 성공',
  NO_ISSUE_FEEDBACK: '팀 이슈 피드백 없음',
  NO_TEAM_AND_PINNED_FEEDBACK: '소속된 팀과 북마크 피드백이 없습니다',
  NO_FEEDBACK_TO_PICK: '내가 픽할 피드백이 없습니다',
  READ_FILTERED_FEEDBACK_SUCCESS: '필터링된 피드백 조회 성공',

  // 너가소개서
  READ_ALL_FORM_POPULAR_SUCCESS: '전체 폼 인기순 조회 성공',
  READ_ALL_FORM_RECENT_SUCCESS: '전체 폼 최신순 조회 성공',
  READ_ALL_USER_FORM_SUCCESS: '유저의 전체 폼 조회 성공',
  FORM_CREATE_SUCCESS: '폼 생성 성공',
  READ_FORM_SUCCESS: '폼 정보 조회 성공',
  FORM_CREATE_FAIL: '존재하지 않는 폼입니다',
  DUPLICATE_FORM: '이미 존재하는 폼입니다',
  ANSWER_CREATE_SUCCESS: '답변 등록 성공',
  ANSWER_DELETE_SUCCESS: '답변 삭제 성공',
  NO_FORM: '해당 유저와 폼 아이디로 생성된 폼이 없습니다.',
  READ_FORM_BANNER_SUCCESS: '배너 조회 성공',
  NO_MY_FORM_CONTENT: '생성한 폼이 없습니다',
  READ_FORM_DETAIL_SUCCESS: '폼 디테일 조회 성공',
  READ_ALL_PINNED_ANSWER_SUCCESS: '북마크된 답변 조회 성공',
  NO_PINNED_ANSWER: '북마크된 답변이 없습니다',
  READ_FORM_ANSWER_DETAIL_SUCCESS: '폼 디테일 답변 조회 성공 ',
  ANSWER_IS_PINNED_TOGGLE_SUCCESS: '답변 핀 토글 성공',
  NO_FORM_ISSUE: '팀 폼 답변 없음',
  READ_MY_FORM_LIST: '유저가 생성한 폼 리스트 조회 성공',
  READ_FILTERED_FORM_SUCCESS: '필터링된 폼 조회 성공',
  NO_ANSWER_TO_PICK: '내가 픽할 답변이 없습니다',
  NO_MORE_ANSWER: '더 이상 답변이 없습니다.',
  NO_ANSWER: '존재하지 않는 답변',

  // 알림
  READ_ALL_NOTICE_SUCCESS: '전체 알림 조회 성공',
  READ_NOTICE_SUCCESS: '알림 존재 여부 조회 성공',
  NO_INVITATION: '존재하지 않는 초대입니다.',

  // 문의하기
  READ_REPORT_CATEGORY_SUCCESS: '문의하기 카테고리 조회 성공',
  NO_REPORT_CATEGORY: '존재하지 않는 종류의 문의입니다',
  REPORT_CREATE_SUCCESS: '문의 등록 성공',
};
