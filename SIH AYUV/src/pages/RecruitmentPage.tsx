import React from 'react';
import { UserPlus, Target, Users, TrendingUp } from 'lucide-react';
import { Card, CardHeader, MetricCard } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';
import { DEMO_RECRUITMENT } from '../data/recruitment';

export const RecruitmentPage: React.FC = () => {
  const data = DEMO_RECRUITMENT;
  const maxTarget = 400;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352D] flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#2E7D5B]" />
          Trial Recruitment Velocity
        </h1>
        <p className="text-xs text-[#66736B] mt-0.5">
          Progress tracking across target milestones, enrolled participants, and site-wise allocation.
        </p>
      </div>

      {/* 4 Core KPIs Requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Study Target"
          value={data.target}
          change="Approved Protocol"
          icon={<Target className="w-5 h-5 text-[#2E7D5B]" />}
          description="Total required sample size"
        />
        <MetricCard
          label="Total Enrolled"
          value={data.enrolled}
          change="+42 this month"
          changeType="positive"
          icon={<Users className="w-5 h-5 text-[#2E7D5B]" />}
          description="Consented and randomized"
        />
        <MetricCard
          label="Remaining Quota"
          value={data.remaining}
          change="On Schedule"
          changeType="neutral"
          icon={<UserPlus className="w-5 h-5 text-amber-700" />}
          description="Slots open across 8 sites"
        />
        <MetricCard
          label="Recruitment Rate"
          value={`${data.recruitmentPct}%`}
          change="71% of Target"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5 text-[#2E7D5B]" />}
          description="Ahead of original trajectory"
        />
      </div>

      {/* Progress Bar Card */}
      <Card className="p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#26352D]">Overall Recruitment Progress</h3>
            <p className="text-xs text-[#66736B]">
              {data.enrolled} of {data.target} target subjects enrolled ({data.remaining} remaining)
            </p>
          </div>
          <Badge variant="success" size="lg" className="self-start sm:self-auto font-mono text-sm font-bold">
            {data.recruitmentPct}% Completed
          </Badge>
        </div>

        <div className="w-full h-4 bg-[#FAF9F4] rounded-full overflow-hidden p-0.5 border border-[#E8E4D9]">
          <div
            className="h-full rounded-full bg-[#2E7D5B] transition-all duration-500"
            style={{ width: `${data.recruitmentPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-[#66736B] pt-0.5 font-mono">
          <span>0 Subjects</span>
          <span className="text-[#2E7D5B] font-bold">{data.enrolled} Enrolled (71%)</span>
          <span>Target: {data.target}</span>
        </div>
      </Card>

      {/* Grid: Trend Chart & Site-wise Recruitment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Small Simple Recruitment Trend Chart */}
        <Card className="lg:col-span-1 space-y-4 p-6 bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
          <CardHeader
            title="Recruitment Trend"
            subtitle="Cumulative monthly enrollment curve"
          />

          <div className="p-3.5 rounded-xl bg-[#FAF9F4] border border-[#E8E4D9] space-y-3">
            <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b border-[#E8E4D9]">
              {data.trend.map((pt, idx) => {
                const heightPct = Math.round((pt.enrolled / maxTarget) * 100);
                const isLatest = idx === data.trend.length - 2;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-mono text-[#2E7D5B] font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                      {pt.enrolled}
                    </span>

                    <div className="w-full max-w-[28px] h-32 bg-white rounded-t flex items-end overflow-hidden border border-[#E8E4D9]">
                      <div
                        className={`w-full rounded-t transition-all duration-500 ${
                          idx === data.trend.length - 1
                            ? 'bg-dashed bg-[#D8D2C5]'
                            : isLatest
                            ? 'bg-[#2E7D5B]'
                            : 'bg-[#7FAF91] group-hover:bg-[#2E7D5B]'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-[9px] text-[#66736B] truncate max-w-[42px] mt-1 font-mono">
                      {pt.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#66736B] pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2E7D5B] inline-block" /> Actual Enrolled
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D8D2C5] inline-block" /> Projected
              </span>
            </div>
          </div>
        </Card>

        {/* Site-wise Recruitment Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden bg-white border border-[#E8E4D9] rounded-2xl shadow-sm">
          <div className="p-5 pb-3 border-b border-[#E8E4D9]">
            <h3 className="text-sm font-semibold text-[#26352D]">Site-wise Recruitment Performance</h3>
            <p className="text-xs text-[#66736B]">Recruitment progress across investigational clinical centers</p>
          </div>

          <Table
            data={data.sites}
            keyExtractor={(s) => s.siteId}
            columns={[
              {
                header: 'Site Center',
                accessor: (s) => (
                  <div>
                    <span className="font-mono text-xs font-bold text-[#2E7D5B] bg-[#EAF4EF] px-2 py-0.5 rounded border border-[#7FAF91]/40">{s.siteId}</span>
                    <p className="text-xs font-medium text-[#26352D] mt-1">{s.siteName}</p>
                  </div>
                ),
              },
              {
                header: 'Enrolled / Target',
                accessor: (s) => (
                  <span className="text-xs font-semibold text-[#26352D]">
                    {s.enrolled} <span className="text-[#66736B] font-normal">/ {s.target}</span>
                  </span>
                ),
              },
              {
                header: 'Completion %',
                className: 'w-48',
                accessor: (s) => (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#2E7D5B] font-bold">{s.pct}%</span>
                      <span className="text-[#66736B] text-[10px]">{s.target - s.enrolled} remaining</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#FAF9F4] rounded-full overflow-hidden border border-[#E8E4D9]">
                      <div
                        className="h-full bg-[#2E7D5B] rounded-full"
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                header: 'Status',
                className: 'text-right',
                accessor: (s) => (
                  <Badge variant={s.pct >= 75 ? 'success' : s.pct >= 50 ? 'info' : 'warning'} size="sm">
                    {s.pct >= 75 ? 'On Target' : s.pct >= 50 ? 'Active' : 'Ramping'}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};
