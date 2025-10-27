import React, { useState, useEffect } from 'react';
import { getMonthDays, formatDate, formatCurrency, getPreviousMonth, getNextMonth } from '../utils/dateUtils';

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

const CalendarView = ({ db, payments, members, currentMonth, onMonthChange, isAdmin, currentUser }) => {
  const [monthData, setMonthData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayPayments, setDayPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    generateMonthData();
  }, [currentMonth, searchTerm, payments, isAdmin, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateMonthData = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const days = getMonthDays(year, month);
    
    // Filtrar pagamentos do mês
    let monthPayments = payments.filter(payment => {
      if (!payment.due_date) return false;
      return payment.due_date.startsWith(currentMonth);
    });

    // Se não for admin, mostrar apenas pagamentos do usuário atual
    if (!isAdmin && currentUser) {
      monthPayments = monthPayments.filter(payment => payment.member_id === currentUser.id);
    }

    // Se admin e tem termo de busca, filtrar por nome do atleta
    if (isAdmin && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      monthPayments = monthPayments.filter(payment => {
        const member = members.find(m => m.id === payment.member_id);
        if (!member) return false;
        const memberName = (member.full_name || member.name || '').toLowerCase();
        return memberName.includes(searchLower);
      });
    }

    const dayData = days.map(day => {
      const dayString = formatDate(day, 'yyyy-MM-dd');
      const dayPayments = monthPayments.filter(p => p.due_date === dayString);
      
      const income = dayPayments
        .filter(p => p.status !== 'expense')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      const expenses = dayPayments
        .filter(p => p.status === 'expense')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      return {
        date: day,
        dateString: dayString,
        income,
        expenses,
        balance: income - expenses,
        payments: dayPayments,
        count: dayPayments.length
      };
    });

    setMonthData(dayData);
  };

  const handleDayClick = (dayData) => {
    if (dayData.count > 0) {
      setSelectedDay(dayData);
      setDayPayments(dayData.payments);
    }
  };

  const closeDayModal = () => {
    setSelectedDay(null);
    setDayPayments([]);
  };

  const getMemberName = (memberId) => {
    if (!memberId) return 'Despesa Geral';
    const member = members.find(m => m.id === memberId);
    return member ? (member.full_name || member.name || 'N/A') : 'N/A';
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

  const getDayClasses = (dayData) => {
    let classes = 'p-2 min-h-[80px] border border-gray-200 cursor-pointer transition-colors duration-200 ';
    
    if (dayData.count > 0) {
      classes += 'hover:bg-gray-50 ';
    }
    
    // Destacar dias com saldo positivo/negativo
    if (dayData.balance > 0) {
      classes += 'bg-success-50 border-success-200 ';
    } else if (dayData.balance < 0) {
      classes += 'bg-danger-50 border-danger-200 ';
    } else if (dayData.count > 0) {
      classes += 'bg-warning-50 border-warning-200 ';
    }

    return classes;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin 
              ? 'Visualização mensal dos pagamentos de todos os atletas' 
              : 'Visualização mensal dos seus pagamentos'
            }
          </p>
        </div>
        
        {/* Barra de Pesquisa (apenas para admin) */}
        {isAdmin && (
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Buscar atleta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Indicador de Busca Ativa (apenas para admin) */}
      {isAdmin && searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-blue-800 font-medium">
                Filtrando por: <span className="font-bold">"{searchTerm}"</span>
              </span>
            </div>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Limpar filtro
            </button>
          </div>
        </div>
      )}

      {/* Navegação do Mês */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => onMonthChange(getPreviousMonth(currentMonth))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mx-8 min-w-[200px] text-center">
          {formatMonthName(currentMonth)}
        </h2>
        <button
          onClick={() => onMonthChange(getNextMonth(currentMonth))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legenda */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-success-100 border border-success-200 rounded mr-2"></div>
            <span>Saldo Positivo</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-danger-100 border border-danger-200 rounded mr-2"></div>
            <span>Saldo Negativo</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-warning-100 border border-warning-200 rounded mr-2"></div>
            <span>Saldo Zero</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
            <span>Sem Movimentos</span>
          </div>
        </div>
      </div>

      {/* Calendário */}
      <div className="card overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-gray-50">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>

        {/* Dias do mês */}
        <div className="grid grid-cols-7">
          {monthData.map((dayData, index) => (
            <div
              key={index}
              className={getDayClasses(dayData)}
              onClick={() => handleDayClick(dayData)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {dayData.date.getDate()}
                </span>
                {dayData.count > 0 && (
                  <span className="bg-primary-100 text-primary-800 text-xs px-1.5 py-0.5 rounded-full">
                    {dayData.count}
                  </span>
                )}
              </div>
              
              {dayData.count > 0 && (
                <div className="space-y-1">
                  {dayData.income > 0 && (
                    <div className="text-xs text-success-600">
                      +{formatCurrency(dayData.income)}
                    </div>
                  )}
                  {dayData.expenses > 0 && (
                    <div className="text-xs text-danger-600">
                      -{formatCurrency(dayData.expenses)}
                    </div>
                  )}
                  {dayData.balance !== 0 && (
                    <div className={`text-xs font-medium ${dayData.balance > 0 ? 'text-success-700' : 'text-danger-700'}`}>
                      {dayData.balance > 0 ? '+' : ''}{formatCurrency(dayData.balance)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resumo Mensal */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dias com Movimento</p>
              <p className="text-2xl font-bold text-gray-900">
                {monthData.filter(d => d.count > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-success-600">
                {formatCurrency(monthData.reduce((sum, d) => sum + d.income, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-danger-600">
                {formatCurrency(monthData.reduce((sum, d) => sum + d.expenses, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Final</p>
              <p className={`text-2xl font-bold ${monthData.reduce((sum, d) => sum + d.balance, 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatCurrency(monthData.reduce((sum, d) => sum + d.balance, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Dia */}
      {selectedDay && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Movimentos de {formatDate(selectedDay.date, 'dd/MM/yyyy')}
              </h3>
              <button
                onClick={closeDayModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Resumo do Dia */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-success-50 rounded-lg">
                <p className="text-sm text-success-600">Receitas</p>
                <p className="text-lg font-bold text-success-700">{formatCurrency(selectedDay.income)}</p>
              </div>
              <div className="text-center p-3 bg-danger-50 rounded-lg">
                <p className="text-sm text-danger-600">Despesas</p>
                <p className="text-lg font-bold text-danger-700">{formatCurrency(selectedDay.expenses)}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-lg font-bold ${selectedDay.balance >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                  {formatCurrency(selectedDay.balance)}
                </p>
              </div>
            </div>

            {/* Lista de Pagamentos */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {dayPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {getMemberName(payment.member_id)}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{payment.category}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    {payment.observation && (
                      <p className="text-xs text-gray-500 mt-1 italic">{payment.observation}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold text-lg ${payment.status === 'expense' ? 'text-danger-600' : 'text-success-600'}`}>
                      {payment.status === 'expense' ? '-' : '+'}{formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeDayModal}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
