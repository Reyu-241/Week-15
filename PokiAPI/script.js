let allPokemon = [];
let currentTeam = [];
// selectedMoves[pokemonId] = [move1, move2, move3, move4]
let selectedMoves = {};

// --- Type weakness chart ---
// For each defending type, lists which attacking types deal 2x damage
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

// Types that are immune (0x) to certain attackers — used to cancel out weaknesses
const TYPE_IMMUNITIES = {
  normal:   ['ghost'],
  electric: ['ground'],  // ground is also a weakness for others, but electric is immune to ground
  flying:   ['ground'],
  ghost:    ['normal', 'fighting'],
  dark:     ['psychic'],
  steel:    ['poison'],
  fairy:    ['dragon'],
  ground:   [],
  // (only listing types that have immunities relevant here)
};

/**
 * Given an array of one or two type strings, returns a sorted array of
 * weakness type strings (net 2x or 4x, after cancellations).
 */
function getWeaknesses(types) {
  // Count multipliers: start at 1x for every attacking type
  const multipliers = {};
  const allTypes = Object.keys(TYPE_WEAKNESSES);

  allTypes.forEach(attacker => { multipliers[attacker] = 1; });

  types.forEach(defenderType => {
    const lower = defenderType.toLowerCase();
    // Apply 2x weaknesses
    (TYPE_WEAKNESSES[lower] || []).forEach(attacker => {
      multipliers[attacker] = (multipliers[attacker] || 1) * 2;
    });
    // Apply 0x immunities (cancel everything)
    (TYPE_IMMUNITIES[lower] || []).forEach(attacker => {
      multipliers[attacker] = 0;
    });
  });

  // Return attackers that deal net super-effective damage
  return allTypes.filter(attacker => multipliers[attacker] >= 2).sort();
}

// Fetch JSON data
async function fetchData() {
  try {
    const response = await fetch('pokemon.json');
    const data = await response.json();
    allPokemon = data.pokemon || [];
    return allPokemon;
  } catch (error) {
    console.error("Error loading Pokémon data:", error);
    document.getElementById('pokemonGrid').innerHTML =
      `<div class="empty">Failed to load data. Make sure pokemon.json is in the same folder.</div>`;
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

  pokemonList.forEach(p => {
    const weaknesses = getWeaknesses(p.type);
    const weaknessHTML = weaknesses.length > 0
      ? weaknesses.map(w => `<span class="weakness-tag weakness-${w}">${w}</span>`).join('')
      : '<em>None</em>';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p><strong>Region:</strong> ${p.region}</p>
      <p><strong>Type:</strong> ${p.type.join(', ')}</p>
      <div class="weaknesses">
        <strong>Weak to:</strong>
        <div class="weakness-tags">${weaknessHTML}</div>
      </div>
      <small>${p.moves.length} moves</small>
    `;
    card.onclick = () => addToTeam(p);
    grid.appendChild(card);
  });
}

function filterPokemon() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedRegion = document.getElementById('regionFilter').value;
  const selectedType = document.getElementById('typeFilter').value.toLowerCase();  // ← NEW

  const filtered = allPokemon.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesRegion = !selectedRegion || p.region === selectedRegion;
    const matchesType = !selectedType ||                                            // ← NEW
      p.type.some(t => t.toLowerCase() === selectedType);                          // ← NEW
    return matchesSearch && matchesRegion && matchesType;                           // ← NEW
  });

  render(filtered);
}

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
  if (removed) {
    delete selectedMoves[removed.id];
  }
  currentTeam.splice(index, 1);
  saveTeam();
  renderTeam();
  drawChart();
}

function handleMoveChange(pokemonId, slotIndex, value) {
  if (!selectedMoves[pokemonId]) {
    selectedMoves[pokemonId] = ['', '', '', ''];
  }

  const currentMoves = selectedMoves[pokemonId];
  if (value !== '' && currentMoves.includes(value)) {
    alert("This move is already selected for this Pokémon!");
    const dropdownId = `move-${pokemonId}-${slotIndex}`;
    document.getElementById(dropdownId).value = currentMoves[slotIndex];
    return;
  }

  selectedMoves[pokemonId][slotIndex] = value;
  saveTeam();
  renderSelectedMoves(pokemonId);
}

function renderSelectedMoves(pokemonId) {
  const displayEl = document.getElementById(`moves-display-${pokemonId}`);
  if (!displayEl) return;

  const moves = selectedMoves[pokemonId] || ['', '', '', ''];
  const chosen = moves.filter(m => m !== '');

  displayEl.innerHTML = chosen.length === 0
    ? '<em>No moves selected yet.</em>'
    : chosen.map(m => `<span>${m}</span>`).join(', ');
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
      </label>
    `;
  }).join('');

  return `
    <div class="move-selector">
      <strong>Select Moves (up to 4):</strong><br>
      ${dropdownsHTML}
      <div id="moves-display-${pokemon.id}" class="moves-display">
        ${moves.filter(m => m !== '').length === 0
          ? '<em>No moves selected yet.</em>'
          : moves.filter(m => m !== '').map(m => `<span>${m}</span>`).join(', ')
        }
      </div>
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
        <img src="${p.img}" style="width:70px; height:70px;" alt="${p.name}">
        <strong>${p.name}</strong><br>
        <small>${p.region}</small><br>
        ${buildMoveDropdowns(p)}
        <button onclick="removeFromTeam(${i})" style="margin-top:6px; font-size:12px;">Remove</button>
      `;
    } else {
      slot.innerHTML = `<small>Slot ${i + 1}</small>`;
    }
    container.appendChild(slot);
  }
}

