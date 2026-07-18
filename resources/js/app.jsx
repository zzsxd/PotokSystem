import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Inbox, BarChart3, Users, Settings, Search, Plus, Bell,
  Download, SlidersHorizontal, MoreHorizontal, Globe2, Send, Phone, Mail,
  Handshake, Clock3, ArrowUpRight, X, ChevronDown, MessageSquare, Calendar,
  CheckCircle2, AlertCircle, Menu, List, Columns3, RefreshCw, TrendingUp,
  CircleDollarSign, Zap, ExternalLink, ShieldCheck, LogOut, UserPlus, Trash2,
  Edit3, Eye, LockKeyhole
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const stages = [
  { key: 'new', label: 'Новые', color: '#e36b3f' },
  { key: 'in_progress', label: 'В работе', color: '#52796f' },
  { key: 'proposal', label: 'Предложение', color: '#7b6d8d' },
  { key: 'won', label: 'Сделка', color: '#3a7d44' },
];
const sourceMeta = {
  site: { label: 'Сайт', icon: Globe2, color: '#4967b2' },
  telegram: { label: 'Telegram', icon: Send, color: '#229ed9' },
  phone: { label: 'Телефон', icon: Phone, color: '#567568' },
  email: { label: 'Почта', icon: Mail, color: '#a15c38' },
  partner: { label: 'Партнёр', icon: Handshake, color: '#7b6d8d' },
};
const money = value => new Intl.NumberFormat('ru-RU').format(value || 0) + ' ₽';
const permissionMeta = {
  view_leads: ['Просмотр заявок', 'Видит клиентов, обращения и историю'],
  manage_leads: ['Работа с заявками', 'Меняет статусы, ответственных и комментарии'],
  view_analytics: ['Просмотр аналитики', 'Видит показатели каналов и команды'],
  export_data: ['Экспорт данных', 'Может выгружать заявки в Excel'],
  manage_users: ['Управление сотрудниками', 'Создаёт пользователей и назначает права'],
};
const roleMeta = {
  admin: { label: 'Администратор', tone: 'violet' },
  manager: { label: 'Менеджер', tone: 'green' },
  observer: { label: 'Наблюдатель', tone: 'gray' },
};
const relative = date => {
  if (!date) return '—';
  const mins = Math.max(1, Math.round((Date.now() - new Date(date)) / 60000));
  if (mins < 60) return `${mins} мин назад`;
  if (mins < 1440) return `${Math.round(mins / 60)} ч назад`;
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(date));
};

function Source({ source, compact = false }) {
  const meta = sourceMeta[source] || sourceMeta.site;
  const Icon = meta.icon;
  return <span className={`source ${compact ? 'compact' : ''}`} style={{ '--source': meta.color }}>
    <Icon size={compact ? 12 : 13} /> {!compact && meta.label}
  </span>;
}

function Avatar({ name, team, small = false }) {
  const found = team?.find(person => person.name === name);
  if (!found) return <span className={`avatar empty ${small ? 'small' : ''}`}>?</span>;
  return <span className={`avatar ${small ? 'small' : ''}`} style={{ background: found.color }}>{found.initials}</span>;
}

function LeadCard({ lead, team, onOpen, onMove }) {
  const overdue = lead.next_contact_at && new Date(lead.next_contact_at) < new Date();
  return <article className="lead-card" onClick={() => onOpen(lead)}>
    <div className="card-top">
      <Source source={lead.source} />
      <button className="icon-btn tiny" aria-label="Меню"><MoreHorizontal size={16} /></button>
    </div>
    <h3>{lead.client_name}</h3>
    <p className="company">{lead.company}</p>
    <p className="lead-message">{lead.message}</p>
    <div className="value-row">
      <strong>{money(lead.amount)}</strong>
      {lead.priority === 'high' && <span className="priority">Важно</span>}
    </div>
    <div className="lead-footer">
      <Avatar name={lead.assignee} team={team} small />
      <span className={overdue ? 'overdue' : ''}><Clock3 size={13} /> {overdue ? 'Просрочено' : relative(lead.last_activity_at)}</span>
      <select value={lead.status} onClick={event => event.stopPropagation()} onChange={event => onMove(lead, event.target.value)} aria-label="Изменить этап">
        {stages.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}
        <option value="lost">Отказ</option>
      </select>
    </div>
  </article>;
}

