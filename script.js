let allPokemon = [];
let currentTeam = [];
let selectedMoves = {};

// --- Type weakness chart ---
const TYPE_WEAKNESSES = {
  normal:   ['fighting'],
  fire:     ['water', 'ground', 'rock'],
  water:    ['electric', 'grass'],
  electric: ['ground'],
  grass:    ['fire', 'ice', 'poison', 'flying', 'bug'],
  ice:      ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison:   ['ground', 'psychic'],
  ground:   ['water', 'grass', 'ice'],
  flying:   ['electric', 'ice', 'rock'],
  psychic:  ['bug', 'ghost', 'dark'],
  bug:      ['fire', 'flying', 'rock'],
  rock:     ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost:    ['ghost', 'dark'],
  dragon:   ['ice', 'dragon', 'fairy'],
  dark:     ['fighting', 'bug', 'fairy'],
  steel:    ['fire', 'fighting', 'ground'],
  fairy:    ['poison', 'steel'],
};

const TYPE_IMMUNITIES = {
  normal:   ['ghost'],
  electric: ['ground'],
  flying:   ['ground'],
  ghost:    ['normal', 'fighting'],
  dark:     ['psychic'],
  steel:    ['poison'],
  fairy:    ['dragon'],
};

function getWeaknesses(types) {
  const multipliers = {};
  const allTypes = Object.keys(TYPE_WEAKNESSES);
  allTypes.forEach(attacker => { multipliers[attacker] = 1; });

  types.forEach(defenderType => {
    const lower = defenderType.toLowerCase();
    (TYPE_WEAKNESSES[lower] || []).forEach(attacker => {
      multipliers[attacker] = (multipliers[attacker] || 1) * 2;
    });
    (TYPE_IMMUNITIES[lower] || []).forEach(attacker => {
      multipliers[attacker] = 0;
    });
  });

  return allTypes.filter(attacker => multipliers[attacker] >= 2).sort();
}

// Fetch JSON data
async function fetchData() {
  try {
    const response = await fetch('pokemon.json');
    const data = await response.json();
    allPokemon = data.pokemon || [];
    console.log(`Loaded ${allPokemon.length} Pokémon`);
    return allPokemon;
  } catch (error) {
    console.error("Error loading Pokémon data:", error);
    document.getElementById('pokemonGrid').innerHTML = 
      `<div class="empty">Failed to load data. Make sure pokemon.json exists.</div>`;
    return [];
  }
}

