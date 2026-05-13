document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('form');
    const signupBtn = document.querySelector('.login-btn');

    // 1. التحقق من صحة البيانات قبل الإرسال
    signupBtn.addEventListener('click', (e) => {
        e.preventDefault(); // منع الصفحة من التحديث

        const name = document.querySelector('input[type="text"]').value;
        const email = document.querySelector('input[type="email"]').value;
        const phone = document.querySelector('input[type="tel"]').value;
        const password = document.querySelector('input[type="password"]').value;

        // فحص بسيط للتأكد من أن الحقول ليست فارغة
        if (!name || !email || !phone || !password) {
            alert('يرجى تعبئة جميع الحقول المطلوبة');
            return;
        }

        // فحص صيغة الإيميل
        if (!validateEmail(email)) {
            alert('يرجى إدخال بريد إلكتروني صحيح');
            return;
        }

        console.log('بيانات التسجيل:', { name, email, phone, password });
        alert('تم إرسال البيانات بنجاح! جاري إنشاء حسابك...');
    });

    // دالة فحص البريد الإلكتروني (Regex)
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // 2. تأثير بسيط عند التركيز على الحقول (Focus Effect)
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'scale(1.02)';
            input.parentElement.style.transition = '0.3s';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'scale(1)';
        });
    });
});