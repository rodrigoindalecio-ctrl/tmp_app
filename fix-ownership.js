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

async function fixOwnership() {
    try {
        console.log('Updating event ownership...');
        const { data, error } = await supabase
            .from('events')
            .update({ created_by: 'vanessabidinotti@hotmail.com' })
            .eq('slug', 'vanessaerodrigo');

        if (error) {
            console.error('Error updating:', error.message);
        } else {
            console.log('Successfully updated vanessaerodrigo owner to vanessabidinotti@hotmail.com');
        }

        // Also update ana-e-joão if it's the one she's testing
        /*
        await supabase
            .from('events')
            .update({ created_by: 'vanessabidinotti@hotmail.com' })
            .eq('slug', 'ana-e-joão');
        */

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

fixOwnership();
