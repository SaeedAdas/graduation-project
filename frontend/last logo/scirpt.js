// وظيفة بسيطة لإضافة تفاعل عند التمرير أو الضغط
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'scale(0.95)';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'scale(1)';
        });
    });
});
// تأثيرات حركية بسيطة عند تمرير الماوس فوق الأزرار
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.transition = '0.3s ease';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
    });
});

// إظهار تنبيه بسيط عند الضغط على "ابدأ الآن"
const mainBtn = document.querySelector('.btn-primary-nav');
mainBtn.addEventListener('click', () => {
    console.log("Welcome to our community!");
});
// منع الصور من اعتراض اللمس على الحقول أو الأزرار في الجوال
document.querySelectorAll('.floating-user').forEach(user => {
    user.addEventListener('touchstart', () => {
        user.style.opacity = "0.5";
    });
    user.addEventListener('touchend', () => {
        user.style.opacity = "1";
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const marqueeRows = document.querySelectorAll('.marquee-row');
    
    marqueeRows.forEach(row => {
        // تكرار المحتوى لضمان انسيابية الحركة 100%
        const clone = row.innerHTML;
        row.innerHTML = clone + clone + clone;
    });
});