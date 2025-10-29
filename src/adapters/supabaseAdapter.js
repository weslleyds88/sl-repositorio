// Adapter para Supabase
import { createClient } from '@supabase/supabase-js';

class SupabaseAdapter {
  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Configurações do Supabase não encontradas. Verifique as variáveis de ambiente.');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // MEMBERS
  async listMembers() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          user_group_members!left(
            group_id,
            joined_at,
            user_groups!inner(
              id,
              name,
              type,
              description
            )
          )
        `)
        .eq('status', 'approved')
        .order('full_name');

      if (error) throw error;

      // Processar dados para incluir group_id no membro
      const processedMembers = (data || []).map(member => ({
        ...member,
        group_id: member.user_group_members?.[0]?.group_id || null,
        group_name: member.user_group_members?.[0]?.user_groups?.name || null,
        group_type: member.user_group_members?.[0]?.user_groups?.type || null
      }));

      return processedMembers;
    } catch (error) {
      console.error('Erro ao listar atletas:', error);
      return [];
    }
  }

  async addMember(member) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .insert([{
          full_name: member.name,
          phone: member.phone,
          observation: member.observation,
          status: 'approved',
          role: 'athlete'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar atleta:', error);
      throw error;
    }
  }

  async updateMember(id, member) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          full_name: member.name,
          phone: member.phone,
          observation: member.observation,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar sócio:', error);
      return false;
    }
  }

  async deleteMember(id) {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao deletar sócio:', error);
      return false;
    }
  }

  // PAYMENTS
  async listPayments(filters = {}) {
    try {
      let query = this.supabase
        .from('payments')
        .select(`
          *,
          user_groups (
            name
          )
        `);

      if (filters.member_id) {
        query = query.eq('member_id', filters.member_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.month) {
        const [year, month] = filters.month.split('-');
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        query = query.gte('due_date', startDate).lte('due_date', endDate);
      }

      query = query.order('due_date', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      
      // Transformar dados para incluir groupName diretamente no objeto
      const paymentsWithGroupName = (data || []).map(payment => ({
        ...payment,
        groupName: payment.user_groups?.name || null
      }));

      return paymentsWithGroupName;
    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return [];
    }
  }

  async addPayment(payment) {
    try {
      const { data, error } = await this.supabase
        .from('payments')
        .insert([{
          member_id: payment.member_id,
          group_id: payment.group_id || null,
          amount: payment.amount,
          paid_amount: payment.paid_amount || 0,
          category: payment.category,
          observation: payment.observation,
          due_date: payment.due_date,
          paid_at: payment.paid_at,
          status: payment.status || 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      return null;
    }
  }

  async updatePayment(id, payment) {
    try {
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Adiciona apenas os campos que foram fornecidos
      if (payment.member_id !== undefined) updateData.member_id = payment.member_id;
      if (payment.group_id !== undefined) updateData.group_id = payment.group_id;
      if (payment.amount !== undefined) updateData.amount = payment.amount;
      if (payment.paid_amount !== undefined) updateData.paid_amount = payment.paid_amount;
      if (payment.category !== undefined) updateData.category = payment.category;
      if (payment.observation !== undefined) updateData.observation = payment.observation;
      if (payment.due_date !== undefined) updateData.due_date = payment.due_date;
      if (payment.paid_at !== undefined) updateData.paid_at = payment.paid_at;
      if (payment.status !== undefined) updateData.status = payment.status;

      const { data, error } = await this.supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  }

  async markPaid(paymentId) {
    try {
      const { error } = await this.supabase
        .from('payments')
        .update({
          paid_at: new Date().toISOString(),
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
      return false;
    }
  }

  async markPaidBulk(paymentIds) {
    try {
      const { error } = await this.supabase
        .from('payments')
        .update({
          paid_at: new Date().toISOString(),
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .in('id', paymentIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar pagamentos em lote:', error);
      return false;
    }
  }

  async deletePayment(id) {
    try {
      console.log('🗑️ Tentando excluir pagamento:', id);

      // 1. Primeiro excluir dados relacionados (em ordem de dependência)
      // Excluir payment_proofs relacionados
      const { error: proofsError } = await this.supabase
        .from('payment_proofs')
        .delete()
        .eq('payment_id', id);

      if (proofsError) {
        console.error('Erro ao excluir payment_proofs:', proofsError);
      } else {
        console.log('✅ Payment proofs excluídos');
      }

      // 2. Excluir notificações relacionadas (sem usar related_payment_id para evitar erro 400)
      // As notificações serão removidas pelo cleanup automático ou podem ser removidas manualmente se necessário
      console.log('ℹ️ Notificações relacionadas não serão removidas automaticamente para evitar erro 400');

      // 3. Agora excluir o pagamento principal
      const { error } = await this.supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar pagamento:', error);
        throw error;
      }

      console.log('✅ Pagamento excluído com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar pagamento:', error);

      // Se ainda houver erro de constraint, informar o usuário
      if (error.code === '23503') {
        throw new Error('Não é possível excluir este pagamento pois há dados relacionados no sistema. Entre em contato com o suporte.');
      }

      return false;
    }
  }

  // BACKUP
  async exportBackup() {
    try {
      const members = await this.listMembers();
      const payments = await this.listPayments();

      const backup = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          members,
          payments
        }
      };

      return backup;
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      return null;
    }
  }

  async importBackup(backupData) {
    try {
      // Validar estrutura do backup
      if (!backupData.data || !backupData.data.members || !backupData.data.payments) {
        throw new Error('Estrutura de backup inválida');
      }

      // Importar sócios
      if (backupData.data.members.length > 0) {
        const { error: membersError } = await this.supabase
          .from('profiles')
          .insert(backupData.data.members.map(member => ({
            id: member.id,
            full_name: member.full_name || member.name,
            phone: member.phone,
            observation: member.observation,
            status: member.status || 'approved',
            role: member.role || 'athlete'
          })));

        if (membersError) throw membersError;
      }

      // Importar pagamentos
      if (backupData.data.payments.length > 0) {
        const { error: paymentsError } = await this.supabase
          .from('payments')
          .insert(backupData.data.payments.map(payment => ({
            member_id: payment.member_id,
            group_id: payment.group_id,
            amount: payment.amount,
            paid_amount: payment.paid_amount,
            category: payment.category,
            observation: payment.observation,
            due_date: payment.due_date,
            paid_at: payment.paid_at,
            status: payment.status
          })));

        if (paymentsError) throw paymentsError;
      }

      return true;
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      return false;
    }
  }

  // ANALYTICS
  async getMonthlySummary(month) {
    try {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = `${year}-${monthNum}-31`;

      const { data, error } = await this.supabase
        .from('payments')
        .select('*')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      if (error) throw error;

      // Processar dados para resumo mensal
      const summary = {};
      
      data.forEach(payment => {
        const date = payment.due_date;
        if (!summary[date]) {
          summary[date] = {
            date,
            income: 0,
            expenses: 0,
            count: 0
          };
        }

        if (payment.status === 'expense') {
          summary[date].expenses += parseFloat(payment.amount);
        } else {
          summary[date].income += parseFloat(payment.amount);
        }
        
        summary[date].count++;
      });

      return Object.values(summary).map(day => ({
        ...day,
        balance: day.income - day.expenses
      }));
    } catch (error) {
      console.error('Erro ao obter resumo mensal:', error);
      return [];
    }
  }
}

export default SupabaseAdapter;
