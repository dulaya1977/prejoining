// *** 請將下方的 URL 替換成你在 Google Apps Script 部署後取得的 Web App URL ***
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxKnJC9qMm04clMaHRRrmPBLovOoWTMmrHkOWwT7dgwp786-PIBaCh9MJ_falytaP0/exec"; 

let quizData = [];
let userAnswers = {}; // 儲存格式: { questionTempId: optionId }
let currentQuestionIndex = 0;
let userInfo = {};

const loginSection = document.getElementById('login-section');
const quizSection = document.getElementById('quiz-section');
const finishSection = document.getElementById('finish-section');
const loadingMsg = document.getElementById('loading-msg');
const finishMsg = document.getElementById('finish-msg');

// 1. 處理登入與開始
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    userInfo.name = document.getElementById('name').value;
    userInfo.ship = document.getElementById('ship').value;
    userInfo.email = document.getElementById('email').value;

    document.getElementById('start-btn').classList.add('hidden');
    loadingMsg.classList.remove('hidden');

    fetchQuestions();
});

// 2. 從後端抓取題目
function fetchQuestions() {
    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "getQuestions" })
    })
    .then(response => response.json())
    .then(data => {
        quizData = data;
        startQuiz();
    })
    .catch(error => {
        alert("載入題目失敗，請檢查網路或稍後再試。" + error);
        loadingMsg.textContent = "載入失敗";
    });
}

function startQuiz() {
    loginSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    renderQuestion();
}

// 3. 顯示題目
function renderQuestion() {
    const q = quizData[currentQuestionIndex];
    document.getElementById('current-q-num').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = q.text;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'option-item';
        div.textContent = opt.id + ". " + opt.text;
        
        // 檢查是否已選過
        if (userAnswers[q.id] === opt.id) {
            div.classList.add('selected');
        }

        div.addEventListener('click', () => selectOption(q.id, opt.id));
        optionsContainer.appendChild(div);
    });

    updateButtons();
}

function selectOption(qId, optId) {
    userAnswers[qId] = optId;
    renderQuestion(); // 重新渲染以更新樣式
}

// 4. 按鈕導航
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
});

function updateButtons() {
    document.getElementById('prev-btn').disabled = (currentQuestionIndex === 0);
    
    const isLast = (currentQuestionIndex === quizData.length - 1);
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    if (isLast) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// 5. 交卷
document.getElementById('submit-btn').addEventListener('click', () => {
    // 檢查是否還有未填寫的
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < 80) {
        if(!confirm(`你只回答了 ${answeredCount} / 80 題，確定要交卷嗎？`)) {
            return;
        }
    } else {
        if(!confirm("確定要交卷嗎？交卷後無法修改。")) return;
    }

    submitQuiz();
});

function submitQuiz() {
    quizSection.classList.add('hidden');
    finishSection.classList.remove('hidden');

    const payload = {
        action: "submitQuiz",
        userInfo: userInfo,
        answers: userAnswers,
        questionMap: quizData // 把題目ID對照表傳回去給後端改
    };

    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            finishMsg.innerHTML = `
                <span style="color:green; font-size:1.2em;">交卷成功！</span><br><br>
                成績與詳細結果已寄送至：<br>
                1. kengogo99@gmail.com<br>
                2. ${userInfo.email}<br><br>
                請至信箱查收。
            `;
        } else {
            finishMsg.textContent = "交卷發生錯誤，請聯繫管理員。";
        }
    })
    .catch(error => {
        finishMsg.textContent = "網路錯誤，無法送出成績。請截圖此畫面聯繫管理員。";
    });

}



