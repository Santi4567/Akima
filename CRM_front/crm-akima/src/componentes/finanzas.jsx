import { useState } from 'react';
import { FinanceHub } from './finanzas/FinanceHub';
import { FinanceDashboard } from './finanzas/FinanceDashboard';
import { IncomeList } from './finanzas/IncomeList';
import { ExpensesList } from './finanzas/ExpensesList';
import { HasPermission } from './HasPermission';
import { PERMISSIONS } from '../config/permissions';

export const Finanzas = () => {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'income', 'expenses'

  return (
    <div>
      <FinanceHub activeTab={view} onTabChange={setView} />

      <div className="mt-6">
        {/* LÓGICA DE PERMISOS:
            - Dashboard: Requiere 'view.finance.dashboard' (Gerentes)
            - Ingresos: Requiere 'view.payments' (Cajeros/Admin)
            - Egresos: Podríamos usar 'view.payments' o 'issue.refund' (Soporte)
        */}

        {view === 'dashboard' && (
            <HasPermission required="view.finance.dashboard">
                <FinanceDashboard />
            </HasPermission>
        )}

        {view === 'income' && (
            <HasPermission any={['view.payments', 'view.finance.dashboard']}>
                <IncomeList />
            </HasPermission>
        )}

        {view === 'expenses' && (
            <HasPermission any={['issue.refund', 'view.finance.dashboard']}>
                <ExpensesList />
            </HasPermission>
        )}
      </div>
    </div>
  );
};