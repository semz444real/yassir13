// Example data for player's inventory and drop items
let playerInventory = [
    { id: 1, name: "Phone", image: "https://via.placeholder.com/50", quantity: 10, weight: 0.7, description: "A modern smartphone." },
    { id: 2, name: "Radio", image: "https://via.placeholder.com/50", quantity: 5, weight: 2.0, description: "A handheld radio device." },
    { id: 3, name: "Walther P99", image: "https://via.placeholder.com/50", quantity: 3, weight: 1.0, description: "A semi-automatic pistol." },
];

let dropInventory = [];

// Total slots per inventory (player and drop)
const totalSlots = 20;

// Save State - Persist inventory state
function saveState() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('dropInventory', JSON.stringify(dropInventory));
}

function loadState() {
    const savedPlayerInventory = localStorage.getItem('playerInventory');
    const savedDropInventory = localStorage.getItem('dropInventory');

    if (savedPlayerInventory) {
        playerInventory = JSON.parse(savedPlayerInventory);
    }

    if (savedDropInventory) {
        dropInventory = JSON.parse(savedDropInventory);
    }
}

// Load initial state
loadState();

// Function to render inventory
function renderInventory(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous items

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('inventory-item');
        itemElement.setAttribute('draggable', true); // Enable drag
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
            <p>x${item.quantity}</p>
        `;

        // Tooltip for item description
        itemElement.setAttribute('title', `${item.name}\nWeight: ${item.weight}\n${item.description}`);

        // Drag event listeners
        itemElement.addEventListener('dragstart', (e) => handleDragStart(e, item));
        itemElement.addEventListener('dragend', handleDragEnd);

        // Swipe event listeners
        itemElement.addEventListener('touchstart', handleSwipeStart, false);
        itemElement.addEventListener('touchmove', handleSwipeMove, false);
        itemElement.addEventListener('touchend', (e) => handleSwipeEnd(e, item));

        container.appendChild(itemElement);
    });

    // Render empty slots
    const emptySlots = totalSlots - items.length;
    for (let i = 0; i < emptySlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('inventory-slot');
        slotElement.addEventListener('dragover', handleDragOver);
        slotElement.addEventListener('drop', (e) => handleDrop(e, containerId));
        container.appendChild(slotElement);
    }

    // Update the inventory capacity bar
    updateInventoryCapacity();
}

// Update inventory capacity
function updateInventoryCapacity() {
    const totalWeight = playerInventory.reduce((total, item) => total + (item.weight * item.quantity), 0);
    const percentageFilled = (totalWeight / 120) * 100;

    // Update the capacity text and progress bar width
    document.querySelector('.capacity').textContent = `${totalWeight.toFixed(2)}/120.00`;
    document.querySelector('.progress-bar-fill').style.width = `${percentageFilled}%`;
}

// Drag-and-Drop Handlers
let draggedItem = null;

function handleDragStart(e, item) {
    draggedItem = item;
    setTimeout(() => e.target.classList.add('hidden'), 0); // Hide the element being dragged
}

function handleDragEnd(e) {
    e.target.classList.remove('hidden'); // Show the element after drag ends
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Allow drop
}

function handleDrop(e, containerId) {
    if (!draggedItem) return;

    const inventoryType = containerId === 'player-inventory' ? playerInventory : dropInventory;

    // Move item to new inventory
    inventoryType.push(draggedItem);

    // Remove item from original inventory
    if (containerId === 'drop-inventory') {
        playerInventory.splice(playerInventory.indexOf(draggedItem), 1);
    } else {
        dropInventory.splice(dropInventory.indexOf(draggedItem), 1);
    }

    // Re-render both inventories
    renderInventory(playerInventory, 'player-inventory');
    renderInventory(dropInventory, 'drop-inventory');

    // Save the state after each update
    saveState();
}

// Amount Management
function handleAmountAction(action, item) {
    const amount = prompt(`Enter amount to ${action}:`, item.quantity);
    if (amount && amount > 0 && amount <= item.quantity) {
        if (action === 'use') {
            item.quantity -= amount;
            console.log(`Used ${amount} ${item.name}`);
        } else if (action === 'give') {
            item.quantity -= amount;
            console.log(`Gave ${amount} ${item.name}`);
        }
        
        // Remove item if quantity reaches zero
        if (item.quantity === 0) {
            const index = playerInventory.indexOf(item);
            playerInventory.splice(index, 1);
        }

        // Re-render inventory and update capacity
        renderInventory(playerInventory, 'player-inventory');
        updateInventoryCapacity();

        // Save the state
        saveState();
    }
}

// Swipe Gesture Handlers
let swipeStartX = null;
let swipeStartY = null;

function handleSwipeStart(e) {
    const touch = e.touches[0];
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
}

function handleSwipeMove(e) {
    if (!swipeStartX || !swipeStartY) return;

    const touch = e.touches[0];
    const swipeEndX = touch.clientX;
    const swipeEndY = touch.clientY;

    const diffX = swipeStartX - swipeEndX;
    const diffY = swipeStartY - swipeEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault(); // Prevent vertical scrolling on horizontal swipe
    }
}

function handleSwipeEnd(e, item) {
    if (!swipeStartX || !swipeStartY) return;

    const touch = e.changedTouches[0];
    const diffX = swipeStartX - touch.clientX;

    // Swipe action threshold
    if (Math.abs(diffX) > 50) {
        openConfirmModal('swipe', item);
    }

    // Reset swipe start coordinates
    swipeStartX = null;
    swipeStartY = null;
}

// Confirmation Modal for Swipe
function openConfirmModal(action, item) {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'block';
    document.getElementById('modal-action').textContent = `Confirm ${action} for ${item.name}`;

    document.getElementById('confirm-button').onclick = () => {
        if (action === 'swipe') {
            dropInventory.push(item);
            playerInventory.splice(playerInventory.indexOf(item), 1);

            // Re-render inventories
            renderInventory(playerInventory, 'player-inventory');
            renderInventory(dropInventory, 'drop-inventory');
        }
        closeConfirmModal();
        saveState();
    };

    document.getElementById('cancel-button').onclick = closeConfirmModal;
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

// Render initial inventories
renderInventory(playerInventory, 'player-inventory');
renderInventory(dropInventory, 'drop-inventory');

// Event listeners for modal actions
document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.getAttribute('data-option');
        if (action === 'use' && draggedItem) {
            handleAmountAction('use', draggedItem);
        } else if (action === 'give' && draggedItem) {
            handleAmountAction('give', draggedItem);
        }
    });
});
