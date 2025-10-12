const createIcon = (size) => {
  const canvas = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="rgb(91, 33, 182)"/>
  
  <circle 
    cx="${size / 2}" 
    cy="${size / 2}" 
    r="${size * 0.36}" 
    stroke="white" 
    stroke-width="${size * 0.04}" 
    fill="none"
    opacity="0.9"
  />
  
  <path
    d="M ${size * 0.325} ${size * 0.325} L ${size * 0.325} ${size * 0.675} L ${size * 0.5} ${size * 0.675} C ${size * 0.6} ${size * 0.675} ${size * 0.675} ${size * 0.6} ${size * 0.675} ${size * 0.5} C ${size * 0.675} ${size * 0.4} ${size * 0.6} ${size * 0.325} ${size * 0.5} ${size * 0.325} L ${size * 0.325} ${size * 0.325} Z M ${size * 0.425} ${size * 0.425} L ${size * 0.5} ${size * 0.425} C ${size * 0.54} ${size * 0.425} ${size * 0.575} ${size * 0.46} ${size * 0.575} ${size * 0.5} C ${size * 0.575} ${size * 0.54} ${size * 0.54} ${size * 0.575} ${size * 0.5} ${size * 0.575} L ${size * 0.425} ${size * 0.575} L ${size * 0.425} ${size * 0.425} Z"
    fill="white"
    opacity="0.95"
  />
</svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
};

console.log('Professional icons created as inline SVG.');
console.log('192x192:', createIcon(192));
console.log('512x512:', createIcon(512));
