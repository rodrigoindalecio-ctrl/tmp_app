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

async function testConnection() {
    try {
        console.log('Searching for user...');
        const { data: user, error: errUser } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', 'vanessabidinotti@hotmail.com')
            .maybeSingle();

        if (errUser) console.error('Error searching:', errUser.message);
        else console.log('User found:', user);

        console.log('Checking events raw data...');
        const { data: events, error: errEvents } = await supabase.from('events').select('*');
        if (errEvents) console.error('Error fetching events:', errEvents.message);
        else {
            console.log('Events found:', events.length);
            events.forEach(e => {
                console.log(`- Slug: ${e.slug}, CreatedBy: ${e.created_by}, ID: ${e.id}`);
            });
        }

        if (user && events.length > 0) {
            const myEvent = events.find(e => e.created_by === user.email);
            if (myEvent) {
                console.log('User has an associated event:', myEvent.slug);
                console.log('Checking guests for this event...');
                const { data: guests, error: errGuests } = await supabase.from('guests').select('*').eq('event_id', myEvent.id);
                if (errGuests) console.error('Error fetching guests:', errGuests.message);
                else console.log('Guests found for this event:', guests.length);
            } else {
                console.log('User has NO associated event in the database.');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
