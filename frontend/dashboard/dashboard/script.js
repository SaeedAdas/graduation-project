document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navItems = document.querySelectorAll('.nav-item');
    const addBtn = document.querySelector('.add-btn');

    // ====== فتح وإغلاق القائمة الجانبية للهاتف ======
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // ====== نظام التمرير السلس (Smooth Scroll) بين الأقسام ======
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // الحصول على معرّف القسم المستهدف
            const targetId = item.getAttribute('data-target');
            
            if (targetId) {
                // تحديث القائمة الجانبية (تحديد الحالة النشطة)
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // البحث عن العنصر المستهدف والتمرير إليه بسلاسة
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }

                // إغلاق القائمة الجانبية تلقائياً في وضع الموبايل بعد النقر
                if (sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                }
            }
        });
    });

    // ====== وظيفة زر إضافة تصنيف جديد ======
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert('سيتم فتح نافذة إضافة تصنيف جديد');
            // يمكنك استبدال alert بنافذة منبثقة (Modal) في المستقبل
        });
    }
});
