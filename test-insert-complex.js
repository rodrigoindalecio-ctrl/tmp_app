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

async function insertComplexGuest() {
    try {
        console.log('Inserting guest with companions...');
        const { data, error } = await supabase
            .from('guests')
            .insert({
                id: 'complex-' + Date.now(),
                event_id: '1',
                name: 'Teste Composto',
                telefone: '11888888888',
                status: 'pending',
                category: 'adult_paying',
                companions_list: [{ name: 'Acompanhante 1', isConfirmed: false, category: 'adult_paying' }],
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Successfully inserted complex guest!');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

insertComplexGuest();
