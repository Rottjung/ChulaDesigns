document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.id; // Gets the ID of the clicked button
        const contentUrl = `${section}/${section}.html`; // Construct the URL to the respective HTML file

        // Fetch the content from the respective HTML file
        fetch(contentUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Content not found');
                }
                return response.text();
            })
            .then(content => {
                document.querySelector('.content').innerHTML = content; // Insert content into .content div
            })
            .catch(error => {
                console.error('Error loading content:', error);
                document.querySelector('.content').innerHTML = '<p>Error loading content.</p>'; // Display error if content is not found
            });
    });
});
