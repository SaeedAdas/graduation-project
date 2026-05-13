document.addEventListener('DOMContentLoaded', () => {
    // 1. تفاعل البحث في الهيدر
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.boxShadow = '0 0 5px rgba(79, 128, 255, 0.3)';
    });
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.boxShadow = 'none';
    });

    // 2. تغيير التصنيف النشط (Active Category)
    const categoryItems = document.querySelectorAll('.categories-card li');
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // 3. تأثيرات الأزرار (أعجبني / لم يعجبني)
    const actionButtons = document.querySelectorAll('.post-actions .btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            // إضافة حركة بسيطة عند الضغط
            if (this.classList.contains('btn-blue')) {
                console.log("تم تسجيل مراجعة إيجابية");
            }
        });
    });

    // 4. جعل الموقع متجاوب عند تغيير حجم الشاشة برمجياً (اختياري)
    window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
            console.log("نظام الهاتف مفعل");
        }
    });
});