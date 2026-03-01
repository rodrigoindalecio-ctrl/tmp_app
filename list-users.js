const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function listUsers() {
    try {
        console.log('Listing ALL admin_users...');
        const { data, error } = await supabase.from('admin_users').select('*');
        if (error) console.error('E:', error.message);
        else console.log('Users:', data);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

listUsers();
