
async function main() {
    const API_URL = 'http://localhost:3000/api';

    // No Login Needed

    // 2. Fetch Pending Courses
    try {
        console.log('Fetching Pending Courses...');
        const params = new URLSearchParams({ status: 'PENDING_APPROVAL', limit: 10 });
        const res = await fetch(`${API_URL}/admin/courses?${params}`);

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const data = await res.json();

        console.log('Result Success:', data.success);
        console.log('Debug Query:', JSON.stringify(data.debugQuery, null, 2));
        console.log('Debug Where:', JSON.stringify(data.debugWhere, null, 2));
        console.log('Courses count:', data.courses ? data.courses.length : 0);
        if (data.courses) {
            console.log('Courses:', JSON.stringify(data.courses.map(c => ({ id: c.id, status: c.status, title: c.title })), null, 2));
        }

    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

main();
