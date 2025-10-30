/**
 * Dynamic Favicon Manager
 * Changes favicon color based on scheduled items count
 * Green (0-5), Yellow (6-15), Red (16-99), Fire (100+) 🔥
 */

let currentFavicon = null;

/**
 * Create a favicon with an emoji (for the fire easter egg)
 * @param {string} emoji - Emoji to display
 */
function createEmojiFavicon(emoji) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  // Draw emoji
  ctx.font = '28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 16, 18);
  
  return canvas.toDataURL();
}

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
  } else if (count > 99 && count < 100) {
    // Show 99+ for 99 < count < 100
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('99+', 16, 17);
  }
  // Note: 100+ will use the fire emoji instead
  
  return canvas.toDataURL();
}

/**
 * Update favicon based on scheduled items count
 * @param {number} scheduledCount - Number of scheduled items
 */
export function updateFavicon(scheduledCount = 0) {
  let faviconUrl;
  
  // 🔥 EASTER EGG: Fire emoji for 100+ items! 🔥
  if (scheduledCount >= 100) {
    faviconUrl = createEmojiFavicon('🔥');
    console.log(`[Tab Napper] 🔥🔥🔥 EVERYTHING IS ON FIRE! ${scheduledCount} scheduled items! 🔥🔥🔥`);
  } else {
    // Regular color-based favicon
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
    
    faviconUrl = createFavicon(color, scheduledCount);
    console.log(`[Tab Napper] 🎨 Favicon updated: ${color} (${scheduledCount} scheduled items)`);
  }
  
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
}

/**
 * Get color/type description for current count
 * @param {number} scheduledCount 
 */
export function getFaviconColor(scheduledCount = 0) {
  if (scheduledCount >= 100) return 'fire'; // Easter egg! 🔥
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
