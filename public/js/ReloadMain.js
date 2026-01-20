export default async function reloadMain(id_user) {
    const response = await fetch('http://localhost:3000/main/clear-cache', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: id_user })
    });

    const result = await response.json();

    if (result.success) {
        console.log('Cache cleared successfully');
    } else {
        console.error('Clear cache failed:', result.error);
    }
}
