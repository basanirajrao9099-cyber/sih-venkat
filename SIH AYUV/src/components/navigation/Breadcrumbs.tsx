import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Operations Dashboard',
  trials: 'Clinical Trials',
  sites: 'Trial Sites & Centers',
  participants: 'Subject Registry',
  recruitment: 'Recruitment & Funnel',
  protocol: 'Protocol & Assessments',
  changesets: 'Protocol Changesets',
  impact: 'Trial Impact Analysis',
  safety: 'Pharmacovigilance & Safety',
  ethics: 'Ethics Committee (IEC/IRB)',
  regulatory: 'Regulatory Filings & GCP',
  integrations: 'EHR / EDC / LIMS Integrations',
  compiler: 'Protocol Compiler',
  demo: 'Live SIH Presentation Mode',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-[#66736B] mb-5 font-medium" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-[#2E7D5B] transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-[#2E7D5B]" />
        <span className="hidden sm:inline">Fabric</span>
      </Link>

      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const to = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C9B91] shrink-0" />
            {isLast ? (
              <span className="font-bold text-[#2E7D5B] select-none">{label}</span>
            ) : (
              <Link to={to} className="hover:text-[#26352D] transition-colors">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