function LeadDrawer({ lead, team, onClose, onUpdate, onComment }) {
  const [comment, setComment] = useState('');
  if (!lead) return null;
  const stage = stages.find(item => item.key === lead.status);
  const submitComment = async () => {
    if (!comment.trim()) return;
    await onComment(lead, comment);
    setComment('');
  };
  return <div className="overlay" onMouseDown={onClose}>
    <aside className="drawer" onMouseDown={event => event.stopPropagation()}>
      <header className="drawer-head">
        <div><span className="eyebrow">Заявка #{String(lead.id).padStart(4, '0')}</span><h2>{lead.client_name}</h2></div>
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="drawer-scroll">
        <div className="client-summary">
          <div className="client-mark">{lead.client_name.split(' ').map(x => x[0]).join('').slice(0, 2)}</div>
          <div><strong>{lead.company}</strong><span>{lead.message}</span></div>
        </div>
        <div className="quick-actions">
          <a href={`tel:${lead.phone}`}><Phone size={17} /> Позвонить</a>
          <a href={`mailto:${lead.email}`}><Mail size={17} /> Написать</a>
          <button><Calendar size={17} /> Встреча</button>
        </div>
        <section className="drawer-section">
          <div className="section-title"><h3>Работа с заявкой</h3><Source source={lead.source} /></div>
          <div className="field-grid">
            <label>Статус<select value={lead.status} onChange={event => onUpdate(lead, { status: event.target.value })}>
              {stages.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}<option value="lost">Отказ</option>
            </select></label>
            <label>Приоритет<select value={lead.priority} onChange={event => onUpdate(lead, { priority: event.target.value })}>
              <option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option>
            </select></label>
            <label>Ответственный<select value={lead.assignee || ''} onChange={event => onUpdate(lead, { assignee: event.target.value || null })}>
              <option value="">Не назначен</option>{team.map(person => <option key={person.name}>{person.name}</option>)}
            </select></label>
            <label>Бюджет<input type="number" value={lead.amount} onChange={event => onUpdate(lead, { amount: Number(event.target.value) })} /></label>
          </div>
          <div className="contact-list">
            <div><Phone size={16} /><span>Телефон</span><a href={`tel:${lead.phone}`}>{lead.phone}</a></div>
            <div><Mail size={16} /><span>Почта</span><a href={`mailto:${lead.email}`}>{lead.email}</a></div>
          </div>
        </section>
        <section className="drawer-section">
          <div className="section-title"><h3>История</h3><span>{lead.activities?.length || 0} событий</span></div>
          <div className="comment-box">
            <textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Добавить комментарий..." />
            <button className="send-comment" disabled={!comment.trim()} onClick={submitComment}><Send size={16} /></button>
          </div>
          <div className="timeline">
            {(lead.activities || []).map(activity => <div className="event" key={activity.id}>
              <div className={`event-icon ${activity.type}`}><MessageSquare size={14} /></div>
              <div><strong>{activity.author}</strong><p>{activity.body}</p><time>{relative(activity.created_at)}</time></div>
            </div>)}
          </div>
        </section>
      </div>
      <footer className="drawer-footer">
        <span className="status-dot" style={{ background: stage?.color || '#999' }} /> {stage?.label || 'Отказ'}
        <button className="primary" onClick={() => onUpdate(lead, { status: 'won' })}><CheckCircle2 size={17} /> Закрыть сделку</button>
      </footer>
    </aside>
  </div>;
}

function NewLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ client_name: '', company: '', phone: '', email: '', source: 'site', message: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true);
    const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount || 0) }) });
    if (response.ok) { await onCreated(); onClose(); } else setBusy(false);
  };
  return <div className="overlay modal-overlay" onMouseDown={onClose}>
    <form className="modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">Новая запись</span><h2>Добавить заявку</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button></div>
      <div className="modal-grid">
        <label>Имя клиента *<input required autoFocus value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Иван Петров" /></label>
        <label>Компания<input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Название компании" /></label>
        <label>Телефон<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+7 999 000-00-00" /></label>
        <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mail@company.ru" /></label>
        <label>Источник<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{Object.entries(sourceMeta).map(([key, value]) => <option value={key} key={key}>{value.label}</option>)}</select></label>
        <label>Бюджет<input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="100 000" /></label>
        <label className="wide">Комментарий<textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Что нужно клиенту?" /></label>
      </div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Отмена</button><button className="primary" disabled={busy}>{busy ? <RefreshCw className="spin" size={17} /> : <Plus size={17} />} Создать заявку</button></div>
    </form>
  </div>;
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: 'admin@potok.ru', password: 'password', remember: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    if (response.ok) onLogin(payload.user);
    else { setError(payload.errors?.email?.[0] || payload.message || 'Не удалось войти'); setBusy(false); }
  };
  return <div className="login-page">
    <div className="login-visual">
      <div className="login-brand"><div className="brand-icon"><Zap size={20} /></div><strong>поток</strong></div>
      <div className="login-story">
        <span className="login-kicker">Заявки без потерь</span>
        <h1>Вся работа с клиентами — в одном потоке.</h1>
        <p>Собирайте обращения, распределяйте между командой и контролируйте результат без ручной рутины.</p>
        <div className="login-proof">
          <div><strong>12</strong><span>заявок сегодня</span></div>
          <div><strong>16,7%</strong><span>конверсия</span></div>
          <div><strong>5 мин</strong><span>до первого ответа</span></div>
        </div>
      </div>
      <div className="login-orbit">
        <span className="orbit-card one"><Send size={16} /> Telegram</span>
        <span className="orbit-card two"><Globe2 size={16} /> Сайт</span>
        <span className="orbit-card three"><Phone size={16} /> Звонки</span>
        <div className="orbit-core"><Zap size={27} /></div>
      </div>
      <small>© 2026 Поток · Система автоматизации заявок</small>
    </div>
    <div className="login-form-side">
      <form className="login-form" onSubmit={submit}>
        <div className="mobile-login-brand"><div className="brand-icon"><Zap size={18} /></div><strong>поток</strong></div>
        <span className="eyebrow">Безопасный вход</span>
        <h2>С возвращением</h2>
        <p>Введите данные своей учётной записи</p>
        {error && <div className="login-error"><AlertCircle size={16} /> {error}</div>}
        <label>Рабочая почта<input type="email" required autoFocus value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.ru" /></label>
        <label>Пароль
          <div className="password-field"><LockKeyhole size={16} /><input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
        </label>
        <div className="remember-row"><label className="check-label"><input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} /><span /> Запомнить меня</label><button type="button">Забыли пароль?</button></div>
        <button className="primary login-submit" disabled={busy}>{busy ? <RefreshCw className="spin" size={18} /> : <ArrowUpRight size={18} />} Войти в систему</button>
        <div className="demo-hint"><ShieldCheck size={16} /><span>Демо-доступ уже заполнен<br /><b>admin@potok.ru · password</b></span></div>
      </form>
    </div>
  </div>;
}

