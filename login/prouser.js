document.addEventListener('DOMContentLoaded', () => {
    // تعريف العناصر
    const signupForm = document.querySelector('.form-section');
    const signupBtn = document.querySelector('.login-btn');
    const inputs = document.querySelectorAll('.input-wrapper input');

    // 1. إضافة تأثيرات حركية عند التركيز على الحقول (Focus Effects)
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = '#4c84ff';
            input.style.backgroundColor = '#fff';
            input.parentElement.style.transform = 'translateX(-5px)'; // حركة بسيطة لجهة اليمين/اليسار
            input.parentElement.style.transition = 'all 0.3s ease';
        });

        input.addEventListener('blur', () => {
            input.style.borderColor = '#eee';
            input.style.backgroundColor = '#f8faff';
            input.parentElement.style.transform = 'translateX(0)';
        });
    });

    // 2. معالجة عملية "إنشاء الحساب" عند الضغط على الزر
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault(); // منع الصفحة من إعادة التحميل

            // جلب القيم من الحقول
            const userData = {
                fullName: document.querySelector('input[placeholder*="الاسم"]').value,
                email: document.querySelector('input[type="email"]').value,
                phone: document.querySelector('input[type="tel"]').value,
                password: document.querySelector('input[type="password"]').value
            };

            // التحقق من الحقول الفارغة
            if (Object.values(userData).some(value => value.trim() === "")) {
                showToast("يرجى ملء جميع الحقول!", "error");
                return;
            }

            // فحص صحة البريد الإلكتروني
            if (!validateEmail(userData.email)) {
                showToast("البريد الإلكتروني غير صحيح", "error");
                return;
            }

            // إذا كان كل شيء تمام
            console.log("تم استلام البيانات بنجاح:", userData);
            showToast("جاري إنشاء حسابك بنجاح...", "success");
            
            // هنا يمكنك إضافة كود إرسال البيانات للسيرفر لاحقاً
        });
    }

    // دالة مساعدة لفحص الإيميل
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // دالة بسيطة لإظهار رسائل تنبيه (Toast) بدلاً من alert التقليدي
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 25px;
            border-radius: 8px;
            color: white;
            font-family: 'Cairo', sans-serif;
            background: ${type === 'error' ? '#ff4d4d' : '#4caf50'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.5s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});