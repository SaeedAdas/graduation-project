/**
 * script.js - ملف البرمجة الخاص بصفحة ملتقى
 */

// 1. التركيز على حقل البحث
const mainSearchIcon = document.querySelector('.search-box .search-icon');
const mainSearchInput = document.querySelector('.search-box input');

if (mainSearchIcon && mainSearchInput) {
    mainSearchIcon.addEventListener('click', () => {
        mainSearchInput.focus();
    });
}

// 2. تفعيل تفاعلات أزرار المراجعة
const reviewButtons = document.querySelectorAll('.action-buttons button');
reviewButtons.forEach(btn => {
    btn.onclick = function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
            alert(`شكراً لتفاعلك! تم تسجيل رأيك في ${document.querySelector('.title-section h2').innerText}`);
        }, 100);
    };
});

// 3. إضافة تعليق
const sendCommentBtn = document.querySelector('.btn-send');
const commentInput = document.querySelector('.add-comment input');
if (sendCommentBtn && commentInput) {
    sendCommentBtn.addEventListener('click', () => {
        const text = commentInput.value.trim();
        if (text === "") {
            alert("يرجى كتابة تعليق أولاً!");
            return;
        }
        alert("تم إرسال تعليقك بنجاح وهو قيد المراجعة.");
        commentInput.value = ""; 
    });
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendCommentBtn.click();
        }
    });
}

// 4. تفعيل اختيار التصنيفات
const categoryItems = document.querySelectorAll('.categories-card li');
categoryItems.forEach(item => {
    item.addEventListener('click', function() {
        categoryItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// 5. زر أضف مراجعة
const addReviewBtn = document.querySelector('.add-review-btn');
if (addReviewBtn) {
    addReviewBtn.onclick = () => {
        alert("سيتم توجيهك الآن إلى صفحة إضافة مراجعة جديدة.");
    };
}

// 6. تأثيرات القائمة الجانبية
const sideItems = document.querySelectorAll('.side-item');
sideItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f0f4ff';
    });
    item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = '#fff';
    });
});

// تفعيل الضغط على منطقة رفع الصور
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            alert(`تم اختيار ملف: ${e.target.files[0].name}`);
        }
    });
}