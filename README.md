# Tab Napper

An ADHD-friendly Chrome extension that replaces your New Tab Page with a calm, uncluttered tab management and reminder system featuring stash & schedule, system notifications, and intelligent suggestions.

## ✨ Key Features

### ⏰ **Stash & Schedule**
- **Smart Time-Based Reminders**: Schedule tabs to come back at the perfect time
- **Three Action Types**: Remind Me (quick check), Follow Up (deeper work), Review (careful thought)
- **Contextual Time Suggestions**: "In 1 hour", "This afternoon", "Tomorrow 9am", etc.
- **Chrome Alarms Integration**: Persistent scheduling that survives browser restarts
- **System Notifications**: Sticky, high-priority alerts when reminders trigger
- **Auto Re-Triage**: Scheduled items automatically return to inbox
- **Visual Indicators**: Clock icons and formatted times on stashed cards
- **Alarm Management**: Clear alarms automatically when items are trashed

### 🔍 **Enhanced Omnisearch**
- **Universal Search**: Search across tabs, history, notes, and all saved items simultaneously
- **Priority-Based Results**: Inbox items → Stashed tabs → Quick access → Browser history → Trash
- **Real-Time Browser History Integration**: Searches your actual Chrome history using native APIs
- **Visual Segmentation**: Color-coded results with relevance scores and priority indicators
- **Instant Focus**: Auto-focused search input for immediate productivity
- **Click-to-Open**: Search results open directly in new tabs
- **Unified List Design**: Consistent styling across all search and tab views

### 🧠 **ADHD-Friendly Design**
- **Calm Interface**: Minimalist design to reduce cognitive overwhelm
- **FidgetControl System**: Revolutionary two-pill interface for rapid actions
  - **Action Pill**: Stash → Remind Me → Follow Up → Review → DELETE NOW (with confirmation)
  - **When Pill**: Smart contextual timing ("In 1 hour", "This afternoon", "Tomorrow")
- **Rapid Clicking**: All controls optimized for fidgeting and quick interaction
- **Layout Stability**: Fixed button sizes prevent cursor drift
- **No Menu Diving**: Everything accessible with direct clicks
- **Trash Can Workflow**: Two-click confirmation (click → red "Confirm" → delete)

### 🎯 **Smart Tab Management**
- **Automatic Capture**: Seamlessly captures closed tabs for triage
- **Gateway Deduplication**: Simple, reliable duplicate prevention
- **Unified Card Layout**: Three-zone design (Identity, Action Block, Commitment)
- **Structured Organization**: Inbox → Stashed → Quick Access → Trash workflow
- **Status Indicators**: Visual cues for open tabs and previously stashed items
- **Item Counts**: Live counts for all tab buckets in sidebar navigation

### 🤖 **Intelligent Suggestions**
- **Smart Pattern Analysis**: Analyzes 30 days of browsing history for patterns
- **Persistent Caching**: 1-hour cache survives browser reloads for instant loading
- **Frequency & Recency Scoring**: Sophisticated algorithm considering visit patterns
- **Cooldown Management**: Prevents re-suggesting recently unpinned items
- **Performance Optimized**: Lightweight history fetching, no browser stalling

### 🛠️ **Developer Tools**
- **Dev Mode Toggle**: Ctrl+Shift+D easter egg activates comprehensive debugging panel
- **Live Console Capture**: Real-time log interception for Tab Napper messages
- **Test Notifications**: Verify system notification permissions and display
- **Test Alarms**: 10-second test alarm to validate scheduling system
- **Trigger All Alarms**: Instantly fire all scheduled alarms for testing
- **Flush All Stashed**: Clear all alarms and move items to inbox (with confirmation)
- **Toast Feedback**: Visual confirmation for all dev actions
- **State Inspector**: Query and examine extension state in real-time

### 🔒 **Privacy & Performance**
- **100% Local**: All data stored locally on your device
- **Lightweight Architecture**: Component-specific optimized data fetching
- **Chrome API Integration**: Direct use of native browser APIs for maximum efficiency
- **No External Dependencies**: Zero tracking, no data collection
- **Optional Encryption**: Critical data can be encrypted before storage
- **Background Worker**: Monitors tab lifecycle even when Tab Napper is closed

## 🚀 Performance Optimizations

