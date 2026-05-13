// تأثير بسيط عند الضغط على زر الحفظ
document.querySelector('.save-btn').onclick = function() {
    this.innerText = "جاري الحفظ...";
    setTimeout(() => {
        alert("تم حفظ بيانات سعيد حسن!");
        this.innerText = "حفظ البيانات";
    }, 1000);
};

// التركيز على البحث عند الضغط على الأيقونة
document.querySelector('.search-icon').onclick = () => {
    document.querySelector('.search-container input').focus();
};