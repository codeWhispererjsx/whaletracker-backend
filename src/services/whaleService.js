const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function upsertWhaleTransaction(tx) {
  const { error } = await supabase.from('whale_transactions').upsert([tx]);
  if (error) throw error;
}

async function getRecentTransactions(limit = 50) {
  const { data, error } = await supabase
    .from('whale_transactions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

module.exports = { upsertWhaleTransaction, getRecentTransactions };