### **Efficient History Handling**
- **Search-Driven**: Only fetches history items that match your search terms
- **Component-Specific**: Each component gets exactly what it needs
- **Targeted Time Windows**: 7 days for recent items, 30 days for suggestions, 1 year for search
- **Smart Caching**: Persistent cache for suggestions with intelligent invalidation

### **Responsive Experience**
- **Instant Search**: No pre-loading of massive datasets
- **Auto-Focus**: Search input gains focus immediately on page load
- **ESC Clearing**: Quick keyboard shortcut to clear searches
- **Progressive Loading**: Components load independently without blocking
- **Reactive Updates**: UI automatically refreshes when alarms trigger

## 🎨 User Experience

### **Visual Hierarchy**
- **Priority Ordering**: Most important items appear first in all contexts
- **Color Coding**: Different sources have distinct visual identities
- **Relevance Scores**: Transparency in search ranking with visible scores
- **Status Badges**: Clear indicators for priority levels and item types

### **Interaction Design**
- **Click-to-Action**: URLs open in new tabs, buttons provide immediate feedback
- **Contextual Controls**: Actions adapt to item type and current state
- **Keyboard Shortcuts**: ESC to clear, Enter to search, intuitive navigation
- **Responsive Layout**: Adapts beautifully to different screen sizes

## 🛠 Technical Architecture

### **Modern Stack**
- **Chrome Extension**: Manifest V3 compliant
- **Frontend**: React + Tailwind CSS + Lucide Icons
- **Storage**: Hybrid chrome.storage model (sync + local with intelligent caching)
- **APIs**: Direct Chrome History API integration, Chrome Tabs API for navigation

### **Performance Features**
- **Lightweight Functions**: Each component uses optimized data fetching
- **Intelligent Caching**: Memory + persistent storage with automatic invalidation
- **Debounced Search**: Smooth search experience with 300ms debouncing
- **Component Isolation**: Independent loading prevents cascade failures

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stephencarr/tab-napper.git
   cd tab-napper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome Extensions (chrome://extensions/)
   - Enable Developer Mode
   - Click "Load unpacked" and select the `dist` folder

## 🔧 Development

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview

# Development with file watching
npm run dev
```

### **Debug Tools**
```javascript
// Test search functionality
debugChromeHistory()
debugTabNapperHistory()
debugHistorySearch('github')

// Check suggestion cache
getCacheInfo()
clearSuggestionsCache()

// Test enhanced omnisearch
testEnhancedOmnisearch()
testBrowserHistoryConnection()
```

## 📋 Recent Updates (v0.5.1)

### **🔍 Enhanced Omnisearch**
- Universal search across all data sources with browser history integration
- Priority-based result segmentation with visual hierarchy
- Instant auto-focus and ESC key clearing
- Click-to-open functionality for all search results

### **⚡ Performance Revolution**
- Lightweight, component-specific history fetching
- Persistent caching for SmartSuggestions (1-hour duration)
- Eliminated heavy pre-fetching that was causing browser stalls
- Chrome API optimization for maximum efficiency

### **🎯 Gateway Deduplication**
- Replaced complex storage-level deduplication with simple gateway approach
- Reliable duplicate prevention at tab capture time
- Cleaner, more maintainable codebase

### **🔧 Technical Improvements**
- Enhanced error handling for Chrome History API permissions
- Comprehensive logging for debugging and optimization
- Smart cache invalidation on user actions (pin/unpin)
- Debug tools for testing and troubleshooting

## 🎯 Design Principles

### **ADHD-Optimized**
- **Cognitive Load Reduction**: Minimal visual complexity, clear information hierarchy
- **Rapid Interaction**: Fidget-friendly controls, no menu diving required
- **Predictable Layout**: Consistent positioning prevents cognitive overhead
- **Contextual Intelligence**: Smart defaults based on time and usage patterns

### **Performance-First**
- **Lightweight Operations**: Only fetch data when needed, cache intelligently
- **Progressive Enhancement**: Core functionality works even if advanced features fail
- **Graceful Degradation**: Fallbacks for when browser APIs are unavailable
- **Responsive Design**: Fast loading, smooth interactions, minimal resource usage

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests for any improvements.

---

**Built with ❤️ for ADHD brains who need their tools to work as fast as their thoughts.**