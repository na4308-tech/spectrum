// DOM 요소들
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const chatArea = document.getElementById('chatArea');
const suggestionItems = document.querySelectorAll('.suggestion-item');

// 자격검정 관련 답변 데이터 (실제로는 API에서 가져올 수 있음)
const responses = {
    '시험 일정': {
        answer: '자격검정 시험 일정은 다음과 같습니다:\n\n• 1차 시험: 매년 3월, 9월\n• 2차 시험: 매년 5월, 11월\n• 실기시험: 매년 6월, 12월\n\n정확한 일정은 공지사항을 확인해 주시기 바랍니다.',
        category: '시험 일정'
    },
    '발급 절차': {
        answer: '자격증 발급 절차는 다음과 같습니다:\n\n1. 시험 합격 후 자격증 발급 신청\n2. 신분증 및 합격증명서 제출\n3. 발급비 납부 (15,000원)\n4. 심사 및 발급 (약 2-3주 소요)\n5. 자격증 수령 (우편 또는 방문)',
        category: '발급 절차'
    },
    '신청 방법': {
        answer: '자격검정 신청 방법은 다음과 같습니다:\n\n• 온라인 신청: 공식 웹사이트에서 신청\n• 서류 신청: 신청서 다운로드 후 우편 제출\n• 방문 신청: 각 지역 자격검정원 방문\n\n신청 기간: 시험일 2개월 전부터 1개월 전까지',
        category: '신청 방법'
    },
    '민원 제기': {
        answer: '자격검정 관련 민원 제기 방법:\n\n• 온라인 민원: 정부24 민원신청\n• 전화 민원: 1588-0000\n• 서면 민원: 각 지역 자격검정원\n• 이메일: civil@qualification.go.kr\n\n민원 접수 후 14일 이내 답변 드립니다.',
        category: '민원 제기'
    }
};

// 기본 답변들
const defaultResponses = [
    '자격검정에 대해 더 구체적으로 질문해 주시면 정확한 답변을 드릴 수 있습니다.',
    '시험 일정, 신청 방법, 발급 절차 등에 대해 궁금한 점이 있으시면 말씀해 주세요.',
    '민원사항이 있으시면 민원 제기 방법을 안내해 드리겠습니다.',
    '자격검정 관련 법령이나 규정에 대해 궁금한 점이 있으시면 언제든 문의해 주세요.'
];

// 메시지 추가 함수
function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    chatArea.appendChild(messageDiv);
    
    // 스크롤을 맨 아래로 이동
    chatArea.scrollTop = chatArea.scrollHeight;
}

// AI 응답 생성 함수
function generateResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // 키워드 기반 응답 매칭
    for (const [keyword, response] of Object.entries(responses)) {
        if (lowerMessage.includes(keyword.toLowerCase()) || 
            lowerMessage.includes(response.category.toLowerCase())) {
            return response.answer;
        }
    }
    
    // 일반적인 질문에 대한 응답
    if (lowerMessage.includes('안녕') || lowerMessage.includes('hello')) {
        return '안녕하세요! 자격검정 AI 챗봇입니다. 무엇을 도와드릴까요?';
    }
    
    if (lowerMessage.includes('감사') || lowerMessage.includes('고마워')) {
        return '도움이 되어 기쁩니다! 다른 질문이 있으시면 언제든 말씀해 주세요.';
    }
    
    if (lowerMessage.includes('도움') || lowerMessage.includes('help')) {
        return '자격검정과 관련된 다음 항목들을 문의하실 수 있습니다:\n\n• 시험 일정 및 일정 변경\n• 신청 방법 및 절차\n• 자격증 발급 및 재발급\n• 민원 제기 및 처리\n• 기타 자격검정 관련 문의';
    }
    
    // 기본 응답 중에서 랜덤 선택
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// 메시지 전송 함수
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // 사용자 메시지 추가
    addMessage(message, true);
    
    // 입력 필드 초기화
    chatInput.value = '';
    
    // 입력 필드 포커스
    chatInput.focus();
    
    // AI 응답 생성 (실제로는 API 호출)
    setTimeout(() => {
        const response = generateResponse(message);
        addMessage(response);
    }, 1000);
}

// 이벤트 리스너 등록
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// 제안 카테고리 클릭 이벤트
suggestionItems.forEach(item => {
    item.addEventListener('click', () => {
        const query = item.getAttribute('data-query');
        chatInput.value = query;
        chatInput.focus();
    });
});

// 입력 필드 포커스 시 하단 테두리 색상 변경
chatInput.addEventListener('focus', () => {
    chatInput.parentElement.style.borderBottomColor = '#004F99';
});

chatInput.addEventListener('blur', () => {
    chatInput.parentElement.style.borderBottomColor = 'rgba(13, 13, 13, 0.1)';
});

// 페이지 로드 시 입력 필드에 포커스
window.addEventListener('load', () => {
    chatInput.focus();
});

// 파일 첨부 버튼 클릭 이벤트 (실제 구현 시 파일 업로드 로직 추가)
document.querySelector('.btn-icon[title="파일 첨부"]').addEventListener('click', () => {
    addMessage('파일 첨부 기능은 현재 개발 중입니다. 곧 서비스될 예정입니다.');
});

// 음성 입력 버튼 클릭 이벤트 (실제 구현 시 음성 인식 로직 추가)
document.querySelector('.btn-icon[title="음성 입력"]').addEventListener('click', () => {
    addMessage('음성 입력 기능은 현재 개발 중입니다. 곧 서비스될 예정입니다.');
});

