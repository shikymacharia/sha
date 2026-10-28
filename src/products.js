// Illustrated placeholder for items that don't have a photo yet. Replace by editing the product in /admin.
const SHAPES = {
  tee: 'M215 150 L262 128 Q300 170 338 128 L385 150 L470 235 L424 280 L398 252 L398 600 L202 600 L202 252 L176 280 L130 235 Z',
  polo: 'M215 150 L262 128 L300 190 L338 128 L385 150 L470 235 L424 280 L398 252 L398 600 L202 600 L202 252 L176 280 L130 235 Z',
  hoodie: 'M205 160 Q300 70 395 160 L470 250 L430 590 L398 590 L398 610 L202 610 L202 590 L170 590 L130 250 Z',
  trousers: 'M200 130 H400 L428 640 H322 L300 300 L278 640 H172 Z',
  jacket: 'M205 150 L262 126 L300 190 L338 126 L395 150 L480 200 L492 580 L428 590 L410 330 L410 630 L190 630 L190 330 L172 590 L108 580 L120 200 Z',
}
const shade = (hex, k) => '#' + [1, 3, 5].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('')
export const art = (type, color) => {
  const id = type + color.slice(1)
  const extra = {
    polo: `<path d="M262 128 L300 190 L338 128 L322 120 L300 156 L278 120Z" fill="${shade(color, 1.35)}"/><path d="M300 190V300" stroke="${shade(color, 0.6)}" stroke-width="3"/><circle cx="300" cy="225" r="4" fill="${shade(color, 0.5)}"/><circle cx="300" cy="260" r="4" fill="${shade(color, 0.5)}"/>`,
    tee: `<path d="M262 128 Q300 170 338 128 Q300 150 262 128Z" fill="${shade(color, 0.55)}"/>`,
    hoodie: `<path d="M262 150 Q300 200 338 150 Q300 120 262 150Z" fill="${shade(color, 0.5)}"/><path d="M240 470 H360 L378 560 H222Z" fill="${shade(color, 0.8)}"/>`,
    trousers: `<rect x="200" y="130" width="200" height="26" fill="${shade(color, 1.3)}"/><path d="M300 156V300" stroke="${shade(color, 0.6)}" stroke-width="3"/>`,
    jacket: `<path d="M262 126 L300 190 L338 126 L360 210 L300 330 L240 210Z" fill="${shade(color, 1.25)}"/><path d="M300 190V630" stroke="${shade(color, 0.55)}" stroke-width="3"/>`,
  }[type]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><radialGradient id="b" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#2a2418"/><stop offset="1" stop-color="#0b0a08"/></radialGradient><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(color, 1.15)}"/><stop offset="1" stop-color="${shade(color, 0.75)}"/></linearGradient></defs><rect width="600" height="750" fill="url(#b)"/><path d="${SHAPES[type]}" fill="url(#${id})" stroke="${shade(color, 0.5)}" stroke-width="2" stroke-linejoin="round"/>${extra}</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

// Options offered per kind of clothing. Only these are shown, and each product can narrow them in /admin.
export const SIZE_SETS = { Shirts: ['S', 'M', 'L', 'XL', 'XXL'], 'Tees & Polos': ['S', 'M', 'L', 'XL', 'XXL'], 'Jackets & Hoodies': ['S', 'M', 'L', 'XL', 'XXL'], Trousers: ['30', '32', '34', '36', '38'] }

const shirt = (id, brand, colour, file, price, orig, extra = {}) => ({
  id, brand, sizes: SIZE_SETS.Shirts, name: `${brand} Shirt, ${colour}`, price, originalPrice: orig, category: 'Shirts', rating: 4.8, stock: 'In Stock', badge: '',
  description: { 'Tommy High': 'Turkish-cut long-sleeve shirt in a soft cotton blend.', 'Patched Hill': 'Classic fit long-sleeve shirt with a crisp finish.', 'Benletti Homme': 'Italian-inspired long-sleeve shirt with a refined texture.' }[brand],
  image: `/products/${file}.jpg`, hoverImage: `/products/${file}.jpg`, ...extra,
})
const other = (id, name, category, type, color, price, orig, description, extra = {}) => ({
  id, brand: 'HADAR', sizes: SIZE_SETS[category], name, price, originalPrice: orig, category, rating: 4.7, stock: 'In Stock', badge: '', description, image: art(type, color), hoverImage: art(type, color), ...extra,
})

const base = [
  shirt(1, 'Tommy High', 'Coral', 'th-coral', 2200, 2800, { badge: 'New' }),
  shirt(2, 'Tommy High', 'Aqua', 'th-aqua', 2200, 2800),
  shirt(3, 'Tommy High', 'Cornflower', 'th-cornflower', 2200, 2800, { badge: 'Popular' }),
  shirt(4, 'Tommy High', 'Dusty Rose', 'th-rose', 2200, 2800),
  shirt(5, 'Tommy High', 'White', 'th-white', 2200, 2800, { badge: 'Popular' }),
  shirt(6, 'Tommy High', 'Charcoal', 'th-charcoal', 2200, 2800),
  shirt(7, 'Tommy High', 'Midnight', 'th-midnight', 2200, 2800),
  shirt(8, 'Patched Hill', 'White', 'ph-white', 2400, 3000, { badge: 'Popular' }),
  shirt(9, 'Patched Hill', 'Black', 'ph-black', 2400, 3000),
  shirt(10, 'Patched Hill', 'Navy', 'ph-navy', 2400, 3000, { badge: 'New' }),
  shirt(11, 'Patched Hill', 'Sky Blue', 'ph-sky', 2400, 3000),
  shirt(12, 'Patched Hill', 'Burgundy', 'ph-burgundy', 2400, 3000),
  shirt(13, 'Patched Hill', 'Royal Purple', 'ph-purple', 2400, 3000),
  shirt(14, 'Benletti Homme', 'Forest Green', 'bn-forest', 2600, 3300, { badge: 'Elite' }),
  shirt(15, 'Benletti Homme', 'Navy', 'bn-navy', 2600, 3300),
  shirt(16, 'Benletti Homme', 'Peach', 'bn-peach', 2600, 3300),
  shirt(17, 'Benletti Homme', 'Lilac Stripe', 'bn-lilac-stripe', 2800, 3500, { badge: 'New' }),
  shirt(18, 'Benletti Homme', 'Ocean Blue', 'bn-ocean', 2600, 3300),
  shirt(19, 'Benletti Homme', 'Silver Grey', 'bn-silver', 2600, 3300),
  other(20, 'Heavy Crew Tee, Black', 'Tees & Polos', 'tee', '#1c1f27', 900, 1200, '240gsm cotton, a daily basic that holds its shape.'),
  other(21, 'Heavy Crew Tee, Mustard', 'Tees & Polos', 'tee', '#d4a22c', 900, 1200, '240gsm cotton in a rich mustard.'),
  other(22, 'Pique Polo, Navy', 'Tees & Polos', 'polo', '#22345c', 1500, 1900, 'Breathable pique cotton with a clean collar.', { badge: 'Popular' }),
  other(23, 'Pique Polo, White', 'Tees & Polos', 'polo', '#e9e4d8', 1500, 1900, 'Smart-casual polo for the weekend.'),
  other(24, 'Chino Trousers, Khaki', 'Trousers', 'trousers', '#b49a73', 2800, 3400, 'Stretch twill chinos with a tapered leg.'),
  other(25, 'Formal Trousers, Charcoal', 'Trousers', 'trousers', '#3b4050', 3200, 3900, 'Pressed crease, made to pair with any shirt above.'),
  other(26, 'Straight Jeans, Mid-wash', 'Trousers', 'trousers', '#35527f', 3000, 3600, 'Mid-wash denim with a straight, easy fit.', { badge: 'New' }),
  other(27, 'Bomber Jacket, Olive', 'Jackets & Hoodies', 'jacket', '#6b7a5a', 4800, 5800, 'Water-resistant shell with ribbed cuffs.', { badge: 'Elite' }),
  other(28, 'Denim Jacket, Indigo', 'Jackets & Hoodies', 'jacket', '#4b6794', 4200, 5000, 'Classic-fit denim jacket.'),
  other(29, 'Blazer, Black', 'Jackets & Hoodies', 'jacket', '#171a24', 6500, 7800, 'Half-lined tailoring for evenings and events.', { badge: 'Elite' }),
  other(30, 'Premium Hoodie, Charcoal', 'Jackets & Hoodies', 'hoodie', '#4a4d57', 2900, 3600, 'Soft heavyweight fleece with an urban finish.'),
]

// Starter stock counts; edit them in the admin dashboard.
export const defaultProducts = base.map((p) => ({ ...p, qty: p.stock === 'Low Stock' ? 4 : 20 }))
