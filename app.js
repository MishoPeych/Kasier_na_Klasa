const API_URL = "https://script.google.com/macros/s/AKfycbxkKKp2JMDu4309oowQ5IvEh3w9lLMytWQdDNj61dSxucJN2TgqcvM074Va__csYodveA/exec";
let currentEvent = null;
let allChildren = [];
let allEvents = [];

console.log("APP STARTED");

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
function init() {
  console.log("INIT...");
  // Първо зареждаме всички събития за селектора
  loadAllEvents();
  // След това зареждаме последното събитие и децата
  loadLastEvent();
}

// ==================== ЗАРЕЖДАНЕ НА ДАННИ ====================
function loadLastEvent() {
  console.log("LOADING LAST EVENT...");
  fetch(API_URL + "?action=getLastEvent")
    .then(res => res.json())
    .then(response => {
      console.log("LAST EVENT RESPONSE:", response);
      if (response.success && response.data) {
        currentEvent = response.data;
        updateCurrentEventDisplay();
        // След като имаме събитие, зареждаме децата
        loadChildren();
      } else {
        document.getElementById("current-event").innerText = "Няма активни събития";
        // Все пак зареждаме децата и без събитие
        loadChildren();
      }
    })
    .catch(err => {
      console.error("FETCH ERROR:", err);
      loadChildren(); // Опитваме да заредим децата дори и при грешка
    });
}

function loadAllEvents() {
  console.log("LOADING ALL EVENTS...");
  fetch(API_URL + "?action=getAllEvents")
    .then(res => res.json())
    .then(response => {
      console.log("ALL EVENTS RESPONSE:", response);
      if (response.success) {
        allEvents = response.data;
        renderEventSelector();
      }
    })
    .catch(err => console.error("FETCH ERROR:", err));
}

function loadChildren() {
  console.log("LOADING CHILDREN...");
  fetch(API_URL + "?action=getChildren")
    .then(res => res.json())
    .then(response => {
      console.log("CHILDREN RESPONSE:", response);
      if (response.success && response.data) {
        allChildren = response.data;
        console.log("CHILDREN LOADED:", allChildren.length);
        
        // Ако има текущо събитие, попълваме сумата
        if (currentEvent && currentEvent.amount) {
          allChildren = allChildren.map(child => ({
            ...child,
            amount: currentEvent.amount,
            status: child.status || 'Неплатил'
          }));
        } else {
          // Ако няма събитие, просто показваме децата без сума
          allChildren = allChildren.map(child => ({
            ...child,
            status: child.status || 'Неплатил'
          }));
        }
        
        renderSummary();
        renderCards(); // ТРЯБВА ДА ВИКАМЕ renderCards ТУК!
      } else {
        console.error("No children data in response");
      }
    })
    .catch(err => {
      console.error("FETCH ERROR:", err);
      // Показваме грешка на потребителя
      document.getElementById("app").innerHTML = "<p style='color:red; padding:20px;'>Грешка при зареждане на данните. Проверете конзолата.</p>";
    });
}

