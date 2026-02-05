import { useStore } from '../store';
import { Link } from 'react-router-dom';
import {
  Bell,
  Users,
  Calendar,
  ClipboardList,
  Book,
  MessageCircle,
  Camera,
  Wallet,
  Shield,
  Layout,
  CreditCard,
  CalendarDays,
  Activity,
  ListOrdered,
  Download,
} from 'lucide-react';

export function AdminView() {
  const { getIsAdmin, activities, signups, users, feedbacks } = useStore();
  const isAdmin = getIsAdmin();

  const contentPages = [
    { title: 'Oppslagstavle', icon: Bell, path: '/noticeboard' },
    { title: 'Grupper', icon: Users, path: '/groups' },
    { title: 'Dagens Planer', icon: Calendar, path: '/todays-plans' },
    { title: 'Pakkeliste', icon: ClipboardList, path: '/packing-list' },
    { title: 'Regler', icon: Book, path: '/rules' },
    { title: 'Feedback', icon: MessageCircle, path: '/feedback?mode=admin', badge: feedbacks.length > 0 ? feedbacks.length : undefined },
    { title: 'Photodrop', icon: Camera, path: '/photodrop' },
  ];

  const adminSections = [
    { title: 'Budsjett', icon: Wallet, path: '/admin/budgets' },
    { title: 'Admins', icon: Shield, path: '/admin/admins' },
    { title: 'Synlighet deltaker', icon: Layout, path: '/admin/participant-visibility' },
    { title: 'Betalingsstatus', icon: CreditCard, path: '/admin/payment-status' },
    { title: 'Deltakere', icon: Users, path: '/admin/participants' },
    { title: 'Program', icon: CalendarDays, path: '/admin/program' },
    { title: 'Aktiviteter', icon: Activity, path: '/admin/activities' },
    { title: 'Påmeldingslister', icon: ListOrdered, path: '/admin/signups' },
    { title: 'Eksport', icon: Download, path: '/admin/export' },
  ];

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:p-6 md:p-12 py-8 md:py-12 space-y-10 sm:space-y-16">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-royal/10 shadow-sm">
          <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Totalt Påmeldte</h3>
          <p className="font-display font-bold text-4xl text-royal">{signups.length}</p>
        </div>
        <div className="bg-white p-6 border border-royal/10 shadow-sm">
          <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Deltakere</h3>
          <p className="font-display font-bold text-4xl text-royal">{users.length}</p>
        </div>
        <div className="bg-white p-6 border border-royal/10 shadow-sm">
          <h3 className="font-mono text-xs uppercase text-royal/50 tracking-widest mb-2">Aktiviteter</h3>
          <p className="font-display font-bold text-4xl text-royal">{activities.length}</p>
        </div>
      </div>

      {/* Admin sections – click to open subpage */}
      <div className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-royal uppercase">Administrer</h2>
        <p className="text-royal/60 text-sm max-w-2xl">
          Klikk på et kort for å gå til den delen av dashboardet.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adminSections.map((section) => (
            <Link
              key={section.path}
              to={section.path}
              className="bg-white p-4 border border-royal/10 hover:border-royal/40 hover:shadow-md transition-all group flex flex-col items-center justify-center text-center gap-2 h-32 relative"
            >
              <section.icon className="text-royal/40 group-hover:text-royal transition-colors" size={24} />
              <span className="type-label text-royal">{section.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Content pages – app pages admins can edit */}
      <div className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-royal uppercase">Innholdssider</h2>
        <p className="text-royal/60 text-sm max-w-2xl">
          Klikk på en side for å gå til den og redigere innholdet. Se etter blyant-ikonet øverst til høyre på hver side.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {contentPages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="bg-white p-4 border border-royal/10 hover:border-royal/40 hover:shadow-md transition-all group flex flex-col items-center justify-center text-center gap-2 h-32 relative"
            >
              {page.badge != null && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {page.badge}
                </span>
              )}
              <page.icon className="text-royal/40 group-hover:text-royal transition-colors" size={24} />
              <span className="type-label text-royal">{page.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
