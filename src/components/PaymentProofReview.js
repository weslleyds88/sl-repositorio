import React, { useState, useEffect, useCallback } from 'react';

const PaymentProofReview = ({ supabase, currentUser, onClose }) => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opções de rejeição
  const rejectionOptions = [
    { value: 'valor_divergente', label: 'Valor divergente' },
    { value: 'data_errada', label: 'Data errada' },
    { value: 'outros', label: 'Outros (iremos entrar em contato)' }
  ];

  // Função para criar ticket de pagamento usando a função corrigida no banco
  const createPaymentTicket = async (paymentId, adminUserId) => {
    try {
      console.log('🎫 ========================================');
      console.log('🎫 CRIANDO TICKET PARA PAGAMENTO:', paymentId);
      console.log('🎫 Admin que está aprovando:', adminUserId);
      console.log('🎫 ========================================');

      // Buscar dados completos do pagamento e usuário
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*, profiles:member_id(id, full_name, email)')
        .eq('id', paymentId)
        .single();

      if (paymentError || !paymentData) {
        console.error('❌ Pagamento não encontrado:', paymentError);
        throw new Error('Pagamento não encontrado');
      }

      console.log('✅ Pagamento encontrado:', {
        payment_id: paymentData.id,
        atleta_id: paymentData.member_id,
        atleta_nome: paymentData.profiles?.full_name,
        valor: paymentData.amount,
        categoria: paymentData.category,
        grupo_id: paymentData.group_id || 'Individual'
      });

      // Buscar TODOS os comprovantes aprovados deste pagamento
      const { data: allProofs, error: proofsError } = await supabase
        .from('payment_proofs')
        .select('proof_image_base64, proof_amount, payment_method, reviewed_at, status')
        .eq('payment_id', paymentId)
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: true }); // Ordem cronológica

      if (proofsError) {
        console.error('❌ Erro ao buscar comprovantes:', proofsError);
      }

      console.log(`📎 Total de comprovantes aprovados: ${allProofs?.length || 0}`);

      // Verificar se já existe ticket para este PAGAMENTO ESPECÍFICO
      const { data: existingTicket } = await supabase
        .from('payment_tickets')
        .select('id')
        .eq('payment_id', paymentId)
        .single();

      if (existingTicket) {
        console.log('ℹ️ Ticket já existe para este pagamento:', existingTicket.id);
        console.log('🔄 Atualizando ticket com TODOS os comprovantes...');
        // Ticket existe, mas precisamos ATUALIZAR com todos os comprovantes!
        // (não retornar, continuar para preparar os dados e fazer UPDATE)
      } else {
        console.log('✅ Nenhum ticket existente encontrado, criando novo...');
      }

      // Preparar dados dos comprovantes (múltiplos)
      let proofImagesData = null;
      let paymentMethods = [];
      
      if (allProofs && allProofs.length > 0) {
        // Se houver múltiplos comprovantes, armazenar como JSON array
        if (allProofs.length > 1) {
          proofImagesData = JSON.stringify(allProofs.map(p => ({
            image: p.proof_image_base64,
            amount: p.proof_amount,
            method: p.payment_method,
            date: p.reviewed_at
          })));
          paymentMethods = [...new Set(allProofs.map(p => p.payment_method))];
          console.log(`📎 ${allProofs.length} comprovantes serão anexados ao ticket`);
        } else {
          // Se for apenas 1, armazenar direto
          proofImagesData = allProofs[0].proof_image_base64;
          paymentMethods = [allProofs[0].payment_method];
        }
      }

      // Criar ticket diretamente
      const ticketData = {
        payment_id: paymentId,
        user_id: paymentData.member_id,
        user_name: paymentData.profiles?.full_name || 'Usuário Desconhecido',
        user_email: paymentData.profiles?.email || null,
        amount: parseFloat(paymentData.amount),
        category: paymentData.category,
        payment_method: paymentMethods.join(', ') || 'N/A',
        proof_image_base64: proofImagesData,
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      };


      let data, error;
      
      if (existingTicket) {
        // Atualizar ticket existente
        console.log('♻️ Atualizando ticket existente:', existingTicket.id);
        const updateResult = await supabase
          .from('payment_tickets')
          .update({
            proof_image_base64: ticketData.proof_image_base64,
            payment_method: ticketData.payment_method,
            approved_at: ticketData.approved_at,
            expires_at: ticketData.expires_at
          })
          .eq('id', existingTicket.id)
          .select('id')
          .single();
        
        data = updateResult.data;
        error = updateResult.error;
      } else {
        // Criar novo ticket
        console.log('➕ Criando novo ticket');
        const insertResult = await supabase
          .from('payment_tickets')
          .insert(ticketData)
          .select('id')
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) throw error;

      console.log('✅✅✅ TICKET CRIADO COM SUCESSO! ID:', data.id);
      console.log('🎫 ========================================');
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  };

  // Função auxiliar para verificar se uma URL está malformada
  const isMalformedProofUrl = (url) => {
    if (!url) return false;

    return (
      url.includes('------WebKitFormBoundary') ||
      url.includes('Content-Disposition') ||
      url.includes('form-data') ||
      url.includes('multipart/form-data') ||
      (url.includes('PNG') && url.includes('IHDR')) ||
      url.includes('�PNG') ||
      url.length > 1000 ||
      !url.startsWith('https://')
    );
  };


  const loadPendingProofs = useCallback(async () => {
    try {
      console.log('🔍 Carregando comprovantes pendentes...');

      const { data, error } = await supabase
        .from('payment_proofs')
        .select('*, profiles:user_id(id, full_name, email)')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }

      console.log('📋 Comprovantes com dados dos usuários:', data);

      // Processar comprovantes para garantir que tenham imagem válida
      const processedProofs = (data || []).map(proof => {
        // Se tem base64, usar ele
        if (proof.proof_image_base64) {
          return {
            ...proof,
            imageUrl: proof.proof_image_base64,
            hasValidImage: true
          };
        }
        
        // Se não tem base64 mas tem URL, tentar usar URL
        if (proof.proof_file_url && !isMalformedProofUrl(proof.proof_file_url)) {
          return {
            ...proof,
            imageUrl: proof.proof_file_url,
            hasValidImage: true
          };
        }
        
        // Se não tem imagem válida
        return {
          ...proof,
          imageUrl: null,
          hasValidImage: false
        };
      });

      setProofs(processedProofs);
      console.log('✅ Comprovantes carregados:', processedProofs.length);
    } catch (error) {
      console.error('❌ Erro ao carregar comprovantes:', error);
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Função auxiliar para obter o rótulo da razão de rejeição
  const getRejectionLabel = (value) => {
    const option = rejectionOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  useEffect(() => {
    loadPendingProofs();
  }, [loadPendingProofs]);

  const handleApprove = async (proofId) => {
    setIsSubmitting(true);
    try {
      // 1. Aprovar o comprovante
      const { error: approveError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_message: null
        })
        .eq('id', proofId);

      if (approveError) throw approveError;

      // 2. Atualizar o pagamento (pago total ou parcial)
      const currentProof = proofs.find(p => p.id === proofId);
      if (currentProof) {
        console.log('🔄 Atualizando pagamento:', currentProof.payment_id);
        
        // Buscar dados atuais do pagamento
        const { data: paymentData, error: fetchError } = await supabase
          .from('payments')
          .select('amount, paid_amount')
          .eq('id', currentProof.payment_id)
          .single();

        if (fetchError) {
          console.error('❌ Erro ao buscar pagamento:', fetchError);
          throw fetchError;
        }

        // Calcular novo valor pago
        const totalAmount = parseFloat(paymentData.amount);
        const currentPaidAmount = parseFloat(paymentData.paid_amount || 0);
        const proofAmount = parseFloat(currentProof.proof_amount);
        const newPaidAmount = currentPaidAmount + proofAmount;

        // Verificar se pagamento está completo
        const isFullyPaid = newPaidAmount >= totalAmount;

        console.log('💰 Cálculo de pagamento:', {
          totalAmount,
          currentPaidAmount,
          proofAmount,
          newPaidAmount,
          isFullyPaid
        });
        
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            paid_amount: newPaidAmount,
            status: isFullyPaid ? 'paid' : 'partial',
            paid_at: isFullyPaid ? new Date().toISOString() : null
          })
          .eq('id', currentProof.payment_id);

        if (paymentError) {
          console.error('❌ Erro ao atualizar pagamento:', paymentError);
          throw paymentError;
        }
        
        console.log(`✅ Pagamento atualizado: ${isFullyPaid ? 'PAGO TOTAL' : 'PAGAMENTO PARCIAL'} - R$ ${newPaidAmount.toFixed(2)} de R$ ${totalAmount.toFixed(2)}`);
        
        // 3. Criar ticket APENAS se pagamento estiver totalmente pago
        if (isFullyPaid) {
          const proof = proofs.find(p => p.id === proofId);
          if (proof) {
            let ticketId = null;
            try {
          // Verificar se o usuário existe no sistema antes de criar ticket
          console.log('🎫 Verificando usuário antes de criar ticket:', proof.user_id);

          const { data: userCheck, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', proof.user_id)
            .single();

          if (userError || !userCheck) {
            console.warn('⚠️ Usuário não encontrado no profiles:', proof.user_id);
            // Continuar sem criar ticket se o usuário não existir
          } else {
            // Tentar criar ticket - se currentUser não estiver disponível, buscar um admin do banco
            let adminUserId = null;

            if (currentUser && currentUser.id) {
              adminUserId = currentUser.id;
            } else {
              // Buscar um admin do banco como fallback
              console.log('🔄 currentUser não disponível, buscando admin do banco...');
              try {
                const { data: adminUser, error: adminError } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('role', 'admin')
                  .limit(1)
                  .single();

                if (!adminError && adminUser) {
                  adminUserId = adminUser.id;
                  console.log('✅ Admin encontrado no banco:', adminUserId);
                } else {
                  console.warn('⚠️ Nenhum admin encontrado no banco, tentando buscar qualquer usuário...');
                  // Fallback: buscar qualquer usuário como último recurso
                  const { data: anyUser, error: anyError } = await supabase
                    .from('profiles')
                    .select('id')
                    .limit(1)
                    .single();

                  if (!anyError && anyUser) {
                    adminUserId = anyUser.id;
                    console.log('⚠️ Usando usuário fallback para criar ticket:', adminUserId);
                  } else {
                    console.error('❌ Erro ao buscar qualquer usuário:', anyError);
                  }
                }
              } catch (adminErr) {
                console.warn('⚠️ Erro ao buscar admin:', adminErr);
              }
            }

            if (adminUserId) {
              // Criar ticket usando a função correta
              console.log('🎫 Criando ticket para:', {
                payment_id: proof.payment_id,
                user_id: proof.user_id,
                approved_by: adminUserId
              });

              ticketId = await createPaymentTicket(proof.payment_id, adminUserId);
              console.log('✅ Ticket criado com sucesso:', ticketId);
            } else {
              console.warn('⚠️ Nenhum admin disponível para criar ticket, pulando...');
            }
          }
            } catch (ticketError) {
              console.warn('⚠️ Erro ao criar ticket (não crítico):', ticketError.message || ticketError);
              // Não falhar a aprovação se o ticket não for criado
            }

            // Criar notificação de pagamento completo apenas se o usuário NÃO for admin
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', proof.user_id)
              .single();

            if (userProfile?.role !== 'admin') {
              await supabase
                .from('notifications')
                .insert({
                  user_id: proof.user_id,
                  title: 'Pagamento Completo! 🎉',
                  message: `Seu pagamento total de R$ ${totalAmount.toFixed(2)} foi aprovado! Ticket gerado com sucesso.`,
                  type: 'success'
                });
              console.log('✅ Notificação de pagamento completo criada para atleta');
            } else {
              console.log('ℹ️ Notificação não enviada (usuário é admin)');
            }
          }
        } else {
          // Pagamento parcial - apenas notificar parcial (SEM criar ticket)
          console.log('ℹ️ Pagamento parcial - ticket NÃO será criado ainda');
          
          const proof = proofs.find(p => p.id === proofId);
          if (proof) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', proof.user_id)
              .single();

            if (userProfile?.role !== 'admin') {
              await supabase
                .from('notifications')
                .insert({
                  user_id: proof.user_id,
                  title: 'Pagamento Parcial Aprovado',
                  message: `Seu pagamento parcial de R$ ${proof.proof_amount.toFixed(2)} foi aprovado! Total pago: R$ ${newPaidAmount.toFixed(2)} de R$ ${totalAmount.toFixed(2)}`,
                  type: 'success'
                });
              console.log('✅ Notificação de pagamento parcial criada para atleta');
            }
          }
        }
      }

      alert('Comprovante aprovado com sucesso!');
      loadPendingProofs();

    } catch (error) {
      console.error('Erro ao aprovar comprovante:', error);
      alert('Erro ao aprovar comprovante: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (proofId) => {
    if (!rejectionReason) {
      alert('Selecione o motivo da recusa');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Rejeitar o comprovante
      const { error: rejectError } = await supabase
        .from('payment_proofs')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          admin_message: rejectionReason
        })
        .eq('id', proofId);

      if (rejectError) throw rejectError;

      // 2. Criar notificação apenas se o usuário NÃO for admin
      const proof = proofs.find(p => p.id === proofId);
      if (proof) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', proof.user_id)
          .single();

        if (userProfile?.role !== 'admin') {
          const rejectionLabel = getRejectionLabel(rejectionReason);
          await supabase
            .from('notifications')
            .insert({
              user_id: proof.user_id,
              title: 'Pagamento Rejeitado',
              message: `Seu pagamento foi rejeitado. Motivo: ${rejectionLabel}`,
              type: 'error'
            });
          console.log('✅ Notificação de rejeição criada para atleta');
        } else {
          console.log('ℹ️ Notificação de rejeição não enviada (usuário é admin)');
        }
      }

      alert('Comprovante rejeitado. O usuário foi notificado.');
      setRejectionReason('');
      setSelectedProof(null);
      loadPendingProofs();

    } catch (error) {
      console.error('Erro ao rejeitar comprovante:', error);
      alert('Erro ao rejeitar comprovante: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (proof) => {
    try {
      console.log('📁 Fazendo download do comprovante:', {
        id: proof.id,
        paymentId: proof.payment_id,
        hasBase64: !!proof.proof_image_base64,
        hasValidImage: proof.hasValidImage
      });

      // Se tem imagem em base64, usar ela
      if (proof.proof_image_base64) {
        console.log('✅ Usando imagem do banco de dados');
        
        // Converter base64 para blob
        const base64Data = proof.proof_image_base64.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: proof.proof_image_type || 'image/jpeg' });
        
        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Determinar extensão baseada no tipo
        let extension = 'jpg';
        if (proof.proof_image_type) {
          if (proof.proof_image_type.includes('png')) extension = 'png';
          else if (proof.proof_image_type.includes('jpeg')) extension = 'jpg';
          else if (proof.proof_image_type.includes('pdf')) extension = 'pdf';
        }
        
        link.download = `comprovante_${proof.payment_id}_${proof.id}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL
        window.URL.revokeObjectURL(url);
        console.log('✅ Download via base64 executado');
        return;
      }

      // Se não tem base64, tentar URL (fallback)
      if (proof.proof_file_url && !isMalformedProofUrl(proof.proof_file_url)) {
        console.log('🔄 Tentando URL como fallback');
        const newWindow = window.open(proof.proof_file_url, '_blank');
        if (newWindow) {
          console.log('✅ Download via URL executado');
          return;
        }
      }

      throw new Error('Nenhuma imagem válida encontrada para este comprovante');

    } catch (error) {
      console.error('❌ Erro no download:', error);
      alert('Erro ao fazer download do comprovante. Entre em contato com o suporte.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando comprovantes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-900">
            Revisar Comprovantes de Pagamento ({proofs.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {proofs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum comprovante pendente</h3>
            <p className="mt-1 text-sm text-gray-500">Todos os comprovantes foram revisados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proofs.map((proof) => (
              <div key={proof.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {proof.profiles?.full_name || 'Usuário Desconhecido'}
                        </h4>
                        <p className="text-xs text-gray-500 mb-2">
                          {proof.profiles?.email || proof.user_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Pagamento ID:</strong> {proof.payment_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Valor:</strong> R$ {proof.proof_amount?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Método:</strong> {proof.payment_method}
                        </p>
                        {proof.transaction_id && (
                          <p className="text-sm text-gray-600">
                            <strong>ID Transação:</strong> {proof.transaction_id}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <strong>Enviado em:</strong> {new Date(proof.submitted_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {/* Preview do Comprovante */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Comprovante:</p>
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Comprovante:</span>
                          <button
                            onClick={() => handleDownload(proof)}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            ⬇️ Download
                          </button>
                        </div>
                        <div className="relative group">
                          {proof.hasValidImage && proof.imageUrl ? (
                            <img
                              src={proof.imageUrl}
                              alt="Comprovante"
                              className="max-w-xs max-h-48 object-contain border border-gray-200 rounded cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => handleDownload(proof)}
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', proof.imageUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="max-w-xs max-h-48 border border-gray-200 rounded flex items-center justify-center bg-gray-100">
                              <div className="text-center p-4">
                                <div className="text-gray-400 text-4xl mb-2">📄</div>
                                <p className="text-sm text-gray-600">Imagem não disponível</p>
                                <button
                                  onClick={() => handleDownload(proof)}
                                  className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                                >
                                  Tentar Download
                                </button>
                              </div>
                            </div>
                          )}
                          {proof.hasValidImage && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded">
                              <button
                                onClick={() => handleDownload(proof)}
                                className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                              >
                                🔍 Ver Completo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => handleApprove(proof.id)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProof(proof.id);
                        setRejectionReason('');
                      }}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                    >
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>

                {/* Modal de Rejeição */}
                {selectedProof === proof.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h5 className="font-medium text-red-900 mb-3">Motivo da Rejeição:</h5>
                    <div className="mb-4">
                      <select
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="">Selecione o motivo da rejeição...</option>
                        {rejectionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProof(null);
                          setRejectionReason('');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleReject(proof.id)}
                        disabled={isSubmitting || !rejectionReason}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                      >
                        Confirmar Rejeição
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProofReview;
