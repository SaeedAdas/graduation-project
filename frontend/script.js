const { useState, useEffect } = React;

const Sidebar = ({ activeSection }) => {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="sidebar">
            <div className="logo">ملتقى</div>
            <nav>
                <a href="#" className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                   onClick={(e) => { e.preventDefault(); scrollToSection('dashboard'); }}>
                    <i className="fas fa-th-large"></i> لوحة التحكم
                </a>
                <a href="#" className={`nav-link ${activeSection === 'users' ? 'active' : ''}`}
                   onClick={(e) => { e.preventDefault(); scrollToSection('users'); }}>
                    <i className="fas fa-users"></i> المستخدمين
                </a>
                <a href="#" className={`nav-link ${activeSection === 'categories' ? 'active' : ''}`}
                   onClick={(e) => { e.preventDefault(); scrollToSection('categories'); }}>
                    <i className="fas fa-tags"></i> التصنيفات
                </a>
                <a href="#" className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`}
                   onClick={(e) => { e.preventDefault(); scrollToSection('reports'); }}>
                    <i className="fas fa-bullhorn"></i> الإبلاغات
                </a>
            </nav>
        </div>
    );
};

const StatCard = ({ title, value, trend, trendText, isUp, iconClass, colorClass }) => {
    const trendColor = isUp ? '#10b981' : '#ef4444'; 
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'right' }}>
                    <h3 style={{ color: '#333', fontSize: '15px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{title}</h3>
                    <p style={{ fontSize: '26px', fontWeight: 'bold', margin: 0, color: '#1a1a1a' }}>{value}</p>
                </div>
                <div className={`icon-box ${colorClass}`}>
                    <i className={iconClass}></i>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px', marginTop: '18px', fontSize: '12px' }}>
                <i className="fas fa-chart-line" style={{ color: trendColor, transform: isUp ? 'none' : 'scaleY(-1)', fontSize: '14px' }}></i>
                <span style={{ color: trendColor, fontWeight: 'bold' }}>{trend}</span>
                <span style={{ color: '#94a3b8' }}>{trendText}</span>
            </div>
        </div>
    );
};

const App = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const userData = [
        { id: 1, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "فعال", sClass: "bg-active", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" },
        { id: 2, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "مجمد", sClass: "bg-frozen", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" },
        { id: 3, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "متوقف", sClass: "bg-stopped", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" },
        { id: 4, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "مجمد", sClass: "bg-frozen", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" },
        { id: 5, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "متوقف", sClass: "bg-stopped", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" },
        { id: 6, name: "محمد عباس", city: "غزة - تل الهوى", reviews: "320 مراجعة", cats: "12 تصنيف", bene: "2,541 مستفيد", status: "فعال", sClass: "bg-active", img: "b09a67c7b12c248bcdf97b21ac58d52a4d76a275.png" }
    ];

    const categoriesData = [
        { id: 1, name: "الإلكترونيات", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "فعال", sClass: "bg-active" },
        { id: 2, name: "الكاميرات", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "مجمد", sClass: "bg-frozen" },
        { id: 3, name: "الهواتف", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "متوقف", sClass: "bg-stopped" },
        { id: 4, name: "الأحذية", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "مجمد", sClass: "bg-frozen" },
        { id: 5, name: "الحواسيب", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "متوقف", sClass: "bg-stopped" },
        { id: 6, name: "الملابس", posts: "2521 منشور", active: "320 ناشط", interested: "125 مستخدم", status: "فعال", sClass: "bg-active" }
    ];

    const reportsData = [
        { id: 1, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "فعال", sClass: "bg-active" },
        { id: 2, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "مجمد", sClass: "bg-frozen" },
        { id: 3, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "متوقف", sClass: "bg-stopped" },
        { id: 4, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "مجمد", sClass: "bg-frozen" },
        { id: 5, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "متوقف", sClass: "bg-stopped" },
        { id: 6, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "فعال", sClass: "bg-active" },
        { id: 7, productImg: "540a41037299a3968030e74e6c12655ad82a083c.png", productName: "كاميرا Sony Z5 إص...", publisherName: "سعيد حسن", publisherImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", reporterName: "أمجد سليمان", reporterImg: "bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png", bene: "2,541 مستفيد", status: "فعال", sClass: "bg-active" }
    ];

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['dashboard', 'users', 'categories', 'reports'];
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 250 && rect.bottom >= 250) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const renderTable = (tableTitle, tableType, showAddBtn = false) => (
        <div style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                {/* العنوان العلوي موحد لجميع الصفحات بناءً على طلبك [cite: 64] */}
                <h1 className="page-title-header">لوحة التحكم</h1>
                {showAddBtn && (
                    <button className="add-btn">إضافة تصنيف جديد</button>
                )}
            </div>

            <div className="table-main-wrapper">
                <div className="users-list-header">
                    <div className="header-right-side">
                        {/* العنوان الداخلي للجدول يبقى كما هو لتمييز المحتوى [cite: 66] */}
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{tableTitle}</h2>
                        <div className="header-search-container" style={{ width: '350px' }}>
                            <input type="text" className="search-bar" placeholder="بحث" />
                            <i className="fas fa-search search-bar-icon"></i>
                        </div>
                    </div>
                    <div className="header-left-filters">
                        <select className="filter-select">
                            <option>اختر حالة</option>
                            <option>فعال</option>
                            <option>غير فعال</option>
                            <option>مجمد</option>
                            <option>متوقف</option>
                        </select>
                        <select className="filter-select">
                            <option>اختر شهر</option>
                            {months.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <table className="styled-table">
                    {tableType === 'users' && (
                        <>
                            <thead><tr><th>المستخدم</th><th>المدينة</th><th>المراجعات</th><th>التصنيفات</th><th>مستفيدين</th><th>الحالة</th></tr></thead>
                            <tbody>
                                {userData.map(user => (
                                    <tr key={user.id}>
                                        <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={user.img} className="user-table-img" style={{borderRadius:'50%'}} />{user.name}</div></td>
                                        <td>{user.city}</td><td>{user.reviews}</td><td>{user.cats}</td><td>{user.bene}</td>
                                        <td><span className={`status-badge ${user.sClass}`}>{user.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}
                    {tableType === 'categories' && (
                        <>
                            <thead><tr><th>التصنيف</th><th>المنشورات المرتبطة</th><th>الناشطين</th><th>المهتمين</th><th>الحالة</th></tr></thead>
                            <tbody>
                                 {categoriesData.map(cat => (
                                    <tr key={cat.id}>
                                        <td style={{ fontWeight: 'bold' }}>{cat.name}</td>
                                        <td>{cat.posts}</td><td>{cat.active}</td><td>{cat.interested}</td>
                                        <td><span className={`status-badge ${cat.sClass}`}>{cat.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}
                    {tableType === 'reports' && (
                        <>
                            <thead><tr><th>المنشور</th><th>الناشر</th><th>المبلغ</th><th>مستفيدين</th><th>لينك المنشور</th><th>الحالة</th></tr></thead>
                            <tbody>
                                {reportsData.map(report => (
                                    <tr key={report.id}>
                                        <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={report.productImg} className="user-table-img" style={{borderRadius:'4px'}} />{report.productName}</div></td>
                                        <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={report.publisherImg} className="user-table-img" style={{borderRadius:'50%'}} />{report.publisherName}</div></td>
                                        <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}><img src={report.reporterImg} className="user-table-img" style={{borderRadius:'50%'}} />{report.reporterName}</div></td>
                                        <td>{report.bene}</td>
                                        <td><a href="#" style={{color:'#0061ff', textDecoration:'underline'}}>اذهب للمنشور</a></td>
                                        <td><span className={`status-badge ${report.sClass}`}>{report.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </>
                    )}
                </table>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', width: '100vw' }}>
            <Sidebar activeSection={activeSection} />
            <main className="main-content">
                <header className="main-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                    <div className="header-search-container">
                        <input type="text" className="header-search-input" placeholder="بحث..." />
                        <i className="fas fa-search header-search-icon"></i>
                    </div>
                    <div className="header-controls-section">
                        <div className="header-bell-container" style={{marginLeft: '20px', color: '#7d8da1', fontSize: '20px'}}>
                            <i className="fas fa-bell"></i>
                            <span className="header-notification-badge">6</span>
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', marginLeft: '20px', cursor: 'pointer'}}>
                            <img src="https://flagcdn.com/w40/ps.png" width="24" style={{marginLeft: '8px'}} alt="Palestine" />
                            <span style={{marginLeft: '5px', fontSize: '14px'}}>العربية</span>
                            <i className="fas fa-chevron-down dropdown-icon"></i>
                        </div>
                        <div className="header-admin-section">
                            <i className="fas fa-chevron-down dropdown-icon" style={{marginLeft: '10px'}}></i>
                            <div className="header-admin-info">
                                <span className="header-admin-name">سعيد حسن</span>
                                <span className="header-admin-role">أدمن</span>
                            </div>
                            <img src="bf53d8345ff5ddcabab44f2b75ef32e5a9d429c7.png" className="header-avatar" />
                        </div>
                    </div>
                </header>

                <section id="dashboard" style={{ minHeight: '100vh', paddingTop: '20px' }}>
                    <div className="stats-grid">
                        <StatCard title="التصنيفات" value="266" trend="1.8%" trendText="مراجعة اضافية خلال اسبوع" isUp={true} iconClass="fas fa-th-large" colorClass="icon-orange-bg" />
                        <StatCard title="عدد المراجعات" value="185,564" trend="4.3%" trendText="هبوط خلال الاسبوع الاخير" isUp={false} iconClass="fas fa-user-check" colorClass="icon-green-bg" />
                        <StatCard title="الإبلاغات" value="2541" trend="1.3%" trendText="زيادة خلال الامس" isUp={true} iconClass="fas fa-file-alt" colorClass="icon-orange-bg" />
                        <StatCard title="المستخدمين" value="40,689" trend="8.5%" trendText="مستخدون جدد امسِِِ" isUp={true} iconClass="fas fa-users" colorClass="icon-blue-bg" />
                    </div>
                    {renderTable("إدارة لوحة التحكم", "users")}
                </section>

                <section id="users" style={{ minHeight: '100vh', paddingTop: '80px' }}>
                    {renderTable("إدارة المستخدمين", "users")}
                </section>

                <section id="categories" style={{ minHeight: '100vh', paddingTop: '80px' }}>
                    {renderTable("إدارة التصنيفات", "categories", true)}
                </section>

                <section id="reports" style={{ minHeight: '100vh', paddingTop: '80px' }}>
                    {renderTable("إدارة الإبلاغات", "reports")}
                </section>
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
