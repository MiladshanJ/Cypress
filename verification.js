const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            fetch(`/verify?token=${token}`)
                .then(res => res.text())
                .then(data => {
                    document.getElementById('verify-status').innerText = data;
                })
                .catch(err => {
                    document.getElementById('verify-status').innerText = 'Verification failed.';
                });
        } else {
            document.getElementById('verify-status').innerText = 'No token found.';
        }