function drawChart() {
  const canvas = document.getElementById('teamChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentTeam.length === 0) {
    ctx.fillStyle = '#161616';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Add Pokémon to your team to see stats', canvas.width / 2, 150);
    return;
  }

  const barWidth = 70;
  const spacing = 100;
  const maxMoves = Math.max(...currentTeam.map(p => p.moves.length));

  currentTeam.forEach((p, i) => {
    const height = (p.moves.length / maxMoves) * 180;
    const x = 80 + i * spacing;

    const gradient = ctx.createLinearGradient(x, 240 - height, x, 240);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, 'yellow');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 240 - height, barWidth, height);

    ctx.fillStyle = '#1f1e1e';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(p.name.substring(0, 9), x + barWidth / 2, 275);
    ctx.fillText(p.moves.length, x + barWidth / 2, 240 - height - 5);
  });

  ctx.fillStyle = '#161616';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Number of Moves in Team', canvas.width / 2, 320);
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
  if (confirm("Clear your entire team?")) {
    currentTeam = [];
    selectedMoves = {};
    saveTeam();
    renderTeam();
    drawChart();
  }
}

async function init() {
  document.getElementById('pokemonGrid').innerHTML = '<div class="empty">Loading Pokémon data...</div>';
  await fetchData();
  loadTeam();
  render(allPokemon);
  renderTeam();
  drawChart();
}

window.onload = init;

function addRandomToTeam() {
  if (currentTeam.length >= 6) {
    alert("Team is full! Maximum 6 Pokémon.");
    return;
  }

  // Filter out Pokémon already on the team
  const available = allPokemon.filter(p => !currentTeam.some(m => m.id === p.id));

  if (available.length === 0) {
    alert("All available Pokémon are already on your team!");
    return;
  }

  // Pick a random Pokémon
  const randomPokemon = available[Math.floor(Math.random() * available.length)];

  // Assign up to 4 random moves (no duplicates)
  const shuffledMoves = [...randomPokemon.moves].sort(() => Math.random() - 0.5);
  const chosenMoves = shuffledMoves.slice(0, 4);

  // Pad to 4 slots with empty strings if fewer than 4 moves exist
  while (chosenMoves.length < 4) chosenMoves.push('');

  currentTeam.push(randomPokemon);
  selectedMoves[randomPokemon.id] = chosenMoves;

  saveTeam();
  renderTeam();
  drawChart();
}