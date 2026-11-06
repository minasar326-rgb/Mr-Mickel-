import React, { useState, useMemo } from 'react';
import { useTeacher } from '../../../context/TeacherContext';
import { useAdminUI } from '../context/AdminUIContext';
import { 
  DollarSign, TrendingUp, CreditCard, Gift, Download, 
  Calendar, Layers, CheckCircle2, Filter
} from 'lucide-react';

export default function FinanceSection() {
  const { transactions = [], stages = [], sections = [] } = useTeacher();
  const { activeStageId } = useAdminUI();

  const [dateFilter, setDateFilter] = useState('all'); // all, today, this_month

  // Strict Treasury Calculations (Paid redeemed codes ONLY - no online cards / fake promises)
  const paidTransactions = useMemo(() => {
    return transactions.filter(t => {
      const isPaidCode = t.paymentMethod === 'code' && !t.isGift && t.status === 'completed';
      if (!isPaidCode) return false;
      if (activeStageId !== 'all' && t.stageId && t.stageId !== activeStageId) return false;
      return true;
    });
  }, [transactions, activeStageId]);

  const giftTransactions = useMemo(() => {
    return transactions.filter(t => t.paymentMethod === 'code' && t.isGift);
  }, [transactions]);

  const totalRevenue = useMemo(() => {
    return paidTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [paidTransactions]);

  // Stage Breakdown
  const stageBreakdown = useMemo(() => {
    return stages.map(stg => {
      const txs = paidTransactions.filter(t => t.stageId === stg.id || (t.stageName && t.stageName.includes(stg.name)));
      const sum = txs.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      return {
        stageId: stg.id,
        stageName: stg.name,
        count: txs.length,
        total: sum
      };
    });
  }, [stages, paidTransactions]);

  // Section / Month Breakdown
  const sectionBreakdown = useMemo(() => {
    return sections
      .filter(s => activeStageId === 'all' || s.stageId === activeStageId)
      .map(sec => {
        const txs = paidTransactions.filter(t => t.targetId === sec.id);
        const sum = txs.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        return {
          sectionId: sec.id,
          sectionTitle: sec.title,
          type: sec.type,
          count: txs.length,
          total: sum
        };
      });
  }, [sections, paidTransactions, activeStageId]);

  return (
    <div className="admin-root" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Treasury Metric Cards */}
      <div className="admin-card" style={{ padding: '2rem', background: 'var(--admin-bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--admin-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--admin-text)' }}>
                الخزنة والتقارير المالية (Financial Treasury) 💰
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                سجل الإيرادات الفعلي الناتج حصرياً من الأكواد المشحونة والمفعلة بواسطة الطلاب
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #10B981', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>إجمالي الإيرادات المحصلة:</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', marginTop: '6px' }}>
              {totalRevenue.toLocaleString('ar-EG')} ج.م
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '4px' }}>
              من {paidTransactions.length} كود تفعيل مدفوع
            </span>
          </div>

          <div style={{ padding: '1.5rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #F59E0B', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>أكواد هدايا وتجريبية مجانية:</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B', marginTop: '6px' }}>
              {giftTransactions.length}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '4px' }}>
              أكواد بدون تحصيل مالي
            </span>
          </div>

          <div style={{ padding: '1.5rem', background: 'var(--admin-bg-subtle)', borderRadius: 'var(--admin-radius-md)', borderRight: '4px solid #6366F1', border: '1px solid var(--admin-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 700 }}>متوسط الإيراد لكل طالب:</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#6366F1', marginTop: '6px' }}>
              {paidTransactions.length > 0 ? Math.round(totalRevenue / paidTransactions.length) : 0} ج.م
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', display: 'block', marginTop: '4px' }}>
              معدل قيمة الكود المشحون
            </span>
          </div>
        </div>

        {/* Breakdown by Stage */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--admin-text)' }}>
          توزيع الإيرادات حسب المراحل الدراسية:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {stageBreakdown.map(s => (
            <div
              key={s.stageId}
              style={{
                padding: '1rem',
                background: 'var(--admin-bg-subtle)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-md)'
              }}
            >
              <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)', display: 'block' }}>{s.stageName}</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--admin-primary)' }}>
                  {s.total.toLocaleString('ar-EG')} ج.م
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{s.count} شحن</span>
              </div>
            </div>
          ))}
        </div>

        {/* Breakdown by Months */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--admin-text)' }}>
          توزيع الإيرادات حسب الشهور والكورسات:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {sectionBreakdown.map(sec => (
            <div
              key={sec.sectionId}
              style={{
                padding: '1rem',
                background: 'var(--admin-bg-subtle)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius-md)'
              }}
            >
              <span className="admin-badge admin-badge-primary" style={{ marginBottom: '6px' }}>
                {sec.type === 'course' ? '📁 كورس' : '📅 شهر'}
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--admin-text)', display: 'block' }}>{sec.sectionTitle}</strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981' }}>
                  {sec.total.toLocaleString('ar-EG')} ج.م
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>{sec.count} طالب</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
