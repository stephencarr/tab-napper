# Tab Napper

An ADHD-friendly Chrome extension that replaces your New Tab Page with a calm, uncluttered tab management and reminder system.

## ✨ Key Features

### 🧠 **ADHD-Friendly Design**
- **Calm Interface**: Minimalist design to reduce cognitive overwhelm
- **FidgetControl System**: Revolutionary two-pill interface for rapid actions
  - **Action Pill**: Stash → Remind Me → Follow Up → Review → DELETE NOW (with confirmation)
  - **When Pill**: Smart contextual timing ("In 1 hour", "This afternoon", "Tomorrow")
- **Rapid Clicking**: All controls optimized for fidgeting and quick interaction
- **Layout Stability**: Fixed button sizes prevent cursor drift
- **No Menu Diving**: Everything accessible with direct clicks
- **Trash Can Workflow**: Two-click confirmation (click → red "Confirm" → delete)

### ⏰ **Stash & Schedule**
- **Smart Time-Based Reminders**: Schedule tabs to come back at the perfect time
- **Three Action Types**: Remind Me (quick check), Follow Up (deeper work), Review (careful thought)
- **Contextual Time Suggestions**: "In 1 hour", "This afternoon", "Tomorrow 9am", etc.
- **Chrome Alarms Integration**: Persistent scheduling that survives browser restarts
- **System Notifications**: Sticky, high-priority alerts when reminders trigger
- **Auto Re-Triage**: Scheduled items automatically return to inbox

### 🎯 **Smart Tab Management**
- **Automatic Capture**: Seamlessly captures closed tabs for triage
- **Gateway Deduplication**: Simple, reliable duplicate prevention
- **Unified Card Layout**: Three-zone design (Identity, Action Block, Commitment) for visual clarity
- **Structured Organization**: Inbox → Stashed → Quick Access → Trash workflow
- **Status Indicators**: Visual cues for open tabs and previously stashed items
- **"Switch to Tab" Navigation**: When clicking an item that's already open, switches to that tab instead of opening a duplicate
- **"Show Open Only" Filter**: Toggle button to filter the list to only show items with open tabs
- **"Close All Open" Bulk Action**: Closes all tabs matching items in the current view

### 🔍 **Enhanced Omnisearch**
- **Universal Search**: Search across tabs, history, notes, and all saved items simultaneously
- **Priority-Based Results**: Inbox items → Stashed tabs → Quick access → Browser history → Trash
- **Real-Time Browser History Integration**: Searches your actual Chrome history using native APIs
- **Visual Segmentation**: Color-coded results with relevance scores and priority indicators

### 🤖 **Intelligent Suggestions**
- **Smart Pattern Analysis**: Analyzes 30 days of browsing history for patterns
- **Persistent Caching**: 1-hour cache survives browser reloads for instant loading
- **Frequency & Recency Scoring**: Sophisticated algorithm considering visit patterns
- **Cooldown Management**: Prevents re-suggesting recently unpinned items

### 🔒 **Privacy & Performance**
- **100% Local**: All data stored locally on your device
- **Lightweight Architecture**: Component-specific optimized data fetching
- **No External Dependencies**: Zero tracking, no data collection
- **Optional Encryption**: Critical data can be encrypted before storage

## 🚀 Performance Optimizations
- **Staggered Component Loading**: Reduces concurrent Chrome API calls
- **Reduced Data Fetching**: Fetches smaller chunks of data to improve performance
- **Batched Background Processing**: Spreads tab tracking load over time instead of blocking startup
- **Efficient History Handling**: Only fetches history items that match your search terms
- **Smart Caching**: Persistent cache for suggestions with intelligent invalidation
- **Real-Time Chrome Event Listeners**: Instantly updates open status when tabs open/close

## 🛠 Technical Architecture
- **Chrome Extension**: Manifest V3 compliant
- **Frontend**: React + Tailwind CSS + Lucide Icons
- **Storage**: Hybrid chrome.storage model (sync + local with intelligent caching)
- **APIs**: Direct Chrome History API integration, Chrome Tabs API for navigation

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

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests for any improvements.

---

**Built with ❤️ for ADHD brains who need their tools to work as fast as their thoughts.**