// 로그인/회원가입 버튼 클릭 이벤트
document.querySelector('.btn-primary').addEventListener('click', () => {
    showLoginModal();
});

document.querySelector('.btn-secondary').addEventListener('click', () => {
    showSignupModal();
});

// 로고 클릭 시 페이지 새로고침
document.querySelector('.logo h1').addEventListener('click', () => {
    location.reload();
});

// 키보드 단축키 지원
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter로 메시지 전송
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
    
    // ESC 키로 입력 필드 초기화 또는 모달 닫기
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            closeModal(modal);
        } else {
            chatInput.value = '';
            chatInput.blur();
        }
    }
});

// 입력 필드 자동 크기 조정 (필요시)
chatInput.addEventListener('input', () => {
    // 입력 내용에 따라 높이 자동 조정 로직 추가 가능
});

// 페이지 가시성 변경 시 입력 필드 포커스
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        chatInput.focus();
    }
});

// ===== 모달 관련 함수들 =====

// 로그인 모달 표시
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>로그인</h3>
                <button class="modal-close" onclick="closeModal(this)">×</button>
            </div>
            <div class="modal-body">
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">이메일</label>
                        <input type="email" id="loginEmail" required placeholder="이메일을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">비밀번호</label>
                        <input type="password" id="loginPassword" required placeholder="비밀번호를 입력하세요">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">로그인</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal(this)">취소</button>
                    </div>
                </form>
                <div class="auth-links">
                    <a href="#" onclick="showForgotPassword()">비밀번호 찾기</a>
                    <span>|</span>
                    <a href="#" onclick="closeModal(this); showSignupModal()">회원가입</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 로그인 폼 제출 이벤트
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// 회원가입 모달 표시
function showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>회원가입</h3>
                <button class="modal-close" onclick="closeModal(this)">×</button>
            </div>
            <div class="modal-body">
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <label for="signupName">이름</label>
                        <input type="text" id="signupName" required placeholder="이름을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label for="signupNickname">닉네임</label>
                        <input type="text" id="signupNickname" required placeholder="닉네임을 입력하세요" maxlength="20">
                        <small class="form-help">2-20자 이내로 입력해주세요</small>
                    </div>
                    <div class="form-group">
                        <label for="signupEmail">이메일</label>
                        <input type="email" id="signupEmail" required placeholder="이메일을 입력하세요">
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">비밀번호</label>
                        <input type="password" id="signupPassword" required placeholder="비밀번호를 입력하세요">
                    </div>
                    <div class="form-group">
                        <label for="signupConfirmPassword">비밀번호 확인</label>
                        <input type="password" id="signupConfirmPassword" required placeholder="비밀번호를 다시 입력하세요">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">회원가입</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal(this)">취소</button>
                    </div>
                </form>
                <div class="auth-links">
                    <span>이미 계정이 있으신가요?</span>
                    <a href="#" onclick="closeModal(this); showLoginModal()">로그인</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 회원가입 폼 제출 이벤트
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// 모달 닫기
function closeModal(element) {
    const modal = element.closest('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// 로그인 처리
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // 간단한 유효성 검사
    if (!email || !password) {
        showNotification('이메일과 비밀번호를 모두 입력해주세요.', 'error');
        return;
    }
    
    // 실제로는 서버에 로그인 요청을 보내야 합니다
    showNotification('로그인 중...', 'info');
    
    // 시뮬레이션된 로그인 처리
    setTimeout(() => {
        showNotification('로그인되었습니다!', 'success');
        closeModal(document.querySelector('.modal-overlay'));
        
        // 로그인 상태로 UI 변경
        updateUIAfterLogin(email);
    }, 1500);
}

// 회원가입 처리
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const nickname = document.getElementById('signupNickname').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // 간단한 유효성 검사
    if (!name || !nickname || !email || !password || !confirmPassword) {
        showNotification('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 20) {
        showNotification('닉네임은 2-20자 이내로 입력해주세요.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
        return;
    }
    
    // 실제로는 서버에 회원가입 요청을 보내야 합니다
    showNotification('회원가입 중...', 'info');
    
    // 시뮬레이션된 회원가입 처리
    setTimeout(() => {
        showNotification('회원가입이 완료되었습니다!', 'success');
        closeModal(document.querySelector('.modal-overlay'));
        
        // 자동으로 로그인 상태로 변경 (닉네임 사용)
        updateUIAfterLogin(email, nickname);
    }, 1500);
}

// 로그인 후 UI 업데이트
function updateUIAfterLogin(email, nickname = null) {
    const navigation = document.querySelector('.navigation');
    const displayName = nickname || email.split('@')[0];
    navigation.innerHTML = `
        <span class="user-info">안녕하세요, ${displayName}님!</span>
        <button class="btn btn-secondary" onclick="handleLogout()">로그아웃</button>
    `;
}

// 로그아웃 처리
function handleLogout() {
    const navigation = document.querySelector('.navigation');
    navigation.innerHTML = `
        <button class="btn btn-primary">로그인</button>
        <button class="btn btn-secondary">회원가입</button>
    `;
    
    // 이벤트 리스너 다시 등록
    document.querySelector('.btn-primary').addEventListener('click', showLoginModal);
    document.querySelector('.btn-secondary').addEventListener('click', showSignupModal);
    
    showNotification('로그아웃되었습니다.', 'info');
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 비밀번호 찾기 (간단한 구현)
function showForgotPassword() {
    const email = prompt('비밀번호를 찾을 이메일을 입력하세요:');
    if (email) {
        showNotification('비밀번호 재설정 링크가 이메일로 전송되었습니다.', 'info');
    }
}