// ==================== ВИЗУАЛИЗАЦИЯ ====================
function renderEventSelector() {
  console.log("RENDERING EVENT SELECTOR, events:", allEvents.length);
  const container = document.getElementById("event-selector");
  if (!container) {
    console.error("event-selector element not found!");
    return;
  }
  
  let html = `
    <label for="eventSelect">Избери събитие:</label>
    <div style="display: flex; gap: 5px;">
      <select id="eventSelect" onchange="changeEvent(this.value)" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #ddd;">
        <option value="">--- Избери събитие ---</option>
  `;
  
  allEvents.forEach(event => {
    const selected = currentEvent && event.name === currentEvent.name ? 'selected' : '';
    html += `<option value="${event.name}" data-amount="${event.amount}" ${selected}>${event.name} (${event.amount} лв.)</option>`;
  });
  
  html += `</select>`;
  
  // Бутон за изтриване (само ако има избрано събитие)
  if (currentEvent) {
    html += `
      <button onclick="confirmDeleteEvent()" style="background: #dc3545; color: white; border: none; border-radius: 6px; width: 40px; font-size: 18px; cursor: pointer;" title="Изтрий текущото събитие">🗑️</button>
    `;
  }
  
  html += `</div>`;
  
  html += `
    <button onclick="showAddEventForm()" style="margin-top: 10px; width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">➕ Ново събитие</button>
    <div id="addEventForm" style="display: none; margin-top: 10px; background: #f8f9fa; padding: 12px; border-radius: 8px;">
      <input type="text" id="newEventName" placeholder="Име на събитие" style="width: 100%; margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      <input type="number" id="newEventAmount" placeholder="Сума" style="width: 100%; margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      <div style="display: flex; gap: 5px;">
        <button onclick="addNewEvent()" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Запази</button>
        <button onclick="hideAddEventForm()" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Отказ</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  console.log("Event selector rendered");
}

function updateCurrentEventDisplay() {
  const element = document.getElementById("current-event");
  if (element && currentEvent) {
    element.innerHTML = `📅 Текущо събитие: <strong>${currentEvent.name}</strong> (${currentEvent.amount} лв.)`;
  } else if (element) {
    element.innerHTML = `📅 Няма избрано събитие`;
  }
}

function renderSummary() {
  const total = allChildren.reduce((sum, child) => {
    return sum + (child.status === 'Платил' ? Number(child.amount || 0) : 0);
  }, 0);
  
  const paidCount = allChildren.filter(child => child.status === 'Платил').length;
  const totalCount = allChildren.length;
  
  document.getElementById("summary").innerHTML = `
    💰 <strong>Събрани: ${total} лв.</strong> (${paidCount}/${totalCount} платили)
  `;
}

function renderCards() {
  console.log("RENDERING CARDS, children:", allChildren.length);
  const app = document.getElementById("app");
  
  if (!app) {
    console.error("app element not found!");
    return;
  }
  
  if (!allChildren || allChildren.length === 0) {
    app.innerHTML = "<p style='padding:20px; text-align:center;'>Няма заредени деца. Проверете дали Лист4 съдържа данни.</p>";
    return;
  }
  
  let html = '';
  
  allChildren.forEach(child => {
    const statusClass = child.status === "Платил" ? "paid" : "unpaid";
    const statusText = child.status === "Платил" ? "Платил" : "Неплатил";
    const amount = child.amount || (currentEvent ? currentEvent.amount : 0);
    
    html += `
      <div class="card" id="card-${child.id}">
        <h3>${child.name}</h3>
        
        <div class="amount-display">
          Сума: <strong>${amount} лв.</strong>
        </div>
        
        <div class="status-container">
          <span class="status ${statusClass}" onclick="toggleStatus(${child.id})" style="cursor: pointer;">
            ${statusText}
          </span>
        </div>
        
        <div class="note-container">
          <input 
            type="text"
            id="note-${child.id}"
            placeholder="Забележка (ако няма да плати)..."
            value="${child.note || ''}"
            onchange="updateNote(${child.id}, this.value)"
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>
        
        <button onclick="saveChild(${child.id})" class="save-btn" style="width: 100%; padding: 8px; margin-top: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">💾 Запази</button>
      </div>
    `;
  });
  
  app.innerHTML = html;
  
  // Добавяме бутон за запазване на всички най-отдолу
  app.innerHTML += `
    <div style="margin-top: 20px; margin-bottom: 30px;">
      <button onclick="saveAll()" style="background: #28a745; width: 100%; padding: 15px; font-size: 18px; color: white; border: none; border-radius: 6px; cursor: pointer;">
        💾 Запази всички промени
      </button>
    </div>
  `;
  
  console.log("Cards rendered, total cards:", allChildren.length);
}

// ==================== ДЕЙСТВИЯ ====================
function changeEvent(eventName) {
  console.log("CHANGE EVENT:", eventName);
  if (!eventName) return;
  
  const select = document.getElementById("eventSelect");
  const selectedOption = select.options[select.selectedIndex];
  const amount = selectedOption.getAttribute('data-amount');
  
  currentEvent = {
    name: eventName,
    amount: amount
  };
  
  updateCurrentEventDisplay();
  
  // Обновяваме сумите на всички деца и слагаме статус Неплатил
  allChildren = allChildren.map(child => ({
    ...child,
    amount: amount,
    status: 'Неплатил', // ВАЖНО: За ново събитие всички са неплатени
    note: '' // Изчистваме забележките
  }));
  
  renderSummary();
  renderCards();
  renderEventSelector(); // Презареждаме селектора за да покаже бутона за изтриване
}

function toggleStatus(id) {
  const child = allChildren.find(c => c.id === id);
  if (child) {
    child.status = child.status === 'Платил' ? 'Неплатил' : 'Платил';
    renderCards();
    renderSummary();
    console.log(`Toggled ${child.name} to ${child.status}`);
  }
}

function updateNote(id, note) {
  const child = allChildren.find(c => c.id === id);
  if (child) {
    child.note = note;
    console.log(`Updated note for ${child.name}: ${note}`);
  }
}

function saveChild(id) {
  const child = allChildren.find(c => c.id === id);
  if (!child) {
    alert("Детето не е намерено!");
    return;
  }
  
  if (!currentEvent) {
    if (!confirm("Няма избрано събитие. Да се запази ли без събитие?")) {
      return;
    }
  }
  
  saveToServer([child]);
}

function saveAll() {
  if (!currentEvent) {
    if (!confirm("Няма избрано събитие. Да се запазят ли данните без събитие?")) {
      return;
    }
  }
  
  saveToServer(allChildren);
}

function saveToServer(childrenToSave) {
  console.log("SAVING TO SERVER:", childrenToSave);
  
  const childrenData = childrenToSave.map(child => ({
    id: child.id,
    status: child.status,
    amount: child.amount || (currentEvent ? currentEvent.amount : 0),
    note: child.note || ''
  }));
  
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: 'saveStatuses',
      eventName: currentEvent ? currentEvent.name : 'Без събитие',
      childrenData: childrenData
    })
  })
  .then(res => res.json())
  .then(response => {
    console.log("SAVE RESPONSE:", response);
    if (response.success) {
      alert("✅ Данните са запазени!");
    } else {
      alert("❌ Грешка: " + response.message);
    }
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);
    alert("❌ Грешка при комуникация със сървъра");
  });
}

// ==================== УПРАВЛЕНИЕ НА СЪБИТИЯ ====================
function showAddEventForm() {
  document.getElementById("addEventForm").style.display = "block";
}

function hideAddEventForm() {
  document.getElementById("addEventForm").style.display = "none";
}

function addNewEvent() {
  const eventName = document.getElementById("newEventName").value.trim();
  const eventAmount = document.getElementById("newEventAmount").value;
  
  if (!eventName || !eventAmount) {
    alert("Моля, попълнете име и сума на събитието!");
    return;
  }
  
  if (isNaN(eventAmount) || Number(eventAmount) <= 0) {
    alert("Моля, въведете валидна сума (положително число)!");
    return;
  }
  
  console.log("ADDING EVENT:", { eventName, eventAmount });
  
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: 'addEvent',
      eventName: eventName,
      eventAmount: Number(eventAmount)
    })
  })
  .then(res => res.json())
  .then(response => {
    console.log("ADD EVENT RESPONSE:", response);
    if (response.success) {
      alert("✅ Събитието е добавено!");
      hideAddEventForm();
      document.getElementById("newEventName").value = "";
      document.getElementById("newEventAmount").value = "";
      loadAllEvents(); // Презареждаме списъка със събития
      
      // Автоматично избираме новото събитие
      currentEvent = {
        name: eventName,
        amount: Number(eventAmount)
      };
      
      // Обновяваме сумите на децата
      allChildren = allChildren.map(child => ({
        ...child,
        amount: Number(eventAmount),
        status: 'Неплатил',
        note: ''
      }));
      
      updateCurrentEventDisplay();
      renderSummary();
      renderCards();
    } else {
      alert("❌ Грешка: " + response.message);
    }
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);
    alert("❌ Грешка при комуникация със сървъра");
  });
}

// ==================== ИЗТРИВАНЕ НА СЪБИТИЕ ====================
function confirmDeleteEvent() {
  if (!currentEvent) return;
  
  if (confirm(`Сигурни ли сте, че искате да изтриете "${currentEvent.name}"?`)) {
    deleteEvent(currentEvent.name);
  }
}

function deleteEvent(eventName) {
  console.log("DELETING EVENT:", eventName);
  
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: 'deleteEvent',
      eventName: eventName
    })
  })
  .then(res => res.json())
  .then(response => {
    console.log("DELETE RESPONSE:", response);
    if (response.success) {
      alert("✅ Събитието е изтрито!");
      
      // Изчистваме текущото събитие
      currentEvent = null;
      document.getElementById("current-event").innerHTML = "📅 Няма избрано събитие";
      
      // Презареждаме списъка със събития
      loadAllEvents();
      
      // Презареждаме децата (без сума)
      loadChildren();
    } else {
      alert("❌ Грешка: " + response.message);
    }
  })
  .catch(err => {
    console.error("FETCH ERROR:", err);
    alert("❌ Грешка при комуникация със сървъра");
  });
}

// ==================== СТАРТ ====================
// Стартираме приложението, когато DOM е зареден
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM LOADED, creating elements...");
  
  // Добавяме допълнителни HTML елементи
  const container = document.querySelector('.container');
  
  if (!container) {
    console.error("Container not found!");
    return;
  }
  
  // Проверяваме дали елементите вече съществуват
  if (!document.getElementById('event-selector')) {
    const eventSelectorDiv = document.createElement('div');
    eventSelectorDiv.id = 'event-selector';
    eventSelectorDiv.className = 'event-selector';
    container.insertBefore(eventSelectorDiv, document.getElementById('summary'));
  }
  
  if (!document.getElementById('current-event')) {
    const currentEventDiv = document.createElement('div');
    currentEventDiv.id = 'current-event';
    currentEventDiv.className = 'current-event';
    currentEventDiv.innerHTML = '📅 Зареждане...';
    container.insertBefore(currentEventDiv, document.getElementById('summary'));
  }
  
  // Стартираме приложението
  init();
});