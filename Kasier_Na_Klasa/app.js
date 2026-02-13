const API_URL = "https://script.google.com/macros/s/AKfycbwxMD72v-_p_EWSxWRfE_fGGQoDesrpYdLPN_uTTt0RfpEHgxw7ARpj-yM8V7AUD74MYA/exec";
//const API_URL = "https://script.google.com/macros/s/AKfycbwxMD72v-_p_EWSxWRfE_fGGQoDesrpYdLPN_uTTt0RfpEHgxw7ARpj-yM8V7AUD74MYA/exec";


fetch(API_URL)
  .then(res => res.json())
  .then(data => {
    renderSummary(data);
    renderCards(data);
  });

function renderSummary(data) {
  const total = data
    .filter(c => c.Статус === "Платено")
    .reduce((sum, c) => sum + Number(c.Сума), 0);

  document.getElementById("summary").innerHTML =
    `💰 Общо събрани пари: <strong>${total} лв.</strong>`;
}

function renderCards(data) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  data.forEach(child => {
    app.innerHTML += `
      <div class="card">
        <h3>${child.Име}</h3>
        <p>Сума: ${child.Сума || 0} лв.</p>
        <p class="status ${child.Статус}">${child.Статус}</p>
      </div>
    `;
  });
}

