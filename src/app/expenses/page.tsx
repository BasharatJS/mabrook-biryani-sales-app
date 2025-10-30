'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ExpenseForm from '@/components/forms/ExpenseForm';
import ExpensesList from '@/components/expenses/ExpensesList';
import Modal from '@/components/ui/Modal';

export default function ExpensesPage() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseSuccess = () => {
    setShowExpenseForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <button 
            onClick={() => setShowExpenseForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Add Expense
          </button>
        </div>
        
        <ExpensesList refreshTrigger={refreshTrigger} />

        <Modal 
          isOpen={showExpenseForm} 
          onClose={() => setShowExpenseForm(false)}
          size="lg"
        >
          <ExpenseForm 
            onSuccess={handleExpenseSuccess}
            onCancel={() => setShowExpenseForm(false)}
          />
        </Modal>
      </div>
    </AppLayout>
  );
}