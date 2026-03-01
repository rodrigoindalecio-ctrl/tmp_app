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

async function insertTestGuest() {
    try {
        console.log('Inserting test guest for event ID 1 (vanessaerodrigo)...');
        const { data, error } = await supabase
            .from('guests')
            .insert({
                id: 'test-' + Date.now(),
                event_id: '1',
                name: 'Teste via Script',
                telefone: '11999999999',
                status: 'pending',
                category: 'adult_paying',
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error inserting:', error.message);
            console.error('Details:', error);
        } else {
            console.log('Successfully inserted test guest!');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

insertTestGuest();
