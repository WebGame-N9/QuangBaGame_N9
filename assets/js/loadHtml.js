function loadHTML(url, elementId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            let content;
            if (url === 'index.html') {
                content = doc.querySelector('main');
            } else if (url === 'footer.html') {
                content = doc.querySelector('footer');
            }

            // Chèn nội dung vào placeholder
            if (content) {
                const element = document.getElementById(elementId);
                element.innerHTML = ''; 
                element.appendChild(content);
                console.log(`Loaded content from ${url} successfully!`); // Debug
            } else {
                console.error(`Không tìm thấy nội dung cần thiết trong ${url}`);
            }
        })
        .catch(error => console.error('Lỗi khi tải:', error));
}