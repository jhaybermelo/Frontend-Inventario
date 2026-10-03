import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/reports';
import { getPublicConfig } from '../api/config';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import { TrendingUp, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function KPICard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 hidden sm:block">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${color} flex-shrink-0 ml-2`}>
          <Icon size={18} className="text-white sm:hidden" />
          <Icon size={22} className="text-white hidden sm:block" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const { data: publicConfig } = useQuery({
    queryKey: ['config-public'],
    queryFn: getPublicConfig,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-blue-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  const weekLabels = data?.week.map(d => {
    const date = new Date(d.date + 'T00:00:00');
    return date.toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
  }) ?? [];

  const weekRevenue = data?.week.map(d => parseFloat(d.total_revenue)) ?? [];

  const chartData = {
    labels: weekLabels,
    datasets: [{
      label: 'Ventas',
      data: weekRevenue,
      fill: true,
      backgroundColor: 'rgba(30, 58, 95, 0.1)',
      borderColor: '#1e3a5f',
      tension: 0.4,
      pointBackgroundColor: '#1e3a5f',
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        {publicConfig?.logo_url && (
          <img
            src={publicConfig.logo_url}
            alt="Logo"
            className="h-16 w-16 object-contain rounded-xl bg-white shadow-sm border border-gray-100 p-1.5 flex-shrink-0"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {publicConfig?.business_name ?? 'Dashboard'}
          </h2>
          <p className="text-gray-500 text-sm">Resumen de hoy</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <KPICard
          title="Ventas de Hoy"
          value={`$${parseFloat(data?.today.total_revenue ?? '0').toLocaleString('es', { minimumFractionDigits: 2 })}`}
          subtitle="Total acumulado"
          icon={TrendingUp}
          color="bg-blue-900"
        />
        <KPICard
          title="Transacciones"
          value={String(data?.today.transaction_count ?? 0)}
          subtitle="Ventas realizadas hoy"
          icon={ShoppingCart}
          color="bg-green-600"
        />
        <KPICard
          title="Stock Bajo"
          value={String(data?.low_stock_count ?? 0)}
          subtitle="Productos a reponer"
          icon={AlertTriangle}
          color="bg-yellow-500"
        />
        <KPICard
          title="Promedio"
          value={`$${(
            (data?.today.transaction_count ?? 0) > 0
              ? parseFloat(data!.today.total_revenue) / data!.today.transaction_count
              : 0
          ).toLocaleString('es', { minimumFractionDigits: 2 })}`}
          subtitle="Por transacción"
          icon={Package}
          color="bg-purple-600"
        />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Ventas — Últimos 7 días</h3>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
