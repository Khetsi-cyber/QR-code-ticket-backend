// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://auimupbmquhgpkluvpyg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aW11cGJtcXVoZ3BrbHV2cHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDI3MDksImV4cCI6MjA3OTkxODcwOX0.FBEHFQ7Wvn6BJhVhSoFO7mhNxK1JPOm4cj5uWyMTduI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Test 1: Check session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Session check successful (no active session expected)');
    }
    
    // Test 2: Try to query buses (should work without auth)
    console.log('\n2. Testing buses table (public read)...');
    const { data: buses, error: busesError } = await supabase
      .from('buses')
      .select('*')
      .limit(1);
    
    if (busesError) {
      console.error('❌ Buses query error:', busesError.message);
      console.error('Details:', busesError);
    } else {
      console.log('✅ Buses query successful. Found', buses?.length || 0, 'buses');
    }
    
    // Test 3: Try to query bus_stops (should work without auth)
    console.log('\n3. Testing bus_stops table (public read)...');
    const { data: stops, error: stopsError } = await supabase
      .from('bus_stops')
      .select('*')
      .limit(1);
    
    if (stopsError) {
      console.error('❌ Bus stops query error:', stopsError.message);
      console.error('Details:', stopsError);
    } else {
      console.log('✅ Bus stops query successful. Found', stops?.length || 0, 'stops');
    }
    
    // Test 4: Check if RLS is enabled on tables
    console.log('\n4. Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status').catch(() => ({
      data: null,
      error: { message: 'RPC function not available (expected)' }
    }));
    
    console.log('\n✅ Connection test complete!');
    console.log('\nIf you see 401 errors in the browser:');
    console.log('1. Clear browser localStorage (F12 → Application → Local Storage → Clear)');
    console.log('2. Clear browser cookies for localhost');
    console.log('3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error('Full error:', err);
  }
}

testConnection();