function render(pokemonList) {
  const grid = document.getElementById('pokemonGrid');
  grid.innerHTML = '';

  if (pokemonList.length === 0) {
    grid.innerHTML = `<div class="empty">No Pokémon found.</div>`;
    return;
  }

  const displayList = pokemonList.slice(0, 200);

  displayList.forEach(p => {
    const weaknesses = getWeaknesses(p.type);
    const weaknessHTML = weaknesses.length > 0
      ? weaknesses.map(w => `<span class="weakness-tag weakness-${w}">${w}</span>`).join('')
      : '<em>None</em>';

    const baseStatsHTML = p.base && p.base.HP > 0 ? `
      <div class="base-stats">
        <span>HP <strong>${p.base.HP}</strong></span>
        <span>Atk <strong>${p.base.Attack}</strong></span>
        <span>Def <strong>${p.base.Defense}</strong></span>
        <span>SpA <strong>${p.base['Sp. Attack']}</strong></span>
        <span>SpD <strong>${p.base['Sp. Defense']}</strong></span>
        <span>Spd <strong>${p.base.Speed}</strong></span>
      </div>
    ` : '<p style="color:#666; font-style:italic;">Base stats coming soon...</p>';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="${p.img}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p><strong>${p.species || 'Pokémon'}</strong></p>
          <p><strong>Region:</strong> ${p.region}</p>
          <p><strong>Type:</strong> ${p.type.join(', ')}</p>
          <div class="weaknesses">
            <strong>Weak to:</strong>
            <div class="weakness-tags">${weaknessHTML}</div>
          </div>
          <small>${p.moves.length} moves</small>
        </div>
        <div class="card-back">
          <h3>${p.name}</h3>
          <p><em>${p.description || 'No description available.'}</em></p>
          ${baseStatsHTML}
        </div>
      </div>
    `;
    card.onclick = () => showAddConfirm(p);
    grid.appendChild(card);
  });

  if (pokemonList.length > 200) {
    const note = document.createElement('div');
    note.style.gridColumn = '1 / -1';
    note.style.textAlign = 'center';
    note.style.padding = '15px';
    note.innerHTML = `<em>Showing first 200 Pokémon. Use search or filters for more.</em>`;
    grid.appendChild(note);
  }
}

// ====================== POPUP & ADD TO TEAM ======================
function showAddConfirm(pokemon) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Add to Team?</h2>
        <img src="${pokemon.img}" style="width:100px;height:100px;" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <p>Do you want to add this Pokémon to your team?</p>
        <button onclick="confirmAddToTeam()">Yes, Add</button>
        <button onclick="closeModal()">Cancel</button>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector('img').src = pokemon.img;
    modal.querySelector('h3').textContent = pokemon.name;
  }
  window.currentPokemonToAdd = pokemon;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.style.display = 'none';
}

function confirmAddToTeam() {
  const pokemon = window.currentPokemonToAdd;
  if (pokemon) {
    closeModal();
    addToTeam(pokemon);
  }
}

// ==================== TEAM FUNCTIONS ====================
function addToTeam(pokemon) {
  if (currentTeam.length >= 6) {
    alert("Team is full! Maximum 6 Pokémon.");
    return;
  }
  if (currentTeam.some(m => m.id === pokemon.id)) {
    alert("This Pokémon is already in your team!");
    return;
  }

  currentTeam.push(pokemon);
  if (!selectedMoves[pokemon.id]) {
    selectedMoves[pokemon.id] = ['', '', '', ''];
  }
  saveTeam();
  renderTeam();
  drawChart();
}

function removeFromTeam(index) {
  const removed = currentTeam[index];
  if (removed) delete selectedMoves[removed.id];
  currentTeam.splice(index, 1);
  saveTeam();
  renderTeam();
  drawChart();
}

function handleMoveChange(pokemonId, slotIndex, value) {
  if (!selectedMoves[pokemonId]) selectedMoves[pokemonId] = ['', '', '', ''];
  const currentMoves = selectedMoves[pokemonId];

  if (value !== '' && currentMoves.includes(value)) {
    alert("This move is already selected!");
    return;
  }

  selectedMoves[pokemonId][slotIndex] = value;
  saveTeam();
  renderSelectedMoves(pokemonId);
}

function renderSelectedMoves(pokemonId) {
  const displayEl = document.getElementById(`moves-display-${pokemonId}`);
  if (!displayEl) return;
  const moves = selectedMoves[pokemonId] || [];
  const chosen = moves.filter(m => m !== '');
  displayEl.innerHTML = chosen.length === 0 ? '<em>No moves selected yet.</em>' : chosen.join(', ');
}

function buildMoveDropdowns(pokemon) {
  const moves = selectedMoves[pokemon.id] || ['', '', '', ''];
  const slots = [1, 2, 3, 4];

  const dropdownsHTML = slots.map((slot, i) => {
    const optionsHTML = pokemon.moves.map(move =>
      `<option value="${move}" ${moves[i] === move ? 'selected' : ''}>${move}</option>`
    ).join('');
    return `
      <label>Move ${slot}:
        <select id="move-${pokemon.id}-${i}" onchange="handleMoveChange('${pokemon.id}', ${i}, this.value)">
          <option value="">-- Select Move --</option>
          ${optionsHTML}
        </select>
      </label>`;
  }).join('');

  return `
    <div class="move-selector">
      <strong>Select Moves (up to 4):</strong><br>
      ${dropdownsHTML}
      <div id="moves-display-${pokemon.id}" class="moves-display"></div>
    </div>
  `;
}

function renderTeam() {
  const container = document.getElementById('teamGrid');
  container.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    slot.className = 'team-slot';
    
    if (currentTeam[i]) {
      const p = currentTeam[i];
      slot.classList.add('filled');
      slot.innerHTML = `
        <img src="${p.img}" alt="${p.name}">
        <strong>${p.name}</strong><br>
        <small>${p.region}</small><br>
        ${buildMoveDropdowns(p)}
        <button onclick="removeFromTeam(${i})" style="margin-top:6px;">Remove</button>
      `;
    } else {
      slot.innerHTML = `<small>Slot ${i + 1}</small>`;
    }
    container.appendChild(slot);
  }
}

function drawChart() {
  const canvas = document.getElementById('teamChart');
  if (!canvas) return;

  const containerWidth = canvas.parentElement.clientWidth - 40;
  canvas.width = Math.min(containerWidth, 800);
  canvas.height = 300;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentTeam.length === 0) {
    ctx.fillStyle = '#161616';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Add Pokémon to see stats', canvas.width / 2, 150);
    return;
  }

  const barWidth = Math.max(35, Math.floor((canvas.width - 100) / currentTeam.length / 1.3));
  const spacing = (canvas.width - 80) / currentTeam.length;
  const maxHeight = 170;

  currentTeam.forEach((p, i) => {
    const x = 40 + i * spacing;
    const totalStats = p.base ? 
      (p.base.HP + p.base.Attack + p.base.Defense + 
       (p.base['Sp. Attack'] || 0) + (p.base['Sp. Defense'] || 0) + p.base.Speed) : 400;
    
    const height = Math.max(30, Math.min(maxHeight, (totalStats / 1200) * maxHeight));

    const gradient = ctx.createLinearGradient(x, 240 - height, x, 240);
    gradient.addColorStop(0, '#f86300');
    gradient.addColorStop(1, '#f1bd4ae7');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, 240 - height, barWidth, height);
    ctx.strokeStyle = '#ffffff33';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 240 - height, barWidth, height);

    ctx.fillStyle = '#141414';
    ctx.font = `bold ${Math.min(13, barWidth/5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(p.name.substring(0, 8), x + barWidth / 2, 265);

    ctx.font = '11px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText(totalStats, x + barWidth / 2, 280);

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '13px Arial';
    ctx.fillText(p.moves.length, x + barWidth / 2, 240 - height - 5);
  });
}

function saveTeam() {
  localStorage.setItem('pokemonTeam', JSON.stringify(currentTeam));
  localStorage.setItem('pokemonMoves', JSON.stringify(selectedMoves));
}

function loadTeam() {
  const savedTeam = localStorage.getItem('pokemonTeam');
  const savedMoves = localStorage.getItem('pokemonMoves');
  if (savedTeam) currentTeam = JSON.parse(savedTeam);
  if (savedMoves) selectedMoves = JSON.parse(savedMoves);
}

function clearTeam() {
  if (confirm("Clear entire team?")) {
    currentTeam = [];
    selectedMoves = {};
    saveTeam();
    renderTeam();
    drawChart();
  }
}

function addRandomToTeam() {
  if (currentTeam.length >= 6) {
    alert("Team is full!");
    return;
  }
  const available = allPokemon.filter(p => !currentTeam.some(m => m.id === p.id));
  if (available.length === 0) {
    alert("No more Pokémon available!");
    return;
  }

  const randomPokemon = available[Math.floor(Math.random() * available.length)];
  const shuffled = [...randomPokemon.moves].sort(() => Math.random() - 0.5);
  selectedMoves[randomPokemon.id] = shuffled.slice(0, 4);

  currentTeam.push(randomPokemon);
  saveTeam();
  renderTeam();
  drawChart();
}

function filterPokemon() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedRegion = document.getElementById('regionFilter').value;
  const selectedType = document.getElementById('typeFilter').value.toLowerCase();

  const filtered = allPokemon.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesRegion = !selectedRegion || p.region === selectedRegion;
    const matchesType = !selectedType || p.type.some(t => t.toLowerCase() === selectedType);
    return matchesSearch && matchesRegion && matchesType;
  });

  render(filtered);
}

// Init
async function init() {
  document.getElementById('pokemonGrid').innerHTML = '<div class="empty">Loading Pokémon data...</div>';
  await fetchData();
  loadTeam();
  render(allPokemon);
  renderTeam();
  drawChart();

  window.addEventListener('resize', () => {
    drawChart();
  });
}

window.onload = init;