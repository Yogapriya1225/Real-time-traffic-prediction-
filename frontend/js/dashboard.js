document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const user = JSON.parse(localStorage.getItem('traffic_user'));
    if (!user || !user.user_id) {
        window.location.href = 'login.html';
        return;
    }

    const API_URL = 'http://127.0.0.1:5000';

    function showResult(element, resultText) {
        element.classList.remove('hidden', 'alert-Low', 'alert-Medium', 'alert-High');
        
        let levelClass = 'alert-Low';
        if (resultText === 'High Traffic') levelClass = 'alert-High';
        else if (resultText === 'Medium Traffic') levelClass = 'alert-Medium';
        
        element.classList.add(levelClass);
        element.textContent = `Prediction: ${resultText}`;
    }

    // Numeric Form Submit
    const numericForm = document.getElementById('numeric-form');
    if (numericForm) {
        numericForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const carCount = document.getElementById('car-count').value || 0;
            const busCount = document.getElementById('bus-count').value || 0;
            const bikeCount = document.getElementById('bike-count').value || 0;
            const truckCount = document.getElementById('truck-count').value || 0;
            const speed = document.getElementById('speed').value || 0;
            const resultDiv = document.getElementById('numeric-result');

            try {
                const res = await fetch(`${API_URL}/traffic/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        car_count: carCount, 
                        bus_count: busCount, 
                        bike_count: bikeCount, 
                        truck_count: truckCount, 
                        speed: speed,
                        user_id: user.user_id
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    showResult(resultDiv, data.prediction);
                } else {
                    resultDiv.textContent = data.error || 'Prediction failed';
                    resultDiv.classList.remove('hidden');
                    resultDiv.className = 'alert alert-High'; // Reset specifically to error state if needed
                }
            } catch (err) {
                resultDiv.textContent = 'Server connection error';
                resultDiv.classList.remove('hidden');
                resultDiv.className = 'alert alert-High';
            }
        });
    }

    // NLP Form Submit
    const nlpForm = document.getElementById('nlp-form');
    if (nlpForm) {
        nlpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const textInput = document.getElementById('text-input').value;
            const resultDiv = document.getElementById('nlp-result');

            try {
                const res = await fetch(`${API_URL}/nlp/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        text_input: textInput,
                        user_id: user.user_id
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    showResult(resultDiv, data.prediction);
                } else {
                    resultDiv.textContent = data.error || 'Analysis failed';
                    resultDiv.classList.remove('hidden');
                    resultDiv.className = 'alert alert-High';
                }
            } catch (err) {
                resultDiv.textContent = 'Server connection error';
                resultDiv.classList.remove('hidden');
                resultDiv.className = 'alert alert-High';
            }
        });
    }
});
