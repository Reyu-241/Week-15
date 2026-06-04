# My Capstone Plan — Angelo

> Fill in each section. Save this file. Bring it to tomorrow's build session.

## 1. The idea (one sentence)

**My idea:**  
I will build a Pokémon Pokedex app where users can filter Pokémon by South African provinces, view their moves and weaknesses, and build a team of up to 6 Pokémon.

---

## 2. The data source

- **URL or filename:** `pokemon.json`
- **Source type:** Local data file (I'll author / provide the JSON)
- **Key required?** No
- **Sample fetch you've run in DevTools console:**

```javascript
const r = await fetch('pokemon.json');
const data = await r.json();
console.log(data.pokemon[0]); 
// Returns full record: { id, name, region, type, moves, weaknesses, ... }



## 3. The record shape (one record only)

_Fill in the field names + types of ONE record in the dataset. Every function below depends on this._

```
record = {
  id: number,
  num: string,
  name: string,
  img: string,
  type: string[],
  moves: string[],
  weaknesses: string[],
  region: string,           // South African province
  next_evolution: object[]
}
```



## 4. The function list (verbs + objects, not vague words)

// Floor
fetchData()          // get the JSON, return array of records
renderCards(items)   // build DOM cards from the array

// Tier 1
filterPokemon()      // filter by name search + region dropdown
addToTeam(pokemon)   // add Pokémon to team (max 6)
renderTeam()         // display current team of 6 slots

// Tier 2
drawChart()          // draw Canvas bar chart of moves in team

// Tier 3
saveTeam()           // save team to localStorage
loadTeam()           // load team from localStorage on startup

> Floor MUST include fetch + render. Add a function per tier you target. Use verbs + objects (`drawChart(items)`, not "show )


## 5. The wireframe — sketch + ids

> Sketch on paper, photograph, or describe in text. NAME the HTML ids your JS will select. Mark which tier each element belongs to.

```text
[ Header: Pokémon of South Africa ]

[ Controls ]
├── #searchInput          (search by name)
└── #regionFilter         (dropdown of provinces)

[ #pokemonGrid ]          ← Main grid of Pokémon cards (Floor)

[ Team Section ]
├── #teamGrid             ← 6 team slots (Tier 1)
└── #teamChart            ← Canvas bar chart (Tier 2)
```



## 6. Tier target

- [x] Floor   → fetchData() + renderCards()
- [x] Tier 1 → Search + Region Filter + Add to Team + renderTeam()
- [x] Tier 2 → Canvas bar chart (drawChart())
- [x] Tier 3 → localStorage persistence (saveTeam / loadTeam)



## Self-check before Thursday

- [ ] My data source is real and key-free (I ran fetch in the console and saw the JSON)
- [ ] The record shape above matches what the API actually returned
- [ ] Function names are verbs + objects (no "do stuff")
- [ ] Floor is the SMALLEST shippable slice (fetch + render — nothing else)
- [ ] The wireframe ids exist in section 5 and the JS in section 4 will select them
- [ ] I can describe my Floor aloud in one sentence to a peer

**XP:** 20 XP for a complete scoped plan (idea + data shape + named functions + wireframe + tier target).