function UserModal({ user, permissions, onClose, onSaved }) {
  const empty = { name: '', email: '', password: '', role: 'manager', permissions: ['view_leads', 'manage_leads'], is_active: true };
  const [form, setForm] = useState(user ? { ...user, password: '', permissions: user.permissions || [] } : empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const togglePermission = permission => setForm(current => ({
    ...current,
    permissions: current.permissions.includes(permission)
      ? current.permissions.filter(item => item !== permission)
      : [...current.permissions, permission],
  }));
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch(user ? `/api/admin/users/${user.id}` : '/api/admin/users', {
      method: user ? 'PATCH' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = response.status === 204 ? {} : await response.json();
    if (response.ok) { await onSaved(); onClose(); }
    else { setError(payload.message || Object.values(payload.errors || {})[0]?.[0] || 'Не удалось сохранить'); setBusy(false); }
  };
  return <div className="overlay modal-overlay" onMouseDown={onClose}>
    <form className="modal user-modal" onSubmit={submit} onMouseDown={e => e.stopPropagation()}>
      <div className="modal-head"><div><span className="eyebrow">{user ? 'Редактирование' : 'Новый сотрудник'}</span><h2>{user ? user.name : 'Добавить пользователя'}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button></div>
      <div className="user-form-body">
        {error && <div className="login-error"><AlertCircle size={16} /> {error}</div>}
        <div className="modal-grid">
          <label>Имя и фамилия *<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Анна Смирнова" /></label>
          <label>Рабочая почта *<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.ru" /></label>
          <label>Роль<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{Object.entries(roleMeta).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
          <label>{user ? 'Новый пароль' : 'Пароль *'}<input required={!user} minLength="8" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={user ? 'Оставьте пустым, чтобы не менять' : 'Не менее 8 символов'} /></label>
        </div>
        <div className="access-heading"><div><strong>Права доступа</strong><span>Выберите доступные сотруднику действия</span></div><label className="switch-label">Активен<input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /><span /></label></div>
        <div className={`permission-list ${form.role === 'admin' ? 'disabled' : ''}`}>
          {permissions.map(permission => <label className="permission-item" key={permission}>
            <input type="checkbox" disabled={form.role === 'admin'} checked={form.role === 'admin' || form.permissions.includes(permission)} onChange={() => togglePermission(permission)} />
            <span className="permission-check"><CheckCircle2 size={15} /></span>
            <div><strong>{permissionMeta[permission]?.[0]}</strong><small>{permissionMeta[permission]?.[1]}</small></div>
          </label>)}
        </div>
      </div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Отмена</button><button className="primary" disabled={busy}>{busy ? <RefreshCw className="spin" size={17} /> : <ShieldCheck size={17} />} Сохранить</button></div>
    </form>
  </div>;
}

function AdminUsers({ currentUser }) {
  const [state, setState] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const loadUsers = async () => setState(await (await fetch('/api/admin/users', { credentials: 'same-origin' })).json());
  useEffect(() => { loadUsers(); }, []);
  const remove = async user => {
    if (!window.confirm(`Удалить пользователя «${user.name}»?`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json' } });
    await loadUsers();
  };
  if (!state) return <div className="admin-loading"><RefreshCw className="spin" size={18} /> Загружаем сотрудников</div>;
  return <div className="admin-users">
    <div className="admin-summary">
      <div><Users size={20} /><span><strong>{state.users.length}</strong> сотрудников</span></div>
      <div><ShieldCheck size={20} /><span><strong>{state.users.filter(user => user.role === 'admin').length}</strong> администратора</span></div>
      <div><Eye size={20} /><span><strong>{state.users.filter(user => user.is_active).length}</strong> активных</span></div>
      <button className="primary" onClick={() => setEditing(null)}><UserPlus size={17} /> Добавить сотрудника</button>
    </div>
    <section className="users-card">
      <div className="users-card-head"><div><h3>Сотрудники и доступы</h3><p>Управляйте ролями и разрешениями команды</p></div><div className="mini-search"><Search size={15} /> Поиск сотрудника</div></div>
      <div className="users-table-wrap"><table className="users-table"><thead><tr><th>Сотрудник</th><th>Роль</th><th>Права</th><th>Последний вход</th><th>Статус</th><th /></tr></thead>
      <tbody>{state.users.map(user => <tr key={user.id}>
        <td><div className="user-cell"><span className="user-avatar">{user.name.split(' ').map(x => x[0]).join('').slice(0, 2)}</span><div><strong>{user.name}</strong><small>{user.email}{user.id === currentUser.id && ' · это вы'}</small></div></div></td>
        <td><span className={`role-badge ${roleMeta[user.role]?.tone}`}>{roleMeta[user.role]?.label}</span></td>
        <td><div className="permission-chips">{(user.permissions || []).slice(0, 3).map(item => <span key={item}>{permissionMeta[item]?.[0]}</span>)}{(user.permissions || []).length > 3 && <b>+{user.permissions.length - 3}</b>}</div></td>
        <td>{user.last_login_at ? relative(user.last_login_at) : <span className="muted">Ещё не входил</span>}</td>
        <td><span className={`account-status ${user.is_active ? 'active' : ''}`}><i />{user.is_active ? 'Активен' : 'Заблокирован'}</span></td>
        <td><div className="row-actions"><button aria-label={`Редактировать ${user.name}`} onClick={() => setEditing(user)}><Edit3 size={15} /></button><button className="danger" disabled={user.id === currentUser.id} aria-label={`Удалить ${user.name}`} onClick={() => remove(user)}><Trash2 size={15} /></button></div></td>
      </tr>)}</tbody></table></div>
    </section>
    {editing !== undefined && <UserModal user={editing} permissions={state.permissions} onClose={() => setEditing(undefined)} onSaved={loadUsers} />}
  </div>;
}

function Analytics({ data }) {
  const chart = [
    { day: 'Пн', value: 6 }, { day: 'Вт', value: 9 }, { day: 'Ср', value: 7 },
    { day: 'Чт', value: 14 }, { day: 'Пт', value: 11 }, { day: 'Сб', value: 5 }, { day: 'Вс', value: data.stats.today + 7 },
  ];
  const sourceRows = Object.entries(data.sources).map(([key, value]) => ({ name: sourceMeta[key]?.label || key, value: value.count, color: sourceMeta[key]?.color || '#999' }));
  return <div className="analytics">
    <div className="analytics-grid">
      <section className="chart-card wide-chart">
        <div className="chart-head"><div><span className="eyebrow">Динамика</span><h3>Новые обращения</h3></div><span className="trend"><TrendingUp size={15} /> +18% к прошлой неделе</span></div>
        <ResponsiveContainer width="100%" height={260}><AreaChart data={chart} margin={{ left: -24, right: 12, top: 18 }}>
          <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e36b3f" stopOpacity=".32" /><stop offset="100%" stopColor="#e36b3f" stopOpacity="0" /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#e9e5dc" /><XAxis dataKey="day" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip />
          <Area type="monotone" dataKey="value" stroke="#e36b3f" strokeWidth={3} fill="url(#area)" />
        </AreaChart></ResponsiveContainer>
      </section>
      <section className="chart-card">
        <div className="chart-head"><div><span className="eyebrow">Каналы</span><h3>Источники заявок</h3></div></div>
        <div className="donut-wrap"><ResponsiveContainer width="56%" height={210}><PieChart><Pie data={sourceRows} innerRadius={58} outerRadius={85} paddingAngle={3} dataKey="value">{sourceRows.map(row => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          <div className="source-legend">{sourceRows.map(row => <div key={row.name}><i style={{ background: row.color }} /><span>{row.name}</span><strong>{row.value}</strong></div>)}</div>
        </div>
      </section>
    </div>
    <section className="team-table chart-card">
      <div className="chart-head"><div><span className="eyebrow">Команда</span><h3>Эффективность менеджеров</h3></div><button className="text-button">Полный отчёт <ArrowUpRight size={15} /></button></div>
      <table><thead><tr><th>Сотрудник</th><th>Заявок в работе</th><th>Закрыто</th><th>Конверсия</th><th>Выручка</th></tr></thead>
      <tbody>{data.team.slice(0, 2).map((person, index) => <tr key={person.name}><td><Avatar name={person.name} team={data.team} /> <span><strong>{person.name}</strong><small>{person.role}</small></span></td><td>{index ? 4 : 6}</td><td>{index ? 3 : 5}</td><td><b>{index ? '27%' : '34%'}</b></td><td>{money(index ? 387000 : 520000)}</td></tr>)}</tbody></table>
    </section>
  </div>;
}

function App() {
  const [auth, setAuth] = useState(undefined);
  const [data, setData] = useState(null);
  const [page, setPage] = useState('requests');
  const [selected, setSelected] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [view, setView] = useState('board');
  const [mobileNav, setMobileNav] = useState(false);
  const load = async () => {
    const response = await fetch('/api/dashboard', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (response.status === 401) { setAuth(null); setData(null); return; }
    if (response.ok) setData(await response.json());
  };
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(payload => setAuth(payload?.user || null));
  }, []);
  useEffect(() => { if (auth) load(); }, [auth]);
  const visible = useMemo(() => (data?.leads || []).filter(lead =>
    (source === 'all' || lead.source === source) &&
    `${lead.client_name} ${lead.company} ${lead.phone}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query, source]);
  const update = async (lead, changes) => {
    const response = await fetch(`/api/leads/${lead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(changes) });
    const updated = await response.json();
    setData(current => ({ ...current, leads: current.leads.map(item => item.id === updated.id ? updated : item) }));
    setSelected(updated);
  };
  const comment = async (lead, body) => {
    await fetch(`/api/leads/${lead.id}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ body }) });
    await load();
    const refreshed = await (await fetch('/api/dashboard')).json();
    setData(refreshed); setSelected(refreshed.leads.find(item => item.id === lead.id));
  };
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' } });
    setAuth(null); setData(null); setPage('requests');
  };
  if (auth === undefined) return <div className="loading"><div className="brand-icon"><Zap size={22} /></div><span>Проверяем доступ</span></div>;
  if (!auth) return <LoginPage onLogin={setAuth} />;
  if (!data) return <div className="loading"><div className="brand-icon"><Zap size={22} /></div><span>Собираем заявки в один поток</span></div>;

  const can = permission => auth.role === 'admin' || auth.permissions?.includes(permission);
  const nav = [
    ['dashboard', 'Обзор', LayoutDashboard], ['requests', 'Заявки', Inbox],
    ...(can('view_analytics') ? [['analytics', 'Аналитика', BarChart3]] : []),
    ['team', 'Команда', Users],
  ];
  if (auth.role === 'admin' || auth.permissions?.includes('manage_users')) nav.push(['admin', 'Администратор', ShieldCheck]);
  return <div className="shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-icon"><Zap size={19} /></div><div><strong>поток</strong><span>заявки без потерь</span></div></div>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => { setPage(key); setMobileNav(false); }}><Icon size={19} /><span>{label}</span>{key === 'requests' && <b>{data.stats.new}</b>}</button>)}</nav>
      <div className="sidebar-bottom">
        <button onClick={logout}><LogOut size={19} /><span>Выйти</span></button>
        <div className="help-card"><div><span>Нужна помощь?</span><small>Ответим за 5 минут</small></div><ExternalLink size={16} /></div>
        <div className="profile"><span className="avatar" style={{ background: '#6d597a' }}>{auth.name.split(' ').map(x => x[0]).join('').slice(0, 2)}</span><div><strong>{auth.name}</strong><span>{roleMeta[auth.role]?.label}</span></div><MoreHorizontal size={18} /></div>
      </div>
    </aside>
    <main>
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={21} /></button>
        <div className="global-search"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти заявку, клиента, телефон..." /><kbd>⌘ K</kbd></div>
        <button className="icon-btn notification"><Bell size={20} /><i /></button>
        {can('manage_leads') && <button className="primary add-button" onClick={() => setNewOpen(true)}><Plus size={18} /><span>Новая заявка</span></button>}
      </header>
      <div className="content">
        <div className="page-head">
          <div><span className="eyebrow">{page === 'admin' ? 'Управление доступом' : page === 'analytics' ? 'Отчётность' : 'Продажи'}</span><h1>{page === 'admin' ? 'Администрирование' : page === 'analytics' ? 'Аналитика' : page === 'dashboard' ? `Добрый день, ${auth.name.split(' ')[0]}` : 'Все заявки'}</h1><p>{page === 'admin' ? 'Сотрудники, роли и права доступа' : page === 'analytics' ? 'Как работают каналы и команда' : `${data.stats.total} обращений · ${data.stats.overdue} требуют внимания`}</p></div>
          {page !== 'admin' && can('export_data') && <div className="head-actions"><a className="secondary export" href="/api/export"><Download size={17} /> Экспорт</a></div>}
        </div>
        {page === 'admin' ? <AdminUsers currentUser={auth} /> : <>
        <div className="stats">
          <div className="stat"><span>Новые сегодня</span><strong>{data.stats.today}</strong><i className="positive">+24%</i></div>
          <div className="stat"><span>В работе</span><strong>{visible.filter(x => ['in_progress', 'proposal'].includes(x.status)).length}</strong><i>на 4 этапах</i></div>
          <div className="stat alert"><span>Требуют внимания</span><strong>{data.stats.overdue}</strong><i><AlertCircle size={13} /> просрочено</i></div>
          <div className="stat"><span>Конверсия</span><strong>{data.stats.conversion}%</strong><i className="positive">+3,2%</i></div>
          <div className="stat revenue"><span>Выручка</span><strong>{money(data.stats.revenue)}</strong><i>за период</i></div>
        </div>
        {page === 'analytics' ? <Analytics data={data} /> : <>
          <div className="toolbar">
            <div className="tabs"><button className="active">Активные <b>{visible.filter(x => x.status !== 'lost').length}</b></button><button>Архив</button></div>
            <div className="tools">
              <select value={source} onChange={e => setSource(e.target.value)}><option value="all">Все источники</option>{Object.entries(sourceMeta).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select>
              <button className="filter-button"><SlidersHorizontal size={16} /> Фильтры</button>
              <div className="view-toggle"><button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}><Columns3 size={17} /></button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><List size={17} /></button></div>
            </div>
          </div>
          {view === 'board' ? <div className="board">
            {stages.map(stage => {
              const leads = visible.filter(lead => lead.status === stage.key);
              return <section className="column" key={stage.key}>
                <div className="column-head"><div><i style={{ background: stage.color }} /><strong>{stage.label}</strong><span>{leads.length}</span></div><b>{money(leads.reduce((sum, lead) => sum + lead.amount, 0))}</b></div>
                <div className="column-body">{leads.map(lead => <LeadCard key={lead.id} lead={lead} team={data.team} onOpen={setSelected} onMove={(item, status) => update(item, { status })} />)}
                  {!leads.length && <div className="empty-column">Здесь пока пусто</div>}
                </div>
              </section>;
            })}
          </div> : <div className="list-card"><table><thead><tr><th>Клиент</th><th>Источник</th><th>Статус</th><th>Ответственный</th><th>Сумма</th><th>Активность</th></tr></thead><tbody>
            {visible.map(lead => <tr key={lead.id} onClick={() => setSelected(lead)}><td><strong>{lead.client_name}</strong><small>{lead.company}</small></td><td><Source source={lead.source} /></td><td>{stages.find(x => x.key === lead.status)?.label || 'Отказ'}</td><td><Avatar name={lead.assignee} team={data.team} small /> {lead.assignee || 'Не назначен'}</td><td><b>{money(lead.amount)}</b></td><td>{relative(lead.last_activity_at)}</td></tr>)}
          </tbody></table></div>}
        </>}
        </>}
      </div>
    </main>
    <LeadDrawer lead={selected} team={data.team} onClose={() => setSelected(null)} onUpdate={update} onComment={comment} />
    {newOpen && <NewLeadModal onClose={() => setNewOpen(false)} onCreated={load} />}
  </div>;
}

createRoot(document.getElementById('app')).render(<App />);
