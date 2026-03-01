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

async function checkSchema() {
    try {
        console.log('Checking events table...');
        const { data: events, error: eError } = await supabase.from('events').select('*').limit(1);
        if (eError) console.error('E Error:', eError.message);
        else console.log('Events column names:', Object.keys(events[0]));

        console.log('Checking guests table...');
        const { data: guests, error: gError } = await supabase.from('guests').select('*').limit(1);
        if (gError) console.error('G Error:', gError.message);
        else if (guests.length > 0) console.log('Guests column names:', Object.keys(guests[0]));
        else console.log('Guests table empty or columns not accessible');

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkSchema();
