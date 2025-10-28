import React, { useState, useEffect, useCallback } from 'react';
import PaymentForm from './PaymentForm';
import PaymentProofModal from './PaymentProofModal';
import PaymentProofReview from './PaymentProofReview';
import SelectPaymentModal from './SelectPaymentModal';
import ExportButtons from './ExportButtons';
import Notifications from './Notifications';
import { formatDate, formatCurrency } from '../utils/dateUtils';

const Payments = ({ db, members, payments, onRefresh, isAdmin, supabase, currentUser }) => {
  console.log('🔍 Payments component loaded');
  console.log('👤 Current user:', currentUser);
  console.log('🏛️ Is admin:', isAdmin);
  console.log('💰 Total payments:', payments.length);
  console.log('👥 Total members:', members.length);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedPaymentForProof, setSelectedPaymentForProof] = useState(null);
  const [showProofReview, setShowProofReview] = useState(false);
  const [showSelectPaymentModal, setShowSelectPaymentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'summary'
  
  // Estados para o Resumo por Atleta
  const [summarySearchTerm, setSummarySearchTerm] = useState('');
  const [summaryYear, setSummaryYear] = useState('all'); // 'all' ou '2024', '2025', etc.
  
  // Estados para filtros da Lista de Pagamentos
  const [listMonth, setListMonth] = useState('all'); // 'all' ou '0' a '11'
  const [listYear, setListYear] = useState('all'); // 'all' ou '2024', '2025', etc.

  const categories = [
    'Mensalidade',
    'Uniforme',
    'Taxa de Inscrição',
    'Taxa de Competição',
    'Taxa de Arbitragem',
    'Material Esportivo',
    'Transporte',
    'Alimentação',
    'Taxa de Quadra',
    'Taxa de Torneio',
    'Outros'
  ];

  // Carregar grupos
  const loadGroups = useCallback(async () => {
    try {
      console.log('🔍 Carregando grupos no Payments.js...');
      const { data: groupsData, error: groupsError } = await supabase
        .from('user_groups')
        .select('*')
        .order('name');

      if (groupsError) {
        console.error('❌ Erro ao buscar grupos:', groupsError);
        setGroups([]);
        return;
      }

      console.log('🏗️ Grupos encontrados no Payments.js:', groupsData);
      setGroups(groupsData || []);

    } catch (error) {
      console.error('❌ Erro ao carregar grupos:', error);
      setGroups([]);
    }
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) {
      loadGroups();
    }
  }, [isAdmin, loadGroups]);

  // Filtrar pagamentos baseado na visão (admin vs atleta)
  const filteredPayments = payments.filter(p => {
    // Se não for admin, mostrar apenas pagamentos do atleta atual
    if (!isAdmin && currentUser) {
      console.log('🔍 Filtrando pagamento para usuário:', currentUser.id, 'Pagamento:', p.id, 'Member ID:', p.member_id);

      // Verificar se o member_id do pagamento corresponde ao usuário atual
      const isUserPayment = p.member_id && p.member_id === currentUser.id;

      if (isUserPayment) {
        console.log('✅ Pagamento pertence ao usuário');
        return true;
      }

      console.log('❌ Pagamento não pertence ao usuário');
      return false;
    }

    // Admin vê todos os pagamentos (sem filtros adicionais)
    return true;
  });

  console.log('🎯 Pagamentos filtrados:', filteredPayments.length, 'de', payments.length);
  console.log('👤 Usuário atual:', currentUser);
  console.log('🏛️ Modo admin:', isAdmin);

  if (!isAdmin && currentUser) {
    console.log('👤 Pagamentos do usuário (após filtro):', filteredPayments.map(p => ({
      id: p.id,
      member_id: p.member_id,
      group_id: p.group_id,
      amount: p.amount,
      category: p.category,
      status: p.status
    })));
  }

  console.log('📋 TODOS os pagamentos (antes da filtragem):', payments.length);
  console.log('📊 Detalhes de todos os pagamentos:', payments.map(p => ({
    id: p.id,
    member_id: p.member_id,
    group_id: p.group_id,
    amount: p.amount,
    category: p.category,
    status: p.status,
    due_date: p.due_date
  })));

  console.log('👥 Membros disponíveis:', members.length);
  console.log('📋 Detalhes dos membros:', members.map(m => ({
    id: m.id,
    full_name: m.full_name,
    group_id: m.group_id,
    group_name: m.group_name
  })));

  // Aplicar filtros de mês e ano na lista de pagamentos
  const listFilteredPayments = filteredPayments.filter(p => {
    // Filtrar por mês
    if (listMonth !== 'all' && p.due_date) {
      const paymentMonth = new Date(p.due_date).getMonth();
      if (paymentMonth !== parseInt(listMonth)) return false;
    }
    
    // Filtrar por ano
    if (listYear !== 'all' && p.due_date) {
      const paymentYear = new Date(p.due_date).getFullYear().toString();
      if (paymentYear !== listYear) return false;
    }
    
    return true;
  });

  const sortedAndFilteredPayments = listFilteredPayments.map(payment => {
    // Para admin, se for pagamento de grupo, calcular valor total
    if (isAdmin && payment.group_id && payment.member_id) {
      // Buscar TODOS os pagamentos do grupo (não apenas os filtrados)
      const allGroupPayments = payments.filter(p =>
        p.group_id === payment.group_id &&
        p.category === payment.category &&
        p.amount === payment.amount &&
        p.due_date === payment.due_date
      );

      console.log('🔍 Verificando pagamento de grupo:', {
        paymentId: payment.id,
        groupId: payment.group_id,
        category: payment.category,
        amount: payment.amount,
        dueDate: payment.due_date,
        status: payment.status,
        allGroupPaymentsFound: allGroupPayments.length,
        allGroupPaymentsStatuses: allGroupPayments.map(p => ({ id: p.id, status: p.status }))
      });

      // Se tem group_id, é pagamento de grupo (mesmo com 1 pessoa)
      if (allGroupPayments.length >= 1) {
        // Este é um pagamento de grupo - mostrar apenas o primeiro como representativo
        const firstPayment = allGroupPayments.sort((a, b) => a.member_id.localeCompare(b.member_id))[0];
        if (payment.id === firstPayment.id) {
          // A contagem correta de membros é o próprio length dos pagamentos do grupo
          const groupMemberCount = allGroupPayments.length;

          // Calcular valores pagos vs pendentes do grupo (incluindo parciais)
          const paidAmount = allGroupPayments
            .reduce((sum, p) => {
              // Somar o paid_amount de cada pagamento (para pagamentos parciais)
              // ou amount completo se status for 'paid'
              const paid = p.status === 'paid' 
                ? parseFloat(p.amount || 0) 
                : parseFloat(p.paid_amount || 0);
              return sum + paid;
            }, 0);

          const totalGroupValue = groupMemberCount * parseFloat(payment.amount || 0);
          const pendingAmount = totalGroupValue - paidAmount;

          console.log('✅ Pagamento de grupo detectado:', {
            totalMembers: groupMemberCount,
            individualAmount: payment.amount,
            totalGroupValue: totalGroupValue,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            paidCount: allGroupPayments.filter(p => p.status === 'paid').length,
            partialCount: allGroupPayments.filter(p => p.status === 'partial').length,
            pendingCount: allGroupPayments.filter(p => p.status === 'pending').length,
            groupPaymentsCount: allGroupPayments.length,
            status: payment.status,
            isFirstPayment: payment.id === firstPayment.id,
            paymentDetails: allGroupPayments.map(p => ({
              id: p.id,
              status: p.status,
              amount: p.amount,
              paid_amount: p.paid_amount || 0
            }))
          });

          // Buscar nome do grupo
          const group = groups.find(g => g.id === payment.group_id);
          const groupName = group ? group.name : 'Grupo';

          return {
            ...payment,
            displayAmount: totalGroupValue,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            groupMemberCount: groupMemberCount,
            isGroupPayment: true,
            groupPayments: allGroupPayments, // Manter referência para ações
            groupName: groupName // Nome do grupo para exibição
          };
        } else {
          // Este não é o primeiro pagamento do grupo, ignorar
          console.log(' Ignorando pagamento duplicado do grupo:', payment.id);
          return null;
        }
      }
    }

    return {
      ...payment,
      displayAmount: parseFloat(payment.amount || 0),
      isGroupPayment: false
    };
  }).filter(payment => payment !== null).sort((a, b) => {
    const memberA = members.find(m => m.id === a.member_id);
    const memberB = members.find(m => m.id === b.member_id);
    const nameA = memberA && memberA.full_name ? memberA.full_name.toLowerCase() : '';
    const nameB = memberB && memberB.full_name ? memberB.full_name.toLowerCase() : '';

    return nameA.localeCompare(nameB);
  });

  console.log('🏁 Pagamentos finais processados:', sortedAndFilteredPayments.length);
  console.log('📊 Pagamentos de grupo detectados:', sortedAndFilteredPayments.filter(p => p.isGroupPayment).length);
  console.log('💰 Valores totais calculados:', sortedAndFilteredPayments.map(p => ({
    id: p.id,
    amount: p.amount,
    displayAmount: p.displayAmount,
    paidAmount: p.paidAmount || 0,
    pendingAmount: p.pendingAmount || 0,
    isGroupPayment: p.isGroupPayment,
    groupMemberCount: p.groupMemberCount,
    status: p.status,
    groupPayments: p.groupPayments ? `${p.groupPayments.length} pagamentos` : 'null'
  })));

  // Log específico para debug do botão sincronizar
  sortedAndFilteredPayments.forEach(p => {
    if (p.isGroupPayment) {
      console.log(`🔄 Pagamento de grupo ${p.id}:`, {
        isGroupPayment: p.isGroupPayment,
        groupMemberCount: p.groupMemberCount,
        hasGroupPayments: !!p.groupPayments,
        groupPaymentsLength: p.groupPayments?.length,
        shouldShowSyncButton: !!(p.isGroupPayment && p.groupPayments)
      });
    }
  });

  // Calcular resumo geral para admin
  const totalPaid = sortedAndFilteredPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalExpected = sortedAndFilteredPayments.reduce((sum, p) => sum + (p.displayAmount || 0), 0);

  console.log('📈 RESUMO GERAL:', {
    totalPayments: sortedAndFilteredPayments.length,
    totalPaid: totalPaid,
    totalExpected: totalExpected,
    progress: totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0,
    pendingAmount: totalExpected - totalPaid
  });

  // Calcular resumo por atleta
  const memberSummary = members.map(member => {
    const memberPayments = filteredPayments.filter(p => p.member_id === member.id);
    if (memberPayments.length === 0) return null;

    const totalExpected = memberPayments.reduce((sum, p) => sum + (p.displayAmount || 0), 0);
    const totalPaid = memberPayments.reduce((sum, p) => sum + (p.status === 'paid' ? (p.amount || 0) : 0), 0);

    return {
      id: member.id,
      name: member.full_name,
      totalExpected,
      totalPaid,
      totalPending: totalExpected - totalPaid,
      paymentCount: memberPayments.length
    };
  }).filter(Boolean);

  console.log('🏃 RESUMO POR ATLETA:', memberSummary);

  const handleAddPayment = () => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode adicionar novos pagamentos.');
      return;
    }
    setEditingPayment(null);
    setShowForm(true);
  };

  const handleEditPayment = (payment) => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode editar pagamentos.');
      return;
    }

    // Se for pagamento de grupo, precisamos modificar o objeto para edição
    if (payment.isGroupPayment && payment.groupPayments) {
      // Criar um objeto representativo do grupo para edição
      const groupPayment = {
        ...payment,
        id: payment.groupPayments[0].id, // Usar o ID do primeiro pagamento para edição
        member_id: null, // Indicar que é um pagamento de grupo
        group_id: payment.group_id,
        amount: payment.amount,
        category: payment.category,
        due_date: payment.due_date,
        observation: payment.observation
      };

      console.log('📝 Editando pagamento de grupo:', {
        original: payment,
        edited: groupPayment,
        totalPayments: payment.groupPayments.length
      });

      setEditingPayment(groupPayment);
      setShowForm(true);
    } else {
      // Pagamento individual normal
      setEditingPayment(payment);
      setShowForm(true);
    }
  };

  const handleSyncGroupPayments = async (payment) => {
    if (!payment.isGroupPayment || !payment.groupPayments) return;

    try {
      console.log('🔄 ========================================');
      console.log('🔄 SINCRONIZANDO PAGAMENTOS DO GRUPO');
      console.log('🔄 Grupo ID:', payment.group_id);
      console.log('🔄 ========================================');

      // Buscar membros atuais do grupo
      const { data: currentMembers, error: membersError } = await supabase
        .from('user_group_members')
        .select('user_id')
        .eq('group_id', payment.group_id);

      if (membersError) throw membersError;

      const currentMemberIds = currentMembers.map(m => m.user_id);
      const existingMemberIds = payment.groupPayments.map(p => p.member_id);

      console.log('👥 Membros atuais no grupo:', currentMemberIds.length);
      console.log('💰 Membros com pagamento:', existingMemberIds.length);

      // 1️⃣ ADICIONAR: Membros que NÃO têm pagamento ainda
      const newMembers = currentMembers.filter(m => !existingMemberIds.includes(m.user_id));
      
      // 2️⃣ REMOVER: Pagamentos de pessoas que NÃO estão mais no grupo
      const paymentsToRemove = payment.groupPayments.filter(p => !currentMemberIds.includes(p.member_id));

      console.log('➕ Novos membros a adicionar:', newMembers.length);
      console.log('➖ Membros a remover:', paymentsToRemove.length);

      let changes = [];

      // Criar/Reintegrar pagamentos para novos membros
      if (newMembers.length > 0) {
        console.log('🔍 Verificando pagamentos órfãos antes de criar novos...');
        
        let reintegratedCount = 0;
        let createdCount = 0;
        const paymentsToCreate = [];
        const paymentsToReintegrate = [];

        // Para cada novo membro, verificar se existe pagamento órfão DO MESMO GRUPO
        for (const member of newMembers) {
          console.log(`🔎 Verificando pagamentos órfãos para membro ${member.user_id}...`);
          
          // Buscar pagamento órfão (group_id = null) com mesma categoria, valor e vencimento
          const { data: orphanPayments, error: orphanError } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', member.user_id)
            .is('group_id', null)
            .eq('category', payment.category)
            .eq('amount', parseFloat(payment.amount))
            .eq('due_date', payment.due_date)
            .order('created_at', { ascending: false });

          if (orphanError) {
            console.warn('⚠️ Erro ao buscar pagamento órfão:', orphanError);
          }

          // Se encontrou pagamento órfão, verificar se é do MESMO grupo original
          let orphanToReintegrate = null;
          
          if (orphanPayments && orphanPayments.length > 0) {
            console.log(`🔍 Encontrado ${orphanPayments.length} pagamento(s) órfão(s) com mesmas características`);
            
            // Procurar por pagamento órfão que seja DO MESMO GRUPO
            for (const orphan of orphanPayments) {
              const observation = orphan.observation || '';
              
              // Verificar se a observação contém o ID do grupo original
              if (observation.includes(`ID original: ${payment.group_id}`)) {
                console.log(`✅ Pagamento órfão ID ${orphan.id} é do MESMO grupo! Pode reintegrar.`);
                orphanToReintegrate = orphan;
                break;
              } else {
                console.log(`⚠️ Pagamento órfão ID ${orphan.id} é de OUTRO grupo. Não reintegrar.`);
              }
            }
          }

          // Se encontrou pagamento órfão DO MESMO GRUPO, reintegrar
          if (orphanToReintegrate) {
            console.log(`🔄 REINTEGRANDO pagamento órfão ID ${orphanToReintegrate.id} para membro ${member.user_id}`);
            console.log(`   - Status: ${orphanToReintegrate.status}`);
            console.log(`   - Observação antiga: ${orphanToReintegrate.observation}`);
            console.log(`   - É do MESMO grupo: ${payment.group_id}`);
            
            paymentsToReintegrate.push({
              id: orphanToReintegrate.id,
              status: orphanToReintegrate.status // Mantém o status original (paid se já foi pago)
            });
          } else {
            // Não encontrou órfão DO MESMO GRUPO, criar novo pagamento
            if (orphanPayments && orphanPayments.length > 0) {
              console.log(`⚠️ Pagamentos órfãos encontrados, mas são de OUTROS grupos. Criando novo.`);
            } else {
              console.log(`➕ Nenhum pagamento órfão encontrado. Criando NOVO pagamento para membro ${member.user_id}`);
            }
            
            paymentsToCreate.push({
              amount: parseFloat(payment.amount),
              category: payment.category,
              due_date: payment.due_date,
              status: 'pending',
              observation: payment.observation,
              member_id: member.user_id,
              group_id: payment.group_id,
              pix_key: payment.pix_key || null,
              pix_name: payment.pix_name || null
            });
          }
        }

        // Reintegrar pagamentos órfãos
        if (paymentsToReintegrate.length > 0) {
          console.log(`🔄 Reintegrando ${paymentsToReintegrate.length} pagamento(s) órfão(s)...`);
          
          for (const orphanPayment of paymentsToReintegrate) {
            const { error: updateError } = await supabase
              .from('payments')
              .update({ 
                group_id: payment.group_id, // Volta para o grupo (referência do escopo externo)
                observation: 'Atleta reintegrado ao grupo' // Atualiza observação
              })
              .eq('id', orphanPayment.id);

            if (updateError) {
              console.error('❌ Erro ao reintegrar pagamento:', updateError);
            } else {
              reintegratedCount++;
              console.log(`✅ Pagamento ${orphanPayment.id} reintegrado (status mantido: ${orphanPayment.status})`);
            }
          }
        }

        // Criar novos pagamentos
        if (paymentsToCreate.length > 0) {
          console.log(`➕ Criando ${paymentsToCreate.length} novo(s) pagamento(s)...`);
          
          const { error: insertError } = await supabase
            .from('payments')
            .insert(paymentsToCreate);

          if (insertError) throw insertError;
          
          createdCount = paymentsToCreate.length;
          console.log(`✅ ${createdCount} novos pagamentos criados`);
        }

        // Criar notificações para TODOS os novos membros (reintegrados ou novos)
        try {
          const notifications = newMembers.map(member => ({
            user_id: member.user_id,
            title: 'Nova Cobrança Recebida',
            message: `Nova cobrança de ${payment.category}: R$ ${parseFloat(payment.amount).toFixed(2)} - Vencimento: ${new Date(payment.due_date).toLocaleDateString('pt-BR')}`,
            type: 'info'
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
          
          console.log('✅ Notificações enviadas para novos membros');
        } catch (notifError) {
          console.warn('⚠️ Erro ao criar notificações (não crítico):', notifError);
        }

        // Mensagem de feedback
        let addMessage = `➕ ${newMembers.length} atleta(s) adicionado(s)`;
        if (reintegratedCount > 0) {
          addMessage += ` (${reintegratedCount} reintegrado(s) com histórico preservado)`;
        }
        if (createdCount > 0 && reintegratedCount > 0) {
          addMessage += ` (${createdCount} novo(s))`;
        }
        changes.push(addMessage);
        
        console.log(`✅ Resumo: ${reintegratedCount} reintegrados + ${createdCount} novos = ${newMembers.length} total`);
      }

      // Remover pagamentos de membros que saíram do grupo
      if (paymentsToRemove.length > 0) {
        // Verificar se algum já foi pago
        const paidPayments = paymentsToRemove.filter(p => p.status === 'paid');
        
        if (paidPayments.length > 0) {
          const confirmMsg = `⚠️ ATENÇÃO: ${paidPayments.length} atleta(s) que saiu/saíram do grupo já tinha(m) pagamento APROVADO.\n\nDeseja realmente remover do grupo?\n\n✅ Pagamentos COM ticket: Serão desassociados do grupo mas PRESERVADOS no histórico\n🗑️ Pagamentos SEM ticket: Serão completamente removidos`;
          
          if (!window.confirm(confirmMsg)) {
            console.log('❌ Remoção cancelada pelo usuário');
            if (newMembers.length > 0) {
              alert(changes.join('\n'));
              await onRefresh();
            }
            return;
          }
        }

        const paymentIdsToRemove = paymentsToRemove.map(p => p.id);
        
        console.log('🗑️ Removendo pagamentos:', paymentIdsToRemove);
        
        // PASSO 1: Verificar se há tickets relacionados (para preservá-los)
        const { data: relatedTickets, error: ticketsCheckError } = await supabase
          .from('payment_tickets')
          .select('id, payment_id')
          .in('payment_id', paymentIdsToRemove);

        if (ticketsCheckError) {
          console.warn('⚠️ Erro ao verificar tickets:', ticketsCheckError);
        }

        const paymentsWithTickets = relatedTickets?.map(t => t.payment_id) || [];
        const paymentsWithoutTickets = paymentIdsToRemove.filter(id => !paymentsWithTickets.includes(id));

        console.log('🎫 Pagamentos com tickets (preservar histórico):', paymentsWithTickets.length);
        console.log('🗑️ Pagamentos sem tickets (deletar):', paymentsWithoutTickets.length);

        // PASSO 2: Para pagamentos COM tickets, apenas desassociar do grupo (manter histórico)
        if (paymentsWithTickets.length > 0) {
          // Atualizar cada pagamento individualmente para incluir o group_id original na observação
          for (const paymentId of paymentsWithTickets) {
            const { error: updateError } = await supabase
              .from('payments')
              .update({ 
                group_id: null,
                observation: `Atleta removido do grupo (ID original: ${payment.group_id}) - histórico preservado`
              })
              .eq('id', paymentId);

            if (updateError) {
              console.error('❌ Erro ao desassociar pagamento:', paymentId, updateError);
            }
          }
          console.log('✅ Pagamentos com tickets desassociados do grupo (histórico preservado com ID original)');
        }

        // PASSO 3: Para pagamentos SEM tickets, deletar comprovantes e pagamentos
        if (paymentsWithoutTickets.length > 0) {
          // Deletar comprovantes PRIMEIRO
          const { error: proofsDeleteError } = await supabase
            .from('payment_proofs')
            .delete()
            .in('payment_id', paymentsWithoutTickets);

          if (proofsDeleteError) {
            console.warn('⚠️ Erro ao deletar comprovantes:', proofsDeleteError);
          } else {
            console.log('✅ Comprovantes removidos');
          }

          // Deletar pagamentos
          const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .in('id', paymentsWithoutTickets);

          if (deleteError) throw deleteError;

          console.log(`✅ ${paymentsWithoutTickets.length} pagamentos deletados`);
        }

        let removalMsg = `➖ ${paymentsToRemove.length} atleta(s) removido(s)`;
        if (paymentsWithTickets.length > 0) {
          removalMsg += ` (${paymentsWithTickets.length} com ticket preservado para histórico)`;
        }
        changes.push(removalMsg);
        console.log(`✅ Remoção concluída:`, {
          total: paymentsToRemove.length,
          comTickets: paymentsWithTickets.length,
          semTickets: paymentsWithoutTickets.length
        });
      }

      if (changes.length === 0) {
        alert('✅ Grupo já está sincronizado! Nenhuma alteração necessária.');
      } else {
        alert('✅ Sincronização concluída!\n\n' + changes.join('\n'));
      }
      
      console.log('🔄 ========================================');
      await onRefresh();
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      alert('Erro ao sincronizar: ' + error.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode excluir pagamentos.');
      return;
    }

    // Verificar se é um pagamento de grupo
    const payment = sortedAndFilteredPayments.find(p => p.id === id);
    if (!payment) {
      alert('Pagamento não encontrado');
      return;
    }

    let paymentIdsToDelete = [id];
    let message = 'Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.';

    // Se for pagamento de grupo, incluir todos os pagamentos do grupo
    if (payment.isGroupPayment && payment.groupPayments) {
      paymentIdsToDelete = payment.groupPayments.map(p => p.id);
      message = `Tem certeza que deseja excluir este pagamento de grupo? Esta ação excluirá os pagamentos de ${payment.groupPayments.length} atletas e não pode ser desfeita.`;
    }

    if (window.confirm(message)) {
      try {
        // Excluir todos os pagamentos do grupo
        for (const paymentId of paymentIdsToDelete) {
          const success = await db.deletePayment(paymentId);
          if (!success) {
            throw new Error(`Erro ao excluir pagamento ${paymentId}`);
          }
        }

        console.log('✅ Pagamentos excluídos com sucesso');
        onRefresh();
      } catch (error) {
        console.error('❌ Erro na exclusão:', error);
        if (error.message?.includes('comprovantes') || error.message?.includes('notificações')) {
          alert('💡 Dica: Os dados relacionados foram removidos automaticamente. Os pagamentos foram excluídos com sucesso!');
          onRefresh();
        } else {
          alert('Erro ao excluir pagamento(s): ' + (error.message || 'Erro desconhecido'));
        }
      }
    }
  };

  const handleMarkPaid = async (paymentId) => {
    if (!isAdmin) {
      alert('Modo visualização: você não pode marcar pagamentos como pagos.');
      return;
    }

    // Verificar se é um pagamento de grupo
    const payment = sortedAndFilteredPayments.find(p => p.id === paymentId);
    if (!payment) {
      alert('Pagamento não encontrado');
      return;
    }

    let paymentIdsToMark = [paymentId];
    let message = 'Marcar este pagamento como pago?';

    // Se for pagamento de grupo, incluir todos os pagamentos do grupo
    if (payment.isGroupPayment && payment.groupPayments) {
      paymentIdsToMark = payment.groupPayments.map(p => p.id);
      message = `Marcar este pagamento de grupo como pago? Esta ação marcará como pagos os pagamentos de ${payment.groupPayments.length} atletas.`;
    }

    if (window.confirm(message)) {
      try {
        // Marcar todos os pagamentos do grupo como pagos
        const success = await db.markPaidBulk(paymentIdsToMark);
        if (success) {
          console.log('✅ Pagamentos marcados como pagos com sucesso');
          onRefresh();
        } else {
          alert('Erro ao marcar pagamento(s) como pago(s)');
        }
      } catch (error) {
        console.error('Erro ao marcar como pago:', error);
        alert('Erro ao marcar pagamento(s) como pago(s): ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pendente' },
      partial: { class: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Parcial' },
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

  const handleFormSubmit = async (paymentData) => {
    // O PaymentForm já fez o UPDATE/INSERT direto no banco
    // Aqui só precisamos fechar o modal e atualizar os dados
    console.log('✅ Pagamento salvo pelo PaymentForm, atualizando interface...');
    setShowForm(false);
    setEditingPayment(null);
    console.log('🔄 Chamando onRefresh para atualizar dados...');
    // Aguardar o refresh dos dados antes de continuar
    await onRefresh();
    console.log('✅ Dados atualizados com sucesso! A barrinha deve atualizar agora.');
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPayment(null);
  };

  const handleUploadProof = (payment) => {
    setSelectedPaymentForProof(payment);
    setShowProofModal(true);
  };

  const handleProofModalClose = () => {
    setShowProofModal(false);
    setSelectedPaymentForProof(null);
    onRefresh(); // Recarregar dados após envio
  };

  const handleProofReviewClose = () => {
    setShowProofReview(false);
    onRefresh(); // Recarregar dados após aprovação/rejeição
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Pagamentos dos Atletas' : 'Minhas Cobranças'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Gerencie mensalidades e taxas dos atletas'
              : 'Visualize suas mensalidades e taxas'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Notifications
            supabase={supabase}
            currentUser={currentUser}
            isVisible={true}
          />
          {isAdmin && (
            <>
              <button
                onClick={() => setShowProofReview(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                📋 Revisar Comprovantes
              </button>
              <ExportButtons
                members={members}
                payments={filteredPayments}
                db={db}
                currentMonth={null}
              />
              <button
                onClick={handleAddPayment}
                className="btn btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Gerar Cobrança
              </button>
            </>
          )}
        </div>
      </div>

      {/* Botão de ação para Atletas */}
      {!isAdmin && filteredPayments.filter(p => p.status === 'pending' || p.status === 'partial').length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowSelectPaymentModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>💳 Cadastrar Pagamento</span>
          </button>
          <p className="text-sm text-gray-500 text-center mt-2">
            Você tem {filteredPayments.filter(p => p.status === 'pending' || p.status === 'partial').length} pagamento(s) pendente(s)
          </p>
        </div>
      )}

      {/* Abas - Apenas para Admin */}
      {isAdmin && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Lista de Pagamentos
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Resumo por Atleta
            </button>
          </nav>
        </div>
      )}

      {/* Conteúdo da Aba: Lista de Pagamentos */}
      {(activeTab === 'list' || !isAdmin) && (
        <>
          {/* Filtros da Lista de Pagamentos */}
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
              
              {/* Filtro de Mês */}
              <select
                value={listMonth}
                onChange={(e) => setListMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">📅 Todos os meses</option>
                <option value="0">Janeiro</option>
                <option value="1">Fevereiro</option>
                <option value="2">Março</option>
                <option value="3">Abril</option>
                <option value="4">Maio</option>
                <option value="5">Junho</option>
                <option value="6">Julho</option>
                <option value="7">Agosto</option>
                <option value="8">Setembro</option>
                <option value="9">Outubro</option>
                <option value="10">Novembro</option>
                <option value="11">Dezembro</option>
              </select>

              {/* Filtro de Ano */}
              <select
                value={listYear}
                onChange={(e) => setListYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">📅 Todos os anos</option>
                {(() => {
                  // Gerar lista de anos disponíveis
                  const years = new Set();
                  payments.forEach(p => {
                    if (p.due_date) {
                      const year = new Date(p.due_date).getFullYear().toString();
                      years.add(year);
                    }
                  });
                  return Array.from(years).sort((a, b) => b.localeCompare(a)).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ));
                })()}
              </select>

              {/* Botão Limpar Filtros */}
              {(listMonth !== 'all' || listYear !== 'all') && (
                <button
                  onClick={() => {
                    setListMonth('all');
                    setListYear('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
                >
                  ✕ Limpar filtros
                </button>
              )}
            </div>

            {/* Indicador de Filtros Ativos */}
            {(listMonth !== 'all' || listYear !== 'all') && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-blue-800">
                  Mostrando: 
                  {listMonth !== 'all' && <span className="font-medium"> {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(listMonth)]}</span>}
                  {listMonth !== 'all' && listYear !== 'all' && ' de'}
                  {listYear !== 'all' && <span className="font-medium"> {listYear}</span>}
                </span>
              </div>
            )}
          </div>

          {/* Lista de Pagamentos */}
          <div className="card">
            {sortedAndFilteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observação
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={payment.status === 'expense' ? 'text-red-600' : 'text-green-600 font-medium'}>
                        {payment.isGroupPayment ? (
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-green-600 font-bold">
                                {formatCurrency(payment.paidAmount)}
                              </span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-gray-600">
                                {formatCurrency(payment.displayAmount)}
                              </span>
                              <span className="text-xs text-blue-600 ml-2">
                                ({payment.groupMemberCount} atletas)
                              </span>
                            </div>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${payment.displayAmount > 0 ? (payment.paidAmount / payment.displayAmount) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>
                                  {payment.groupPayments.filter(p => p.status === 'paid').length} pago(s)
                                  {payment.groupPayments.filter(p => p.status === 'partial').length > 0 && (
                                    <span className="text-yellow-600"> + {payment.groupPayments.filter(p => p.status === 'partial').length} parcial(is)</span>
                                  )}
                                </span>
                                <span>{payment.pendingAmount > 0 ? formatCurrency(payment.pendingAmount) + ' pendente' : 'Completo'}</span>
                              </div>
                            </div>
                          </div>
                        ) : !isAdmin && payment.status === 'partial' && payment.paid_amount && parseFloat(payment.paid_amount) > 0 ? (
                          /* Mostrar barra de progresso para atletas em pagamentos parciais */
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-green-600 font-bold">
                                {formatCurrency(parseFloat(payment.paid_amount))}
                              </span>
                              <span className="text-gray-400 mx-1">/</span>
                              <span className="text-gray-900 font-bold">
                                {formatCurrency(parseFloat(payment.amount))}
                              </span>
                            </div>
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${(parseFloat(payment.paid_amount) / parseFloat(payment.amount)) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-green-600">✓ Pago</span>
                                <span className="text-red-600">Falta: {formatCurrency(parseFloat(payment.amount) - parseFloat(payment.paid_amount))}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          formatCurrency(payment.displayAmount)
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.isGroupPayment ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {payment.groupName || 'Grupo'}
                        </span>
                      ) : (
                        payment.category
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div>
                        <div className="truncate">{payment.observation || '-'}</div>
                        {!isAdmin && payment.pix_key && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-semibold text-blue-900 mb-1">💳 Dados para Pagamento PIX:</div>
                            {payment.pix_name && (
                              <div className="text-gray-700">
                                <strong>Nome:</strong> {payment.pix_name}
                              </div>
                            )}
                            <div className="text-gray-700 font-mono">
                              <strong>Chave:</strong> {payment.pix_key}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Botão de anexar comprovante - APENAS para atletas (não admins) e pagamentos pendentes/parciais */}
                        {(payment.status === 'pending' || payment.status === 'partial') && !isAdmin && currentUser?.role !== 'admin' && (
                          <button
                            onClick={() => handleUploadProof(payment)}
                            className="text-blue-600 hover:text-blue-900"
                            title={payment.status === 'partial' ? 'Anexar comprovante do restante' : 'Anexar comprovante'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            {payment.isGroupPayment && payment.groupPayments && payment.groupPayments.length > 0 ? (
                              <button
                                onClick={() => {
                                  console.log('🔄 Clicou em sincronizar para pagamento:', payment);
                                  console.log('🔄 Dados do grupo:', {
                                    groupId: payment.group_id,
                                    groupPayments: payment.groupPayments.length,
                                    groupMemberCount: payment.groupMemberCount
                                  });
                                  handleSyncGroupPayments(payment);
                                }}
                                className="text-purple-600 hover:text-purple-900 transition-colors"
                                title={`🔄 Sincronizar grupo: adicionar novos atletas e remover atletas que saíram (${payment.groupMemberCount} no grupo)`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            ) : (
                              payment.isGroupPayment && (
                                <div style={{width: '20px'}} title="Grupo sem dados de sincronização">
                                  {console.log('⚠️ Botão não renderizado para:', payment.id, 'Motivo:', {
                                    isGroupPayment: payment.isGroupPayment,
                                    hasGroupPayments: !!payment.groupPayments,
                                    groupPaymentsLength: payment.groupPayments?.length
                                  })}
                                </div>
                              )
                            )}
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Marcar como Pago"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pagamento encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin
                ? 'Tente ajustar os filtros ou adicione um novo pagamento.'
                : 'Você não possui pagamentos pendentes no momento.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Resumo para Atletas */}
      {!isAdmin && filteredPayments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredPayments.filter(p => p.status === 'pending' || p.status === 'partial').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pendente</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    filteredPayments.reduce((sum, p) => {
                      if (p.status === 'pending') {
                        // Pagamento totalmente pendente, somar valor completo
                        return sum + parseFloat(p.amount || 0);
                      } else if (p.status === 'partial' && p.paid_amount) {
                        // Pagamento parcial, somar apenas o que FALTA pagar
                        const remaining = parseFloat(p.amount || 0) - parseFloat(p.paid_amount || 0);
                        return sum + remaining;
                      }
                      return sum;
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo para Admin */}
      {isAdmin && filteredPayments.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Cobranças</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPayments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPayments.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredPayments.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Grupos</p>
                <p className="text-2xl font-bold text-gray-600">
                  {sortedAndFilteredPayments.filter(p => p.isGroupPayment).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Conteúdo da Aba: Resumo por Atleta */}
      {activeTab === 'summary' && isAdmin && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Resumo por Atleta</h3>
            
            {/* Filtros: Barra de Pesquisa + Ano */}
            <div className="flex gap-3">
              {/* Barra de Pesquisa */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Buscar atleta..."
                  value={summarySearchTerm}
                  onChange={(e) => setSummarySearchTerm(e.target.value)}
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
                {summarySearchTerm && (
                  <button
                    onClick={() => setSummarySearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filtro de Ano */}
              <select
                value={summaryYear}
                onChange={(e) => setSummaryYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">📅 Todos os anos</option>
                {(() => {
                  // Gerar lista de anos disponíveis nos pagamentos
                  const years = new Set();
                  payments.forEach(p => {
                    if (p.due_date) {
                      const year = p.due_date.substring(0, 4);
                      years.add(year);
                    }
                  });
                  return Array.from(years).sort((a, b) => b.localeCompare(a)).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Indicador de Filtros Ativos */}
          {(summarySearchTerm || summaryYear !== 'all') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-wrap gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-blue-800 font-medium">Filtros ativos:</span>
                  {summarySearchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      Nome: "{summarySearchTerm}"
                    </span>
                  )}
                  {summaryYear !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      Ano: {summaryYear}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSummarySearchTerm('');
                    setSummaryYear('all');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members
              .filter(member => {
                // Filtrar por nome
                if (summarySearchTerm.trim() !== '') {
                  const searchLower = summarySearchTerm.toLowerCase().trim();
                  const memberName = (member.full_name || member.name || '').toLowerCase();
                  if (!memberName.includes(searchLower)) {
                    return false;
                  }
                }
                return true;
              })
              .map(member => {
                // Filtrar pagamentos do membro
                let memberPayments = filteredPayments.filter(p => p.member_id === member.id);
                
                // Filtrar por ano se não for "all"
                if (summaryYear !== 'all') {
                  memberPayments = memberPayments.filter(p => 
                    p.due_date && p.due_date.startsWith(summaryYear)
                  );
                }
                
                if (memberPayments.length === 0) return null;

              // Calcular valores corretos (usando amount, não displayAmount)
              const totalExpected = memberPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
              
              // Somar pagamentos completos E parciais
              const totalPaid = memberPayments.reduce((sum, p) => {
                if (p.status === 'paid') {
                  // Se está pago, somar o valor completo
                  return sum + parseFloat(p.amount || 0);
                } else if (p.status === 'partial' && p.paid_amount) {
                  // Se está parcial, somar apenas o valor já pago
                  return sum + parseFloat(p.paid_amount || 0);
                }
                return sum;
              }, 0);
              
              const totalPending = totalExpected - totalPaid;

              console.log(`👤 Resumo de ${member.full_name}:`, {
                totalPayments: memberPayments.length,
                totalExpected,
                totalPaid,
                totalPending,
                paidCount: memberPayments.filter(p => p.status === 'paid').length,
                pendingCount: memberPayments.filter(p => p.status === 'pending').length
              });

              return (
                <div key={member.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center"
                          style={{ display: member.avatar_url ? 'none' : 'flex' }}
                        >
                          <span className="text-primary-600 font-medium">
                            {member.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.full_name}</h4>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(totalExpected)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Pago</span>
                      <span className="text-green-600 font-bold">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600 font-medium">Pendente</span>
                      <span className="text-red-600 font-bold">{formatCurrency(totalPending)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{memberPayments.filter(p => p.status === 'paid').length} pago(s)</span>
                      <span>{Math.round(totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0)}%</span>
                    </div>
                  </div>

                  {/* Detalhamento das categorias */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                      {Array.from(new Set(memberPayments.map(p => p.category))).map(category => {
                        const categoryPayments = memberPayments.filter(p => p.category === category);
                        const categoryTotal = categoryPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                        
                        // Somar pagamentos completos E parciais por categoria
                        const categoryPaid = categoryPayments.reduce((sum, p) => {
                          if (p.status === 'paid') {
                            return sum + parseFloat(p.amount || 0);
                          } else if (p.status === 'partial' && p.paid_amount) {
                            return sum + parseFloat(p.paid_amount || 0);
                          }
                          return sum;
                        }, 0);

                        return (
                          <div key={category} className="flex justify-between">
                            <span>{category}</span>
                            <span className={categoryPaid === categoryTotal ? 'text-green-600' : 'text-gray-600'}>
                              {formatCurrency(categoryPaid)} / {formatCurrency(categoryTotal)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <PaymentForm
              payment={editingPayment}
              members={members}
              categories={categories}
              groups={groups}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              supabase={supabase}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}

      {/* Modal de Upload de Comprovante */}
      {showProofModal && selectedPaymentForProof && (
        <PaymentProofModal
          payment={selectedPaymentForProof}
          onClose={handleProofModalClose}
          supabase={supabase}
          currentUser={currentUser}
        />
      )}

      {/* Modal de Revisão de Comprovantes */}
      {showProofReview && (
        <PaymentProofReview
          supabase={supabase}
          currentUser={currentUser}
          onClose={handleProofReviewClose}
        />
      )}

      {/* Modal de Seleção de Pagamento para Atletas */}
      {showSelectPaymentModal && (
        <SelectPaymentModal
          payments={filteredPayments}
          onSelect={(payment) => {
            setShowSelectPaymentModal(false);
            handleUploadProof(payment);
          }}
          onPayAll={(payments) => {
            setShowSelectPaymentModal(false);
            // Criar um objeto "virtual" com múltiplos pagamentos
            setSelectedPaymentForProof({
              isMultiple: true,
              payments: payments,
              totalAmount: payments.reduce((sum, p) => {
                const amount = parseFloat(p.amount || 0);
                const paidAmount = parseFloat(p.paid_amount || 0);
                return sum + (amount - paidAmount);
              }, 0)
            });
            setShowProofModal(true);
          }}
          onClose={() => setShowSelectPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default Payments;