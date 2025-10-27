import React, { useState } from 'react';

const PaymentProofModal = ({ payment, onClose, supabase, currentUser }) => {
  const [proofFile, setProofFile] = useState(null);
  const [proofAmount, setProofAmount] = useState(payment?.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      
      setProofFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!proofFile) {
      setError('Selecione um comprovante');
      return;
    }
    
    if (!proofAmount || parseFloat(proofAmount) <= 0) {
      setError('Valor do comprovante deve ser maior que zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Converter arquivo para base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      };

      console.log('📁 Convertendo arquivo para base64...');
      console.log('📄 Tipo do arquivo:', proofFile.type);
      console.log('📏 Tamanho do arquivo:', proofFile.size);

      const base64Data = await convertToBase64(proofFile);
      console.log('✅ Arquivo convertido para base64');

      // 2. Salvar comprovante no banco com imagem em base64
      const { error: proofError } = await supabase
        .from('payment_proofs')
        .insert({
          payment_id: payment.id,
          user_id: currentUser.id,
          proof_file_url: 'database://stored', // URL placeholder para satisfazer constraint
          proof_image_base64: base64Data,
          proof_image_type: proofFile.type,
          proof_image_size: proofFile.size,
          storage_method: 'database',
          proof_amount: parseFloat(proofAmount),
          payment_method: paymentMethod,
          transaction_id: transactionId.trim() || null,
          status: 'pending'
        });

      if (proofError) throw proofError;

      // 4. Criar notificação para o próprio usuário confirmando o envio
      await supabase
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          title: 'Comprovante Enviado',
          message: `Comprovante de R$ ${parseFloat(proofAmount).toFixed(2)} enviado com sucesso. Aguarde aprovação do administrador.`,
          type: 'success'
        });

      // 5. Criar notificação para todos os admins sobre o novo comprovante
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          title: 'Novo Comprovante Recebido',
          message: `Novo comprovante de R$ ${parseFloat(proofAmount).toFixed(2)} aguardando aprovação.`,
          type: 'info'
        }));

        await supabase
          .from('notifications')
          .insert(adminNotifications);
      }

      alert('Comprovante enviado com sucesso! Aguarde a aprovação do administrador.');
      onClose();

    } catch (error) {
      console.error('Erro ao enviar comprovante:', error);
      setError('Erro ao enviar comprovante: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Enviar Comprovante de Pagamento
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Pagamento */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Pagamento:</h4>
            <p className="text-sm text-gray-600">
              <strong>{payment.category}</strong> - R$ {payment.amount?.toFixed(2)}
            </p>
            {payment.group_name && (
              <p className="text-sm text-gray-600">Grupo: {payment.group_name}</p>
            )}
          </div>

          {/* Upload do Arquivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprovante *
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: JPG, PNG, PDF (máximo 5MB)
            </p>
          </div>

          {/* Valor do Comprovante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Pago *
            </label>
            <input
              type="number"
              value={proofAmount}
              onChange={(e) => setProofAmount(e.target.value)}
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
              required
            />
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pix">PIX</option>
              <option value="transfer">Transferência</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
            </select>
          </div>

          {/* ID da Transação (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID da Transação (opcional)
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: PIX123456789"
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Comprovante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentProofModal;
