function makeApiRequest() {
    // Get the input values
    const headersInput = document.getElementById('headers').value.trim();
    const baseUrl = document.getElementById('url').value.trim();
    const endpoint = document.getElementById('endpoint').value.trim();

    // Parse the headers
    const headers = new Headers();
    if (headersInput) {
        const lines = headersInput.split('\n');
        lines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                headers.append(key, value);
            }
        });
    }

    // Construct the full URL
    const fullUrl = baseUrl + endpoint;

    // Make the GET request
    fetch(fullUrl, { method: 'GET', headers })
        .then(response => response.json())
        .then(data => {
            // Print the response
            document.getElementById('response').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            // Handle errors
            document.getElementById('response').textContent = `Error: ${error}`;
        });
}