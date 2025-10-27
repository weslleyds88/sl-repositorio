import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, getPreviousMonth, getNextMonth } from '../utils/dateUtils';
import ExportButtons from './ExportButtons';
import Notifications from './Notifications';

// Função auxiliar para formatar nome do mês

const Dashboard = ({ db, members, payments, currentMonth, onMonthChange, onRefresh, isAdmin, supabase, currentUser }) => {
  // Função auxiliar para formatar nome do mês
  const formatMonthName = (monthString) => {
    if (!monthString) return 'Mês inválido';

    const [year, month] = monthString.split('-');
    const monthIndex = parseInt(month) - 1; // Converter para 0-11

    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return `${months[monthIndex]} ${year}`;
  };

  const [stats, setStats] = useState({
    totalAthletes: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalPaidExpenses: 0,
    pendingPayments: 0,
    paidPayments: 0,
    balance: 0,
    cashAvailable: 0
  });

  const [recentPayments, setRecentPayments] = useState([]);
  const [athleteStats, setAthleteStats] = useState({
    myPayments: 0,
    myPaidPayments: 0,
    myPendingPayments: 0,
    myTotalPending: 0,
    myDuePayments: 0,
    myOverduePayments: 0,
    myTotalDue: 0,
    myTotalOverdue: 0
  });

  useEffect(() => {
    calculateStats();
    loadRecentPayments();
  }, [members, payments, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStats = () => {
    // Estatísticas gerais (para admin)
    if (isAdmin) {
      // Filtrar pagamentos do mês atual para estatísticas mensais
      const monthPayments = payments.filter(payment => {
        if (!payment.due_date) return false;
        const paymentDate = new Date(payment.due_date);
        const [currentYear, currentMonthNum] = currentMonth.split('-');
        return paymentDate.getFullYear() === parseInt(currentYear) &&
               paymentDate.getMonth() === parseInt(currentMonthNum) - 1;
      });

      // Receitas do mês atual (apenas de atletas - mensalidades)
      const totalIncome = monthPayments
        .filter(p => (p.status === 'paid' || p.status === 'pending') && p.member_id)
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Despesas do mês atual (todas as despesas, incluindo as totalmente pagas)
      // Despesas são identificadas por NÃO ter member_id (diferente de mensalidades)
      const expenses = monthPayments.filter(p =>
        !p.member_id && p.category !== 'Saída de Caixa' &&
        (p.status === 'expense' || p.status === 'partial' || (p.status === 'paid' && p.amount > 0))
      );
      const totalExpenses = expenses.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const totalPaidExpenses = expenses.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);

      const cashOutflows = monthPayments.filter(p => p.category === 'Saída de Caixa');
      const totalCashOutflows = cashOutflows.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Contar pagamentos de atletas pendentes
      const pendingAthletePayments = monthPayments.filter(p => p.status === 'pending' && p.member_id).length;
      const paidAthletePayments = monthPayments.filter(p => p.status === 'paid' && p.member_id).length;

      // Contar despesas pendentes (não pagas completamente)
      const pendingExpenses = expenses.filter(p => p.status === 'expense' || p.status === 'partial').length;

      // Total de pendentes = atletas pendentes + despesas pendentes
      const totalPending = pendingAthletePayments + pendingExpenses;

      // Saldo do mês atual (Receitas - Despesas pagas)
      // Não subtraímos totalCashOutflows porque elas já estão incluídas em totalPaidExpenses
      const balance = totalIncome - (totalPaidExpenses + totalCashOutflows);

      // CAIXA ACUMULADO: Apenas receitas dos mensalistas - saídas de caixa
      const allTimeIncome = payments
        .filter(p => p.status === 'paid' && p.member_id) // Todas as mensalidades pagas vão para o caixa
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      const allTimeCashOutflows = payments
        .filter(p => p.category === 'Saída de Caixa')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Caixa disponível = Receitas dos atletas - Saídas de caixa
      const cashAvailable = allTimeIncome - allTimeCashOutflows;

      setStats({
        totalAthletes: members.length,
        totalIncome,
        totalExpenses, // Total de despesas (pagas + pendentes)
        totalPaidExpenses: totalPaidExpenses + totalCashOutflows, // Despesas efetivamente pagas
        pendingPayments: totalPending, // Atletas pendentes + despesas pendentes
        paidPayments: paidAthletePayments, // Apenas atletas que pagaram
        balance,
        cashAvailable
      });
    } else {
      // Estatísticas para atleta - APENAS pagamentos do usuário logado
      console.log('👤 Dashboard do Atleta - Current User:', currentUser);
      console.log('👤 ID do usuário logado:', currentUser?.id);
      console.log('📋 Total de pagamentos no sistema:', payments.length);
      
      // Se não tem currentUser, não mostrar nada
      if (!currentUser || !currentUser.id) {
        console.warn('⚠️ Usuário não identificado, aguardando login...');
        setAthleteStats({
          myPayments: 0,
          myPaidPayments: 0,
          myPendingPayments: 0,
          myTotalPending: 0,
          myDuePayments: 0,
          myOverduePayments: 0,
          myTotalDue: 0,
          myTotalOverdue: 0
        });
        return;
      }
      
      // Filtrar APENAS os pagamentos deste usuário específico
      const myPayments = payments.filter(p => {
        const isMyPayment = p.member_id === currentUser.id;
        if (isMyPayment) {
          console.log('✅ Pagamento do usuário encontrado:', p);
        }
        return isMyPayment;
      });
      
      console.log('🎯 Pagamentos filtrados para este usuário:', myPayments.length);
      
      // Separar pagamentos pendentes em "a vencer" e "vencidos"
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
      
      const pendingPayments = myPayments.filter(p => p.status === 'pending');
      const duePayments = pendingPayments.filter(p => {
        const dueDate = new Date(p.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today;
      });
      const overduePayments = pendingPayments.filter(p => {
        const dueDate = new Date(p.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
      
      const myTotalPayments = myPayments.length;
      const myPaidPayments = myPayments.filter(p => p.status === 'paid').length;
      const myPendingPayments = pendingPayments.length;
      const myTotalPending = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const myDuePayments = duePayments.length;
      const myOverduePayments = overduePayments.length;
      const myTotalDue = duePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const myTotalOverdue = overduePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      console.log('📊 Estatísticas FINAIS do atleta:', {
        userId: currentUser.id,
        totalPayments: myTotalPayments,
        paid: myPaidPayments,
        pending: myPendingPayments,
        totalPending: myTotalPending,
        due: myDuePayments,
        overdue: myOverduePayments,
        totalDue: myTotalDue,
        totalOverdue: myTotalOverdue
      });

      setAthleteStats({
        myPayments: myTotalPayments,
        myPaidPayments,
        myPendingPayments,
        myTotalPending,
        myDuePayments,
        myOverduePayments,
        myTotalDue,
        myTotalOverdue
      });
    }
  };

  const loadRecentPayments = async () => {
    const recent = payments
      .filter(p => p.paid_at)
      .sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
      .slice(0, 5);

    setRecentPayments(recent);
  };

  // Função removida - não está sendo usada
  // const handleMarkPaid = async (paymentId) => {
  //   const success = await db.markPaid(paymentId);
  //   if (success) {
  //     onRefresh();
  //   }
  // };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.name : 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pendente' },
      paid: { class: 'status-paid', label: 'Pago' },
      expense: { class: 'status-expense', label: 'Despesa' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header com Usuário */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {/* Foto do Usuário */}
          <div className="flex-shrink-0">
            {currentUser?.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name || 'Usuário'}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-300"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center"
              style={{ display: currentUser?.avatar_url ? 'none' : 'flex' }}
            >
              <span className="text-primary-600 font-medium text-2xl">
                {currentUser?.full_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          </div>

          {/* Nome e Descrição */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser?.full_name || 'Usuário'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isAdmin
                ? 'Administrador - Visão geral das finanças'
                : 'Visualize suas mensalidades e taxas'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Notifications
            supabase={supabase}
            currentUser={currentUser}
            isVisible={!!currentUser}
          />
          {isAdmin && (
            <>
              <ExportButtons
                members={members}
                payments={payments.filter(p => p.due_date && p.due_date.startsWith(currentMonth))}
                db={db}
              />
              <button
                onClick={onRefresh}
                className="btn btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Seletor de Mês - apenas admin */}
      {isAdmin && (
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={() => onMonthChange(getPreviousMonth(currentMonth))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 mx-4 min-w-[200px] text-center">
            {formatMonthName(currentMonth)}
          </h2>
          <button
            onClick={() => onMonthChange(getNextMonth(currentMonth))}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Cards de Estatísticas - diferentes para admin vs atleta */}
      {isAdmin ? (
        <>
          {/* Cards para Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total de Atletas</p>
                  <p className="text-lg font-bold text-gray-900 whitespace-nowrap">{stats.totalAthletes}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Receitas</p>
                  <p className="text-lg font-bold text-success-600 whitespace-nowrap">{formatCurrency(stats.totalIncome)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-danger-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Despesas</p>
                  <p className="text-lg font-bold text-danger-600 whitespace-nowrap">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-lg font-bold text-warning-600 whitespace-nowrap">{stats.pendingPayments}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Pagos</p>
                  <p className="text-lg font-bold text-success-600 whitespace-nowrap">{stats.paidPayments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Saldo do Mês - apenas admin */}
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro do Mês</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <p className="text-sm text-green-600 font-medium">💵 Receitas</p>
                <p className="text-2xl font-bold text-success-600">{formatCurrency(stats.totalIncome)}</p>
                <p className="text-xs text-green-500 mt-1">Total de cobranças do mês</p>
              </div>
              <div className="text-center bg-red-50 rounded-lg p-4 border-2 border-red-200">
                <p className="text-sm text-red-600 font-medium">💳 Despesas Pagas</p>
                <p className="text-2xl font-bold text-danger-600">{formatCurrency(stats.totalPaidExpenses)}</p>
                <p className="text-xs text-red-500 mt-1">Total de gastos do mês</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Cards para Atleta */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Pagos</p>
                  <p className="text-lg font-bold text-success-600">{athleteStats.myPaidPayments}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">A Vencer</p>
                  <p className="text-lg font-bold text-yellow-600">{athleteStats.myDuePayments}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(athleteStats.myTotalDue)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Vencidos</p>
                  <p className="text-lg font-bold text-red-600">{athleteStats.myOverduePayments}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(athleteStats.myTotalOverdue)}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total de Cobranças</p>
                  <p className="text-lg font-bold text-primary-600">{athleteStats.myPayments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link rápido para pagamentos - apenas atletas */}
          <div className="card p-6 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <Link
                to="/payments"
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ver Minhas Despesas
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Pagamentos Recentes - apenas admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pagamentos Recentes</h3>
              <Link to="/members" className="text-blue-600 hover:text-blue-800 font-medium">
                Novo Atleta →
              </Link>
            </div>
            <div className="space-y-3">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{getMemberName(payment.member_id)}</p>
                      <p className="text-sm text-gray-600">{payment.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum pagamento recente</p>
              )}
            </div>
          </div>

          {/* Links Rápidos - apenas admin */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <Link
                to="/payments"
                className="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-primary-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gerar Cobrança</p>
                  <p className="text-sm text-gray-600">Registrar mensalidade de atleta</p>
                </div>
              </Link>

              <Link
                to="/expenses"
                className="flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nova Despesa</p>
                  <p className="text-sm text-gray-600">Registrar gasto do time</p>
                </div>
              </Link>

              <Link
                to="/members"
                className="flex items-center p-3 bg-success-50 hover:bg-success-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-success-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Novo Atleta</p>
                  <p className="text-sm text-gray-600">Cadastrar novo atleta do time</p>
                </div>
              </Link>

              <Link
                to="/calendar"
                className="flex items-center p-3 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-warning-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ver Calendário</p>
                  <p className="text-sm text-gray-600">Visualização mensal dos pagamentos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
