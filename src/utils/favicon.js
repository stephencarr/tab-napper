/**
 * Dynamic Favicon Manager
 * Changes favicon color based on scheduled items count
 * Green (0-5), Yellow (6-15), Red (16+)
 */

let currentFavicon = null;

/**
 * Create a favicon with a colored circle and optional number
 * @param {string} color - Color for the circle (green/yellow/red)
 * @param {number} count - Number to display (optional, shows if > 0)
 */
function createFavicon(color, count = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Map color names to actual colors
  const colors = {
    green: '#10b981',   // emerald-500
    yellow: '#f59e0b',  // amber-500
    red: '#ef4444'      // red-500
  };
  
  // Draw circle
  ctx.fillStyle = colors[color] || colors.green;
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add white border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw count if > 0 and <= 99
  if (count > 0 && count <= 99) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), 16, 17);
  } else if (count > 99) {
    // Show 99+ for large numbers
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('99+', 16, 17);
  }
  
  return canvas.toDataURL();
}

/**
 * Update favicon based on scheduled items count
 * @param {number} scheduledCount - Number of scheduled items
 */
export function updateFavicon(scheduledCount = 0) {
  let color;
  
  // Determine color based on count
  if (scheduledCount === 0) {
    color = 'green';   // All clear!
  } else if (scheduledCount <= 5) {
    color = 'green';   // Healthy amount
  } else if (scheduledCount <= 15) {
    color = 'yellow';  // Getting busy
  } else {
    color = 'red';     // Stacking up!
  }
  
  // Create and set the favicon
  const faviconUrl = createFavicon(color, scheduledCount);
  
  // Remove existing favicon if any
  if (currentFavicon) {
    currentFavicon.remove();
  }
  
  // Create new favicon link element
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = faviconUrl;
  
  // Add to document head
  document.head.appendChild(link);
  currentFavicon = link;
  
  console.log(`[Tab Napper] �� Favicon updated: ${color} (${scheduledCount} scheduled items)`);
}

/**
 * Get color description for current count
 * @param {number} scheduledCount 
 */
export function getFaviconColor(scheduledCount = 0) {
  if (scheduledCount === 0) return 'green';
  if (scheduledCount <= 5) return 'green';
  if (scheduledCount <= 15) return 'yellow';
  return 'red';
}

/**
 * Reset favicon to default (green with 0)
 */
export function resetFavicon() {
  updateFavicon(0);
}
