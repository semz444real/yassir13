// Variabel global untuk inventaris (mulai dengan inventaris kosong)
let playerInventory = [];
let dropInventory = [];
const totalSlots = 20;

// Fungsi untuk menyimpan state ke localStorage
function saveState() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('dropInventory', JSON.stringify(dropInventory));
}

// Fungsi untuk memuat state dari localStorage
function loadState() {
    const savedPlayerInventory = localStorage.getItem('playerInventory');
    const savedDropInventory = localStorage.getItem('dropInventory');

    if (savedPlayerInventory) playerInventory = JSON.parse(savedPlayerInventory);
    if (savedDropInventory) dropInventory = JSON.parse(savedDropInventory);
}

// Render inventaris
function renderInventory(items, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Kosongkan kontainer

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('inventory-item');
        itemElement.setAttribute('draggable', true);
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <p>${item.name}</p>
            <p>x${item.quantity}</p>
        `;

        // Event drag
        itemElement.addEventListener('dragstart', (e) => handleDragStart(e, item, containerId));
        itemElement.addEventListener('dragend', handleDragEnd);

        container.appendChild(itemElement);
    });

    // Tambahkan slot kosong
    const emptySlots = totalSlots - items.length;
    for (let i = 0; i < emptySlots; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('inventory-slot');
        slotElement.addEventListener('dragover', handleDragOver);
        slotElement.addEventListener('drop', (e) => handleDrop(e, containerId));
        container.appendChild(slotElement);
    }

    updateInventoryCapacity();
}

// Update kapasitas inventaris
function updateInventoryCapacity() {
    const totalWeight = playerInventory.reduce((total, item) => total + (item.weight * item.quantity), 0);
    const percentageFilled = (totalWeight / 120) * 100;

    // Update kapasitas dan progress bar
    document.querySelector('.capacity').textContent = `${totalWeight.toFixed(2)}/120.00`;
    document.querySelector('.progress-bar-fill').style.width = `${percentageFilled}%`;
}

// Variabel untuk item yang sedang di-drag
let draggedItem = null;
let originalContainerId = null;

// Fungsi drag-and-drop
function handleDragStart(e, item, containerId) {
    draggedItem = item;
    originalContainerId = containerId;
    setTimeout(() => e.target.classList.add('hidden'), 0); // Sembunyikan item saat di-drag
}

function handleDragEnd(e) {
    e.target.classList.remove('hidden'); // Tampilkan item kembali setelah di-drop
    draggedItem = null;
    originalContainerId = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Izinkan item di-drop
}

function handleDrop(e, targetContainerId) {
    if (!draggedItem || !originalContainerId) return;

    // Tentukan inventaris asal dan tujuan
    const sourceInventory = originalContainerId === 'player-inventory' ? playerInventory : dropInventory;
    const targetInventory = targetContainerId === 'player-inventory' ? playerInventory : dropInventory;

    // Pastikan item tidak diduplikasi dengan memindahkannya secara benar
    const itemIndex = sourceInventory.indexOf(draggedItem);
    if (itemIndex > -1) {
        // Pindahkan item ke inventaris tujuan
        targetInventory.push(draggedItem);

        // Hapus item dari inventaris asal
        sourceInventory.splice(itemIndex, 1);

        // Kirim informasi ke server SAMP tentang pemindahan item dan posisinya
        const playerPosition = getPlayerPosition(); // Fungsi untuk mendapatkan posisi pemain
        samp.callRemote("OnPlayerDropItem", draggedItem.id, playerPosition.x, playerPosition.y, playerPosition.z);

        // Render ulang kedua inventaris
        renderInventory(playerInventory, 'player-inventory');
        renderInventory(dropInventory, 'drop-inventory');

        // Simpan state
        saveState();
    }
}

// Fungsi mock untuk mendapatkan posisi pemain (ganti ini dengan cara mendapatkan posisi dari game)
function getPlayerPosition() {
    return { x: 1000.0, y: 2000.0, z: 30.0 }; // Contoh posisi
}

// Fungsi untuk menangani tombol aksi
document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.getAttribute('data-option');
        if (action === 'use' && draggedItem) {
            // Kirim perintah ke server untuk menggunakan item
            samp.callRemote("OnPlayerUseItem", draggedItem.id);

            // Logika untuk menggunakan item di client-side (opsional)
            alert(`Menggunakan ${draggedItem.name}`);
        } else if (action === 'give' && draggedItem) {
            // Kirim perintah ke server untuk memberi item
            samp.callRemote("OnPlayerGiveItem", draggedItem.id);

            // Logika untuk memberi item di client-side (opsional)
            alert(`Memberi ${draggedItem.name}`);
        } else if (action === 'close') {
            // Menutup inventaris
            document.querySelector('.inventory-container').style.display = 'none';
        }
    });
});

// Client-Side Callback untuk menerima informasi item yang dijatuhkan dari server
samp.on("DisplayDroppedItem", (itemid, x, y, z) => {
    // Tambahkan item ke dropInventory
    dropInventory.push({ id: itemid, name: "Item Name", quantity: 1, image: "https://via.placeholder.com/50", weight: 1.0 });
    
    // Render ulang drop panel dengan item yang baru diterima dari server
    renderInventory(dropInventory, 'drop-inventory');

    // Notifikasi tentang item yang dijatuhkan
    alert(`Item ${itemid} ditemukan di posisi (${x}, ${y}, ${z})`);
});

// Muat state saat halaman dimuat
loadState();

// Render awal inventaris dengan data kosong
renderInventory(playerInventory, 'player-inventory');
renderInventory(dropInventory, 'drop-inventory');
