// تفاعل قائمة التصنيفات
document.querySelectorAll('.sidebar li').forEach(item => {
    item.onclick = function() {
        document.querySelector('.sidebar li.active').classList.remove('active');
        this.classList.add('active');
    };
});

// تأثير بسيط عند التمرير للهيدر
window.onscroll = () => {
    const nav = document.querySelector('.navbar');
    nav.style.boxShadow = window.scrollY > 10 ? "0 4px 12px rgba(0,0,0,0.05)" : "none";
};