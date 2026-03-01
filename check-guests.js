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

async function checkGuests() {
    try {
        console.log('Checking guests for event ID: 1 (vanessaerodrigo)');
        const { data, error } = await supabase
            .from('guests')
            .select('*')
            .eq('event_id', '1');

        if (error) {
            console.error('Error fetching guests:', error.message);
        } else {
            console.log(`Found ${data.length} guests for this event.`);
            if (data.length > 0) {
                console.log('Sample guest:', data[0].name, data[0].telefone);
            }
        }

        console.log('Checking ALL guests in the table...');
        const { data: allGuests, error: errAll } = await supabase.from('guests').select('name, event_id');
        if (errAll) console.error('Error:', errAll.message);
        else console.log('Total guests in table:', allGuests.length, allGuests);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkGuests();
