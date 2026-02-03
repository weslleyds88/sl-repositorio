// Adapter para Supabase
import { supabase } from '../lib/supabaseClient';

class SupabaseAdapter {
  constructor() {
    // Usar a mesma instância do supabaseClient para evitar múltiplas instâncias
    this.supabase = supabase;
  }

  // MEMBERS
  async listMembers() {
    try {
      // Buscar apenas os perfis (sem join que pode não existir no schema)
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('status', 'approved')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Se não houver perfis, retornar array vazio
      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Buscar grupos dos membros separadamente
      const memberIds = profiles.map(p => p.id);
      let groupMap = new Map();

      try {
        // Buscar membros dos grupos (pode falhar se a tabela não existir ou não houver dados)
        const { data: groupMembers, error: groupMembersError } = await this.supabase
          .from('user_group_members')
          .select('user_id, group_id')
          .in('user_id', memberIds);

        if (!groupMembersError && groupMembers && groupMembers.length > 0) {
          // Buscar informações dos grupos
          const groupIds = [...new Set(groupMembers.map(gm => gm.group_id).filter(Boolean))];
          
          if (groupIds.length > 0) {
            const { data: groups, error: groupsError } = await this.supabase
              .from('user_groups')
              .select('id, name, type, description')
              .in('id', groupIds);

            if (!groupsError && groups) {
              groups.forEach(g => groupMap.set(g.id, g));
            }
          }

          // Criar mapa de user_id -> group
          const userGroupMap = new Map();
          groupMembers.forEach(gm => {
            if (!userGroupMap.has(gm.user_id)) {
              userGroupMap.set(gm.user_id, gm.group_id);
            }
          });

          // Processar dados para incluir group_id no membro
          return profiles.map(member => {
            const groupId = userGroupMap.get(member.id);
            const group = groupId ? groupMap.get(groupId) : null;
            
            return {
              ...member,
              group_id: groupId || null,
              group_name: group?.name || null,
              group_type: group?.type || null
            };
          });
        }
      } catch (groupError) {
        // Continuar sem grupos se der erro
      }

      // Se não houver grupos ou der erro, retornar apenas os perfis
      return profiles.map(member => ({
        ...member,
        group_id: null,
        group_name: null,
        group_type: null
      }));
    } catch {
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
          position: member.position,
          birth_date: member.birth_date,
          rg: member.rg,
          region: member.region,
          gender: member.gender,
          responsible_name: member.responsible_name,
          responsible_phone: member.responsible_phone,
          avatar_url: member.avatar_url,
          status: 'approved',
          role: 'athlete'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
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
          position: member.position,
          birth_date: member.birth_date,
          rg: member.rg,
          region: member.region,
          gender: member.gender,
          responsible_name: member.responsible_name,
          responsible_phone: member.responsible_phone,
          avatar_url: member.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch {
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
    } catch {
      return false;
    }
  }

  // PAYMENTS
  async listPayments(filters = {}) {
    try {
      // Selecionar apenas colunas necessárias para reduzir payload
      let query = this.supabase
        .from('payments')
        .select(`
          id, member_id, group_id, amount, category, status, paid_amount, due_date, observation, pix_key, pix_name, created_at,
          user_groups ( name )
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      return false;
    }
  }

  async deletePayment(id) {
    try {
      await this.supabase
        .from('payment_proofs')
        .delete()
        .eq('payment_id', id);

      const { error } = await this.supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {

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
    } catch {
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
    } catch {
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
    } catch {
      return [];
    }
  }
}

export default SupabaseAdapter;
