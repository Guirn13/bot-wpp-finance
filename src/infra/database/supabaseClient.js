const { createClient } = require('@supabase/supabase-js')

function criarSupabaseClient({ url, key }) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

module.exports = { criarSupabaseClient }

